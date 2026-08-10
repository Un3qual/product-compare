defmodule ProductCompare.Pricing.HomeOffersTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing

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

  test "marks exactly new and below-median deal candidates at temporal and decimal boundaries" do
    new_product = SpecsFixtures.product_fixture(%{slug: "home-new"})
    new_offer = offer(new_product, "new", "90", 0, true)
    old_product = SpecsFixtures.product_fixture(%{slug: "home-old"})
    old_offer = offer(old_product, "old", "90", 0, true)

    ProductCompare.Repo.update_all(
      Ecto.Query.from(offer in ProductCompareSchemas.Pricing.MerchantProduct,
        where: offer.id == ^old_offer.id
      ),
      set: [inserted_at: DateTime.add(@now, -259_201, :second)]
    )

    candidates = Pricing.home_deal_candidates(now: @now)

    assert candidates[new_product.id].new_offer?
    refute Map.has_key?(candidates, old_product.id)
    assert candidates[new_product.id].merchant_product_id == new_offer.id
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

    assert length(one_queries) == length(six_queries)
  end

  defp offer(product, suffix, price, observed_offset, in_stock) do
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
        currency: "USD",
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
end
