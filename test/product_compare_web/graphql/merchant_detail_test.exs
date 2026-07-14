defmodule ProductCompareWeb.GraphQL.MerchantDetailTest do
  use ProductCompareWeb.ConnCase, async: true

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
           } = graphql(conn, query(), %{"slug" => merchant.slug})

    assert slug == merchant.slug
    assert point_id == relay_id(:price_point, point.id)
  end

  test "unknown merchant slug returns null", %{conn: conn} do
    assert get_in(graphql(conn, query(), %{"slug" => "missing"}), ["data", "merchant"]) == nil
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/graphql", %{query: query, variables: variables}) |> json_response(200)
  end

  defp query do
    """
    query MerchantDetail($slug: String!) {
      merchant(slug: $slug) {
        id name slug domain
        detailSummary { activeOfferCount distinctProductCount eligibleOfferCount lastObservedAt }
        merchantProducts(first: 10) {
          edges { node { id currency product { id name slug } latestPrice { id price observedAt } } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
    """
  end
end
