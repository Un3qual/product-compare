defmodule ProductCompareWeb.GraphQL.SeoSurfacesTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures, TaxonomyFixtures}
  alias ProductCompare.Pricing
  alias ProductCompare.Specs

  test "product and curated category reads expose the shared search qualification contract", %{
    conn: conn
  } do
    operator = AccountsFixtures.operator_fixture()
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    category =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: type_taxonomy.id,
        code: "graphql-cameras",
        name: "GraphQL Cameras",
        seo_slug: "graphql-cameras",
        seo_description:
          String.duplicate(
            "Compare trusted camera specifications and current complete offers. ",
            2
          ),
        seo_indexable: true
      })

    product = qualified_product(operator, category)

    assert %{
             "data" => %{
               "product" => %{
                 "seo" => %{
                   "canonicalPath" => "/products/graphql-seo-camera",
                   "indexable" => true,
                   "structuredData" => structured_data
                 }
               },
               "category" => %{
                 "indexable" => false,
                 "qualifiedProductCount" => 1,
                 "seo" => %{
                   "canonicalPath" => "/categories/graphql-cameras",
                   "indexable" => false
                 },
                 "products" => %{
                   "edges" => [%{"node" => %{"slug" => "graphql-seo-camera"}}]
                 }
               }
             }
           } =
             graphql(conn, query(), %{
               "productSlug" => product.slug,
               "categorySlug" => category.seo_slug
             })

    assert Jason.decode!(structured_data)["@type"] == "Product"
  end

  defp qualified_product(operator, category) do
    product =
      SpecsFixtures.product_fixture(%{
        slug: "graphql-seo-camera",
        description: String.duplicate("A detailed source-backed camera description. ", 3),
        primary_type_taxon: category
      })

    Enum.each(1..2, fn index ->
      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "graphql-seo-attribute-#{index}",
          data_type: :text,
          display_name: "SEO attribute #{index}"
        })

      {:ok, claim} =
        Specs.propose_claim(product.id, attribute.id, %{value_text: "Known value #{index}"}, %{
          source_type: :user,
          created_by: operator.id
        })

      {:ok, claim} = Specs.accept_claim(claim.id, operator.id)

      {:ok, _current} =
        Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)
    end)

    {:ok, merchant} =
      Pricing.upsert_merchant(%{name: "GraphQL SEO Shop", domain: "graphql-seo.example"})

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://graphql-seo.example/camera",
        currency: "USD",
        is_active: true
      })

    {:ok, _point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.utc_now(),
        price: "199",
        shipping: "0",
        in_stock: true
      })

    product
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/graphql", %{query: query, variables: variables}) |> json_response(200)
  end

  defp query do
    """
    query SeoSurfaces($productSlug: String!, $categorySlug: String!) {
      product(slug: $productSlug) {
        id
        seo { title description canonicalPath indexable imageUrl structuredData }
      }
      category(slug: $categorySlug) {
        id name slug description qualifiedProductCount indexable
        seo { title description canonicalPath indexable structuredData }
        products(first: 12) { edges { node { id name slug } } pageInfo { hasNextPage endCursor } }
      }
    }
    """
  end
end
