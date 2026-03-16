defmodule ProductCompareWeb.AuthController do
  use ProductCompareWeb, :controller

  @not_implemented_error %{
    errors: [
      %{
        code: "NOT_IMPLEMENTED",
        message: "not implemented"
      }
    ]
  }

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
end
