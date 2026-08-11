defmodule ProductCompare.Alerts.HomeRelevanceTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.{Alerts, Catalog, Repo}
  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures}
  alias ProductCompare.Pricing

  test "returns only the viewer watch targets and deduplicated saved products" do
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

    candidates = owner.id |> Alerts.home_relevance_candidates_query([]) |> Repo.all()
    watch = Enum.find(candidates, &(&1.reason_rank == 0))

    saved_product_ids =
      candidates |> Enum.filter(&(&1.reason_rank == 1)) |> Enum.map(& &1.product_id)

    assert watch.product_id == first.id
    assert watch.merchant_product_id == offer.id
    assert Decimal.eq?(watch.watch_target, Decimal.new("88"))
    refute Enum.any?(candidates, &(&1.reason_rank == 0 and &1.product_id == second.id))
    assert MapSet.new(saved_product_ids) == MapSet.new([second.id, first.id, third.id])
  end

  test "deduplicates saved products in the composable relevance query" do
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

    saved_product_ids =
      owner.id
      |> Alerts.home_relevance_candidates_query([])
      |> Repo.all()
      |> Enum.filter(&(&1.reason_rank == 1))
      |> Enum.map(& &1.product_id)

    assert [_, _, _, _, _, _, _, _] = saved_product_ids
    assert MapSet.size(MapSet.new(saved_product_ids)) == 8
    assert shared.id in saved_product_ids
  end

  test "excludes non-USD watches before composing viewer relevance" do
    owner = AccountsFixtures.user_fixture()

    eur_products =
      Enum.map(1..2, &SpecsFixtures.product_fixture(%{slug: "relevance-eur-#{&1}"}))

    usd_products =
      Enum.map(1..8, &SpecsFixtures.product_fixture(%{slug: "relevance-usd-#{&1}"}))

    Enum.each(eur_products, &create_target_watch(owner.id, &1.id, "EUR", "50"))
    Enum.each(usd_products, &create_target_watch(owner.id, &1.id, "USD", "75"))

    {candidates, queries} =
      capture_select_queries(fn ->
        owner.id |> Alerts.home_relevance_candidates_query([]) |> Repo.all()
      end)

    watch_candidates = Enum.filter(candidates, &(&1.reason_rank == 0))
    expected_ids = usd_products |> Enum.map(& &1.id) |> MapSet.new()

    assert [_, _, _, _, _, _, _, _] = watch_candidates
    assert MapSet.new(watch_candidates, & &1.product_id) == expected_ids

    assert Enum.all?(watch_candidates, fn candidate ->
             Decimal.eq?(candidate.watch_target, Decimal.new("75"))
           end)

    assert [_relevance_query] = queries
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

  defp create_target_watch(user_id, product_id, currency, target_amount) do
    assert {:ok, _watch} =
             Alerts.create_watch(user_id, %{
               product_id: product_id,
               rule_type: :target_price,
               currency: currency,
               target_amount: target_amount
             })
  end
end
