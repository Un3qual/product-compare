# Listing Persistence Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-listing-persistence-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against direct ingestion, enrichment, and
  reconciliation characterization paths.

## Target Outcome

`ProductCompare.Ingestion.ListingPersistence.persist/3` remains the stable
ingestion-facing boundary while source identity, canonical product identity,
enrichment, and offer observation persistence live in focused internal
modules with unchanged transactions, writes, conflicts, freshness, result
shapes, and downstream policy.

## Ready Evidence

- `lib/product_compare/ingestion/listing_persistence.ex` is 840 lines and owns
  four concrete implementation responsibilities behind one stable entry point.
- Application callers use
  `ProductCompare.Ingestion.persist_normalized_listing/2` and `/3`; the
  persistence module has no direct external caller.
- The selected ingestion, enrichment, and reconciliation characterization
  gate passed 44 tests on 2026-07-23.
- Artifact/product identity, enrichment, and offer observations share one
  atomic normalized-listing persistence outcome and remain internal slices
  rather than separate queue batches.
- The implementation paths are disjoint from CJ Import, CJ Runs, and Catalog
  Resolver decomposition.

## Internal Slices

1. Source-artifact and external-product freshness persistence.
2. Canonical product, GTIN, slug, brand, and ingested-type identity.
3. Missing copy, taxonomy mapping, media, and specification enrichment.
4. Merchant-product and price-point persistence plus alert enqueueing.
5. Stable transaction facade, reconciliation observation, and result parity.

## Boundaries

- Preserve `persist/3`, accepted inputs, result maps, rollbacks, and error
  values.
- Preserve hashes, conflict targets, freshness, identity, category mapping,
  evidence counts, offer activity, price replay, alert jobs, and
  reconciliation.
- Keep application callers dependent only on
  `ProductCompare.Ingestion.persist_normalized_listing/2` and `/3`.
- Do not change providers, schemas, migrations, catalog, taxonomy,
  specification, pricing, alert, reconciliation, GraphQL, or frontend policy.

## Verification

- `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/enrichment_test.exs test/product_compare/ingestion/reconciliation_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
