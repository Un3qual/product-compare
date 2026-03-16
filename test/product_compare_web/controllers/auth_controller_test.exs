defmodule ProductCompareWeb.AuthControllerTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Accounts
  import ProductCompare.Fixtures.AccountsFixtures

  setup do
    endpoint_config = Application.get_env(:product_compare, ProductCompareWeb.Endpoint, [])

    Application.put_env(
      :product_compare,
      ProductCompareWeb.Endpoint,
      Keyword.put(endpoint_config, :trusted_origins, ["https://app.example.com"])
    )

    on_exit(fn ->
      Application.put_env(:product_compare, ProductCompareWeb.Endpoint, endpoint_config)
    end)

    {:ok, endpoint_config: endpoint_config}
  end

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

    test "accepts configured public https origins without requiring the upstream port", %{
      conn: conn,
      endpoint_config: endpoint_config
    } do
      email = "register-forwarded-#{System.unique_integer([:positive])}@example.com"

      Application.put_env(
        :product_compare,
        ProductCompareWeb.Endpoint,
        Keyword.put(endpoint_config, :url, scheme: "https", port: 443)
      )

      conn =
        %{conn | port: 4000}
        |> put_req_header("origin", "https://www.example.com")
        |> post("/api/auth/register", %{
          "email" => email
        })

      assert %{"errors" => %{"password" => ["can't be blank"]}} = json_response(conn, 422)
    end

    test "ignores raw x-forwarded headers when validating the request origin", %{conn: conn} do
      email = "register-forwarded-#{System.unique_integer([:positive])}@example.com"

      conn =
        %{conn | port: 4000}
        |> put_req_header("origin", "https://evil.example.com")
        |> put_req_header("x-forwarded-proto", "https")
        |> put_req_header("x-forwarded-host", "evil.example.com")
        |> put_req_header("x-forwarded-port", "443")
        |> post("/api/auth/register", %{
          "email" => email
        })

      assert %{
               "errors" => [
                 %{
                   "code" => "INVALID_ORIGIN",
                   "message" => "cross-origin request rejected"
                 }
               ]
             } = json_response(conn, 403)
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
      assert conn.resp_cookies["_product_compare_key"].max_age == 0
    end
  end

  describe "POST /api/auth/login" do
    test "accepts requests from a configured frontend origin", %{conn: conn} do
      user = user_fixture(%{password: "supersecretpass123"})
      user_email = user.email

      conn =
        conn
        |> put_req_header("origin", "https://app.example.com")
        |> post("/api/auth/login", %{
          "email" => user.email,
          "password" => "supersecretpass123"
        })

      assert %{"viewer" => %{"email" => ^user_email}} = json_response(conn, 200)
      assert get_session(conn, :user_token)
      assert get_resp_header(conn, "access-control-allow-origin") == ["https://app.example.com"]
      assert get_resp_header(conn, "access-control-allow-credentials") == ["true"]
    end

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

    test "answers CORS preflight requests for configured frontend origins", %{conn: conn} do
      conn =
        conn
        |> put_req_header("origin", "https://app.example.com")
        |> put_req_header("access-control-request-method", "POST")
        |> put_req_header("access-control-request-headers", "content-type")
        |> options("/api/auth/login")

      assert response(conn, 204) == ""
      assert get_resp_header(conn, "access-control-allow-origin") == ["https://app.example.com"]
      assert get_resp_header(conn, "access-control-allow-credentials") == ["true"]

      assert get_resp_header(conn, "access-control-allow-methods") == [
               "GET,POST,PUT,PATCH,DELETE,OPTIONS"
             ]

      assert get_resp_header(conn, "access-control-allow-headers") == ["content-type"]
    end
  end
end
