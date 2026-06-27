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

    pid =
      start_supervised!(
        {CJFeedDiscoveryScheduler,
         [
           initial_delay_ms: 0,
           interval_ms: 20,
           runner: runner
         ]}
      )

    log =
      capture_log(fn ->
        assert_receive {:run, _opts}
        assert_receive {:run, _opts}, 250
      end)

    assert Process.alive?(pid)
    assert log =~ "CJ feed discovery failed"

    GenServer.stop(pid)
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
