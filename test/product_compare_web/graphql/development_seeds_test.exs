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
      Code.eval_file(Path.expand("../../../priv/repo/seeds.exs", __DIR__))
    end)

    product = Repo.get_by!(Product, slug: "acme-vision-27g")
    merchant = Repo.get_by!(Merchant, domain: "examplemart.test")

    assert %{
             "data" => %{
               "products" => %{"edges" => product_edges},
               "merchants" => %{"edges" => merchant_edges},
               "merchantProducts" => %{"edges" => offer_edges},
               "product" => %{
                 "reviews" => %{"edges" => review_edges}
               },
               "questionsProduct" => %{"questions" => %{"edges" => question_edges}}
             }
           } =
             graphql(conn, public_query(), %{
               "productId" => relay_id(:product, product.id),
               "merchantId" => relay_id(:merchant, merchant.id),
               "slug" => product.slug,
               "questionSlug" => "acme-beam-4k"
             })

    assert length(product_edges) >= 5
    assert length(merchant_edges) >= 2
    assert length(offer_edges) >= 1
    assert length(review_edges) >= 1
    assert length(question_edges) >= 1

    shopper = Repo.get_by!(User, email: "shopper@example.com")
    shopper_conn = conn |> log_in_user(shopper) |> put_req_header_same_origin()

    assert %{
             "data" => %{
               "viewer" => %{"email" => "shopper@example.com"},
               "mySavedComparisonSets" => %{"edges" => saved_set_edges},
               "myPriceWatches" => %{"edges" => watch_edges},
               "myAlertEvents" => %{"edges" => event_edges},
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

    assert Enum.sort(Enum.map(saved_set_edges, &get_in(&1, ["node", "name"]))) == [
             "Gaming shortlist",
             "Home theater shortlist"
           ]

    assert length(watch_edges) == 4
    assert length(event_edges) >= 3

    assert Enum.sort(Enum.map(token_edges, &get_in(&1, ["node", "label"]))) == [
             "Development active",
             "Development revoked"
           ]

    assert Enum.sort(Enum.map(correction_edges, &get_in(&1, ["node", "status"]))) == [
             "ACCEPTED",
             "PENDING",
             "REJECTED"
           ]

    assert community_submissions["answers"] != []

    admin = Repo.get_by!(User, email: "admin@example.com")
    operator_conn = conn |> recycle() |> log_in_user(admin) |> put_req_header_same_origin()

    assert %{
             "data" => %{
               "specificationCorrectionModerationQueue" => %{
                 "edges" => [%{"node" => %{"status" => "PENDING"}} | _]
               },
               "cjProgramStageCounts" => stage_counts,
               "cjPrograms" => %{"edges" => cj_program_edges},
               "unmatchedCjFeeds" => %{"edges" => unmatched_feed_edges},
               "activeCoupons" => %{"edges" => coupon_edges},
               "revenueSummary" => %{
                 "metrics" => %{
                   "clicks" => 4,
                   "commissionRevenue" => "145.00",
                   "conversions" => 2,
                   "currency" => "USD"
                 },
                 "suppression" => %{"suppressed" => false}
               }
             }
           } =
             graphql(operator_conn, operator_query(), %{
               "merchantId" => relay_id(:merchant, merchant.id)
             })

    assert stage_counts == %{
             "accepted" => 1,
             "applied" => 1,
             "considering" => 1,
             "declined" => 1,
             "new" => 1,
             "notPursuing" => 1,
             "selected" => 1
           }

    assert length(cj_program_edges) == 7
    assert length(unmatched_feed_edges) == 1
    assert Enum.any?(coupon_edges, &(get_in(&1, ["node", "code"]) == "DEV-ACTIVE-10"))
  end

  defp public_query do
    """
    query DevelopmentPublic($productId: ID!, $slug: String!, $questionSlug: String!) {
      products(first: 20) { edges { node { id slug name } } }
      merchants(first: 20) { edges { node { id slug name } } }
      merchantProducts(first: 20, input: {productId: $productId, activeOnly: true}) {
        edges { node { id externalSku latestPrice { price inStock } } }
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

  defp shopper_query do
    """
    query DevelopmentShopper($reviewSlug: String!, $questionSlug: String!) {
      viewer { email }
      mySavedComparisonSets(first: 20) { edges { node { name items { position } } } }
      myPriceWatches(first: 20) { edges { node { ruleType enabled } } }
      myAlertEvents(first: 20) { edges { node { ruleType readAt } } }
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
      }
      unmatchedCjFeeds(first: 20) {
        edges { node { providerFeedId advertiserName } }
      }
      activeCoupons(first: 20, merchantId: $merchantId) {
        edges { node { code description } }
      }
      revenueSummary(input: {currency: "USD"}) {
        metrics { clicks commissionRevenue conversions currency }
        suppression { suppressed threshold }
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
