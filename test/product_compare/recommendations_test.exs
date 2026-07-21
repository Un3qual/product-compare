defmodule ProductCompare.RecommendationsTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Recommendations
  alias ProductCompare.Specs

  @now ~U[2026-07-13 22:00:00Z]

  test "lowest current cost ranks complete same-currency truth and cites observations" do
    {first, first_point} = product_with_price("First", "100")
    {second, second_point} = product_with_price("Second", "80")

    result = Recommendations.compare([first.id, second.id], :lowest_current_cost, now: @now)

    assert result.status == :winner
    assert result.profile == :lowest_current_cost
    assert result.algorithm_version == "lowest-current-cost-v1"
    assert result.winner_product_id == second.id
    assert result.currency == "USD"
    assert Enum.map(result.rankings, & &1.product_id) == [second.id, first.id]
    assert Enum.map(result.rankings, & &1.price_point_id) == [second_point.id, first_point.id]
    assert hd(result.rankings).reasons == ["Lowest eligible landed price: 80 USD."]
  end

  test "best value requires accepted claim evidence and cites each exact claim" do
    {first, _point} = product_with_price("First", "100")
    {second, _point} = product_with_price("Second", "80")
    first_claim = current_text_claim(first, "Panel", "OLED")

    insufficient = Recommendations.compare([first.id, second.id], :best_value, now: @now)
    assert insufficient.status == :insufficient_evidence
    assert insufficient.winner_product_id == nil
    assert "Second has no accepted specification evidence." in insufficient.missing_inputs

    second_claim = current_text_claim(second, "Panel", "LCD")
    result = Recommendations.compare([first.id, second.id], :best_value, now: @now)

    assert result.status == :winner
    assert result.winner_product_id == second.id
    assert Enum.find(result.rankings, &(&1.product_id == first.id)).claim_ids == [first_claim.id]

    assert Enum.find(result.rankings, &(&1.product_id == second.id)).claim_ids == [
             second_claim.id
           ]

    assert Enum.all?(result.rankings, &match?([_price_reason, _claim_reason], &1.reasons))
  end

  test "mixed currencies, incomplete products, and exact ties return no winner" do
    {first, _} = product_with_price("First", "80", "USD")
    {second, _} = product_with_price("Second", "70", "EUR")

    mixed = Recommendations.compare([first.id, second.id], :lowest_current_cost, now: @now)
    assert mixed.status == :insufficient_evidence
    assert "Products do not share one eligible offer currency." in mixed.missing_inputs

    {third, _} = product_with_price("Third", "80", "USD")
    tied = Recommendations.compare([first.id, third.id], :lowest_current_cost, now: @now)
    assert tied.status == :tie
    assert tied.winner_product_id == nil
    assert tied.missing_inputs == ["Top products have the same eligible landed price."]
  end

  test "comparison evidence SELECT budgets stay fixed as selection grows" do
    {first, first_point} = product_with_price("Budget first", "120")
    {second, second_point} = product_with_price("Budget second", "90")
    {third, third_point} = product_with_price("Budget third", "100")

    {two_product_result, two_product_queries} =
      capture_select_queries(fn ->
        Recommendations.compare([first.id, second.id], :lowest_current_cost, now: @now)
      end)

    {three_product_result, three_product_queries} =
      capture_select_queries(fn ->
        Recommendations.compare(
          [first.id, second.id, third.id],
          :lowest_current_cost,
          now: @now
        )
      end)

    assert two_product_result.status == :winner
    assert two_product_result.winner_product_id == second.id

    assert Enum.map(two_product_result.rankings, &{&1.product_id, &1.price_point_id}) == [
             {second.id, second_point.id},
             {first.id, first_point.id}
           ]

    assert three_product_result.status == :winner
    assert three_product_result.winner_product_id == second.id

    assert Enum.map(three_product_result.rankings, &{&1.product_id, &1.price_point_id}) == [
             {second.id, second_point.id},
             {third.id, third_point.id},
             {first.id, first_point.id}
           ]

    assert evidence_query_counts(two_product_queries) == %{
             merchant_products: 1,
             price_points: 1,
             product_attribute_current: 1,
             products: 1
           }

    assert evidence_query_counts(three_product_queries) ==
             evidence_query_counts(two_product_queries)
  end

  test "comparison slug selections preserve duplicate and missing positions with one product query" do
    first = SpecsFixtures.product_fixture(%{slug: "context-first"})
    second = SpecsFixtures.product_fixture(%{slug: "context-second"})

    selections = [
      [first.slug, "missing-context-product", first.slug],
      ["missing-context-product", second.slug]
    ]

    {products_by_selection, queries} =
      capture_select_queries(fn -> Catalog.list_products_by_slug_selections(selections) end)

    assert Enum.map(products_by_selection, &Enum.map(&1, fn product -> product && product.id end)) ==
             [
               [first.id, nil, first.id],
               [nil, second.id]
             ]

    assert select_query_counts(queries) == %{products: 1}
  end

  test "batched recommendations preserve results while evidence SELECT budgets stay fixed as requests grow" do
    {first, first_point} = product_with_price("Context first", "120")
    {second, second_point} = product_with_price("Context second", "90")
    {third, third_point} = product_with_price("Context third", "100")
    {fourth, fourth_point} = product_with_price("Context fourth", "110")

    two_requests = [
      {[first.id, second.id], :lowest_current_cost},
      {[third.id, fourth.id], :lowest_current_cost}
    ]

    four_requests =
      two_requests ++
        [
          {[first.id, third.id], :lowest_current_cost},
          {[second.id, fourth.id], :lowest_current_cost}
        ]

    expected_two = Enum.map(two_requests, &compare_request/1)
    expected_four = Enum.map(four_requests, &compare_request/1)

    {two_results, two_queries} =
      capture_select_queries(fn -> Recommendations.compare_many(two_requests, now: @now) end)

    {four_results, four_queries} =
      capture_select_queries(fn -> Recommendations.compare_many(four_requests, now: @now) end)

    assert two_results == expected_two
    assert four_results == expected_four

    assert Enum.map(two_results, &ranking_product_and_price_ids/1) == [
             [{second.id, second_point.id}, {first.id, first_point.id}],
             [{third.id, third_point.id}, {fourth.id, fourth_point.id}]
           ]

    assert Enum.map(four_results, &ranking_product_and_price_ids/1) == [
             [{second.id, second_point.id}, {first.id, first_point.id}],
             [{third.id, third_point.id}, {fourth.id, fourth_point.id}],
             [{third.id, third_point.id}, {first.id, first_point.id}],
             [{second.id, second_point.id}, {fourth.id, fourth_point.id}]
           ]

    assert evidence_query_counts(two_queries) == %{
             merchant_products: 1,
             price_points: 1,
             product_attribute_current: 1,
             products: 1
           }

    assert evidence_query_counts(four_queries) == evidence_query_counts(two_queries)
  end

  defp product_with_price(name, price, currency \\ "USD") do
    product = SpecsFixtures.product_fixture(%{name: name})

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "#{name} Merchant #{System.unique_integer([:positive])}",
        domain: "#{String.downcase(name)}-#{System.unique_integer([:positive])}.example"
      })

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://merchant.example/#{System.unique_integer([:positive])}",
        currency: currency,
        is_active: true
      })

    {:ok, point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: @now,
        price: price,
        shipping: "0",
        in_stock: true
      })

    {product, point}
  end

  defp current_text_claim(product, label, value) do
    operator = AccountsFixtures.operator_fixture()

    attribute =
      SpecsFixtures.attribute_fixture(%{
        data_type: :text,
        display_name: label,
        code: "#{String.downcase(label)}-#{System.unique_integer([:positive])}"
      })

    {:ok, claim} =
      Specs.propose_claim(product.id, attribute.id, %{value_text: value}, %{
        source_type: :user,
        created_by: operator.id
      })

    {:ok, claim} = Specs.accept_claim(claim.id, operator.id)
    {:ok, _current} = Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)
    claim
  end

  defp compare_request({product_ids, profile}) do
    Recommendations.compare(product_ids, profile, now: @now)
  end

  defp ranking_product_and_price_ids(result) do
    Enum.map(result.rankings, &{&1.product_id, &1.price_point_id})
  end

  defp evidence_query_counts(queries) do
    Map.new(
      [
        merchant_products: ~r/FROM "merchant_products"/,
        price_points: ~r/FROM "price_points"/,
        product_attribute_current: ~r/FROM "product_attribute_current"/,
        products: ~r/FROM "products"/
      ],
      fn {name, pattern} -> {name, Enum.count(queries, &Regex.match?(pattern, &1))} end
    )
  end

  defp select_query_counts(queries) do
    %{products: Enum.count(queries, &Regex.match?(~r/FROM "products"/, &1))}
  end
end
