defmodule ProductCompare.IngestionTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Specs.Source

  describe "resolve_merchant_identity/2" do
    test "creates a source-scoped merchant identity from a normalized listing" do
      source = source_fixture()
      observed_at = ~U[2026-05-23 15:00:00Z]

      listing =
        normalized_listing(%{
          merchant_identifier: "924501",
          merchant_name: "Trail Shop",
          merchant_domain: "trail.example",
          observed_at: observed_at
        })

      assert {:ok, identity} = Ingestion.resolve_merchant_identity(source, listing)

      assert identity.source_id == source.id
      assert identity.merchant_identifier == "924501"
      assert identity.merchant_name == "Trail Shop"
      assert identity.merchant_domain == "trail.example"
      assert DateTime.compare(identity.last_seen_at, observed_at) == :eq
      assert %Merchant{name: "Trail Shop", domain: "trail.example"} = identity.merchant
    end

    test "reuses the same identity and merchant when a merchant name drifts" do
      source = source_fixture()
      first_seen_at = ~U[2026-05-23 15:00:00Z]
      later_seen_at = ~U[2026-05-24 15:00:00Z]

      first_listing =
        normalized_listing(%{
          merchant_identifier: "924501",
          merchant_name: "Trail Shop",
          merchant_domain: "trail.example",
          observed_at: first_seen_at
        })

      updated_listing =
        normalized_listing(%{
          merchant_identifier: "924501",
          merchant_name: "Trail Shop Outlet",
          merchant_domain: "trail.example",
          observed_at: later_seen_at
        })

      assert {:ok, first_identity} = Ingestion.resolve_merchant_identity(source, first_listing)

      assert {:ok, updated_identity} =
               Ingestion.resolve_merchant_identity(source, updated_listing)

      assert updated_identity.id == first_identity.id
      assert updated_identity.merchant_id == first_identity.merchant_id
      assert updated_identity.merchant_name == "Trail Shop Outlet"
      assert updated_identity.merchant_domain == "trail.example"
      assert DateTime.compare(updated_identity.last_seen_at, later_seen_at) == :eq
      assert Repo.aggregate(MerchantSourceIdentity, :count, :id) == 1
      assert Repo.aggregate(Merchant, :count, :id) == 1
    end

    test "ignores older observations for an existing source identity" do
      source = source_fixture()
      first_seen_at = ~U[2026-05-23 15:00:00Z]
      older_seen_at = ~U[2026-05-22 15:00:00Z]

      first_listing =
        normalized_listing(%{
          merchant_identifier: "924501",
          merchant_name: "Trail Shop",
          merchant_domain: "trail.example",
          observed_at: first_seen_at
        })

      older_listing =
        normalized_listing(%{
          merchant_identifier: "924501",
          merchant_name: "Trail Shop Outlet",
          merchant_domain: "outlet.example",
          observed_at: older_seen_at
        })

      assert {:ok, first_identity} = Ingestion.resolve_merchant_identity(source, first_listing)

      assert {:ok, stale_identity} =
               Ingestion.resolve_merchant_identity(source, older_listing)

      assert stale_identity.id == first_identity.id
      assert stale_identity.merchant_id == first_identity.merchant_id
      assert stale_identity.merchant_name == "Trail Shop"
      assert stale_identity.merchant_domain == "trail.example"
      assert DateTime.compare(stale_identity.last_seen_at, first_seen_at) == :eq
      assert Repo.aggregate(MerchantSourceIdentity, :count, :id) == 1
      assert Repo.aggregate(Merchant, :count, :id) == 1
    end

    test "falls back to source identifiers when optional merchant metadata is absent" do
      source = source_fixture()

      listing =
        normalized_listing(%{
          merchant_identifier: "924501",
          merchant_name: nil,
          merchant_domain: nil,
          listing_url: "https://trail.example/products/acme-trail-shoe"
        })

      assert {:ok, identity} = Ingestion.resolve_merchant_identity(source, listing)

      assert identity.merchant_name == nil
      assert identity.merchant_domain == nil
      assert %Merchant{name: "924501", domain: "trail.example"} = identity.merchant
    end
  end

  defp source_fixture(attrs \\ %{}) do
    suffix = System.unique_integer([:positive])

    %Source{}
    |> Source.changeset(
      Map.merge(
        %{
          kind: "affiliate_feed",
          name: "CJ #{suffix}",
          domain: "cj.example"
        },
        attrs
      )
    )
    |> Repo.insert!()
  end

  defp normalized_listing(attrs) do
    struct!(
      NormalizedListing,
      Map.merge(
        %{
          source: :cj,
          external_product_id: "CJ-12345",
          merchant_identifier: "924501",
          product_title: "Acme Trail Running Shoe",
          brand_name: "Acme",
          gtin: "00012345678905",
          merchant_name: "Trail Shop",
          merchant_domain: "trail.example",
          listing_url: "https://trail.example/products/acme-trail-shoe",
          currency: "USD",
          amount: Decimal.new("129.99"),
          availability: :in_stock,
          observed_at: ~U[2026-05-23 15:00:00Z],
          raw_payload: %{}
        },
        attrs
      )
    )
  end
end
