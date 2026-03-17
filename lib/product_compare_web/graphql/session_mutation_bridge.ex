defmodule ProductCompareWeb.GraphQL.SessionMutationBridge do
  @moduledoc false

  import Plug.Conn

  @ops_key {__MODULE__, :pending_ops}

  @spec renew_session_with_user_token(String.t()) :: :ok
  def renew_session_with_user_token(user_token) when is_binary(user_token) do
    put_pending_op({:renew_session_with_user_token, user_token})
    :ok
  end

  @spec drop_session() :: :ok
  def drop_session do
    put_pending_op(:drop_session)
    :ok
  end

  @spec clear() :: term()
  def clear, do: Process.delete(@ops_key)

  @spec apply_pending(Plug.Conn.t()) :: Plug.Conn.t()
  def apply_pending(conn) do
    pending_ops = Process.get(@ops_key, [])
    clear()

    Enum.reduce(pending_ops, conn, fn
      {:renew_session_with_user_token, user_token}, conn ->
        conn
        |> configure_session(renew: true)
        |> put_session(:user_token, user_token)

      :drop_session, conn ->
        configure_session(conn, drop: true)
    end)
  end

  defp put_pending_op(op) do
    Process.put(@ops_key, Process.get(@ops_key, []) ++ [op])
  end
end
