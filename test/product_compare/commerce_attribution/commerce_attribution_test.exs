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
      assert Repo.aggregate(CommerceLink, :count, :id) == 1
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
      assert Repo.aggregate(CommerceConversion, :count, :id) == 1
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
end
