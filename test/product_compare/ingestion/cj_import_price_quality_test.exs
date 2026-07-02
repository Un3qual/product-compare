defmodule ProductCompare.Ingestion.CJImportPriceQualityTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.Fixtures.CJIngestionFixtures

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Ingestion.CJImportPriceQuality
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint

  describe "summary/1" do
    test "summarizes distinct CJ-linked merchant product price coverage" do
      now = ~U[2026-07-02 12:00:00Z]
      cj_source = source_fixture(%{kind: "affiliate_feed", name: "CJ", domain: "cj.com"})
      other_source = source_fixture(%{name: "Other source"})

      merchant = merchant_fixture(%{name: "CJ Merchant", domain: "cj-merchant.example"})
      second_merchant = merchant_fixture(%{name: "CJ Merchant Two", domain: "cj-two.example"})
      other_merchant = merchant_fixture(%{name: "Other Merchant", domain: "other.example"})

      merchant_source_identity_fixture(cj_source, merchant, %{
        merchant_identifier: "cj-merchant-primary"
      })

      merchant_source_identity_fixture(cj_source, merchant, %{
        merchant_identifier: "cj-merchant-duplicate"
      })

      merchant_source_identity_fixture(cj_source, second_merchant, %{
        merchant_identifier: "cj-merchant-two"
      })

      merchant_source_identity_fixture(other_source, other_merchant, %{
        merchant_identifier: "other-merchant"
      })

      priced_recent =
        merchant_product_fixture(merchant, %{
          currency: "USD",
          is_active: true,
          url: "https://merchant.example/recent"
        })

      priced_stale =
        merchant_product_fixture(merchant, %{
          currency: "usd",
          is_active: false,
          url: "https://merchant.example/stale"
        })

      unpriced =
        merchant_product_fixture(second_merchant, %{
          currency: "EUR",
          is_active: true,
          url: "https://merchant.example/unpriced"
        })

      blank_currency =
        raw_merchant_product_fixture(second_merchant, %{
          currency: "",
          is_active: true,
          url: "https://merchant.example/blank-currency"
        })

      merchant_product_fixture(other_merchant, %{
        currency: "USD",
        is_active: true,
        url: "https://other.example/ignored"
      })

      price_point_fixture(priced_recent, %{observed_at: DateTime.add(now, -2, :hour)})
      price_point_fixture(priced_stale, %{observed_at: DateTime.add(now, -10, :day)})

      assert %{
               provider: "cj",
               stale_price_hours: 168,
               merchant_product_count: 4,
               with_price_count: 2,
               without_price_count: 2,
               active_count: 3,
               inactive_count: 1,
               fresh_price_count: 1,
               stale_price_count: 1,
               currency_counts: [
                 %{currency: "USD", merchant_product_count: 2},
                 %{currency: "EUR", merchant_product_count: 1},
                 %{currency: "unknown", merchant_product_count: 1}
               ]
             } = summary = CJImportPriceQuality.summary(now: now)

      assert unpriced.id != blank_currency.id
      assert_safe_summary(summary)
    end

    test "normalizes stale price thresholds" do
      now = ~U[2026-07-02 12:00:00Z]

      assert %{stale_price_hours: 168} = CJImportPriceQuality.summary(now: now)

      assert %{stale_price_hours: 1} =
               CJImportPriceQuality.summary(now: now, stale_price_hours: 0)

      assert %{stale_price_hours: 168} =
               CJImportPriceQuality.summary(now: now, stale_price_hours: "bad")

      assert %{stale_price_hours: 168} = CJImportPriceQuality.summary(["not-an-option"])

      assert %{stale_price_hours: 24} =
               CJImportPriceQuality.summary(%{"now" => now, "stale_price_hours" => 24})
    end
  end

  defp merchant_fixture(attrs) do
    suffix = System.unique_integer([:positive])

    attrs =
      Map.merge(
        %{
          name: "Merchant #{suffix}",
          domain: "merchant-#{suffix}.example"
        },
        attrs
      )

    %Merchant{}
    |> Merchant.changeset(attrs)
    |> Repo.insert!()
  end

  defp merchant_source_identity_fixture(source, merchant, attrs) do
    suffix = System.unique_integer([:positive])

    attrs =
      Map.merge(
        %{
          source_id: source.id,
          merchant_id: merchant.id,
          merchant_identifier: "merchant-#{suffix}",
          merchant_name: merchant.name,
          merchant_domain: merchant.domain,
          last_seen_at: ~U[2026-07-01 12:00:00Z]
        },
        attrs
      )

    %MerchantSourceIdentity{}
    |> MerchantSourceIdentity.changeset(attrs)
    |> Repo.insert!()
  end

  defp merchant_product_fixture(merchant, attrs) do
    %MerchantProduct{}
    |> MerchantProduct.changeset(merchant_product_attrs(merchant, attrs))
    |> Repo.insert!()
  end

  defp raw_merchant_product_fixture(merchant, attrs) do
    %MerchantProduct{}
    |> struct(merchant_product_attrs(merchant, attrs))
    |> Repo.insert!()
  end

  defp merchant_product_attrs(merchant, attrs) do
    attrs
    |> Map.put_new(:merchant_id, merchant.id)
    |> Map.put_new(:product_id, SpecsFixtures.product_fixture().id)
    |> Map.put_new(:external_sku, "sku-#{System.unique_integer([:positive])}")
    |> Map.put_new(:last_seen_at, ~U[2026-07-01 12:00:00.000000Z])
  end

  defp price_point_fixture(merchant_product, attrs) do
    attrs =
      Map.merge(
        %{
          merchant_product_id: merchant_product.id,
          observed_at: ~U[2026-07-01 12:00:00Z],
          price: Decimal.new("10.00"),
          shipping: Decimal.new("0.00"),
          in_stock: true
        },
        attrs
      )

    %PricePoint{}
    |> PricePoint.changeset(attrs)
    |> Repo.insert!()
  end

  defp assert_safe_summary(summary) do
    keys = summary |> Map.keys() |> MapSet.new()

    assert MapSet.disjoint?(
             keys,
             MapSet.new([:url, :raw_json, :raw_metadata, :tracking_params, :provider_payload])
           )

    Enum.each(summary.currency_counts, fn row ->
      row_keys = row |> Map.keys() |> MapSet.new()
      assert MapSet.disjoint?(row_keys, MapSet.new([:url, :raw_json, :raw_metadata]))
    end)
  end
end
