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

  describe "read APIs for graphql pricing surfaces" do
    test "list_merchants/0 returns merchants in stable id order" do
      {:ok, merchant_c} =
        Pricing.upsert_merchant(%{
          name: "C Store",
          domain: "c-store.example"
        })

      {:ok, merchant_a} =
        Pricing.upsert_merchant(%{
          name: "A Store",
          domain: "a-store.example"
        })

      {:ok, merchant_b} =
        Pricing.upsert_merchant(%{
          name: "B Store",
          domain: "b-store.example"
        })

      assert Enum.map(Pricing.list_merchants(), & &1.id) == [
               merchant_c.id,
               merchant_a.id,
               merchant_b.id
             ]
    end

    test "get_merchant/1 and get_merchant_product/1 only accept positive integer ids" do
      oversized_id = 9_223_372_036_854_775_808

      assert_raise FunctionClauseError, fn -> Pricing.get_merchant(0) end
      assert_raise FunctionClauseError, fn -> Pricing.get_merchant(-1) end
      assert_raise FunctionClauseError, fn -> Pricing.get_merchant(oversized_id) end
      assert_raise FunctionClauseError, fn -> Pricing.get_merchant_product(0) end
      assert_raise FunctionClauseError, fn -> Pricing.get_merchant_product(-1) end
      assert_raise FunctionClauseError, fn -> Pricing.get_merchant_product(oversized_id) end
    end

    test "list_merchant_products/1 filters by product and optional merchant/active flags", %{
      test: test_name
    } do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-product"})
      other_product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-other-product"})

      {:ok, merchant_a} =
        Pricing.upsert_merchant(%{name: "Merchant A", domain: "merchant-a.example"})

      {:ok, merchant_b} =
        Pricing.upsert_merchant(%{name: "Merchant B", domain: "merchant-b.example"})

      {:ok, matching_a_active} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant_a.id,
          product_id: product.id,
          url: "https://merchant-a.example/#{test_name}",
          currency: "USD",
          is_active: true
        })

      {:ok, matching_b_inactive} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant_b.id,
          product_id: product.id,
          url: "https://merchant-b.example/#{test_name}",
          currency: "USD",
          is_active: false
        })

      {:ok, _other_product_entry} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant_a.id,
          product_id: other_product.id,
          url: "https://merchant-a.example/#{test_name}/other",
          currency: "USD",
          is_active: true
        })

      assert Enum.map(Pricing.list_merchant_products(%{product_id: product.id}), & &1.id) == [
               matching_a_active.id,
               matching_b_inactive.id
             ]

      assert Enum.map(
               Pricing.list_merchant_products(%{
                 product_id: product.id,
                 merchant_id: merchant_b.id
               }),
               & &1.id
             ) ==
               [matching_b_inactive.id]

      assert Enum.map(
               Pricing.list_merchant_products(%{product_id: product.id, active_only: true}),
               & &1.id
             ) ==
               [matching_a_active.id]
    end

    test "merchant-product read paths preload associations only where expected", %{
      test: test_name
    } do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-product"})

      {:ok, merchant} =
        Pricing.upsert_merchant(%{
          name: "Preload Merchant",
          domain: "preload-merchant.example"
        })

      {:ok, merchant_product} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant.id,
          product_id: product.id,
          url: "https://preload-merchant.example/#{test_name}",
          currency: "USD",
          is_active: true
        })

      assert Pricing.get_merchant!(merchant.id).id == merchant.id

      loaded_from_get = Pricing.get_merchant_product!(merchant_product.id)
      assert Ecto.assoc_loaded?(loaded_from_get.merchant)
      assert Ecto.assoc_loaded?(loaded_from_get.product)
      assert loaded_from_get.merchant.id == merchant.id
      assert loaded_from_get.product.id == product.id

      loaded_from_optional_get = Pricing.get_merchant_product(merchant_product.id)
      refute Ecto.assoc_loaded?(loaded_from_optional_get.merchant)
      refute Ecto.assoc_loaded?(loaded_from_optional_get.product)
      assert loaded_from_optional_get.merchant_id == merchant.id
      assert loaded_from_optional_get.product_id == product.id

      loaded_from_list = Pricing.list_merchant_products(%{product_id: product.id})

      assert Enum.all?(
               loaded_from_list,
               &(Ecto.assoc_loaded?(&1.merchant) and Ecto.assoc_loaded?(&1.product))
             )
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
