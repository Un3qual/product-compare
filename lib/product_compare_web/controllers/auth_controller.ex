defmodule ProductCompareWeb.AuthController do
  use ProductCompareWeb, :controller

  alias ProductCompare.Accounts
  alias ProductCompareWeb.AuthJSON

  @unprocessable_entity 422
  @not_implemented_error %{
    errors: [
      %{
        code: "NOT_IMPLEMENTED",
        message: "not implemented"
      }
    ]
  }

  def register(conn, params) do
    case Accounts.register_user(params) do
      {:ok, user} ->
        user_token = Accounts.generate_user_session_token(user)

        conn
        |> configure_session(renew: true)
        |> put_session(:user_token, user_token)
        |> put_status(:created)
        |> put_view(AuthJSON)
        |> render(:viewer, viewer: user)

      {:error, changeset} ->
        conn
        |> put_status(@unprocessable_entity)
        |> json(%{
          errors: changeset_errors(changeset)
        })
    end
  end

  def forgot_password(conn, _params) do
    conn
    |> put_status(:not_implemented)
    |> json(@not_implemented_error)
  end

  def reset_password(conn, _params) do
    conn
    |> put_status(:not_implemented)
    |> json(@not_implemented_error)
  end

  def verify_email(conn, _params) do
    conn
    |> put_status(:not_implemented)
    |> json(@not_implemented_error)
  end

  defp changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, opts} ->
      Regex.replace(~r"%{(\w+)}", message, fn _, key ->
        opts
        |> Keyword.get(atomize_key(key), key)
        |> to_string()
      end)
    end)
  end

  defp atomize_key(key) do
    String.to_existing_atom(key)
  rescue
    ArgumentError -> String.to_atom(key)
  end
end
