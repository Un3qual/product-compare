defmodule ProductCompareWeb.GraphQL.CommerceRevenueSummaryTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.CommerceAttribution
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo

  setup %{conn: conn} do
    {:ok, conn: operator_conn(conn), anonymous_conn: conn}
  end

  describe "/api/graphql commerce revenue summary" do
    test "requires authentication and rejects authenticated members", %{
      conn: conn,
      anonymous_conn: anonymous_conn
    } do
      assert %{
               "data" => %{"revenueSummary" => nil},
               "errors" => [%{"extensions" => %{"code" => "UNAUTHENTICATED"}} | _]
             } = graphql(anonymous_conn, revenue_summary_query(), %{})

      assert %{
               "data" => %{"revenueSummary" => nil},
               "errors" => [%{"extensions" => %{"code" => "FORBIDDEN"}} | _]
             } = graphql(member_conn(conn), revenue_summary_query(), %{})
    end

    test "returns an empty dashboard summary shape", %{conn: conn} do
      assert %{
               "data" => %{
                 "revenueSummary" => %{
                   "filters" => %{
                     "currency" => nil,
                     "from" => nil,
                     "merchantId" => nil,
                     "network" => nil,
                     "productId" => nil,
                     "to" => nil
                   },
                   "metrics" => %{
                     "averagePaidPrice" => nil,
                     "clicks" => nil,
                     "commissionRevenue" => nil,
                     "conversions" => nil,
                     "currency" => nil,
                     "grossOrderValue" => nil
                   },
                   "suppression" => %{
                     "suppressed" => true,
                     "threshold" => 2
                   }
                 }
               }
             } = graphql(conn, revenue_summary_query(), %{})
    end

    test "aggregates approved and paid conversions with Relay ID filters", %{conn: conn} do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: :impact})

      first_click_session =
        commerce_link
        |> click_session_fixture()
        |> set_click_session_inserted_at!(~U[2026-05-20 12:00:00.000000Z])

      second_click_session =
        commerce_link
        |> click_session_fixture()
        |> set_click_session_inserted_at!(~U[2026-05-21 12:00:00.000000Z])

      approved =
        conversion_fixture(%{
          click_session_id: first_click_session.id,
          public_click_id: first_click_session.click_id,
          source_network: :impact,
          merchant_id: merchant.id,
          product_id: product.id,
          merchant_product_id: merchant_product.id,
          status: :approved,
          order_amount: Decimal.new("120.00"),
          commission_amount: Decimal.new("12.00"),
          reported_at: ~U[2026-05-20 12:00:00.000000Z]
        })

      paid =
        conversion_fixture(%{
          click_session_id: second_click_session.id,
          public_click_id: second_click_session.click_id,
          source_network: :impact,
          merchant_id: merchant.id,
          product_id: product.id,
          merchant_product_id: merchant_product.id,
          status: :paid,
          order_amount: Decimal.new("80.00"),
          commission_amount: Decimal.new("8.00"),
          reported_at: ~U[2026-05-21 12:00:00.000000Z]
        })

      _pending =
        conversion_fixture(%{
          source_network: :impact,
          merchant_id: merchant.id,
          product_id: product.id,
          status: :pending,
          order_amount: Decimal.new("999.00"),
          commission_amount: Decimal.new("99.00"),
          reported_at: ~U[2026-05-21 13:00:00.000000Z]
        })

      create_purchase_price_fact!(approved, "100.00")
      create_purchase_price_fact!(paid, "60.00")

      merchant_id = relay_id(:merchant, merchant.id)
      product_id = relay_id(:product, product.id)

      assert %{
               "data" => %{
                 "revenueSummary" => %{
                   "filters" => %{
                     "currency" => "USD",
                     "from" => "2026-05-20",
                     "merchantId" => ^merchant_id,
                     "network" => "impact",
                     "productId" => ^product_id,
                     "to" => "2026-05-21"
                   },
                   "metrics" => %{
                     "averagePaidPrice" => "80.00",
                     "clicks" => 2,
                     "commissionRevenue" => "20.00",
                     "conversions" => 2,
                     "currency" => "USD",
                     "grossOrderValue" => "200.00"
                   },
                   "suppression" => %{
                     "suppressed" => false,
                     "threshold" => 2
                   }
                 }
               }
             } =
               graphql(conn, revenue_summary_query(), %{
                 "input" => %{
                   "currency" => "usd",
                   "from" => "2026-05-20",
                   "merchantId" => merchant_id,
                   "network" => "impact",
                   "productId" => product_id,
                   "to" => "2026-05-21"
                 }
               })
    end

    test "enforces low-volume suppression without client-controlled thresholds", %{conn: conn} do
      merchant = merchant_fixture()

      conversion_fixture(%{
        source_network: :impact,
        merchant_id: merchant.id,
        status: :approved,
        order_amount: Decimal.new("90.00"),
        commission_amount: Decimal.new("9.00"),
        reported_at: ~U[2026-05-21 12:00:00.000000Z]
      })

      assert %{
               "data" => %{
                 "revenueSummary" => %{
                   "metrics" => %{
                     "averagePaidPrice" => nil,
                     "clicks" => nil,
                     "commissionRevenue" => nil,
                     "conversions" => nil,
                     "currency" => nil,
                     "grossOrderValue" => nil
                   },
                   "suppression" => %{
                     "suppressed" => true,
                     "threshold" => 2
                   }
                 }
               }
             } =
               graphql(conn, revenue_summary_query(), %{
                 "input" => %{
                   "merchantId" => relay_id(:merchant, merchant.id)
                 }
               })
    end

    test "returns GraphQL errors for invalid merchant and product IDs", %{conn: conn} do
      assert %{
               "data" => %{"revenueSummary" => nil},
               "errors" => [
                 %{"message" => "invalid revenue summary filters", "path" => ["revenueSummary"]}
                 | _
               ]
             } =
               graphql(conn, revenue_summary_query(), %{
                 "input" => %{
                   "merchantId" => relay_id(:product, 123)
                 }
               })

      assert %{
               "data" => %{"revenueSummary" => nil},
               "errors" => [
                 %{"message" => "invalid revenue summary filters", "path" => ["revenueSummary"]}
                 | _
               ]
             } =
               graphql(conn, revenue_summary_query(), %{
                 "input" => %{
                   "productId" => "not-a-global-id"
                 }
               })
    end

    test "returns stable GraphQL errors for invalid scalar filters", %{conn: conn} do
      for input <- [
            %{"from" => "not-a-date"},
            %{"currency" => "US"},
            %{"network" => "unknown-network"}
          ] do
        assert %{
                 "data" => %{"revenueSummary" => nil},
                 "errors" => [
                   %{"message" => "invalid revenue summary filters", "path" => ["revenueSummary"]}
                   | _
                 ]
               } = graphql(conn, revenue_summary_query(), %{"input" => input})
      end
    end
  end

  defp revenue_summary_query do
    """
    query RevenueSummary($input: RevenueSummaryInput) {
      revenueSummary(input: $input) {
        filters {
          currency
          from
          merchantId
          network
          productId
          to
        }
        metrics {
          averagePaidPrice
          clicks
          commissionRevenue
          conversions
          currency
          grossOrderValue
        }
        suppression {
          suppressed
          threshold
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

  defp conversion_fixture(attrs) do
    {:ok, conversion} =
      attrs
      |> Map.put_new(:source_network, :impact)
      |> Map.put_new(:network_conversion_ref, "conversion-#{System.unique_integer([:positive])}")
      |> Map.put_new(:status, :pending)
      |> Map.put_new(:currency, "USD")
      |> Map.put_new(:order_amount, Decimal.new("100.00"))
      |> Map.put_new(:commission_amount, Decimal.new("10.00"))
      |> Map.put_new(:attribution_confidence, :unmatched)
      |> Map.put_new(:reported_at, ~U[2026-05-20 12:00:00.000000Z])
      |> CommerceAttribution.ingest_conversion()

    conversion
  end

  defp click_session_fixture(commerce_link) do
    {:ok, click_session} =
      CommerceAttribution.create_click_session(%{
        commerce_link_id: commerce_link.id,
        click_id: Ecto.UUID.generate(),
        anonymous_id: "anon-#{System.unique_integer([:positive])}",
        source_surface: :web
      })

    click_session
  end

  defp commerce_link_fixture(attrs) do
    merchant = Map.get(attrs, :merchant, merchant_fixture())
    suffix = System.unique_integer([:positive])

    {:ok, commerce_link} =
      attrs
      |> Map.drop([:merchant])
      |> Map.put_new(:merchant_id, merchant.id)
      |> Map.put_new(:destination_url, "https://merchant.example.com/products/#{suffix}")
      |> Map.put_new(:link_type, :affiliate)
      |> Map.put_new(:network, :impact)
      |> CommerceAttribution.upsert_commerce_link()

    commerce_link
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

  defp set_click_session_inserted_at!(click_session, inserted_at) do
    click_session
    |> Ecto.Changeset.change(inserted_at: inserted_at, updated_at: inserted_at)
    |> Repo.update!()
  end

  defp create_purchase_price_fact!(conversion, reported_paid_price) do
    {:ok, fact} =
      CommerceAttribution.create_purchase_price_fact(%{
        conversion_id: conversion.id,
        reported_paid_price: Decimal.new(reported_paid_price),
        currency: conversion.currency
      })

    fact
  end
end
