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
                   "edges" => edges,
                   "pageInfo" => %{"hasNextPage" => false}
                 }
               }
             } = graphql(conn, merchants_query(), %{"first" => 200})

      merchant_a_id = relay_id("Merchant", merchant_a.id)
      merchant_b_id = relay_id("Merchant", merchant_b.id)

      merchant_a_index =
        Enum.find_index(edges, fn edge ->
          get_in(edge, ["node", "id"]) == merchant_a_id
        end)

      merchant_b_index =
        Enum.find_index(edges, fn edge ->
          get_in(edge, ["node", "id"]) == merchant_b_id
        end)

      refute is_nil(merchant_a_index)
      refute is_nil(merchant_b_index)
      assert merchant_a_index < merchant_b_index

      merchant_a_cursor = edges |> Enum.at(merchant_a_index) |> Map.fetch!("cursor")

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
                     "hasPreviousPage" => true
                   }
                 }
               }
             } = graphql(conn, merchants_query(), %{"first" => 1, "after" => merchant_a_cursor})

      assert second_id == merchant_b_id

      assert %{
               "data" => %{"merchants" => nil},
               "errors" => [%{"message" => "invalid cursor", "path" => ["merchants"]} | _]
             } = graphql(conn, merchants_query(), %{"first" => 1, "after" => "bad-cursor"})
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

    test "merchantProducts exposes latestPrice and priceHistory with filters and strict cursor handling",
         %{
           conn: conn,
           test: test_name
         } do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-product"})

      merchant =
        merchant_fixture(%{name: unique_name("Merchant"), domain: unique_domain("history")})

      merchant_product =
        merchant_product_fixture(%{
          merchant: merchant,
          product: product,
          is_active: true
        })

      now = DateTime.utc_now() |> DateTime.truncate(:microsecond)
      one_hour_ago = DateTime.add(now, -3600, :second)
      two_hours_ago = DateTime.add(now, -7200, :second)

      {:ok, oldest_price} =
        Pricing.add_price_point(%{
          merchant_product_id: merchant_product.id,
          observed_at: two_hours_ago,
          price: Decimal.new("199.99")
        })

      {:ok, middle_price} =
        Pricing.add_price_point(%{
          merchant_product_id: merchant_product.id,
          observed_at: one_hour_ago,
          price: Decimal.new("149.99")
        })

      {:ok, latest_price} =
        Pricing.add_price_point(%{
          merchant_product_id: merchant_product.id,
          observed_at: now,
          price: Decimal.new("99.99")
        })

      variables = %{
        "input" => %{
          "productId" => relay_id("Product", product.id),
          "merchantId" => relay_id("Merchant", merchant.id),
          "first" => 1
        },
        "historyFirst" => 1,
        "from" => DateTime.to_iso8601(one_hour_ago),
        "to" => DateTime.to_iso8601(now)
      }

      assert %{
               "data" => %{
                 "merchantProducts" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "latestPrice" => %{
                           "id" => latest_price_id,
                           "price" => "99.99"
                         },
                         "priceHistory" => %{
                           "edges" => [
                             %{
                               "cursor" => history_cursor,
                               "node" => %{
                                 "id" => middle_price_id,
                                 "price" => "149.99"
                               }
                             }
                           ],
                           "pageInfo" => %{
                             "hasNextPage" => true,
                             "hasPreviousPage" => false
                           }
                         }
                       }
                     }
                   ]
                 }
               }
             } = graphql(conn, merchant_product_pricing_query(), variables)

      assert latest_price_id == relay_id("PricePoint", latest_price.id)
      assert middle_price_id == relay_id("PricePoint", middle_price.id)
      assert oldest_price.id < middle_price.id

      assert %{
               "data" => %{
                 "merchantProducts" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "priceHistory" => %{
                           "edges" => [
                             %{
                               "node" => %{
                                 "id" => latest_history_price_id,
                                 "price" => "99.99"
                               }
                             }
                           ],
                           "pageInfo" => %{
                             "hasNextPage" => false,
                             "hasPreviousPage" => true
                           }
                         }
                       }
                     }
                   ]
                 }
               }
             } =
               graphql(
                 conn,
                 merchant_product_pricing_query(),
                 Map.put(variables, "historyAfter", history_cursor)
               )

      assert latest_history_price_id == relay_id("PricePoint", latest_price.id)

      assert %{
               "errors" => [%{"message" => "invalid cursor"} | _]
             } =
               graphql(
                 conn,
                 merchant_product_pricing_query(),
                 Map.put(variables, "historyAfter", "bad-cursor")
               )
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

  defp merchant_product_pricing_query do
    """
    query MerchantProductPricing(
      $input: MerchantProductsInput!
      $historyFirst: Int
      $historyAfter: String
      $from: DateTime
      $to: DateTime
    ) {
      merchantProducts(input: $input) {
        edges {
          node {
            id
            latestPrice {
              id
              observedAt
              price
            }
            priceHistory(first: $historyFirst, after: $historyAfter, from: $from, to: $to) {
              edges {
                cursor
                node {
                  id
                  observedAt
                  price
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
