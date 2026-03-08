defmodule ProductCompareWeb.Plugs.FetchCurrentUser do
  @moduledoc """
  Loads the current user from the session token, when present.
  """

  import Plug.Conn

  alias ProductCompare.Accounts
  alias ProductCompareWeb.Plugs.RequireSameOrigin

  @behaviour Plug

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, opts) do
    if same_origin_session_only?(opts) and not RequireSameOrigin.same_origin_request?(conn) do
      conn
    else
      user_token = get_session(conn, :user_token)

      case Accounts.get_user_by_session_token(user_token) do
        nil ->
          conn

        current_user ->
          assign(conn, :current_user, current_user)
      end
    end
  end

  defp same_origin_session_only?(opts), do: Keyword.get(opts, :same_origin_only, false)
end
