# Listing Persistence Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Ingestion.ListingPersistence.persist/3` as the
stable ingestion-facing boundary while moving source identity, canonical
product identity, enrichment, and offer observation persistence into focused
internal modules.

**Architecture:** The existing module remains the only caller-facing owner and
retains the transaction, merchant-identity resolution, import-run observation,
fresh/stale dispatch, and final result shape. `Artifacts`, `Products`,
`Enrichment`, and `Offers` receive the current private implementations by
responsibility without changing database writes, conflict targets, freshness,
identity, taxonomy, specification, pricing, alert, or reconciliation policy.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Decimal, ExUnit.

## Global Constraints

- Preserve `ProductCompare.Ingestion.ListingPersistence.persist/3`, its
  accepted source, normalized-listing, and keyword inputs, return values,
  transaction boundary, rollbacks, and result-map fields.
- Preserve source-artifact hashes, external-product freshness, GTIN and slug
  identity, brand and ingested-type creation, category mapping, media and
  specification evidence, merchant-product conflicts, price-point replay,
  alert enqueueing, stale observations, and import-run reconciliation.
- Keep `ProductCompare.Ingestion.persist_normalized_listing/2` and `/3` as the
  application-facing boundary; no external caller may reference the focused
  owners.
- Do not change provider parsing, schemas, migrations, catalog, taxonomy,
  specification, pricing, alert, reconciliation, GraphQL, or frontend policy.

---

### Task 1: Artifact And External Identity Ownership

**Files:**

- Create: `lib/product_compare/ingestion/listing_persistence/artifacts.ex`
- Modify: `lib/product_compare/ingestion/listing_persistence.ex`
- Test: `test/product_compare/ingestion/ingestion_test.exs`
- Test: `test/product_compare/ingestion/reconciliation_test.exs`

**Interfaces:** `ProductCompare.Ingestion.ListingPersistence.Artifacts` owns
source-artifact hashing and replay, external-product freshness and conflict
updates, fresh-product attachment, and stale product and merchant-product
reads. It exposes `upsert_source_artifact/2`, `upsert_external_product/2`,
`attach_external_product/3`, `stale_product/1`, and
`stale_merchant_product/1` only to the stable facade.

- [ ] Run the two named characterization suites before the extraction.
- [ ] Add the facade delegation and run the suites to observe the expected
  missing-owner compilation failure.
- [ ] Move the exact artifact hash, conflict target, freshness, attachment,
  and stale-read implementations into `Artifacts`.
- [ ] Re-run the suites and confirm artifact replay, external identity,
  out-of-order observations, and import-run observation behavior are
  unchanged.
- [ ] Commit with message `refactor: isolate listing artifact persistence`.

### Task 2: Canonical Product Identity Ownership

**Files:**

- Create: `lib/product_compare/ingestion/listing_persistence/products.ex`
- Modify: `lib/product_compare/ingestion/listing_persistence.ex`
- Read:
  `lib/product_compare/ingestion/listing_persistence/artifacts.ex`
- Test: `test/product_compare/ingestion/ingestion_test.exs`

**Interfaces:** `ProductCompare.Ingestion.ListingPersistence.Products` exposes
`ensure_product/3` to the stable facade and owns GTIN normalization and
attachment, slug fallback and collision handling, external-product identity
preservation, brand upserts, ingested-type taxonomy creation, and product
creation.

- [ ] Run the named characterization suite before the extraction.
- [ ] Add the facade delegation and run the suite to observe the expected
  missing-owner compilation failure.
- [ ] Move canonical product identity and creation into `Products` without
  changing conflict handling, identifiers, slugs, brands, types, copy, or
  errors.
- [ ] Re-run the suite and confirm validated GTIN convergence, invalid-GTIN
  fallback, replay, conflict, stale, brand, and default-type behavior remain
  unchanged.
- [ ] Commit with message `refactor: isolate listing product identity`.

### Task 3: Listing Enrichment Ownership

**Files:**

- Create: `lib/product_compare/ingestion/listing_persistence/enrichment.ex`
- Modify: `lib/product_compare/ingestion/listing_persistence.ex`
- Test: `test/product_compare/ingestion/enrichment_test.exs`
- Test: `test/product_compare/ingestion/ingestion_test.exs`

**Interfaces:**
`ProductCompare.Ingestion.ListingPersistence.Enrichment` exposes
`enrich_product/3`, returning `{:ok, product, taxonomy}`, and
`persist_evidence/3`, returning the unchanged media and specification summary.
It owns missing canonical copy, mapped-type application, category-candidate
upserts and display paths, media persistence, specification import aggregation,
and accepted/replayed/rejected counts.

- [ ] Run the two named characterization suites before the extraction.
- [ ] Add the facade delegation and run the suites to observe the expected
  missing-owner compilation failure.
- [ ] Move enrichment and evidence persistence into `Enrichment` without
  changing fill-only semantics, mappings, candidates, counts, replay, or
  failure handling.
- [ ] Re-run the suites and confirm copy, exact aliases, unmapped candidates,
  media, typed specifications, provenance, and replay behavior remain
  unchanged.
- [ ] Commit with message `refactor: isolate listing enrichment persistence`.

### Task 4: Offer And Price Observation Ownership

**Files:**

- Create: `lib/product_compare/ingestion/listing_persistence/offers.ex`
- Modify: `lib/product_compare/ingestion/listing_persistence.ex`
- Test: `test/product_compare/ingestion/ingestion_test.exs`

**Interfaces:** `ProductCompare.Ingestion.ListingPersistence.Offers` exposes
`persist_offer/4`, returning the unchanged merchant-product and price-point
pair. It owns merchant-product attributes and conflict updates, product
conflict errors, active state, price-point replay and stock projection,
out-of-order observation handling, and alert-evaluation enqueueing.

- [ ] Run the named characterization suite before the extraction.
- [ ] Add the facade delegation and run the suite to observe the expected
  missing-owner compilation failure.
- [ ] Move merchant-product and price-point persistence into `Offers` without
  changing conflict targets, timestamps, active state, replay, latest-price
  selection, stock, jobs, or errors.
- [ ] Re-run the suite and confirm fresh, replayed, stale, conflicting,
  in-stock, out-of-stock, and alert-enqueue behavior remain unchanged.
- [ ] Commit with message `refactor: isolate listing offer persistence`.

### Task 5: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/listing-persistence-decomposition.md`

- [ ] Run
  `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/enrichment_test.exs test/product_compare/ingestion/reconciliation_test.exs`
  and confirm the exact 44-test characterization gate passes.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm application and test callers still reference only
  `ProductCompare.Ingestion.persist_normalized_listing/2` and `/3`, and no
  external caller references `Artifacts`, `Products`, `Enrichment`, or
  `Offers`.
- [ ] Record final ownership, facade and module sizes, exact test count, and
  gate results in the lane doc and include it in the final code/test milestone
  commit.
