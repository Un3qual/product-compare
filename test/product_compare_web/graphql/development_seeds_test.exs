defmodule ProductCompareWeb.GraphQL.DevelopmentSeedsTest do
  use ProductCompareWeb.ConnCase, async: false

  @moduletag sandbox_isolation: "REPEATABLE READ"

  import ExUnit.CaptureIO

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Pricing.Merchant

  test "development seeds populate public, shopper, and operator GraphQL reads", %{conn: conn} do
    capture_io(fn ->
      Code.eval_file(Path.join(File.cwd!(), "priv/repo/seeds.exs"))
    end)

    product = Repo.get_by!(Product, slug: "acme-vision-27g")
    merchant = Repo.get_by!(Merchant, domain: "examplemart.test")

    assert %{
             "data" => %{
               "products" => %{"edges" => product_edges},
               "merchants" => %{"edges" => merchant_edges},
               "merchantProducts" => %{
                 "edges" => offer_edges,
                 "pageInfo" => %{"endCursor" => offer_end_cursor, "hasNextPage" => true}
               },
               "product" => %{
                 "reviews" => %{"edges" => review_edges}
               },
               "questionsProduct" => %{"questions" => %{"edges" => question_edges}}
             }
           } =
             graphql(conn, public_query(), %{
               "productId" => relay_id(:product, product.id),
               "slug" => product.slug,
               "questionSlug" => "acme-beam-4k"
             })

    assert [_, _, _, _, _ | _] = product_edges
    assert [_, _ | _] = merchant_edges
    assert Enum.count(offer_edges) == 10
    assert [_ | _] = review_edges
    assert [_ | _] = question_edges

    assert %{
             "data" => %{
               "products" => %{
                 "edges" => first_catalog_page,
                 "pageInfo" => %{"endCursor" => first_end_cursor, "hasNextPage" => true}
               }
             }
           } = graphql(conn, catalog_page_query(), %{"first" => 100})

    assert Enum.count(first_catalog_page) == 100

    assert %{
             "data" => %{
               "products" => %{
                 "edges" => second_catalog_page,
                 "pageInfo" => %{"hasPreviousPage" => true}
               }
             }
           } =
             graphql(conn, catalog_page_query(), %{
               "first" => 100,
               "after" => first_end_cursor
             })

    assert Enum.count(second_catalog_page) == 100

    assert %{
             "data" => %{
               "merchantProducts" => %{
                 "edges" => [_ | _],
                 "pageInfo" => %{"hasPreviousPage" => true}
               }
             }
           } =
             graphql(conn, offer_page_query(), %{
               "productId" => relay_id(:product, product.id),
               "after" => offer_end_cursor
             })

    shopper = Repo.get_by!(User, email: "shopper@example.com")
    shopper_conn = conn |> log_in_user(shopper) |> put_req_header_same_origin()

    assert %{
             "data" => %{
               "viewer" => %{"email" => "shopper@example.com"},
               "mySavedComparisonSets" => %{
                 "edges" => saved_set_edges,
                 "pageInfo" => %{"endCursor" => saved_end_cursor, "hasNextPage" => true}
               },
               "myPriceWatches" => %{
                 "edges" => watch_edges,
                 "pageInfo" => %{"endCursor" => watch_end_cursor, "hasNextPage" => true}
               },
               "myAlertEvents" => %{
                 "edges" => event_edges,
                 "pageInfo" => %{"hasNextPage" => true}
               },
               "myApiTokens" => %{"edges" => token_edges},
               "mySpecificationCorrections" => %{"edges" => correction_edges},
               "reviewedProduct" => %{
                 "reviews" => %{
                   "edges" => [%{"node" => %{"viewerCanEdit" => true}} | _]
                 }
               },
               "questionedProduct" => %{
                 "questions" => %{
                   "edges" => [%{"node" => %{"viewerCanEdit" => true}} | _]
                 },
                 "viewerCommunitySubmissions" => community_submissions
               }
             }
           } =
             graphql(shopper_conn, shopper_query(), %{
               "reviewSlug" => product.slug,
               "questionSlug" => "acme-beam-4k"
             })

    assert Enum.count(saved_set_edges) == 20
    assert Enum.count(watch_edges) == 20
    assert Enum.count(event_edges) == 20

    assert %{
             "data" => %{
               "mySavedComparisonSets" => %{
                 "edges" => [_ | _],
                 "pageInfo" => %{"hasPreviousPage" => true}
               },
               "myPriceWatches" => %{
                 "edges" => [_ | _],
                 "pageInfo" => %{"hasPreviousPage" => true}
               }
             }
           } =
             graphql(shopper_conn, shopper_page_query(), %{
               "savedAfter" => saved_end_cursor,
               "watchAfter" => watch_end_cursor
             })

    assert Enum.sort(Enum.map(token_edges, &get_in(&1, ["node", "label"]))) == [
             "Development active",
             "Development revoked"
           ]

    assert MapSet.new(correction_edges, &get_in(&1, ["node", "status"])) ==
             MapSet.new(["ACCEPTED", "PENDING", "REJECTED"])

    assert community_submissions["answers"] != []

    admin = Repo.get_by!(User, email: "admin@example.com")
    operator_conn = conn |> recycle() |> log_in_user(admin) |> put_req_header_same_origin()

    assert %{
             "data" => %{
               "specificationCorrectionModerationQueue" => %{
                 "edges" => [%{"node" => %{"status" => "PENDING"}} | _]
               },
               "cjProgramStageCounts" => stage_counts,
               "cjPrograms" => %{
                 "edges" => cj_program_edges,
                 "pageInfo" => %{
                   "endCursor" => cj_program_end_cursor,
                   "hasNextPage" => true
                 }
               },
               "unmatchedCjFeeds" => %{
                 "edges" => unmatched_feed_edges,
                 "pageInfo" => %{
                   "endCursor" => unmatched_feed_end_cursor,
                   "hasNextPage" => true
                 }
               },
               "commerceAttributionClicks" => %{
                 "edges" => attribution_edges,
                 "pageInfo" => %{
                   "endCursor" => attribution_end_cursor,
                   "hasNextPage" => true
                 }
               },
               "activeCoupons" => %{"edges" => coupon_edges},
               "revenueSummary" => %{
                 "metrics" => %{
                   "clicks" => 120,
                   "commissionRevenue" => "145.00",
                   "conversions" => 2,
                   "currency" => "USD"
                 }
               }
             }
           } =
             graphql(operator_conn, operator_query(), %{
               "merchantId" => relay_id(:merchant, merchant.id)
             })

    assert stage_counts
           |> Map.values()
           |> Enum.all?(&(&1 > 0))

    assert Enum.count(cj_program_edges) == 20
    assert Enum.count(unmatched_feed_edges) == 10
    assert Enum.count(attribution_edges) == 20

    assert %{
             "data" => %{
               "cjPrograms" => %{
                 "edges" => [_ | _],
                 "pageInfo" => %{"hasPreviousPage" => true}
               },
               "unmatchedCjFeeds" => %{
                 "edges" => [_ | _],
                 "pageInfo" => %{"hasPreviousPage" => true}
               },
               "commerceAttributionClicks" => %{
                 "edges" => [_ | _],
                 "pageInfo" => %{"hasPreviousPage" => true}
               }
             }
           } =
             graphql(operator_conn, operator_page_query(), %{
               "programAfter" => cj_program_end_cursor,
               "feedAfter" => unmatched_feed_end_cursor,
               "clickAfter" => attribution_end_cursor
             })

    assert Enum.any?(coupon_edges, &(get_in(&1, ["node", "code"]) == "DEV-ACTIVE-10"))
  end

  defp public_query do
    """
    query DevelopmentPublic($productId: ID!, $slug: String!, $questionSlug: String!) {
      products(first: 20) { edges { node { id slug name } } }
      merchants(first: 20) { edges { node { id slug name } } }
      merchantProducts(first: 10, input: {productId: $productId, activeOnly: true}) {
        edges { cursor node { id externalSku latestPrice { price inStock } } }
        pageInfo { endCursor hasNextPage }
      }
      product(slug: $slug) {
        reviews(first: 20) { edges { node { id title rating } } }
      }
      questionsProduct: product(slug: $questionSlug) {
        questions(first: 20) { edges { node { id title } } }
      }
    }
    """
  end

  defp offer_page_query do
    """
    query DevelopmentOfferPage($productId: ID!, $after: String) {
      merchantProducts(
        first: 10,
        after: $after,
        input: {productId: $productId, activeOnly: true}
      ) {
        edges { cursor node { id externalSku } }
        pageInfo { hasPreviousPage }
      }
    }
    """
  end

  defp shopper_query do
    """
    query DevelopmentShopper($reviewSlug: String!, $questionSlug: String!) {
      viewer { email }
      mySavedComparisonSets(first: 20) {
        edges { cursor node { name items { position } } }
        pageInfo { endCursor hasNextPage }
      }
      myPriceWatches(first: 20) {
        edges { cursor node { ruleType enabled } }
        pageInfo { endCursor hasNextPage }
      }
      myAlertEvents(first: 20) {
        edges { cursor node { ruleType readAt } }
        pageInfo { hasNextPage }
      }
      myApiTokens(first: 20, status: ALL) { edges { node { label revokedAt } } }
      mySpecificationCorrections(first: 20) { edges { node { status reason } } }
      reviewedProduct: product(slug: $reviewSlug) {
        reviews(first: 20) { edges { node { id moderationStatus viewerCanEdit } } }
      }
      questionedProduct: product(slug: $questionSlug) {
        questions(first: 20) { edges { node { id moderationStatus viewerCanEdit } } }
        viewerCommunitySubmissions {
          reviews { id moderationStatus viewerCanEdit }
          questions { id moderationStatus viewerCanEdit }
          answers { id moderationStatus viewerCanEdit }
        }
      }
    }
    """
  end

  defp shopper_page_query do
    """
    query DevelopmentShopperPage($savedAfter: String, $watchAfter: String) {
      mySavedComparisonSets(first: 20, after: $savedAfter) {
        edges { cursor node { name } }
        pageInfo { hasPreviousPage }
      }
      myPriceWatches(first: 20, after: $watchAfter) {
        edges { cursor node { ruleType } }
        pageInfo { hasPreviousPage }
      }
    }
    """
  end

  defp catalog_page_query do
    """
    query DevelopmentCatalogPage($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        edges { cursor node { id slug } }
        pageInfo { endCursor hasNextPage hasPreviousPage }
      }
    }
    """
  end

  defp operator_query do
    """
    query DevelopmentOperator($merchantId: ID!) {
      specificationCorrectionModerationQueue(first: 20, status: PENDING) {
        edges { node { status reason valueText } }
      }
      cjProgramStageCounts {
        new considering selected applied accepted notPursuing declined
      }
      cjPrograms(first: 20, sort: NAME_ASC) {
        edges { node { advertiserId advertiserName stage feedCount warningCodes } }
        pageInfo { endCursor hasNextPage }
      }
      unmatchedCjFeeds(first: 10) {
        edges { node { providerFeedId advertiserName } }
        pageInfo { endCursor hasNextPage }
      }
      commerceAttributionClicks(first: 20) {
        edges { node { clickId anonymousVisitor sourceSurface matchedConversions { status } } }
        pageInfo { endCursor hasNextPage }
      }
      activeCoupons(first: 20, merchantId: $merchantId) {
        edges { node { code description } }
      }
      revenueSummary(input: {currency: "USD"}) {
        metrics { clicks commissionRevenue conversions currency }
      }
    }
    """
  end

  defp operator_page_query do
    """
    query DevelopmentOperatorPage(
      $programAfter: String,
      $feedAfter: String,
      $clickAfter: String
    ) {
      cjPrograms(first: 20, after: $programAfter, sort: NAME_ASC) {
        edges { node { advertiserId } }
        pageInfo { hasPreviousPage }
      }
      unmatchedCjFeeds(first: 10, after: $feedAfter) {
        edges { node { providerFeedId } }
        pageInfo { hasPreviousPage }
      }
      commerceAttributionClicks(first: 20, after: $clickAfter) {
        edges { node { clickId } }
        pageInfo { hasPreviousPage }
      }
    }
    """
  end

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end
end
