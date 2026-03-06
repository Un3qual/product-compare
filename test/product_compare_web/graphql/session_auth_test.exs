defmodule ProductCompareWeb.GraphQL.SessionAuthTest do
  use ProductCompareWeb.ConnCase, async: true

  import ProductCompare.Fixtures.AccountsFixtures

  test "viewer resolves from session without bearer token", %{conn: conn} do
    user = user_fixture(%{password: "supersecretpass123"})
    user_email = user.email

    conn = log_in_user(conn, user)

    query = """
    query {
      viewer {
        email
      }
    }
    """

    assert %{"data" => %{"viewer" => %{"email" => ^user_email}}} = graphql(conn, query)
  end

  defp graphql(conn, query, variables \\ %{}) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end
end
