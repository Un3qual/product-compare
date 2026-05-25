defmodule ProductCompare.IngestionTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.ExternalProduct
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

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

    test "retargets an identity when newer merchant metadata matches another merchant" do
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

      {:ok, other_merchant} =
        Pricing.upsert_merchant(%{
          name: "Trail Shop Outlet",
          domain: "outlet.example"
        })

      updated_listing =
        normalized_listing(%{
          merchant_identifier: "924501",
          merchant_name: "Trail Shop Outlet",
          merchant_domain: "outlet.example",
          observed_at: later_seen_at
        })

      assert {:ok, first_identity} = Ingestion.resolve_merchant_identity(source, first_listing)

      assert {:ok, updated_identity} =
               Ingestion.resolve_merchant_identity(source, updated_listing)

      assert updated_identity.id == first_identity.id
      assert updated_identity.merchant_id == other_merchant.id
      assert updated_identity.merchant_name == "Trail Shop Outlet"
      assert updated_identity.merchant_domain == "outlet.example"
      assert DateTime.compare(updated_identity.last_seen_at, later_seen_at) == :eq

      assert %Merchant{id: merchant_id, name: "Trail Shop Outlet", domain: "outlet.example"} =
               updated_identity.merchant

      assert merchant_id == other_merchant.id
      assert Repo.aggregate(MerchantSourceIdentity, :count, :id) == 1
      assert Repo.aggregate(Merchant, :count, :id) == 2
    end
  end

  describe "persist_normalized_listing/2" do
    test "persists a normalized listing into artifact, external product, merchant product, and price point rows" do
      source = source_fixture()
      observed_at = ~U[2026-05-24 15:00:00Z]

      listing =
        normalized_listing(%{
          external_product_id: "CJ-12345",
          listing_url: "https://trail.example/products/acme-trail-shoe",
          currency: "usd",
          amount: Decimal.new("129.99"),
          observed_at: observed_at,
          raw_payload: %{"id" => "CJ-12345", "price" => "129.99"}
        })

      assert {:ok, persisted} = Ingestion.persist_normalized_listing(source, listing)

      assert persisted.source_artifact.source_id == source.id
      assert persisted.source_artifact.url == listing.listing_url
      assert persisted.source_artifact.raw_json == listing.raw_payload
      assert DateTime.compare(persisted.source_artifact.fetched_at, observed_at) == :eq

      assert persisted.external_product.source_id == source.id
      assert persisted.external_product.external_id == "CJ-12345"
      assert persisted.external_product.canonical_url == listing.listing_url
      assert persisted.external_product.product_id == persisted.product.id
      assert DateTime.compare(persisted.external_product.last_seen_at, observed_at) == :eq

      assert persisted.product.name == "Acme Trail Running Shoe"

      assert persisted.merchant_product.merchant_id == persisted.merchant_identity.merchant_id
      assert persisted.merchant_product.product_id == persisted.product.id
      assert persisted.merchant_product.external_sku == "CJ-12345"
      assert persisted.merchant_product.url == listing.listing_url
      assert persisted.merchant_product.currency == "USD"
      assert persisted.merchant_product.is_active == true
      assert DateTime.compare(persisted.merchant_product.last_seen_at, observed_at) == :eq

      assert persisted.price_point.merchant_product_id == persisted.merchant_product.id
      assert persisted.price_point.artifact_id == persisted.source_artifact.id
      assert Decimal.eq?(persisted.price_point.price, Decimal.new("129.99"))
      assert persisted.price_point.in_stock == true
      assert DateTime.compare(persisted.price_point.observed_at, observed_at) == :eq

      assert Repo.aggregate(SourceArtifact, :count, :id) == 1
      assert Repo.aggregate(ExternalProduct, :count, :id) == 1
      assert Repo.aggregate(MerchantProduct, :count, :id) == 1
      assert Repo.aggregate(PricePoint, :count, :id) == 1
    end

    test "replays the same normalized listing without duplicating persistence rows" do
      source = source_fixture()
      listing = normalized_listing(%{raw_payload: %{"id" => "CJ-12345", "price" => "129.99"}})

      assert {:ok, first_persisted} = Ingestion.persist_normalized_listing(source, listing)
      assert {:ok, second_persisted} = Ingestion.persist_normalized_listing(source, listing)

      assert second_persisted.source_artifact.id == first_persisted.source_artifact.id
      assert second_persisted.external_product.id == first_persisted.external_product.id
      assert second_persisted.product.id == first_persisted.product.id
      assert second_persisted.merchant_identity.id == first_persisted.merchant_identity.id
      assert second_persisted.merchant_product.id == first_persisted.merchant_product.id
      assert second_persisted.price_point.id == first_persisted.price_point.id

      assert Repo.aggregate(SourceArtifact, :count, :id) == 1
      assert Repo.aggregate(ExternalProduct, :count, :id) == 1
      assert Repo.aggregate(MerchantSourceIdentity, :count, :id) == 1
      assert Repo.aggregate(MerchantProduct, :count, :id) == 1
      assert Repo.aggregate(PricePoint, :count, :id) == 1
    end

    test "stores a stable replay content hash from canonical listing fields" do
      source = source_fixture()

      listing =
        normalized_listing(%{
          raw_payload: %{
            "price" => "129.99",
            "nested" => %{"b" => ["two", false, nil], "a" => 1},
            "id" => "CJ-12345"
          }
        })

      assert {:ok, persisted} = Ingestion.persist_normalized_listing(source, listing)

      assert persisted.source_artifact.content_hash ==
               "7ebf63b3d013b44178147b191378c5b137df0bc1aab99893832458fc390f4bb4"
    end

    test "does not let stale observations overwrite merchant products or add older price points" do
      source = source_fixture()
      current_observed_at = ~U[2026-05-24 15:00:00Z]
      stale_observed_at = ~U[2026-05-23 15:00:00Z]

      current_listing =
        normalized_listing(%{
          amount: Decimal.new("129.99"),
          availability: :in_stock,
          observed_at: current_observed_at,
          raw_payload: %{"id" => "CJ-12345", "price" => "129.99"}
        })

      stale_listing =
        normalized_listing(%{
          amount: Decimal.new("89.99"),
          availability: :out_of_stock,
          observed_at: stale_observed_at,
          raw_payload: %{"id" => "CJ-12345", "price" => "89.99"}
        })

      assert {:ok, current_persisted} =
               Ingestion.persist_normalized_listing(source, current_listing)

      assert {:ok, stale_persisted} = Ingestion.persist_normalized_listing(source, stale_listing)

      assert stale_persisted.merchant_product.id == current_persisted.merchant_product.id
      assert stale_persisted.merchant_product.is_active == true

      assert DateTime.compare(
               stale_persisted.merchant_product.last_seen_at,
               current_observed_at
             ) == :eq

      assert stale_persisted.price_point.id == current_persisted.price_point.id
      assert Decimal.eq?(stale_persisted.price_point.price, Decimal.new("129.99"))
      assert Repo.aggregate(PricePoint, :count, :id) == 1
    end

    test "does not retarget an existing merchant product when a listing URL is reused" do
      source = source_fixture()
      reused_url = "https://trail.example/products/reused"

      original_listing =
        normalized_listing(%{
          external_product_id: "CJ-ORIGINAL",
          product_title: "Acme Trail Running Shoe",
          listing_url: reused_url,
          raw_payload: %{"id" => "CJ-ORIGINAL", "price" => "129.99"}
        })

      reused_listing =
        normalized_listing(%{
          external_product_id: "CJ-REUSED",
          product_title: "Different Trail Running Shoe",
          listing_url: reused_url,
          observed_at: ~U[2026-05-24 15:00:00Z],
          raw_payload: %{"id" => "CJ-REUSED", "price" => "139.99"}
        })

      assert {:ok, original_persisted} =
               Ingestion.persist_normalized_listing(source, original_listing)

      assert {:error,
              {:merchant_product_product_conflict, merchant_product_id, existing_product_id,
               new_product_id}} =
               Ingestion.persist_normalized_listing(source, reused_listing)

      assert merchant_product_id == original_persisted.merchant_product.id
      assert existing_product_id == original_persisted.product.id
      refute new_product_id == existing_product_id

      merchant_product = Repo.get!(MerchantProduct, merchant_product_id)

      assert merchant_product.product_id == original_persisted.product.id
      assert merchant_product.external_sku == "CJ-ORIGINAL"
      assert Repo.aggregate(ExternalProduct, :count, :id) == 1
      assert Repo.aggregate(MerchantProduct, :count, :id) == 1
      assert Repo.aggregate(PricePoint, :count, :id) == 1
    end

    test "rolls back merchant identity updates when listing persistence fails" do
      source = source_fixture()
      current_observed_at = ~U[2026-05-24 15:00:00Z]
      failed_observed_at = ~U[2026-05-25 15:00:00Z]

      current_listing =
        normalized_listing(%{
          observed_at: current_observed_at,
          raw_payload: %{"id" => "CJ-12345", "price" => "129.99"}
        })

      failed_listing =
        normalized_listing(%{
          external_product_id: "CJ-BROKEN",
          product_title: nil,
          merchant_name: "Trail Shop Outlet",
          merchant_domain: "outlet.example",
          listing_url: "https://trail.example/products/broken",
          observed_at: failed_observed_at,
          raw_payload: %{"id" => "CJ-12345", "price" => "139.99"}
        })

      assert {:ok, current_persisted} =
               Ingestion.persist_normalized_listing(source, current_listing)

      assert {:error, %Ecto.Changeset{}} =
               Ingestion.persist_normalized_listing(source, failed_listing)

      identity = Repo.get!(MerchantSourceIdentity, current_persisted.merchant_identity.id)

      assert identity.merchant_name == "Trail Shop"
      assert identity.merchant_domain == "trail.example"
      assert DateTime.compare(identity.last_seen_at, current_observed_at) == :eq

      assert Repo.aggregate(SourceArtifact, :count, :id) == 1
      assert Repo.aggregate(ExternalProduct, :count, :id) == 1
      assert Repo.aggregate(MerchantProduct, :count, :id) == 1
      assert Repo.aggregate(PricePoint, :count, :id) == 1
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
