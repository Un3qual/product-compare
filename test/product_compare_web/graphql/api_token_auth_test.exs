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

      assert viewer_id == Accounts.get_user!(user.id).entropy_id
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
      query {
        myApiTokens {
          id
          label
          revokedAt
        }
      }
      """

      assert %{"data" => %{"myApiTokens" => tokens}} = graphql(authed_conn, list_tokens_query)
      assert Enum.any?(tokens, &(&1["id"] == token_id && &1["label"] == "CLI"))

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
end
