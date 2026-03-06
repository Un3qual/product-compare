defmodule ProductCompareWeb.GraphQL.PricingQueriesTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing

  describe "/api/graphql pricing discovery queries" do
    test "merchants returns a paginated connection with stable ordering", %{conn: conn} do
      merchant_a =
        merchant_fixture(%{name: unique_name("Merchant A"), domain: unique_domain("a")})

      merchant_b =
        merchant_fixture(%{name: unique_name("Merchant B"), domain: unique_domain("b")})

      assert %{
               "data" => %{
                 "merchants" => %{
                   "edges" => [
                     %{
                       "cursor" => first_cursor,
                       "node" => %{
                         "id" => first_id,
                         "name" => _first_name,
                         "domain" => _first_domain
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
             } = graphql(conn, merchants_query(), %{"first" => 1})

      assert first_cursor == first_start_cursor
      assert first_cursor == first_end_cursor
      assert first_id == relay_id("Merchant", merchant_a.id)

      assert %{
               "data" => %{
                 "merchants" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => second_id
                       }
                     }
                   ],
                   "pageInfo" => %{
                     "hasNextPage" => false,
                     "hasPreviousPage" => true
                   }
                 }
               }
             } = graphql(conn, merchants_query(), %{"first" => 10, "after" => first_cursor})

      assert second_id == relay_id("Merchant", merchant_b.id)
    end

    test "merchantProducts supports product/merchant/active filters and strict cursor handling",
         %{
           conn: conn,
           test: test_name
         } do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-product"})
      other_product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-other"})

      merchant_a =
        merchant_fixture(%{name: unique_name("Merchant A"), domain: unique_domain("ma")})

      merchant_b =
        merchant_fixture(%{name: unique_name("Merchant B"), domain: unique_domain("mb")})

      merchant_product_a =
        merchant_product_fixture(%{
          merchant: merchant_a,
          product: product,
          is_active: true
        })

      merchant_product_b =
        merchant_product_fixture(%{
          merchant: merchant_b,
          product: product,
          is_active: false
        })

      _other_merchant_product =
        merchant_product_fixture(%{
          merchant: merchant_a,
          product: other_product,
          is_active: true
        })

      assert %{
               "data" => %{
                 "merchantProducts" => %{
                   "edges" => [
                     %{
                       "cursor" => first_cursor,
                       "node" => %{
                         "id" => first_id,
                         "merchantId" => first_merchant_id,
                         "productId" => first_product_id,
                         "isActive" => true
                       }
                     }
                   ],
                   "pageInfo" => %{
                     "hasNextPage" => true,
                     "hasPreviousPage" => false
                   }
                 }
               }
             } =
               graphql(conn, merchant_products_query(), %{
                 "input" => %{
                   "productId" => relay_id("Product", product.id),
                   "first" => 1
                 }
               })

      assert first_id == relay_id("MerchantProduct", merchant_product_a.id)
      assert first_merchant_id == relay_id("Merchant", merchant_a.id)
      assert first_product_id == relay_id("Product", product.id)

      assert %{
               "data" => %{
                 "merchantProducts" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => second_id
                       }
                     }
                   ],
                   "pageInfo" => %{
                     "hasNextPage" => false,
                     "hasPreviousPage" => true
                   }
                 }
               }
             } =
               graphql(conn, merchant_products_query(), %{
                 "input" => %{
                   "productId" => relay_id("Product", product.id),
                   "first" => 10,
                   "after" => first_cursor
                 }
               })

      assert second_id == relay_id("MerchantProduct", merchant_product_b.id)

      assert %{
               "data" => %{
                 "merchantProducts" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => only_merchant_id
                       }
                     }
                   ]
                 }
               }
             } =
               graphql(conn, merchant_products_query(), %{
                 "input" => %{
                   "productId" => relay_id("Product", product.id),
                   "merchantId" => relay_id("Merchant", merchant_b.id)
                 }
               })

      assert only_merchant_id == relay_id("MerchantProduct", merchant_product_b.id)

      assert %{
               "data" => %{
                 "merchantProducts" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => only_active_id
                       }
                     }
                   ]
                 }
               }
             } =
               graphql(conn, merchant_products_query(), %{
                 "input" => %{
                   "productId" => relay_id("Product", product.id),
                   "activeOnly" => true
                 }
               })

      assert only_active_id == relay_id("MerchantProduct", merchant_product_a.id)

      assert %{
               "data" => %{"merchantProducts" => nil},
               "errors" => [%{"message" => "invalid cursor", "path" => ["merchantProducts"]} | _]
             } =
               graphql(conn, merchant_products_query(), %{
                 "input" => %{
                   "productId" => relay_id("Product", product.id),
                   "after" => "bad-cursor"
                 }
               })
    end

    test "merchantProducts rejects raw integer IDs", %{conn: conn, test: test_name} do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-product"})
      merchant = merchant_fixture(%{name: unique_name("Merchant"), domain: unique_domain("m")})

      assert %{
               "data" => %{"merchantProducts" => nil},
               "errors" => [
                 %{"message" => "invalid product id", "path" => ["merchantProducts"]} | _
               ]
             } =
               graphql(conn, merchant_products_query(), %{
                 "input" => %{"productId" => product.id}
               })

      assert %{
               "data" => %{"merchantProducts" => nil},
               "errors" => [
                 %{"message" => "invalid merchant id", "path" => ["merchantProducts"]} | _
               ]
             } =
               graphql(conn, merchant_products_query(), %{
                 "input" => %{
                   "productId" => relay_id("Product", product.id),
                   "merchantId" => merchant.id
                 }
               })
    end
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
    merchant = Map.get(attrs, :merchant, merchant_fixture())
    product = Map.get(attrs, :product, SpecsFixtures.product_fixture())
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

  defp merchants_query do
    """
    query Merchants($first: Int, $after: String) {
      merchants(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            name
            domain
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

  defp merchant_products_query do
    """
    query MerchantProducts($input: MerchantProductsInput!) {
      merchantProducts(input: $input) {
        edges {
          cursor
          node {
            id
            merchantId
            productId
            isActive
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

  defp unique_name(prefix), do: "#{prefix} #{System.unique_integer([:positive])}"
  defp unique_domain(prefix), do: "#{prefix}-#{System.unique_integer([:positive])}.example.com"
end
