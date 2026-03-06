defmodule ProductCompareWeb.AuthControllerTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompare.Accounts
  import ProductCompare.Fixtures.AccountsFixtures

  describe "POST /api/auth/register" do
    test "requires password", %{conn: conn} do
      email = "register-#{System.unique_integer([:positive])}@example.com"

      conn =
        post(conn, "/api/auth/register", %{
          "email" => email
        })

      assert %{"errors" => %{"password" => ["can't be blank"]}} = json_response(conn, 422)
      refute get_session(conn, :user_token)
      assert is_nil(Accounts.get_user_by_email(email))
    end
  end

  describe "POST /api/auth/login" do
    test "sets session and returns viewer payload", %{conn: conn} do
      user = user_fixture(%{password: "supersecretpass123"})
      user_email = user.email

      conn =
        post(conn, "/api/auth/login", %{
          "email" => user.email,
          "password" => "supersecretpass123"
        })

      assert %{"viewer" => %{"email" => ^user_email}} = json_response(conn, 200)
      assert get_session(conn, :user_token)
    end

    test "returns unauthorized for invalid credentials", %{conn: conn} do
      user = user_fixture(%{password: "supersecretpass123"})

      conn =
        post(conn, "/api/auth/login", %{
          "email" => user.email,
          "password" => "wrong-password-123"
        })

      assert %{
               "errors" => [
                 %{
                   "code" => "INVALID_CREDENTIALS",
                   "message" => "invalid email or password"
                 }
               ]
             } = json_response(conn, 401)

      refute get_session(conn, :user_token)
    end
  end
end
