defmodule ProductCompare.DatabaseTestHelpers do
  @moduledoc false

  import Ecto.Query
  import ExUnit.Assertions, only: [assert: 1, assert_receive: 2, flunk: 1]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User

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

  def assert_some_backend_blocked_by(blocking_backend_pid) do
    deadline = System.monotonic_time(:millisecond) + 2_000
    wait_until_any_backend_blocked(blocking_backend_pid, deadline)
  end

  def assert_backend_blocked(waiting_backend_pid) do
    deadline = System.monotonic_time(:millisecond) + 2_000
    wait_until_backend_blocked(waiting_backend_pid, deadline)
  end

  def assert_not_blocked_by(waiting_backend_pid, blocking_backend_pid) do
    deadline = System.monotonic_time(:millisecond) + 2_000
    wait_until_idle_or_blocked(waiting_backend_pid, blocking_backend_pid, deadline)
  end

  def hold_row_lock(schema, id, transition) when is_function(transition, 1) do
    parent = self()

    task =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          Repo.transaction(fn ->
            backend_pid = database_backend_pid()
            record = Repo.one!(from record in schema, where: record.id == ^id, lock: "FOR UPDATE")
            send(parent, {:row_lock_held, self(), backend_pid})

            receive do
              :commit_transition -> transition.(record)
            after
              5_000 -> flunk("timed out waiting to commit the competing transition")
            end
          end)
        end)
      end)

    assert_receive {:row_lock_held, task_pid, backend_pid}, 2_000
    assert(task_pid == task.pid)
    {task, backend_pid}
  end

  def release_row_lock(task) do
    send(task.pid, :commit_transition)
    assert {:ok, _record} = Task.await(task)
  end

  def hold_operator_revocation(operator_id) do
    parent = self()

    {task, backend_pid} =
      start_unboxed_action(fn ->
        Repo.transaction(fn ->
          revoked_operator =
            User
            |> Repo.get!(operator_id)
            |> User.operator_access_changeset(false)
            |> Repo.update!()

          send(parent, {:operator_revoked, self()})

          receive do
            :commit_revocation -> revoked_operator
          after
            5_000 -> flunk("timed out waiting to commit operator revocation")
          end
        end)
      end)

    assert_receive {:operator_revoked, task_pid}, 2_000
    assert(task_pid == task.pid)
    {task, backend_pid}
  end

  def release_operator_revocation(task) do
    send(task.pid, :commit_revocation)
    assert {:ok, %User{is_operator: false}} = Task.await(task)
  end

  def start_unboxed_action(action) when is_function(action, 0) do
    parent = self()

    task =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          Repo.checkout(fn ->
            backend_pid = database_backend_pid()
            send(parent, {:action_started, self(), backend_pid})
            action.()
          end)
        end)
      end)

    assert_receive {:action_started, task_pid, backend_pid}, 2_000
    assert(task_pid == task.pid)
    {task, backend_pid}
  end

  def database_backend_pid do
    Repo.query!("SELECT pg_backend_pid()").rows |> hd() |> hd()
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

  defp wait_until_any_backend_blocked(blocking_backend_pid, deadline) do
    blocked? =
      Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
        Repo.query!(
          """
          SELECT EXISTS (
            SELECT 1
            FROM pg_stat_activity AS activity
            WHERE $1 = ANY(pg_blocking_pids(activity.pid))
          )
          """,
          [blocking_backend_pid]
        )
        |> then(&(&1.rows == [[true]]))
      end)

    cond do
      blocked? ->
        :ok

      System.monotonic_time(:millisecond) < deadline ->
        wait_until_any_backend_blocked(blocking_backend_pid, deadline)

      true ->
        flunk("expected a database backend to wait for #{blocking_backend_pid}")
    end
  end

  defp wait_until_backend_blocked(waiting_backend_pid, deadline) do
    blocked? =
      Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
        Repo.query!("SELECT cardinality(pg_blocking_pids($1)) > 0", [waiting_backend_pid])
        |> then(&(&1.rows == [[true]]))
      end)

    cond do
      blocked? ->
        :ok

      System.monotonic_time(:millisecond) < deadline ->
        wait_until_backend_blocked(waiting_backend_pid, deadline)

      true ->
        flunk("expected database backend #{waiting_backend_pid} to be blocked")
    end
  end

  defp wait_until_idle_or_blocked(waiting_backend_pid, blocking_backend_pid, deadline) do
    status =
      Sandbox.unboxed_run(Repo, fn ->
        Repo.query!(
          """
          SELECT activity.state, $1 = ANY(pg_blocking_pids(activity.pid))
          FROM pg_stat_activity AS activity
          WHERE activity.pid = $2
          """,
          [blocking_backend_pid, waiting_backend_pid]
        ).rows
      end)

    case status do
      [[_state, true]] ->
        flunk(
          "expected database backend #{waiting_backend_pid} not to wait for #{blocking_backend_pid}"
        )

      [["idle in transaction", false]] ->
        :ok

      _other ->
        if System.monotonic_time(:millisecond) < deadline do
          wait_until_idle_or_blocked(waiting_backend_pid, blocking_backend_pid, deadline)
        else
          flunk(
            "expected database backend #{waiting_backend_pid} to finish without waiting for #{blocking_backend_pid}"
          )
        end
    end
  end
end
