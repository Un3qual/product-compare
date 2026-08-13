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
    assert Enum.count_until(usd.points, 92) == 91
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

    assert hd(eur.points).observed_at == ~U[2026-06-01 23:59:59.999999Z]
    assert Enum.all?(eur.points, &(&1.currency == "EUR"))
  end

  test "returns stable empty entries for products without qualifying observations" do
    product = SpecsFixtures.product_fixture(%{slug: "empty-price-trend"})
    product_id = product.id

    assert Pricing.product_price_trends([product.id], as_of: @as_of) == %{product_id => []}
    assert Pricing.product_price_trends([], as_of: @as_of) == %{}
  end

  test "requires confirmed in-stock observations and removes offers with unknown availability" do
    product = SpecsFixtures.product_fixture(%{slug: "confirmed-stock-price-trend"})
    offer = offer_fixture(product, "Availability Market", "USD")

    add_price(offer, ~U[2026-08-09 08:00:00.000000Z], "100", true)
    add_price(offer, ~U[2026-08-10 08:00:00.000000Z], "90", nil)
    product_id = product.id

    assert %{^product_id => [series]} =
             Pricing.product_price_trends([product.id], as_of: @as_of)

    assert Enum.map(series.points, &DateTime.to_date(&1.observed_at)) == [~D[2026-08-09]]

    unconfirmed_product =
      SpecsFixtures.product_fixture(%{slug: "unconfirmed-stock-price-trend"})

    unconfirmed_offer = offer_fixture(unconfirmed_product, "Unknown Stock Market", "USD")
    add_price(unconfirmed_offer, ~U[2026-08-10 08:00:00.000000Z], "80", nil)
    unconfirmed_product_id = unconfirmed_product.id

    assert %{^unconfirmed_product_id => []} =
             Pricing.product_price_trends([unconfirmed_product.id], as_of: @as_of)
  end

  test "timestamps daily projections after the observations they include" do
    product = SpecsFixtures.product_fixture(%{slug: "intraday-price-trend"})
    offer = offer_fixture(product, "Intraday Market", "USD")
    observed_at = ~U[2026-08-12 11:00:00.000000Z]

    add_price(offer, observed_at, "100", true)
    product_id = product.id

    assert %{^product_id => [%{points: [point]}]} =
             Pricing.product_price_trends([product.id], as_of: @as_of)

    assert DateTime.compare(point.observed_at, observed_at) in [:eq, :gt]
    assert point.observed_at == @as_of
  end

  test "consolidates multiple listings from one merchant into one lowest contribution" do
    product = SpecsFixtures.product_fixture(%{slug: "merchant-listing-price-trend"})

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "Multi Listing Market",
        domain: "multi-listing-market.example"
      })

    first_offer = offer_fixture(product, merchant, "USD", "first")
    second_offer = offer_fixture(product, merchant, "USD", "second")
    add_price(first_offer, ~U[2026-08-10 08:00:00.000000Z], "100", true)
    add_price(second_offer, ~U[2026-08-10 08:00:00.000000Z], "80", true)
    product_id = product.id

    assert %{^product_id => [series]} =
             Pricing.product_price_trends([product.id], as_of: @as_of)

    assert [%{merchant_id: merchant_id, merchant_product_id: merchant_product_id}] =
             series.merchants

    assert merchant_id == merchant.id
    assert merchant_product_id == first_offer.id

    assert %{average_price: average, lowest_price: lowest, merchant_prices: merchant_prices} =
             List.last(series.points)

    assert Decimal.eq?(average, Decimal.new("80"))
    assert Decimal.eq?(lowest, Decimal.new("80"))

    assert [%{merchant_product_id: returned_id, price: returned_price}] = merchant_prices
    assert returned_id == first_offer.id
    assert Decimal.eq?(returned_price, Decimal.new("80"))
  end

  defp offer_fixture(product, merchant_name, currency) do
    suffix = System.unique_integer([:positive])

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: merchant_name,
        domain: "trend-#{suffix}.example"
      })

    offer_fixture(product, merchant, currency, "product")
  end

  defp offer_fixture(product, merchant, currency, url_suffix) do
    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://#{merchant.domain}/#{url_suffix}",
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
