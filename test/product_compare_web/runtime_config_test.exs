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

  test "endpoint_host/1 falls back to example.com for nil" do
    assert RuntimeConfig.endpoint_host(nil) == "example.com"
  end

  test "endpoint_host/1 preserves plain hosts" do
    assert RuntimeConfig.endpoint_host("example.com") == "example.com"
  end

  test "endpoint_host/1 strips ports from host-only inputs" do
    assert RuntimeConfig.endpoint_host("api.example.com:4000") == "api.example.com"
  end

  test "endpoint_host/1 normalizes full PHX_HOST URLs" do
    assert RuntimeConfig.endpoint_host(" https://api.example.com:4000/path ") == "api.example.com"
    assert RuntimeConfig.endpoint_host("  ") == "example.com"
  end
end
