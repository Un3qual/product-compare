defmodule ProductCompareWeb.GraphQL.SessionAuthTest do
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

    :ok
  end

  test "viewer resolves from session without bearer token", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header_same_origin()

    query = """
    query {
      viewer {
        email
      }
    }
    """

    assert %{"data" => %{"viewer" => %{"email" => ^user_email}}} = graphql(conn, query)
  end

  test "cross-origin requests do not resolve viewer from the browser session", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header("origin", "https://evil.example.com")

    query = """
    query {
      viewer {
        email
      }
    }
    """

    assert %{"data" => %{"viewer" => nil}} = graphql(conn, query)
  end

  test "trusted frontend origins can resolve viewer from the browser session", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header("origin", "https://app.example.com")

    query = """
    query {
      viewer {
        email
      }
    }
    """

    assert %{"data" => %{"viewer" => %{"email" => ^user_email}}} = graphql(conn, query)
  end

  test "register creates a user, sets the session, and returns viewer", %{conn: conn} do
    email = "register-#{System.unique_integer([:positive])}@example.com"
    password = "supersecretpass123"

    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(register_mutation(), %{"email" => email, "password" => password})

    assert %{
             "data" => %{
               "register" => %{
                 "viewer" => %{"email" => ^email},
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    assert get_session(conn, :user_token)
    assert %{email: ^email} = Accounts.get_user_by_email(email)

    viewer_conn =
      conn
      |> recycle()
      |> put_req_header_same_origin()

    assert %{"data" => %{"viewer" => %{"email" => ^email}}} = graphql(viewer_conn, viewer_query())
  end

  test "register returns typed validation errors without creating a session", %{conn: conn} do
    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(register_mutation(), %{"email" => "bad-email", "password" => "short"})

    assert %{
             "data" => %{
               "register" => %{
                 "viewer" => nil,
                 "errors" => errors
               }
             }
           } = json_response(conn, 200)

    assert Enum.any?(errors, &(&1["code"] == "INVALID_ARGUMENT"))
    refute get_session(conn, :user_token)
    assert is_nil(Accounts.get_user_by_email("bad-email"))
  end

  test "login sets the session and returns viewer", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email

    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(login_mutation(), %{
        "email" => user.email,
        "password" => "supersecretpass123"
      })

    assert %{
             "data" => %{
               "login" => %{
                 "viewer" => %{"email" => ^user_email},
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    assert get_session(conn, :user_token)
  end

  test "login returns typed credential errors without creating a session", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})

    conn =
      conn
      |> put_req_header_same_origin()
      |> graphql_request(login_mutation(), %{
        "email" => user.email,
        "password" => "wrong-password-123"
      })

    assert %{
             "data" => %{
               "login" => %{
                 "viewer" => nil,
                 "errors" => [
                   %{
                     "code" => "INVALID_CREDENTIALS",
                     "message" => "invalid email or password",
                     "field" => nil
                   }
                 ]
               }
             }
           } = json_response(conn, 200)

    refute get_session(conn, :user_token)
  end

  test "logout drops the current session and returns ok", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header_same_origin()
      |> graphql_request(logout_mutation())

    assert %{
             "data" => %{
               "logout" => %{
                 "ok" => true,
                 "errors" => []
               }
             }
           } = json_response(conn, 200)

    assert conn.private[:plug_session_info] == :drop

    viewer_conn =
      conn
      |> recycle()
      |> put_req_header_same_origin()

    assert %{"data" => %{"viewer" => nil}} = graphql(viewer_conn, viewer_query())
  end

  test "untrusted origins cannot use session-writing auth mutations", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})

    conn =
      conn
      |> put_req_header("origin", "https://evil.example.com")
      |> graphql_request(login_mutation(), %{
        "email" => user.email,
        "password" => "supersecretpass123"
      })

    assert %{
             "data" => %{
               "login" => %{
                 "viewer" => nil,
                 "errors" => [
                   %{
                     "code" => "INVALID_ORIGIN",
                     "message" => "cross-origin request rejected",
                     "field" => nil
                   }
                 ]
               }
             }
           } = json_response(conn, 200)

    refute get_session(conn, :user_token)
  end

  test "stale session tokens are cleared after a lookup miss", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header_same_origin()

    token = get_session(conn, :user_token)
    assert :ok = ProductCompare.Accounts.delete_user_session_token(token)

    query = """
    query {
      viewer {
        email
      }
    }
    """

    conn = post(conn, "/api/graphql", %{query: query, variables: %{}})

    assert %{"data" => %{"viewer" => nil}} = json_response(conn, 200)
    refute get_session(conn, :user_token)
  end

  test "graphql preflight returns credentialed CORS headers for trusted frontend origins", %{
    conn: conn
  } do
    conn =
      conn
      |> put_req_header("origin", "https://app.example.com")
      |> put_req_header("access-control-request-method", "POST")
      |> put_req_header("access-control-request-headers", "content-type")
      |> options("/api/graphql")

    assert response(conn, 204) == ""
    assert get_resp_header(conn, "access-control-allow-origin") == ["https://app.example.com"]
    assert get_resp_header(conn, "access-control-allow-credentials") == ["true"]

    assert get_resp_header(conn, "access-control-allow-methods") == [
             "GET,POST,PUT,PATCH,DELETE,OPTIONS"
           ]

    assert get_resp_header(conn, "access-control-allow-headers") == ["content-type"]
  end

  test "invalid bearer token does not fall back to session authentication", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})

    conn =
      conn
      |> log_in_user(user)
      |> put_req_header_same_origin()
      |> put_req_header("authorization", "Bearer definitely-invalid-token")

    query = """
    query {
      viewer {
        email
      }
    }
    """

    conn = post(conn, "/api/graphql", %{query: query, variables: %{}})

    assert %{
             "errors" => [
               %{
                 "code" => "INVALID_API_TOKEN",
                 "message" => "invalid API token"
               }
             ]
           } = json_response(conn, 401)
  end

  defp login_mutation do
    """
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        viewer {
          email
        }
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp register_mutation do
    """
    mutation Register($email: String!, $password: String!) {
      register(email: $email, password: $password) {
        viewer {
          email
        }
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp logout_mutation do
    """
    mutation Logout {
      logout {
        ok
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp viewer_query do
    """
    query {
      viewer {
        email
      }
    }
    """
  end

  defp graphql_request(conn, query, variables \\ %{}) do
    post(conn, "/api/graphql", %{query: query, variables: variables})
  end

  defp graphql(conn, query, variables \\ %{}) do
    conn
    |> graphql_request(query, variables)
    |> json_response(200)
  end
end
