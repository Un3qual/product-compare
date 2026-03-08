defmodule ProductCompareWeb.AuthControllerTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompare.Accounts
  import ProductCompare.Fixtures.AccountsFixtures

  describe "POST /api/auth/register" do
    test "requires password", %{conn: conn} do
      email = "register-#{System.unique_integer([:positive])}@example.com"

      conn =
        conn
        |> put_req_header_same_origin()
        |> post("/api/auth/register", %{
          "email" => email
        })

      assert %{"errors" => %{"password" => ["can't be blank"]}} = json_response(conn, 422)
      refute get_session(conn, :user_token)
      assert is_nil(Accounts.get_user_by_email(email))
    end

    test "accepts forwarded https origins without requiring the upstream port", %{conn: conn} do
      email = "register-forwarded-#{System.unique_integer([:positive])}@example.com"

      conn =
        %{conn | port: 4000}
        |> put_req_header("x-forwarded-proto", "https")
        |> put_req_header("origin", "https://www.example.com")
        |> post("/api/auth/register", %{
          "email" => email
        })

      assert %{"errors" => %{"password" => ["can't be blank"]}} = json_response(conn, 422)
    end

    test "registers a user and logs out with the issued session", %{conn: conn} do
      email = "register-roundtrip-#{System.unique_integer([:positive])}@example.com"
      password = "supersecretpass123"

      conn =
        conn
        |> put_req_header_same_origin()
        |> post("/api/auth/register", %{
          "email" => email,
          "password" => password
        })

      assert %{"viewer" => %{"email" => ^email}} = json_response(conn, 201)
      assert get_session(conn, :user_token)

      conn =
        conn
        |> recycle()
        |> put_req_header_same_origin()
        |> delete("/api/auth/logout")

      assert %{"ok" => true} = json_response(conn, 200)
      refute get_session(conn, :user_token)
    end
  end

  describe "POST /api/auth/login" do
    test "sets session and returns viewer payload", %{conn: conn} do
      user = user_fixture(%{password: "supersecretpass123"})
      user_email = user.email

      conn =
        conn
        |> put_req_header_same_origin()
        |> post("/api/auth/login", %{
          "email" => user.email,
          "password" => "supersecretpass123"
        })

      assert %{"viewer" => %{"email" => ^user_email}} = json_response(conn, 200)
      assert get_session(conn, :user_token)
    end

    test "returns unauthorized for invalid credentials", %{conn: conn} do
      user = user_fixture(%{password: "supersecretpass123"})

      conn =
        conn
        |> put_req_header_same_origin()
        |> post("/api/auth/login", %{
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

    test "rejects cross-origin requests before setting a session", %{conn: conn} do
      user = user_fixture(%{password: "supersecretpass123"})

      conn =
        conn
        |> put_req_header("origin", "https://evil.example.com")
        |> post("/api/auth/login", %{
          "email" => user.email,
          "password" => "supersecretpass123"
        })

      assert %{
               "errors" => [
                 %{
                   "code" => "INVALID_ORIGIN",
                   "message" => "cross-origin request rejected"
                 }
               ]
             } = json_response(conn, 403)

      refute get_session(conn, :user_token)
    end
  end
end
