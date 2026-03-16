defmodule ProductCompareWeb.EndpointTest do
  use ExUnit.Case, async: false

  setup do
    endpoint_config = Application.get_env(:product_compare, ProductCompareWeb.Endpoint, [])

    on_exit(fn ->
      Application.put_env(:product_compare, ProductCompareWeb.Endpoint, endpoint_config)
    end)

    {:ok, endpoint_config: endpoint_config}
  end

  test "session_options/0 merges runtime-configured cookie options", %{
    endpoint_config: endpoint_config
  } do
    Application.put_env(
      :product_compare,
      ProductCompareWeb.Endpoint,
      Keyword.put(endpoint_config, :session_options, domain: ".example.com", secure: true)
    )

    session_options = ProductCompareWeb.Endpoint.session_options()

    assert session_options[:domain] == ".example.com"
    assert session_options[:secure] == true
    assert session_options[:same_site] == "Lax"
  end

  test "session_options/0 falls back to the base cookie configuration", %{
    endpoint_config: endpoint_config
  } do
    Application.put_env(
      :product_compare,
      ProductCompareWeb.Endpoint,
      Keyword.delete(endpoint_config, :session_options)
    )

    session_options = ProductCompareWeb.Endpoint.session_options()

    refute Keyword.has_key?(session_options, :domain)
    refute Keyword.has_key?(session_options, :secure)
    assert session_options[:key] == "_product_compare_key"
    assert session_options[:same_site] == "Lax"
  end
end
