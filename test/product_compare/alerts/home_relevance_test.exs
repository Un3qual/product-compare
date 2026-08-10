defmodule ProductCompare.Alerts.HomeRelevanceTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.{Alerts, Catalog}
  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures}
  alias ProductCompare.Pricing

  test "returns only the viewer watch targets and saved products in durable saved order" do
    owner = AccountsFixtures.user_fixture()
    other = AccountsFixtures.user_fixture()

    [first, second, third] =
      Enum.map(1..3, &SpecsFixtures.product_fixture(%{slug: "relevance-#{&1}"}))

    offer = offer(first)

    assert {:ok, _} =
             Alerts.create_watch(owner.id, %{
               product_id: first.id,
               merchant_product_id: offer.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "88"
             })

    assert {:ok, _} =
             Alerts.create_watch(other.id, %{
               product_id: second.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "77"
             })

    assert {:ok, _} =
             Catalog.create_saved_comparison_set(owner.id, %{
               name: "older",
               product_ids: [third.id, second.id]
             })

    assert {:ok, _} =
             Catalog.create_saved_comparison_set(owner.id, %{
               name: "newer",
               product_ids: [second.id, first.id]
             })

    relevance = Alerts.home_relevance(owner.id)

    assert Decimal.eq?(relevance.watch_targets[first.id], Decimal.new("88"))
    refute Map.has_key?(relevance.watch_targets, second.id)
    assert relevance.saved_product_ids == [second.id, first.id, third.id]
  end

  test "deduplicates saved products in SQL before applying the six-product bound" do
    owner = AccountsFixtures.user_fixture()

    [shared | products] =
      Enum.map(1..8, &SpecsFixtures.product_fixture(%{slug: "relevance-boundary-#{&1}"}))

    products
    |> Enum.chunk_every(2)
    |> Enum.with_index(1)
    |> Enum.each(fn {pair, index} ->
      assert {:ok, _} =
               Catalog.create_saved_comparison_set(owner.id, %{
                 name: "Boundary #{index}",
                 product_ids: [shared.id | Enum.map(pair, & &1.id)]
               })
    end)

    saved_product_ids = Alerts.home_relevance(owner.id).saved_product_ids

    assert [_, _, _, _, _, _] = saved_product_ids
    assert MapSet.size(MapSet.new(saved_product_ids)) == 6
    assert shared.id in saved_product_ids
  end

  defp offer(product) do
    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "relevance merchant",
        domain: "relevance-#{product.id}.example"
      })

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://relevance-#{product.id}.example/offer",
        currency: "USD",
        is_active: true
      })

    {:ok, _} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: ~U[2026-08-10 12:00:00Z],
        price: "100",
        shipping: "5",
        in_stock: true
      })

    offer
  end
end
