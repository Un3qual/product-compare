defmodule ProductCompareWeb.Plugs.PutAbsintheContextTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompareWeb.Plugs.PutAbsintheContext

  describe "call/2" do
    test "adds a dataloader while preserving auth and request context", %{conn: conn} do
      current_user = %{id: 123, email: "user@example.com"}
      api_token = %{id: "token-123", label: "CLI"}

      conn =
        conn
        |> init_test_session(%{user_token: "session-user-token"})
        |> put_req_header_same_origin()
        |> assign(:current_user, current_user)
        |> assign(:api_token, api_token)
        |> PutAbsintheContext.call(%{})

      assert %{
               context: %{
                 current_user: ^current_user,
                 api_token: ^api_token,
                 session_user_token: "session-user-token",
                 trusted_request_origin?: true,
                 loader: loader
               }
             } = conn.private[:absinthe]

      assert %Dataloader{} = loader
    end
  end
end
