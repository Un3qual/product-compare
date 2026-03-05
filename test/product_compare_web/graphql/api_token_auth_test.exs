defmodule ProductCompareWeb.GraphQL.ApiTokenAuthTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompare.Accounts
  import ProductCompare.Fixtures.AccountsFixtures

  describe "/api/graphql authentication and token lifecycle" do
    test "viewer is nil without bearer token", %{conn: conn} do
      query = """
      query {
        viewer {
          id
          email
        }
      }
      """

      assert %{"data" => %{"viewer" => nil}} = graphql(conn, query)
    end

    test "authorized viewer and token lifecycle flow", %{conn: conn} do
      user = user_fixture()

      assert {:ok, %{plain_text_token: bootstrap_token}} =
               Accounts.create_api_token(user.id, %{label: "bootstrap"})

      authed_conn = put_req_header(conn, "authorization", "Bearer #{bootstrap_token}")

      viewer_query = """
      query {
        viewer {
          id
          email
        }
      }
      """

      assert %{
               "data" => %{
                 "viewer" => %{
                   "id" => viewer_id,
                   "email" => viewer_email
                 }
               }
             } = graphql(authed_conn, viewer_query)

      assert viewer_id == relay_id("User", Accounts.get_user!(user.id).entropy_id)
      assert viewer_email == user.email

      create_token_mutation = """
      mutation CreateApiToken($label: String!) {
        createApiToken(label: $label) {
          plainTextToken
          apiToken {
            id
            label
            tokenPrefix
            revokedAt
          }
        }
      }
      """

      assert %{
               "data" => %{
                 "createApiToken" => %{
                   "plainTextToken" => plain_text_token,
                   "apiToken" => %{
                     "id" => token_id,
                     "label" => "CLI",
                     "tokenPrefix" => token_prefix,
                     "revokedAt" => nil
                   }
                 }
               }
             } = graphql(authed_conn, create_token_mutation, %{"label" => "CLI"})

      assert token_prefix == String.slice(plain_text_token, 0, 12)
      assert {:ok, authed_user, _api_token} = Accounts.authenticate_api_token(plain_text_token)
      assert authed_user.id == user.id

      list_tokens_query = """
      query ListTokens($first: Int, $after: String) {
        myApiTokens(first: $first, after: $after) {
          edges {
            cursor
            node {
              id
              label
              revokedAt
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
      """

      # Create more tokens to assert deterministic ordering through connection edges.
      assert {:ok, %{api_token: _oldest_token}} =
               Accounts.create_api_token(user.id, %{label: "oldest"})

      assert {:ok, %{api_token: _newest_token}} =
               Accounts.create_api_token(user.id, %{label: "newest"})

      [first_expected_token | remaining_expected_tokens] = Accounts.list_api_tokens(user.id)

      assert %{
               "data" => %{
                 "myApiTokens" => %{
                   "edges" => [
                     %{
                       "cursor" => first_cursor,
                       "node" => %{
                         "id" => first_id,
                         "label" => first_label,
                         "revokedAt" => nil
                       }
                     }
                   ],
                   "pageInfo" => %{
                     "hasNextPage" => true,
                     "hasPreviousPage" => false,
                     "startCursor" => first_start_cursor,
                     "endCursor" => first_end_cursor
                   }
                 }
               }
             } = graphql(authed_conn, list_tokens_query, %{"first" => 1})

      assert first_cursor == first_start_cursor
      assert first_cursor == first_end_cursor
      assert first_id == relay_id("ApiToken", first_expected_token.entropy_id)
      assert first_label == first_expected_token.label

      assert %{
               "data" => %{
                 "myApiTokens" => %{
                   "edges" => remaining_edges,
                   "pageInfo" => %{
                     "hasNextPage" => false,
                     "hasPreviousPage" => true
                   }
                 }
               }
             } =
               graphql(authed_conn, list_tokens_query, %{"first" => 10, "after" => first_cursor})

      remaining_labels = Enum.map(remaining_edges, &get_in(&1, ["node", "label"]))
      assert remaining_labels == Enum.map(remaining_expected_tokens, & &1.label)

      assert Enum.map(remaining_edges, &get_in(&1, ["node", "id"])) ==
               Enum.map(remaining_expected_tokens, &relay_id("ApiToken", &1.entropy_id))

      assert token_id == relay_id("ApiToken", find_token_by_label(user.id, "CLI").entropy_id)

      revoke_token_mutation = """
      mutation RevokeToken($tokenId: ID!) {
        revokeApiToken(tokenId: $tokenId) {
          id
          revokedAt
        }
      }
      """

      assert %{
               "data" => %{
                 "revokeApiToken" => %{
                   "id" => ^token_id,
                   "revokedAt" => revoked_at
                 }
               }
             } = graphql(authed_conn, revoke_token_mutation, %{"tokenId" => token_id})

      assert is_binary(revoked_at)
      assert :error = Accounts.authenticate_api_token(plain_text_token)
    end

    test "createApiToken requires authentication", %{conn: conn} do
      mutation = """
      mutation {
        createApiToken {
          plainTextToken
        }
      }
      """

      response = graphql(conn, mutation)

      assert %{
               "data" => %{"createApiToken" => nil},
               "errors" => [%{"message" => "unauthorized"} | _]
             } =
               response
    end
  end

  defp graphql(conn, query, variables \\ %{}) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end

  defp relay_id(type, entropy_id), do: Base.encode64("#{type}:#{entropy_id}")

  defp find_token_by_label(user_id, label) do
    user_id
    |> Accounts.list_api_tokens()
    |> Enum.find(&(&1.label == label))
  end
end
