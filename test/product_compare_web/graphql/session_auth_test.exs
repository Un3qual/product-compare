defmodule ProductCompareWeb.GraphQL.SessionAuthTest do
  use ProductCompareWeb.ConnCase, async: false

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

  defp graphql(conn, query, variables \\ %{}) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end
end
