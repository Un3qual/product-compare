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
          errors {
            code
            message
            field
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
                   },
                   "errors" => []
                 }
               }
             } = graphql(authed_conn, create_token_mutation, %{"label" => "CLI"})

      expected_prefix =
        :crypto.hash(:sha3_256, plain_text_token)
        |> Base.encode16(case: :lower)
        |> binary_part(0, 12)

      assert token_prefix == expected_prefix
      refute token_prefix == String.slice(plain_text_token, 0, 12)
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
          apiToken {
            id
            revokedAt
          }
          errors {
            code
            message
            field
          }
        }
      }
      """

      assert %{
               "data" => %{
                 "revokeApiToken" => %{
                   "apiToken" => %{
                     "id" => ^token_id,
                     "revokedAt" => revoked_at
                   },
                   "errors" => []
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
          errors {
            code
            message
          }
        }
      }
      """

      response = graphql(conn, mutation)

      assert %{
               "data" => %{
                 "createApiToken" => %{
                   "plainTextToken" => nil,
                   "errors" => [
                     %{"code" => "UNAUTHORIZED", "message" => "unauthorized"}
                   ]
                 }
               }
             } =
               response
    end

    test "myApiTokens supports active/revoked/all filters", %{conn: conn} do
      user = user_fixture()

      assert {:ok, %{plain_text_token: bootstrap_token}} =
               Accounts.create_api_token(user.id, %{label: "bootstrap"})

      assert {:ok, %{api_token: active_token}} =
               Accounts.create_api_token(user.id, %{label: "active"})

      assert {:ok, %{api_token: revoked_token}} =
               Accounts.create_api_token(user.id, %{label: "revoked"})

      assert {:ok, _revoked} = Accounts.revoke_api_token(user.id, revoked_token.entropy_id)

      expired_at =
        DateTime.utc_now()
        |> DateTime.add(-60, :second)
        |> DateTime.truncate(:microsecond)

      assert {:ok, %{api_token: expired_token}} =
               Accounts.create_api_token(user.id, %{label: "expired", expires_at: expired_at})

      authed_conn = put_req_header(conn, "authorization", "Bearer #{bootstrap_token}")

      query = """
      query ListFilteredTokens($status: ApiTokenStatusFilter) {
        myApiTokens(status: $status, first: 50) {
          edges {
            node {
              id
              label
              revokedAt
            }
          }
        }
      }
      """

      assert %{"data" => %{"myApiTokens" => %{"edges" => all_edges}}} =
               graphql(authed_conn, query, %{"status" => "ALL"})

      assert Enum.map(all_edges, &get_in(&1, ["node", "id"])) ==
               Enum.map(
                 [
                   expired_token,
                   revoked_token,
                   active_token,
                   find_token_by_label(user.id, "bootstrap")
                 ],
                 &relay_id("ApiToken", &1.entropy_id)
               )

      assert %{"data" => %{"myApiTokens" => %{"edges" => active_edges}}} =
               graphql(authed_conn, query, %{"status" => "ACTIVE"})

      assert Enum.sort(Enum.map(active_edges, &get_in(&1, ["node", "label"]))) == [
               "active",
               "bootstrap"
             ]

      assert %{"data" => %{"myApiTokens" => %{"edges" => revoked_edges}}} =
               graphql(authed_conn, query, %{"status" => "REVOKED"})

      assert Enum.map(revoked_edges, &get_in(&1, ["node", "label"])) == ["revoked"]
    end

    test "myApiTokens rejects invalid cursor input", %{conn: conn} do
      user = user_fixture()

      assert {:ok, %{plain_text_token: bootstrap_token}} =
               Accounts.create_api_token(user.id, %{label: "bootstrap"})

      authed_conn = put_req_header(conn, "authorization", "Bearer #{bootstrap_token}")

      query = """
      query InvalidCursor($after: String) {
        myApiTokens(first: 10, after: $after) {
          edges {
            node {
              id
            }
          }
        }
      }
      """

      assert %{
               "data" => nil,
               "errors" => [%{"message" => "invalid cursor", "path" => ["myApiTokens"]} | _]
             } = graphql(authed_conn, query, %{"after" => "not-a-valid-cursor"})
    end

    test "rotateApiToken revokes old token and returns replacement", %{conn: conn} do
      user = user_fixture()

      assert {:ok, %{plain_text_token: bootstrap_token}} =
               Accounts.create_api_token(user.id, %{label: "bootstrap"})

      assert {:ok, %{plain_text_token: old_plain_text_token, api_token: old_token}} =
               Accounts.create_api_token(user.id, %{label: "old-label"})

      authed_conn = put_req_header(conn, "authorization", "Bearer #{bootstrap_token}")
      old_token_id = relay_id("ApiToken", old_token.entropy_id)

      mutation = """
      mutation RotateApiToken($tokenId: ID!, $label: String) {
        rotateApiToken(tokenId: $tokenId, label: $label) {
          plainTextToken
          apiToken {
            id
            label
            revokedAt
          }
          errors {
            code
            message
            field
          }
        }
      }
      """

      assert %{
               "data" => %{
                 "rotateApiToken" => %{
                   "plainTextToken" => new_plain_text_token,
                   "apiToken" => %{
                     "id" => new_token_id,
                     "label" => "rotated-label",
                     "revokedAt" => nil
                   },
                   "errors" => []
                 }
               }
             } =
               graphql(authed_conn, mutation, %{
                 "tokenId" => old_token_id,
                 "label" => "rotated-label"
               })

      refute new_token_id == old_token_id
      assert :error = Accounts.authenticate_api_token(old_plain_text_token)

      assert {:ok, authed_user, _api_token} =
               Accounts.authenticate_api_token(new_plain_text_token)

      assert authed_user.id == user.id
    end

    test "token mutations reject raw UUID token IDs", %{conn: conn} do
      user = user_fixture()

      assert {:ok, %{plain_text_token: bootstrap_token}} =
               Accounts.create_api_token(user.id, %{label: "bootstrap"})

      assert {:ok, %{api_token: token}} =
               Accounts.create_api_token(user.id, %{label: "raw-uuid-token"})

      authed_conn = put_req_header(conn, "authorization", "Bearer #{bootstrap_token}")

      mutation = """
      mutation RevokeToken($tokenId: ID!) {
        revokeApiToken(tokenId: $tokenId) {
          apiToken {
            id
          }
          errors {
            code
            message
            field
          }
        }
      }
      """

      assert %{
               "data" => %{
                 "revokeApiToken" => %{
                   "apiToken" => nil,
                   "errors" => [
                     %{
                       "code" => "INVALID_ID",
                       "field" => "tokenId",
                       "message" => "invalid token id"
                     }
                   ]
                 }
               }
             } = graphql(authed_conn, mutation, %{"tokenId" => token.entropy_id})
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
