# Product Data Scraping Work Doc

## Snapshot

- Status: ready
- Priority: P2
- Source of truth: this file
- Live queue row: `docs/work/index.md`
- Last verified: 2026-06-04 after collaborative planning promoted CJ Product Search validation to a ready manual evidence-and-fixture batch
- Historical context:
  - `docs/decisions/2026-03-05-mvp-scope-freeze.md`
  - `docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`
  - `docs/implementation-checklist.md`
- Detailed plan:
  - `docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
- Current implementation plan:
  - `docs/plans/2026-06-01-live-cj-provider-validation-and-source-onboarding-implementation-plan.md`
- Previous implementation plan:
  - `docs/plans/2026-05-23-product-data-ingestion-foundation-implementation-plan.md`
- Objective:
  - Re-activate deferred ingestion work with a source-first plan that specifies where product data comes from, how it is fetched through approved provider surfaces, and how it lands in existing Catalog/Pricing models.

## Research Summary

A parallel doc research pass covered provider APIs/feeds plus crawl standards. The resulting plan favors an acquisition ladder:

1. Tier 1: official APIs and affiliate feeds (CJ, eBay, Best Buy, Awin, Amazon PA-API).
2. Tier 2: merchant-provided feeds and exports.
3. Tier 3: selective direct scraping only behind a later explicit owner, terms, and robots gate.

## Verified Current State

- Scraping job orchestration remains deferred during MVP+1 ingestion foundation work.
- Existing `Catalog`, `Specs`, and `Pricing` context boundaries already provide persistence targets for normalized ingestion records.
- `ProductCompare.Ingestion` now owns the source-agnostic normalized listing contract, source adapter behavior, CJ fixture parser, and source-scoped merchant identity resolution.
- `merchant_source_identities` now persists deterministic source-to-merchant links for replay-safe imports.
- `ProductCompare.Ingestion.persist_normalized_listing/2` now persists fixture-backed normalized listings into `SourceArtifact`, `ExternalProduct`, catalog product shells, `MerchantProduct`, and `PricePoint` rows with replay idempotency and stale price-observation guards.

## Current Recommendation

- Start with a single Tier-1 connector MVP, defaulting to CJ because an approved account already exists and falling back to eBay only if CJ scope is insufficient for the first spike.
- Validate CJ Product Search first because it gives the fastest account-scoped proof of product scope, quota behavior, and mapping shape. Treat Product Feeds as a fallback or follow-up if Product Search is missing or too limited.
- Run a weekly CJ-driven merchant discovery loop (candidate export -> scoring -> application cohort -> data viability check) so merchant growth and ingestion quality evolve together.
- Defer broad direct-site scraping until at least two official source connectors are operational.
- This is currently a personal project: record Ryan's owner approval for CJ account use instead of requiring external approval for Tier-1 CJ validation. Keep Tier-3 direct scraping out of scope for this batch.

## Next Batch

- Status: ready
- Batch: Task 1 in `docs/plans/2026-06-01-live-cj-provider-validation-and-source-onboarding-implementation-plan.md`.
- Next action: run a manual CJ Product Search validation using local runtime environment variables only, capture product surface and quota evidence, commit one redacted account-scoped fixture, and cover that fixture with parser and persistence tests.
- Secret handling:
  - Store local CJ credentials outside git in ignored `.env.local` or `.env` files, or export them in the shell before running a manual validation task.
  - Planned variable names: `CJ_API_TOKEN`, `CJ_ACCOUNT_ID`, and `CJ_WEBSITE_ID`, adjusted only if CJ's Product Search auth contract requires different names.
  - Read secrets at the manual task/client boundary with `System.get_env/1`.
  - Do not commit tokens, account-sensitive tracking parameters, live credentials, or credential-derived config.
- Owner approval: Ryan approves CJ account use for this personal project and permits one small redacted account-scoped sample fixture for validation.
- Scope guardrails:
  - Product Search is the first validation surface.
  - Product Feeds are fallback or follow-up if Product Search is unavailable or insufficient.
  - No scheduled polling, Oban jobs, provider credential config, account-manager automation, or Tier-3 direct scraping in this batch.

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
