# Product Data Scraping Work Doc

## Snapshot

- Status: active
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-23 after Task 1 verification
- Historical context:
  - `docs/decisions/2026-03-05-mvp-scope-freeze.md`
  - `docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`
  - `docs/implementation-checklist.md`
- Detailed plan:
  - `docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
- Current implementation plan:
  - `docs/plans/2026-05-23-product-data-ingestion-foundation-implementation-plan.md`
- Objective:
  - Re-activate deferred ingestion work with a source-first plan that specifies where product data comes from, how it is fetched legally, and how it lands in existing Catalog/Pricing models.

## Research Summary

A parallel doc research pass covered provider APIs/feeds plus crawl standards. The resulting plan favors an acquisition ladder:

1. Tier 1: official APIs and affiliate feeds (CJ, eBay, Best Buy, Awin, Amazon PA-API).
2. Tier 2: merchant-provided feeds and exports.
3. Tier 3: selective direct scraping only behind an explicit legal and robots gate.

## Verified Current State

- Scraping job orchestration remains deferred during MVP+1 ingestion foundation work.
- Existing `Catalog`, `Specs`, and `Pricing` context boundaries already provide persistence targets for normalized ingestion records.
- `ProductCompare.Ingestion` now owns the source-agnostic normalized listing contract, source adapter behavior, CJ fixture parser, and source-scoped merchant identity resolution.
- `merchant_source_identities` now persists deterministic source-to-merchant links for replay-safe imports.

## Current Recommendation

- Start with a single Tier-1 connector MVP, defaulting to CJ because an approved account already exists and falling back to eBay only if CJ scope is insufficient for the first spike.
- Run a weekly CJ-driven merchant discovery loop (candidate export -> scoring -> application cohort -> data viability check) so merchant growth and ingestion quality evolve together.
- Defer broad direct-site scraping until at least two official source connectors are operational.
- Keep legal and compliance review as a hard gate for any Tier-3 scraping activation.

## Next Batch

- Status: queued
- Batch:
  1. Add tests for persisting a normalized listing into `SourceArtifact`, `ExternalProduct`, `MerchantProduct`, and `PricePoint`.
  2. Add a `ProductCompare.Ingestion.persist_normalized_listing/2` path that reuses source-scoped merchant identities and existing Catalog/Pricing schemas.
  3. Prove replay idempotency for the same normalized listing and an observed-at guard for stale price observations.
  4. Keep live provider polling, credentials, account-manager automation, and Tier-3 scraping blocked.
- Remaining blockers:
  - **Live CJ product-scope validation**
    - Owner: Ryan (backend/ingestion lead)
    - Target date: after Task 1 foundation lands
    - Unblock criteria: CJ credential path, quota behavior, and representative account-scoped sample payloads are recorded.
  - **Compliance signoff checklist process**
    - Owner: Ryan (interim compliance coordinator)
    - Target date: before any live provider polling or Tier-3 scraping activation
    - Unblock criteria: minimal source-agnostic Tier-1 provider onboarding checklist drafted and approved; named legal approver recorded before any Tier-3 scraping gate can open.

## Verification Commands

- `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs`
- `mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`
- `mix typecheck`
- `git diff --check`
- `rg -n "^" docs/work/product-data-scraping.md`
- `rg -n "^" docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
- `rg -n "^" docs/plans/2026-05-23-product-data-ingestion-foundation-implementation-plan.md`
- `rg -n "^" docs/decisions/2026-03-05-mvp-scope-freeze.md`
- `rg -n "^" docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`
- `rg -n "scraping|ingestion|Oban|Browse API|PA-API|Awin|Best Buy" docs`

## Deferred Note

- Data governance and privacy hardening tasks are intentionally deferred until further notice to prioritize a functioning first implementation.

## Just Completed

- Product Data Ingestion Foundation, Task 1:
  - Added `docs/decisions/2026-05-23-ingestion-execution-boundary.md` to record CJ-first source selection, eBay fallback criteria, sync pilot scope, and Oban revisit triggers.
  - Added `merchant_source_identities` persistence and `ProductCompareSchemas.Ingestion.MerchantSourceIdentity`.
  - Added `ProductCompare.Ingestion.resolve_merchant_identity/2` for deterministic source-scoped merchant identity resolution.
  - Added `ProductCompare.Ingestion.NormalizedListing`, source adapter behavior, a CJ fixture parser, and local fixture parser coverage.
  - Verified `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs`, `mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`, and `mix typecheck`.
