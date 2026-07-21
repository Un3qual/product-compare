defmodule ProductCompareWeb.GraphQL.DataloaderBatchingTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.{Affiliate, Catalog, Discussions, Pricing, Specs}
  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures}

  @tracked_tables ~w(products brands merchant_products merchants price_points)a
  @product_evidence_tables ~w(product_media product_attribute_current product_reviews merchant_products price_points)a
  @community_connection_tables ~w(product_reviews product_threads thread_posts)a
  @viewer_submission_tables ~w(product_reviews product_threads thread_posts)a
  @offer_connection_tables ~w(merchant_products coupons price_points)a
  @merchant_offer_connection_tables ~w(merchant_products price_points)a
  @evidence_description "Evidence-rich product description for careful shoppers considering performance, value, compatibility, and trusted retail availability."

  describe "/api/graphql dataloader batching" do
    test "single request keeps dataloader-backed field batches bounded", %{
      conn: conn,
      test: test_name
    } do
      first_product =
        SpecsFixtures.product_fixture(%{
          slug: "#{test_name}-first-product",
          name: "First Batched Product"
        })

      second_product =
        SpecsFixtures.product_fixture(%{
          slug: "#{test_name}-second-product",
          name: "Second Batched Product"
        })

      merchant_products =
        1..4
        |> Enum.map(fn index ->
          merchant =
            merchant_fixture(%{
              name: unique_name("Bounded Merchant #{index}"),
              domain: unique_domain("bounded-#{index}")
            })

          merchant_product =
            merchant_product_fixture(%{
              merchant: merchant,
              product: first_product,
              is_active: true
            })

          {:ok, latest_price} =
            Pricing.add_price_point(%{
              merchant_product_id: merchant_product.id,
              observed_at:
                DateTime.utc_now()
                |> DateTime.add(index, :second)
                |> DateTime.truncate(:microsecond),
              price: Decimal.new("#{200 + index}.99")
            })

          {merchant_product, merchant, latest_price}
        end)

      {response, queries} =
        capture_select_queries(fn ->
          graphql(conn, batching_query(), %{
            "firstSlug" => first_product.slug,
            "secondSlug" => second_product.slug,
            "input" => %{
              "productId" => relay_id(:product, first_product.id),
              "first" => 10
            }
          })
        end)

      relevant_queries = Enum.filter(queries, &relevant_query?/1)
      query_counts = count_queries_by_table(relevant_queries)

      assert %{
               "data" => %{
                 "firstProduct" => %{
                   "id" => first_product_id,
                   "brand" => %{"id" => first_brand_id}
                 },
                 "secondProduct" => %{
                   "id" => second_product_id,
                   "brand" => %{"id" => second_brand_id}
                 },
                 "merchantProducts" => %{
                   "edges" => edges
                 }
               }
             } = response

      assert first_product_id == relay_id(:product, first_product.id)
      assert second_product_id == relay_id(:product, second_product.id)
      assert first_brand_id == relay_id(:brand, first_product.brand_id)
      assert second_brand_id == relay_id(:brand, second_product.brand_id)
      assert [_, _, _, _] = edges

      Enum.each(merchant_products, fn {merchant_product, merchant, latest_price} ->
        assert Enum.any?(edges, fn edge ->
                 edge["node"] == %{
                   "id" => relay_id(:merchant_product, merchant_product.id),
                   "merchant" => %{
                     "id" => relay_id(:merchant, merchant.id),
                     "name" => merchant.name
                   },
                   "product" => %{
                     "id" => relay_id(:product, first_product.id),
                     "slug" => first_product.slug
                   },
                   "latestPrice" => %{
                     "id" => relay_id(:price_point, latest_price.id),
                     "price" => Decimal.to_string(latest_price.price)
                   }
                 }
               end)
      end)

      assert query_counts == %{
               products: 3,
               brands: 1,
               merchant_products: 1,
               merchants: 1,
               price_points: 1
             }
    end

    test "merchant detail summaries keep a fixed offer and price query budget as parents grow", %{
      conn: conn
    } do
      product = SpecsFixtures.product_fixture(%{name: "Summary batch product"})

      initial_merchants =
        for index <- 1..2 do
          merchant = merchant_fixture(%{name: unique_name("Summary Merchant #{index}")})
          merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})

          {:ok, _point} =
            Pricing.add_price_point(%{
              merchant_product_id: merchant_product.id,
              observed_at: DateTime.utc_now(),
              price: Decimal.new("#{100 + index}.00"),
              shipping: Decimal.new("5.00"),
              in_stock: true
            })

          merchant
        end

      empty_merchant = merchant_fixture(%{name: unique_name("Summary Empty")})

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, merchant_summary_batch_query(), %{"first" => 3})
        end)

      initial_edges = get_in(initial_response, ["data", "merchants", "edges"])
      assert [_, _, _] = initial_edges
      assert summary_for(initial_edges, empty_merchant.name)["activeOfferCount"] == 0

      Enum.each(initial_merchants, fn merchant ->
        assert summary_for(initial_edges, merchant.name) == %{
                 "activeOfferCount" => 1,
                 "distinctProductCount" => 1,
                 "eligibleOfferCount" => 1,
                 "unobservedOfferCount" => 0
               }
      end)

      initial_budget = merchant_summary_query_budget(initial_queries)

      for index <- 3..5 do
        merchant = merchant_fixture(%{name: unique_name("Summary Merchant #{index}")})
        merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})

        {:ok, _point} =
          Pricing.add_price_point(%{
            merchant_product_id: merchant_product.id,
            observed_at: DateTime.utc_now(),
            price: Decimal.new("#{100 + index}.00"),
            shipping: Decimal.new("5.00"),
            in_stock: true
          })
      end

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, merchant_summary_batch_query(), %{"first" => 6})
        end)

      assert grown_response |> get_in(["data", "merchants", "edges"]) |> length() == 6
      assert initial_budget == %{merchant_products: 1, price_points: 1}
      assert merchant_summary_query_budget(grown_queries) == initial_budget
    end

    test "merchant offer connections keep Relay values and SELECT budgets fixed as parents grow",
         %{conn: conn, test: test_name} do
      initial_merchants = merchant_offer_parents("#{test_name}-initial", 1..3)

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, merchant_offer_connections_batch_query(), %{"first" => 3})
        end)

      initial_nodes = merchant_offer_connection_nodes(initial_response)
      assert [_, _, _] = initial_nodes
      assert_merchant_offer_connection_values(initial_nodes, initial_merchants)

      grown_merchants =
        initial_merchants ++ merchant_offer_parents("#{test_name}-grown", 4..6)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, merchant_offer_connections_batch_query(), %{"first" => 6})
        end)

      grown_nodes = merchant_offer_connection_nodes(grown_response)
      assert [_, _, _, _, _, _] = grown_nodes
      assert_merchant_offer_connection_values(grown_nodes, grown_merchants)

      fixed_budget = %{merchant_products: 1, price_points: 1}

      assert {
               merchant_offer_connection_query_budget(initial_queries),
               merchant_offer_connection_query_budget(grown_queries)
             } == {fixed_budget, fixed_budget}
    end

    test "product evidence fields keep semantic values and SELECT budgets fixed as parents grow",
         %{conn: conn} do
      operator = AccountsFixtures.operator_fixture()
      prefix = "product-evidence-#{System.unique_integer([:positive])}"
      initial_products = product_evidence_set("#{prefix}-initial", operator)

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, product_evidence_batch_query(), %{"first" => 3})
        end)

      initial_nodes = product_evidence_nodes(initial_response)
      assert [_, _, _] = initial_nodes
      assert_product_evidence_values(initial_nodes, initial_products)

      initial_budget = product_evidence_query_budget(initial_queries)

      assert initial_budget == %{
               product_media: 1,
               product_attribute_current: 1,
               product_reviews: 2,
               merchant_products: 2,
               price_points: 2
             }

      grown_products = initial_products ++ product_evidence_set("#{prefix}-grown", operator)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, product_evidence_batch_query(), %{"first" => 6})
        end)

      grown_nodes = product_evidence_nodes(grown_response)
      assert [_, _, _, _, _, _] = grown_nodes
      assert_product_evidence_values(grown_nodes, grown_products)
      assert product_evidence_query_budget(grown_queries) == initial_budget
      assert_offer_as_of_is_shared(initial_nodes)
      assert_offer_as_of_is_shared(grown_nodes)
    end

    test "community connections keep their public Relay values and SELECT budgets fixed as parents grow",
         %{conn: conn, test: test_name} do
      operator = AccountsFixtures.operator_fixture()
      prefix = "community-connections-#{test_name}-#{System.unique_integer([:positive])}"

      initial_products =
        Enum.map(["first", "second"], fn suffix ->
          public_community_product("#{prefix}-#{suffix}", operator)
        end)

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, community_connections_batch_query(), %{"first" => 10})
        end)

      initial_nodes = community_connection_nodes(initial_response)
      assert [_, _] = initial_nodes
      assert_public_community_connection_values(initial_nodes, initial_products)

      initial_budget = community_connection_query_budget(initial_queries)

      assert initial_budget == %{
               product_reviews: 1,
               product_threads: 1,
               thread_posts: 1
             }

      grown_products =
        initial_products ++
          Enum.map(["third", "fourth"], fn suffix ->
            public_community_product("#{prefix}-#{suffix}", operator)
          end)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, community_connections_batch_query(), %{"first" => 10})
        end)

      grown_nodes = community_connection_nodes(grown_response)
      assert [_, _, _, _] = grown_nodes
      assert_public_community_connection_values(grown_nodes, grown_products)
      assert community_connection_query_budget(grown_queries) == initial_budget
    end

    test "viewer community submissions keep owner values and SELECT budgets fixed as parents grow",
         %{conn: conn, test: test_name} do
      previous_discussion_config =
        Application.get_env(:product_compare, ProductCompare.Discussions)

      on_exit(fn ->
        if previous_discussion_config do
          Application.put_env(
            :product_compare,
            ProductCompare.Discussions,
            previous_discussion_config
          )
        else
          Application.delete_env(:product_compare, ProductCompare.Discussions)
        end
      end)

      Application.put_env(:product_compare, ProductCompare.Discussions,
        community_write_limits: [review: 10, question: 10, answer: 30, report: 30]
      )

      owner = AccountsFixtures.user_fixture()
      operator = AccountsFixtures.operator_fixture()
      owner_conn = conn |> log_in_user(owner) |> put_req_header_same_origin()
      prefix = "viewer-submissions-#{test_name}-#{System.unique_integer([:positive])}"

      initial_products = viewer_submission_products(prefix, owner, operator, 1..3)

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(owner_conn, viewer_submissions_batch_query(), %{"first" => 3})
        end)

      initial_nodes = viewer_submission_nodes(initial_response)
      assert [_, _, _] = initial_nodes
      assert_viewer_submission_values(initial_nodes, initial_products)

      initial_budget = viewer_submission_query_budget(initial_queries)

      assert initial_budget == %{
               product_reviews: 1,
               product_threads: 1,
               thread_posts: 1
             }

      grown_products =
        initial_products ++ viewer_submission_products(prefix, owner, operator, 4..6)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(owner_conn, viewer_submissions_batch_query(), %{"first" => 6})
        end)

      grown_nodes = viewer_submission_nodes(grown_response)
      assert [_, _, _, _, _, _] = grown_nodes
      assert_viewer_submission_values(grown_nodes, grown_products)
      assert viewer_submission_query_budget(grown_queries) == initial_budget
    end

    test "compare-shaped offer connections keep Relay values and SELECT budgets fixed as parents grow",
         %{conn: conn, test: test_name} do
      anchor = DateTime.utc_now() |> DateTime.truncate(:microsecond)

      merchants =
        for index <- 1..3 do
          merchant_fixture(%{
            name: unique_name("Compare Merchant #{index}"),
            domain: unique_domain("compare-#{index}")
          })
        end

      coupons = offer_connection_coupons(merchants, anchor)

      initial_products =
        offer_connection_products("#{test_name}-initial", merchants, anchor, 1..3)

      variables = %{
        "first" => 3,
        "historyFrom" => anchor |> DateTime.add(-7_200, :second) |> DateTime.to_iso8601(),
        "historyTo" => DateTime.to_iso8601(anchor)
      }

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, offer_connections_batch_query(), variables)
        end)

      assert %{"data" => %{"products" => %{"edges" => _edges}}} = initial_response
      initial_nodes = offer_connection_nodes(initial_response)
      assert [_, _, _] = initial_nodes

      assert_offer_connection_values(
        initial_nodes,
        initial_products,
        coupons
      )

      grown_products =
        initial_products ++
          offer_connection_products("#{test_name}-grown", merchants, anchor, 4..6)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, offer_connections_batch_query(), %{variables | "first" => 6})
        end)

      grown_nodes = offer_connection_nodes(grown_response)
      assert [_, _, _, _, _, _] = grown_nodes
      assert_offer_connection_values(grown_nodes, grown_products, coupons)

      fixed_budget = %{merchant_products: 1, coupons: 1, price_points: 2}

      assert {
               offer_connection_query_budget(initial_queries),
               offer_connection_query_budget(grown_queries)
             } == {fixed_budget, fixed_budget}
    end
  end

  defp batching_query do
    """
    query DataloaderBatching(
      $firstSlug: String!
      $secondSlug: String!
      $input: MerchantProductsInput!
    ) {
      firstProduct: product(slug: $firstSlug) {
        id
        brand {
          id
        }
      }

      secondProduct: product(slug: $secondSlug) {
        id
        brand {
          id
        }
      }

      merchantProducts(input: $input) {
        edges {
          node {
            id
            merchant {
              id
              name
            }
            product {
              id
              slug
            }
            latestPrice {
              id
              price
            }
          }
        }
      }
    }
    """
  end

  defp merchant_summary_batch_query do
    """
    query MerchantSummaryBatch($first: Int!) {
      merchants(first: $first) {
        edges {
          node {
            name
            detailSummary {
              activeOfferCount
              distinctProductCount
              eligibleOfferCount
              unobservedOfferCount
            }
          }
        }
      }
    }
    """
  end

  defp product_evidence_batch_query do
    """
    query ProductEvidenceBatch($first: Int!) {
      products(first: $first) {
        edges {
          node {
            slug
            offerTruth {
              asOf
              freshForSeconds
              staleAfterSeconds
              offerCount
              observedOfferCount
              eligibleOfferCount
              currencySummaries {
                currency
                offerCount
                observedOfferCount
                eligibleOfferCount
                bestOffer {
                  currency
                  itemPrice
                  shipping
                  landedPrice
                  landedPriceComplete
                  stockStatus
                  freshness
                  eligible
                }
              }
            }
            reviewSummary { count averageRating }
            seo { title description canonicalPath indexable imageUrl structuredData }
          }
        }
      }
    }
    """
  end

  defp merchant_offer_connections_batch_query do
    """
    query MerchantOfferConnectionsBatch($first: Int!) {
      merchants(first: $first) {
        edges {
          node {
            id
            name
            merchantProducts(first: 2) {
              edges {
                cursor
                node {
                  id
                  merchant { id name }
                  product { id name slug }
                  latestPrice { id price }
                }
              }
              pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
            }
          }
        }
      }
    }
    """
  end

  defp community_connections_batch_query do
    """
    query CommunityConnectionsBatch($first: Int!) {
      products(first: $first) {
        edges {
          node {
            slug
            reviews(first: 2) {
              edges { cursor node { id rating title moderationStatus } }
              pageInfo { hasNextPage endCursor }
            }
            questions(first: 1) {
              edges {
                cursor
                node {
                  id
                  title
                  moderationStatus
                  acceptedAnswerId
                  answers(first: 1) {
                    edges { cursor node { id body moderationStatus } }
                    pageInfo { hasNextPage endCursor }
                  }
                }
              }
              pageInfo { hasNextPage endCursor }
            }
          }
        }
      }
    }
    """
  end

  defp viewer_submissions_batch_query do
    """
    query ViewerSubmissionsBatch($first: Int!) {
      products(first: $first) {
        edges {
          node {
            slug
            viewerCommunitySubmissions {
              reviews { id rating moderationStatus viewerCanEdit viewerCanRemove }
              questions { id title moderationStatus viewerCanEdit viewerCanRemove }
              answers { id body moderationStatus viewerCanEdit viewerCanRemove }
            }
          }
        }
      }
    }
    """
  end

  defp offer_connections_batch_query do
    """
    query OfferConnectionsBatch(
      $first: Int!
      $historyFrom: DateTime!
      $historyTo: DateTime!
    ) {
      products(first: $first) {
        edges {
          node {
            slug
            merchantProducts(first: 2, activeOnly: true) {
              edges {
                cursor
                node {
                  id
                  merchant { id name }
                  activeCoupons(first: 1) {
                    edges { cursor node { code validTo } }
                    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
                  }
                  latestPrice { id observedAt price }
                  priceHistory(first: 2, from: $historyFrom, to: $historyTo) {
                    edges { cursor node { id observedAt price } }
                    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
                  }
                }
              }
              pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
            }
          }
        }
      }
    }
    """
  end

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end

  defp count_queries_by_table(queries) do
    Enum.into(@tracked_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp merchant_summary_query_budget(queries) do
    %{
      merchant_products: Enum.count(queries, &query_targets_table?(&1, :merchant_products)),
      price_points: Enum.count(queries, &query_targets_table?(&1, :price_points))
    }
  end

  defp merchant_offer_connection_nodes(response) do
    response
    |> get_in(["data", "merchants", "edges"])
    |> Enum.map(& &1["node"])
  end

  defp merchant_offer_connection_query_budget(queries) do
    Enum.into(@merchant_offer_connection_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp assert_merchant_offer_connection_values(nodes, merchants) do
    Enum.each(merchants, fn merchant_data ->
      node = Enum.find(nodes, &(&1["name"] == merchant_data.merchant.name))

      assert node["id"] == relay_id(:merchant, merchant_data.merchant.id)

      expected_edges =
        merchant_data.visible_offers
        |> Enum.with_index()
        |> Enum.map(fn {offer_data, index} ->
          %{
            "cursor" => cursor_for(index),
            "node" => %{
              "id" => relay_id(:merchant_product, offer_data.offer.id),
              "merchant" => %{
                "id" => relay_id(:merchant, merchant_data.merchant.id),
                "name" => merchant_data.merchant.name
              },
              "product" => %{
                "id" => relay_id(:product, offer_data.product.id),
                "name" => offer_data.product.name,
                "slug" => offer_data.product.slug
              },
              "latestPrice" => %{
                "id" => relay_id(:price_point, offer_data.latest_price.id),
                "price" => Decimal.to_string(offer_data.latest_price.price)
              }
            }
          }
        end)

      assert node["merchantProducts"] == %{
               "edges" => expected_edges,
               "pageInfo" => %{
                 "hasNextPage" => true,
                 "hasPreviousPage" => false,
                 "startCursor" => cursor_for(0),
                 "endCursor" => cursor_for(1)
               }
             }
    end)
  end

  defp product_evidence_query_budget(queries) do
    Enum.into(@product_evidence_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp summary_for(edges, merchant_name) do
    edges
    |> Enum.find(fn edge -> edge["node"]["name"] == merchant_name end)
    |> get_in(["node", "detailSummary"])
  end

  defp product_evidence_nodes(response) do
    response
    |> get_in(["data", "products", "edges"])
    |> Enum.map(& &1["node"])
  end

  defp community_connection_nodes(response) do
    response
    |> get_in(["data", "products", "edges"])
    |> Enum.map(& &1["node"])
  end

  defp viewer_submission_nodes(response) do
    response
    |> get_in(["data", "products", "edges"])
    |> Enum.map(& &1["node"])
  end

  defp assert_viewer_submission_values(nodes, products) do
    Enum.each(products, fn product_data ->
      node = node_for(nodes, product_data.product.slug)

      assert node["viewerCommunitySubmissions"] == %{
               "reviews" => [
                 %{
                   "id" => relay_id(:product_review, product_data.review.entropy_id),
                   "rating" => product_data.review.rating,
                   "moderationStatus" => "PENDING",
                   "viewerCanEdit" => true,
                   "viewerCanRemove" => true
                 }
               ],
               "questions" => [
                 %{
                   "id" => relay_id(:product_question, product_data.hidden_question.entropy_id),
                   "title" => product_data.hidden_question.title,
                   "moderationStatus" => "HIDDEN",
                   "viewerCanEdit" => true,
                   "viewerCanRemove" => true
                 }
               ],
               "answers" => [
                 %{
                   "id" => relay_id(:product_answer, product_data.pending_answer.entropy_id),
                   "body" => product_data.pending_answer.body_md,
                   "moderationStatus" => "PENDING",
                   "viewerCanEdit" => true,
                   "viewerCanRemove" => true
                 },
                 %{
                   "id" =>
                     relay_id(
                       :product_answer,
                       product_data.published_hidden_answer.entropy_id
                     ),
                   "body" => product_data.published_hidden_answer.body_md,
                   "moderationStatus" => "PUBLISHED",
                   "viewerCanEdit" => true,
                   "viewerCanRemove" => true
                 }
               ]
             }
    end)
  end

  defp assert_public_community_connection_values(nodes, products) do
    Enum.each(products, fn product ->
      node = node_for(nodes, product.product.slug)

      assert node["reviews"] == %{
               "edges" =>
                 Enum.map(product.visible_reviews, fn review ->
                   %{
                     "cursor" => cursor_for(review.cursor_index),
                     "node" => %{
                       "id" => relay_id(:product_review, review.entropy_id),
                       "rating" => review.rating,
                       "title" => review.title,
                       "moderationStatus" => "PUBLISHED"
                     }
                   }
                 end),
               "pageInfo" => %{"hasNextPage" => true, "endCursor" => cursor_for(1)}
             }

      assert node["questions"] == %{
               "edges" => [
                 %{
                   "cursor" => cursor_for(0),
                   "node" => %{
                     "id" => relay_id(:product_question, product.question.entropy_id),
                     "title" => product.question.title,
                     "moderationStatus" => "PUBLISHED",
                     "acceptedAnswerId" =>
                       relay_id(:product_answer, product.accepted_answer.entropy_id),
                     "answers" => %{
                       "edges" => [
                         %{
                           "cursor" => cursor_for(0),
                           "node" => %{
                             "id" => relay_id(:product_answer, product.first_answer.entropy_id),
                             "body" => product.first_answer.body_md,
                             "moderationStatus" => "PUBLISHED"
                           }
                         }
                       ],
                       "pageInfo" => %{"hasNextPage" => true, "endCursor" => cursor_for(0)}
                     }
                   }
                 }
               ],
               "pageInfo" => %{"hasNextPage" => true, "endCursor" => cursor_for(0)}
             }

      refute inspect(node) =~ "hidden review"
      refute inspect(node) =~ "hidden question"
      refute inspect(node) =~ "hidden answer"
    end)
  end

  defp community_connection_query_budget(queries) do
    Enum.into(@community_connection_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp viewer_submission_query_budget(queries) do
    Enum.into(@viewer_submission_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp offer_connection_nodes(response) do
    response
    |> get_in(["data", "products", "edges"])
    |> Enum.map(& &1["node"])
  end

  defp assert_offer_connection_values(nodes, products, coupons) do
    assert Enum.map(nodes, & &1["slug"]) == Enum.map(products, & &1.product.slug)

    Enum.each(products, fn product_data ->
      node = node_for(nodes, product_data.product.slug)

      expected_edges =
        product_data.visible_offers
        |> Enum.with_index()
        |> Enum.map(fn {offer_data, index} ->
          coupon = Map.fetch!(coupons, offer_data.merchant.id)

          %{
            "cursor" => cursor_for(index),
            "node" => %{
              "id" => relay_id(:merchant_product, offer_data.offer.id),
              "merchant" => %{
                "id" => relay_id(:merchant, offer_data.merchant.id),
                "name" => offer_data.merchant.name
              },
              "activeCoupons" => %{
                "edges" => [
                  %{
                    "cursor" => cursor_for(0),
                    "node" => %{
                      "code" => coupon.first.code,
                      "validTo" => DateTime.to_iso8601(coupon.first.valid_to)
                    }
                  }
                ],
                "pageInfo" => %{
                  "hasNextPage" => true,
                  "hasPreviousPage" => false,
                  "startCursor" => cursor_for(0),
                  "endCursor" => cursor_for(0)
                }
              },
              "latestPrice" => %{
                "id" => relay_id(:price_point, offer_data.latest.id),
                "observedAt" => DateTime.to_iso8601(offer_data.latest.observed_at),
                "price" => Decimal.to_string(offer_data.latest.price)
              },
              "priceHistory" => %{
                "edges" =>
                  [offer_data.history_newer, offer_data.history_older]
                  |> Enum.with_index()
                  |> Enum.map(fn {price_point, history_index} ->
                    %{
                      "cursor" => cursor_for(history_index),
                      "node" => %{
                        "id" => relay_id(:price_point, price_point.id),
                        "observedAt" => DateTime.to_iso8601(price_point.observed_at),
                        "price" => Decimal.to_string(price_point.price)
                      }
                    }
                  end),
                "pageInfo" => %{
                  "hasNextPage" => false,
                  "hasPreviousPage" => false,
                  "startCursor" => cursor_for(0),
                  "endCursor" => cursor_for(1)
                }
              }
            }
          }
        end)

      assert node["merchantProducts"] == %{
               "edges" => expected_edges,
               "pageInfo" => %{
                 "hasNextPage" => true,
                 "hasPreviousPage" => false,
                 "startCursor" => cursor_for(0),
                 "endCursor" => cursor_for(1)
               }
             }
    end)
  end

  defp offer_connection_query_budget(queries) do
    Enum.into(@offer_connection_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp offer_connection_coupons(merchants, anchor) do
    Map.new(Enum.with_index(merchants, 1), fn {merchant, index} ->
      {:ok, _expired} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "EXPIRED-#{index}",
          discount_type: :other,
          valid_to: DateTime.add(anchor, -60, :second)
        })

      {:ok, first} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "ACTIVE-#{index}-FIRST",
          discount_type: :percent,
          discount_value: Decimal.new("5"),
          valid_to: DateTime.add(anchor, 3_600, :second)
        })

      {:ok, second} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "ACTIVE-#{index}-SECOND",
          discount_type: :amount,
          discount_value: Decimal.new("10"),
          currency: "USD",
          valid_to: DateTime.add(anchor, 7_200, :second)
        })

      {:ok, _future} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "FUTURE-#{index}",
          discount_type: :other,
          valid_from: DateTime.add(anchor, 3_600, :second)
        })

      {merchant.id, %{first: first, second: second}}
    end)
  end

  defp merchant_offer_parents(prefix, indexes) do
    Enum.map(indexes, fn merchant_index ->
      merchant =
        merchant_fixture(%{
          name: unique_name("Merchant Offer Parent #{merchant_index}"),
          domain: unique_domain("#{prefix}-merchant-#{merchant_index}")
        })

      inactive_product =
        SpecsFixtures.product_fixture(%{
          slug: "#{prefix}-merchant-#{merchant_index}-inactive",
          name: "Merchant #{merchant_index} Inactive Product"
        })

      _inactive_offer =
        merchant_product_fixture(%{
          merchant: merchant,
          product: inactive_product,
          is_active: false
        })

      active_offers =
        Enum.map(1..3, fn offer_index ->
          product =
            SpecsFixtures.product_fixture(%{
              slug: "#{prefix}-merchant-#{merchant_index}-active-#{offer_index}",
              name: "Merchant #{merchant_index} Active Product #{offer_index}"
            })

          offer =
            merchant_product_fixture(%{
              merchant: merchant,
              product: product,
              is_active: true
            })

          {:ok, latest_price} =
            Pricing.add_price_point(%{
              merchant_product_id: offer.id,
              observed_at:
                DateTime.utc_now()
                |> DateTime.add(offer_index, :second)
                |> DateTime.truncate(:microsecond),
              price: Decimal.new(merchant_index * 100 + offer_index)
            })

          %{offer: offer, product: product, latest_price: latest_price}
        end)

      %{merchant: merchant, visible_offers: Enum.take(active_offers, 2)}
    end)
  end

  defp offer_connection_products(prefix, merchants, anchor, indexes) do
    Enum.map(indexes, fn product_index ->
      product =
        SpecsFixtures.product_fixture(%{
          slug: "#{prefix}-#{product_index}",
          name: "Compare Product #{product_index}"
        })

      _inactive_offer =
        merchant_product_fixture(%{
          merchant: hd(merchants),
          product: product,
          is_active: false
        })

      active_offers =
        merchants
        |> Enum.with_index(1)
        |> Enum.map(fn {merchant, merchant_index} ->
          offer =
            merchant_product_fixture(%{
              merchant: merchant,
              product: product,
              is_active: true
            })

          price_seed = product_index * 100 + merchant_index * 10

          {:ok, _outside_older} =
            Pricing.add_price_point(%{
              merchant_product_id: offer.id,
              observed_at: DateTime.add(anchor, -10_800, :second),
              price: Decimal.new(price_seed - 3)
            })

          {:ok, history_older} =
            Pricing.add_price_point(%{
              merchant_product_id: offer.id,
              observed_at: DateTime.add(anchor, -7_200, :second),
              price: Decimal.new(price_seed - 2)
            })

          {:ok, history_newer} =
            Pricing.add_price_point(%{
              merchant_product_id: offer.id,
              observed_at: DateTime.add(anchor, -3_600, :second),
              price: Decimal.new(price_seed - 1)
            })

          {:ok, latest} =
            Pricing.add_price_point(%{
              merchant_product_id: offer.id,
              observed_at: DateTime.add(anchor, 3_600, :second),
              price: Decimal.new(price_seed)
            })

          %{
            offer: offer,
            merchant: merchant,
            history_older: history_older,
            history_newer: history_newer,
            latest: latest
          }
        end)

      %{product: product, visible_offers: Enum.take(active_offers, 2)}
    end)
  end

  defp public_community_product(slug, operator) do
    product = SpecsFixtures.product_fixture(%{slug: slug, name: "#{slug} product"})

    published_reviews =
      for rating <- 3..5 do
        reviewer = AccountsFixtures.user_fixture()

        {:ok, review} =
          Discussions.submit_review(reviewer.id, product.id, %{
            rating: rating,
            title: "published review #{rating}"
          })

        {:ok, review} = Discussions.moderate(operator.id, :review, review.entropy_id, :published)
        review
      end

    hidden_reviewer = AccountsFixtures.user_fixture()

    {:ok, hidden_review} =
      Discussions.submit_review(hidden_reviewer.id, product.id, %{
        rating: 1,
        title: "hidden review"
      })

    {:ok, _hidden_review} =
      Discussions.moderate(operator.id, :review, hidden_review.entropy_id, :hidden)

    asker = AccountsFixtures.user_fixture()

    {:ok, older_question} =
      Discussions.ask_question(asker.id, product.id, %{
        title: "older published question",
        body: "Older published question body"
      })

    {:ok, _older_question} =
      Discussions.moderate(operator.id, :question, older_question.entropy_id, :published)

    {:ok, question} =
      Discussions.ask_question(asker.id, product.id, %{
        title: "newer published question",
        body: "Newer published question body"
      })

    {:ok, question} =
      Discussions.moderate(operator.id, :question, question.entropy_id, :published)

    answerer = AccountsFixtures.user_fixture()

    {:ok, first_answer} =
      Discussions.answer_question(answerer.id, question.entropy_id, "first published answer")

    {:ok, first_answer} =
      Discussions.moderate(operator.id, :answer, first_answer.entropy_id, :published)

    {:ok, accepted_answer} =
      Discussions.answer_question(answerer.id, question.entropy_id, "accepted published answer")

    {:ok, accepted_answer} =
      Discussions.moderate(operator.id, :answer, accepted_answer.entropy_id, :published)

    {:ok, hidden_answer} =
      Discussions.answer_question(answerer.id, question.entropy_id, "hidden answer")

    {:ok, _hidden_answer} =
      Discussions.moderate(operator.id, :answer, hidden_answer.entropy_id, :hidden)

    {:ok, question} =
      Discussions.accept_answer(asker.id, question.entropy_id, accepted_answer.entropy_id)

    {:ok, hidden_question} =
      Discussions.ask_question(asker.id, product.id, %{
        title: "hidden question",
        body: "Hidden question body"
      })

    {:ok, _hidden_question} =
      Discussions.moderate(operator.id, :question, hidden_question.entropy_id, :hidden)

    %{
      product: product,
      visible_reviews:
        published_reviews
        |> Enum.reverse()
        |> Enum.take(2)
        |> Enum.with_index()
        |> Enum.map(fn {review, cursor_index} -> Map.put(review, :cursor_index, cursor_index) end),
      question: question,
      first_answer: first_answer,
      accepted_answer: accepted_answer
    }
  end

  defp viewer_submission_products(prefix, owner, operator, indexes) do
    Enum.map(indexes, fn index ->
      slug = "#{prefix}-#{String.pad_leading(Integer.to_string(index), 2, "0")}"
      product = SpecsFixtures.product_fixture(%{slug: slug, name: slug})

      {:ok, review} =
        Discussions.submit_review(owner.id, product.id, %{
          rating: rem(index, 5) + 1,
          title: "Owner review #{index}"
        })

      {:ok, hidden_question} =
        Discussions.ask_question(owner.id, product.id, %{
          title: "Owner hidden question #{index}"
        })

      {:ok, hidden_question} =
        Discussions.moderate(
          operator.id,
          :question,
          hidden_question.entropy_id,
          :published
        )

      {:ok, published_hidden_answer} =
        Discussions.answer_question(
          owner.id,
          hidden_question.entropy_id,
          "Published answer under hidden question #{index}"
        )

      {:ok, published_hidden_answer} =
        Discussions.moderate(
          operator.id,
          :answer,
          published_hidden_answer.entropy_id,
          :published
        )

      {:ok, hidden_question} =
        Discussions.moderate(operator.id, :question, hidden_question.entropy_id, :hidden)

      other_asker = AccountsFixtures.user_fixture()

      {:ok, public_question} =
        Discussions.ask_question(other_asker.id, product.id, %{
          title: "Other user's public question #{index}"
        })

      {:ok, public_question} =
        Discussions.moderate(
          operator.id,
          :question,
          public_question.entropy_id,
          :published
        )

      {:ok, pending_answer} =
        Discussions.answer_question(
          owner.id,
          public_question.entropy_id,
          "Pending answer #{index}"
        )

      %{
        product: product,
        review: review,
        hidden_question: hidden_question,
        published_hidden_answer: published_hidden_answer,
        pending_answer: pending_answer
      }
    end)
  end

  defp cursor_for(index), do: Base.encode64("cursor:#{index}")

  defp assert_product_evidence_values(nodes, products) do
    Enum.each(Enum.chunk_every(products, 3), &assert_product_evidence_group(nodes, &1))
  end

  defp assert_product_evidence_group(nodes, [reviewed, unreviewed, missing]) do
    reviewed_node = node_for(nodes, reviewed.slug)
    reviewed_structured_data = get_in(reviewed_node, ["seo", "structuredData"])

    assert is_binary(reviewed_node["offerTruth"]["asOf"])

    assert Map.delete(reviewed_node["offerTruth"], "asOf") == %{
             "freshForSeconds" => 86_400,
             "staleAfterSeconds" => 259_200,
             "offerCount" => 1,
             "observedOfferCount" => 1,
             "eligibleOfferCount" => 1,
             "currencySummaries" => [
               %{
                 "currency" => "USD",
                 "offerCount" => 1,
                 "observedOfferCount" => 1,
                 "eligibleOfferCount" => 1,
                 "bestOffer" => %{
                   "currency" => "USD",
                   "itemPrice" => "100",
                   "shipping" => "5",
                   "landedPrice" => "105",
                   "landedPriceComplete" => true,
                   "stockStatus" => "IN_STOCK",
                   "freshness" => "FRESH",
                   "eligible" => true
                 }
               }
             ]
           }

    assert reviewed_node["reviewSummary"] == %{"count" => 1, "averageRating" => "4.00"}

    assert reviewed_node["seo"] == %{
             "title" => "#{reviewed.name} specifications and prices | Product Compare",
             "description" => @evidence_description,
             "canonicalPath" => "/products/#{reviewed.slug}",
             "indexable" => true,
             "imageUrl" => nil,
             "structuredData" => reviewed_structured_data
           }

    assert Jason.decode!(reviewed_structured_data) == %{
             "@context" => "https://schema.org",
             "@type" => "Product",
             "name" => reviewed.name,
             "description" => @evidence_description,
             "url" => "/products/#{reviewed.slug}",
             "brand" => %{"@type" => "Brand", "name" => "#{reviewed.slug} Brand"},
             "offers" => %{
               "@type" => "AggregateOffer",
               "availability" => "https://schema.org/InStock",
               "lowPrice" => "105",
               "offerCount" => 1,
               "priceCurrency" => "USD"
             },
             "aggregateRating" => %{
               "@type" => "AggregateRating",
               "ratingValue" => "4.00",
               "reviewCount" => 1
             }
           }

    assert node_for(nodes, unreviewed.slug)["reviewSummary"] == %{
             "count" => 0,
             "averageRating" => nil
           }

    assert node_for(nodes, unreviewed.slug)["seo"]["indexable"]

    assert is_binary(node_for(nodes, missing.slug)["offerTruth"]["asOf"])

    assert Map.delete(node_for(nodes, missing.slug)["offerTruth"], "asOf") == %{
             "freshForSeconds" => 86_400,
             "staleAfterSeconds" => 259_200,
             "offerCount" => 0,
             "observedOfferCount" => 0,
             "eligibleOfferCount" => 0,
             "currencySummaries" => []
           }

    assert node_for(nodes, missing.slug)["reviewSummary"] == %{
             "count" => 0,
             "averageRating" => nil
           }

    assert node_for(nodes, missing.slug)["seo"] == %{
             "title" => "#{missing.name} specifications and prices | Product Compare",
             "description" =>
               "Compare accepted specifications and current offer evidence for #{missing.name}.",
             "canonicalPath" => "/products/#{missing.slug}",
             "indexable" => false,
             "imageUrl" => nil,
             "structuredData" => nil
           }
  end

  defp assert_offer_as_of_is_shared(nodes) do
    assert nodes
           |> Enum.map(&get_in(&1, ["offerTruth", "asOf"]))
           |> Enum.uniq()
           |> length() == 1
  end

  defp node_for(nodes, slug), do: Enum.find(nodes, &(&1["slug"] == slug))

  defp product_evidence_set(prefix, operator) do
    [
      qualified_evidence_product("#{prefix}-reviewed", operator, true),
      qualified_evidence_product("#{prefix}-unreviewed", operator, false),
      product_without_evidence("#{prefix}-missing")
    ]
  end

  defp qualified_evidence_product(slug, operator, publish_review?) do
    canonical_slug = canonical_slug(slug)
    {:ok, brand} = Catalog.upsert_brand(%{name: "#{canonical_slug} Brand"})

    product =
      SpecsFixtures.product_fixture(%{
        slug: slug,
        brand_id: brand.id,
        description: @evidence_description
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
      Pricing.upsert_merchant(%{name: "#{slug} Merchant", domain: "#{slug}.example"})

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
        observed_at: DateTime.utc_now(),
        price: "100",
        shipping: "5",
        in_stock: true
      })

    if publish_review? do
      {:ok, review} =
        Discussions.submit_review(AccountsFixtures.user_fixture().id, product.id, %{
          rating: 4,
          title: "Published review",
          body: "This review is public."
        })

      {:ok, _published} =
        Discussions.moderate(operator.id, :review, review.entropy_id, :published)
    end

    product
  end

  defp product_without_evidence(slug) do
    canonical_slug = canonical_slug(slug)
    {:ok, brand} = Catalog.upsert_brand(%{name: "#{canonical_slug} Brand"})
    SpecsFixtures.product_fixture(%{slug: slug, brand_id: brand.id})
  end

  defp canonical_slug(value) do
    value
    |> String.downcase()
    |> String.replace(~r/[^a-z0-9]+/u, "-")
    |> String.trim("-")
  end

  defp relevant_query?(query) when is_binary(query) do
    Enum.any?(@tracked_tables, &query_targets_table?(query, &1))
  end

  defp query_targets_table?(query, table) when is_binary(query) and is_atom(table) do
    String.contains?(query, ~s(FROM "#{table}"))
  end

  defp merchant_fixture(attrs \\ %{}) do
    suffix = System.unique_integer([:positive])

    {:ok, merchant} =
      attrs
      |> Map.put_new(:name, "Merchant #{suffix}")
      |> Map.put_new(:domain, "merchant-#{suffix}.example.com")
      |> Pricing.upsert_merchant()

    merchant
  end

  defp merchant_product_fixture(attrs) do
    merchant = Map.get(attrs, :merchant) || merchant_fixture()
    product = Map.get(attrs, :product) || SpecsFixtures.product_fixture()
    suffix = System.unique_integer([:positive])

    params =
      attrs
      |> Map.drop([:merchant, :product])
      |> Map.put_new(:merchant_id, merchant.id)
      |> Map.put_new(:product_id, product.id)
      |> Map.put_new(:url, "https://merchant.example.com/products/#{suffix}")
      |> Map.put_new(:currency, "usd")
      |> Map.put_new(:external_sku, "sku-#{suffix}")
      |> Map.put_new(:is_active, true)

    {:ok, merchant_product} = Pricing.upsert_merchant_product(params)
    merchant_product
  end

  defp unique_name(prefix), do: "#{prefix} #{System.unique_integer([:positive])}"
  defp unique_domain(prefix), do: "#{prefix}-#{System.unique_integer([:positive])}.example.com"
end
