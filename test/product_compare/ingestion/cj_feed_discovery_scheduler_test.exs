defmodule ProductCompare.Ingestion.CJFeedDiscoverySchedulerTest do
  use ExUnit.Case, async: true

  import ExUnit.CaptureLog

  alias ProductCompare.Ingestion.CJFeedDiscoveryScheduler

  test "calls the runner once after the initial delay with normalized discovery options" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})
      {:ok, report()}
    end

    pid =
      start_supervised!(
        {CJFeedDiscoveryScheduler,
         [
           advertiser_country: "CA",
           cursor: 40,
           initial_delay_ms: 0,
           interval_ms: 1_000,
           limit: 10,
           pages: 2,
           runner: runner
         ]}
      )

    assert_receive {:run, opts}
    assert opts == [advertiser_country: "CA", limit: 10, pages: 2, cursor: 40]
    refute_receive {:run, _opts}, 50

    GenServer.stop(pid)
  end

  test "prefers an enqueue callback so scheduled work does not execute discovery inline" do
    parent = self()

    enqueuer = fn opts ->
      send(parent, {:enqueued, opts})
      {:ok, %{id: 123}}
    end

    inline_runner = fn _opts -> raise "must not execute inline" end

    pid =
      start_supervised!(
        {CJFeedDiscoveryScheduler,
         [
           enqueuer: enqueuer,
           initial_delay_ms: 0,
           interval_ms: 1_000,
           runner: inline_runner
         ]}
      )

    assert_receive {:enqueued, opts}
    assert opts[:advertiser_country] == "US"
    refute_receive {:run, _opts}, 50

    GenServer.stop(pid)
  end

  test "schedules the next run after a successful discovery" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})
      {:ok, report()}
    end

    pid =
      start_supervised!(
        {CJFeedDiscoveryScheduler,
         [
           initial_delay_ms: 0,
           interval_ms: 20,
           runner: runner
         ]}
      )

    assert_receive {:run, _opts}, 250
    assert_receive {:run, _opts}, 250

    GenServer.stop(pid)
  end

  test "advances the cursor after a successful discovery" do
    parent = self()
    resolution_count = :counters.new(1, [])

    cursor_resolver = fn opts ->
      :counters.add(resolution_count, 1, 1)
      send(parent, {:resolved, opts})

      if :counters.get(resolution_count, 1) == 1, do: 40, else: 80
    end

    enqueuer = fn opts ->
      send(parent, {:enqueued, opts})
      {:ok, %{id: 123}}
    end

    pid =
      start_supervised!(
        {CJFeedDiscoveryScheduler,
         [
           cursor: 40,
           cursor_resolver: cursor_resolver,
           enqueuer: enqueuer,
           initial_delay_ms: 0,
           interval_ms: 20
         ]}
      )

    assert_receive {:resolved, _first_resolution_opts}
    assert_receive {:enqueued, first_opts}
    assert first_opts[:cursor] == 40

    assert_receive {:resolved, _second_resolution_opts}, 250
    assert_receive {:enqueued, second_opts}, 250
    assert second_opts[:cursor] == 80

    GenServer.stop(pid)
  end

  test "normalizes invalid startup cursors to nil" do
    for invalid_cursor <- [-1, 1.5, "40", %{value: 40}] do
      parent = self()

      runner = fn opts ->
        send(parent, {:run, invalid_cursor, opts})
        {:ok, report()}
      end

      pid =
        start_supervised!(
          Supervisor.child_spec(
            {CJFeedDiscoveryScheduler,
             [
               cursor: invalid_cursor,
               initial_delay_ms: 0,
               interval_ms: 1_000,
               runner: runner
             ]},
            id: {:invalid_startup_cursor, inspect(invalid_cursor)},
            restart: :temporary
          )
        )

      assert_receive {:run, ^invalid_cursor, opts}, 250
      assert opts[:cursor] == nil

      GenServer.stop(pid)
    end
  end

  test "keeps the last cursor when the durable cursor resolver returns invalid data" do
    for invalid_cursor <- [-1, 1.5, "80", %{value: 80}] do
      parent = self()

      enqueuer = fn opts ->
        send(parent, {:enqueued, invalid_cursor, opts})
        {:ok, %{id: 123}}
      end

      pid =
        start_supervised!(
          Supervisor.child_spec(
            {CJFeedDiscoveryScheduler,
             [
               cursor: 40,
               cursor_resolver: fn _opts -> invalid_cursor end,
               enqueuer: enqueuer,
               initial_delay_ms: 0,
               interval_ms: 20
             ]},
            id: {:invalid_advanced_cursor, inspect(invalid_cursor)},
            restart: :temporary
          )
        )

      assert_receive {:enqueued, ^invalid_cursor, first_opts}
      assert first_opts[:cursor] == 40

      assert_receive {:enqueued, ^invalid_cursor, second_opts}, 250
      assert second_opts[:cursor] == 40

      GenServer.stop(pid)
    end
  end

  test "schedules the next run after a failed discovery" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})
      {:error, {:missing_env, "CJ_API_TOKEN"}}
    end

    pid =
      start_supervised!(
        {CJFeedDiscoveryScheduler,
         [
           initial_delay_ms: 0,
           interval_ms: 20,
           runner: runner
         ]}
      )

    capture_log(fn ->
      assert_receive {:run, _opts}, 250
      assert_receive {:run, _opts}, 250
    end)

    GenServer.stop(pid)
  end

  test "schedules the next run after a raised discovery runner" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})
      raise "provider unavailable"
    end

    log =
      capture_log(fn ->
        pid =
          start_supervised!(
            {CJFeedDiscoveryScheduler,
             [
               initial_delay_ms: 0,
               interval_ms: 20,
               runner: runner
             ]}
          )

        assert_receive {:run, _opts}, 250
        assert_receive {:run, _opts}, 250

        assert Process.alive?(pid)
        GenServer.stop(pid)
      end)

    assert log =~ "CJ feed discovery failed"
  end

  test "schedules the next run after an unexpected discovery runner result" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})
      :unexpected_result
    end

    log =
      capture_log(fn ->
        pid =
          start_supervised!(
            Supervisor.child_spec(
              {CJFeedDiscoveryScheduler,
               [
                 initial_delay_ms: 0,
                 interval_ms: 20,
                 runner: runner
               ]},
              restart: :temporary
            )
          )

        assert_receive {:run, _opts}, 250
        assert_receive {:run, _opts}, 250

        assert Process.alive?(pid)
        GenServer.stop(pid)
      end)

    assert log =~ "CJ feed discovery returned unexpected result"
  end

  test "invalid interval normalizes to the default recurring interval" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})
      {:ok, report()}
    end

    pid =
      start_supervised!(
        {CJFeedDiscoveryScheduler,
         [
           initial_delay_ms: 0,
           interval_ms: 0,
           runner: runner
         ]}
      )

    assert_receive {:run, _opts}
    refute_receive {:run, _opts}, 50

    GenServer.stop(pid)
  end

  test "passes only non-secret discovery fields to the runner" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})
      {:ok, report()}
    end

    pid =
      start_supervised!(
        {CJFeedDiscoveryScheduler,
         [
           advertiser_country: "US",
           cursor: nil,
           initial_delay_ms: 0,
           interval_ms: 1_000,
           limit: 25,
           pages: 1,
           runner: runner
         ]}
      )

    assert_receive {:run, opts}, 250
    assert Keyword.keys(opts) == [:advertiser_country, :limit, :pages, :cursor]

    GenServer.stop(pid)
  end

  defp report do
    %{
      candidates_persisted: 1,
      failed: 0,
      feeds_fetched: 1,
      pages_fetched: 1
    }
  end
end
