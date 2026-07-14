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

    assert_receive {:run, _opts}
    assert_receive {:run, _opts}, 250

    GenServer.stop(pid)
  end

  test "advances the cursor after a successful discovery" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})

      {:ok, Map.put(report(), :next_cursor, 80)}
    end

    pid =
      start_supervised!(
        {CJFeedDiscoveryScheduler,
         [
           cursor: 40,
           initial_delay_ms: 0,
           interval_ms: 20,
           runner: runner
         ]}
      )

    assert_receive {:run, first_opts}
    assert first_opts[:cursor] == 40

    assert_receive {:run, second_opts}, 250
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

      assert_receive {:run, ^invalid_cursor, opts}
      assert opts[:cursor] == nil

      GenServer.stop(pid)
    end
  end

  test "does not advance to an invalid cursor from a successful report" do
    for invalid_cursor <- [-1, 1.5, "80", %{value: 80}] do
      parent = self()
      run_count = :counters.new(1, [])

      runner = fn opts ->
        :counters.add(run_count, 1, 1)
        count = :counters.get(run_count, 1)
        send(parent, {:run, invalid_cursor, opts})

        if count == 1 do
          {:ok, Map.put(report(), :next_cursor, invalid_cursor)}
        else
          {:ok, report()}
        end
      end

      pid =
        start_supervised!(
          Supervisor.child_spec(
            {CJFeedDiscoveryScheduler,
             [
               cursor: 40,
               initial_delay_ms: 0,
               interval_ms: 20,
               runner: runner
             ]},
            id: {:invalid_advanced_cursor, inspect(invalid_cursor)},
            restart: :temporary
          )
        )

      assert_receive {:run, ^invalid_cursor, first_opts}
      assert first_opts[:cursor] == 40

      assert_receive {:run, ^invalid_cursor, second_opts}, 250
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
      assert_receive {:run, _opts}
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

        assert_receive {:run, _opts}
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

        assert_receive {:run, _opts}
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

    assert_receive {:run, opts}
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
