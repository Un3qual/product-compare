defmodule ProductCompare.Pricing.HomeOffersTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers,
    only: [capture_select_queries: 1, count_select_queries_targeting_table: 2]

  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures}
  alias ProductCompare.{Alerts, Catalog, Pricing}

  @now ~U[2026-08-10 12:00:00Z]

  test "summarizes the deterministic best active fresh offer and ignores stale or out-of-stock latest observations" do
    product = SpecsFixtures.product_fixture(%{slug: "home-offers"})
    best = offer(product, "best", "90", 0, true)
    _same_price_higher_id = offer(product, "same", "90", 0, true)
    _stale = offer(product, "stale", "1", -86_401, true)
    _out_of_stock = offer(product, "out", "1", 0, false)

    product_id = product.id
    assert %{^product_id => summary} = Pricing.home_offer_summaries([product.id], now: @now)
    assert summary.merchant_product_id == best.id
    assert Decimal.eq?(summary.landed_price, Decimal.new("95"))
    assert summary.active_offer_count == 4
    assert DateTime.compare(summary.observed_at, @now) == :eq
  end

  test "uses inclusive 72-hour and 30-day boundaries while requiring a strictly-below rolling median" do
    new_product = SpecsFixtures.product_fixture(%{slug: "home-new"})
    new_offer = offer(new_product, "new", "90", 0, true)
    old_product = SpecsFixtures.product_fixture(%{slug: "home-old"})
    old_offer = offer(old_product, "old", "90", 0, true)

    boundary_product = SpecsFixtures.product_fixture(%{slug: "home-boundary"})
    boundary_offer = offer(boundary_product, "boundary", "90", 0, true)

    ProductCompare.Repo.update_all(
      Ecto.Query.from(offer in ProductCompareSchemas.Pricing.MerchantProduct,
        where: offer.id == ^boundary_offer.id
      ),
      set: [inserted_at: DateTime.add(@now, -259_200, :second)]
    )

    ProductCompare.Repo.update_all(
      Ecto.Query.from(offer in ProductCompareSchemas.Pricing.MerchantProduct,
        where: offer.id == ^old_offer.id
      ),
      set: [inserted_at: DateTime.add(@now, -259_201, :second)]
    )

    candidates = Pricing.home_new_deal_candidates(now: @now, limit: 6)
    candidates_by_product_id = Map.new(candidates, &{&1.product_id, &1})

    assert candidates_by_product_id[new_product.id].new_offer?
    assert candidates_by_product_id[boundary_product.id].new_offer?
    refute Map.has_key?(candidates_by_product_id, old_product.id)
    assert candidates_by_product_id[new_product.id].merchant_product_id == new_offer.id
  end

  test "uses the 30-day median inclusively and excludes an equal landed price" do
    below = SpecsFixtures.product_fixture(%{slug: "median-below"})
    equal = SpecsFixtures.product_fixture(%{slug: "median-equal"})
    below_offer = offer(below, "median-below", "90", 0, true)
    equal_offer = offer(equal, "median-equal", "100", 0, true)

    add_price(below_offer, "100", -2_592_000)
    add_price(below_offer, "110", -1)
    add_price(equal_offer, "100", -2_592_000)
    add_price(equal_offer, "100", -1)

    ProductCompare.Repo.update_all(
      Ecto.Query.from(offer in ProductCompareSchemas.Pricing.MerchantProduct,
        where: offer.id in ^[below_offer.id, equal_offer.id]
      ),
      set: [inserted_at: DateTime.add(@now, -259_201, :second)]
    )

    summaries = Pricing.home_offer_summaries([below.id, equal.id], now: @now)

    assert Decimal.lt?(summaries[below.id].landed_price, summaries[below.id].median_30d)
    assert Decimal.eq?(summaries[equal.id].landed_price, summaries[equal.id].median_30d)
  end

  test "new deal rows identify an offer that is itself new" do
    product = SpecsFixtures.product_fixture(%{slug: "new-offer-identity"})
    old_cheap = offer(product, "old-cheap", "40", 0, true)
    new_expensive = offer(product, "new-expensive", "80", 0, true)

    ProductCompare.Repo.update_all(
      Ecto.Query.from(offer in ProductCompareSchemas.Pricing.MerchantProduct,
        where: offer.id == ^old_cheap.id
      ),
      set: [inserted_at: DateTime.add(@now, -259_201, :second)]
    )

    assert [%{merchant_product_id: merchant_product_id, new_offer?: true}] =
             Pricing.home_new_deal_candidates(now: @now, limit: 6)

    assert merchant_product_id == new_expensive.id
  end

  test "homepage offer truth uses only USD and computes medians within currency" do
    product = SpecsFixtures.product_fixture(%{slug: "home-currency-policy"})
    usd = offer(product, "usd", "90", 0, true, "USD")
    _eur = offer(product, "eur", "1", 0, true, "EUR")
    add_price(usd, "110", -1)

    product_id = product.id
    assert %{^product_id => summary} = Pricing.home_offer_summaries([product.id], now: @now)
    assert summary.merchant_product_id == usd.id
    assert summary.currency == "USD"
    assert summary.active_offer_count == 1
    assert Decimal.eq?(summary.median_30d, Decimal.new("105"))
  end

  test "new deal candidates support stable windows beyond the presentation page" do
    products =
      Enum.map(1..8, fn index ->
        product = SpecsFixtures.product_fixture(%{slug: "new-boundary-#{index}"})
        offer(product, "new-boundary-#{index}", Integer.to_string(index * 10), 0, true)
        product
      end)

    {candidates, queries} =
      capture_select_queries(fn -> Pricing.home_new_deal_candidates(now: @now, limit: 100) end)

    assert Enum.count_until(candidates, 9) == 8
    assert Enum.map(candidates, & &1.product_id) == Enum.map(products, & &1.id)

    assert Enum.map(
             Pricing.home_new_deal_candidates(now: @now, offset: 6, limit: 2),
             & &1.product_id
           ) == Enum.map(Enum.drop(products, 6), & &1.id)

    assert Enum.any?(queries, &String.contains?(&1, "LIMIT"))
  end

  test "new deal selection does not compute an unused rolling median" do
    product = SpecsFixtures.product_fixture(%{slug: "new-without-median"})
    offer(product, "new-without-median", "90", 0, true)

    {[_candidate], [query]} =
      capture_select_queries(fn -> Pricing.home_new_deal_candidates(now: @now, limit: 6) end)

    refute String.contains?(query, "percentile_cont")
  end

  test "viewer deal price aggregates are scoped to relevant product candidates" do
    owner = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture(%{slug: "viewer-price-scope"})
    offer(product, "viewer-price-scope", "90", 0, true)

    assert {:ok, _} =
             Catalog.create_saved_comparison_set(owner.id, %{
               name: "Viewer price scope",
               product_ids: [product.id]
             })

    relevance_query = Alerts.home_relevance_candidates_query(owner.id, [])

    {[_candidate], [query]} =
      capture_select_queries(fn ->
        Pricing.home_viewer_deal_candidates(relevance_query, now: @now, limit: 6)
      end)

    assert Regex.scan(~r/"product_id" IN \(SELECT/, query) |> Enum.count_until(5) == 5, query
  end

  test "keeps offer read selects bounded as product count grows" do
    products = Enum.map(1..6, &SpecsFixtures.product_fixture(%{slug: "home-offer-budget-#{&1}"}))
    Enum.each(products, &offer(&1, "budget-#{&1.id}", "90", 0, true))

    {_one, one_queries} =
      capture_select_queries(fn -> Pricing.home_offer_summaries([hd(products).id], now: @now) end)

    {_six, six_queries} =
      capture_select_queries(fn ->
        Pricing.home_offer_summaries(Enum.map(products, & &1.id), now: @now)
      end)

    assert_table_select_counts_equal(one_queries, six_queries, [:merchant_products, :price_points])

    assert Enum.any?(six_queries, &String.contains?(&1, "row_number"))
  end

  defp offer(product, suffix, price, observed_offset, in_stock, currency \\ "USD") do
    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "#{suffix} merchant",
        domain: "#{suffix}-#{product.id}.example"
      })

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://#{suffix}-#{product.id}.example/offer",
        currency: currency,
        is_active: true
      })

    {:ok, _} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.add(@now, observed_offset, :second),
        price: price,
        shipping: "5",
        in_stock: in_stock
      })

    offer
  end

  defp add_price(offer, price, observed_offset) do
    {:ok, _} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.add(@now, observed_offset, :second),
        price: price,
        shipping: "5",
        in_stock: true
      })
  end

  defp assert_table_select_counts_equal(one_queries, six_queries, tables) do
    Enum.each(tables, fn table ->
      assert count_select_queries_targeting_table(one_queries, table) ==
               count_select_queries_targeting_table(six_queries, table)
    end)
  end
end
