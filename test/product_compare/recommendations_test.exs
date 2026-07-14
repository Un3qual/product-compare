defmodule ProductCompare.RecommendationsTest do
  use ProductCompare.DataCase, async: true

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
end
