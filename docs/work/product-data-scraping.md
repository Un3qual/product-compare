# Product Data Scraping Work Doc

## Snapshot

- Status: blocked
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-24 after Task 2 verification
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
- `ProductCompare.Ingestion.persist_normalized_listing/2` now persists fixture-backed normalized listings into `SourceArtifact`, `ExternalProduct`, catalog product shells, `MerchantProduct`, and `PricePoint` rows with replay idempotency and stale price-observation guards.

## Current Recommendation

- Start with a single Tier-1 connector MVP, defaulting to CJ because an approved account already exists and falling back to eBay only if CJ scope is insufficient for the first spike.
- Run a weekly CJ-driven merchant discovery loop (candidate export -> scoring -> application cohort -> data viability check) so merchant growth and ingestion quality evolve together.
- Defer broad direct-site scraping until at least two official source connectors are operational.
- Keep legal and compliance review as a hard gate for any Tier-3 scraping activation.

## Next Batch

- Status: blocked
- Batch: no unblocked local ingestion batch is queued from this worktree.
- Next unblock target: record live CJ credential access, quota behavior, representative account-scoped sample payloads, and the source onboarding compliance checklist before live provider polling or Tier-3 scraping work begins.
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

- Product Data Ingestion Persistence, Task 2:
  - Added `ProductCompare.Ingestion.persist_normalized_listing/2` to reuse source-scoped merchant identities while persisting normalized listings into source artifacts, external products, generated catalog product shells, merchant products, and price points.
  - Added replay idempotency for repeated normalized listings by reusing source artifacts, external products, merchant products, and price points.
  - Added stale-observation guards so older listing observations do not overwrite current merchant product state or add older price points.
  - Added database uniqueness indexes for replay-safe source artifact and price point writes.
  - Verified `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs` and `mix typecheck`.

- Product Data Ingestion Foundation, Task 1:
  - Added `docs/decisions/2026-05-23-ingestion-execution-boundary.md` to record CJ-first source selection, eBay fallback criteria, sync pilot scope, and Oban revisit triggers.
  - Added `merchant_source_identities` persistence and `ProductCompareSchemas.Ingestion.MerchantSourceIdentity`.
  - Added `ProductCompare.Ingestion.resolve_merchant_identity/2` for deterministic source-scoped merchant identity resolution.
  - Added `ProductCompare.Ingestion.NormalizedListing`, source adapter behavior, a CJ fixture parser, and local fixture parser coverage.
  - Verified `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs`, `mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`, and `mix typecheck`.
