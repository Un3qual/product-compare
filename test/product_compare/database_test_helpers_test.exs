defmodule ProductCompare.DatabaseTestHelpersTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.DatabaseTestHelpers
  alias ProductCompare.Repo

  test "polling succeeds immediately without sleeping" do
    assert :ok =
             DatabaseTestHelpers.poll_until(
               fn -> :ready end,
               "expected an immediate state",
               sleep: fn _delay -> flunk("immediate success must not sleep") end
             )
  end

  test "polling backs off until the expected state appears" do
    test_pid = self()
    attempts = :counters.new(1, [])

    assert :ok =
             DatabaseTestHelpers.poll_until(
               fn ->
                 :counters.add(attempts, 1, 1)
                 attempt = :counters.get(attempts, 1)

                 if attempt == 3, do: :ready, else: {:retry, %{attempt: attempt}}
               end,
               "expected an eventual state",
               clock: fn -> 0 end,
               sleep: fn delay -> send(test_pid, {:slept, delay}) end
             )

    assert_receive {:slept, 5}
    assert_receive {:slept, 10}
    refute_receive {:slept, _delay}
  end

  test "polling timeout reports the expectation and last observed state" do
    clock_calls = :counters.new(1, [])

    clock = fn ->
      :counters.add(clock_calls, 1, 1)
      if :counters.get(clock_calls, 1) == 1, do: 0, else: 10
    end

    assert_raise ExUnit.AssertionError,
                 ~r/expected a blocked backend; last observed state: %{phase: :waiting}/,
                 fn ->
                   DatabaseTestHelpers.poll_until(
                     fn -> {:retry, %{phase: :waiting}} end,
                     "expected a blocked backend",
                     clock: clock,
                     sleep: fn _delay -> :ok end,
                     timeout_ms: 10
                   )
                 end
  end

  test "captures only queries from the caller process tree" do
    test_pid = self()

    unrelated_pid =
      spawn(fn ->
        receive do
          :query ->
            Repo.query!("SELECT 1 AS unrelated_query")
            send(test_pid, :unrelated_query_finished)
        end
      end)

    :ok = Ecto.Adapters.SQL.Sandbox.allow(Repo, self(), unrelated_pid)

    {result, queries} =
      capture_select_queries(fn ->
        send(unrelated_pid, :query)
        assert_receive :unrelated_query_finished
        Repo.query!("SELECT 2 AS captured_query")
      end)

    assert result.rows == [[2]]
    assert queries == ["SELECT 2 AS captured_query"]
  end

  test "includes queries from caller-owned tasks" do
    {result, queries} =
      capture_select_queries(fn ->
        Task.async(fn -> Repo.query!("SELECT 3 AS task_query") end)
        |> Task.await()
      end)

    assert result.rows == [[3]]
    assert queries == ["SELECT 3 AS task_query"]
  end

  test "counts captured queries by FROM table" do
    queries = [
      ~s(SELECT p0."id" FROM "products" AS p0),
      ~s(SELECT p0."slug" FROM "products" AS p0 WHERE p0."slug" = $1),
      ~s(SELECT m0."id" FROM "merchants" AS m0),
      ~s(SELECT p0."id" FROM "price_points" AS p0 JOIN "products" AS p1 ON true)
    ]

    assert ProductCompare.DatabaseTestHelpers.count_select_queries_targeting_table(
             queries,
             :products
           ) == 2

    assert ProductCompare.DatabaseTestHelpers.count_select_queries_targeting_table(
             queries,
             :merchants
           ) == 1
  end
end
