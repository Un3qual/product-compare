defmodule ProductCompare.Pricing.HomeOffersTest do
  use ProductCompare.DataCase, async: true

  import Ecto.Query

  import ProductCompare.DatabaseTestHelpers,
    only: [capture_queries: 1, capture_select_queries: 1, count_select_queries_targeting_table: 2]

  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures}
  alias ProductCompare.{Alerts, Catalog, Pricing}
  alias ProductCompareSchemas.Catalog.Product

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
    assert summaries[below.id].below_30_day_median?
    assert Decimal.eq?(summaries[equal.id].landed_price, summaries[equal.id].median_30d)
    refute summaries[equal.id].below_30_day_median?
  end

  test "ignores future observations when selecting current offers and rolling medians" do
    product = SpecsFixtures.product_fixture(%{slug: "home-future-price"})
    offer = offer(product, "home-future-price", "90", 0, true)
    add_price(offer, "120", -3_600)
    add_price(offer, "1", 3_600)

    product_id = product.id
    assert %{^product_id => summary} = Pricing.home_offer_summaries([product.id], now: @now)
    assert Decimal.eq?(summary.landed_price, Decimal.new("95"))
    assert Decimal.eq?(summary.median_30d, Decimal.new("110"))

    assert [%{merchant_product_id: merchant_product_id, landed_price: landed_price}] =
             Pricing.home_new_deal_candidates(now: @now, limit: 6)

    assert merchant_product_id == offer.id
    assert Decimal.eq?(landed_price, Decimal.new("95"))
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
    assert first_observation_relation?(query)
  end

  test "new deal selection bounds merchant products before first-seen history" do
    old_products =
      Enum.map(1..8, fn index ->
        product = SpecsFixtures.product_fixture(%{slug: "old-history-#{index}"})
        old_offer = offer(product, "old-history-#{index}", "90", 0, true)

        ProductCompare.Repo.update_all(
          Ecto.Query.from(candidate in ProductCompareSchemas.Pricing.MerchantProduct,
            where: candidate.id == ^old_offer.id
          ),
          set: [inserted_at: DateTime.add(@now, -259_201, :second)]
        )

        Enum.each(
          1..4,
          &add_price(old_offer, Integer.to_string(90 + &1), -604_800 - &1)
        )

        product
      end)

    new_product = SpecsFixtures.product_fixture(%{slug: "bounded-new-history"})
    new_offer = offer(new_product, "bounded-new-history", "80", 0, true)

    {[candidate], [query]} =
      capture_select_queries(fn -> Pricing.home_new_deal_candidates(now: @now, limit: 2) end)

    assert candidate.product_id == new_product.id
    assert candidate.product.id == new_product.id
    assert candidate.merchant_product_id == new_offer.id
    refute candidate.product_id in Enum.map(old_products, & &1.id)

    assert {cutoff_position, _length} =
             :binary.match(query, ~s("inserted_at" >=))

    assert {first_seen_position, _length} = :binary.match(query, "JOIN LATERAL")
    assert cutoff_position < first_seen_position
  end

  test "trending selection does not read first-observation history" do
    product = SpecsFixtures.product_fixture(%{slug: "trending-without-first-observation"})
    merchant_product = offer(product, "trending-without-first-observation", "90", 0, true)
    add_price(merchant_product, "110", -3_600)

    activity_query =
      from candidate in Product,
        where: candidate.id == ^product.id,
        select: %{
          product_id: candidate.id,
          identity_count: type(^5, :integer),
          activity_at: type(^@now, :utc_datetime_usec)
        }

    {[_candidate], [query]} =
      capture_select_queries(fn ->
        Pricing.home_trending_deal_candidates(activity_query, now: @now, limit: 6)
      end)

    assert query =~ "percentile_cont"
    refute first_observation_relation?(query)
  end

  test "workspace omits history facts while fallback requests only branch-required history" do
    new_product = SpecsFixtures.product_fixture(%{slug: "rail-history-new"})
    offer(new_product, "rail-history-new", "90", 0, true)

    trending_product = SpecsFixtures.product_fixture(%{slug: "rail-history-trending"})
    trending_offer = offer(trending_product, "rail-history-trending", "90", 0, true)
    add_price(trending_offer, "110", -3_600)

    activity_query =
      from candidate in Product,
        where: candidate.id == ^trending_product.id,
        select: %{
          product_id: candidate.id,
          identity_count: type(^5, :integer),
          activity_at: type(^@now, :utc_datetime_usec)
        }

    {_summaries, [workspace_query]} =
      capture_select_queries(fn ->
        Pricing.home_offer_summaries([new_product.id],
          now: @now,
          requested_fields: MapSet.new()
        )
      end)

    {_fallback, [fallback_query]} =
      capture_select_queries(fn ->
        Pricing.home_fallback_deal_candidates(activity_query, now: @now, limit: 6)
      end)

    refute first_observation_relation?(workspace_query)
    refute workspace_query =~ "percentile_cont"
    assert first_observation_relation?(fallback_query)
    assert fallback_query =~ "percentile_cont"
  end

  test "page facts are page-scoped and honor requested fields" do
    products =
      Enum.map(1..8, fn index ->
        product = SpecsFixtures.product_fixture(%{slug: "page-facts-#{index}"})
        offer(product, "page-facts-#{index}", Integer.to_string(80 + index), 0, true)
        product
      end)

    page = Pricing.home_new_deal_candidates(now: @now, limit: 2)
    page_offer_ids = MapSet.new(page, & &1.merchant_product_id)

    {empty_page_facts, empty_page_queries} =
      capture_select_queries(fn ->
        Pricing.home_offer_page_facts([], MapSet.new([:active_offer_count, :price_signal]),
          now: @now
        )
      end)

    assert empty_page_facts == %{}
    assert empty_page_queries == []

    {empty_field_facts, empty_field_queries} =
      capture_select_queries(fn ->
        Pricing.home_offer_page_facts(page, MapSet.new(), now: @now)
      end)

    assert empty_field_facts == %{}
    assert empty_field_queries == []

    {active_facts, active_queries} =
      capture_select_queries(fn ->
        Pricing.home_offer_page_facts(page, MapSet.new([:active_offer_count]), now: @now)
      end)

    assert MapSet.new(Map.keys(active_facts)) == page_offer_ids
    assert Enum.all?(active_facts, fn {_id, facts} -> facts.active_offer_count == 1 end)
    assert [active_query] = active_queries
    assert active_query =~ "count("
    refute active_query =~ "percentile_cont"

    {signal_facts, signal_queries} =
      capture_select_queries(fn ->
        Pricing.home_offer_page_facts(page, MapSet.new([:price_signal]), now: @now)
      end)

    assert MapSet.new(Map.keys(signal_facts)) == page_offer_ids
    assert [signal_query] = signal_queries
    assert signal_query =~ "percentile_cont"
    refute signal_query =~ "count("

    {all_facts, all_queries} =
      capture_select_queries(fn ->
        Pricing.home_offer_page_facts(
          page,
          MapSet.new([:active_offer_count, :price_signal]),
          now: @now
        )
      end)

    assert MapSet.new(Map.keys(all_facts)) == page_offer_ids
    assert Enum.count_until(all_queries, 3) <= 2
    assert Enum.count(all_queries, &String.contains?(&1, "count(")) == 1
    assert Enum.count(all_queries, &String.contains?(&1, "percentile_cont")) == 1

    {_single_facts, single_queries} =
      capture_select_queries(fn ->
        Pricing.home_offer_page_facts(
          Enum.take(page, 1),
          MapSet.new([:active_offer_count, :price_signal]),
          now: @now
        )
      end)

    assert length(single_queries) == length(all_queries)
    assert length(products) > length(page)
  end

  test "page facts derive an existing median without another query" do
    product = SpecsFixtures.product_fixture(%{slug: "page-facts-existing-median"})
    merchant_product = offer(product, "page-facts-existing-median", "90", 0, true)

    row = %{
      product_id: product.id,
      merchant_product_id: merchant_product.id,
      median_30d: Decimal.new("100"),
      below_30_day_median?: true
    }

    {facts, queries} =
      capture_select_queries(fn ->
        Pricing.home_offer_page_facts([row], MapSet.new([:price_signal]), now: @now)
      end)

    assert queries == []
    assert Decimal.eq?(facts[merchant_product.id].median_30d, Decimal.new("100"))
    assert facts[merchant_product.id].below_30_day_median?
  end

  test "viewer deal watches choose the tightest satisfied target after listing scope" do
    owner = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture(%{slug: "viewer-multiple-targets"})
    first_offer = offer(product, "viewer-multiple-first", "85", 0, true)
    second_offer = offer(product, "viewer-multiple-second", "65", 0, true)

    create_target_watch(owner.id, product.id, first_offer.id, "80")
    create_target_watch(owner.id, product.id, first_offer.id, "100")
    create_target_watch(owner.id, product.id, second_offer.id, "60")
    create_target_watch(owner.id, product.id, second_offer.id, "75")

    relevance_query = Alerts.home_relevance_candidates_query(owner.id, [])

    assert [candidate] =
             Pricing.home_viewer_deal_candidates(relevance_query, now: @now, limit: 6)

    assert candidate.product.id == product.id
    assert candidate.merchant_product_id == second_offer.id
    assert Decimal.eq?(candidate.landed_price, Decimal.new("70"))
    assert Decimal.eq?(candidate.watch_target, Decimal.new("75"))
  end

  test "viewer deal watches retain a satisfied product target above an unmet target" do
    owner = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture(%{slug: "viewer-product-targets"})
    merchant_product = offer(product, "viewer-product-targets", "85", 0, true)

    create_target_watch(owner.id, product.id, nil, "80")
    create_target_watch(owner.id, product.id, nil, "100")

    relevance_query = Alerts.home_relevance_candidates_query(owner.id, [])

    assert [candidate] =
             Pricing.home_viewer_deal_candidates(relevance_query, now: @now, limit: 6)

    assert candidate.merchant_product_id == merchant_product.id
    assert Decimal.eq?(candidate.landed_price, Decimal.new("90"))
    assert Decimal.eq?(candidate.watch_target, Decimal.new("100"))
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
      capture_queries(fn ->
        Pricing.home_viewer_deal_candidates(relevance_query, now: @now, limit: 6)
      end)

    assert query =~ ~s("home_relevance" AS MATERIALIZED), query
    assert query =~ ~s(FROM "home_relevance"), query
    assert query =~ "percentile_cont"
    refute first_observation_relation?(query)

    refute Regex.match?(
             ~r/SELECT DISTINCT [a-z0-9]+\."product_id" FROM "home_relevance"/,
             query
           ),
           query
  end

  test "viewer deal existence applies relevance and availability without output work" do
    owner = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture(%{slug: "viewer-existence"})
    merchant_product = offer(product, "viewer-existence", "90", 0, true)

    assert {:ok, _} =
             Catalog.create_saved_comparison_set(owner.id, %{
               name: "Viewer existence",
               product_ids: [product.id]
             })

    relevance_query = Alerts.home_relevance_candidates_query(owner.id, [])

    {exists?, [query]} =
      capture_queries(fn ->
        Pricing.home_viewer_deal_exists?(relevance_query, now: @now)
      end)

    assert exists?
    assert query =~ ~s("home_relevance" AS MATERIALIZED), query
    refute query =~ "percentile_cont", query
    refute query =~ ~s(AS "viewer_rank"), query
    refute query =~ ~s(JOIN "products"), query

    {1, _} =
      ProductCompare.Repo.update_all(
        from(candidate in ProductCompareSchemas.Pricing.MerchantProduct,
          where: candidate.id == ^merchant_product.id
        ),
        set: [is_active: false]
      )

    refute Pricing.home_viewer_deal_exists?(relevance_query, now: @now)
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

  defp create_target_watch(user_id, product_id, merchant_product_id, target_amount) do
    assert {:ok, _watch} =
             Alerts.create_watch(user_id, %{
               product_id: product_id,
               merchant_product_id: merchant_product_id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: target_amount
             })
  end

  defp assert_table_select_counts_equal(one_queries, six_queries, tables) do
    Enum.each(tables, fn table ->
      assert count_select_queries_targeting_table(one_queries, table) ==
               count_select_queries_targeting_table(six_queries, table)
    end)
  end

  defp first_observation_relation?(query) do
    Regex.match?(
      ~r/ORDER BY [a-z0-9]+\."observed_at"(?: ASC)?, [a-z0-9]+\."id"(?: ASC)? LIMIT 1/,
      query
    )
  end
end
