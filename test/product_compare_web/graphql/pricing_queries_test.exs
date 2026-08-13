defmodule ProductCompareWeb.GraphQL.PricingQueriesTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [capture_select_queries: 1, count_select_queries_targeting_table: 2]

  alias ProductCompare.Affiliate
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareWeb.Resolvers.Pricing.Merchants
  alias ProductCompareWeb.Resolvers.Pricing.Offers
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

  describe "/api/graphql pricing discovery queries" do
    test "product priceHistory90d exposes currency-separated merchant trends with global ids", %{
      conn: conn,
      test: test_name
    } do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-trend"})
      alpha = merchant_fixture(%{name: unique_name("Alpha Trend")})
      euro = merchant_fixture(%{name: unique_name("Euro Trend")})
      usd_offer = merchant_product_fixture(%{merchant: alpha, product: product, currency: "USD"})
      eur_offer = merchant_product_fixture(%{merchant: euro, product: product, currency: "EUR"})
      observed_at = DateTime.utc_now() |> DateTime.add(-3_600, :second)

      {:ok, _usd_point} =
        Pricing.add_price_point(%{
          merchant_product_id: usd_offer.id,
          observed_at: observed_at,
          price: Decimal.new("120.50"),
          in_stock: true
        })

      {:ok, _eur_point} =
        Pricing.add_price_point(%{
          merchant_product_id: eur_offer.id,
          observed_at: observed_at,
          price: Decimal.new("99.25"),
          in_stock: true
        })

      assert %{
               "data" => %{
                 "product" => %{
                   "priceHistory90d" => [
                     %{
                       "currency" => "EUR",
                       "merchants" => [eur_merchant],
                       "points" => eur_points
                     },
                     %{"currency" => "USD", "merchants" => [usd_merchant], "points" => usd_points}
                   ]
                 }
               }
             } = graphql(conn, product_price_history_query(), %{"slug" => product.slug})

      assert eur_merchant == %{
               "id" => relay_id(:merchant, euro.id),
               "merchantProductId" => relay_id(:merchant_product, eur_offer.id),
               "name" => euro.name
             }

      assert usd_merchant == %{
               "id" => relay_id(:merchant, alpha.id),
               "merchantProductId" => relay_id(:merchant_product, usd_offer.id),
               "name" => alpha.name
             }

      eur_offer_id = relay_id(:merchant_product, eur_offer.id)

      assert %{
               "averagePrice" => "99.25",
               "lowestMerchantProductId" => ^eur_offer_id,
               "lowestPrice" => "99.25",
               "merchantPrices" => [
                 %{
                   "merchantProductId" => ^eur_offer_id,
                   "price" => "99.25"
                 }
               ],
               "observedAt" => latest_observed_at
             } = List.last(eur_points)

      assert {:ok, latest_date, 0} = DateTime.from_iso8601(latest_observed_at)
      assert DateTime.compare(latest_date, observed_at) in [:eq, :gt]
      assert DateTime.to_date(latest_date) == DateTime.to_date(observed_at)

      assert List.last(usd_points)["lowestPrice"] == "120.50"
      assert Enum.count_until(eur_points, 92) <= 91
      assert Enum.count_until(usd_points, 92) <= 91
    end

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

      merchant_a_id = relay_id(:merchant, merchant_a.id)
      merchant_b_id = relay_id(:merchant, merchant_b.id)

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

      assert %{
               "data" => %{"merchants" => nil},
               "errors" => [%{"message" => "invalid first", "path" => ["merchants"]} | _]
             } = graphql(conn, merchants_query(), %{"first" => -1})
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
                   "productId" => relay_id(:product, product.id)
                 },
                 "first" => 1
               })

      assert first_id == relay_id(:merchant_product, merchant_product_a.id)
      assert first_merchant_id == relay_id(:merchant, merchant_a.id)
      assert first_product_id == relay_id(:product, product.id)

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
                   "productId" => relay_id(:product, product.id)
                 },
                 "first" => 10,
                 "after" => first_cursor
               })

      assert second_id == relay_id(:merchant_product, merchant_product_b.id)

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
                   "productId" => relay_id(:product, product.id),
                   "merchantId" => relay_id(:merchant, merchant_b.id)
                 },
                 "first" => 50
               })

      assert only_merchant_id == relay_id(:merchant_product, merchant_product_b.id)

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
                   "productId" => relay_id(:product, product.id),
                   "activeOnly" => true
                 },
                 "first" => 50
               })

      assert only_active_id == relay_id(:merchant_product, merchant_product_a.id)

      assert %{
               "data" => %{"merchantProducts" => nil},
               "errors" => [%{"message" => "invalid cursor", "path" => ["merchantProducts"]} | _]
             } =
               graphql(conn, merchant_products_query(), %{
                 "input" => %{
                   "productId" => relay_id(:product, product.id)
                 },
                 "first" => 50,
                 "after" => "bad-cursor"
               })

      assert %{
               "data" => %{"merchantProducts" => nil},
               "errors" => [
                 %{"message" => "invalid first", "path" => ["merchantProducts"]} | _
               ]
             } =
               graphql(conn, merchant_products_query(), %{
                 "input" => %{
                   "productId" => relay_id(:product, product.id)
                 },
                 "first" => -1
               })
    end

    test "merchants directly paginates the public directory without a loader" do
      first_merchant =
        merchant_fixture(%{
          name: unique_name("Direct Merchant First"),
          domain: unique_domain("direct-merchant-first")
        })

      second_merchant =
        merchant_fixture(%{
          name: unique_name("Direct Merchant Second"),
          domain: unique_domain("direct-merchant-second")
        })

      assert {:ok,
              %{
                edges: [%{cursor: cursor, node: first_node}],
                page_info: %{has_next_page: true, has_previous_page: false}
              }} = Merchants.merchants(nil, %{first: 1}, %{})

      assert first_node.id == first_merchant.id

      assert {:ok,
              %{
                edges: [%{node: second_node}],
                page_info: %{has_next_page: false, has_previous_page: true}
              }} = Merchants.merchants(nil, %{first: 1, after: cursor}, %{})

      assert second_node.id == second_merchant.id
    end

    test "merchantProducts directly applies normalized public filters without a loader" do
      product = SpecsFixtures.product_fixture(%{slug: "direct-offer-product"})
      merchant = merchant_fixture(%{name: unique_name("Direct Offer Merchant")})

      active_offer =
        merchant_product_fixture(%{merchant: merchant, product: product, is_active: true})

      _inactive_offer =
        merchant_product_fixture(%{merchant: merchant, product: product, is_active: false})

      assert {:ok,
              %{
                edges: [%{node: offer}],
                page_info: %{has_next_page: false, has_previous_page: false}
              }} =
               Offers.merchant_products(
                 nil,
                 %{
                   input: %{
                     product_id: relay_id(:product, product.id),
                     merchant_id: relay_id(:merchant, merchant.id),
                     active_only: true
                   },
                   first: 1
                 },
                 %{}
               )

      assert offer.id == active_offer.id
      assert offer.product_id == product.id
      assert offer.merchant_id == merchant.id
      assert offer.is_active
    end

    test "merchant discovery root rejects invalid connection inputs before collection SELECTs", %{
      conn: conn
    } do
      {invalid_cursor_response, invalid_cursor_queries} =
        capture_select_queries(fn ->
          graphql(conn, merchants_query(), %{"first" => 1, "after" => "bad-cursor"})
        end)

      assert %{
               "data" => %{"merchants" => nil},
               "errors" => [%{"message" => "invalid cursor", "path" => ["merchants"]} | _]
             } = invalid_cursor_response

      assert count_select_queries_targeting_table(invalid_cursor_queries, :merchants) == 0

      {invalid_first_response, invalid_first_queries} =
        capture_select_queries(fn ->
          graphql(conn, merchants_query(), %{"first" => -1})
        end)

      assert %{
               "data" => %{"merchants" => nil},
               "errors" => [%{"message" => "invalid first", "path" => ["merchants"]} | _]
             } = invalid_first_response

      assert count_select_queries_targeting_table(invalid_first_queries, :merchants) == 0
    end

    test "offer discovery root rejects invalid IDs and connection inputs before collection SELECTs",
         %{conn: conn, test: test_name} do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-validation-product"})
      merchant = merchant_fixture(%{name: unique_name("Validation Merchant")})

      invalid_inputs = [
        {%{"input" => %{"productId" => product.id}}, "invalid product id"},
        {
          %{
            "input" => %{
              "productId" => relay_id(:product, product.id),
              "merchantId" => merchant.id
            }
          },
          "invalid merchant id"
        },
        {%{
           "input" => %{"productId" => relay_id(:product, product.id)},
           "first" => -1
         }, "invalid first"},
        {%{
           "input" => %{"productId" => relay_id(:product, product.id)},
           "after" => "bad-cursor"
         }, "invalid cursor"}
      ]

      Enum.each(invalid_inputs, fn {variables, message} ->
        variables = Map.put_new(variables, "first", 50)

        {response, queries} =
          capture_select_queries(fn ->
            graphql(conn, merchant_products_query(), variables)
          end)

        assert %{
                 "data" => %{"merchantProducts" => nil},
                 "errors" => [%{"message" => ^message, "path" => ["merchantProducts"]} | _]
               } = response

        assert count_select_queries_targeting_table(queries, :merchant_products) == 0
      end)
    end

    test "product merchantProducts scopes offers to its parent and preserves pagination", %{
      conn: conn,
      test: test_name
    } do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-product"})
      other_product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-other-product"})
      merchant = merchant_fixture(%{name: unique_name("Nested Merchant")})

      first_offer =
        merchant_product_fixture(%{merchant: merchant, product: product, is_active: true})

      second_offer =
        merchant_product_fixture(%{merchant: merchant, product: product, is_active: true})

      _inactive_offer =
        merchant_product_fixture(%{merchant: merchant, product: product, is_active: false})

      _other_offer =
        merchant_product_fixture(%{merchant: merchant, product: other_product, is_active: true})

      assert %{
               "data" => %{
                 "product" => %{
                   "merchantProducts" => %{
                     "edges" => [
                       %{
                         "cursor" => first_cursor,
                         "node" => %{
                           "id" => first_id,
                           "productId" => product_id,
                           "isActive" => true
                         }
                       }
                     ],
                     "pageInfo" => %{"hasNextPage" => true}
                   }
                 }
               }
             } =
               graphql(conn, product_merchant_products_query(), %{
                 "slug" => product.slug,
                 "first" => 1,
                 "activeOnly" => true
               })

      assert first_id == relay_id(:merchant_product, first_offer.id)
      assert product_id == relay_id(:product, product.id)

      assert %{
               "data" => %{
                 "product" => %{
                   "merchantProducts" => %{
                     "edges" => [
                       %{"node" => %{"id" => second_id, "isActive" => true}}
                     ],
                     "pageInfo" => %{"hasNextPage" => false}
                   }
                 }
               }
             } =
               graphql(conn, product_merchant_products_query(), %{
                 "slug" => product.slug,
                 "first" => 1,
                 "after" => first_cursor,
                 "activeOnly" => true
               })

      assert second_id == relay_id(:merchant_product, second_offer.id)

      assert %{
               "data" => %{"product" => %{"merchantProducts" => nil}},
               "errors" => [
                 %{
                   "message" => "invalid cursor",
                   "path" => ["product", "merchantProducts"]
                 }
                 | _
               ]
             } =
               graphql(conn, product_merchant_products_query(), %{
                 "slug" => product.slug,
                 "first" => 1,
                 "after" => "bad-cursor",
                 "activeOnly" => true
               })

      assert %{
               "data" => %{"product" => %{"merchantProducts" => nil}},
               "errors" => [
                 %{
                   "message" => "invalid first",
                   "path" => ["product", "merchantProducts"]
                 }
                 | _
               ]
             } =
               graphql(conn, product_merchant_products_query(), %{
                 "slug" => product.slug,
                 "first" => -1,
                 "activeOnly" => true
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
                 "input" => %{"productId" => product.id},
                 "first" => 50
               })

      assert %{
               "data" => %{"merchantProducts" => nil},
               "errors" => [
                 %{"message" => "invalid merchant id", "path" => ["merchantProducts"]} | _
               ]
             } =
               graphql(conn, merchant_products_query(), %{
                 "input" => %{
                   "productId" => relay_id(:product, product.id),
                   "merchantId" => merchant.id
                 },
                 "first" => 50
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
          "productId" => relay_id(:product, product.id),
          "merchantId" => relay_id(:merchant, merchant.id)
        },
        "first" => 1,
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
                                 "id" => latest_history_price_id,
                                 "price" => "99.99"
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

      assert latest_price_id == relay_id(:price_point, latest_price.id)
      assert latest_history_price_id == relay_id(:price_point, latest_price.id)
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
                                 "id" => middle_history_price_id,
                                 "price" => "149.99"
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

      assert middle_history_price_id == relay_id(:price_point, middle_price.id)

      assert %{
               "errors" => [
                 %{
                   "message" => "invalid cursor",
                   "path" => ["merchantProducts", "edges", 0, "node", "priceHistory"]
                 }
                 | _
               ]
             } =
               graphql(
                 conn,
                 merchant_product_pricing_query(),
                 Map.put(variables, "historyAfter", "bad-cursor")
               )

      assert %{
               "errors" => [
                 %{
                   "message" => "invalid first",
                   "path" => ["merchantProducts", "edges", 0, "node", "priceHistory"]
                 }
                 | _
               ]
             } =
               graphql(
                 conn,
                 merchant_product_pricing_query(),
                 Map.put(variables, "historyFirst", -1)
               )
    end

    test "merchantProducts exposes public display active coupons for product offers", %{
      conn: conn,
      test: test_name
    } do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-coupon-product"})

      merchant =
        merchant_fixture(%{name: unique_name("Coupon Merchant"), domain: unique_domain("coupon")})

      merchant_product =
        merchant_product_fixture(%{
          merchant: merchant,
          product: product,
          is_active: true
        })

      other_merchant =
        merchant_fixture(%{name: unique_name("Other Merchant"), domain: unique_domain("other")})

      now = DateTime.utc_now() |> DateTime.truncate(:microsecond)
      one_hour_from_now = DateTime.add(now, 3600, :second)
      two_hours_from_now = DateTime.add(now, 7200, :second)
      three_hours_from_now = DateTime.add(now, 10_800, :second)
      one_hour_from_now_iso = DateTime.to_iso8601(one_hour_from_now)
      two_hours_from_now_iso = DateTime.to_iso8601(two_hours_from_now)

      {:ok, amount_coupon} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "SAVE-20",
          description: "Twenty dollars off",
          discount_type: :amount,
          discount_value: Decimal.new("20.00"),
          currency: "USD",
          valid_to: one_hour_from_now,
          terms: "One use per customer"
        })

      {:ok, percent_coupon} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "SAVE-10",
          description: "Ten percent off",
          discount_type: :percent,
          discount_value: Decimal.new("10"),
          valid_to: two_hours_from_now
        })

      {:ok, _third_coupon} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "SAVE-30",
          description: "Third active coupon",
          discount_type: :other,
          valid_to: three_hours_from_now
        })

      {:ok, _future_coupon} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "FUTURE-COUPON",
          discount_type: :other,
          valid_from: one_hour_from_now
        })

      {:ok, _other_merchant_coupon} =
        Affiliate.create_coupon(%{
          merchant_id: other_merchant.id,
          code: "OTHER-MERCHANT",
          discount_type: :other
        })

      assert %{
               "data" => %{
                 "merchantProducts" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => merchant_product_id,
                         "merchant" => %{"name" => merchant_name},
                         "activeCoupons" => %{
                           "edges" => coupon_edges,
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
             } =
               graphql(conn, merchant_product_active_coupons_query(), %{
                 "input" => %{
                   "productId" => relay_id(:product, product.id),
                   "activeOnly" => true
                 },
                 "first" => 1,
                 "couponFirst" => 2
               })

      assert merchant_product_id == relay_id(:merchant_product, merchant_product.id)
      assert merchant_name == merchant.name

      assert [
               %{
                 "cursor" => amount_coupon_cursor,
                 "node" => %{
                   "code" => "SAVE-20",
                   "description" => "Twenty dollars off",
                   "discountType" => "AMOUNT",
                   "discountValue" => "20.00",
                   "currency" => "USD",
                   "validTo" => ^one_hour_from_now_iso,
                   "terms" => "One use per customer"
                 }
               },
               %{
                 "cursor" => percent_coupon_cursor,
                 "node" => %{
                   "code" => "SAVE-10",
                   "description" => "Ten percent off",
                   "discountType" => "PERCENT",
                   "discountValue" => "10",
                   "currency" => nil,
                   "validTo" => ^two_hours_from_now_iso,
                   "terms" => nil
                 }
               }
             ] = coupon_edges

      assert is_binary(amount_coupon_cursor)
      assert is_binary(percent_coupon_cursor)
      assert amount_coupon_cursor != percent_coupon_cursor
      assert amount_coupon.id != percent_coupon.id

      assert %{
               "errors" => [
                 %{
                   "message" => "invalid first",
                   "path" => ["merchantProducts", "edges", 0, "node", "activeCoupons"]
                 }
                 | _
               ]
             } =
               graphql(conn, merchant_product_active_coupons_query(), %{
                 "input" => %{
                   "productId" => relay_id(:product, product.id),
                   "activeOnly" => true
                 },
                 "first" => 1,
                 "couponFirst" => -1
               })
    end

    test "merchantProducts public display active coupons do not expose coupon node IDs", %{
      conn: conn
    } do
      assert %{
               "data" => %{
                 "__type" => %{
                   "fields" => fields
                 }
               }
             } = graphql(conn, active_coupon_type_fields_query(), %{})

      field_names = Enum.map(fields, & &1["name"])

      refute "id" in field_names
    end

    test "merchantProducts public display active coupons reject client-supplied timestamps", %{
      conn: conn,
      test: test_name
    } do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-timestamp-product"})
      merchant = merchant_fixture(%{name: unique_name("Timestamp Merchant")})

      _merchant_product =
        merchant_product_fixture(%{
          merchant: merchant,
          product: product,
          is_active: true
        })

      assert %{
               "errors" => [
                 %{
                   "message" => message
                 }
                 | _
               ]
             } =
               graphql(conn, merchant_product_active_coupons_with_at_query(), %{
                 "input" => %{
                   "productId" => relay_id(:product, product.id),
                   "activeOnly" => true
                 },
                 "first" => 1,
                 "couponFirst" => 10,
                 "at" => DateTime.utc_now() |> DateTime.add(365, :day) |> DateTime.to_iso8601()
               })

      assert message =~ "Unknown argument"
      assert message =~ "at"
    end

    test "merchantProducts batches merchant product and latest price lookups", %{
      conn: conn,
      test: test_name
    } do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-batched-product"})

      merchant_products =
        1..4
        |> Enum.map(fn index ->
          merchant =
            merchant_fixture(%{
              name: unique_name("Batch Merchant #{index}"),
              domain: unique_domain("batch-#{index}")
            })

          merchant_product =
            merchant_product_fixture(%{
              merchant: merchant,
              product: product,
              is_active: true
            })

          {:ok, latest_price} =
            Pricing.add_price_point(%{
              merchant_product_id: merchant_product.id,
              observed_at:
                DateTime.utc_now()
                |> DateTime.add(index, :second)
                |> DateTime.truncate(:microsecond),
              price: Decimal.new("#{100 + index}.99")
            })

          {merchant_product, merchant, latest_price}
        end)

      {response, queries} =
        capture_select_queries(fn ->
          graphql(conn, merchant_products_with_nested_fields_query(), %{
            "input" => %{
              "productId" => relay_id(:product, product.id)
            },
            "first" => 10
          })
        end)

      assert %{
               "data" => %{
                 "merchantProducts" => %{
                   "edges" => edges
                 }
               }
             } = response

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
                     "id" => relay_id(:product, product.id),
                     "slug" => product.slug
                   },
                   "latestPrice" => %{
                     "id" => relay_id(:price_point, latest_price.id),
                     "price" => Decimal.to_string(latest_price.price)
                   }
                 }
               end)
      end)

      assert [_, _, _, _] = queries
    end

    test "product and price observations expose complete source-backed offer truth", %{
      conn: conn,
      test: test_name
    } do
      product = SpecsFixtures.product_fixture(%{slug: "#{test_name}-truth-product"})

      higher_item_merchant =
        merchant_fixture(%{
          name: unique_name("Free Shipping Merchant"),
          domain: unique_domain("free-shipping")
        })

      lower_item_merchant =
        merchant_fixture(%{
          name: unique_name("Paid Shipping Merchant"),
          domain: unique_domain("paid-shipping")
        })

      higher_item_offer =
        merchant_product_fixture(%{
          merchant: higher_item_merchant,
          product: product,
          is_active: true
        })

      lower_item_offer =
        merchant_product_fixture(%{
          merchant: lower_item_merchant,
          product: product,
          is_active: true
        })

      source =
        %Source{}
        |> Source.changeset(%{
          kind: "affiliate",
          name: unique_name("CJ price source"),
          domain: "cj.example"
        })
        |> Repo.insert!()

      fetched_at = DateTime.utc_now() |> DateTime.truncate(:microsecond)

      artifact =
        %SourceArtifact{}
        |> SourceArtifact.changeset(%{
          source_id: source.id,
          url: "https://merchant.example/product-feed",
          fetched_at: fetched_at,
          content_hash:
            :crypto.hash(:sha256, "offer-truth-#{System.unique_integer([:positive])}"),
          raw_json: %{"private" => "payload"}
        })
        |> Repo.insert!()

      {:ok, higher_item_price} =
        Pricing.add_price_point(%{
          merchant_product_id: higher_item_offer.id,
          observed_at: fetched_at,
          price: Decimal.new("60"),
          shipping: Decimal.new("0"),
          in_stock: true,
          artifact_id: artifact.id
        })

      {:ok, _lower_item_price} =
        Pricing.add_price_point(%{
          merchant_product_id: lower_item_offer.id,
          observed_at: fetched_at,
          price: Decimal.new("50"),
          shipping: Decimal.new("20"),
          in_stock: true
        })

      assert %{
               "data" => %{
                 "product" => %{
                   "offerTruth" => %{
                     "offerCount" => 2,
                     "observedOfferCount" => 2,
                     "eligibleOfferCount" => 2,
                     "currencySummaries" => [
                       %{
                         "currency" => "USD",
                         "offerCount" => 2,
                         "observedOfferCount" => 2,
                         "eligibleOfferCount" => 2,
                         "bestOffer" => %{
                           "merchantProductId" => best_offer_id,
                           "itemPrice" => "60",
                           "shipping" => "0",
                           "landedPrice" => "60",
                           "landedPriceComplete" => true,
                           "stockStatus" => "IN_STOCK",
                           "freshness" => "FRESH",
                           "eligible" => true,
                           "sourceArtifact" => %{
                             "id" => source_artifact_id,
                             "sourceName" => source_name,
                             "fetchedAt" => fetched_at_value
                           }
                         }
                       }
                     ]
                   }
                 },
                 "merchantProducts" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "latestPrice" => %{
                           "id" => latest_price_id,
                           "shipping" => "0",
                           "inStock" => true,
                           "sourceArtifact" => %{
                             "id" => latest_source_artifact_id,
                             "sourceName" => latest_source_name
                           }
                         }
                       }
                     }
                   ]
                 }
               }
             } =
               graphql(conn, complete_offer_truth_query(), %{
                 "slug" => product.slug,
                 "input" => %{
                   "productId" => relay_id(:product, product.id),
                   "merchantId" => relay_id(:merchant, higher_item_merchant.id)
                 },
                 "first" => 1
               })

      assert best_offer_id == relay_id(:merchant_product, higher_item_offer.id)
      assert latest_price_id == relay_id(:price_point, higher_item_price.id)
      assert source_artifact_id == relay_id(:source_artifact, artifact.id)
      assert latest_source_artifact_id == relay_id(:source_artifact, artifact.id)
      assert source_name == source.name
      assert latest_source_name == source.name
      assert {:ok, parsed_fetched_at, 0} = DateTime.from_iso8601(fetched_at_value)
      assert DateTime.compare(parsed_fetched_at, fetched_at) == :eq
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
    query Merchants($first: Int!, $after: String) {
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
    query MerchantProducts(
      $input: MerchantProductsInput!
      $first: Int!
      $after: String
    ) {
      merchantProducts(input: $input, first: $first, after: $after) {
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

  defp product_price_history_query do
    """
    query ProductPriceHistory($slug: String!) {
      product(slug: $slug) {
        priceHistory90d {
          currency
          merchants {
            id
            name
            merchantProductId
          }
          points {
            observedAt
            lowestPrice
            averagePrice
            lowestMerchantProductId
            merchantPrices {
              merchantProductId
              price
            }
          }
        }
      }
    }
    """
  end

  defp product_merchant_products_query do
    """
    query ProductMerchantProducts(
      $slug: String!
      $first: Int!
      $after: String
      $activeOnly: Boolean
    ) {
      product(slug: $slug) {
        merchantProducts(first: $first, after: $after, activeOnly: $activeOnly) {
          edges {
            cursor
            node {
              id
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
    }
    """
  end

  defp merchant_product_pricing_query do
    """
    query MerchantProductPricing(
      $input: MerchantProductsInput!
      $first: Int!
      $historyFirst: Int!
      $historyAfter: String
      $from: DateTime
      $to: DateTime
    ) {
      merchantProducts(input: $input, first: $first) {
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

  defp merchant_product_active_coupons_query do
    """
    query MerchantProductActiveCoupons(
      $input: MerchantProductsInput!
      $first: Int!
      $couponFirst: Int!
    ) {
      merchantProducts(input: $input, first: $first) {
        edges {
          node {
            id
            merchant {
              name
            }
            activeCoupons(first: $couponFirst) {
              edges {
                cursor
                node {
                  code
                  description
                  discountType
                  discountValue
                  currency
                  validTo
                  terms
                }
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
            }
          }
        }
      }
    }
    """
  end

  defp active_coupon_type_fields_query do
    """
    query ActiveCouponTypeFields {
      __type(name: "ActiveCoupon") {
        fields {
          name
        }
      }
    }
    """
  end

  defp merchant_product_active_coupons_with_at_query do
    """
    query MerchantProductActiveCouponsWithAt(
      $input: MerchantProductsInput!
      $first: Int!
      $couponFirst: Int!
      $at: DateTime!
    ) {
      merchantProducts(input: $input, first: $first) {
        edges {
          node {
            activeCoupons(first: $couponFirst, at: $at) {
              edges {
                node {
                  code
                }
              }
            }
          }
        }
      }
    }
    """
  end

  defp merchant_products_with_nested_fields_query do
    """
    query MerchantProductsWithNestedFields(
      $input: MerchantProductsInput!
      $first: Int!
    ) {
      merchantProducts(input: $input, first: $first) {
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

  defp complete_offer_truth_query do
    """
    query CompleteOfferTruth(
      $slug: String!
      $input: MerchantProductsInput!
      $first: Int!
    ) {
      product(slug: $slug) {
        offerTruth {
          offerCount
          observedOfferCount
          eligibleOfferCount
          currencySummaries {
            currency
            offerCount
            observedOfferCount
            eligibleOfferCount
            bestOffer {
              merchantProductId
              itemPrice
              shipping
              landedPrice
              landedPriceComplete
              stockStatus
              freshness
              eligible
              sourceArtifact {
                id
                sourceName
                fetchedAt
              }
            }
          }
        }
      }
      merchantProducts(input: $input, first: $first) {
        edges {
          node {
            latestPrice {
              id
              shipping
              inStock
              sourceArtifact {
                id
                sourceName
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

  defp unique_name(prefix), do: "#{prefix} #{System.unique_integer([:positive])}"
  defp unique_domain(prefix), do: "#{prefix}-#{System.unique_integer([:positive])}.example.com"
end
