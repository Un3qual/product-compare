defmodule ProductCompare.Catalog.ProductLookupTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.ProductSlugAlias

  test "database rejects a historical alias that overlaps a canonical product slug" do
    canonical = product_fixture(%{slug: "reserved-canonical-product"})
    historical = product_fixture(%{slug: "reserved-historical-product"})

    assert {:error, changeset} =
             %ProductSlugAlias{}
             |> ProductSlugAlias.changeset(%{
               product_id: historical.id,
               slug: canonical.slug
             })
             |> Repo.insert()

    assert "has already been taken" in errors_on(changeset).slug
  end

  test "database rejects a canonical product slug that overlaps a historical alias" do
    historical = product_fixture(%{slug: "reserved-prior-product"})

    assert {:ok, current} =
             Catalog.update_product(historical, %{slug: "reserved-current-product"})

    assert {:error, changeset} =
             Catalog.create_product(%{
               brand_id: current.brand_id,
               primary_type_taxon_id: current.primary_type_taxon_id,
               name: "Conflicting Canonical Product",
               slug: historical.slug
             })

    assert "has already been taken" in errors_on(changeset).slug
  end

  test "historical slug aliases are immutable in changesets and direct SQL" do
    product = product_fixture(%{slug: "immutable-prior-product"})

    assert {:ok, product} =
             Catalog.update_product(product, %{slug: "immutable-current-product"})

    alias_record =
      Repo.get_by!(ProductSlugAlias,
        product_id: product.id,
        slug: "immutable-prior-product"
      )

    changeset =
      ProductSlugAlias.changeset(alias_record, %{
        slug: "rewritten-historical-product"
      })

    refute changeset.valid?
    assert "cannot be changed after creation" in errors_on(changeset).slug

    assert_raise Postgrex.Error, ~r/product slug aliases are immutable/, fn ->
      Repo.query!(
        "UPDATE product_slug_aliases SET slug = $1 WHERE id = $2",
        ["rewritten-historical-product", alias_record.id]
      )
    end
  end

  test "batch slug lookup returns canonical and historical slugs with a fixed budget" do
    historical = product_fixture(%{slug: "batch-product-legacy"})

    assert {:ok, historical} =
             Catalog.update_product(historical, %{slug: "batch-product-current"})

    canonical = product_fixture(%{slug: "batch-product-canonical"})
    other = product_fixture(%{slug: "batch-product-other"})

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

  defp product_fixture(attrs) do
    taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    taxon =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: taxonomy.id,
        code: "lookup-#{Ecto.UUID.generate()}",
        name: "Lookup Product"
      })

    {:ok, brand} = Catalog.upsert_brand(%{name: "Lookup Brand #{Ecto.UUID.generate()}"})

    attrs
    |> Map.put(:primary_type_taxon, taxon)
    |> Map.put(:brand_id, brand.id)
    |> SpecsFixtures.product_fixture()
  end
end
