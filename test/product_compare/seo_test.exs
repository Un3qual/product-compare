defmodule ProductCompare.SeoTest do
  use ProductCompare.DataCase, async: true

  @moduletag sandbox_isolation: "REPEATABLE READ"

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.ComparisonSnapshots
  alias ProductCompare.Catalog
  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures, TaxonomyFixtures}
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompare.Seo
  alias ProductCompare.Specs
  alias ProductCompareWeb.GraphQL.Connection
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

  test "set-based attribute reads preserve accepted claims for requested products" do
    operator = AccountsFixtures.operator_fixture()
    product = qualified_product("batched-evidence-product", operator)
    empty_product = SpecsFixtures.product_fixture(%{slug: "batched-evidence-empty"})
    missing_product_id = empty_product.id + 1_000_000

    attributes =
      Specs.list_current_attributes_for_products([
        product.id,
        empty_product.id,
        missing_product_id
      ])

    assert Enum.map(attributes[product.id], & &1.claim.status) == [:accepted, :accepted]
    assert attributes[empty_product.id] == []
    assert attributes[missing_product_id] == []
    assert attributes[product.id] == Specs.list_current_attributes_for_product(product.id)
    assert Specs.list_current_attributes_for_products([]) == %{}
  end

  test "batch product metadata preserves product qualification and structured data without per-product reads" do
    operator = AccountsFixtures.operator_fixture()
    reviewed = qualified_product("batch-reviewed", operator)
    zero_review = qualified_product("batch-zero-review", operator)

    assert {:ok, review} =
             Discussions.submit_review(AccountsFixtures.user_fixture().id, reviewed.id, %{
               rating: 4,
               title: "Published review",
               body: "This review is public."
             })

    assert {:ok, _} = Discussions.moderate(operator.id, :review, review.entropy_id, :published)

    thin_copy =
      qualified_product("batch-thin-copy", operator)
      |> Catalog.update_product(%{description: "Too thin"})
      |> then(fn {:ok, product} -> product end)

    missing_offer = specified_product("batch-missing-offer", operator)
    missing_specification = product_with_offer("batch-missing-specification")

    image_qualified =
      specified_product("batch-image-qualified", operator, nil, nil)
      |> product_with_offer()
      |> attach_primary_image()

    products = [
      reviewed,
      zero_review,
      thin_copy,
      missing_offer,
      missing_specification,
      image_qualified
    ]

    {metadata_by_product, queries} =
      capture_select_queries(fn -> Seo.product_metadata_batch(products, now: @now) end)

    assert map_size(metadata_by_product) == length(products)

    Enum.each(products, fn product ->
      assert metadata_by_product[product] == Seo.product_metadata(product, now: @now)
    end)

    assert metadata_by_product[reviewed].indexable

    assert metadata_by_product[reviewed].structured_data["offers"] == %{
             "@type" => "AggregateOffer",
             "availability" => "https://schema.org/InStock",
             "lowPrice" => "105",
             "offerCount" => 1,
             "priceCurrency" => "USD"
           }

    assert metadata_by_product[reviewed].structured_data["aggregateRating"] == %{
             "@type" => "AggregateRating",
             "ratingValue" => "4.00",
             "reviewCount" => 1
           }

    assert metadata_by_product[zero_review].indexable
    refute Map.has_key?(metadata_by_product[zero_review].structured_data, "aggregateRating")
    refute metadata_by_product[thin_copy].indexable
    refute metadata_by_product[missing_offer].indexable
    refute metadata_by_product[missing_specification].indexable

    assert metadata_by_product[image_qualified].indexable

    assert metadata_by_product[image_qualified].image_url ==
             "https://cdn.example/batch-image-qualified.jpg"

    assert [_, _, _, _, _, _, _, _, _, _] = queries
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

  test "EUR-only facts remain qualified on shared SEO surfaces but not homepage shortcuts" do
    operator = AccountsFixtures.operator_fixture()
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    category =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: type_taxonomy.id,
        code: "eur-only-category",
        name: "EUR Only Category",
        seo_slug: "eur-only-category",
        seo_description: @description,
        seo_indexable: true
      })

    {:ok, merchant} =
      Pricing.upsert_merchant(%{name: "EUR Only Merchant", domain: "eur-only.example"})

    products =
      Enum.map(1..3, fn index ->
        product = specified_product("eur-only-product-#{index}", operator, category)

        {:ok, offer} =
          Pricing.upsert_merchant_product(%{
            merchant_id: merchant.id,
            product_id: product.id,
            url: "https://eur-only.example/product-#{index}",
            currency: "EUR",
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
      end)

    assert %{indexable: true, qualified_product_count: 3} =
             Seo.get_category(category.seo_slug, now: @now)

    assert Enum.map(Repo.all(Seo.qualified_products_for_taxon_query(category.id, @now)), & &1.id) ==
             Enum.map(products, & &1.id)

    product_paths = MapSet.new(Seo.sitemap_entries(:products, now: @now), & &1.path)
    merchant_paths = MapSet.new(Seo.sitemap_entries(:merchants, now: @now), & &1.path)
    category_paths = MapSet.new(Seo.sitemap_entries(:categories, now: @now), & &1.path)

    assert Enum.all?(products, &MapSet.member?(product_paths, "/products/#{&1.slug}"))
    assert MapSet.member?(merchant_paths, "/merchants/#{merchant.slug}")
    assert MapSet.member?(category_paths, "/categories/#{category.seo_slug}")
    refute category.id in Enum.map(Seo.home_category_shortcuts(now: @now), & &1.id)
  end

  test "batch category lookup preserves singular qualification with a fixed query budget" do
    operator = AccountsFixtures.operator_fixture()
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    categories =
      Enum.map(1..4, fn index ->
        category =
          TaxonomyFixtures.taxon_fixture(%{
            taxonomy_id: type_taxonomy.id,
            code: "batched-category-#{index}",
            name: "Batched Category #{index}",
            seo_slug: "batched-category-#{index}",
            seo_description:
              String.duplicate("Compare trusted category evidence and current offers. ", 2),
            seo_indexable: true
          })

        if index <= 2 do
          Enum.each(1..(4 - index), fn product_index ->
            qualified_product(
              "batched-category-#{index}-product-#{product_index}",
              operator,
              category
            )
          end)
        end

        category
      end)

    nonindexable =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: type_taxonomy.id,
        code: "batched-category-private",
        name: "Private Category",
        seo_slug: "batched-category-private",
        seo_description: @description,
        seo_indexable: false
      })

    slugs = Enum.map(categories, & &1.seo_slug)

    {two_categories, two_queries} =
      capture_select_queries(fn -> Seo.get_categories(Enum.take(slugs, 2), now: @now) end)

    {all_categories, all_queries} =
      capture_select_queries(fn ->
        Seo.get_categories(slugs ++ ["missing-category", "", nonindexable.seo_slug], now: @now)
      end)

    assert [_, _] = two_queries
    assert [_, _] = all_queries

    Enum.each(Enum.take(slugs, 2), fn slug ->
      assert two_categories[slug] == Seo.get_category(slug, now: @now)
    end)

    Enum.each(slugs, fn slug ->
      assert all_categories[slug] == Seo.get_category(slug, now: @now)
    end)

    assert all_categories["batched-category-1"].qualified_product_count == 3
    assert all_categories["batched-category-1"].indexable
    assert all_categories["batched-category-2"].qualified_product_count == 2
    refute all_categories["batched-category-2"].indexable
    assert all_categories["missing-category"] == nil
    assert all_categories[""] == nil
    assert all_categories[nonindexable.seo_slug] == nil
    assert Seo.get_categories([], now: @now) == %{}
  end

  test "batch category product pages preserve descendant qualification and independent Relay windows" do
    operator = AccountsFixtures.operator_fixture()
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    parent =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: type_taxonomy.id,
        code: "batched-parent",
        name: "Batched Parent"
      })

    child =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: type_taxonomy.id,
        parent_id: parent.id,
        code: "batched-child",
        name: "Batched Child"
      })

    direct_parent = qualified_product("batched-parent-product", operator, parent)

    child_products =
      Enum.map(1..4, fn index ->
        qualified_product("batched-child-product-#{index}", operator, child)
      end)

    _unqualified_child =
      SpecsFixtures.product_fixture(%{slug: "batched-child-thin", primary_type_taxon: child})

    missing_taxon_id = child.id + 1_000_000
    first_args = %{first: 2}
    assert {:ok, first_window} = Connection.batch_window(first_args)

    {first_pages, first_queries} =
      capture_select_queries(fn ->
        Seo.qualified_product_pages([parent.id, child.id, missing_taxon_id], @now, first_window)
      end)

    assert [_query] = first_queries

    assert Enum.map(first_pages[parent.id], & &1.id) ==
             Enum.map(Enum.take(child_products, 3), & &1.id)

    assert Enum.map(first_pages[child.id], & &1.id) ==
             Enum.map(Enum.take(child_products, 3), & &1.id)

    refute direct_parent.id in Enum.map(first_pages[parent.id], & &1.id)
    assert first_pages[missing_taxon_id] == []

    assert Connection.from_prefetched_page(first_pages[parent.id], first_args) ==
             Connection.from_query(
               Seo.qualified_products_for_taxon_query(parent.id, @now),
               first_args,
               Repo
             )

    assert {:ok, first_connection} =
             Connection.from_prefetched_page(first_pages[child.id], first_args)

    next_args = %{first: 2, after: first_connection.page_info.end_cursor}
    assert {:ok, next_window} = Connection.batch_window(next_args)

    {next_pages, next_queries} =
      capture_select_queries(fn ->
        Seo.qualified_product_pages([parent.id, child.id], @now, next_window)
      end)

    assert [_query] = next_queries

    Enum.each([parent.id, child.id], fn taxon_id ->
      assert Connection.from_prefetched_page(next_pages[taxon_id], next_args) ==
               Connection.from_query(
                 Seo.qualified_products_for_taxon_query(taxon_id, @now),
                 next_args,
                 Repo
               )
    end)

    assert {empty_pages, []} =
             capture_select_queries(fn ->
               Seo.qualified_product_pages([], @now, first_window)
             end)

    assert empty_pages == %{}
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

    thin_snapshots =
      Enum.map(1..200, fn index ->
        %{
          entropy_id: Ecto.UUID.generate(),
          public_token:
            :sha256
            |> :crypto.hash("thin-snapshot-#{index}")
            |> Base.url_encode64(padding: false),
          user_id: owner.id,
          version: 1,
          captured_at: DateTime.add(@now, index, :microsecond),
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

  test "home category shortcuts keep only qualified indexable categories in deterministic count order" do
    operator = AccountsFixtures.operator_fixture()
    taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    larger =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: taxonomy.id,
        code: "home-larger",
        name: "Alpha Home",
        seo_slug: "alpha-home",
        seo_description: @description,
        seo_indexable: true
      })

    smaller =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: taxonomy.id,
        code: "home-smaller",
        name: "Beta Home",
        seo_slug: "beta-home",
        seo_description: @description,
        seo_indexable: true
      })

    Enum.each(1..4, &qualified_product("home-larger-#{&1}", operator, larger))
    Enum.each(1..3, &qualified_product("home-smaller-#{&1}", operator, smaller))

    assert Enum.map(Seo.home_category_shortcuts(now: @now, limit: 1), & &1.id) == [larger.id]

    assert Enum.map(Seo.home_category_shortcuts(now: @now, limit: 6), & &1.id) == [
             larger.id,
             smaller.id
           ]
  end

  test "home category shortcuts bound high-cardinality results in the database order" do
    operator = AccountsFixtures.operator_fixture()
    taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    categories =
      Enum.map(1..8, fn index ->
        category =
          TaxonomyFixtures.taxon_fixture(%{
            taxonomy_id: taxonomy.id,
            code: "home-boundary-#{index}",
            name: "Home Boundary #{index}",
            seo_slug: "home-boundary-#{index}",
            seo_description: @description,
            seo_indexable: true
          })

        Enum.each(1..3, &qualified_product("home-boundary-#{index}-#{&1}", operator, category))
        category
      end)

    {shortcuts, queries} =
      capture_select_queries(fn -> Seo.home_category_shortcuts(now: @now, limit: 100) end)

    assert [_, _, _, _, _, _] = shortcuts
    assert Enum.map(shortcuts, & &1.id) == Enum.map(Enum.take(categories, 6), & &1.id)
    assert Enum.any?(queries, &String.contains?(&1, "LIMIT"))
  end

  defp qualified_product(slug, operator, primary_type_taxon \\ nil) do
    product = specified_product(slug, operator, primary_type_taxon)

    product_with_offer(product)
  end

  defp specified_product(slug, operator, primary_type_taxon \\ nil, description \\ @description) do
    product =
      SpecsFixtures.product_fixture(%{
        slug: slug,
        description: description,
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

    product
  end

  defp product_with_offer(%{id: _id} = product), do: product_with_offer(product, product.slug)

  defp product_with_offer(slug) do
    SpecsFixtures.product_fixture(%{slug: slug, description: @description})
    |> product_with_offer(slug)
  end

  defp product_with_offer(product, slug) do
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

  defp attach_primary_image(product) do
    Catalog.upsert_product_media(
      product,
      nil,
      [
        %{
          url: "https://cdn.example/#{product.slug}.jpg",
          role: "primary",
          position: 0,
          alt_text: "#{product.name} primary image"
        }
      ],
      @now
    )

    product
  end
end
