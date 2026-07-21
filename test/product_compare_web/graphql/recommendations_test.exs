defmodule ProductCompareWeb.GraphQL.RecommendationsTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing

  test "comparisonRecommendation returns exact observation references and safe no-winner reasons",
       %{conn: conn} do
    {first, _} = product_with_price("First", "100")
    {second, second_point} = product_with_price("Second", "80")

    response =
      graphql(conn, query(), %{
        "slugs" => [first.slug, second.slug],
        "profile" => "LOWEST_CURRENT_COST"
      })

    assert %{
             "data" => %{
               "comparisonRecommendation" => %{
                 "status" => "WINNER",
                 "winnerProductId" => winner_id,
                 "algorithmVersion" => "lowest-current-cost-v1",
                 "rankings" => [
                   %{
                     "productId" => ranked_product_id,
                     "pricePointId" => price_point_id,
                     "reasons" => ["Lowest eligible landed price: 80 USD."]
                   },
                   _
                 ],
                 "missingInputs" => []
               }
             }
           } = response

    assert winner_id == relay_id(:product, second.id)
    assert ranked_product_id == winner_id
    assert price_point_id == relay_id(:price_point, second_point.id)
  end

  test "comparisonRecommendation preserves validation errors for invalid product selections", %{
    conn: conn
  } do
    existing = SpecsFixtures.product_fixture(%{name: "Existing recommendation product"})

    Enum.each(
      [
        [existing.slug],
        [existing.slug, "missing-recommendation-product"]
      ],
      fn slugs ->
        assert %{
                 "data" => nil,
                 "errors" => [
                   %{
                     "message" => "recommendations require two or three existing products",
                     "path" => ["comparisonRecommendation"]
                   }
                 ]
               } =
                 graphql(conn, query(), %{
                   "slugs" => slugs,
                   "profile" => "LOWEST_CURRENT_COST"
                 })
      end
    )
  end

  defp product_with_price(name, price) do
    product = SpecsFixtures.product_fixture(%{name: name})

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "#{name} shop #{System.unique_integer([:positive])}",
        domain: "rec-#{System.unique_integer([:positive])}.example"
      })

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://shop.example/#{System.unique_integer([:positive])}",
        currency: "USD",
        is_active: true
      })

    {:ok, point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.utc_now(),
        price: price,
        shipping: "0",
        in_stock: true
      })

    {product, point}
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/graphql", %{query: query, variables: variables}) |> json_response(200)
  end

  defp query do
    """
    query Recommendation($slugs: [String!]!, $profile: RecommendationProfile!) {
      comparisonRecommendation(slugs: $slugs, profile: $profile) {
        profile algorithmVersion status winnerProductId currency missingInputs
        rankings { rank productId pricePointId merchantProductId landedPrice currency claimIds reasons }
      }
    }
    """
  end
end
