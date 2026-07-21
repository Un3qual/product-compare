defmodule ProductCompare.Catalog.ProductLookupTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.ProductSlugAlias

  test "batch slug lookup preserves canonical precedence and historical aliases with a fixed budget" do
    historical = SpecsFixtures.product_fixture(%{slug: "batch-product-legacy"})

    assert {:ok, historical} =
             Catalog.update_product(historical, %{slug: "batch-product-current"})

    canonical = SpecsFixtures.product_fixture(%{slug: "batch-product-canonical"})
    other = SpecsFixtures.product_fixture(%{slug: "batch-product-other"})

    %ProductSlugAlias{}
    |> ProductSlugAlias.changeset(%{
      product_id: historical.id,
      slug: canonical.slug
    })
    |> Repo.insert!()

    initial_slugs = [canonical.slug, "batch-product-legacy"]

    {initial_results, initial_queries} =
      capture_select_queries(fn -> Catalog.get_products_by_slugs(initial_slugs) end)

    grown_slugs = initial_slugs ++ [other.slug, "missing-product", "", canonical.slug, nil, 42]

    {grown_results, grown_queries} =
      capture_select_queries(fn -> Catalog.get_products_by_slugs(grown_slugs) end)

    assert [_, _] = initial_queries
    assert [_, _] = grown_queries

    assert initial_results[canonical.slug].id == canonical.id
    assert initial_results["batch-product-legacy"].id == historical.id

    Enum.each(
      [canonical.slug, "batch-product-legacy", other.slug, "missing-product", ""],
      fn slug ->
        assert grown_results[slug] == Catalog.get_product_by_slug(slug)
      end
    )

    assert grown_results[canonical.slug].id == canonical.id
    assert grown_results["batch-product-legacy"].slug == historical.slug
    assert grown_results[other.slug].id == other.id
    assert grown_results["missing-product"] == nil
    assert grown_results[""] == nil
    refute Map.has_key?(grown_results, nil)
    refute Map.has_key?(grown_results, 42)

    assert {empty_results, []} =
             capture_select_queries(fn -> Catalog.get_products_by_slugs([]) end)

    assert empty_results == %{}
  end
end
