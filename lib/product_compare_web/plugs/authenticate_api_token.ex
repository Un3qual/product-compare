defmodule ProductCompareWeb.Plugs.AuthenticateApiToken do
  @moduledoc """
  Resolves bearer API tokens to `current_user` and `api_token` assigns.
  """

  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  alias ProductCompare.Accounts

  @behaviour Plug
  @invalid_api_token_error %{
    errors: [
      %{
        code: "INVALID_API_TOKEN",
        message: "invalid API token"
      }
    ]
  }

  @impl Plug
  @spec init(term()) :: term()
  def init(opts), do: opts

  @impl Plug
  @spec call(Plug.Conn.t(), term()) :: Plug.Conn.t()
  def call(conn, _opts) do
    case bearer_token(conn) do
      {:ok, token} ->
        assign_authenticated_user(conn, token)

      {:error, :invalid} ->
        unauthorized(conn)

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
        unauthorized(conn)
    end
  end

  defp bearer_token(conn) do
    case get_req_header(conn, "authorization") do
      [] ->
        :error

      [header | _] ->
        case String.split(header, ~r/\s+/, parts: 2) do
          [scheme, token] ->
            if String.downcase(scheme) == "bearer" and token != "" do
              {:ok, token}
            else
              {:error, :invalid}
            end

          _ ->
            {:error, :invalid}
        end
    end
  end

  defp unauthorized(conn) do
    conn
    |> put_status(:unauthorized)
    |> json(@invalid_api_token_error)
    |> halt()
  end
end
