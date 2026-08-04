defmodule ProductCompare.Ingestion.ReconciliationTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.Fixtures.CJIngestionFixtures

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportObservation
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Pricing.MerchantProduct

  test "a proven complete run deactivates only unseen offers from the same scope" do
    source = source_fixture()
    query = %{"providerFeedId" => "feed-1", "currency" => "USD"}

    first_run = start_complete_scope_run!(source, query)
    first_a = persist!(source, listing("A", 0), first_run)
    first_b = persist!(source, listing("B", 0), first_run)
    completed_first = complete!(first_run)

    assert completed_first.reconciliation_status == :succeeded
    assert completed_first.offers_deactivated == 0
    assert Repo.aggregate(ImportObservation, :count, :id) == 2

    second_run = start_complete_scope_run!(source, query)
    second_a = persist!(source, listing("A", 60), second_run)
    completed_second = complete!(second_run)

    assert completed_second.reconciliation_status == :succeeded
    assert completed_second.offers_deactivated == 1
    assert %DateTime{} = completed_second.reconciled_at
    assert Repo.get!(MerchantProduct, first_a.merchant_product.id).is_active
    assert Repo.get!(MerchantProduct, second_a.merchant_product.id).is_active
    refute Repo.get!(MerchantProduct, first_b.merchant_product.id).is_active

    assert {:ok, replayed} =
             Ingestion.complete_import_run(completed_second, completion_attrs())

    assert replayed.reconciliation_status == :succeeded
    assert replayed.offers_deactivated == 1
  end

  test "partial and failed complete-scope runs never deactivate unseen offers" do
    source = source_fixture()
    query = %{"providerFeedId" => "feed-safe"}

    baseline = start_complete_scope_run!(source, query)
    persist!(source, listing("A", 0), baseline)
    offer_b = persist!(source, listing("B", 0), baseline).merchant_product
    complete!(baseline)

    partial = start_complete_scope_run!(source, query)
    persist!(source, listing("A", 60), partial)

    assert {:ok, partial} =
             Ingestion.complete_import_run(
               partial,
               completion_attrs(%{cursor_end: 100})
             )

    assert partial.reconciliation_status == :skipped_partial
    assert partial.offers_deactivated == 0
    assert Repo.get!(MerchantProduct, offer_b.id).is_active

    failed = start_complete_scope_run!(source, query)
    persist!(source, listing("A", 120), failed)

    assert {:ok, failed} =
             Ingestion.complete_import_run(
               failed,
               completion_attrs(%{status: "failed", records_failed: 1})
             )

    assert failed.reconciliation_status == :skipped_failed
    assert failed.offers_deactivated == 0
    assert Repo.get!(MerchantProduct, offer_b.id).is_active
  end

  test "a complete-scope run starting after the first page never reconciles unseen offers" do
    source = source_fixture()
    query = %{"providerFeedId" => "feed-offset-safe"}

    baseline = start_complete_scope_run!(source, query)
    persist!(source, listing("A", 0), baseline)
    offer_b = persist!(source, listing("B", 0), baseline).merchant_product
    complete!(baseline)

    offset_run = start_complete_scope_run!(source, query, cursor_start: 25)
    persist!(source, listing("A", 60), offset_run)
    completed = complete!(offset_run)

    assert completed.reconciliation_status == :skipped_partial
    assert completed.offers_deactivated == 0
    assert Repo.get!(MerchantProduct, offer_b.id).is_active
  end

  test "a complete-scope run without an explicit cursor starts at the beginning" do
    source = source_fixture()
    query = %{"providerFeedId" => "feed-default-cursor"}

    baseline = start_complete_scope_run!(source, query)
    persist!(source, listing("A", 0), baseline)
    offer_b = persist!(source, listing("B", 0), baseline).merchant_product
    complete!(baseline)

    {:ok, run} =
      Ingestion.start_import_run(%{
        complete_scope: true,
        page_size: 25,
        pages_requested: 5,
        provider: "cj",
        query: query,
        source_id: source.id,
        started_at: ~U[2026-07-13 18:00:00.000000Z],
        surface: "shoppingProducts"
      })

    assert run.cursor_start == 0
    persist!(source, listing("A", 60), run)

    completed = complete!(run)

    assert completed.reconciliation_status == :succeeded
    refute Repo.get!(MerchantProduct, offer_b.id).is_active
  end

  test "bounded or differently scoped runs cannot hide offers and a fresh observation reactivates" do
    source = source_fixture()
    shoe_scope = %{"providerFeedId" => "feed-shoes"}

    baseline = start_complete_scope_run!(source, shoe_scope)
    persist!(source, listing("A", 0), baseline)
    persisted_b = persist!(source, listing("B", 0), baseline)
    complete!(baseline)

    bounded = start_bounded_run!(source, shoe_scope)
    persist!(source, listing("A", 60), bounded)
    bounded = complete!(bounded)
    assert bounded.reconciliation_status == :not_requested
    assert Repo.get!(MerchantProduct, persisted_b.merchant_product.id).is_active

    other_scope = start_complete_scope_run!(source, %{"providerFeedId" => "feed-boots"})
    persist!(source, listing("A", 120), other_scope)
    other_scope = complete!(other_scope)
    assert other_scope.offers_deactivated == 0
    assert Repo.get!(MerchantProduct, persisted_b.merchant_product.id).is_active

    current_scope = start_complete_scope_run!(source, shoe_scope)
    persist!(source, listing("A", 180), current_scope)
    complete!(current_scope)
    refute Repo.get!(MerchantProduct, persisted_b.merchant_product.id).is_active

    reactivated = persist!(source, listing("B", 240), nil)
    assert reactivated.merchant_product.id == persisted_b.merchant_product.id
    assert Repo.get!(MerchantProduct, persisted_b.merchant_product.id).is_active
  end

  test "scope fingerprints are deterministic and do not persist raw query values in observations" do
    source = source_fixture()

    first =
      start_complete_scope_run!(source, %{
        "currency" => "USD",
        "providerFeedId" => "private-feed-id"
      })

    second =
      start_complete_scope_run!(source, %{
        "providerFeedId" => "private-feed-id",
        "currency" => "USD"
      })

    different =
      start_complete_scope_run!(source, %{
        "currency" => "CAD",
        "providerFeedId" => "private-feed-id"
      })

    assert first.scope_fingerprint == second.scope_fingerprint
    refute first.scope_fingerprint == different.scope_fingerprint
    assert byte_size(first.scope_fingerprint) == 32

    canonical_payload =
      Jason.encode!([
        ["query", [["currency", "USD"], ["providerFeedId", "private-feed-id"]]],
        ["source_id", source.id],
        ["surface", "shoppingProducts"]
      ])

    assert first.scope_fingerprint == :crypto.hash(:sha256, canonical_payload)
  end

  test "import runs reject scope fingerprints that are not SHA-256 digests" do
    source = source_fixture()

    changeset =
      ImportRun.changeset(%ImportRun{}, %{
        source_id: source.id,
        surface: "shoppingProducts",
        query: %{},
        status: :running,
        started_at: ~U[2026-07-01 12:00:00Z],
        scope_fingerprint: "not-a-32-byte-digest"
      })

    assert %{scope_fingerprint: ["must be 32 bytes"]} = errors_on(changeset)
  end

  test "an older run finishing after a newer complete run is safely superseded" do
    source = source_fixture()
    query = %{"providerFeedId" => "feed-concurrent"}

    baseline = start_complete_scope_run!(source, query)
    persist!(source, listing("A", 0), baseline)
    offer_b = persist!(source, listing("B", 0), baseline).merchant_product
    complete!(baseline)

    older = start_complete_scope_run!(source, query)
    persist!(source, listing("A", 60), older)

    newer = start_complete_scope_run!(source, query)
    persist!(source, listing("A", 120), newer)
    persist!(source, listing("B", 120), newer)
    newer = complete!(newer)

    assert newer.reconciliation_status == :succeeded
    assert Repo.get!(MerchantProduct, offer_b.id).is_active

    older = complete!(older)
    assert older.reconciliation_status == :skipped_superseded
    assert older.offers_deactivated == 0
    assert Repo.get!(MerchantProduct, offer_b.id).is_active
  end

  test "a newer pending run restores offers deactivated by an older finalization" do
    source = source_fixture()
    query = %{"providerFeedId" => "feed-overlap"}

    baseline = start_complete_scope_run!(source, query)
    persist!(source, listing("A", 0), baseline)
    offer_b = persist!(source, listing("B", 0), baseline).merchant_product
    complete!(baseline)

    older = start_complete_scope_run!(source, query)
    persist!(source, listing("A", 60), older)

    newer = start_complete_scope_run!(source, query)
    persist!(source, listing("A", 120), newer)
    persist!(source, listing("B", 120), newer)

    older = complete!(older)
    assert older.reconciliation_status == :succeeded
    refute Repo.get!(MerchantProduct, offer_b.id).is_active

    newer = complete!(newer)
    assert newer.reconciliation_status == :succeeded
    assert Repo.get!(MerchantProduct, offer_b.id).is_active
  end

  defp start_complete_scope_run!(source, query, opts \\ []) do
    {:ok, run} =
      Ingestion.start_import_run(%{
        complete_scope: true,
        cursor_start: Keyword.get(opts, :cursor_start, 0),
        page_size: 25,
        pages_requested: 5,
        provider: "cj",
        query: query,
        source_id: source.id,
        started_at: ~U[2026-07-13 18:00:00.000000Z],
        surface: "shoppingProducts"
      })

    run
  end

  defp start_bounded_run!(source, query) do
    {:ok, run} =
      Ingestion.start_import_run(%{
        cursor_start: 0,
        page_size: 25,
        pages_requested: 1,
        provider: "cj",
        query: query,
        source_id: source.id,
        started_at: ~U[2026-07-13 18:00:00.000000Z],
        surface: "shoppingProducts"
      })

    run
  end

  defp persist!(source, listing, nil) do
    {:ok, persisted} = Ingestion.persist_normalized_listing(source, listing)
    persisted
  end

  defp persist!(source, listing, import_run) do
    {:ok, persisted} =
      Ingestion.persist_normalized_listing(source, listing, import_run: import_run)

    persisted
  end

  defp complete!(run) do
    {:ok, completed} = Ingestion.complete_import_run(run, completion_attrs())
    completed
  end

  defp completion_attrs(overrides \\ %{}) do
    Map.merge(
      %{
        cursor_end: nil,
        finished_at: ~U[2026-07-13 18:05:00.000000Z],
        pages_fetched: 1,
        records_failed: 0,
        records_fetched: 1,
        records_normalized: 1,
        records_persisted: 1,
        status: "succeeded"
      },
      overrides
    )
  end

  defp listing(suffix, offset_minutes) do
    %NormalizedListing{
      source: :cj,
      external_product_id: "CJ-#{suffix}",
      merchant_identifier: "merchant-1",
      product_title: "Product #{suffix}",
      brand_name: "Acme",
      gtin: nil,
      merchant_name: "Trail Shop",
      merchant_domain: "trail.example",
      listing_url: "https://trail.example/products/#{String.downcase(suffix)}",
      currency: "USD",
      amount: Decimal.new("99.00"),
      availability: :in_stock,
      observed_at: DateTime.add(~U[2026-07-13 17:00:00.000000Z], offset_minutes, :minute),
      raw_payload: %{"id" => suffix}
    }
  end
end
