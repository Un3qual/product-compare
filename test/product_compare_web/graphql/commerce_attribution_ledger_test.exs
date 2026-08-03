defmodule ProductCompareWeb.GraphQL.CommerceAttributionLedgerTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Affiliate
  alias ProductCompare.CommerceAttribution
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo

  @ledger_tables ~w(
    commerce_click_sessions
    commerce_links
    commerce_conversions
    merchant_products
    merchants
    products
    affiliate_programs
    affiliate_networks
  )a

  setup %{conn: conn} do
    {:ok, conn: operator_conn(conn), anonymous_conn: conn}
  end

  describe "/api/graphql commerce attribution click ledger" do
    test "rejects anonymous and member reads before attribution database work", %{
      conn: conn,
      anonymous_conn: anonymous_conn
    } do
      for {request_conn, expected_code} <- [
            {anonymous_conn, "UNAUTHENTICATED"},
            {member_conn(conn), "FORBIDDEN"}
          ] do
        {response, queries} =
          capture_select_queries(fn ->
            graphql(request_conn, ledger_query(), %{
              "input" => %{"network" => "not-a-network"},
              "first" => 1,
              "after" => "not-a-cursor"
            })
          end)

        assert %{
                 "data" => nil,
                 "errors" => [%{"extensions" => %{"code" => ^expected_code}} | _]
               } = response

        assert ledger_query_counts(queries) == empty_ledger_query_counts()
      end
    end

    test "returns a non-null empty connection and rejects malformed cursors", %{conn: conn} do
      assert %{
               "data" => %{
                 "commerceAttributionClicks" => %{
                   "edges" => [],
                   "pageInfo" => %{
                     "endCursor" => nil,
                     "hasNextPage" => false,
                     "hasPreviousPage" => false,
                     "startCursor" => nil
                   }
                 }
               }
             } = graphql(conn, ledger_query(), %{"first" => 10})

      assert %{
               "data" => nil,
               "errors" => [
                 %{"message" => "invalid cursor", "path" => ["commerceAttributionClicks"]}
                 | _
               ]
             } = graphql(conn, ledger_query(), %{"first" => 1, "after" => "not-a-cursor"})
    end

    test "orders newest first with an id tie-breaker and paginates forward", %{conn: conn} do
      merchant = merchant_fixture(%{name: "Ordered Merchant"})
      product = SpecsFixtures.product_fixture(%{name: "Ordered Product"})
      merchant_product = merchant_product_fixture(merchant, product)
      %{link: link} = commerce_link_fixture(merchant, "impact")

      first_tied =
        click_fixture(link, merchant_product, %{})
        |> set_click_inserted_at!(~U[2026-05-21 12:00:00.000000Z])

      second_tied =
        click_fixture(link, merchant_product, %{})
        |> set_click_inserted_at!(~U[2026-05-21 12:00:00.000000Z])

      older =
        click_fixture(link, merchant_product, %{})
        |> set_click_inserted_at!(~U[2026-05-20 12:00:00.000000Z])

      first_page = graphql(conn, ledger_query(), %{"first" => 2})

      assert %{
               "data" => %{
                 "commerceAttributionClicks" => %{
                   "edges" => [
                     %{"cursor" => first_cursor, "node" => %{"clickId" => second_click_id}},
                     %{"cursor" => second_cursor, "node" => %{"clickId" => first_click_id}}
                   ],
                   "pageInfo" => page_info
                 }
               }
             } = first_page

      assert page_info == %{
               "endCursor" => second_cursor,
               "hasNextPage" => true,
               "hasPreviousPage" => false,
               "startCursor" => first_cursor
             }

      assert second_click_id == second_tied.click_id
      assert first_click_id == first_tied.click_id

      assert %{
               "data" => %{
                 "commerceAttributionClicks" => %{
                   "edges" => [%{"node" => %{"clickId" => older_click_id}}],
                   "pageInfo" => %{
                     "hasNextPage" => false,
                     "hasPreviousPage" => true
                   }
                 }
               }
             } =
               graphql(conn, ledger_query(), %{
                 "first" => 2,
                 "after" => second_cursor
               })

      assert older_click_id == older.click_id
    end

    test "applies the shared merchant product network currency and date filters", %{conn: conn} do
      merchant = merchant_fixture(%{name: "Filtered Merchant"})
      product = SpecsFixtures.product_fixture(%{name: "Filtered Product"})
      merchant_product = merchant_product_fixture(merchant, product)
      %{link: link} = commerce_link_fixture(merchant, "partnerize")

      matching_click =
        click_fixture(link, merchant_product, %{})
        |> set_click_inserted_at!(~U[2026-05-21 12:00:00.000000Z])

      conversion_fixture(%{
        click: matching_click,
        source_network: "partnerize",
        currency: "USD",
        merchant: merchant,
        product: product,
        merchant_product: merchant_product
      })

      outside_date =
        click_fixture(link, merchant_product, %{})
        |> set_click_inserted_at!(~U[2026-05-19 12:00:00.000000Z])

      conversion_fixture(%{
        click: outside_date,
        source_network: "partnerize",
        currency: "USD",
        merchant: merchant,
        product: product,
        merchant_product: merchant_product
      })

      wrong_product = SpecsFixtures.product_fixture(%{name: "Other Product"})
      wrong_merchant_product = merchant_product_fixture(merchant, wrong_product)

      wrong_product_click =
        click_fixture(link, wrong_merchant_product, %{})
        |> set_click_inserted_at!(~U[2026-05-21 13:00:00.000000Z])

      conversion_fixture(%{
        click: wrong_product_click,
        source_network: "partnerize",
        currency: "USD",
        merchant: merchant,
        product: wrong_product,
        merchant_product: wrong_merchant_product
      })

      wrong_currency_click =
        click_fixture(link, merchant_product, %{})
        |> set_click_inserted_at!(~U[2026-05-21 14:00:00.000000Z])

      conversion_fixture(%{
        click: wrong_currency_click,
        source_network: "partnerize",
        currency: "EUR",
        merchant: merchant,
        product: product,
        merchant_product: merchant_product
      })

      %{link: wrong_network_link} = commerce_link_fixture(merchant, "awin")

      wrong_network_click =
        click_fixture(wrong_network_link, merchant_product, %{})
        |> set_click_inserted_at!(~U[2026-05-21 15:00:00.000000Z])

      conversion_fixture(%{
        click: wrong_network_click,
        source_network: "awin",
        currency: "USD",
        merchant: merchant,
        product: product,
        merchant_product: merchant_product
      })

      wrong_merchant = merchant_fixture(%{name: "Other Filtered Merchant"})
      wrong_merchant_product = merchant_product_fixture(wrong_merchant, product)
      %{link: wrong_merchant_link} = commerce_link_fixture(wrong_merchant, "partnerize")

      wrong_merchant_click =
        click_fixture(wrong_merchant_link, wrong_merchant_product, %{})
        |> set_click_inserted_at!(~U[2026-05-21 16:00:00.000000Z])

      conversion_fixture(%{
        click: wrong_merchant_click,
        source_network: "partnerize",
        currency: "USD",
        merchant: wrong_merchant,
        product: product,
        merchant_product: wrong_merchant_product
      })

      assert %{
               "data" => %{
                 "commerceAttributionClicks" => %{
                   "edges" => [%{"node" => %{"clickId" => click_id}}]
                 }
               }
             } =
               graphql(conn, ledger_query(), %{
                 "first" => 20,
                 "input" => %{
                   "merchantId" => relay_id(:merchant, merchant.id),
                   "productId" => relay_id(:product, product.id),
                   "network" => "PARTNERIZE",
                   "currency" => "usd",
                   "from" => "2026-05-20",
                   "to" => "2026-05-21"
                 }
               })

      assert click_id == matching_click.click_id
    end

    test "exposes user or anonymous identity, diagnostics, dimensions, and all matched conversions",
         %{
           conn: conn
         } do
      user = AccountsFixtures.user_fixture(%{email: "ledger-user@example.com"})
      merchant = merchant_fixture(%{name: "Ledger Merchant"})
      product = SpecsFixtures.product_fixture(%{name: "Ledger Product"})

      merchant_product =
        merchant_product_fixture(merchant, product, %{external_sku: "LEDGER-SKU"})

      %{link: link, network: network, program: program} =
        commerce_link_fixture(merchant, "impact")

      user_click =
        click_fixture(link, merchant_product, %{
          user_id: user.id,
          anonymous_id: nil,
          source_surface: :extension,
          referrer: "https://productcompare.example/products/ledger",
          user_agent: "Ledger Browser/1.0",
          ip_address: "203.0.113.17"
        })
        |> set_click_inserted_at!(~U[2026-05-22 14:00:00.000000Z])

      anonymous_click =
        click_fixture(link, merchant_product, %{
          anonymous_id: "anonymous-ledger-visitor",
          referrer: nil,
          user_agent: "Anonymous Browser/1.0",
          ip_address: "198.51.100.8"
        })
        |> set_click_inserted_at!(~U[2026-05-21 14:00:00.000000Z])

      first_conversion =
        conversion_fixture(%{
          click: user_click,
          source_network: "impact",
          network_conversion_ref: "impact-order-1",
          status: :approved,
          attribution_confidence: :high,
          currency: "USD",
          order_amount: "120.00",
          commission_amount: "12.00",
          purchased_at: ~U[2026-05-22 15:00:00.000000Z],
          reported_at: ~U[2026-05-22 16:00:00.000000Z],
          raw_payload: %{"secret" => "must-not-leak"}
        })

      second_conversion =
        conversion_fixture(%{
          click: user_click,
          source_network: "impact",
          network_conversion_ref: "impact-order-2",
          status: :paid,
          attribution_confidence: :low,
          currency: "USD",
          order_amount: "80.00",
          commission_amount: "8.00",
          purchased_at: ~U[2026-05-22 17:00:00.000000Z],
          reported_at: ~U[2026-05-22 18:00:00.000000Z],
          raw_payload: %{"access_token" => "must-not-leak"}
        })

      assert %{
               "data" => %{
                 "commerceAttributionClicks" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "clickId" => user_click_id,
                         "insertedAt" => "2026-05-22T14:00:00.000000Z",
                         "sourceSurface" => "EXTENSION",
                         "userId" => user_id,
                         "userEmail" => "ledger-user@example.com",
                         "anonymousId" => nil,
                         "referrer" => "https://productcompare.example/products/ledger",
                         "userAgent" => "Ledger Browser/1.0",
                         "ipAddress" => "203.0.113.17",
                         "merchantId" => merchant_id,
                         "merchantName" => "Ledger Merchant",
                         "productId" => product_id,
                         "productName" => "Ledger Product",
                         "merchantProductId" => merchant_product_id,
                         "merchantProductExternalSku" => "LEDGER-SKU",
                         "affiliateProgramId" => program_id,
                         "affiliateProgramCode" => nil,
                         "affiliateNetworkId" => network_id,
                         "affiliateNetworkCode" => "impact",
                         "affiliateNetworkName" => "Impact",
                         "linkType" => "AFFILIATE",
                         "matchedConversions" => matched_conversions
                       }
                     },
                     %{
                       "node" => %{
                         "clickId" => anonymous_click_id,
                         "userId" => nil,
                         "userEmail" => nil,
                         "anonymousId" => "anonymous-ledger-visitor",
                         "matchedConversions" => []
                       }
                     }
                   ]
                 }
               }
             } = graphql(conn, ledger_query(), %{"first" => 10})

      assert user_click_id == user_click.click_id
      assert anonymous_click_id == anonymous_click.click_id
      assert user_id == relay_id(:user, user.id)
      assert merchant_id == relay_id(:merchant, merchant.id)
      assert product_id == relay_id(:product, product.id)
      assert merchant_product_id == relay_id(:merchant_product, merchant_product.id)
      assert program_id == relay_id(:affiliate_program, program.id)
      assert network_id == relay_id(:affiliate_network, network.id)

      assert matched_conversions == [
               %{
                 "networkConversionRef" => second_conversion.network_conversion_ref,
                 "status" => "PAID",
                 "attributionConfidence" => "LOW",
                 "currency" => "USD",
                 "orderAmount" => "80.00",
                 "commissionAmount" => "8.00",
                 "purchasedAt" => "2026-05-22T17:00:00.000000Z",
                 "reportedAt" => "2026-05-22T18:00:00.000000Z"
               },
               %{
                 "networkConversionRef" => first_conversion.network_conversion_ref,
                 "status" => "APPROVED",
                 "attributionConfidence" => "HIGH",
                 "currency" => "USD",
                 "orderAmount" => "120.00",
                 "commissionAmount" => "12.00",
                 "purchasedAt" => "2026-05-22T15:00:00.000000Z",
                 "reportedAt" => "2026-05-22T16:00:00.000000Z"
               }
             ]
    end

    test "publishes only the approved click and conversion fields", %{conn: conn} do
      assert %{
               "data" => %{
                 "click" => %{"fields" => click_fields},
                 "conversion" => %{"fields" => conversion_fields}
               }
             } = graphql(conn, ledger_introspection_query(), %{})

      assert Enum.sort(Enum.map(click_fields, & &1["name"])) ==
               Enum.sort(~w(
                 affiliateNetworkCode affiliateNetworkId affiliateNetworkName
                 affiliateProgramCode affiliateProgramId anonymousId clickId insertedAt ipAddress
                 linkType matchedConversions merchantId merchantName merchantProductExternalSku
                 merchantProductId productId productName referrer sourceSurface userAgent userEmail userId
               ))

      assert Enum.sort(Enum.map(conversion_fields, & &1["name"])) ==
               Enum.sort(~w(
                 attributionConfidence commissionAmount currency networkConversionRef orderAmount
                 purchasedAt reportedAt status
               ))

      assert %{"errors" => errors} = graphql(conn, forbidden_fields_query(), %{})
      messages = Enum.map(errors, & &1["message"])

      for forbidden <- ~w(rawPayload destinationUrl campaignParams credentials) do
        assert Enum.any?(messages, &String.contains?(&1, ~s("#{forbidden}")))
      end
    end

    test "returns the stable filter error for invalid IDs dates currencies and networks", %{
      conn: conn
    } do
      for input <- [
            %{"merchantId" => relay_id(:product, 1)},
            %{"productId" => "not-a-global-id"},
            %{"from" => "not-a-date"},
            %{"currency" => "US"},
            %{"network" => "unknown-ledger-network"}
          ] do
        assert %{
                 "data" => nil,
                 "errors" => [
                   %{
                     "message" => "invalid commerce attribution click filters",
                     "path" => ["commerceAttributionClicks"]
                   }
                   | _
                 ]
               } = graphql(conn, ledger_query(), %{"input" => input, "first" => 10})
      end
    end
  end

  defp ledger_query do
    """
    query CommerceAttributionClicks(
      $input: RevenueSummaryInput
      $first: Int!
      $after: String
    ) {
      commerceAttributionClicks(input: $input, first: $first, after: $after) {
        edges {
          cursor
          node {
            clickId
            insertedAt
            sourceSurface
            userId
            userEmail
            anonymousId
            referrer
            userAgent
            ipAddress
            merchantId
            merchantName
            productId
            productName
            merchantProductId
            merchantProductExternalSku
            affiliateProgramId
            affiliateProgramCode
            affiliateNetworkId
            affiliateNetworkCode
            affiliateNetworkName
            linkType
            matchedConversions {
              networkConversionRef
              status
              attributionConfidence
              currency
              orderAmount
              commissionAmount
              purchasedAt
              reportedAt
            }
          }
        }
        pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
      }
    }
    """
  end

  defp ledger_introspection_query do
    """
    query CommerceAttributionLedgerSchema {
      click: __type(name: "CommerceAttributionClick") { fields { name } }
      conversion: __type(name: "CommerceAttributionMatchedConversion") { fields { name } }
    }
    """
  end

  defp forbidden_fields_query do
    """
    query ForbiddenCommerceAttributionLedgerFields {
      commerceAttributionClicks(first: 1) {
        edges {
          node {
            destinationUrl
            campaignParams
            credentials
            matchedConversions { rawPayload }
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

  defp merchant_fixture(attrs) do
    suffix = System.unique_integer([:positive])

    {:ok, merchant} =
      attrs
      |> Map.put_new(:domain, "ledger-merchant-#{suffix}.example.com")
      |> Map.put_new(:name, "Ledger Merchant #{suffix}")
      |> Pricing.upsert_merchant()

    merchant
  end

  defp merchant_product_fixture(merchant, product, attrs \\ %{}) do
    suffix = System.unique_integer([:positive])

    {:ok, merchant_product} =
      attrs
      |> Map.put(:merchant_id, merchant.id)
      |> Map.put(:product_id, product.id)
      |> Map.put_new(:url, "https://#{merchant.domain}/products/#{suffix}")
      |> Map.put_new(:currency, "USD")
      |> Map.put_new(:external_sku, "ledger-sku-#{suffix}")
      |> Map.put_new(:is_active, true)
      |> Pricing.upsert_merchant_product()

    merchant_product
  end

  defp commerce_link_fixture(merchant, network_code) do
    network_name = network_code |> String.split("_") |> Enum.map_join(" ", &String.capitalize/1)

    {:ok, network} = Affiliate.upsert_network(%{code: network_code, name: network_name})

    {:ok, program} =
      Affiliate.upsert_program(%{
        affiliate_network_id: network.id,
        merchant_id: merchant.id
      })

    {:ok, link} =
      CommerceAttribution.upsert_commerce_link(%{
        merchant_id: merchant.id,
        affiliate_program_id: program.id,
        destination_url:
          "https://#{merchant.domain}/out/#{System.unique_integer([:positive])}?token=hidden",
        campaign_params: %{"secret" => "hidden"},
        link_type: :affiliate
      })

    %{link: link, network: network, program: program}
  end

  defp click_fixture(link, merchant_product, attrs) do
    params =
      attrs
      |> Map.put(:commerce_link_id, link.id)
      |> Map.put(:merchant_product_id, merchant_product.id)
      |> Map.put_new(:click_id, Ecto.UUID.generate())
      |> Map.put_new(:anonymous_id, "ledger-anonymous-#{System.unique_integer([:positive])}")
      |> Map.put_new(:source_surface, :web)

    {:ok, click} = CommerceAttribution.create_click_session(params)
    click
  end

  defp conversion_fixture(attrs) do
    click = Map.fetch!(attrs, :click)
    source_network = Map.fetch!(attrs, :source_network)

    params =
      attrs
      |> Map.drop([:click, :merchant, :product, :merchant_product])
      |> Map.put(:click_session_id, click.id)
      |> Map.put(:public_click_id, click.click_id)
      |> Map.put_new(
        :network_conversion_ref,
        "ledger-conversion-#{System.unique_integer([:positive])}"
      )
      |> Map.put_new(:status, :approved)
      |> Map.put_new(:currency, "USD")
      |> Map.update(:order_amount, Decimal.new("100.00"), &Decimal.new/1)
      |> Map.update(:commission_amount, Decimal.new("10.00"), &Decimal.new/1)
      |> Map.put_new(:attribution_confidence, :high)
      |> Map.put_new(:reported_at, ~U[2026-05-22 12:00:00.000000Z])
      |> maybe_put_id(:merchant_id, Map.get(attrs, :merchant))
      |> maybe_put_id(:product_id, Map.get(attrs, :product))
      |> maybe_put_id(:merchant_product_id, Map.get(attrs, :merchant_product))
      |> Map.put(:source_network, source_network)

    {:ok, conversion} = CommerceAttribution.ingest_conversion(params)
    conversion
  end

  defp maybe_put_id(attrs, _field, nil), do: attrs
  defp maybe_put_id(attrs, field, record), do: Map.put(attrs, field, record.id)

  defp set_click_inserted_at!(click, inserted_at) do
    click
    |> Ecto.Changeset.change(inserted_at: inserted_at, updated_at: inserted_at)
    |> Repo.update!()
  end

  defp ledger_query_counts(queries) do
    Enum.into(@ledger_tables, %{}, fn table ->
      {table, Enum.count(queries, &String.contains?(&1, ~s(FROM "#{table}")))}
    end)
  end

  defp empty_ledger_query_counts do
    Map.new(@ledger_tables, &{&1, 0})
  end
end
