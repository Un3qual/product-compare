defmodule ProductCompare.SeoTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.ComparisonSnapshots
  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures, TaxonomyFixtures}
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompare.Seo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot

  @now ~U[2026-07-13 20:00:00Z]
  @description String.duplicate("Evidence-rich product description for careful shoppers. ", 3)

  test "product qualification requires useful accepted specifications, adequate content, and current eligible offers" do
    operator = AccountsFixtures.operator_fixture()
    product = qualified_product("qualified-search-product", operator)

    metadata = Seo.product_metadata(product, now: @now)

    assert metadata.indexable
    assert metadata.canonical_path == "/products/qualified-search-product"
    assert metadata.structured_data["@type"] == "Product"
    assert metadata.structured_data["offers"]["priceCurrency"] == "USD"

    thin_product = SpecsFixtures.product_fixture(%{slug: "thin-search-product"})
    refute Seo.product_metadata(thin_product, now: @now).indexable

    assert Enum.map(Seo.sitemap_entries(:products, now: @now), & &1.path) == [
             "/products/qualified-search-product"
           ]
  end

  test "curated categories qualify only after three qualifying products" do
    operator = AccountsFixtures.operator_fixture()
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    category =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: type_taxonomy.id,
        code: "search-cameras",
        name: "Search Cameras",
        seo_slug: "search-cameras",
        seo_description:
          String.duplicate("Compare trusted camera specifications and fresh offers. ", 2),
        seo_indexable: true
      })

    Enum.each(1..3, fn index ->
      qualified_product("category-camera-#{index}", operator, category)
    end)

    assert %{indexable: true, qualified_product_count: 3} =
             Seo.get_category("search-cameras", now: @now)

    assert Enum.map(Seo.sitemap_entries(:categories, now: @now), & &1.path) == [
             "/categories/search-cameras"
           ]
  end

  test "comparison snapshots are private to search by default and require explicit opt-in plus captured evidence" do
    operator = AccountsFixtures.operator_fixture()
    owner = AccountsFixtures.user_fixture()
    first = qualified_product("snapshot-search-first", operator)
    second = qualified_product("snapshot-search-second", operator)

    assert {:ok, private_snapshot} =
             ComparisonSnapshots.publish(
               owner.id,
               %{
                 product_ids: [first.id, second.id],
                 recommendation_profile: :lowest_current_cost
               },
               now: @now
             )

    refute Seo.snapshot_metadata(private_snapshot).indexable

    assert {:ok, public_snapshot} =
             ComparisonSnapshots.publish(
               owner.id,
               %{
                 title: "Search camera comparison",
                 product_ids: [first.id, second.id],
                 recommendation_profile: :lowest_current_cost,
                 search_indexable: true
               },
               now: @now
             )

    assert Seo.snapshot_metadata(public_snapshot).indexable

    assert Enum.map(Seo.sitemap_entries(:comparisons, now: @now), & &1.path) == [
             "/compare/shared/#{public_snapshot.public_token}"
           ]

    assert {:ok, _revoked} = ComparisonSnapshots.revoke(owner.id, public_snapshot.entropy_id)
    assert Seo.sitemap_entries(:comparisons, now: @now) == []
  end

  test "comparison sitemap limits apply after captured-evidence qualification" do
    owner = AccountsFixtures.user_fixture()
    thin_first = SpecsFixtures.product_fixture(%{slug: "thin-snapshot-first"})
    thin_second = SpecsFixtures.product_fixture(%{slug: "thin-snapshot-second"})

    assert {:ok, _thin_snapshot} =
             ComparisonSnapshots.publish(
               owner.id,
               %{
                 product_ids: [thin_first.id, thin_second.id],
                 recommendation_profile: :lowest_current_cost,
                 search_indexable: true
               },
               now: @now
             )

    assert {:ok, _second_thin_snapshot} =
             ComparisonSnapshots.publish(
               owner.id,
               %{
                 product_ids: [thin_second.id, thin_first.id],
                 recommendation_profile: :lowest_current_cost,
                 search_indexable: true
               },
               now: DateTime.add(@now, 1, :microsecond)
             )

    operator = AccountsFixtures.operator_fixture()
    qualified_first = qualified_product("limited-snapshot-first", operator)
    qualified_second = qualified_product("limited-snapshot-second", operator)

    assert {:ok, qualified_snapshot} =
             ComparisonSnapshots.publish(
               owner.id,
               %{
                 product_ids: [qualified_first.id, qualified_second.id],
                 recommendation_profile: :lowest_current_cost,
                 search_indexable: true
               },
               now: @now
             )

    assert Seo.sitemap_entries(:comparisons, now: @now, limit: 1) == [
             %{
               path: "/compare/shared/#{qualified_snapshot.public_token}",
               last_modified: qualified_snapshot.inserted_at
             }
           ]
  end

  test "comparison sitemap qualification is resolved in one bounded database read" do
    owner = AccountsFixtures.user_fixture()

    thin_payload = %{
      version: 1,
      products: [
        %{name: "Thin first", slug: "thin-first", attributes: [], offers: []},
        %{name: "Thin second", slug: "thin-second", attributes: [], offers: []}
      ]
    }

    thin_snapshots =
      Enum.map(1..200, fn index ->
        %{
          entropy_id: Ecto.UUID.generate(),
          public_token:
            :sha256
            |> :crypto.hash("thin-snapshot-#{index}")
            |> Base.url_encode64(padding: false),
          user_id: owner.id,
          payload: thin_payload,
          search_indexable: true,
          inserted_at: DateTime.add(@now, index, :microsecond)
        }
      end)

    assert {200, nil} = Repo.insert_all(ComparisonSnapshot, thin_snapshots)

    operator = AccountsFixtures.operator_fixture()
    qualified_first = qualified_product("bounded-snapshot-first", operator)
    qualified_second = qualified_product("bounded-snapshot-second", operator)

    assert {:ok, qualified_snapshot} =
             ComparisonSnapshots.publish(
               owner.id,
               %{
                 product_ids: [qualified_first.id, qualified_second.id],
                 recommendation_profile: :lowest_current_cost,
                 search_indexable: true
               },
               now: @now
             )

    {entries, queries} =
      capture_select_queries(fn -> Seo.sitemap_entries(:comparisons, now: @now, limit: 1) end)

    assert entries == [
             %{
               path: "/compare/shared/#{qualified_snapshot.public_token}",
               last_modified: qualified_snapshot.inserted_at
             }
           ]

    comparison_queries =
      Enum.filter(queries, &String.contains?(&1, ~s(FROM "comparison_snapshots")))

    assert [_query] = comparison_queries
  end

  test "product slug changes preserve a permanent lookup alias without polluting canonical sitemap paths" do
    product = SpecsFixtures.product_fixture(%{slug: "legacy-search-slug"})

    assert {:ok, updated} = Catalog.update_product(product, %{slug: "canonical-search-slug"})
    assert Catalog.get_product_by_slug("legacy-search-slug").id == updated.id
    assert Catalog.get_product_by_slug("legacy-search-slug").slug == "canonical-search-slug"
    assert Catalog.get_product_by_slug("canonical-search-slug").id == updated.id

    assert {:error, :slug_reserved} =
             Catalog.update_product(updated, %{slug: "legacy-search-slug"})
  end

  defp qualified_product(slug, operator, primary_type_taxon \\ nil) do
    product =
      SpecsFixtures.product_fixture(%{
        slug: slug,
        description: @description,
        primary_type_taxon: primary_type_taxon
      })

    Enum.each(["Resolution", "Weight"], fn label ->
      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "#{slug}-#{String.downcase(label)}",
          data_type: :text,
          display_name: label
        })

      {:ok, claim} =
        Specs.propose_claim(product.id, attribute.id, %{value_text: "Known #{label}"}, %{
          source_type: :user,
          created_by: operator.id
        })

      {:ok, claim} = Specs.accept_claim(claim.id, operator.id)

      {:ok, _current} =
        Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)
    end)

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "#{slug} merchant",
        domain: "#{slug}.example"
      })

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://#{slug}.example/product",
        currency: "USD",
        is_active: true
      })

    {:ok, _point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: @now,
        price: "100",
        shipping: "5",
        in_stock: true
      })

    product
  end
end
