defmodule ProductCompare.Ingestion.CJProductImportSchedulerTest do
  use ExUnit.Case, async: true

  import ExUnit.CaptureLog

  alias ProductCompare.Ingestion.CJProductImportScheduler

  test "calls the runner once after the initial delay with normalized import options" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})
      {:ok, report()}
    end

    pid =
      start_supervised!(
        {CJProductImportScheduler,
         [
           currency: "usd",
           cursor: 40,
           initial_delay_ms: 0,
           interval_ms: 1_000,
           keywords: "shoe, boot",
           limit: 10,
           pages: 2,
           runner: runner,
           serviceable_areas: "us, ca"
         ]}
      )

    assert_receive {:run, opts}

    assert opts == [
             currency: "USD",
             keywords: ["shoe", "boot"],
             limit: 10,
             pages: 2,
             serviceable_areas: ["US", "CA"],
             cursor: 40
           ]

    refute_receive {:run, _opts}, 50

    GenServer.stop(pid)
  end

  test "prefers an enqueue callback so scheduled work does not execute imports inline" do
    parent = self()

    enqueuer = fn opts ->
      send(parent, {:enqueued, opts})
      {:ok, %{id: 123}}
    end

    inline_runner = fn _opts -> raise "must not execute inline" end

    pid =
      start_supervised!(
        {CJProductImportScheduler,
         [
           complete_scope: true,
           enqueuer: enqueuer,
           initial_delay_ms: 0,
           interval_ms: 1_000,
           runner: inline_runner
         ]}
      )

    assert_receive {:enqueued, opts}
    assert opts[:complete_scope]
    assert opts[:currency] == "USD"
    refute_receive {:run, _opts}, 50

    GenServer.stop(pid)
  end

  test "schedules the next run after a successful import" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})
      {:ok, report()}
    end

    pid =
      start_supervised!(
        {CJProductImportScheduler,
         [
           initial_delay_ms: 0,
           interval_ms: 20,
           runner: runner
         ]}
      )

    assert_receive {:run, _opts}
    assert_receive {:run, _opts}, 100

    GenServer.stop(pid)
  end

  test "advances the cursor after a successful import" do
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
        {CJProductImportScheduler,
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

  test "keeps the last cursor when the durable cursor resolver returns invalid data" do
    parent = self()

    enqueuer = fn opts ->
      send(parent, {:enqueued, opts})
      {:ok, %{id: 123}}
    end

    pid =
      start_supervised!(
        {CJProductImportScheduler,
         [
           cursor: 40,
           cursor_resolver: fn _opts -> "80" end,
           enqueuer: enqueuer,
           initial_delay_ms: 0,
           interval_ms: 20
         ]}
      )

    assert_receive {:enqueued, first_opts}
    assert first_opts[:cursor] == 40

    assert_receive {:enqueued, second_opts}, 250
    assert second_opts[:cursor] == 40

    GenServer.stop(pid)
  end

  test "schedules the next run after a failed import without logging the reason" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})
      {:error, {:provider_error, :redacted_reason}}
    end

    pid =
      start_supervised!(
        {CJProductImportScheduler,
         [
           initial_delay_ms: 0,
           interval_ms: 20,
           runner: runner
         ]}
      )

    log =
      capture_log(fn ->
        assert_receive {:run, _opts}
        assert_receive {:run, _opts}, 100
      end)

    assert log =~ "CJ product import failed"
    assert log =~ "failure=runner_error"
    refute log =~ "provider_error"
    refute log =~ "redacted_reason"

    GenServer.stop(pid)
  end

  test "passes only non-secret import fields to the runner" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})
      {:ok, report()}
    end

    pid =
      start_supervised!(
        {CJProductImportScheduler,
         [
           currency: "USD",
           cursor: nil,
           initial_delay_ms: 0,
           interval_ms: 1_000,
           keywords: ["shoe"],
           limit: 25,
           pages: 1,
           runner: runner,
           serviceable_areas: "US"
         ]}
      )

    assert_receive {:run, opts}

    assert Keyword.keys(opts) == [
             :currency,
             :keywords,
             :limit,
             :pages,
             :serviceable_areas,
             :cursor
           ]

    GenServer.stop(pid)
  end

  test "invalid string and list options normalize to safe defaults" do
    parent = self()

    runner = fn opts ->
      send(parent, {:run, opts})
      {:ok, report()}
    end

    pid =
      start_supervised!(
        {CJProductImportScheduler,
         [
           currency: "",
           cursor: "invalid",
           initial_delay_ms: 0,
           interval_ms: 0,
           keywords: ["", " "],
           limit: 0,
           pages: -1,
           runner: runner,
           serviceable_areas: ["", " "]
         ]}
      )

    assert_receive {:run, opts}, 200

    assert opts == [
             currency: "USD",
             keywords: ["shoe"],
             limit: 25,
             pages: 1,
             serviceable_areas: ["US"],
             cursor: nil
           ]

    GenServer.stop(pid)
  end

  defp report do
    %{
      failed: 0,
      fetched: 1,
      normalized: 1,
      pages_fetched: 1,
      persisted: 1
    }
  end
end
