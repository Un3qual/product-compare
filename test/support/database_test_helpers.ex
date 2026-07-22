defmodule ProductCompare.DatabaseTestHelpers do
  @moduledoc false

  import ExUnit.Assertions, only: [flunk: 1]

  alias ProductCompare.Repo

  def capture_select_queries(fun) when is_function(fun, 0) do
    handler_id = {__MODULE__, System.unique_integer([:positive])}
    ref = make_ref()
    test_pid = self()

    :ok =
      :telemetry.attach(
        handler_id,
        [:product_compare, :repo, :query],
        fn _event, _measurements, metadata, {pid, message_ref} ->
          if caller_process?(pid) and select_query?(metadata.query) do
            send(pid, {message_ref, metadata.query})
          end
        end,
        {test_pid, ref}
      )

    try do
      result = fun.()
      {result, drain_queries(ref, [])}
    after
      :telemetry.detach(handler_id)
    end
  end

  @spec count_select_queries_targeting_table([String.t()], atom()) :: non_neg_integer()
  def count_select_queries_targeting_table(queries, table) when is_atom(table) do
    Enum.count(queries, &String.contains?(&1, ~s(FROM "#{table}")))
  end

  def assert_blocked_by(waiting_backend_pid, blocking_backend_pid) do
    deadline = System.monotonic_time(:millisecond) + 2_000
    wait_until_blocked(waiting_backend_pid, blocking_backend_pid, deadline)
  end

  defp drain_queries(ref, acc) do
    receive do
      {^ref, query} -> drain_queries(ref, [query | acc])
    after
      0 -> Enum.reverse(acc)
    end
  end

  defp select_query?(query) when is_binary(query) do
    query
    |> String.trim_leading()
    |> String.upcase()
    |> String.starts_with?("SELECT")
  end

  defp caller_process?(pid) do
    self() == pid or pid in Process.get(:"$callers", [])
  end

  defp wait_until_blocked(waiting_backend_pid, blocking_backend_pid, deadline) do
    blocked? =
      Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
        Repo.query!("SELECT $1 = ANY(pg_blocking_pids($2))", [
          blocking_backend_pid,
          waiting_backend_pid
        ])
        |> then(&(&1.rows == [[true]]))
      end)

    cond do
      blocked? ->
        :ok

      System.monotonic_time(:millisecond) < deadline ->
        wait_until_blocked(waiting_backend_pid, blocking_backend_pid, deadline)

      true ->
        flunk(
          "expected database backend #{waiting_backend_pid} to wait for #{blocking_backend_pid}"
        )
    end
  end
end
