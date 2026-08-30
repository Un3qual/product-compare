defmodule ProductCompareWeb.RuntimeConfigTest do
  use ExUnit.Case, async: true

  alias ProductCompareWeb.RuntimeConfig

  test "default_trusted_origins/2 keeps local frontend defaults outside prod" do
    assert RuntimeConfig.default_trusted_origins(:dev, nil) == [
             "http://127.0.0.1:5173",
             "http://localhost:5173"
           ]
  end

  test "default_trusted_origins/2 derives the frontend origin from an api host in prod" do
    assert RuntimeConfig.default_trusted_origins(:prod, "api.example.com") == [
             "https://app.example.com"
           ]
  end

  test "default_trusted_origins/2 preserves non-api frontend hosts in prod" do
    assert RuntimeConfig.default_trusted_origins(:prod, "example.com") == [
             "https://example.com"
           ]
  end

  test "default_trusted_origins/2 preserves IPv6 URI syntax in prod" do
    assert RuntimeConfig.default_trusted_origins(:prod, "https://[::1]:4000") == [
             "https://[::1]"
           ]
  end

  test "default_trusted_origins/2 preserves host-only bracketed IPv6 syntax in prod" do
    assert RuntimeConfig.default_trusted_origins(:prod, "[::1]:4000") == [
             "https://[::1]"
           ]
  end

  test "public_site_url!/1 requires an explicit canonical origin" do
    assert_raise ArgumentError, ~r/PUBLIC_SITE_URL/, fn ->
      RuntimeConfig.public_site_url!(nil)
    end

    assert_raise ArgumentError, ~r/PUBLIC_SITE_URL/, fn ->
      RuntimeConfig.public_site_url!("internal.service.local")
    end
  end

  test "public_site_url!/1 normalizes an explicit canonical origin" do
    assert RuntimeConfig.public_site_url!("https://shop.example.net/") ==
             "https://shop.example.net"
  end

  test "endpoint_host!/1 requires an explicit production host" do
    assert_raise ArgumentError, ~r/PHX_HOST/, fn ->
      RuntimeConfig.endpoint_host!(nil)
    end

    assert_raise ArgumentError, ~r/PHX_HOST/, fn ->
      RuntimeConfig.endpoint_host!("  ")
    end
  end

  test "endpoint_host!/1 preserves plain hosts" do
    assert RuntimeConfig.endpoint_host!("example.com") == "example.com"
  end

  test "endpoint_host!/1 strips ports from host-only inputs" do
    assert RuntimeConfig.endpoint_host!("api.example.com:4000") == "api.example.com"
  end

  test "endpoint_host!/1 normalizes full PHX_HOST URLs" do
    assert RuntimeConfig.endpoint_host!(" https://api.example.com:4000/path ") ==
             "api.example.com"
  end

  test "endpoint_host!/1 rejects values without a valid host" do
    for invalid <- ["https://", "/relative", ".example.com", "example.com/path"] do
      assert_raise ArgumentError, ~r/PHX_HOST/, fn ->
        RuntimeConfig.endpoint_host!(invalid)
      end
    end
  end

  test "session_cookie_domain/2 keeps cookies host-only without an explicit domain" do
    assert RuntimeConfig.session_cookie_domain("api.example.com", nil) == nil
  end

  test "session_cookie_domain/2 accepts an explicit configured host or parent domain" do
    assert RuntimeConfig.session_cookie_domain("api.example.com", "api.example.com") ==
             "api.example.com"

    assert RuntimeConfig.session_cookie_domain("api.example.com", ".example.com") ==
             ".example.com"
  end

  test "session_cookie_domain/2 rejects unrelated and public-suffix-like domains" do
    for invalid <- ["", ".com", ".example.net", ".api.example.com.evil"] do
      assert_raise ArgumentError, ~r/SESSION_COOKIE_DOMAIN/, fn ->
        RuntimeConfig.session_cookie_domain("api.example.com", invalid)
      end
    end
  end
end
