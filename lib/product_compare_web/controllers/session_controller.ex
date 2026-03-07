defmodule ProductCompareWeb.SessionController do
  use ProductCompareWeb, :controller

  alias ProductCompare.Accounts
  alias ProductCompareWeb.AuthJSON

  @invalid_credentials_code "INVALID_CREDENTIALS"
  @invalid_credentials_message "invalid email or password"

  def create(conn, %{"email" => email, "password" => password}) do
    case Accounts.authenticate_user_by_email_and_password(email, password) do
      nil ->
        render_unauthorized(conn)

      user ->
        user_token = Accounts.generate_user_session_token(user)

        conn
        |> configure_session(renew: true)
        |> put_session(:user_token, user_token)
        |> put_status(:ok)
        |> put_view(AuthJSON)
        |> render(:viewer, viewer: user)
    end
  end

  def create(conn, _params) do
    render_unauthorized(conn)
  end

  def delete(conn, _params) do
    if token = get_session(conn, :user_token) do
      Accounts.delete_user_session_token(token)
    end

    conn
    |> configure_session(drop: true)
    |> json(%{ok: true})
  end

  defp render_unauthorized(conn) do
    conn
    |> put_status(:unauthorized)
    |> put_view(AuthJSON)
    |> render(:error,
      code: @invalid_credentials_code,
      message: @invalid_credentials_message
    )
  end
end
