defmodule ProductCompareWeb.Plugs.ApplyGraphqlSessionMutations do
  @moduledoc """
  Applies resolver-requested session mutations before the GraphQL response is sent.
  """

  import Plug.Conn

  alias ProductCompareWeb.GraphQL.SessionMutationBridge

  @behaviour Plug

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    SessionMutationBridge.clear()

    register_before_send(conn, fn conn ->
      try do
        SessionMutationBridge.apply_pending(conn)
      after
        SessionMutationBridge.clear()
      end
    end)
  end
end
