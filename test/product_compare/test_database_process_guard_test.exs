defmodule ProductCompare.TestDatabaseProcessGuardTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo
  alias ProductCompare.TestDatabaseProcessGuard

  test "rejects another guard for the same database and releases ownership with its session" do
    namespace = "test-database-process-guard-#{Ecto.UUID.generate()}"
    first_guard = TestDatabaseProcessGuard.acquire!(Repo, namespace)

    try do
      assert %Postgrex.Result{rows: [[database]]} =
               Postgrex.query!(first_guard, "SELECT current_database()", [])

      assert_raise RuntimeError, ~r/#{Regex.escape(database)}.*MIX_TEST_PARTITION/s, fn ->
        TestDatabaseProcessGuard.acquire!(Repo, namespace)
      end
    after
      GenServer.stop(first_guard)
    end

    released_guard = TestDatabaseProcessGuard.acquire!(Repo, namespace)
    GenServer.stop(released_guard)
  end
end
