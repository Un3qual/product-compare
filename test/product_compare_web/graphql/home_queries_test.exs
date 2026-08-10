defmodule ProductCompareWeb.GraphQL.HomeQueriesTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [capture_select_queries: 1, count_select_queries_targeting_table: 2]

  alias ProductCompare.{Alerts, Catalog, Pricing, Specs}
  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures, TaxonomyFixtures}

  @description String.duplicate("A reliable option with enough detail for comparison. ", 3)

  test "homeWorkspace returns normalized products, category shortcuts, highlights, and current offer facts",
       %{conn: conn} do
    category = category_fixture("workspace-category")
    operator = AccountsFixtures.operator_fixture()

    first = qualified_product("workspace-first", category, operator, "120")
    second = qualified_product("workspace-second", category, operator, "90")
    _third = qualified_product("workspace-third", category, operator, "110")

    assert %{
             "data" => %{
               "homeWorkspace" => %{
                 "products" => products,
                 "selectedProducts" => selected_products,
                 "categories" => [
                   %{
                     "id" => category_id,
                     "name" => "Workspace Category",
                     "slug" => "workspace-category",
                     "qualifiedProductCount" => 3
                   }
                   | _
                 ]
               }
             }
           } =
             graphql(conn, workspace_query(), %{
               "selectedSlugs" => [
                 second.product.slug,
                 "missing",
                 first.product.slug,
                 second.product.slug,
                 "ignored"
               ]
             })

    assert category_id == relay_id(:taxon, category.id)

    assert Enum.map(selected_products, & &1["id"]) == [
             relay_id(:product, second.product.id),
             relay_id(:product, first.product.id)
           ]

    assert %{
             "id" => first_id,
             "name" => first_name,
             "slug" => first_slug,
             "highlights" => [
               %{"label" => "Display 1", "value" => "workspace-first value 1"},
               %{"label" => "Display 2", "value" => "workspace-first value 2"}
             ],
             "offer" => %{
               "merchantProductId" => offer_id,
               "merchantName" => "workspace-first merchant",
               "currency" => "USD",
               "landedPrice" => "125",
               "activeOfferCount" => 1,
               "priceSignal" => "AT_OR_ABOVE_30_DAY_MEDIAN",
               "observedAt" => observed_at
             }
           } = Enum.find(products, &(&1["slug"] == first.product.slug))

    assert first_id == relay_id(:product, first.product.id)
    assert first_name == first.product.name
    assert first_slug == first.product.slug
    assert offer_id == relay_id(:merchant_product, first.offer.id)
    assert {:ok, _observed_at, 0} = DateTime.from_iso8601(observed_at)
  end

  test "homeDeals keeps viewer relevance private and falls back to global deals", %{conn: conn} do
    owner = AccountsFixtures.user_fixture()
    other = AccountsFixtures.user_fixture()
    without_matches = AccountsFixtures.user_fixture()
    category = category_fixture("deals-category")
    operator = AccountsFixtures.operator_fixture()

    watched = qualified_product("watched-deal", category, operator, "95")
    global = qualified_product("global-deal", category, operator, "80")

    assert {:ok, _} =
             Alerts.create_watch(owner.id, %{
               product_id: watched.product.id,
               merchant_product_id: watched.offer.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "75"
             })

    assert {:ok, _} =
             Catalog.create_saved_comparison_set(other.id, %{
               name: "Other person's comparison",
               product_ids: [global.product.id]
             })

    owner_response =
      conn
      |> log_in_user(owner)
      |> put_req_header_same_origin()
      |> graphql(deals_query(), %{"selectedSlugs" => [global.product.slug]})

    assert %{
             "data" => %{
               "homeDeals" => %{
                 "new" => new_deals,
                 "trending" => [],
                 "forYou" => for_you
               }
             }
           } = owner_response

    assert Enum.any?(new_deals, &(&1["product"]["id"] == relay_id(:product, watched.product.id)))

    assert [
             %{
               "product" => %{"id" => watched_id},
               "reasons" => [
                 %{"code" => "WATCH_TARGET", "watchTarget" => "75"}
               ]
             },
             %{
               "product" => %{"id" => global_id},
               "reasons" => [%{"code" => "CURRENT_COMPARISON", "watchTarget" => nil}]
             }
           ] = for_you

    assert watched_id == relay_id(:product, watched.product.id)
    assert global_id == relay_id(:product, global.product.id)

    guest_response = graphql(conn, deals_query(), %{"selectedSlugs" => [global.product.slug]})

    assert %{"data" => %{"homeDeals" => %{"forYou" => []}}} = guest_response

    no_match_response =
      conn
      |> log_in_user(without_matches)
      |> put_req_header_same_origin()
      |> graphql(deals_query(), %{"selectedSlugs" => []})

    assert %{
             "data" => %{
               "homeDeals" => %{
                 "forYou" => [%{"reasons" => [%{"code" => "NEW_OFFER"}]} | _]
               }
             }
           } = no_match_response
  end

  test "home operations retain a fixed read budget and expose only typed deal reasons", %{
    conn: conn
  } do
    category = category_fixture("budget-category")
    operator = AccountsFixtures.operator_fixture()
    products = Enum.map(1..6, &qualified_product("budget-#{&1}", category, operator, "100"))

    {_one_response, one_queries} =
      capture_select_queries(fn ->
        graphql(conn, home_query(), %{"selectedSlugs" => [hd(products).product.slug]})
      end)

    {_six_response, six_queries} =
      capture_select_queries(fn ->
        graphql(conn, home_query(), %{"selectedSlugs" => Enum.map(products, & &1.product.slug)})
      end)

    Enum.each(
      [:products, :merchant_products, :price_points, :product_attribute_currents],
      fn table ->
        assert count_select_queries_targeting_table(one_queries, table) ==
                 count_select_queries_targeting_table(six_queries, table)
      end
    )

    assert {:ok, %{data: %{"__type" => %{"fields" => fields}}}} =
             Absinthe.run(
               "{ __type(name: \"HomeDeal\") { fields { name type { kind name ofType { kind name } } } } }",
               ProductCompareWeb.Schema
             )

    field_names = MapSet.new(fields, & &1["name"])
    assert "reasons" in field_names
    refute "reason" in field_names
    refute "activityCount" in field_names
  end

  defp category_fixture(slug) do
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    TaxonomyFixtures.taxon_fixture(%{
      taxonomy_id: type_taxonomy.id,
      code: slug,
      name: "#{slug |> String.split("-") |> Enum.map_join(" ", &String.capitalize/1)}",
      seo_slug: slug,
      seo_description: @description,
      seo_indexable: true
    })
  end

  defp qualified_product(slug, category, operator, price) do
    product =
      SpecsFixtures.product_fixture(%{
        slug: slug,
        description: @description,
        primary_type_taxon: category
      })

    Enum.each(1..2, fn index ->
      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "#{slug}-attribute-#{index}",
          display_name: "Display #{index}",
          data_type: :text
        })

      {:ok, claim} =
        Specs.propose_claim(product.id, attribute.id, %{value_text: "#{slug} value #{index}"}, %{
          source_type: :user,
          created_by: operator.id
        })

      {:ok, claim} = Specs.accept_claim(claim.id, operator.id)

      assert {:ok, _} =
               Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)
    end)

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
        observed_at: DateTime.utc_now(),
        price: price,
        shipping: "5",
        in_stock: true
      })

    %{product: product, offer: offer}
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/graphql", %{query: query, variables: variables}) |> json_response(200)
  end

  defp workspace_query do
    """
    query HomeWorkspace($selectedSlugs: [String!]!) {
      homeWorkspace(selectedSlugs: $selectedSlugs) {
        categories { id name slug qualifiedProductCount }
        products { id name slug highlights { label value } offer { merchantProductId merchantName currency landedPrice activeOfferCount priceSignal observedAt } }
        selectedProducts { id name slug }
      }
    }
    """
  end

  defp deals_query do
    """
    query HomeDeals($selectedSlugs: [String!]!) {
      homeDeals(selectedSlugs: $selectedSlugs) {
        new { product { id name slug } reasons { code watchTarget } }
        trending { product { id name slug } reasons { code watchTarget } }
        forYou { product { id name slug } reasons { code watchTarget } }
      }
    }
    """
  end

  defp home_query do
    """
    query Home($selectedSlugs: [String!]!) {
      homeWorkspace(selectedSlugs: $selectedSlugs) {
        products { id highlights { label value } offer { merchantProductId merchantName landedPrice activeOfferCount priceSignal observedAt } }
        selectedProducts { id }
        categories { id }
      }
      homeDeals(selectedSlugs: $selectedSlugs) {
        new { product { id } reasons { code watchTarget } }
        trending { product { id } reasons { code watchTarget } }
        forYou { product { id } reasons { code watchTarget } }
      }
    }
    """
  end
end
