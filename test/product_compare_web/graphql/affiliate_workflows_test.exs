defmodule ProductCompareWeb.GraphQL.AffiliateWorkflowsTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompare.Affiliate
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompareSchemas.Affiliate.AffiliateLink
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.Affiliate.Coupon
  alias ProductCompareWeb.Resolvers.Affiliate.Mutations
  alias ProductCompareWeb.Resolvers.Affiliate.Reads

  import ProductCompare.Fixtures.AccountsFixtures

  describe "/api/graphql affiliate workflows" do
    test "authorized end-to-end affiliate workflow across network/program/link/coupon operations",
         %{
           conn: conn
         } do
      authed_conn = operator_conn(conn, :api_token)
      merchant = merchant_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant})
      now = DateTime.utc_now() |> DateTime.truncate(:second)
      one_hour = 3600
      two_hours = 7200
      merchant_id = relay_id(:merchant, merchant.id)
      merchant_product_id = relay_id(:merchant_product, merchant_product.id)

      assert %{
               "data" => %{
                 "upsertAffiliateNetwork" => %{
                   "network" => %{
                     "id" => primary_network_id,
                     "name" => "Impact"
                   }
                 }
               }
             } =
               graphql(authed_conn, upsert_network_mutation(), %{
                 "input" => %{"name" => "Impact"}
               })

      impact_network = Repo.get_by!(AffiliateNetwork, name: "Impact")
      assert primary_network_id == relay_id(:affiliate_network, impact_network.id)

      assert %{
               "data" => %{
                 "upsertAffiliateNetwork" => %{
                   "network" => %{
                     "id" => ^primary_network_id,
                     "name" => "Impact"
                   }
                 }
               }
             } =
               graphql(authed_conn, upsert_network_mutation(), %{
                 "input" => %{"name" => "Impact"}
               })

      assert %{
               "data" => %{
                 "upsertAffiliateNetwork" => %{
                   "network" => %{
                     "id" => secondary_network_id,
                     "name" => "Partnerize"
                   }
                 }
               }
             } =
               graphql(authed_conn, upsert_network_mutation(), %{
                 "input" => %{"name" => "Partnerize"}
               })

      partnerize_network = Repo.get_by!(AffiliateNetwork, name: "Partnerize")
      assert secondary_network_id == relay_id(:affiliate_network, partnerize_network.id)

      assert %{
               "data" => %{
                 "upsertAffiliateProgram" => %{
                   "program" => %{
                     "id" => first_program_id,
                     "affiliateNetworkId" => first_program_network_id,
                     "merchantId" => first_program_merchant_id,
                     "programCode" => "CJ-OLD",
                     "status" => "active"
                   }
                 }
               }
             } =
               graphql(authed_conn, upsert_program_mutation(), %{
                 "input" => %{
                   "affiliateNetworkId" => primary_network_id,
                   "merchantId" => merchant_id,
                   "programCode" => "CJ-OLD",
                   "status" => "active"
                 }
               })

      assert first_program_network_id == primary_network_id
      assert first_program_merchant_id == merchant_id

      assert %{
               "data" => %{
                 "upsertAffiliateProgram" => %{
                   "program" => %{
                     "id" => ^first_program_id,
                     "affiliateNetworkId" => updated_program_network_id,
                     "merchantId" => updated_program_merchant_id,
                     "programCode" => "CJ-NEW",
                     "status" => "paused"
                   }
                 }
               }
             } =
               graphql(authed_conn, upsert_program_mutation(), %{
                 "input" => %{
                   "affiliateNetworkId" => primary_network_id,
                   "merchantId" => merchant_id,
                   "programCode" => "CJ-NEW",
                   "status" => "paused"
                 }
               })

      assert updated_program_network_id == primary_network_id
      assert updated_program_merchant_id == merchant_id

      first_verified_at = DateTime.to_iso8601(now)
      second_verified_at = now |> DateTime.add(one_hour, :second) |> DateTime.to_iso8601()

      assert %{
               "data" => %{
                 "upsertAffiliateLink" => %{
                   "link" => %{
                     "id" => first_link_id,
                     "merchantProductId" => first_link_merchant_product_id,
                     "affiliateNetworkId" => first_link_network_id,
                     "originalUrl" => "https://merchant.example.com/products/1",
                     "affiliateUrl" => "https://network.example.com/track/first",
                     "lastVerifiedAt" => first_link_verified_at
                   }
                 }
               }
             } =
               graphql(authed_conn, upsert_link_mutation(), %{
                 "input" => %{
                   "merchantProductId" => merchant_product_id,
                   "affiliateNetworkId" => primary_network_id,
                   "originalUrl" => "https://merchant.example.com/products/1",
                   "affiliateUrl" => "https://network.example.com/track/first",
                   "lastVerifiedAt" => first_verified_at
                 }
               })

      assert first_link_merchant_product_id == merchant_product_id
      assert first_link_network_id == primary_network_id

      assert {:ok, parsed_first_link_verified_at, 0} =
               DateTime.from_iso8601(first_link_verified_at)

      assert DateTime.compare(parsed_first_link_verified_at, now) == :eq

      assert %{
               "data" => %{
                 "upsertAffiliateLink" => %{
                   "link" => %{
                     "id" => ^first_link_id,
                     "merchantProductId" => updated_link_merchant_product_id,
                     "affiliateNetworkId" => updated_link_network_id,
                     "originalUrl" => "https://merchant.example.com/products/1?ref=updated",
                     "affiliateUrl" => "https://network.example.com/track/second",
                     "lastVerifiedAt" => updated_link_verified_at
                   }
                 }
               }
             } =
               graphql(authed_conn, upsert_link_mutation(), %{
                 "input" => %{
                   "merchantProductId" => merchant_product_id,
                   "affiliateNetworkId" => secondary_network_id,
                   "originalUrl" => "https://merchant.example.com/products/1?ref=updated",
                   "affiliateUrl" => "https://network.example.com/track/second",
                   "lastVerifiedAt" => second_verified_at
                 }
               })

      assert updated_link_merchant_product_id == merchant_product_id
      assert updated_link_network_id == secondary_network_id

      assert {:ok, parsed_updated_link_verified_at, 0} =
               DateTime.from_iso8601(updated_link_verified_at)

      assert DateTime.compare(
               parsed_updated_link_verified_at,
               DateTime.add(now, one_hour, :second)
             ) == :eq

      active_valid_from = DateTime.add(now, -one_hour, :second) |> DateTime.to_iso8601()
      active_valid_to = DateTime.add(now, one_hour, :second) |> DateTime.to_iso8601()
      future_valid_from = DateTime.add(now, two_hours, :second) |> DateTime.to_iso8601()
      future_valid_to = DateTime.add(now, two_hours + one_hour, :second) |> DateTime.to_iso8601()

      assert %{
               "data" => %{
                 "createCoupon" => %{
                   "coupon" => %{
                     "id" => created_coupon_id,
                     "code" => "SAVE-20",
                     "merchantId" => created_coupon_merchant_id,
                     "affiliateNetworkId" => created_coupon_network_id,
                     "discountType" => "AMOUNT",
                     "discountValue" => "20.00",
                     "currency" => "USD"
                   }
                 }
               }
             } =
               graphql(authed_conn, create_coupon_mutation(), %{
                 "input" => %{
                   "merchantId" => merchant_id,
                   "affiliateNetworkId" => primary_network_id,
                   "code" => "SAVE-20",
                   "description" => "Twenty dollars off",
                   "discountType" => "AMOUNT",
                   "discountValue" => "20.00",
                   "currency" => "USD",
                   "validFrom" => active_valid_from,
                   "validTo" => active_valid_to,
                   "terms" => "One use per customer"
                 }
               })

      assert created_coupon_merchant_id == merchant_id
      assert created_coupon_network_id == primary_network_id

      second_active_valid_to = DateTime.add(now, two_hours, :second) |> DateTime.to_iso8601()

      assert %{
               "data" => %{
                 "createCoupon" => %{
                   "coupon" => %{
                     "id" => second_coupon_id,
                     "code" => "SAVE-10",
                     "merchantId" => ^merchant_id,
                     "affiliateNetworkId" => ^primary_network_id
                   }
                 }
               }
             } =
               graphql(authed_conn, create_coupon_mutation(), %{
                 "input" => %{
                   "merchantId" => merchant_id,
                   "affiliateNetworkId" => primary_network_id,
                   "code" => "SAVE-10",
                   "discountType" => "PERCENT",
                   "discountValue" => "10.00",
                   "validFrom" => active_valid_from,
                   "validTo" => second_active_valid_to
                 }
               })

      assert %{
               "data" => %{
                 "createCoupon" => %{
                   "coupon" => %{
                     "code" => "FUTURE-COUPON"
                   }
                 }
               }
             } =
               graphql(authed_conn, create_coupon_mutation(), %{
                 "input" => %{
                   "merchantId" => merchant_id,
                   "affiliateNetworkId" => primary_network_id,
                   "code" => "FUTURE-COUPON",
                   "discountType" => "OTHER",
                   "validFrom" => future_valid_from,
                   "validTo" => future_valid_to
                 }
               })

      now_iso = DateTime.to_iso8601(now)

      assert %{
               "data" => %{
                 "activeCoupons" => %{
                   "coupons" => %{
                     "edges" => [
                       %{
                         "cursor" => first_coupon_cursor,
                         "node" => %{
                           "id" => ^created_coupon_id,
                           "code" => "SAVE-20",
                           "discountType" => "AMOUNT"
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
               }
             } =
               graphql(authed_conn, active_coupons_query(), %{
                 "input" => %{"merchantId" => merchant_id, "at" => now_iso, "first" => 1}
               })

      assert first_coupon_cursor == first_start_cursor
      assert first_coupon_cursor == first_end_cursor

      assert %{
               "data" => %{
                 "activeCoupons" => %{
                   "coupons" => %{
                     "edges" => [
                       %{
                         "node" => %{
                           "id" => ^second_coupon_id,
                           "code" => "SAVE-10",
                           "discountType" => "PERCENT"
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
             } =
               graphql(authed_conn, active_coupons_query(), %{
                 "input" => %{
                   "merchantId" => merchant_id,
                   "at" => now_iso,
                   "first" => 10,
                   "after" => first_coupon_cursor
                 }
               })

      assert %{
               "data" => %{
                 "activeCoupons" => %{
                   "coupons" => %{
                     "edges" => coupons_without_at
                   }
                 }
               }
             } =
               graphql(authed_conn, active_coupons_query(), %{
                 "input" => %{"merchantId" => merchant_id}
               })

      assert Enum.map(coupons_without_at, &get_in(&1, ["node", "code"])) == ["SAVE-20", "SAVE-10"]
      refute Enum.any?(coupons_without_at, &(get_in(&1, ["node", "code"]) == "FUTURE-COUPON"))
    end

    test "affiliate mutations and activeCoupons query require authentication", %{conn: conn} do
      merchant = merchant_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant})
      {:ok, existing_network} = Affiliate.upsert_network(%{name: "Existing Network"})
      existing_network_id = relay_id(:affiliate_network, existing_network.id)
      merchant_id = relay_id(:merchant, merchant.id)
      merchant_product_id = relay_id(:merchant_product, merchant_product.id)

      baseline_counts = %{
        network: Repo.aggregate(AffiliateNetwork, :count, :id),
        program: Repo.aggregate(AffiliateProgram, :count, :id),
        link: Repo.aggregate(AffiliateLink, :count, :id),
        coupon: Repo.aggregate(Coupon, :count, :id)
      }

      response =
        graphql(conn, upsert_network_mutation(), %{
          "input" => %{"name" => "Unauthorized Network"}
        })

      assert_mutation_unauthorized(response, "upsertAffiliateNetwork", "network")

      response =
        graphql(conn, upsert_program_mutation(), %{
          "input" => %{
            "affiliateNetworkId" => existing_network_id,
            "merchantId" => merchant_id,
            "programCode" => "CJ-NEW",
            "status" => "active"
          }
        })

      assert_mutation_unauthorized(response, "upsertAffiliateProgram", "program")

      response =
        graphql(conn, upsert_link_mutation(), %{
          "input" => %{
            "merchantProductId" => merchant_product_id,
            "affiliateNetworkId" => existing_network_id,
            "originalUrl" => "https://merchant.example.com/products/unauthorized",
            "affiliateUrl" => "https://network.example.com/track/unauthorized"
          }
        })

      assert_mutation_unauthorized(response, "upsertAffiliateLink", "link")

      response =
        graphql(conn, create_coupon_mutation(), %{
          "input" => %{
            "merchantId" => merchant_id,
            "affiliateNetworkId" => existing_network_id,
            "code" => "UNAUTHORIZED-COUPON",
            "discountType" => "OTHER"
          }
        })

      assert_mutation_unauthorized(response, "createCoupon", "coupon")

      response =
        graphql(conn, active_coupons_query(), %{
          "input" => %{"merchantId" => merchant_id}
        })

      assert %{
               "data" => %{"activeCoupons" => nil},
               "errors" => [
                 %{
                   "message" => "unauthorized",
                   "path" => ["activeCoupons"],
                   "extensions" => %{"code" => "UNAUTHENTICATED"}
                 }
                 | _
               ]
             } = response

      assert Repo.aggregate(AffiliateNetwork, :count, :id) == baseline_counts.network
      assert Repo.aggregate(AffiliateProgram, :count, :id) == baseline_counts.program
      assert Repo.aggregate(AffiliateLink, :count, :id) == baseline_counts.link
      assert Repo.aggregate(Coupon, :count, :id) == baseline_counts.coupon
    end

    test "affiliate mutations and activeCoupons reject authenticated members without writes", %{
      conn: conn
    } do
      member_conn = member_conn(conn, :api_token)
      merchant = merchant_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant})
      {:ok, network} = Affiliate.upsert_network(%{name: "Member Boundary Network"})
      network_id = relay_id(:affiliate_network, network.id)
      merchant_id = relay_id(:merchant, merchant.id)
      merchant_product_id = relay_id(:merchant_product, merchant_product.id)

      baseline =
        {Repo.aggregate(AffiliateNetwork, :count), Repo.aggregate(AffiliateProgram, :count),
         Repo.aggregate(AffiliateLink, :count), Repo.aggregate(Coupon, :count)}

      for {query, variables, root, entity} <- [
            {upsert_network_mutation(), %{"input" => %{"name" => "Denied Network"}},
             "upsertAffiliateNetwork", "network"},
            {upsert_program_mutation(),
             %{"input" => %{"affiliateNetworkId" => network_id, "merchantId" => merchant_id}},
             "upsertAffiliateProgram", "program"},
            {upsert_link_mutation(),
             %{
               "input" => %{
                 "merchantProductId" => merchant_product_id,
                 "affiliateNetworkId" => network_id,
                 "originalUrl" => "https://merchant.example/item",
                 "affiliateUrl" => "https://affiliate.example/item"
               }
             }, "upsertAffiliateLink", "link"},
            {create_coupon_mutation(),
             %{
               "input" => %{
                 "merchantId" => merchant_id,
                 "code" => "DENIED",
                 "discountType" => "OTHER"
               }
             }, "createCoupon", "coupon"}
          ] do
        assert %{"data" => %{^root => %{^entity => nil, "errors" => [%{"code" => "FORBIDDEN"}]}}} =
                 graphql(member_conn, query, variables)
      end

      assert %{
               "data" => %{"activeCoupons" => nil},
               "errors" => [%{"extensions" => %{"code" => "FORBIDDEN"}} | _]
             } =
               graphql(member_conn, active_coupons_query(), %{
                 "input" => %{"merchantId" => merchant_id}
               })

      assert {Repo.aggregate(AffiliateNetwork, :count), Repo.aggregate(AffiliateProgram, :count),
              Repo.aggregate(AffiliateLink, :count), Repo.aggregate(Coupon, :count)} == baseline
    end

    test "affiliate mutations reject raw affiliate network IDs", %{conn: conn} do
      authed_conn = operator_conn(conn, :api_token)
      merchant = merchant_fixture()
      merchant_id = relay_id(:merchant, merchant.id)

      {:ok, existing_network} =
        Affiliate.upsert_network(%{name: "Raw Id Network #{System.unique_integer([:positive])}"})

      response =
        graphql(authed_conn, upsert_program_mutation(), %{
          "input" => %{
            "affiliateNetworkId" => existing_network.id,
            "merchantId" => merchant_id,
            "programCode" => "RAW-NETWORK-ID",
            "status" => "active"
          }
        })

      assert %{
               "data" => %{
                 "upsertAffiliateProgram" => %{
                   "program" => nil,
                   "errors" => [
                     %{
                       "code" => "INVALID_ID",
                       "field" => "affiliateNetworkId",
                       "message" => "invalid affiliate network id"
                     }
                   ]
                 }
               }
             } = response
    end

    test "affiliate mutations reject raw merchant IDs", %{conn: conn} do
      authed_conn = operator_conn(conn, :api_token)
      merchant = merchant_fixture()

      {:ok, existing_network} =
        Affiliate.upsert_network(%{name: "Raw Merchant Id #{System.unique_integer([:positive])}"})

      affiliate_network_id = relay_id(:affiliate_network, existing_network.id)

      response =
        graphql(authed_conn, upsert_program_mutation(), %{
          "input" => %{
            "affiliateNetworkId" => affiliate_network_id,
            "merchantId" => merchant.id,
            "programCode" => "RAW-MERCHANT-ID",
            "status" => "active"
          }
        })

      assert %{
               "data" => %{
                 "upsertAffiliateProgram" => %{
                   "program" => nil,
                   "errors" => [
                     %{
                       "code" => "INVALID_ID",
                       "field" => "merchantId",
                       "message" => "invalid merchant id"
                     }
                   ]
                 }
               }
             } = response
    end

    test "createCoupon returns validation errors for invalid discount shape", %{conn: conn} do
      authed_conn = operator_conn(conn, :api_token)
      merchant = merchant_fixture()
      merchant_id = relay_id(:merchant, merchant.id)

      response =
        graphql(authed_conn, create_coupon_mutation(), %{
          "input" => %{
            "merchantId" => merchant_id,
            "code" => "INVALID-SHAPE",
            "discountType" => "OTHER",
            "discountValue" => "10.00"
          }
        })

      assert %{
               "data" => %{
                 "createCoupon" => %{
                   "coupon" => nil,
                   "errors" => [
                     %{
                       "code" => "INVALID_ARGUMENT",
                       "field" => "discountValue",
                       "message" => "must be empty for other discounts"
                     }
                   ]
                 }
               }
             } = response
    end

    test "activeCoupons rejects invalid cursor input", %{conn: conn} do
      authed_conn = operator_conn(conn, :api_token)
      merchant = merchant_fixture()
      merchant_id = relay_id(:merchant, merchant.id)

      response =
        graphql(authed_conn, active_coupons_query(), %{
          "input" => %{"merchantId" => merchant_id, "first" => 10, "after" => "bad-cursor"}
        })

      assert %{
               "data" => %{"activeCoupons" => nil},
               "errors" => [%{"message" => "invalid cursor"} | _]
             } = response
    end

    test "activeCoupons rejects invalid first input", %{conn: conn} do
      authed_conn = operator_conn(conn, :api_token)
      merchant = merchant_fixture()
      merchant_id = relay_id(:merchant, merchant.id)

      response =
        graphql(authed_conn, active_coupons_query(), %{
          "input" => %{"merchantId" => merchant_id, "first" => -1}
        })

      assert %{
               "data" => %{"activeCoupons" => nil},
               "errors" => [%{"message" => "invalid first", "path" => ["activeCoupons"]} | _]
             } = response
    end

    test "activeCoupons rejects raw merchant IDs", %{conn: conn} do
      authed_conn = operator_conn(conn, :api_token)
      merchant = merchant_fixture()

      response =
        graphql(authed_conn, active_coupons_query(), %{
          "input" => %{"merchantId" => merchant.id}
        })

      assert %{
               "data" => %{"activeCoupons" => nil},
               "errors" => [%{"message" => "invalid merchant id"} | _]
             } = response
    end

    test "activeCoupons resolver honors string-key at input after ID normalization" do
      merchant = merchant_fixture()
      merchant_id = relay_id(:merchant, merchant.id)
      future_at = DateTime.utc_now() |> DateTime.add(3600, :second) |> DateTime.truncate(:second)
      code = "STRING-AT-#{System.unique_integer([:positive])}"

      {:ok, _coupon} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: code,
          discount_type: :other,
          valid_from: DateTime.add(future_at, -60, :second),
          valid_to: DateTime.add(future_at, 60, :second)
        })

      assert {:ok, %{coupons: %{edges: [%{node: %{code: ^code}}]}}} =
               Reads.active_coupons(
                 nil,
                 %{input: %{"merchant_id" => merchant_id, "at" => future_at, "first" => 10}},
                 %{context: %{current_user: operator_fixture()}}
               )
    end

    test "upsertAffiliateNetwork resolver honors string-key name input" do
      name = "String Key Network #{System.unique_integer([:positive])}"

      assert {:ok, %{network: %{name: ^name}, errors: []}} =
               Mutations.upsert_affiliate_network(
                 nil,
                 %{input: %{"name" => name}},
                 %{context: %{current_user: operator_fixture()}}
               )
    end

    test "upsertAffiliateProgram resolver normalizes string-key attrs after ID decoding" do
      merchant = merchant_fixture()
      {:ok, network} = Affiliate.upsert_network(%{name: "String Program Network"})

      assert {:ok, %{program: %{program_code: "DIRECT-PROGRAM", status: "active"}, errors: []}} =
               Mutations.upsert_affiliate_program(
                 nil,
                 %{
                   input: %{
                     "affiliate_network_id" => relay_id(:affiliate_network, network.id),
                     "merchant_id" => relay_id(:merchant, merchant.id),
                     "program_code" => "DIRECT-PROGRAM",
                     "status" => "active"
                   }
                 },
                 %{context: %{current_user: operator_fixture()}}
               )
    end

    test "upsertAffiliateProgram resolver rejects clearing the controlled status" do
      merchant = merchant_fixture()
      {:ok, network} = Affiliate.upsert_network(%{name: "Nullable Program Network"})

      assert {:ok, %{program: %{status: "active"}, errors: []}} =
               Mutations.upsert_affiliate_program(
                 nil,
                 %{
                   input: %{
                     "affiliate_network_id" => relay_id(:affiliate_network, network.id),
                     "merchant_id" => relay_id(:merchant, merchant.id),
                     "program_code" => "NULLABLE-PROGRAM",
                     "status" => "active"
                   }
                 },
                 %{context: %{current_user: operator_fixture()}}
               )

      assert {:ok,
              %{
                program: nil,
                errors: [
                  %{code: "INVALID_ARGUMENT", field: "status", message: "can't be blank"}
                ]
              }} =
               Mutations.upsert_affiliate_program(
                 nil,
                 %{
                   input: %{
                     "affiliate_network_id" => relay_id(:affiliate_network, network.id),
                     "merchant_id" => relay_id(:merchant, merchant.id),
                     "program_code" => "NULLABLE-PROGRAM",
                     "status" => nil
                   }
                 },
                 %{context: %{current_user: operator_fixture()}}
               )

      assert Affiliate.get_affiliate_program(
               Repo.get_by!(AffiliateProgram,
                 affiliate_network_id: network.id,
                 merchant_id: merchant.id
               ).id
             ).status == "active"
    end

    test "upsertAffiliateLink resolver preserves explicit nil attrs on conflict" do
      merchant = merchant_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant})
      {:ok, network} = Affiliate.upsert_network(%{name: "Nullable Link Network"})
      verified_at = DateTime.truncate(~U[2027-01-01 00:00:00Z], :microsecond)

      assert {:ok,
              %{
                link: %{affiliate_network_id: network_id, last_verified_at: created_verified_at},
                errors: []
              }} =
               Mutations.upsert_affiliate_link(
                 nil,
                 %{
                   input: %{
                     "merchant_product_id" => relay_id(:merchant_product, merchant_product.id),
                     "affiliate_network_id" => relay_id(:affiliate_network, network.id),
                     "original_url" => "https://merchant.example.com/product",
                     "affiliate_url" => "https://network.example.com/track",
                     "last_verified_at" => verified_at
                   }
                 },
                 %{context: %{current_user: operator_fixture()}}
               )

      assert network_id == network.id
      assert DateTime.compare(created_verified_at, verified_at) == :eq

      assert {:ok, %{link: %{affiliate_network_id: nil, last_verified_at: nil}, errors: []}} =
               Mutations.upsert_affiliate_link(
                 nil,
                 %{
                   input: %{
                     "merchant_product_id" => relay_id(:merchant_product, merchant_product.id),
                     "affiliate_network_id" => nil,
                     "original_url" => "https://merchant.example.com/product",
                     "affiliate_url" => "https://network.example.com/track",
                     "last_verified_at" => nil
                   }
                 },
                 %{context: %{current_user: operator_fixture()}}
               )
    end
  end

  defp assert_mutation_unauthorized(response, root_field, entity_field) do
    assert %{
             "data" => data
           } = response

    assert is_map(data)

    assert %{
             ^entity_field => nil,
             "errors" => [
               %{"code" => "UNAUTHENTICATED", "message" => "unauthorized", "field" => nil}
             ]
           } = Map.fetch!(data, root_field)
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

  defp upsert_network_mutation do
    """
    mutation UpsertAffiliateNetwork($input: UpsertAffiliateNetworkInput!) {
      upsertAffiliateNetwork(input: $input) {
        network {
          id
          name
        }
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp upsert_program_mutation do
    """
    mutation UpsertAffiliateProgram($input: UpsertAffiliateProgramInput!) {
      upsertAffiliateProgram(input: $input) {
        program {
          id
          affiliateNetworkId
          merchantId
          programCode
          status
        }
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp upsert_link_mutation do
    """
    mutation UpsertAffiliateLink($input: UpsertAffiliateLinkInput!) {
      upsertAffiliateLink(input: $input) {
        link {
          id
          merchantProductId
          affiliateNetworkId
          originalUrl
          affiliateUrl
          lastVerifiedAt
        }
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp create_coupon_mutation do
    """
    mutation CreateCoupon($input: CreateCouponInput!) {
      createCoupon(input: $input) {
        coupon {
          id
          merchantId
          affiliateNetworkId
          code
          discountType
          discountValue
          currency
        }
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp active_coupons_query do
    """
    query ActiveCoupons($input: ActiveCouponsInput!) {
      activeCoupons(input: $input) {
        coupons {
          edges {
            cursor
            node {
              id
              code
              discountType
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

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end
end
