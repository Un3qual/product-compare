defmodule ProductCompare.DatabaseTestHelpersTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Repo

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
end
