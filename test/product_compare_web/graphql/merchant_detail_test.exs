defmodule ProductCompareWeb.GraphQL.MerchantDetailTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing

  test "merchant detail exposes complete summary and bounded active product offers", %{conn: conn} do
    {:ok, merchant} = Pricing.upsert_merchant(%{name: "Graph shop", domain: "graph-shop.example"})
    product = SpecsFixtures.product_fixture(%{name: "Graph camera"})

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://graph-shop.example/camera",
        currency: "USD",
        is_active: true
      })

    {:ok, point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.utc_now(),
        price: "99",
        shipping: "4",
        in_stock: true
      })

    {response, queries} =
      capture_select_queries(fn -> graphql(conn, query(), %{"slug" => merchant.slug}) end)

    assert %{
             "data" => %{
               "merchant" => %{
                 "name" => "Graph shop",
                 "slug" => slug,
                 "detailSummary" => %{
                   "activeOfferCount" => 1,
                   "distinctProductCount" => 1,
                   "eligibleOfferCount" => 1
                 },
                 "merchantProducts" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "product" => %{"name" => "Graph camera"},
                         "latestPrice" => %{"id" => point_id}
                       }
                     }
                   ]
                 }
               }
             }
           } = response

    assert slug == merchant.slug
    assert point_id == relay_id(:price_point, point.id)
    assert count_queries_targeting(queries, "merchant_products") == 2
    assert count_queries_targeting(queries, "price_points") == 2
  end

  test "unknown merchant slug returns null", %{conn: conn} do
    assert get_in(graphql(conn, query(), %{"slug" => "missing"}), ["data", "merchant"]) == nil
  end

  test "merchant detail offers preserve Relay input errors", %{conn: conn} do
    {:ok, merchant} =
      Pricing.upsert_merchant(%{name: "Invalid Relay shop", domain: "invalid-relay.example"})

    assert %{
             "data" => %{"merchant" => nil},
             "errors" => [
               %{
                 "message" => "invalid first",
                 "path" => ["merchant", "merchantProducts"]
               }
               | _
             ]
           } =
             graphql(conn, pagination_query(), %{
               "slug" => merchant.slug,
               "first" => -1
             })
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/graphql", %{query: query, variables: variables}) |> json_response(200)
  end

  defp query do
    """
    query MerchantDetail($slug: String!) {
      merchant(slug: $slug) {
        id name slug domain
        seo { indexable }
        detailSummary { activeOfferCount distinctProductCount eligibleOfferCount lastObservedAt }
        merchantProducts(first: 10) {
          edges { node { id currency product { id name slug } latestPrice { id price observedAt } } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
    """
  end

  defp pagination_query do
    """
    query MerchantDetailPagination($slug: String!, $first: Int!) {
      merchant(slug: $slug) {
        merchantProducts(first: $first) {
          edges { node { id } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
    """
  end

  defp count_queries_targeting(queries, table) do
    Enum.count(queries, &String.contains?(&1, ~s(FROM "#{table}")))
  end
end
