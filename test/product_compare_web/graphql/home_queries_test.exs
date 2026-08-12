defmodule ProductCompareWeb.GraphQL.HomeQueriesTest do
  use ProductCompareWeb.ConnCase, async: false

  @moduletag sandbox_isolation: "REPEATABLE READ"

  import Ecto.Query, only: [from: 2]

  import ProductCompare.DatabaseTestHelpers,
    only: [capture_select_queries: 1, capture_select_query_events: 1]

  alias ProductCompare.{Alerts, Catalog, Pricing, Repo, Specs}
  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures, TaxonomyFixtures}
  alias ProductCompareWeb.Plugs.PutAbsintheContext
  alias ProductCompareWeb.Resolvers.HomeResolver
  alias ProductCompareWeb.Schema

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
        products(first: 6) { edges { node { id __typename name slug } } }
        selectedProducts { id __typename name slug }
      }
      homeDeals(selectedSlugs: $selectedSlugs) {
        new(first: 6) { edges { node { id __typename name slug } } }
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

  test "historical selected slugs resolve once to the canonical workspace and viewer Product", %{
    conn: conn
  } do
    owner = AccountsFixtures.user_fixture()
    category = category_fixture("canonical-home-alias")
    operator = AccountsFixtures.operator_fixture()
    candidate = qualified_product("canonical-home-alias-old", category, operator, "80")

    assert {:ok, canonical_product} =
             Catalog.update_product(candidate.product, %{slug: "canonical-home-alias-current"})

    query = """
    query CanonicalHomeAlias($selectedSlugs: [String!]!) {
      homeWorkspace(selectedSlugs: $selectedSlugs) {
        selectedProducts { id slug }
      }
      homeDeals(selectedSlugs: $selectedSlugs) {
        forYou(first: 6) {
          edges { node { id slug } reasons { code } }
        }
      }
    }
    """

    assert %{
             "data" => %{
               "homeWorkspace" => %{
                 "selectedProducts" => [%{"id" => selected_id, "slug" => selected_slug}]
               },
               "homeDeals" => %{
                 "forYou" => %{
                   "edges" => [
                     %{
                       "node" => %{"id" => viewer_id, "slug" => viewer_slug},
                       "reasons" => [%{"code" => "CURRENT_COMPARISON"}]
                     }
                   ]
                 }
               }
             }
           } =
             conn
             |> log_in_user(owner)
             |> put_req_header_same_origin()
             |> raw_graphql(query, %{
               "selectedSlugs" => [candidate.product.slug, canonical_product.slug]
             })

    assert selected_id == relay_id(:product, canonical_product.id)
    assert viewer_id == selected_id
    assert selected_slug == canonical_product.slug
    assert viewer_slug == selected_slug
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

  test "a non-empty first For You page executes one viewer ranking query" do
    owner = AccountsFixtures.user_fixture()
    category = category_fixture("viewer-page-first-budget-category")
    operator = AccountsFixtures.operator_fixture()

    candidate =
      non_deal_product("viewer-page-first-budget", category, operator, "80", "120")

    assert {:ok, _} =
             Catalog.create_saved_comparison_set(owner.id, %{
               name: "Viewer page-first budget",
               product_ids: [candidate.product.id]
             })

    {{:ok, connection}, queries} =
      capture_select_queries(fn ->
        HomeResolver.viewer_deals(
          %{current_user: owner, now: DateTime.utc_now(), selected_slugs: []},
          %{first: 1},
          %{}
        )
      end)

    assert [%{node: %{id: product_id}}] = connection.edges
    assert product_id == candidate.product.id
    assert Enum.count(queries, &viewer_ranking_query?/1) == 1
  end

  test "a first-page viewer no-match falls back" do
    owner = AccountsFixtures.user_fixture()
    category = category_fixture("viewer-first-page-fallback-category")
    operator = AccountsFixtures.operator_fixture()

    unmatched =
      non_deal_product("viewer-first-page-unmatched", category, operator, "80", "120")

    assert {:ok, _} =
             Alerts.create_watch(owner.id, %{
               product_id: unmatched.product.id,
               merchant_product_id: unmatched.offer.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "1"
             })

    fallback = qualified_product("viewer-first-page-fallback", category, operator, "90")

    assert {:ok, connection} =
             HomeResolver.viewer_deals(
               %{current_user: owner, now: DateTime.utc_now(), selected_slugs: []},
               %{first: 1},
               %{}
             )

    assert [%{node: %{id: product_id}, reasons: [%{code: :new_offer}]}] = connection.edges
    assert product_id == fallback.product.id
  end

  test "an empty later viewer page distinguishes exhaustion from true fallback" do
    owner_with_match = AccountsFixtures.user_fixture()
    owner_without_match = AccountsFixtures.user_fixture()
    category = category_fixture("viewer-later-page-branch-category")
    operator = AccountsFixtures.operator_fixture()

    personalized =
      non_deal_product("viewer-later-page-exhausted", category, operator, "80", "120")

    assert {:ok, _} =
             Catalog.create_saved_comparison_set(owner_with_match.id, %{
               name: "Viewer page exhaustion",
               product_ids: [personalized.product.id]
             })

    assert {:ok, _} =
             Alerts.create_watch(owner_without_match.id, %{
               product_id: personalized.product.id,
               merchant_product_id: personalized.offer.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "1"
             })

    first_fallback =
      qualified_product("viewer-later-page-fallback-first", category, operator, "90")

    second_fallback =
      qualified_product("viewer-later-page-fallback-second", category, operator, "100")

    after_first = Absinthe.Relay.Connection.offset_to_cursor(0)

    assert {:ok, exhausted_page} =
             HomeResolver.viewer_deals(
               %{current_user: owner_with_match, now: DateTime.utc_now(), selected_slugs: []},
               %{first: 1, after: after_first},
               %{}
             )

    assert exhausted_page.edges == []

    assert {:ok, later_fallback} =
             HomeResolver.viewer_deals(
               %{current_user: owner_without_match, now: DateTime.utc_now(), selected_slugs: []},
               %{first: 1, after: after_first},
               %{}
             )

    assert [%{node: %{id: fallback_product_id}, reasons: [%{code: :new_offer}]}] =
             later_fallback.edges

    assert fallback_product_id == second_fallback.product.id
    refute fallback_product_id == first_fallback.product.id
  end

  test "homeDeals paginates all viewer candidates with truthful cursors", %{conn: conn} do
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

    query = """
    query ViewerDealsPage($selectedSlugs: [String!]!, $first: Int!, $after: String) {
      homeDeals(selectedSlugs: $selectedSlugs) {
        forYou(first: $first, after: $after) {
          edges { node { id } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
    """

    authenticated_conn = conn |> log_in_user(owner) |> put_req_header_same_origin()

    assert %{
             "data" => %{
               "homeDeals" => %{
                 "forYou" => %{
                   "edges" => first_edges,
                   "pageInfo" => %{"hasNextPage" => true, "endCursor" => cursor}
                 }
               }
             }
           } =
             raw_graphql(authenticated_conn, query, %{
               "selectedSlugs" => [],
               "first" => 6,
               "after" => nil
             })

    assert %{
             "data" => %{
               "homeDeals" => %{
                 "forYou" => %{
                   "edges" => second_edges,
                   "pageInfo" => %{"hasNextPage" => false}
                 }
               }
             }
           } =
             raw_graphql(authenticated_conn, query, %{
               "selectedSlugs" => [],
               "first" => 6,
               "after" => cursor
             })

    expected_ids = candidates |> Enum.reverse() |> Enum.map(&relay_id(:product, &1.product.id))
    assert Enum.map(first_edges, &get_in(&1, ["node", "id"])) == Enum.take(expected_ids, 6)
    assert Enum.map(second_edges, &get_in(&1, ["node", "id"])) == Enum.drop(expected_ids, 6)

    assert %{
             "data" => %{
               "homeDeals" => %{
                 "forYou" => %{
                   "edges" => [],
                   "pageInfo" => %{"hasNextPage" => true}
                 }
               }
             }
           } =
             raw_graphql(authenticated_conn, query, %{
               "selectedSlugs" => [],
               "first" => 0,
               "after" => nil
             })

    assert %{"data" => nil, "errors" => [%{"message" => "invalid cursor"} | _]} =
             raw_graphql(authenticated_conn, query, %{
               "selectedSlugs" => [],
               "first" => 6,
               "after" => "not-a-cursor"
             })
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

  test "workspace offer price signals preserve below and equal median outcomes", %{conn: conn} do
    category = category_fixture("workspace-price-signal-category")
    operator = AccountsFixtures.operator_fixture()
    below = qualified_product("workspace-price-signal-below", category, operator, "90")
    equal = qualified_product("workspace-price-signal-equal", category, operator, "100")
    _third = qualified_product("workspace-price-signal-third", category, operator, "120")

    add_price(below.offer, "110", -3_600)
    add_price(equal.offer, "100", -3_600)

    assert %{"data" => %{"homeWorkspace" => %{"products" => products}}} =
             graphql(conn, workspace_query(), %{"selectedSlugs" => []})

    signals = Map.new(products, &{&1["product"]["id"], &1["offer"]["priceSignal"]})
    assert signals[relay_id(:product, below.product.id)] == "BELOW_30_DAY_MEDIAN"
    assert signals[relay_id(:product, equal.product.id)] == "AT_OR_ABOVE_30_DAY_MEDIAN"
  end

  test "New priceSignal is loaded truthfully in one page-scoped batch", %{conn: conn} do
    category = category_fixture("new-price-signal-category")
    operator = AccountsFixtures.operator_fixture()

    candidates =
      Enum.map(1..3, fn index ->
        candidate =
          qualified_product("new-price-signal-#{index}", category, operator, "#{80 + index}")

        add_price(candidate.offer, "#{110 + index}", -3_600)
        candidate
      end)

    query = """
    query NewPriceSignal($first: Int!) {
      homeDeals(selectedSlugs: []) {
        new(first: $first) {
          edges { node { id } offer { merchantProductId priceSignal } }
        }
      }
    }
    """

    {one_response, one_queries} =
      capture_select_queries(fn -> raw_graphql(conn, query, %{"first" => 1}) end)

    {page_response, page_queries} =
      capture_select_queries(fn -> raw_graphql(conn, query, %{"first" => 3}) end)

    irrelevant_products =
      Enum.map(1..8, fn index ->
        candidate =
          qualified_product(
            "new-price-signal-irrelevant-#{index}",
            category,
            operator,
            "#{20 + index}"
          )

        add_price(candidate.offer, "#{120 + index}", -3_600)

        {1, _} =
          Repo.update_all(
            from(offer in ProductCompareSchemas.Pricing.MerchantProduct,
              where: offer.id == ^candidate.offer.id
            ),
            set: [inserted_at: DateTime.add(DateTime.utc_now(), -259_201, :second)]
          )

        candidate
      end)

    {grown_response, grown_queries} =
      capture_select_queries(fn -> raw_graphql(conn, query, %{"first" => 3}) end)

    assert %{"data" => %{"homeDeals" => %{"new" => %{"edges" => [_one]}}}} = one_response

    assert %{"data" => %{"homeDeals" => %{"new" => %{"edges" => edges}}}} = page_response
    assert length(edges) == length(candidates)
    assert Enum.all?(edges, &(get_in(&1, ["offer", "priceSignal"]) == "BELOW_30_DAY_MEDIAN"))
    assert grown_response == page_response

    assert {length(one_queries), length(page_queries), length(grown_queries)} == {2, 2, 2}
    assert length(irrelevant_products) > length(candidates)
  end

  test "New priceSignal hydration excludes the Relay lookahead row", %{conn: conn} do
    category = category_fixture("new-price-signal-lookahead-category")
    operator = AccountsFixtures.operator_fixture()

    returned = qualified_product("new-price-signal-returned", category, operator, "80")
    lookahead = qualified_product("new-price-signal-lookahead", category, operator, "90")
    add_price(returned.offer, "120", -3_600)
    add_price(lookahead.offer, "130", -3_600)

    query = """
    query NewPriceSignalLookahead {
      homeDeals(selectedSlugs: []) {
        new(first: 1) {
          edges { node { id } offer { priceSignal } }
        }
      }
    }
    """

    {response, events} =
      capture_select_query_events(fn -> raw_graphql(conn, query, %{}) end)

    assert %{
             "data" => %{
               "homeDeals" => %{
                 "new" => %{
                   "edges" => [
                     %{
                       "node" => %{"id" => returned_id},
                       "offer" => %{"priceSignal" => "BELOW_30_DAY_MEDIAN"}
                     }
                   ]
                 }
               }
             }
           } = response

    assert returned_id == relay_id(:product, returned.product.id)
    assert [median_event] = Enum.filter(events, &page_fact_median_query?(&1.query))
    params = query_param_values(median_event.params)
    assert returned.product.id in params
    refute lookahead.product.id in params
  end

  test "New selection and its lazy priceSignal share the request observation boundary", %{
    conn: conn
  } do
    category = category_fixture("new-price-signal-boundary-category")
    operator = AccountsFixtures.operator_fixture()
    candidate = qualified_product("new-price-signal-boundary", category, operator, "120")

    context =
      conn
      |> init_test_session(%{})
      |> PutAbsintheContext.call(%{})
      |> then(& &1.private.absinthe.context)
      |> Schema.context()

    observed_at = context.graphql_observed_at

    assert {:ok, _point} =
             Pricing.add_price_point(%{
               merchant_product_id: candidate.offer.id,
               observed_at: observed_at,
               price: "80",
               shipping: "5",
               in_stock: true
             })

    assert {:ok,
            %{
              data: %{
                "homeDeals" => %{
                  "new" => %{
                    "edges" => [
                      %{
                        "node" => %{"id" => product_id},
                        "offer" => %{
                          "merchantProductId" => offer_id,
                          "landedPrice" => "85",
                          "priceSignal" => "BELOW_30_DAY_MEDIAN"
                        }
                      }
                    ]
                  }
                }
              }
            }} =
             Absinthe.run(
               """
               query NewPriceSignalBoundary {
                 homeDeals(selectedSlugs: []) {
                   new(first: 1) {
                     edges {
                       node { id }
                       offer { merchantProductId landedPrice priceSignal }
                     }
                   }
                 }
               }
               """,
               Schema,
               context: context
             )

    assert product_id == relay_id(:product, candidate.product.id)
    assert offer_id == relay_id(:merchant_product, candidate.offer.id)
  end

  test "home category shortcuts return canonical identity fields while keeping USD-only eligibility",
       %{conn: conn} do
    operator = AccountsFixtures.operator_fixture()
    eligible = category_fixture("mixed-currency-home-category")
    ineligible = category_fixture("mixed-currency-ineligible-category")

    Enum.each(1..3, &qualified_product("mixed-usd-#{&1}", eligible, operator, "100"))
    eur_only_product("mixed-eur-4", eligible, operator)

    Enum.each(1..2, &qualified_product("ineligible-usd-#{&1}", ineligible, operator, "100"))
    eur_only_product("ineligible-eur-3", ineligible, operator)

    query = """
    query CategoryIdentity($slug: String!) {
      homeWorkspace(selectedSlugs: []) {
        categories(first: 100) {
          edges { node { id name slug qualifiedProductCount indexable } }
        }
      }
      category(slug: $slug) { id name slug qualifiedProductCount indexable }
    }
    """

    assert %{
             "data" => %{
               "homeWorkspace" => %{"categories" => %{"edges" => shortcut_edges}},
               "category" => canonical
             }
           } = raw_graphql(conn, query, %{"slug" => eligible.seo_slug})

    shortcuts = Enum.map(shortcut_edges, & &1["node"])
    assert Enum.find(shortcuts, &(&1["id"] == canonical["id"])) == canonical
    assert canonical["qualifiedProductCount"] == 4
    refute Enum.any?(shortcuts, &(&1["id"] == relay_id(:taxon, ineligible.id)))
  end

  test "every homepage rail rejects deep traversal before domain database work" do
    owner = AccountsFixtures.user_fixture()
    cursor = Absinthe.Relay.Connection.offset_to_cursor(10_000)
    now = DateTime.utc_now()
    args = %{first: 6, after: cursor}

    reads = [
      workspace_products: fn -> HomeResolver.workspace_products(%{now: now}, args, %{}) end,
      workspace_categories: fn -> HomeResolver.workspace_categories(%{now: now}, args, %{}) end,
      new: fn -> HomeResolver.new_deals(%{now: now}, args, %{}) end,
      trending: fn -> HomeResolver.trending_deals(%{now: now}, args, %{}) end,
      guest_for_you: fn ->
        HomeResolver.viewer_deals(
          %{current_user: nil, now: now, selected_slugs: []},
          args,
          %{}
        )
      end,
      signed_in_for_you: fn ->
        HomeResolver.viewer_deals(
          %{current_user: owner, now: now, selected_slugs: []},
          args,
          %{}
        )
      end
    ]

    assert Map.new(reads, fn {rail, read} ->
             {result, events} = capture_select_query_events(read)
             {rail, {result, events}}
           end) ==
             Map.new(reads, fn {rail, _read} ->
               {rail, {{:error, "invalid cursor"}, []}}
             end)
  end

  test "deep workspace Products rejects before selected-slug SQL when selectedProducts is absent",
       %{
         conn: conn
       } do
    selected = SpecsFixtures.product_fixture(%{slug: "deep-workspace-products-selected"})
    cursor = Absinthe.Relay.Connection.offset_to_cursor(10_000)

    query = """
    query DeepWorkspaceProducts($selectedSlugs: [String!]!, $after: String) {
      homeWorkspace(selectedSlugs: $selectedSlugs) {
        products(first: 6, after: $after) { edges { node { id } } }
      }
    }
    """

    {response, events} =
      capture_select_query_events(fn ->
        raw_graphql(conn, query, %{
          "selectedSlugs" => [selected.slug],
          "after" => cursor
        })
      end)

    assert %{"data" => nil, "errors" => [%{"message" => "invalid cursor"} | _]} = response
    assert events == []
  end

  test "deep workspace categories rejects before selected-slug SQL when selectedProducts is absent",
       %{conn: conn} do
    selected = SpecsFixtures.product_fixture(%{slug: "deep-workspace-categories-selected"})
    cursor = Absinthe.Relay.Connection.offset_to_cursor(10_000)

    query = """
    query DeepWorkspaceCategories($selectedSlugs: [String!]!, $after: String) {
      homeWorkspace(selectedSlugs: $selectedSlugs) {
        categories(first: 6, after: $after) { edges { node { id } } }
      }
    }
    """

    {response, events} =
      capture_select_query_events(fn ->
        raw_graphql(conn, query, %{
          "selectedSlugs" => [selected.slug],
          "after" => cursor
        })
      end)

    assert %{"data" => nil, "errors" => [%{"message" => "invalid cursor"} | _]} = response
    assert events == []
  end

  test "homepage offer facts follow aliases and fragment projection without unselected aggregates",
       %{
         conn: conn
       } do
    category = category_fixture("home-projected-facts")
    operator = AccountsFixtures.operator_fixture()
    candidate = qualified_product("home-projected-facts", category, operator, "80")
    add_price(candidate.offer, "120", -3_600)

    production_deals_query = """
    fragment ProductionHomeDeal on HomeDealsEdge {
      node { id name slug }
      offer { merchantName currency landedPrice observedAt }
      reasons { code watchTarget }
    }

    query ProductionHomeDeals {
      homeDeals(selectedSlugs: []) {
        new(first: 1) { edges { ...ProductionHomeDeal } }
        trending(first: 1) { edges { ...ProductionHomeDeal } }
        forYou(first: 1) { edges { ...ProductionHomeDeal } }
      }
    }
    """

    {deals_response, deal_queries} =
      capture_select_queries(fn -> raw_graphql(conn, production_deals_query, %{}) end)

    assert %{"data" => %{"homeDeals" => %{}}} = deals_response
    refute Enum.any?(deal_queries, &active_offer_count_query?/1)
    refute Enum.any?(deal_queries, &any_page_fact_median_query?/1)

    production_workspace_query = """
    fragment ProductionWorkspaceOffer on HomeOfferSummary {
      merchantName
      currency
      landedPrice
      priceSignal
      observedAt
    }

    query ProductionHomeWorkspace {
      homeWorkspace(selectedSlugs: []) {
        products(first: 1) {
          edges { node { id name slug } offer { ...ProductionWorkspaceOffer } }
        }
      }
    }
    """

    {workspace_response, workspace_queries} =
      capture_select_queries(fn -> raw_graphql(conn, production_workspace_query, %{}) end)

    assert %{
             "data" => %{
               "homeWorkspace" => %{
                 "products" => %{
                   "edges" => [
                     %{"offer" => %{"priceSignal" => "BELOW_30_DAY_MEDIAN"}}
                   ]
                 }
               }
             }
           } = workspace_response

    refute Enum.any?(workspace_queries, &active_offer_count_query?/1)
    assert Enum.count(workspace_queries, &page_fact_median_query?/1) == 1

    facts_query = """
    fragment ProjectedOfferFacts on HomeOfferSummary {
      count: activeOfferCount
      signal: priceSignal
    }

    query HomeWithProjectedFacts {
      homeWorkspace(selectedSlugs: []) {
        products(first: 1) {
          edges { offer { ...ProjectedOfferFacts } }
        }
      }
    }
    """

    {facts_response, fact_queries} =
      capture_select_queries(fn -> raw_graphql(conn, facts_query, %{}) end)

    assert %{
             "data" => %{
               "homeWorkspace" => %{
                 "products" => %{
                   "edges" => [
                     %{
                       "offer" => %{
                         "count" => 1,
                         "signal" => "BELOW_30_DAY_MEDIAN"
                       }
                     }
                   ]
                 }
               }
             }
           } = facts_response

    assert Enum.count(fact_queries, &active_offer_count_query?/1) == 1
    assert Enum.count(fact_queries, &page_fact_median_query?/1) == 1
  end

  test "unrelated activeOfferCount below a homepage product does not load homepage offer facts",
       %{conn: conn} do
    category = category_fixture("home-unrelated-active-offer-count")
    operator = AccountsFixtures.operator_fixture()

    _candidate =
      qualified_product("home-unrelated-active-offer-count", category, operator, "80")

    query = """
    fragment MerchantCounts on MerchantDetailSummary {
      unrelatedCount: activeOfferCount
    }

    fragment ProductMerchantCount on Product {
      merchantProducts(first: 1, activeOnly: true) {
        edges {
          node {
            merchant {
              detailSummary { ...MerchantCounts }
            }
          }
        }
      }
    }

    query HomeWithUnrelatedActiveOfferCount {
      homeWorkspace(selectedSlugs: []) {
        products(first: 1) {
          edges {
            offer { merchantName }
            node { ...ProductMerchantCount }
          }
        }
      }
    }
    """

    {response, queries} = capture_select_queries(fn -> raw_graphql(conn, query, %{}) end)

    assert %{
             "data" => %{
               "homeWorkspace" => %{
                 "products" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "merchantProducts" => %{
                           "edges" => [
                             %{
                               "node" => %{
                                 "merchant" => %{
                                   "detailSummary" => %{"unrelatedCount" => 1}
                                 }
                               }
                             }
                           ]
                         }
                       },
                       "offer" => %{"merchantName" => _merchant_name}
                     }
                   ]
                 }
               }
             }
           } = response

    refute Enum.any?(queries, &active_offer_count_query?/1)
    refute Enum.any?(queries, &any_page_fact_median_query?/1)
  end

  test "fallback New price signals keep a fixed page-scoped query budget" do
    owner = AccountsFixtures.user_fixture()
    category = category_fixture("fallback-price-signal-budget-category")
    operator = AccountsFixtures.operator_fixture()

    Enum.each(1..3, fn index ->
      candidate =
        qualified_product(
          "fallback-price-signal-budget-#{index}",
          category,
          operator,
          "#{80 + index}"
        )

      add_price(candidate.offer, "#{110 + index}", -3_600)
    end)

    read_page = fn first ->
      capture_select_query_events(fn ->
        HomeResolver.viewer_deals(
          %{current_user: owner, now: DateTime.utc_now(), selected_slugs: []},
          %{first: first},
          %{}
        )
      end)
    end

    {{:ok, one_page}, one_queries} = read_page.(1)
    {{:ok, three_page}, three_queries} = read_page.(3)

    assert Enum.all?(one_page.edges, & &1.offer.below_30_day_median?)
    assert Enum.all?(three_page.edges, & &1.offer.below_30_day_median?)
    assert {length(one_queries), length(three_queries)} == {4, 4}
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

    assert {:ok,
            %{data: %{"deal" => nil, "workspaceProduct" => nil, "edge" => %{"fields" => fields}}}} =
             Absinthe.run(
               """
               {
                 deal: __type(name: "HomeDeal") { name }
                 workspaceProduct: __type(name: "HomeWorkspaceProduct") { name }
                 edge: __type(name: "HomeDealsEdge") { fields { name } }
               }
               """,
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

  defp eur_only_product(slug, category, operator) do
    result = qualified_product(slug, category, operator, "100")

    {1, _} =
      Repo.update_all(
        from(offer in ProductCompareSchemas.Pricing.MerchantProduct,
          where: offer.id == ^result.offer.id
        ),
        set: [is_active: false]
      )

    _eur_offer = currency_offer(result.product, "#{slug}-eur", "EUR", "100")

    result.product
  end

  defp add_price(offer, price, observed_offset) do
    {:ok, _point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.add(DateTime.utc_now(), observed_offset, :second),
        price: price,
        shipping: "5",
        in_stock: true
      })
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

  defp active_offer_count_query?(query) do
    Regex.match?(
      ~r/SELECT\s+\w+\."product_id",\s*count\(\w+\."id"\).*FROM "merchant_products"/s,
      query
    )
  end

  defp page_fact_median_query?(query) do
    Regex.match?(
      ~r/^SELECT\s+\w+\."product_id",\s*\w+\."currency",\s*avg\(\w+\."landed_price"\)::decimal\s+FROM/s,
      query
    ) and
      String.contains?(query, ~s(WINDOW "median_rank" AS)) and
      String.contains?(query, ~s("median_count" AS)) and
      String.contains?(query, "BETWEEN")
  end

  defp any_page_fact_median_query?(query) do
    page_fact_median_query?(query) or
      Regex.match?(
        ~r/^SELECT\s+\w+\."product_id",\s*\w+\."currency_id",\s*percentile_cont/s,
        query
      )
  end

  defp viewer_ranking_query?(query) do
    String.contains?(query, ~s("home_relevance" AS MATERIALIZED)) and
      String.contains?(query, ~s(AS "viewer_rank"))
  end

  defp query_param_values(params) do
    Enum.flat_map(params, fn
      values when is_list(values) -> values
      value -> [value]
    end)
  end

  defp graphql(conn, query, variables) do
    conn |> raw_graphql(query, variables) |> normalize_home_connections()
  end

  defp raw_graphql(conn, query, variables) do
    conn |> post("/api/graphql", %{query: query, variables: variables}) |> json_response(200)
  end

  defp normalize_home_connections(%{"data" => data} = response) when is_map(data) do
    data =
      data
      |> Map.update("homeWorkspace", nil, fn
        nil ->
          nil

        workspace ->
          workspace
          |> Map.update("products", [], &connection_rows(&1, "product"))
          |> Map.update("categories", [], &connection_nodes/1)
      end)
      |> Map.update("homeDeals", nil, fn
        nil ->
          nil

        deals ->
          Enum.reduce(~w(new trending forYou), deals, fn field, normalized ->
            Map.update(normalized, field, [], &connection_rows(&1, "product"))
          end)
      end)

    Map.put(response, "data", data)
  end

  defp normalize_home_connections(response), do: response

  defp connection_nodes(%{"edges" => edges}), do: Enum.map(edges, & &1["node"])

  defp connection_rows(%{"edges" => edges}, node_key) do
    Enum.map(edges, fn edge ->
      edge |> Map.put(node_key, edge["node"]) |> Map.drop(["cursor", "node"])
    end)
  end

  defp workspace_query do
    """
    query HomeWorkspace($selectedSlugs: [String!]!) {
      homeWorkspace(selectedSlugs: $selectedSlugs) {
        categories(first: 6) { edges { node { id name slug qualifiedProductCount } } }
        products(first: 6) { edges { node { id name slug } highlights { label value } offer { merchantProductId merchantName currency landedPrice activeOfferCount priceSignal observedAt } } }
        selectedProducts { id name slug }
      }
    }
    """
  end

  defp deals_query do
    """
    query HomeDeals($selectedSlugs: [String!]!) {
      homeDeals(selectedSlugs: $selectedSlugs) {
        new(first: 6) { edges { node { id name slug } offer { merchantProductId merchantName currency landedPrice priceSignal } reasons { code watchTarget } } }
        trending(first: 6) { edges { node { id name slug } offer { merchantProductId merchantName currency landedPrice priceSignal } reasons { code watchTarget } } }
        forYou(first: 6) { edges { node { id name slug } offer { merchantProductId merchantName currency landedPrice priceSignal } reasons { code watchTarget } } }
      }
    }
    """
  end

  defp home_query do
    """
    query Home($selectedSlugs: [String!]!) {
      homeWorkspace(selectedSlugs: $selectedSlugs) {
        products(first: 6) { edges { node { id } highlights { label value } offer { merchantProductId merchantName landedPrice activeOfferCount priceSignal observedAt } } }
        selectedProducts { id }
        categories(first: 6) { edges { node { id } } }
      }
      homeDeals(selectedSlugs: $selectedSlugs) {
        new(first: 6) { edges { node { id } reasons { code watchTarget } } }
        trending(first: 6) { edges { node { id } reasons { code watchTarget } } }
        forYou(first: 6) { edges { node { id } reasons { code watchTarget } } }
      }
    }
    """
  end
end
