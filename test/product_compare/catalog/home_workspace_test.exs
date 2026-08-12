defmodule ProductCompare.Catalog.HomeWorkspaceTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers,
    only: [capture_select_queries: 1, count_select_queries_targeting_table: 2]

  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures}
  alias ProductCompare.Pricing
  alias ProductCompare.Specs

  @now ~U[2026-08-10 12:00:00Z]
  @description String.duplicate("Useful comparison details. ", 4)

  test "pages ranked eligible products and preserves normalized selected order" do
    operator = AccountsFixtures.operator_fixture()

    eligible =
      Enum.map(1..7, fn index ->
        eligible_product("workspace-#{index}", operator)
      end)

    _without_spec = product_with_offer("workspace-no-spec", operator, 0)
    _stale = product_with_offer("workspace-stale", operator, -86_401, 2)

    products = Catalog.home_workspace_product_candidates(now: @now, limit: 6)

    selected_products =
      Catalog.home_workspace_selected_products([
        Enum.at(eligible, 6).slug,
        "missing",
        Enum.at(eligible, 1).slug,
        Enum.at(eligible, 6).slug,
        Enum.at(eligible, 0).slug,
        Enum.at(eligible, 2).slug
      ])

    assert Enum.map(products, & &1.id) == Enum.map(Enum.take(eligible, 6), & &1.id)

    assert Enum.map(
             Catalog.home_workspace_product_candidates(now: @now, offset: 6, limit: 2),
             & &1.id
           ) == [Enum.at(eligible, 6).id]

    assert Enum.map(selected_products, & &1.id) == [
             Enum.at(eligible, 6).id,
             Enum.at(eligible, 1).id
           ]
  end

  test "selected products resolve historical slugs to one canonical product in input order" do
    first = SpecsFixtures.product_fixture(%{slug: "workspace-alias-first"})
    second = SpecsFixtures.product_fixture(%{slug: "workspace-alias-second"})

    assert {:ok, canonical_first} =
             Catalog.update_product(first, %{slug: "workspace-alias-first-current"})

    assert Enum.map(
             Catalog.home_workspace_selected_products([
               first.slug,
               second.slug,
               canonical_first.slug,
               "missing"
             ]),
             &{&1.id, &1.slug}
           ) == [
             {canonical_first.id, canonical_first.slug},
             {second.id, second.slug}
           ]
  end

  test "uses a fixed select budget for one and six eligible products" do
    operator = AccountsFixtures.operator_fixture()
    products = Enum.map(1..6, &eligible_product("workspace-budget-#{&1}", operator))

    {one, one_queries} =
      capture_select_queries(fn ->
        Catalog.home_workspace_product_candidates(now: @now, limit: 1)
      end)

    {six, six_queries} =
      capture_select_queries(fn ->
        Catalog.home_workspace_product_candidates(now: @now, limit: 6)
      end)

    assert [_product] = one
    assert length(six) == length(products)

    assert count_select_queries_targeting_table(one_queries, :products) ==
             count_select_queries_targeting_table(six_queries, :products)

    assert count_select_queries_targeting_table(one_queries, :merchant_products) ==
             count_select_queries_targeting_table(six_queries, :merchant_products)
  end

  test "qualifies the bounded product page with correlated existence probes" do
    operator = AccountsFixtures.operator_fixture()
    _product = eligible_product("workspace-correlated-probes", operator)

    {[_candidate], queries} =
      capture_select_queries(fn ->
        Catalog.home_workspace_product_candidates(now: @now, limit: 1)
      end)

    product_query = Enum.find(queries, &String.contains?(&1, ~s(FROM "products")))

    assert Enum.count_until(Regex.scan(~r/\bEXISTS\s*\(/i, product_query), 2) == 2
    assert product_query =~ ~s(FROM "merchant_products")
    assert product_query =~ ~s(FROM "product_attribute_current")
    refute product_query =~ "JOIN (SELECT DISTINCT ON"
    refute product_query =~ "min("
    refute product_query =~ "percentile_cont"
    refute product_query =~ ~s(WINDOW "median_rank" AS)
  end

  test "includes the 24-hour boundary but requires the latest observation to remain in stock" do
    operator = AccountsFixtures.operator_fixture()
    inclusive = product_with_offer("workspace-24h", operator, -86_400, 2)
    exclusive = product_with_offer("workspace-24h-plus", operator, -86_401, 2)
    latest_out = product_with_offer("workspace-latest-out", operator, -3_600, 2)

    offer =
      ProductCompare.Repo.one!(
        Ecto.Query.from(offer in ProductCompareSchemas.Pricing.MerchantProduct,
          where: offer.product_id == ^latest_out.id
        )
      )

    {:ok, _} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: @now,
        price: "90",
        shipping: "5",
        in_stock: false
      })

    candidates = Catalog.home_workspace_product_candidates(now: @now, limit: 6)
    candidate_ids = MapSet.new(candidates, & &1.id)

    assert inclusive.id in candidate_ids
    refute exclusive.id in candidate_ids
    refute latest_out.id in candidate_ids
  end

  test "ignores a future out-of-stock observation when choosing the current workspace offer" do
    operator = AccountsFixtures.operator_fixture()
    product = eligible_product("workspace-future", operator)

    offer =
      ProductCompare.Repo.one!(
        Ecto.Query.from(offer in ProductCompareSchemas.Pricing.MerchantProduct,
          where: offer.product_id == ^product.id
        )
      )

    {:ok, _future} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.add(@now, 3_600, :second),
        price: "1",
        shipping: "0",
        in_stock: false
      })

    assert [candidate] = Catalog.home_workspace_product_candidates(now: @now, limit: 6)
    assert candidate.id == product.id
  end

  defp eligible_product(slug, operator), do: product_with_offer(slug, operator, 0, 2)

  defp product_with_offer(slug, operator, observed_offset, specifications \\ 0) do
    product = SpecsFixtures.product_fixture(%{slug: slug, description: @description})

    if specifications > 0 do
      Enum.each(1..specifications, fn index ->
        attribute = SpecsFixtures.attribute_fixture(%{code: "#{slug}-#{index}", data_type: :text})

        {:ok, claim} =
          Specs.propose_claim(product.id, attribute.id, %{value_text: "Display #{index}"}, %{
            source_type: :user,
            created_by: operator.id
          })

        {:ok, claim} = Specs.accept_claim(claim.id, operator.id)
        {:ok, _} = Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)
      end)
    end

    {:ok, merchant} =
      Pricing.upsert_merchant(%{name: "#{slug} merchant", domain: "#{slug}.example"})

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://#{slug}.example/offer",
        currency: "USD",
        is_active: true
      })

    {:ok, _} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.add(@now, observed_offset, :second),
        price: "100",
        shipping: "5",
        in_stock: true
      })

    product
  end
end
