defmodule ProductCompare.Pricing.ProductPriceTrendsTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing

  @as_of ~U[2026-08-12 12:00:00.000000Z]

  test "projects bounded daily Decimal trends by currency with stock transitions" do
    product = SpecsFixtures.product_fixture(%{slug: "daily-price-trend"})
    alpha = offer_fixture(product, "Alpha Market", "USD")
    beta = offer_fixture(product, "Beta Market", "USD")
    euro = offer_fixture(product, "Euro Market", "EUR")

    add_price(alpha, ~U[2026-05-13 18:00:00.000000Z], "120", true)
    add_price(alpha, ~U[2026-05-16 08:00:00.000000Z], "100", true)
    add_price(alpha, ~U[2026-07-01 08:00:00.000000Z], "100", false)
    add_price(alpha, ~U[2026-07-10 08:00:00.000000Z], "90", true)

    add_price(beta, ~U[2026-05-15 08:00:00.000000Z], "110", true)
    add_price(beta, ~U[2026-06-01 08:00:00.000000Z], "80", true)

    add_price(euro, ~U[2026-06-01 09:00:00.000000Z], "70", true)
    product_id = product.id

    assert %{^product_id => [eur, usd]} =
             Pricing.product_price_trends([product.id], as_of: @as_of)

    assert eur.currency == "EUR"
    assert usd.currency == "USD"
    assert length(usd.points) == 91
    assert length(eur.points) == Date.diff(~D[2026-08-12], ~D[2026-06-01]) + 1

    assert Enum.map(usd.merchants, & &1.name) == ["Alpha Market", "Beta Market"]
    assert Enum.map(eur.merchants, & &1.name) == ["Euro Market"]

    assert_point(usd, ~D[2026-05-14], "120", "120", alpha.id, [
      {alpha.id, "120"}
    ])

    assert_point(usd, ~D[2026-05-15], "110", "115", beta.id, [
      {alpha.id, "120"},
      {beta.id, "110"}
    ])

    assert_point(usd, ~D[2026-06-01], "80", "90", beta.id, [
      {alpha.id, "100"},
      {beta.id, "80"}
    ])

    assert_point(usd, ~D[2026-07-01], "80", "80", beta.id, [{beta.id, "80"}])

    assert_point(usd, ~D[2026-07-10], "80", "85", beta.id, [
      {alpha.id, "90"},
      {beta.id, "80"}
    ])

    assert hd(eur.points).observed_at == ~U[2026-06-01 00:00:00.000000Z]
    assert Enum.all?(eur.points, &(&1.currency == "EUR"))
  end

  test "returns stable empty entries for products without qualifying observations" do
    product = SpecsFixtures.product_fixture(%{slug: "empty-price-trend"})
    product_id = product.id

    assert Pricing.product_price_trends([product.id], as_of: @as_of) == %{product_id => []}
    assert Pricing.product_price_trends([], as_of: @as_of) == %{}
  end

  defp offer_fixture(product, merchant_name, currency) do
    suffix = System.unique_integer([:positive])

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: merchant_name,
        domain: "trend-#{suffix}.example"
      })

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://#{merchant.domain}/product",
        currency: currency,
        is_active: true
      })

    offer
  end

  defp add_price(offer, observed_at, price, in_stock) do
    {:ok, _price_point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: observed_at,
        price: Decimal.new(price),
        in_stock: in_stock
      })
  end

  defp assert_point(series, date, lowest, average, winner_id, merchant_prices) do
    point = Enum.find(series.points, &(DateTime.to_date(&1.observed_at) == date))

    assert Decimal.eq?(point.lowest_price, Decimal.new(lowest))
    assert Decimal.eq?(point.average_price, Decimal.new(average))
    assert point.lowest_merchant_product_id == winner_id

    assert Enum.map(point.merchant_prices, fn price ->
             {price.merchant_product_id, Decimal.to_string(price.price)}
           end) == merchant_prices
  end
end
