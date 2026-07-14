defmodule ProductCompare.CommerceAttribution.DestinationUrlTest do
  use ExUnit.Case, async: true

  alias ProductCompare.CommerceAttribution.DestinationUrl
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink

  @accepted_urls [
    "https://123.example.com/offer",
    "https://%65xample.com/offer",
    "https://merchant.example.com\\deal",
    "https://münich.example/offer",
    "https://134744072/offer"
  ]

  @rejected_urls [
    "http://[0:0:0:0:0:0:0:1]/",
    "http://[0:0:0:0:0:ffff:7f00:1]/",
    "http://[0:0:0:0:0:ffff:a9fe:a9fe]/",
    "http://2130706433/",
    "http://0x7f000001/",
    "http://017700000001/",
    "http://127.1/",
    "http://１２７.０.０.１/",
    "http://127。0。0。1/",
    "http://127．0．0．1/",
    "http://127｡0｡0｡1/",
    "https://affiliate.example.com:abc/click",
    "https://affiliate.example.com:99999/click",
    "http://%31%32%37.0.0.1/offer"
  ]

  test "owns the characterized destination URL policy behind the schema compatibility API" do
    for url <- @accepted_urls do
      assert DestinationUrl.valid?(url)
      assert CommerceLink.valid_destination_url?(url) == DestinationUrl.valid?(url)
    end

    for url <- @rejected_urls do
      refute DestinationUrl.valid?(url)
      assert CommerceLink.valid_destination_url?(url) == DestinationUrl.valid?(url)
    end

    for value <- [nil, 123, %{}, []] do
      refute DestinationUrl.valid?(value)
      assert CommerceLink.valid_destination_url?(value) == DestinationUrl.valid?(value)
    end
  end
end
