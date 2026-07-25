defmodule ProductCompare.IngestionTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Catalog
  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductIdentifier
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
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

  describe "import run observability" do
    test "starts and completes a source-scoped import run" do
      source = source_fixture()
      started_at = ~U[2026-06-04 19:10:00Z]
      finished_at = ~U[2026-06-04 19:10:05Z]

      assert {:ok, %ImportRun{} = run} =
               Ingestion.start_import_run(%{
                 source_id: source.id,
                 provider: "cj",
                 surface: "shoppingProducts",
                 query: %{"keywords" => ["shoe"], "limit" => 2},
                 cursor_start: 0,
                 page_size: 2,
                 pages_requested: 3,
                 started_at: started_at
               })

      assert run.source_id == source.id
      assert run.provider == "cj"
      assert run.surface == "shoppingProducts"
      assert run.status == "running"
      assert run.query == %{"keywords" => ["shoe"], "limit" => 2}
      assert run.cursor_start == 0
      assert run.page_size == 2
      assert run.pages_requested == 3
      assert DateTime.compare(run.started_at, started_at) == :eq

      assert {:ok, %ImportRun{} = completed} =
               Ingestion.complete_import_run(run, %{
                 status: "succeeded",
                 cursor_end: 4,
                 pages_fetched: 2,
                 records_fetched: 4,
                 records_normalized: 4,
                 records_persisted: 3,
                 records_failed: 1,
                 finished_at: finished_at
               })

      assert completed.status == "succeeded"
      assert completed.cursor_end == 4
      assert completed.pages_fetched == 2
      assert completed.records_fetched == 4
      assert completed.records_normalized == 4
      assert completed.records_persisted == 3
      assert completed.records_failed == 1
      assert DateTime.compare(completed.finished_at, finished_at) == :eq

      assert Repo.get!(ImportRun, completed.id).records_persisted == 3
    end
  end

  describe "merchant feed candidates" do
    test "persists a source-scoped candidate from CJ feed metadata" do
      source = source_fixture()
      provider_last_updated_at = ~U[2026-06-04 18:34:49Z]
      last_seen_at = ~U[2026-06-04 20:00:00Z]

      assert {:ok, %MerchantFeedCandidate{} = candidate} =
               Ingestion.upsert_merchant_feed_candidate(source, %{
                 advertiser_country: "US",
                 advertiser_id: "adv-1",
                 advertiser_name: "Trail Merchant",
                 currency: "USD",
                 feed_name: "US Shopping",
                 language: "EN",
                 last_seen_at: last_seen_at,
                 product_count: 10,
                 provider: "cj",
                 provider_feed_id: "feed-1",
                 provider_last_updated_at: provider_last_updated_at,
                 raw_metadata: %{"adId" => "feed-1", "feedName" => "US Shopping"},
                 source_feed_type: "SHOPPING"
               })

      assert candidate.source_id == source.id
      assert candidate.provider == "cj"
      assert candidate.provider_feed_id == "feed-1"
      assert candidate.advertiser_id == "adv-1"
      assert candidate.advertiser_name == "Trail Merchant"
      assert candidate.advertiser_country == "US"
      assert candidate.source_feed_type == "SHOPPING"
      assert candidate.currency == "USD"
      assert candidate.language == "EN"
      assert candidate.feed_name == "US Shopping"
      assert candidate.product_count == 10
      assert candidate.raw_metadata == %{"adId" => "feed-1", "feedName" => "US Shopping"}
      assert is_integer(candidate.cj_program_id)
      assert DateTime.compare(candidate.provider_last_updated_at, provider_last_updated_at) == :eq
      assert DateTime.compare(candidate.last_seen_at, last_seen_at) == :eq
    end

    test "replays candidates idempotently, preserves program link, and lists them by source" do
      source = source_fixture()
      other_source = source_fixture(%{name: "Other Feed", domain: "other.example"})
      first_seen_at = ~U[2026-06-04 20:00:00Z]
      later_seen_at = ~U[2026-06-04 21:00:00Z]

      assert {:ok, %MerchantFeedCandidate{id: candidate_id, cj_program_id: original_program_id}} =
               Ingestion.upsert_merchant_feed_candidate(source, %{
                 advertiser_country: "US",
                 advertiser_id: "adv-1",
                 advertiser_name: "Trail Merchant",
                 currency: "USD",
                 feed_name: "US Shopping",
                 language: "EN",
                 last_seen_at: first_seen_at,
                 product_count: 10,
                 provider: "cj",
                 provider_feed_id: "feed-1",
                 provider_last_updated_at: first_seen_at,
                 raw_metadata: %{"productCount" => 10},
                 source_feed_type: "SHOPPING"
               })

      assert {:ok, %MerchantFeedCandidate{id: ^candidate_id} = updated_candidate} =
               Ingestion.upsert_merchant_feed_candidate(source, %{
                 advertiser_country: "US",
                 advertiser_id: "adv-1",
                 advertiser_name: "Trail Merchant",
                 currency: "USD",
                 feed_name: "US Shopping Updated",
                 language: "EN",
                 last_seen_at: later_seen_at,
                 product_count: 12,
                 provider: "cj",
                 provider_feed_id: "feed-1",
                 provider_last_updated_at: later_seen_at,
                 raw_metadata: %{"productCount" => 12},
                 source_feed_type: "SHOPPING"
               })

      assert {:ok, _other_candidate} =
               Ingestion.upsert_merchant_feed_candidate(other_source, %{
                 advertiser_country: "US",
                 advertiser_id: "adv-2",
                 advertiser_name: "Other Merchant",
                 currency: "USD",
                 feed_name: "Other Shopping",
                 language: "EN",
                 last_seen_at: later_seen_at,
                 product_count: 4,
                 provider: "cj",
                 provider_feed_id: "feed-2",
                 provider_last_updated_at: later_seen_at,
                 raw_metadata: %{"productCount" => 4},
                 source_feed_type: "SHOPPING"
               })

      assert updated_candidate.feed_name == "US Shopping Updated"
      assert updated_candidate.product_count == 12
      assert is_integer(original_program_id)
      assert updated_candidate.cj_program_id == original_program_id
      assert DateTime.compare(updated_candidate.last_seen_at, later_seen_at) == :eq

      assert Repo.aggregate(MerchantFeedCandidate, :count, :id) == 2

      assert [%MerchantFeedCandidate{id: ^candidate_id, feed_name: "US Shopping Updated"}] =
               Ingestion.list_merchant_feed_candidates(source)
    end

    test "a partial CJ refresh preserves its existing advertiser identity and program link" do
      source = source_fixture()

      assert {:ok,
              %MerchantFeedCandidate{
                id: candidate_id,
                advertiser_id: "adv-preserved",
                cj_program_id: program_id
              }} =
               Ingestion.upsert_merchant_feed_candidate(source, %{
                 advertiser_id: "adv-preserved",
                 provider: "cj",
                 provider_feed_id: "feed-partial-refresh"
               })

      assert {:ok,
              %MerchantFeedCandidate{
                id: ^candidate_id,
                advertiser_id: "adv-preserved",
                cj_program_id: ^program_id
              }} =
               Ingestion.upsert_merchant_feed_candidate(source, %{
                 feed_name: "Refreshed without advertiser identity",
                 provider: "cj",
                 provider_feed_id: "feed-partial-refresh"
               })

      assert {:ok,
              %MerchantFeedCandidate{
                id: ^candidate_id,
                advertiser_id: "adv-preserved",
                cj_program_id: ^program_id
              }} =
               Ingestion.upsert_merchant_feed_candidate(source, %{
                 advertiser_id: "   ",
                 feed_name: "Refreshed with blank advertiser identity",
                 provider: "cj",
                 provider_feed_id: "feed-partial-refresh"
               })
    end

    test "merchant feed candidate connection query includes a unique pagination tiebreaker" do
      {sql, _params} =
        Ecto.Adapters.SQL.to_sql(:all, Repo, Ingestion.list_merchant_feed_candidates_query())

      assert sql =~
               ~s/ORDER BY m0."advertiser_name", m0."feed_name", m0."provider_feed_id", m0."id"/
    end

    test "merchant feed candidate connection query keeps name/feed/provider/id ordering by default" do
      source = source_fixture()
      other_source = source_fixture(%{name: "CJ other", domain: "other-cj.example"})

      beta =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Beta Merchant",
          feed_name: "A Feed",
          provider_feed_id: "feed-beta"
        })

      alpha_feed =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Alpha Merchant",
          feed_name: "Camping Feed",
          provider_feed_id: "feed-9"
        })

      alpha_provider =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Alpha Merchant",
          feed_name: "Outdoor Feed",
          provider_feed_id: "feed-0"
        })

      alpha_tie_first =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Alpha Merchant",
          feed_name: "Outdoor Feed",
          provider_feed_id: "feed-1"
        })

      alpha_tie_second =
        merchant_feed_candidate_fixture(other_source, %{
          advertiser_name: "Alpha Merchant",
          feed_name: "Outdoor Feed",
          provider_feed_id: "feed-1"
        })

      assert Repo.all(Ingestion.list_merchant_feed_candidates_query()) |> Enum.map(& &1.id) == [
               alpha_feed.id,
               alpha_provider.id,
               alpha_tie_first.id,
               alpha_tie_second.id,
               beta.id
             ]
    end

    test "merchant feed candidate query ranks last seen timestamps with stable tiebreakers" do
      source = source_fixture()
      other_source = source_fixture(%{name: "CJ second", domain: "second-cj.example"})
      newest_seen_at = ~U[2026-06-04 22:00:00Z]

      older =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Aardvark Merchant",
          last_seen_at: ~U[2026-06-04 20:00:00Z],
          provider_feed_id: "feed-old"
        })

      newer_feed_b =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Alpha Merchant",
          feed_name: "B Feed",
          last_seen_at: newest_seen_at,
          provider_feed_id: "feed-3"
        })

      newer_provider =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Alpha Merchant",
          feed_name: "A Feed",
          last_seen_at: newest_seen_at,
          provider_feed_id: "feed-2"
        })

      newer_tie_first =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Alpha Merchant",
          feed_name: "A Feed",
          last_seen_at: newest_seen_at,
          provider_feed_id: "feed-1"
        })

      newer_tie_second =
        merchant_feed_candidate_fixture(other_source, %{
          advertiser_name: "Alpha Merchant",
          feed_name: "A Feed",
          last_seen_at: newest_seen_at,
          provider_feed_id: "feed-1"
        })

      assert Repo.all(Ingestion.list_merchant_feed_candidates_query(sort: :last_seen_desc))
             |> Enum.map(& &1.id) == [
               newer_tie_first.id,
               newer_tie_second.id,
               newer_provider.id,
               newer_feed_b.id,
               older.id
             ]
    end

    test "merchant feed candidate query falls back to name ordering for unknown sorts" do
      source = source_fixture()

      beta =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Beta Merchant",
          provider_feed_id: "feed-beta"
        })

      alpha =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Alpha Merchant",
          provider_feed_id: "feed-alpha"
        })

      assert Repo.all(Ingestion.list_merchant_feed_candidates_query(sort: :unsupported))
             |> Enum.map(& &1.id) == [alpha.id, beta.id]
    end
  end

  describe "persist_normalized_listing/2" do
    test "resolves a historical product slug to its canonical product" do
      source = source_fixture()
      historical_slug = "acme-trail-running-shoe-cj-cj-12345"
      product = ProductCompare.Fixtures.SpecsFixtures.product_fixture(%{slug: historical_slug})

      assert {:ok, canonical_product} =
               Catalog.update_product(product, %{slug: "canonical-trail-running-shoe"})

      listing = normalized_listing(%{gtin: nil})

      assert {:ok, persisted} = Ingestion.persist_normalized_listing(source, listing)
      assert persisted.product.id == canonical_product.id
      assert persisted.product.slug == "canonical-trail-running-shoe"
      assert Repo.aggregate(Product, :count, :id) == 1
    end

    test "resolves listings from different sources and merchants by validated GTIN" do
      cj_source = source_fixture()
      awin_source = source_fixture(%{name: "Awin", domain: "awin.example"})

      cj_listing =
        normalized_listing(%{
          external_product_id: "CJ-CANONICAL-1",
          merchant_identifier: "cj-merchant",
          merchant_name: "CJ Merchant",
          merchant_domain: "cj-merchant.example",
          listing_url: "https://cj-merchant.example/products/trail-shoe",
          raw_payload: %{"id" => "CJ-CANONICAL-1"}
        })

      awin_listing =
        normalized_listing(%{
          source: :awin,
          external_product_id: "AWIN-CANONICAL-9",
          merchant_identifier: "awin-merchant",
          merchant_name: "Awin Merchant",
          merchant_domain: "awin-merchant.example",
          listing_url: "https://awin-merchant.example/products/acme-running-shoe",
          observed_at: ~U[2026-05-24 15:00:00Z],
          raw_payload: %{"id" => "AWIN-CANONICAL-9"}
        })

      assert {:ok, cj_persisted} =
               Ingestion.persist_normalized_listing(cj_source, cj_listing)

      assert {:ok, awin_persisted} =
               Ingestion.persist_normalized_listing(awin_source, awin_listing)

      assert awin_persisted.product.id == cj_persisted.product.id
      refute awin_persisted.external_product.id == cj_persisted.external_product.id
      refute awin_persisted.merchant_product.id == cj_persisted.merchant_product.id

      assert %ProductIdentifier{
               product_id: product_id,
               scheme: "gtin",
               normalized_value: "00012345678905",
               display_value: "00012345678905",
               verification_status: "validated",
               source_artifact_id: source_artifact_id
             } = Repo.one!(ProductIdentifier)

      assert product_id == cj_persisted.product.id
      assert source_artifact_id == cj_persisted.source_artifact.id
      assert Repo.aggregate(Product, :count, :id) == 1
      assert Repo.aggregate(ProductIdentifier, :count, :id) == 1
      assert Repo.aggregate(ExternalProduct, :count, :id) == 2
      assert Repo.aggregate(MerchantProduct, :count, :id) == 2
    end

    test "does not merge or persist blank and invalid GTIN values" do
      source = source_fixture()

      blank_listing =
        normalized_listing(%{
          external_product_id: "CJ-BLANK-GTIN",
          gtin: " ",
          listing_url: "https://trail.example/products/blank-gtin",
          raw_payload: %{"id" => "CJ-BLANK-GTIN"}
        })

      invalid_listing =
        normalized_listing(%{
          external_product_id: "CJ-INVALID-GTIN",
          gtin: "00012345678906",
          listing_url: "https://trail.example/products/invalid-gtin",
          observed_at: ~U[2026-05-24 15:00:00Z],
          raw_payload: %{"id" => "CJ-INVALID-GTIN"}
        })

      assert {:ok, blank_persisted} =
               Ingestion.persist_normalized_listing(source, blank_listing)

      assert {:ok, invalid_persisted} =
               Ingestion.persist_normalized_listing(source, invalid_listing)

      refute invalid_persisted.product.id == blank_persisted.product.id
      assert Repo.aggregate(Product, :count, :id) == 2
      assert Repo.aggregate(ProductIdentifier, :count, :id) == 0
    end

    test "does not rebind an existing external product or add a conflicting GTIN" do
      source = source_fixture()

      original_listing =
        normalized_listing(%{
          external_product_id: "CJ-STABLE-IDENTITY",
          gtin: "00012345678905",
          raw_payload: %{"id" => "CJ-STABLE-IDENTITY", "gtin" => "00012345678905"}
        })

      conflicting_listing =
        normalized_listing(%{
          external_product_id: "CJ-STABLE-IDENTITY",
          gtin: "4006381333931",
          observed_at: ~U[2026-05-24 15:00:00Z],
          raw_payload: %{"id" => "CJ-STABLE-IDENTITY", "gtin" => "4006381333931"}
        })

      assert {:ok, original_persisted} =
               Ingestion.persist_normalized_listing(source, original_listing)

      assert {:ok, conflicting_persisted} =
               Ingestion.persist_normalized_listing(source, conflicting_listing)

      assert conflicting_persisted.product.id == original_persisted.product.id
      assert conflicting_persisted.external_product.id == original_persisted.external_product.id

      assert [%ProductIdentifier{normalized_value: "00012345678905"}] =
               Repo.all(ProductIdentifier)
    end

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

    test "persists a redacted CJ validation sample through the ingestion boundary" do
      source = source_fixture(%{kind: "affiliate_feed", name: "CJ validation", domain: "cj.com"})
      [record | _] = product_validation_fixture()

      assert {:ok, listing} = ProductCompare.Ingestion.Sources.CJ.ProductParser.normalize(record)
      assert {:ok, persisted} = Ingestion.persist_normalized_listing(source, listing)

      assert persisted.source_artifact.source_id == source.id
      assert persisted.source_artifact.raw_json == record
      assert persisted.external_product.source_id == source.id
      assert persisted.external_product.external_id == listing.external_product_id
      assert persisted.merchant_identity.source_id == source.id
      assert persisted.merchant_identity.merchant_identifier == listing.merchant_identifier
      assert persisted.merchant_product.url == listing.listing_url
      assert persisted.merchant_product.currency == listing.currency
      assert Decimal.eq?(persisted.price_point.price, listing.amount)
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
      assert Repo.aggregate(ProductIdentifier, :count, :id) == 1
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

    test "treats an older different URL as a successful no-op for product persistence" do
      source = source_fixture()

      current_listing =
        normalized_listing(%{
          external_product_id: "CJ-URL-FRESHNESS",
          listing_url: "https://trail.example/products/current",
          amount: Decimal.new("129.99"),
          observed_at: ~U[2026-05-24 15:00:00Z],
          raw_payload: %{"id" => "CJ-URL-FRESHNESS", "price" => "129.99"}
        })

      stale_listing =
        normalized_listing(%{
          external_product_id: "CJ-URL-FRESHNESS",
          listing_url: "https://trail.example/products/older-url",
          product_title: "Older Product Title",
          amount: Decimal.new("89.99"),
          observed_at: ~U[2026-05-23 15:00:00Z],
          raw_payload: %{"id" => "CJ-URL-FRESHNESS", "price" => "89.99"}
        })

      assert {:ok, current_persisted} =
               Ingestion.persist_normalized_listing(source, current_listing)

      product_count = Repo.aggregate(Product, :count, :id)
      merchant_product_count = Repo.aggregate(MerchantProduct, :count, :id)
      price_point_count = Repo.aggregate(PricePoint, :count, :id)

      assert {:ok, stale_persisted} =
               Ingestion.persist_normalized_listing(source, stale_listing)

      assert stale_persisted.external_product.id == current_persisted.external_product.id
      assert stale_persisted.product.id == current_persisted.product.id
      assert stale_persisted.merchant_product.id == current_persisted.merchant_product.id
      assert stale_persisted.price_point.id == current_persisted.price_point.id

      assert Repo.aggregate(Product, :count, :id) == product_count
      assert Repo.aggregate(MerchantProduct, :count, :id) == merchant_product_count
      assert Repo.aggregate(PricePoint, :count, :id) == price_point_count

      reloaded_external_product = Repo.reload!(current_persisted.external_product)
      assert reloaded_external_product.canonical_url == current_listing.listing_url

      assert DateTime.compare(
               reloaded_external_product.last_seen_at,
               current_listing.observed_at
             ) == :eq
    end

    test "returns the current offer when a stale payload resolves a different merchant" do
      source = source_fixture()

      current_listing =
        normalized_listing(%{
          external_product_id: "CJ-MERCHANT-FRESHNESS",
          listing_url: "https://trail.example/products/current-merchant-offer",
          merchant_identifier: "current-merchant",
          merchant_name: "Current Merchant",
          merchant_domain: "current-merchant.example",
          amount: Decimal.new("129.99"),
          observed_at: ~U[2026-05-24 15:00:00Z],
          raw_payload: %{"id" => "CJ-MERCHANT-FRESHNESS", "price" => "129.99"}
        })

      stale_listing =
        normalized_listing(%{
          external_product_id: "CJ-MERCHANT-FRESHNESS",
          listing_url: "https://other.example/products/stale-offer",
          merchant_identifier: "stale-merchant",
          merchant_name: "Stale Merchant",
          merchant_domain: "stale-merchant.example",
          amount: Decimal.new("89.99"),
          observed_at: ~U[2026-05-23 15:00:00Z],
          raw_payload: %{"id" => "CJ-MERCHANT-FRESHNESS", "price" => "89.99"}
        })

      assert {:ok, current_persisted} =
               Ingestion.persist_normalized_listing(source, current_listing)

      current_merchant_product = current_persisted.merchant_product
      current_price_point = current_persisted.price_point
      product_count = Repo.aggregate(Product, :count, :id)
      merchant_product_count = Repo.aggregate(MerchantProduct, :count, :id)
      price_point_count = Repo.aggregate(PricePoint, :count, :id)

      assert {:ok, stale_persisted} =
               Ingestion.persist_normalized_listing(source, stale_listing)

      assert stale_persisted.merchant_identity.merchant_id !=
               current_persisted.merchant_identity.merchant_id

      assert stale_persisted.product.id == current_persisted.product.id
      assert stale_persisted.merchant_product.id == current_merchant_product.id
      assert stale_persisted.price_point.id == current_price_point.id

      assert Repo.reload!(current_merchant_product) == current_merchant_product
      assert Repo.reload!(current_price_point) == current_price_point
      assert Repo.aggregate(Product, :count, :id) == product_count
      assert Repo.aggregate(MerchantProduct, :count, :id) == merchant_product_count
      assert Repo.aggregate(PricePoint, :count, :id) == price_point_count
    end

    test "uses external listing identity when current offers share product and URL" do
      source = source_fixture()
      shared_url = "https://trail.example/products/shared-offer"

      current_listing =
        normalized_listing(%{
          external_product_id: "CJ-STABLE-SKU",
          listing_url: shared_url,
          amount: Decimal.new("129.99"),
          observed_at: ~U[2026-05-24 15:00:00Z],
          raw_payload: %{"id" => "CJ-STABLE-SKU", "price" => "129.99"}
        })

      assert {:ok, current_persisted} =
               Ingestion.persist_normalized_listing(source, current_listing)

      {:ok, unrelated_merchant} =
        Pricing.upsert_merchant(%{
          name: "Unrelated Merchant",
          domain: "unrelated-merchant.example"
        })

      {:ok, unrelated_offer} =
        Pricing.upsert_merchant_product(%{
          merchant_id: unrelated_merchant.id,
          product_id: current_persisted.product.id,
          external_sku: "UNRELATED-SKU",
          url: shared_url,
          currency: "USD",
          is_active: true,
          last_seen_at: ~U[2026-05-25 15:00:00Z]
        })

      {:ok, unrelated_price} =
        Pricing.add_price_point(%{
          merchant_product_id: unrelated_offer.id,
          observed_at: ~U[2026-05-25 15:00:00Z],
          price: Decimal.new("199.99"),
          in_stock: true
        })

      product_count = Repo.aggregate(Product, :count, :id)
      merchant_product_count = Repo.aggregate(MerchantProduct, :count, :id)
      price_point_count = Repo.aggregate(PricePoint, :count, :id)

      stale_listing =
        normalized_listing(%{
          external_product_id: "CJ-STABLE-SKU",
          listing_url: "https://trail.example/products/stale-url",
          amount: Decimal.new("89.99"),
          observed_at: ~U[2026-05-23 15:00:00Z],
          raw_payload: %{"id" => "CJ-STABLE-SKU", "price" => "89.99"}
        })

      assert {:ok, stale_persisted} =
               Ingestion.persist_normalized_listing(source, stale_listing)

      assert stale_persisted.merchant_product.id == current_persisted.merchant_product.id
      assert stale_persisted.price_point.id == current_persisted.price_point.id
      refute stale_persisted.merchant_product.id == unrelated_offer.id
      refute stale_persisted.price_point.id == unrelated_price.id

      assert Repo.aggregate(Product, :count, :id) == product_count
      assert Repo.aggregate(MerchantProduct, :count, :id) == merchant_product_count
      assert Repo.aggregate(PricePoint, :count, :id) == price_point_count
    end

    test "does not attach stale external product observations over newer rows" do
      source = source_fixture()
      current_observed_at = ~U[2026-05-24 15:00:00Z]
      stale_observed_at = ~U[2026-05-23 15:00:00Z]

      external_product =
        %ExternalProduct{}
        |> ExternalProduct.changeset(%{
          source_id: source.id,
          external_id: "CJ-STALE-ATTACH",
          canonical_url: "https://trail.example/products/current",
          last_seen_at: current_observed_at
        })
        |> Repo.insert!()

      stale_listing =
        normalized_listing(%{
          external_product_id: "CJ-STALE-ATTACH",
          product_title: "Older Trail Running Shoe",
          listing_url: "https://trail.example/products/older",
          observed_at: stale_observed_at,
          raw_payload: %{"id" => "CJ-STALE-ATTACH", "price" => "89.99"}
        })

      assert {:ok, persisted} = Ingestion.persist_normalized_listing(source, stale_listing)

      reloaded_external_product = Repo.get!(ExternalProduct, external_product.id)

      assert persisted.external_product.id == external_product.id
      assert persisted.external_product.product_id == nil
      assert reloaded_external_product.product_id == nil
      assert reloaded_external_product.canonical_url == "https://trail.example/products/current"
      assert DateTime.compare(reloaded_external_product.last_seen_at, current_observed_at) == :eq
    end

    test "does not retarget an existing merchant product when a listing URL is reused" do
      source = source_fixture()
      reused_url = "https://trail.example/products/reused"

      original_listing =
        normalized_listing(%{
          external_product_id: "CJ-ORIGINAL",
          product_title: "Acme Trail Running Shoe",
          gtin: nil,
          listing_url: reused_url,
          raw_payload: %{"id" => "CJ-ORIGINAL", "price" => "129.99"}
        })

      reused_listing =
        normalized_listing(%{
          external_product_id: "CJ-REUSED",
          product_title: "Different Trail Running Shoe",
          gtin: nil,
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
      assert Repo.aggregate(Product, :count, :id) == 1
      assert Repo.aggregate(SourceArtifact, :count, :id) == 1
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
          gtin: nil,
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

  defp merchant_feed_candidate_fixture(source, attrs) do
    suffix = System.unique_integer([:positive])

    attrs =
      Map.merge(
        %{
          advertiser_country: "US",
          advertiser_id: "adv-#{suffix}",
          advertiser_name: "Merchant #{suffix}",
          currency: "USD",
          feed_name: "Feed #{suffix}",
          language: "EN",
          last_seen_at: ~U[2026-06-04 20:00:00Z],
          product_count: 1,
          provider: "cj",
          provider_feed_id: "feed-#{suffix}",
          provider_last_updated_at: ~U[2026-06-04 20:00:00Z],
          raw_metadata: %{},
          source_feed_type: "SHOPPING"
        },
        attrs
      )

    assert {:ok, %MerchantFeedCandidate{} = candidate} =
             Ingestion.upsert_merchant_feed_candidate(source, attrs)

    candidate
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

  defp product_validation_fixture do
    "test/support/fixtures/cj/product_validation_sample.redacted.json"
    |> File.read!()
    |> Jason.decode!()
    |> Map.fetch!("products")
  end
end
