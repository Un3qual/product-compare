defmodule ProductCompareWeb.Plugs.AuthenticateApiToken do
  @moduledoc """
  Resolves bearer API tokens to `current_user` and `api_token` assigns.
  """

  import Plug.Conn

  alias ProductCompare.Accounts

  @behaviour Plug

  @impl Plug
  @spec init(term()) :: term()
  def init(opts), do: opts

  @impl Plug
  @spec call(Plug.Conn.t(), term()) :: Plug.Conn.t()
  def call(conn, _opts) do
    case bearer_token(conn) do
      {:ok, token} ->
        assign_authenticated_user(conn, token)

      :error ->
        conn
    end
  end

  defp assign_authenticated_user(conn, token) do
    case Accounts.authenticate_api_token(token) do
      {:ok, user, api_token} ->
        conn
        |> assign(:current_user, user)
        |> assign(:api_token, api_token)

      :error ->
        conn
    end
  end

  defp bearer_token(conn) do
    with [header | _] <- get_req_header(conn, "authorization"),
         [scheme, token] <- String.split(header, ~r/\s+/, parts: 2),
         true <- String.downcase(scheme) == "bearer",
         true <- token != "" do
      {:ok, token}
    else
      _ -> :error
    end
  end
end
