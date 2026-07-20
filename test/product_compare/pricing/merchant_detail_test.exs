defmodule ProductCompare.Pricing.MerchantDetailTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing

  @now ~U[2026-07-14 01:00:00Z]

  test "merchant slugs are deterministic and remain stable across identity updates" do
    assert {:ok, merchant} =
             Pricing.upsert_merchant(%{name: "North & Main", domain: "north.example"})

    assert merchant.slug =~ ~r/^north-main-[a-f0-9]{8}$/
    assert Pricing.get_merchant_by_slug(merchant.slug).id == merchant.id

    assert {:ok, renamed} =
             Pricing.upsert_merchant(%{name: "North Main Store", domain: "north.example"})

    assert renamed.id == merchant.id
    assert renamed.slug == merchant.slug
  end

  test "merchant detail summary reads every active offer and classifies complete truth" do
    {:ok, merchant} = Pricing.upsert_merchant(%{name: "Detail shop", domain: "detail.example"})
    first = SpecsFixtures.product_fixture()
    second = SpecsFixtures.product_fixture()
    third = SpecsFixtures.product_fixture()
    first_offer = offer(merchant, first, true)
    second_offer = offer(merchant, second, true)
    inactive_offer = offer(merchant, third, false)

    {:ok, _} = price(first_offer, "100", "5", true, @now)
    {:ok, _} = price(second_offer, "80", nil, true, @now)
    {:ok, _} = price(inactive_offer, "10", "0", true, @now)

    assert %{merchant: detail_merchant, summary: summary} =
             Pricing.merchant_detail(merchant.slug, now: @now)

    assert detail_merchant.id == merchant.id

    assert Map.delete(summary, :last_observed_at) == %{
             active_offer_count: 2,
             distinct_product_count: 2,
             observed_offer_count: 2,
             eligible_offer_count: 1,
             fresh_offer_count: 2,
             aging_offer_count: 0,
             stale_offer_count: 0,
             unobserved_offer_count: 0
           }

    assert DateTime.compare(summary.last_observed_at, @now) == :eq
  end

  test "unknown merchant slugs return nil" do
    assert Pricing.merchant_detail("missing-merchant") == nil
  end

  test "merchant details batch preserves single-merchant truth across mixed offer states" do
    {:ok, first_merchant} =
      Pricing.upsert_merchant(%{name: "Batch first", domain: "batch-first.example"})

    {:ok, second_merchant} =
      Pricing.upsert_merchant(%{name: "Batch second", domain: "batch-second.example"})

    {:ok, empty_merchant} =
      Pricing.upsert_merchant(%{name: "Batch empty", domain: "batch-empty.example"})

    first_product = SpecsFixtures.product_fixture()
    second_product = SpecsFixtures.product_fixture()
    third_product = SpecsFixtures.product_fixture()
    fresh_offer = offer(first_merchant, first_product, true)
    _unobserved_offer = offer(first_merchant, second_product, true)
    inactive_offer = offer(first_merchant, third_product, false)
    stale_offer = offer(second_merchant, first_product, true)

    {:ok, _} = price(fresh_offer, "100", "5", true, @now)
    {:ok, _} = price(inactive_offer, "10", "0", true, @now)
    {:ok, _} = price(stale_offer, "90", "5", true, DateTime.add(@now, -345_600, :second))

    details =
      Pricing.merchant_details(
        [first_merchant, second_merchant, empty_merchant],
        now: @now
      )

    assert details[first_merchant] == Pricing.merchant_detail(first_merchant, now: @now)
    assert details[second_merchant] == Pricing.merchant_detail(second_merchant, now: @now)
    assert details[empty_merchant] == Pricing.merchant_detail(empty_merchant, now: @now)

    assert details[first_merchant].summary.active_offer_count == 2
    assert details[first_merchant].summary.unobserved_offer_count == 1
    assert details[second_merchant].summary.stale_offer_count == 1

    assert details[empty_merchant].summary == %{
             active_offer_count: 0,
             distinct_product_count: 0,
             observed_offer_count: 0,
             eligible_offer_count: 0,
             fresh_offer_count: 0,
             aging_offer_count: 0,
             stale_offer_count: 0,
             unobserved_offer_count: 0,
             last_observed_at: nil
           }
  end

  defp offer(merchant, product, active) do
    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://detail.example/#{System.unique_integer([:positive])}",
        currency: "USD",
        is_active: active
      })

    offer
  end

  defp price(offer, amount, shipping, in_stock, observed_at) do
    Pricing.add_price_point(%{
      merchant_product_id: offer.id,
      observed_at: observed_at,
      price: amount,
      shipping: shipping,
      in_stock: in_stock
    })
  end
end
