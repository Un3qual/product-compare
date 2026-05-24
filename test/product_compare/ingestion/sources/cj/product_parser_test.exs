defmodule ProductCompare.Ingestion.Sources.CJ.ProductParserTest do
  use ExUnit.Case, async: true

  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Ingestion.Sources.Adapter
  alias ProductCompare.Ingestion.Sources.CJ.ProductParser

  describe "adapter contract" do
    test "implements the source adapter behavior" do
      assert ProductParser.module_info(:attributes)[:behaviour] == [Adapter]
      assert function_exported?(ProductParser, :fetch_batch, 2)
      assert function_exported?(ProductParser, :normalize, 1)
    end
  end

  describe "normalize/1" do
    test "normalizes a CJ product fixture into a listing contract" do
      [record | _] = product_search_fixture()

      assert {:ok,
              %NormalizedListing{
                source: :cj,
                external_product_id: "CJ-12345",
                merchant_identifier: "924501",
                product_title: "Acme Trail Running Shoe",
                brand_name: "Acme",
                gtin: "00012345678905",
                merchant_name: "Trail Shop",
                merchant_domain: "trail.example",
                listing_url: "https://trail.example/products/acme-trail-shoe",
                currency: "USD",
                amount: amount,
                availability: :in_stock,
                observed_at: observed_at,
                raw_payload: ^record
              }} = ProductParser.normalize(record)

      assert Decimal.equal?(amount, Decimal.new("129.99"))
      assert observed_at == ~U[2026-05-23 15:00:00Z]
    end

    test "accepts numeric price values and non-UTC timestamp offsets" do
      [record | _] = product_search_fixture()

      record =
        record
        |> Map.put("price", 129.99)
        |> Map.put("lastUpdated", "2026-05-23T15:00:00-05:00")

      assert {:ok, %NormalizedListing{amount: amount, observed_at: observed_at}} =
               ProductParser.normalize(record)

      assert Decimal.equal?(amount, Decimal.new("129.99"))
      assert observed_at == ~U[2026-05-23 20:00:00Z]
    end

    test "returns deterministic mapping errors for malformed records" do
      assert {:error, %{reason: :missing_required_field, field: :external_product_id}} =
               ProductParser.normalize(%{
                 "advertiserId" => "924501",
                 "advertiserName" => "Trail Shop",
                 "buyUrl" => "https://trail.example/products/missing-id",
                 "currency" => "USD",
                 "name" => "Missing ID",
                 "price" => "19.99"
               })

      assert {:error, %{reason: :invalid_decimal, field: :amount}} =
               ProductParser.normalize(%{
                 "adId" => "CJ-BAD-PRICE",
                 "advertiserId" => "924501",
                 "advertiserName" => "Trail Shop",
                 "buyUrl" => "https://trail.example/products/bad-price",
                 "currency" => "USD",
                 "name" => "Bad Price",
                 "price" => "free"
               })
    end
  end

  defp product_search_fixture do
    __DIR__
    |> Path.join("../../../../support/fixtures/cj/product_search_sample.json")
    |> Path.expand()
    |> File.read!()
    |> Jason.decode!()
    |> Map.fetch!("products")
  end
end
