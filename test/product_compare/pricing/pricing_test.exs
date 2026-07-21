defmodule ProductCompare.PricingTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Pricing.OfferTruth
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

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

    test "batch merchant slug lookup preserves singular results with a fixed query budget" do
      merchants =
        Enum.map(1..4, fn index ->
          {:ok, merchant} =
            Pricing.upsert_merchant(%{
              name: "Batch Slug Merchant #{index}",
              domain: "batch-slug-merchant-#{index}.example"
            })

          merchant
        end)

      slugs = Enum.map(merchants, & &1.slug)

      {initial_results, initial_queries} =
        capture_select_queries(fn -> Pricing.get_merchants_by_slugs(Enum.take(slugs, 2)) end)

      {grown_results, grown_queries} =
        capture_select_queries(fn ->
          Pricing.get_merchants_by_slugs(slugs ++ ["missing-merchant", "", hd(slugs), nil, 42])
        end)

      assert [_] = initial_queries
      assert [_] = grown_queries

      Enum.each(slugs ++ ["missing-merchant", ""], fn slug ->
        assert grown_results[slug] == Pricing.get_merchant_by_slug(slug)
      end)

      assert initial_results[hd(slugs)].id == hd(merchants).id
      assert grown_results["missing-merchant"] == nil
      assert grown_results[""] == nil
      refute Map.has_key?(grown_results, nil)
      refute Map.has_key?(grown_results, 42)

      assert {empty_results, []} =
               capture_select_queries(fn -> Pricing.get_merchants_by_slugs([]) end)

      assert empty_results == %{}
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

    test "get_price_point/1 returns nil for invalid ids" do
      oversized_id = 9_223_372_036_854_775_808

      assert is_nil(Pricing.get_price_point(0))
      assert is_nil(Pricing.get_price_point(-1))
      assert is_nil(Pricing.get_price_point(oversized_id))
      assert is_nil(Pricing.get_price_point("not-an-id"))
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

  describe "product_offer_pages/3" do
    test "matches per-product offer queries across filters, offsets, and empty parents", %{
      test: test_name
    } do
      product_a = SpecsFixtures.product_fixture(%{slug: "#{test_name}-batch-product-a"})
      product_b = SpecsFixtures.product_fixture(%{slug: "#{test_name}-batch-product-b"})
      empty_product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-batch-empty"})

      {:ok, merchant_a} =
        Pricing.upsert_merchant(%{
          name: "#{test_name} Batch Merchant A",
          domain: "#{test_name}-batch-a.example"
        })

      {:ok, merchant_b} =
        Pricing.upsert_merchant(%{
          name: "#{test_name} Batch Merchant B",
          domain: "#{test_name}-batch-b.example"
        })

      for {product, merchant, suffix, active?} <- [
            {product_a, merchant_a, "a-1", true},
            {product_b, merchant_a, "b-1", true},
            {product_a, merchant_b, "a-2", false},
            {product_b, merchant_b, "b-2", false},
            {product_a, merchant_a, "a-3", true},
            {product_b, merchant_a, "b-3", true},
            {product_a, merchant_b, "a-4", true},
            {product_b, merchant_b, "b-4", true}
          ] do
        {:ok, _offer} =
          Pricing.upsert_merchant_product(%{
            merchant_id: merchant.id,
            product_id: product.id,
            url: "https://#{merchant.domain}/#{suffix}",
            currency: "USD",
            is_active: active?
          })
      end

      product_ids = [product_b.id, empty_product.id, product_a.id]

      for {filters, window} <- [
            {%{}, %{offset: 1, fetch_limit: 2}},
            {%{merchant_id: merchant_a.id}, %{offset: 0, fetch_limit: 3}},
            {%{"active_only" => true}, %{offset: 1, fetch_limit: 2}},
            {%{active_only: false}, %{offset: 0, fetch_limit: 4}}
          ] do
        expected = expected_product_offer_pages(product_ids, filters, window)

        {actual, queries} =
          capture_select_queries(fn ->
            Pricing.product_offer_pages(product_ids, filters, window)
          end)

        assert offer_ids_by_product(actual) == offer_ids_by_product(expected)
        assert Map.fetch!(actual, empty_product.id) == []
        assert [query] = queries
        assert String.contains?(query, ~s(FROM "merchant_products"))
      end
    end

    test "returns no pages and performs no query for an empty parent list" do
      {pages, queries} =
        capture_select_queries(fn ->
          Pricing.product_offer_pages([], %{active_only: true}, %{offset: 0, fetch_limit: 2})
        end)

      assert pages == %{}
      assert queries == []
    end
  end

  describe "merchant_offer_pages/2" do
    test "matches active merchant-offer queries across offsets and empty parents", %{
      test: test_name
    } do
      product_a = SpecsFixtures.product_fixture(%{slug: "#{test_name}-merchant-page-a"})
      product_b = SpecsFixtures.product_fixture(%{slug: "#{test_name}-merchant-page-b"})

      {:ok, merchant_a} =
        Pricing.upsert_merchant(%{
          name: "#{test_name} Merchant Page A",
          domain: "#{test_name}-merchant-page-a.example"
        })

      {:ok, merchant_b} =
        Pricing.upsert_merchant(%{
          name: "#{test_name} Merchant Page B",
          domain: "#{test_name}-merchant-page-b.example"
        })

      {:ok, empty_merchant} =
        Pricing.upsert_merchant(%{
          name: "#{test_name} Merchant Page Empty",
          domain: "#{test_name}-merchant-page-empty.example"
        })

      for {merchant, product, suffix, active?} <- [
            {merchant_a, product_a, "a-1", true},
            {merchant_b, product_a, "b-1", true},
            {merchant_a, product_b, "a-2", false},
            {merchant_b, product_b, "b-2", true},
            {merchant_a, product_b, "a-3", true},
            {merchant_a, product_a, "a-4", true}
          ] do
        {:ok, _offer} =
          Pricing.upsert_merchant_product(%{
            merchant_id: merchant.id,
            product_id: product.id,
            url: "https://#{merchant.domain}/#{suffix}",
            currency: "USD",
            is_active: active?
          })
      end

      missing_merchant_id = empty_merchant.id + 1_000_000
      merchant_ids = [merchant_b.id, empty_merchant.id, missing_merchant_id, merchant_a.id]

      for window <- [
            %{offset: 0, fetch_limit: 3},
            %{offset: 1, fetch_limit: 2},
            %{offset: 3, fetch_limit: 2}
          ] do
        expected = expected_merchant_offer_pages(merchant_ids, window)

        {actual, queries} =
          capture_select_queries(fn -> Pricing.merchant_offer_pages(merchant_ids, window) end)

        assert offer_ids_by_merchant(actual) == offer_ids_by_merchant(expected)
        assert Map.fetch!(actual, empty_merchant.id) == []
        assert Map.fetch!(actual, missing_merchant_id) == []
        assert [query] = queries
        assert String.contains?(query, ~s(FROM "merchant_products"))
      end
    end

    test "returns no pages and performs no query for an empty merchant list" do
      {pages, queries} =
        capture_select_queries(fn ->
          Pricing.merchant_offer_pages([], %{offset: 0, fetch_limit: 2})
        end)

      assert pages == %{}
      assert queries == []
    end
  end

  describe "price_history_pages/3" do
    test "matches descending per-offer history across range bounds, timestamp ties, and offsets",
         %{test: test_name} do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-history-product"})

      {:ok, merchant} =
        Pricing.upsert_merchant(%{
          name: "#{test_name} History Merchant",
          domain: "#{test_name}-history.example"
        })

      {:ok, offer_a} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant.id,
          product_id: product.id,
          url: "https://#{merchant.domain}/a",
          currency: "USD",
          is_active: true
        })

      {:ok, offer_b} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant.id,
          product_id: product.id,
          url: "https://#{merchant.domain}/b",
          currency: "USD",
          is_active: true
        })

      {:ok, empty_offer} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant.id,
          product_id: product.id,
          url: "https://#{merchant.domain}/empty",
          currency: "USD",
          is_active: true
        })

      source =
        %Source{}
        |> Source.changeset(%{
          kind: "affiliate_feed",
          name: "#{test_name} History Source",
          domain: "#{test_name}-source.example"
        })
        |> Repo.insert!()

      artifact =
        %SourceArtifact{}
        |> SourceArtifact.changeset(%{
          source_id: source.id,
          url: "https://#{source.domain}/history.json",
          fetched_at: ~U[2026-07-20 12:00:00Z],
          raw_json: %{"kind" => "price-history"}
        })
        |> Repo.insert!()

      before_range = ~U[2026-07-20 09:59:59Z]
      from_bound = ~U[2026-07-20 10:00:00Z]
      tied_at = ~U[2026-07-20 11:00:00Z]
      to_bound = ~U[2026-07-20 12:00:00Z]
      after_range = ~U[2026-07-20 12:00:01Z]

      for {offer, observed_at, price, artifact_id} <- [
            {offer_a, before_range, "90", nil},
            {offer_a, from_bound, "91", nil},
            {offer_a, tied_at, "92", nil},
            {offer_a, tied_at, "93", artifact.id},
            {offer_a, to_bound, "94", nil},
            {offer_a, after_range, "95", nil},
            {offer_b, from_bound, "101", nil},
            {offer_b, tied_at, "102", nil},
            {offer_b, to_bound, "103", nil}
          ] do
        {:ok, _price_point} =
          Pricing.add_price_point(%{
            merchant_product_id: offer.id,
            observed_at: observed_at,
            price: Decimal.new(price),
            artifact_id: artifact_id
          })
      end

      offer_ids = [offer_b.id, empty_offer.id, offer_a.id]
      filters = %{"from" => from_bound, "to" => to_bound}

      for window <- [
            %{offset: 0, fetch_limit: 2},
            %{offset: 1, fetch_limit: 3},
            %{offset: 3, fetch_limit: 2}
          ] do
        expected = expected_price_history_pages(offer_ids, filters, window)

        {actual, queries} =
          capture_select_queries(fn ->
            Pricing.price_history_pages(offer_ids, filters, window)
          end)

        assert price_point_ids_by_offer(actual) == price_point_ids_by_offer(expected)
        assert Map.fetch!(actual, empty_offer.id) == []
        assert [query] = queries
        assert String.contains?(query, ~s(FROM "price_points"))
      end

      artifact_backed =
        offer_ids
        |> Pricing.price_history_pages(filters, %{offset: 0, fetch_limit: 5})
        |> Map.fetch!(offer_a.id)
        |> Enum.find(&(&1.artifact_id == artifact.id))

      assert Ecto.assoc_loaded?(artifact_backed.artifact)
      assert artifact_backed.artifact.id == artifact.id
      assert Ecto.assoc_loaded?(artifact_backed.artifact.source)
      assert artifact_backed.artifact.source.id == source.id
    end

    test "returns no pages and performs no query for an empty offer list" do
      {pages, queries} =
        capture_select_queries(fn ->
          Pricing.price_history_pages(
            [],
            %{from: ~U[2026-07-20 10:00:00Z], to: ~U[2026-07-20 12:00:00Z]},
            %{offset: 0, fetch_limit: 2}
          )
        end)

      assert pages == %{}
      assert queries == []
    end
  end

  describe "complete current offer truth" do
    test "batches requested products with one offer and latest-price read", %{test: test_name} do
      now = ~U[2026-07-13 18:00:00Z]
      observed_product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-observed"})
      empty_product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-empty"})
      missing_product_id = empty_product.id + 1_000_000

      observed =
        offer_fixture(observed_product, "USD", "#{test_name}-observed", true, %{
          price: "100",
          shipping: "5",
          in_stock: true,
          observed_at: now
        })

      _unobserved = offer_fixture(observed_product, "USD", "#{test_name}-unobserved", true, nil)

      {truths, queries} =
        capture_select_queries(fn ->
          Pricing.current_offer_truths(
            [observed_product.id, missing_product_id, empty_product.id, observed_product.id],
            now: now
          )
        end)

      assert Map.keys(truths) |> Enum.sort() ==
               Enum.sort([observed_product.id, missing_product_id, empty_product.id])

      assert %{offer_count: 2, observed_offer_count: 1, eligible_offer_count: 1} =
               truths[observed_product.id]

      assert [%{best_offer: %{merchant_product_id: observed_id}}] =
               truths[observed_product.id].currency_summaries

      assert observed_id == observed.id
      assert truths[empty_product.id] == Pricing.current_offer_truth(empty_product.id, now: now)

      assert truths[missing_product_id] ==
               Pricing.current_offer_truth(missing_product_id, now: now)

      assert Pricing.current_offer_truths([], now: now) == %{}

      assert Enum.count(queries, &String.contains?(&1, ~s(FROM "merchant_products"))) == 1
      assert Enum.count(queries, &String.contains?(&1, ~s(FROM "price_points"))) == 1
    end

    test "classifies completeness, stock, freshness, and eligibility" do
      now = ~U[2026-07-13 18:00:00Z]

      merchant_product = %MerchantProduct{
        id: 1,
        currency: "USD",
        is_active: true
      }

      complete_price = %PricePoint{
        observed_at: DateTime.add(now, -3600, :second),
        price: Decimal.new("100"),
        shipping: Decimal.new("5"),
        in_stock: true
      }

      assert %{
               item_price: item_price,
               shipping: shipping,
               landed_price: landed_price,
               landed_price_complete: true,
               stock_status: :in_stock,
               freshness: :fresh,
               eligible: true
             } = OfferTruth.summarize(merchant_product, complete_price, now)

      assert Decimal.eq?(item_price, Decimal.new("100"))
      assert Decimal.eq?(shipping, Decimal.new("5"))
      assert Decimal.eq?(landed_price, Decimal.new("105"))

      assert %{
               landed_price: nil,
               landed_price_complete: false,
               eligible: false
             } =
               OfferTruth.summarize(
                 merchant_product,
                 %{complete_price | shipping: nil},
                 now
               )

      assert %{stock_status: :unknown, eligible: false} =
               OfferTruth.summarize(
                 merchant_product,
                 %{complete_price | in_stock: nil},
                 now
               )

      assert %{stock_status: :out_of_stock, eligible: false} =
               OfferTruth.summarize(
                 merchant_product,
                 %{complete_price | in_stock: false},
                 now
               )

      assert %{freshness: :aging, eligible: true} =
               OfferTruth.summarize(
                 merchant_product,
                 %{complete_price | observed_at: DateTime.add(now, -48, :hour)},
                 now
               )

      assert %{freshness: :stale, eligible: false} =
               OfferTruth.summarize(
                 merchant_product,
                 %{complete_price | observed_at: DateTime.add(now, -73, :hour)},
                 now
               )

      assert %{
               item_price: nil,
               freshness: :unobserved,
               stock_status: :unknown,
               eligible: false
             } = OfferTruth.summarize(merchant_product, nil, now)
    end

    test "selects the database-wide best complete landed price per currency", %{
      test: test_name
    } do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-offer-truth-product"})
      now = ~U[2026-07-13 18:00:00Z]

      lower_item =
        offer_fixture(product, "USD", "lower-item", true, %{
          price: "50",
          shipping: "20",
          in_stock: true,
          observed_at: DateTime.add(now, -1, :hour)
        })

      lower_landed =
        offer_fixture(product, "USD", "lower-landed", true, %{
          price: "60",
          shipping: "0",
          in_stock: true,
          observed_at: DateTime.add(now, -2, :hour)
        })

      _unknown_shipping =
        offer_fixture(product, "USD", "unknown-shipping", true, %{
          price: "40",
          shipping: nil,
          in_stock: true,
          observed_at: DateTime.add(now, -1, :hour)
        })

      _stale =
        offer_fixture(product, "USD", "stale", true, %{
          price: "1",
          shipping: "0",
          in_stock: true,
          observed_at: DateTime.add(now, -4, :day)
        })

      _unobserved = offer_fixture(product, "USD", "unobserved", true, nil)

      euro =
        offer_fixture(product, "EUR", "euro", true, %{
          price: "70",
          shipping: "5",
          in_stock: true,
          observed_at: DateTime.add(now, -1, :hour)
        })

      _inactive =
        offer_fixture(product, "USD", "inactive", false, %{
          price: "0.01",
          shipping: "0",
          in_stock: true,
          observed_at: now
        })

      assert %{
               offer_count: 6,
               observed_offer_count: 5,
               eligible_offer_count: 3,
               currency_summaries: [eur_summary, usd_summary]
             } = Pricing.current_offer_truth(product.id, now: now)

      assert %{
               currency: "EUR",
               offer_count: 1,
               observed_offer_count: 1,
               eligible_offer_count: 1,
               best_offer: %{merchant_product_id: euro_id, landed_price: euro_landed}
             } = eur_summary

      assert euro_id == euro.id
      assert Decimal.eq?(euro_landed, Decimal.new("75"))

      assert %{
               currency: "USD",
               offer_count: 5,
               observed_offer_count: 4,
               eligible_offer_count: 2,
               best_offer: %{merchant_product_id: best_id, landed_price: best_landed}
             } = usd_summary

      assert lower_item.id != lower_landed.id
      assert best_id == lower_landed.id
      assert Decimal.eq?(best_landed, Decimal.new("60"))
    end
  end

  defp offer_fixture(product, currency, suffix, is_active, price_attrs) do
    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "Offer truth #{suffix} #{System.unique_integer([:positive])}",
        domain: "#{suffix}-#{System.unique_integer([:positive])}.example"
      })

    {:ok, merchant_product} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://#{merchant.domain}/product",
        currency: currency,
        is_active: is_active
      })

    if price_attrs do
      {:ok, _price_point} =
        Pricing.add_price_point(%{
          merchant_product_id: merchant_product.id,
          observed_at: price_attrs.observed_at,
          price: Decimal.new(price_attrs.price),
          shipping: price_attrs.shipping && Decimal.new(price_attrs.shipping),
          in_stock: price_attrs.in_stock
        })
    end

    merchant_product
  end

  defp expected_product_offer_pages(product_ids, filters, window) do
    Map.new(product_ids, fn product_id ->
      offers =
        filters
        |> Map.put(:product_id, product_id)
        |> Pricing.list_merchant_products_query()
        |> Repo.all()
        |> Enum.drop(window.offset)
        |> Enum.take(window.fetch_limit)

      {product_id, offers}
    end)
  end

  defp offer_ids_by_product(pages) do
    Map.new(pages, fn {product_id, offers} ->
      {product_id, Enum.map(offers, & &1.id)}
    end)
  end

  defp expected_merchant_offer_pages(merchant_ids, window) do
    Map.new(merchant_ids, fn merchant_id ->
      offers =
        merchant_id
        |> Pricing.list_merchant_offers_query(true)
        |> Repo.all()
        |> Enum.drop(window.offset)
        |> Enum.take(window.fetch_limit)

      {merchant_id, offers}
    end)
  end

  defp offer_ids_by_merchant(pages) do
    Map.new(pages, fn {merchant_id, offers} ->
      {merchant_id, Enum.map(offers, & &1.id)}
    end)
  end

  defp expected_price_history_pages(merchant_product_ids, filters, window) do
    Map.new(merchant_product_ids, fn merchant_product_id ->
      price_points =
        merchant_product_id
        |> Pricing.price_history_query(Map.put(filters, :order, :desc))
        |> Repo.all()
        |> Repo.preload(artifact: [:source])
        |> Enum.drop(window.offset)
        |> Enum.take(window.fetch_limit)

      {merchant_product_id, price_points}
    end)
  end

  defp price_point_ids_by_offer(pages) do
    Map.new(pages, fn {merchant_product_id, price_points} ->
      {merchant_product_id, Enum.map(price_points, & &1.id)}
    end)
  end
end
