defmodule ProductCompareWeb.Plugs.PutAbsintheContextTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompareWeb.CommerceAttribution.RequestDiagnostics
  alias ProductCompareWeb.Plugs.PutAbsintheContext

  describe "call/2" do
    test "adds a dataloader while preserving auth and request context", %{conn: conn} do
      current_user = %{id: 123, email: "user@example.com"}
      api_token = %{id: "token-123", label: "CLI"}

      conn =
        conn
        |> init_test_session(%{user_token: "session-user-token"})
        |> put_req_header_same_origin()
        |> put_req_header("referer", "https://app.example.com/products/desk")
        |> put_req_header("user-agent", "ProductCompareTest/1.0")
        |> assign(:current_user, current_user)
        |> assign(:api_token, api_token)
        |> then(&%{&1 | remote_ip: {203, 0, 113, 42}})
        |> PutAbsintheContext.call(%{})

      assert %{
               context: %{
                 current_user: ^current_user,
                 api_token: ^api_token,
                 session_user_token: "session-user-token",
                 trusted_request_origin?: true,
                 request_diagnostics: %{
                   referrer: "https://app.example.com/products/desk",
                   user_agent: "ProductCompareTest/1.0",
                   ip_address: "203.0.113.42"
                 },
                 loader: loader
               }
             } = conn.private[:absinthe]

      assert %Dataloader{} = loader
    end
  end

  describe "request diagnostics" do
    test "captures raw browser headers and formats Phoenix-resolved IPv6 addresses", %{conn: conn} do
      diagnostics =
        conn
        |> put_req_header("referer", "https://app.example.com/products/desk")
        |> put_req_header("user-agent", "ProductCompareTest/1.0")
        |> then(&%{&1 | remote_ip: {8193, 3512, 0, 0, 0, 0, 0, 1}})
        |> RequestDiagnostics.from_conn()

      assert diagnostics == %{
               referrer: "https://app.example.com/products/desk",
               user_agent: "ProductCompareTest/1.0",
               ip_address: "2001:db8::1"
             }
    end

    test "omits unavailable headers and ignores forwarding headers", %{conn: conn} do
      diagnostics =
        conn
        |> put_req_header("x-forwarded-for", "198.51.100.19")
        |> then(&%{&1 | remote_ip: {203, 0, 113, 42}})
        |> RequestDiagnostics.from_conn()

      assert diagnostics == %{ip_address: "203.0.113.42"}
    end
  end
end
