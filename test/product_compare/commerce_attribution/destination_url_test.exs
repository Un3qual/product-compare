defmodule ProductCompare.CommerceAttribution.DestinationUrlTest do
  use ExUnit.Case, async: true

  alias ProductCompare.CommerceAttribution.DestinationUrl
  alias ProductCompare.CommerceAttribution.DestinationUrl.Parser
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

  test "accepts browser-normalized public IDNA hostnames" do
    for url <- [
          "https://merchant。example.com/offer",
          "https://xn--mnich-kva.example/offer",
          "https://%4D%45%52%43%48%41%4E%54.example.com/offer",
          "https://MERCHANT.EXAMPLE.COM:443/offer",
          "http://8.8.8.8/offer",
          "http://[2606:4700:4700::1111]/offer"
        ] do
      assert DestinationUrl.valid?(url)
    end
  end

  test "canonicalizes an uppercase ASCII hostname to lowercase" do
    assert {:ok, "merchant.example.com"} =
             Parser.canonical_http_hostname("https://MERCHANT.EXAMPLE.COM:443/offer")
  end

  test "canonicalizes equivalent Unicode and A-label hostnames case-insensitively" do
    for hostname <- [
          "münich.example",
          "MÜNICH.example",
          "xn--mnich-kva.example",
          "XN--MNICH-KVA.example"
        ] do
      assert {:ok, "xn--mnich-kva.example"} =
               Parser.canonical_http_hostname("https://#{hostname}/offer")
    end
  end

  test "rejects forbidden IDNA code points without raising" do
    for url <- [
          "https://a\u{200D}b.example/offer",
          "https://example..com/offer",
          "https://#{String.duplicate("a", 64)}.example/offer"
        ] do
      assert DestinationUrl.valid?(url) == false
    end
  end

  test "rejects an overlong IDNA domain without raising" do
    overlong_domain = Enum.map_join(1..4, ".", fn _ -> String.duplicate("a", 63) end)

    assert DestinationUrl.valid?("https://#{overlong_domain}/offer") == false
  end

  test "keeps userinfo and non-public IP literals outside the IDNA boundary" do
    for url <- [
          "https://user@merchant.example/offer",
          "http://127.0.0.1/offer",
          "http://[::1]/offer",
          "http://203.0.113.1/offer"
        ] do
      assert DestinationUrl.valid?(url) == false
    end
  end

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
