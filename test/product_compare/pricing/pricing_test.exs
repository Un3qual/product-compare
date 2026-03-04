defmodule ProductCompare.PricingTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.Merchant

  describe "upsert_merchant/1" do
    test "updates existing merchant when matching domain" do
      {:ok, merchant} =
        Pricing.upsert_merchant(%{
          name: "Newegg",
          domain: "newegg.com"
        })

      {:ok, updated} =
        Pricing.upsert_merchant(%{
          name: "Newegg Marketplace",
          domain: "newegg.com"
        })

      assert updated.id == merchant.id
      assert updated.name == "Newegg Marketplace"
      assert Repo.aggregate(Merchant, :count, :id) == 1
    end

    test "updates existing merchant when matching name" do
      {:ok, merchant} =
        Pricing.upsert_merchant(%{
          name: "Best Buy",
          domain: "bestbuy.com"
        })

      {:ok, updated} =
        Pricing.upsert_merchant(%{
          name: "Best Buy",
          domain: "bestbuy.co"
        })

      assert updated.id == merchant.id
      assert updated.domain == "bestbuy.co"
      assert Repo.aggregate(Merchant, :count, :id) == 1
    end
  end

  describe "merchant product and price history workflows" do
    test "upserts merchant products and returns latest/history values", %{test: test_name} do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-product"})
      now = DateTime.utc_now() |> DateTime.truncate(:microsecond)
      one_hour_ago = DateTime.add(now, -3600, :second)
      two_hours_ago = DateTime.add(now, -7200, :second)

      {:ok, merchant} =
        Pricing.upsert_merchant(%{
          name: "Amazon",
          domain: "amazon.com"
        })

      {:ok, merchant_product} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant.id,
          product_id: product.id,
          url: "https://amazon.com/example-product",
          currency: "usd",
          external_sku: "SKU-1",
          is_active: true
        })

      {:ok, same_merchant_product} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant.id,
          product_id: product.id,
          url: "https://amazon.com/example-product",
          currency: "usd",
          external_sku: "SKU-2",
          is_active: false
        })

      assert same_merchant_product.id == merchant_product.id
      assert same_merchant_product.external_sku == "SKU-2"
      assert same_merchant_product.is_active == false
      assert same_merchant_product.currency == "USD"

      {:ok, oldest} =
        Pricing.add_price_point(%{
          merchant_product_id: merchant_product.id,
          observed_at: two_hours_ago,
          price: Decimal.new("109.99")
        })

      {:ok, tie_a} =
        Pricing.add_price_point(%{
          merchant_product_id: merchant_product.id,
          observed_at: one_hour_ago,
          price: Decimal.new("105.99")
        })

      {:ok, tie_b} =
        Pricing.add_price_point(%{
          merchant_product_id: merchant_product.id,
          observed_at: one_hour_ago,
          price: Decimal.new("104.99")
        })

      {:ok, latest} =
        Pricing.add_price_point(%{
          merchant_product_id: merchant_product.id,
          observed_at: now,
          price: Decimal.new("99.99")
        })

      assert Pricing.latest_price(merchant_product.id).id == latest.id

      history =
        Pricing.price_history(merchant_product.id, %{
          "from" => one_hour_ago,
          "to" => now
        })

      assert Enum.map(history, & &1.id) == [tie_a.id, tie_b.id, latest.id]
      assert oldest.id < tie_a.id
      assert tie_a.id < tie_b.id
    end
  end
end
