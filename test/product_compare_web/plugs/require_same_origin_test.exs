defmodule ProductCompareWeb.Plugs.RequireSameOriginTest do
  use ExUnit.Case, async: false

  import Plug.Conn
  import Plug.Test

  alias ProductCompareWeb.Endpoint
  alias ProductCompareWeb.Plugs.RequireSameOrigin

  setup do
    endpoint_config = Application.get_env(:product_compare, Endpoint, [])

    on_exit(fn ->
      Application.put_env(:product_compare, Endpoint, endpoint_config)
    end)

    {:ok, endpoint_config: endpoint_config}
  end

  test "rejects a forged request host even when Origin matches it", %{
    endpoint_config: endpoint_config
  } do
    configure_url(endpoint_config, scheme: "https", host: "api.example.com", port: 443)

    conn =
      :post
      |> conn("https://attacker.example/api/graphql")
      |> put_req_header("origin", "https://attacker.example")
      |> RequireSameOrigin.call([])

    assert conn.halted
    assert conn.status == 403
  end

  test "accepts the configured endpoint origin independently of the request host", %{
    endpoint_config: endpoint_config
  } do
    configure_url(endpoint_config, scheme: "https", host: "api.example.com", port: 443)

    conn =
      :post
      |> conn("https://attacker.example/api/graphql")
      |> put_req_header("origin", "https://api.example.com")
      |> RequireSameOrigin.call([])

    refute conn.halted
  end

  test "includes a configured non-default endpoint port", %{endpoint_config: endpoint_config} do
    configure_url(endpoint_config, scheme: "https", host: "api.example.com", port: 4443)

    conn = conn(:post, "https://attacker.example/api/graphql")

    assert RequireSameOrigin.allowed_origins(conn) == ["https://api.example.com:4443"]
  end

  test "keeps explicitly trusted origins as additional exact origins", %{
    endpoint_config: endpoint_config
  } do
    endpoint_config =
      endpoint_config
      |> Keyword.put(:url, scheme: "https", host: "api.example.com", port: 443)
      |> Keyword.put(:trusted_origins, ["https://app.example.com/"])

    Application.put_env(:product_compare, Endpoint, endpoint_config)

    assert RequireSameOrigin.allowed_origins(conn(:post, "/api/graphql")) == [
             "https://api.example.com",
             "https://app.example.com"
           ]
  end

  defp configure_url(endpoint_config, url) do
    Application.put_env(
      :product_compare,
      Endpoint,
      endpoint_config
      |> Keyword.put(:url, url)
      |> Keyword.put(:trusted_origins, [])
    )
  end
end
