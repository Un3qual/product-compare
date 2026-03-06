defmodule ProductCompareWeb.Plugs.FetchCurrentUser do
  @moduledoc """
  Loads the current user from the session token, when present.
  """

  import Plug.Conn

  alias ProductCompare.Accounts

  @behaviour Plug

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    user_token = get_session(conn, :user_token)

    case Accounts.get_user_by_session_token(user_token) do
      nil ->
        conn

      current_user ->
        assign(conn, :current_user, current_user)
    end
  end
end
