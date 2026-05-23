defmodule ProductCompare.CommerceAttributionTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.CommerceAttribution
  alias ProductCompare.CommerceAttribution.ImpactAdapter
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact

  describe "upsert_commerce_link/1" do
    test "converges duplicate destination rows with a nil affiliate program" do
      merchant = merchant_fixture()
      destination_url = "https://merchant.example.com/products/desk"

      {:ok, inserted} =
        CommerceAttribution.upsert_commerce_link(%{
          merchant_id: merchant.id,
          destination_url: destination_url,
          link_type: :affiliate,
          network: :impact,
          campaign_params: %{"utm_campaign" => "launch"},
          is_active: true
        })

      {:ok, updated} =
        CommerceAttribution.upsert_commerce_link(%{
          merchant_id: merchant.id,
          destination_url: destination_url,
          link_type: :affiliate,
          network: :awin,
          campaign_params: %{"utm_campaign" => "refresh"},
          is_active: false
        })

      assert updated.id == inserted.id
      assert updated.network == :awin
      assert updated.campaign_params == %{"utm_campaign" => "refresh"}
      assert updated.is_active == false

      {:ok, reactivated} =
        CommerceAttribution.upsert_commerce_link(%{
          merchant_id: merchant.id,
          destination_url: destination_url,
          link_type: :affiliate,
          network: nil,
          campaign_params: %{},
          is_active: true
        })

      assert reactivated.id == inserted.id
      assert reactivated.network == nil
      assert reactivated.campaign_params == %{}
      assert reactivated.is_active == true
      assert Repo.aggregate(CommerceLink, :count, :id) == 1
    end

    test "rejects redirect destinations without an http or https URL" do
      merchant = merchant_fixture()

      assert {:error, changeset} =
               CommerceAttribution.upsert_commerce_link(%{
                 merchant_id: merchant.id,
                 destination_url: "javascript:alert(1)",
                 link_type: :affiliate
               })

      assert "must be a valid http/https URL" in errors_on(changeset).destination_url
    end
  end

  describe "click sessions" do
    test "records a public click id and resolves the redirect destination" do
      commerce_link = commerce_link_fixture()
      click_id = Ecto.UUID.generate()

      {:ok, click_session} =
        CommerceAttribution.create_click_session(%{
          commerce_link_id: commerce_link.id,
          click_id: click_id,
          anonymous_id: "anon-123",
          source_surface: :web,
          referrer: "https://app.example.com/products/desk",
          user_agent_hash: "ua-hash",
          ip_hash: "ip-hash"
        })

      assert click_session.click_id == click_id
      assert click_session.source_surface == :web

      assert {:ok, commerce_link.destination_url} ==
               CommerceAttribution.redirect_destination(click_id)

      assert {:error, :not_found} ==
               CommerceAttribution.redirect_destination(Ecto.UUID.generate())
    end
  end

  describe "ImpactAdapter.ingest_action/1" do
    test "upserts conversions by network reference and resolves public click ids" do
      merchant_product = merchant_product_fixture()
      commerce_link = commerce_link_fixture(%{merchant_id: merchant_product.merchant_id})
      click_session = click_session_fixture(commerce_link)

      payload = %{
        "ActionId" => "impact-action-1",
        "ClickId" => click_session.click_id,
        "Status" => "PENDING",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "12.34",
        "EventDate" => "2026-05-20T12:00:00Z",
        "ReportingDate" => "2026-05-20T12:05:00Z",
        "MerchantProductId" => merchant_product.id
      }

      {:ok, inserted} = ImpactAdapter.ingest_action(payload)

      assert inserted.source_network == :impact
      assert inserted.network_conversion_ref == "impact-action-1"
      assert inserted.click_session_id == click_session.id
      assert inserted.public_click_id == click_session.click_id
      assert inserted.status == :pending
      assert inserted.attribution_confidence == :high
      assert inserted.merchant_product_id == merchant_product.id
      assert Decimal.equal?(inserted.order_amount, Decimal.new("129.99"))
      assert Decimal.equal?(inserted.commission_amount, Decimal.new("12.34"))

      {:ok, updated} =
        ImpactAdapter.ingest_action(%{
          payload
          | "Status" => "APPROVED",
            "Payout" => "15.00",
            "ReportingDate" => "2026-05-21T09:00:00Z"
        })

      assert updated.id == inserted.id
      assert updated.status == :approved
      assert Decimal.equal?(updated.commission_amount, Decimal.new("15.00"))
      assert updated.data_freshness_at == ~U[2026-05-21 09:00:00.000000Z]

      {:ok, reverted} =
        ImpactAdapter.ingest_action(%{
          payload
          | "Status" => "PENDING",
            "Payout" => "15.00",
            "ReportingDate" => "2026-05-21T10:00:00Z"
        })

      assert reverted.id == inserted.id
      assert reverted.status == :pending
      assert Repo.aggregate(CommerceConversion, :count, :id) == 1
    end

    test "preserves click attribution when follow-up payloads omit click ids" do
      commerce_link = commerce_link_fixture()
      click_session = click_session_fixture(commerce_link)

      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "ClickId" => click_session.click_id,
        "Status" => "PENDING",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "12.34",
        "ReportingDate" => "2026-05-20T12:05:00Z"
      }

      {:ok, inserted} = ImpactAdapter.ingest_action(payload)

      {:ok, updated} =
        payload
        |> Map.drop(["ClickId"])
        |> Map.merge(%{
          "Status" => "APPROVED",
          "Payout" => "15.00",
          "ReportingDate" => "2026-05-21T09:00:00Z"
        })
        |> ImpactAdapter.ingest_action()

      assert updated.id == inserted.id
      assert updated.status == :approved
      assert updated.click_session_id == click_session.id
      assert updated.public_click_id == click_session.click_id
      assert updated.attribution_confidence == :high
    end

    test "preserves status when follow-up payloads omit status" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "Status" => "APPROVED",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "15.00",
        "ReportingDate" => "2026-05-20T12:05:00Z"
      }

      {:ok, inserted} = ImpactAdapter.ingest_action(payload)

      {:ok, updated} =
        payload
        |> Map.drop(["Status"])
        |> Map.merge(%{
          "Payout" => "20.00",
          "ReportingDate" => "2026-05-21T09:00:00Z"
        })
        |> ImpactAdapter.ingest_action()

      assert updated.id == inserted.id
      assert updated.status == :approved
      assert Decimal.equal?(updated.commission_amount, Decimal.new("20.00"))
      assert updated.reported_at == ~U[2026-05-21 09:00:00.000000Z]
    end

    test "stores external click tokens without rejecting conversions" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "ClickId" => "impact-subid-123",
        "Status" => "PENDING",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "12.34",
        "ReportingDate" => "2026-05-20T12:05:00Z"
      }

      assert {:ok, conversion} = ImpactAdapter.ingest_action(payload)
      assert conversion.public_click_id == nil
      assert conversion.click_session_id == nil
      assert conversion.network_click_ref == "impact-subid-123"
      assert conversion.attribution_confidence == :unmatched
    end

    test "ignores stale follow-up payloads with older reported timestamps" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "Status" => "APPROVED",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "15.00",
        "ReportingDate" => "2026-05-21T09:00:00Z"
      }

      {:ok, inserted} = ImpactAdapter.ingest_action(payload)

      {:ok, stale_result} =
        ImpactAdapter.ingest_action(%{
          payload
          | "Status" => "PENDING",
            "Payout" => "1.00",
            "ReportingDate" => "2026-05-20T09:00:00Z"
        })

      assert stale_result.id == inserted.id
      assert stale_result.status == :approved
      assert Decimal.equal?(stale_result.commission_amount, Decimal.new("15.00"))
      assert stale_result.reported_at == ~U[2026-05-21 09:00:00.000000Z]
    end

    test "does not crash on malformed numeric payload fields" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "Status" => "PENDING",
        "Currency" => "USD",
        "SaleAmount" => "N/A",
        "Payout" => "",
        "ReportingDate" => "2026-05-20T12:05:00Z"
      }

      assert {:ok, conversion} = ImpactAdapter.ingest_action(payload)
      assert conversion.order_amount == nil
      assert conversion.commission_amount == nil
    end

    test "does not crash on unsupported optional payload field types" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "Status" => "PENDING",
        "Currency" => "USD",
        "SaleAmount" => %{"amount" => "129.99"},
        "Payout" => ["12.34"],
        "EventDate" => %{"timestamp" => "2026-05-20T12:00:00Z"},
        "ReportingDate" => "2026-05-20T12:05:00Z",
        "MerchantProductId" => %{"id" => 123}
      }

      assert {:ok, conversion} = ImpactAdapter.ingest_action(payload)
      assert conversion.order_amount == nil
      assert conversion.commission_amount == nil
      assert conversion.purchased_at == nil
      assert conversion.merchant_product_id == nil
    end

    test "returns a changeset error instead of crashing on unsupported required date types" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "Status" => "PENDING",
        "Currency" => "USD",
        "ReportingDate" => %{"timestamp" => "2026-05-20T12:05:00Z"}
      }

      assert {:error, changeset} = ImpactAdapter.ingest_action(payload)
      assert "can't be blank" in errors_on(changeset).reported_at
    end
  end

  describe "ingest_conversion/1" do
    test "updates status and attribution confidence back to schema defaults" do
      attrs = %{
        source_network: :impact,
        network_conversion_ref: "conversion-#{System.unique_integer([:positive])}",
        status: :approved,
        currency: "USD",
        attribution_confidence: :high,
        reported_at: ~U[2026-05-20 12:00:00.000000Z]
      }

      {:ok, inserted} = CommerceAttribution.ingest_conversion(attrs)

      {:ok, updated} =
        CommerceAttribution.ingest_conversion(%{
          attrs
          | status: :pending,
            attribution_confidence: :unmatched,
            reported_at: ~U[2026-05-21 12:00:00.000000Z]
        })

      assert updated.id == inserted.id
      assert updated.status == :pending
      assert updated.attribution_confidence == :unmatched
    end
  end

  describe "create_purchase_price_fact/1" do
    test "stores one price-paid fact per conversion" do
      conversion = conversion_fixture()

      {:ok, fact} =
        CommerceAttribution.create_purchase_price_fact(%{
          conversion_id: conversion.id,
          reported_paid_price: Decimal.new("129.99"),
          shipping_amount: Decimal.new("0.00"),
          tax_amount: Decimal.new("10.40"),
          discount_amount: Decimal.new("5.00"),
          currency: "usd"
        })

      assert fact.conversion_id == conversion.id
      assert fact.currency == "USD"
      assert Decimal.equal?(fact.reported_paid_price, Decimal.new("129.99"))

      assert {:error, changeset} =
               CommerceAttribution.create_purchase_price_fact(%{
                 conversion_id: conversion.id,
                 reported_paid_price: Decimal.new("120.00"),
                 currency: "USD"
               })

      assert "has already been taken" in errors_on(changeset).conversion_id
      assert Repo.aggregate(PurchasePriceFact, :count, :id) == 1
    end
  end

  describe "revenue dashboard summaries" do
    test "returns an empty JSON-ready dashboard contract" do
      assert CommerceAttribution.dashboard_revenue_summary() == %{
               "filters" => %{
                 "currency" => nil,
                 "from" => nil,
                 "merchant_id" => nil,
                 "network" => nil,
                 "product_id" => nil,
                 "to" => nil
               },
               "metrics" => %{
                 "average_paid_price" => nil,
                 "clicks" => 0,
                 "commission_revenue" => "0.00",
                 "conversions" => 0,
                 "currency" => nil,
                 "gross_order_value" => "0.00"
               },
               "suppression" => %{"suppressed" => false, "threshold" => 0}
             }
    end

    test "aggregates approved and paid conversions for merchant product and network summaries" do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: :impact})
      click_session = click_session_fixture(commerce_link)
      _unconverted_click_session = click_session_fixture(commerce_link)

      approved =
        conversion_fixture(%{
          click_session_id: click_session.id,
          public_click_id: click_session.click_id,
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
          source_network: :impact,
          merchant_id: merchant.id,
          product_id: product.id,
          merchant_product_id: merchant_product.id,
          status: :paid,
          order_amount: Decimal.new("180.00"),
          commission_amount: Decimal.new("18.00"),
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

      {:ok, _fact} =
        CommerceAttribution.create_purchase_price_fact(%{
          conversion_id: approved.id,
          reported_paid_price: Decimal.new("100.00"),
          currency: "USD"
        })

      {:ok, _fact} =
        CommerceAttribution.create_purchase_price_fact(%{
          conversion_id: paid.id,
          reported_paid_price: Decimal.new("200.00"),
          currency: "USD"
        })

      expected_metrics = %{
        "average_paid_price" => "150.00",
        "clicks" => 2,
        "commission_revenue" => "30.00",
        "conversions" => 2,
        "currency" => "USD",
        "gross_order_value" => "300.00"
      }

      assert %{"metrics" => ^expected_metrics} =
               CommerceAttribution.merchant_revenue_summary(merchant.id, network: :impact)

      assert %{"metrics" => %{"clicks" => 1, "conversions" => 2}} =
               CommerceAttribution.product_revenue_summary(product.id, network: :impact)

      assert %{"metrics" => ^expected_metrics} =
               CommerceAttribution.network_revenue_summary(:impact, merchant_id: merchant.id)
    end

    test "uses merchant product dimensions for adapter-ingested conversions" do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: :impact})
      click_session = click_session_fixture(commerce_link)

      {:ok, conversion} =
        ImpactAdapter.ingest_action(%{
          "ActionId" => "impact-summary-#{System.unique_integer([:positive])}",
          "ClickId" => click_session.click_id,
          "Status" => "APPROVED",
          "Currency" => "USD",
          "SaleAmount" => "75.00",
          "Payout" => "7.50",
          "ReportingDate" => "2026-05-21T12:00:00Z",
          "MerchantProductId" => merchant_product.id
        })

      {:ok, _fact} =
        CommerceAttribution.create_purchase_price_fact(%{
          conversion_id: conversion.id,
          reported_paid_price: Decimal.new("72.00"),
          currency: "USD"
        })

      expected_metrics = %{
        "average_paid_price" => "72.00",
        "clicks" => 1,
        "commission_revenue" => "7.50",
        "conversions" => 1,
        "currency" => "USD",
        "gross_order_value" => "75.00"
      }

      assert %{"metrics" => ^expected_metrics} =
               CommerceAttribution.merchant_revenue_summary(merchant.id)

      assert %{"metrics" => ^expected_metrics} =
               CommerceAttribution.product_revenue_summary(product.id)
    end

    test "requires a currency filter before aggregating mixed-currency money" do
      conversion_fixture(%{
        status: :approved,
        currency: "USD",
        order_amount: Decimal.new("100.00"),
        commission_amount: Decimal.new("10.00"),
        reported_at: ~U[2026-05-20 12:00:00.000000Z]
      })

      conversion_fixture(%{
        status: :approved,
        currency: "EUR",
        order_amount: Decimal.new("90.00"),
        commission_amount: Decimal.new("9.00"),
        reported_at: ~U[2026-05-20 13:00:00.000000Z]
      })

      {_error, queries} =
        capture_select_queries(fn ->
          assert_raise ArgumentError,
                       "revenue summary currency filter is required for mixed currencies",
                       fn -> CommerceAttribution.dashboard_revenue_summary() end
        end)

      currency_probe_query = Enum.find(queries, &currency_probe_query?/1)
      assert currency_probe_query
      assert String.contains?(String.upcase(currency_probe_query), "LIMIT")

      assert %{
               "filters" => %{"currency" => "USD"},
               "metrics" => %{
                 "commission_revenue" => "10.00",
                 "conversions" => 1,
                 "currency" => "USD",
                 "gross_order_value" => "100.00"
               }
             } = CommerceAttribution.dashboard_revenue_summary(currency: "usd")
    end

    test "counts network clicks from conversion source when the link has no network" do
      merchant = merchant_fixture()
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: nil})
      click_session = click_session_fixture(commerce_link)

      conversion_fixture(%{
        click_session_id: click_session.id,
        public_click_id: click_session.click_id,
        source_network: :impact,
        merchant_id: merchant.id,
        status: :approved,
        order_amount: Decimal.new("80.00"),
        commission_amount: Decimal.new("8.00"),
        reported_at: ~U[2026-05-21 12:00:00.000000Z]
      })

      assert %{
               "metrics" => %{
                 "clicks" => 1,
                 "conversions" => 1,
                 "currency" => "USD",
                 "gross_order_value" => "80.00"
               }
             } = CommerceAttribution.network_revenue_summary(:impact, merchant_id: merchant.id)
    end

    test "counts attributed clicks even when conversions are not revenue-statused" do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: nil})
      click_session = click_session_fixture(commerce_link)

      conversion_fixture(%{
        click_session_id: click_session.id,
        public_click_id: click_session.click_id,
        source_network: :impact,
        merchant_id: merchant.id,
        merchant_product_id: merchant_product.id,
        status: :pending,
        reported_at: ~U[2026-05-21 12:00:00.000000Z]
      })

      assert %{"metrics" => %{"clicks" => 1, "conversions" => 0, "currency" => nil}} =
               CommerceAttribution.network_revenue_summary(:impact, merchant_id: merchant.id)

      assert %{"metrics" => %{"clicks" => 1, "conversions" => 0, "currency" => nil}} =
               CommerceAttribution.product_revenue_summary(product.id)
    end

    test "filters conversion date ranges with inclusive UTC calendar boundaries" do
      merchant = merchant_fixture()

      conversion_fixture(%{
        merchant_id: merchant.id,
        status: :approved,
        order_amount: Decimal.new("42.00"),
        commission_amount: Decimal.new("4.20"),
        reported_at: ~U[2026-05-21 23:59:59.000000Z]
      })

      conversion_fixture(%{
        merchant_id: merchant.id,
        status: :approved,
        order_amount: Decimal.new("999.00"),
        commission_amount: Decimal.new("99.90"),
        reported_at: ~U[2026-05-22 00:00:00.000000Z]
      })

      assert %{
               "filters" => %{"from" => "2026-05-21", "to" => "2026-05-21"},
               "metrics" => %{
                 "commission_revenue" => "4.20",
                 "conversions" => 1,
                 "currency" => "USD",
                 "gross_order_value" => "42.00"
               }
             } =
               CommerceAttribution.dashboard_revenue_summary(%{
                 merchant_id: merchant.id,
                 from: ~D[2026-05-21],
                 to: ~D[2026-05-21]
               })
    end

    test "normalizes DateTime filters to UTC before extracting calendar dates" do
      merchant = merchant_fixture()

      conversion_fixture(%{
        merchant_id: merchant.id,
        status: :approved,
        order_amount: Decimal.new("31.00"),
        commission_amount: Decimal.new("3.10"),
        reported_at: ~U[2026-05-20 12:00:00.000000Z]
      })

      conversion_fixture(%{
        merchant_id: merchant.id,
        status: :approved,
        order_amount: Decimal.new("44.00"),
        commission_amount: Decimal.new("4.40"),
        reported_at: ~U[2026-05-21 04:00:00.000000Z]
      })

      assert %{
               "filters" => %{"from" => "2026-05-21"},
               "metrics" => %{
                 "commission_revenue" => "4.40",
                 "conversions" => 1,
                 "currency" => "USD",
                 "gross_order_value" => "44.00"
               }
             } =
               CommerceAttribution.dashboard_revenue_summary(%{
                 merchant_id: merchant.id,
                 from: pacific_datetime(2026, 5, 20, 20, 30, 0)
               })
    end

    test "rejects invalid summary identifiers, networks, and currencies" do
      oversized_id = 9_223_372_036_854_775_808

      assert_raise ArgumentError, "invalid revenue summary merchant_id", fn ->
        CommerceAttribution.dashboard_revenue_summary(merchant_id: 0)
      end

      assert_raise ArgumentError, "invalid revenue summary merchant_id", fn ->
        CommerceAttribution.dashboard_revenue_summary(merchant_id: oversized_id)
      end

      assert_raise ArgumentError, "invalid revenue summary product_id", fn ->
        CommerceAttribution.dashboard_revenue_summary(product_id: "not-an-id")
      end

      assert_raise ArgumentError, "invalid revenue summary network", fn ->
        CommerceAttribution.network_revenue_summary(:unknown_network)
      end

      assert_raise ArgumentError, "invalid revenue summary currency", fn ->
        CommerceAttribution.dashboard_revenue_summary(currency: "US")
      end
    end

    test "keeps low-volume dashboard results suppression-ready" do
      merchant = merchant_fixture()

      conversion_fixture(%{
        source_network: :impact,
        merchant_id: merchant.id,
        status: :approved,
        order_amount: Decimal.new("90.00"),
        commission_amount: Decimal.new("9.00"),
        reported_at: ~U[2026-05-21 12:00:00.000000Z]
      })

      assert CommerceAttribution.dashboard_revenue_summary(%{
               merchant_id: merchant.id,
               min_conversions: 2
             }) == %{
               "filters" => %{
                 "currency" => nil,
                 "from" => nil,
                 "merchant_id" => merchant.id,
                 "network" => nil,
                 "product_id" => nil,
                 "to" => nil
               },
               "metrics" => %{
                 "average_paid_price" => nil,
                 "clicks" => nil,
                 "commission_revenue" => nil,
                 "conversions" => nil,
                 "currency" => nil,
                 "gross_order_value" => nil
               },
               "suppression" => %{"suppressed" => true, "threshold" => 2}
             }
    end
  end

  defp conversion_fixture(attrs \\ %{}) do
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

  defp commerce_link_fixture(attrs \\ %{}) do
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

  defp merchant_product_fixture(attrs \\ %{}) do
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

  defp pacific_datetime(year, month, day, hour, minute, second) do
    %DateTime{
      calendar: Calendar.ISO,
      year: year,
      month: month,
      day: day,
      hour: hour,
      minute: minute,
      second: second,
      microsecond: {0, 6},
      std_offset: 3600,
      time_zone: "America/Los_Angeles",
      utc_offset: -28_800,
      zone_abbr: "PDT"
    }
  end

  defp capture_select_queries(fun) do
    handler_id = {__MODULE__, System.unique_integer([:positive])}
    ref = make_ref()
    test_pid = self()

    :ok =
      :telemetry.attach(
        handler_id,
        [:product_compare, :repo, :query],
        fn _event, _measurements, metadata, {pid, message_ref} ->
          if select_query?(metadata.query) do
            send(pid, {message_ref, metadata.query})
          end
        end,
        {test_pid, ref}
      )

    try do
      result = fun.()
      {result, drain_queries(ref, [])}
    after
      :telemetry.detach(handler_id)
    end
  end

  defp drain_queries(ref, acc) do
    receive do
      {^ref, query} -> drain_queries(ref, [query | acc])
    after
      0 -> Enum.reverse(acc)
    end
  end

  defp select_query?(query) when is_binary(query) do
    query
    |> String.trim_leading()
    |> String.upcase()
    |> String.starts_with?("SELECT")
  end

  defp currency_probe_query?(query) when is_binary(query) do
    String.contains?(query, "DISTINCT") and
      String.contains?(query, ~s("currency")) and
      String.contains?(query, ~s(FROM "commerce_conversions"))
  end
end
