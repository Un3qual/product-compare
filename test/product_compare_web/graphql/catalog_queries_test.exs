defmodule ProductCompareWeb.GraphQL.CatalogQueriesTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompare.Fixtures.SpecsFixtures

  describe "/api/graphql catalog queries" do
    test "products returns a paginated connection with stable ordering", %{conn: conn} do
      first_product =
        SpecsFixtures.product_fixture(%{slug: "catalog-first", name: "Catalog First"})

      second_product =
        SpecsFixtures.product_fixture(%{slug: "catalog-second", name: "Catalog Second"})

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [
                     %{
                       "cursor" => first_cursor,
                       "node" => %{
                         "id" => first_id,
                         "slug" => "catalog-first",
                         "name" => "Catalog First",
                         "brand" => %{"id" => first_brand_id, "name" => _brand_name}
                       }
                     }
                   ],
                   "pageInfo" => %{
                     "hasNextPage" => true,
                     "hasPreviousPage" => false,
                     "startCursor" => first_start_cursor,
                     "endCursor" => first_end_cursor
                   }
                 }
               }
             } = graphql(conn, products_query(), %{"first" => 1})

      assert first_cursor == first_start_cursor
      assert first_cursor == first_end_cursor
      assert first_id == relay_id("Product", first_product.id)
      assert first_brand_id == relay_id("Brand", first_product.brand_id)

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => second_id,
                         "slug" => "catalog-second",
                         "name" => "Catalog Second",
                         "brand" => %{"id" => second_brand_id, "name" => _second_brand_name}
                       }
                     }
                   ],
                   "pageInfo" => %{
                     "hasNextPage" => false,
                     "hasPreviousPage" => true
                   }
                 }
               }
             } = graphql(conn, products_query(), %{"first" => 10, "after" => first_cursor})

      assert second_id == relay_id("Product", second_product.id)
      assert second_brand_id == relay_id("Brand", second_product.brand_id)
    end

    test "products rejects invalid cursor input", %{conn: conn} do
      SpecsFixtures.product_fixture(%{slug: "catalog-invalid-cursor"})

      assert %{
               "data" => %{"products" => nil},
               "errors" => [%{"message" => "invalid cursor", "path" => ["products"]} | _]
             } = graphql(conn, products_query(), %{"after" => "not-a-valid-cursor"})
    end
  end

  defp products_query do
    """
    query Products($first: Int, $after: String) {
      products(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            name
            slug
            brand {
              id
              name
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
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

  defp relay_id(type, local_id), do: Base.encode64("#{type}:#{local_id}")
end
