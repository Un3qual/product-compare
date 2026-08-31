defmodule ProductCompare.TestDatabaseProcessGuard do
  @default_namespace "external-mix-test-process"

  @spec acquire!(module(), String.t()) :: Postgrex.conn()
  def acquire!(repo, namespace \\ @default_namespace) do
    {:ok, connection} = Postgrex.start_link(connection_config(repo))

    try do
      database = current_database!(connection)

      if advisory_lock_acquired?(connection, database, namespace) do
        connection
      else
        GenServer.stop(connection)

        raise RuntimeError,
              "another mix test process already owns the #{database} test database; " <>
                "set MIX_TEST_PARTITION to use a separate test database"
      end
    rescue
      error ->
        if Process.alive?(connection), do: GenServer.stop(connection)
        reraise error, __STACKTRACE__
    end
  end

  defp current_database!(connection) do
    %Postgrex.Result{rows: [[database]]} =
      Postgrex.query!(connection, "SELECT current_database()", [])

    database
  end

  defp connection_config(repo) do
    repo.config()
    |> Keyword.delete(:pool)
    |> Keyword.delete(:pool_size)
  end

  defp advisory_lock_acquired?(connection, database, namespace) do
    %Postgrex.Result{rows: [[acquired?]]} =
      Postgrex.query!(connection, "SELECT pg_try_advisory_lock($1::bigint)", [
        lock_key(database, namespace)
      ])

    acquired?
  end

  defp lock_key(database, namespace) do
    <<key::signed-64, _::binary>> = :crypto.hash(:sha256, database <> ":" <> namespace)
    key
  end
end
