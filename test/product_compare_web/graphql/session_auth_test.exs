defmodule ProductCompareWeb.GraphQL.SessionAuthTest do
  use ProductCompareWeb.ConnCase, async: true

  import ProductCompare.Fixtures.AccountsFixtures

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
