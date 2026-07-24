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
    if same_origin_session_only?(opts) and not RequireSameOrigin.trusted_request_origin?(conn) do
      conn
    else
      case get_session(conn, :user_token) do
        user_token when is_binary(user_token) ->
          case Accounts.get_user_by_session_token(user_token) do
            nil -> delete_session(conn, :user_token)
            current_user -> assign(conn, :current_user, current_user)
          end

        nil ->
          conn

        _invalid_token ->
          delete_session(conn, :user_token)
      end
    end
  end

  defp same_origin_session_only?(opts), do: Keyword.get(opts, :same_origin_only, false)
end
