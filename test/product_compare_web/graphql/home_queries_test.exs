defmodule ProductCompareWeb.GraphQL.HomeQueriesTest do
  use ProductCompareWeb.ConnCase, async: false

  import Ecto.Query, only: [from: 2]
  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.{Alerts, Catalog, Pricing, Repo, Specs}
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
                     "taxonId" => category_id,
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
             "product" => %{
               "id" => first_id,
               "name" => first_name,
               "slug" => first_slug
             },
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
           } = Enum.find(products, &(get_in(&1, ["product", "slug"]) == first.product.slug))

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
               "product" => %{"id" => global_id},
               "reasons" => [%{"code" => "CURRENT_COMPARISON", "watchTarget" => nil}]
             }
           ] = for_you

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

  test "homeDeals includes non-deal watched, saved, and current products in reason precedence order",
       %{conn: conn} do
    owner = AccountsFixtures.user_fixture()
    category = category_fixture("private-candidates-category")
    operator = AccountsFixtures.operator_fixture()

    watched = non_deal_product("private-watched", category, operator, "120", "100")
    saved = non_deal_product("private-saved", category, operator, "110", "100")
    current = non_deal_product("private-current", category, operator, "100", "80")

    assert {:ok, _} =
             Alerts.create_watch(owner.id, %{
               product_id: watched.product.id,
               merchant_product_id: watched.offer.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "130"
             })

    assert {:ok, _} =
             Catalog.create_saved_comparison_set(owner.id, %{
               name: "Private candidates",
               product_ids: [saved.product.id]
             })

    assert %{
             "data" => %{
               "homeDeals" => %{
                 "new" => [],
                 "trending" => [],
                 "forYou" => for_you
               }
             }
           } =
             conn
             |> log_in_user(owner)
             |> put_req_header_same_origin()
             |> graphql(deals_query(), %{"selectedSlugs" => [current.product.slug]})

    assert Enum.map(for_you, &get_in(&1, ["product", "id"])) == [
             relay_id(:product, watched.product.id),
             relay_id(:product, saved.product.id),
             relay_id(:product, current.product.id)
           ]

    assert Enum.map(for_you, &get_in(&1, ["reasons", Access.at(0), "code"])) == [
             "WATCH_TARGET",
             "SAVED_COMPARISON",
             "CURRENT_COMPARISON"
           ]

    assert Enum.map(for_you, &get_in(&1, ["offer", "priceSignal"])) == [
             "AT_OR_ABOVE_30_DAY_MEDIAN",
             "AT_OR_ABOVE_30_DAY_MEDIAN",
             "AT_OR_ABOVE_30_DAY_MEDIAN"
           ]
  end

  test "home operations expose one canonical Product identity in every homepage position", %{
    conn: conn
  } do
    category = category_fixture("canonical-home-product")
    operator = AccountsFixtures.operator_fixture()
    candidate = qualified_product("canonical-home-product", category, operator, "80")

    query = """
    query CanonicalHomeProduct($selectedSlugs: [String!]!) {
      homeWorkspace(selectedSlugs: $selectedSlugs) {
        products { product { id __typename name slug } }
        selectedProducts { id __typename name slug }
      }
      homeDeals(selectedSlugs: $selectedSlugs) {
        new { product { id __typename name slug } }
      }
    }
    """

    assert %{
             "data" => %{
               "homeWorkspace" => %{
                 "products" => products,
                 "selectedProducts" => [selected]
               },
               "homeDeals" => %{"new" => new_deals}
             }
           } = graphql(conn, query, %{"selectedSlugs" => [candidate.product.slug]})

    workspace = Enum.find(products, &(&1["product"]["id"] == selected["id"]))["product"]
    deal = Enum.find(new_deals, &(&1["product"]["id"] == selected["id"]))["product"]

    assert workspace == selected
    assert deal == selected
    assert selected["__typename"] == "Product"
  end

  test "homeDeals matches the exact listing watch and falls back when a target is unmet", %{
    conn: conn
  } do
    owner = AccountsFixtures.user_fixture()
    category = category_fixture("exact-watch-category")
    operator = AccountsFixtures.operator_fixture()
    watched = non_deal_product("exact-watch", category, operator, "80", "100")
    watched_listing = currency_offer(watched.product, "exact-watch-listing", "USD", "110")
    unmet = non_deal_product("unmet-watch", category, operator, "100", "120")

    assert {:ok, _} =
             Alerts.create_watch(owner.id, %{
               product_id: watched.product.id,
               merchant_product_id: watched_listing.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "120"
             })

    assert {:ok, _} =
             Alerts.create_watch(owner.id, %{
               product_id: unmet.product.id,
               merchant_product_id: unmet.offer.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "90"
             })

    assert {:ok, _} =
             Catalog.create_saved_comparison_set(owner.id, %{
               name: "Unmet watch fallback",
               product_ids: [unmet.product.id]
             })

    assert %{"data" => %{"homeDeals" => %{"forYou" => for_you}}} =
             conn
             |> log_in_user(owner)
             |> put_req_header_same_origin()
             |> graphql(deals_query(), %{"selectedSlugs" => []})

    assert %{
             "offer" => %{"merchantProductId" => watched_offer_id, "landedPrice" => "115"},
             "reasons" => [%{"code" => "WATCH_TARGET", "watchTarget" => "120"}]
           } =
             Enum.find(
               for_you,
               &(&1["product"]["id"] == relay_id(:product, watched.product.id))
             )

    assert watched_offer_id == relay_id(:merchant_product, watched_listing.id)

    assert %{"reasons" => [%{"code" => "SAVED_COMPARISON", "watchTarget" => nil}]} =
             Enum.find(
               for_you,
               &(&1["product"]["id"] == relay_id(:product, unmet.product.id))
             )
  end

  test "homeDeals ignores EUR watches and preserves saved/current USD relevance", %{conn: conn} do
    owner = AccountsFixtures.user_fixture()
    other = AccountsFixtures.user_fixture()
    category = category_fixture("watch-currency-category")
    operator = AccountsFixtures.operator_fixture()

    saved = non_deal_product("watch-currency-saved", category, operator, "120", "100")
    current = non_deal_product("watch-currency-current", category, operator, "110", "100")

    saved_eur_offer = currency_offer(saved.product, "watch-currency-saved-eur", "EUR", "60")
    current_eur_offer = currency_offer(current.product, "watch-currency-current-eur", "EUR", "50")

    assert {:ok, _} =
             Alerts.create_watch(owner.id, %{
               product_id: saved.product.id,
               merchant_product_id: saved_eur_offer.id,
               rule_type: :target_price,
               currency: "EUR",
               target_amount: "70"
             })

    assert {:ok, _} =
             Alerts.create_watch(owner.id, %{
               product_id: current.product.id,
               merchant_product_id: current_eur_offer.id,
               rule_type: :target_price,
               currency: "EUR",
               target_amount: "65"
             })

    assert {:ok, _} =
             Catalog.create_saved_comparison_set(owner.id, %{
               name: "USD homepage relevance",
               product_ids: [saved.product.id]
             })

    assert %{"data" => %{"homeDeals" => %{"forYou" => for_you}}} =
             conn
             |> log_in_user(owner)
             |> put_req_header_same_origin()
             |> graphql(deals_query(), %{"selectedSlugs" => [current.product.slug]})

    assert Enum.map(for_you, &get_in(&1, ["product", "id"])) == [
             relay_id(:product, saved.product.id),
             relay_id(:product, current.product.id)
           ]

    assert Enum.map(for_you, &get_in(&1, ["reasons", Access.at(0)])) == [
             %{"code" => "SAVED_COMPARISON", "watchTarget" => nil},
             %{"code" => "CURRENT_COMPARISON", "watchTarget" => nil}
           ]

    assert Enum.all?(for_you, &(get_in(&1, ["offer", "currency"]) == "USD"))

    assert %{"data" => %{"homeDeals" => %{"forYou" => []}}} =
             conn
             |> log_in_user(other)
             |> put_req_header_same_origin()
             |> graphql(deals_query(), %{"selectedSlugs" => []})
  end

  test "homeDeals ranks same-reason viewer candidates by improvement before absolute price", %{
    conn: conn
  } do
    owner = AccountsFixtures.user_fixture()
    category = category_fixture("improvement-category")
    operator = AccountsFixtures.operator_fixture()

    larger_improvement = non_deal_product("larger-improvement", category, operator, "105", "125")

    lower_absolute_price =
      non_deal_product("lower-absolute-price", category, operator, "80", "90")

    assert {:ok, _} =
             Catalog.create_saved_comparison_set(owner.id, %{
               name: "Improvement ordering",
               product_ids: [larger_improvement.product.id, lower_absolute_price.product.id]
             })

    assert %{"data" => %{"homeDeals" => %{"forYou" => for_you}}} =
             conn
             |> log_in_user(owner)
             |> put_req_header_same_origin()
             |> graphql(deals_query(), %{"selectedSlugs" => []})

    assert Enum.map(for_you, &get_in(&1, ["product", "id"])) == [
             relay_id(:product, larger_improvement.product.id),
             relay_id(:product, lower_absolute_price.product.id)
           ]
  end

  test "homeDeals keeps only the six highest-ranked viewer candidates", %{conn: conn} do
    owner = AccountsFixtures.user_fixture()
    category = category_fixture("viewer-boundary-category")
    operator = AccountsFixtures.operator_fixture()

    candidates =
      Enum.map(1..8, fn index ->
        non_deal_product(
          "viewer-boundary-#{index}",
          category,
          operator,
          "100",
          Integer.to_string(100 + index * 10)
        )
      end)

    candidates
    |> Enum.chunk_every(3)
    |> Enum.with_index(1)
    |> Enum.each(fn {comparison, index} ->
      assert {:ok, _} =
               Catalog.create_saved_comparison_set(owner.id, %{
                 name: "Viewer boundary #{index}",
                 product_ids: Enum.map(comparison, & &1.product.id)
               })
    end)

    assert %{"data" => %{"homeDeals" => %{"forYou" => for_you}}} =
             conn
             |> log_in_user(owner)
             |> put_req_header_same_origin()
             |> graphql(deals_query(), %{"selectedSlugs" => []})

    assert Enum.map(for_you, &get_in(&1, ["product", "id"])) ==
             candidates
             |> Enum.reverse()
             |> Enum.take(6)
             |> Enum.map(&relay_id(:product, &1.product.id))
  end

  test "homeDeals New identity belongs to the returned new merchant product", %{conn: conn} do
    category = category_fixture("new-identity-category")
    operator = AccountsFixtures.operator_fixture()
    old_cheap = qualified_product("new-identity", category, operator, "40")

    Repo.update_all(
      from(offer in ProductCompareSchemas.Pricing.MerchantProduct,
        where: offer.id == ^old_cheap.offer.id
      ),
      set: [inserted_at: DateTime.add(DateTime.utc_now(), -259_201, :second)]
    )

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "new-identity current merchant",
        domain: "new-identity-current.example"
      })

    {:ok, new_offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: old_cheap.product.id,
        url: "https://new-identity-current.example/offer",
        currency: "USD",
        is_active: true
      })

    {:ok, _} =
      Pricing.add_price_point(%{
        merchant_product_id: new_offer.id,
        observed_at: DateTime.utc_now(),
        price: "80",
        shipping: "5",
        in_stock: true
      })

    assert %{"data" => %{"homeDeals" => %{"new" => new_deals}}} =
             graphql(conn, deals_query(), %{"selectedSlugs" => []})

    assert %{
             "offer" => %{
               "merchantProductId" => returned_offer_id,
               "merchantName" => "new-identity current merchant",
               "currency" => "USD",
               "landedPrice" => "85"
             }
           } =
             Enum.find(
               new_deals,
               &(&1["product"]["id"] == relay_id(:product, old_cheap.product.id))
             )

    assert returned_offer_id == relay_id(:merchant_product, new_offer.id)
  end

  test "homepage GraphQL uses the deterministic USD offer instead of price-ranking currencies", %{
    conn: conn
  } do
    category = category_fixture("currency-policy-category")
    operator = AccountsFixtures.operator_fixture()
    usd = qualified_product("currency-policy", category, operator, "100")

    {:ok, merchant} =
      Pricing.upsert_merchant(%{name: "EUR merchant", domain: "currency-policy-eur.example"})

    {:ok, eur_offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: usd.product.id,
        url: "https://currency-policy-eur.example/offer",
        currency: "EUR",
        is_active: true
      })

    {:ok, _} =
      Pricing.add_price_point(%{
        merchant_product_id: eur_offer.id,
        observed_at: DateTime.utc_now(),
        price: "1",
        shipping: "1",
        in_stock: true
      })

    assert %{"data" => %{"homeWorkspace" => %{"products" => products}}} =
             graphql(conn, workspace_query(), %{"selectedSlugs" => []})

    assert %{
             "offer" => %{
               "merchantProductId" => usd_offer_id,
               "merchantName" => "currency-policy merchant",
               "currency" => "USD",
               "landedPrice" => "105",
               "activeOfferCount" => 1
             }
           } =
             Enum.find(
               products,
               &(get_in(&1, ["product", "id"]) == relay_id(:product, usd.product.id))
             )

    assert usd_offer_id == relay_id(:merchant_product, usd.offer.id)
  end

  test "home operations retain a fixed read budget and expose only typed deal reasons", %{
    conn: conn
  } do
    category = category_fixture("budget-category")
    operator = AccountsFixtures.operator_fixture()
    products = Enum.map(1..6, &qualified_product("budget-#{&1}", category, operator, "100"))

    {guest_one_response, guest_one_queries} =
      capture_select_queries(fn ->
        graphql(conn, home_query(), %{"selectedSlugs" => [hd(products).product.slug]})
      end)

    {guest_six_response, guest_six_queries} =
      capture_select_queries(fn ->
        graphql(conn, home_query(), %{"selectedSlugs" => Enum.map(products, & &1.product.slug)})
      end)

    assert %{"data" => _} = guest_one_response
    assert %{"data" => _} = guest_six_response
    assert_select_histograms_equal(guest_one_queries, guest_six_queries)

    owner = AccountsFixtures.user_fixture()

    assert {:ok, _} =
             Alerts.create_watch(owner.id, %{
               product_id: hd(products).product.id,
               merchant_product_id: hd(products).offer.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "99"
             })

    assert {:ok, _} =
             Catalog.create_saved_comparison_set(owner.id, %{
               name: "Budget relevance",
               product_ids: [Enum.at(products, 1).product.id]
             })

    authenticated_conn = conn |> log_in_user(owner) |> put_req_header_same_origin()

    {authenticated_one_response, authenticated_one_queries} =
      capture_select_queries(fn ->
        graphql(authenticated_conn, home_query(), %{
          "selectedSlugs" => [hd(products).product.slug]
        })
      end)

    {authenticated_six_response, authenticated_six_queries} =
      capture_select_queries(fn ->
        graphql(authenticated_conn, home_query(), %{
          "selectedSlugs" => Enum.map(products, & &1.product.slug)
        })
      end)

    assert %{"data" => _} = authenticated_one_response
    assert %{"data" => _} = authenticated_six_response
    assert_select_histograms_equal(authenticated_one_queries, authenticated_six_queries)

    authenticated_histogram = select_histogram(authenticated_one_queries)
    assert authenticated_histogram["price_watch_rules"] > 0
    assert authenticated_histogram["saved_comparison_sets"] > 0
    assert authenticated_histogram["saved_comparison_items"] > 0

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

  defp non_deal_product(slug, category, operator, current_price, historical_price) do
    result = qualified_product(slug, category, operator, current_price)
    offer_id = result.offer.id

    assert {:ok, _} =
             Pricing.add_price_point(%{
               merchant_product_id: result.offer.id,
               observed_at: DateTime.add(DateTime.utc_now(), -3_600, :second),
               price: historical_price,
               shipping: "5",
               in_stock: true
             })

    {1, _} =
      Repo.update_all(
        from(offer in ProductCompareSchemas.Pricing.MerchantProduct,
          where: offer.id == ^offer_id
        ),
        set: [inserted_at: DateTime.add(DateTime.utc_now(), -259_201, :second)]
      )

    result
  end

  defp currency_offer(product, slug, currency, price) do
    {:ok, merchant} =
      Pricing.upsert_merchant(%{name: "#{slug} merchant", domain: "#{slug}.example"})

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://#{slug}.example/offer",
        currency: currency,
        is_active: true
      })

    {:ok, _point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.utc_now(),
        price: price,
        shipping: "5",
        in_stock: true
      })

    offer
  end

  defp assert_select_histograms_equal(first_queries, second_queries) do
    assert length(first_queries) == length(second_queries)
    assert select_histogram(first_queries) == select_histogram(second_queries)
  end

  defp select_histogram(queries) do
    Enum.reduce(queries, %{}, fn query, histogram ->
      ~r/\b(?:FROM|JOIN)\s+"([^"]+)"/i
      |> Regex.scan(query, capture: :all_but_first)
      |> List.flatten()
      |> MapSet.new()
      |> Enum.reduce(histogram, fn table, acc -> Map.update(acc, table, 1, &(&1 + 1)) end)
    end)
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/graphql", %{query: query, variables: variables}) |> json_response(200)
  end

  defp workspace_query do
    """
    query HomeWorkspace($selectedSlugs: [String!]!) {
      homeWorkspace(selectedSlugs: $selectedSlugs) {
        categories { taxonId name slug qualifiedProductCount }
        products { product { id name slug } highlights { label value } offer { merchantProductId merchantName currency landedPrice activeOfferCount priceSignal observedAt } }
        selectedProducts { id name slug }
      }
    }
    """
  end

  defp deals_query do
    """
    query HomeDeals($selectedSlugs: [String!]!) {
      homeDeals(selectedSlugs: $selectedSlugs) {
        new { product { id name slug } offer { merchantProductId merchantName currency landedPrice priceSignal } reasons { code watchTarget } }
        trending { product { id name slug } offer { merchantProductId merchantName currency landedPrice priceSignal } reasons { code watchTarget } }
        forYou { product { id name slug } offer { merchantProductId merchantName currency landedPrice priceSignal } reasons { code watchTarget } }
      }
    }
    """
  end

  defp home_query do
    """
    query Home($selectedSlugs: [String!]!) {
      homeWorkspace(selectedSlugs: $selectedSlugs) {
        products { product { id } highlights { label value } offer { merchantProductId merchantName landedPrice activeOfferCount priceSignal observedAt } }
        selectedProducts { id }
        categories { taxonId }
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
