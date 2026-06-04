# Product Data Scraping Work Doc

## Snapshot

- Status: done
- Priority: P2
- Source of truth: this file
- Live queue row: `docs/work/index.md`
- Last verified: 2026-06-04 after the live manual CJ import persisted one source-scoped row and replay remained idempotent
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
- The legacy REST Product Search endpoint is deprecated. Use CJ's current Product Feed GraphQL surface at `https://ads.api.cj.com/query`, starting with `shoppingProducts`.
- Run a weekly CJ-driven merchant discovery loop (candidate export -> scoring -> application cohort -> data viability check) so merchant growth and ingestion quality evolve together.
- Defer broad direct-site scraping until at least two official source connectors are operational.
- This is currently a personal project: record Ryan's owner approval for CJ account use instead of requiring external approval for Tier-1 CJ validation. Keep Tier-3 direct scraping out of scope for this batch.

## Next Batch

- Status: done
- Batch: manual CJ connector MVP complete.
- Next action: none queued. Promote a new dated plan before adding scheduled polling, broader merchant/feed discovery, recurring jobs, or Tier-3 direct scraping.
- Secret handling:
  - Store local CJ credentials outside git in ignored `.env.local` or `.env` files, or export them in the shell before running a manual validation task.
  - Variable names: `CJ_API_TOKEN`, `CJ_ACCOUNT_ID`, and optional `CJ_PROPERTY_ID` for the older Website/Property PID.
  - Read secrets at the manual task/client boundary with `System.get_env/1`.
  - Do not commit tokens, account-sensitive tracking parameters, live credentials, or credential-derived config.
- Owner approval: Ryan approves CJ account use for this personal project and permits one small redacted account-scoped sample fixture for validation.
- Scope guardrails:
  - `shoppingProducts` is the first connector surface.
  - `shoppingProductFeeds` is available for later feed discovery if joined product search is too narrow.
  - No scheduled polling, Oban jobs, provider credential config, account-manager automation, or Tier-3 direct scraping in this batch.

## Verification Commands

- `set -a; . ./.env.local; set +a; mix product_compare.ingestion.cj_import --keywords shoe --limit 1`
- Inspect persisted CJ row counts without printing raw payloads.
- `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs`
- `mix test test/product_compare/ingestion/sources/cj/client_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs`
- `mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`
- `mix typecheck`
- `git diff --check`
- `rg -n "CJ_API_TOKEN|CJ_ACCOUNT_ID|CJ_PROPERTY_ID|ads.api.cj.com|shoppingProducts|Tier-3" docs/work/product-data-scraping.md docs/work/index.md docs/plans/INDEX.md docs/plans/2026-06-04-manual-cj-connector-implementation-plan.md docs/decisions/2026-06-01-live-cj-provider-validation-and-source-onboarding.md`

## Deferred Note

- Data governance and privacy hardening tasks are intentionally deferred until further notice to prioritize a functioning first implementation.

## Just Completed

- Live CJ provider validation, Task 1:
  - Confirmed the legacy REST Product Search endpoint returns a deprecation response pointing to `ads.api.cj.com`.
  - Introspected CJ's GraphQL surface and validated `shoppingProducts(companyId, keywords: ["shoe"], partnerStatus: JOINED, limit: 1, offset: 0, currency: "USD", serviceableAreas: "US")`.
  - Added `docs/decisions/2026-06-01-live-cj-provider-validation-and-source-onboarding.md` with non-secret credential handling, product-scope evidence, owner approval, and Tier-3 scraping deferral.
  - Added `test/support/fixtures/cj/product_validation_sample.redacted.json` preserving the live GraphQL field shape without credentials or account-sensitive values.
  - Extended `ProductCompare.Ingestion.Sources.CJ.ProductParser.normalize/1` to handle GraphQL `shoppingProducts` aliases and nested price values.
  - Verified `mix test test/product_compare/ingestion/sources/cj/product_parser_test.exs` and `mix test test/product_compare/ingestion/ingestion_test.exs`.

- Manual CJ connector implementation:
  - Added `ProductCompare.Ingestion.Sources.CJ.Client` for env-var-backed `shoppingProducts` GraphQL requests with injected transport support for tests.
  - Wired `ProductCompare.Ingestion.Sources.CJ.ProductParser.fetch_batch/2` to the CJ client while keeping normalization in the parser.
  - Added `mix product_compare.ingestion.cj_import` for one-page manual imports through `ProductCompare.Ingestion.persist_normalized_listing/2`.
  - Added focused client, parser delegation, and Mix task coverage without live network calls.
  - Verified `mix test test/product_compare/ingestion/sources/cj/client_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs test/product_compare/ingestion/ingestion_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs` and `mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`.

- Live manual CJ import verification:
  - Ran `set -a; . ./.env.local; set +a; mix product_compare.ingestion.cj_import --keywords shoe --limit 1`.
  - The task reported `fetched=1 normalized=1 persisted=1 failed=0`.
  - Re-ran the task after suppressing debug-level SQL logging; it again reported `fetched=1 normalized=1 persisted=1 failed=0`.
  - Source-scoped row counts after replay: `source_artifacts=1`, `external_products=1`, `merchant_source_identities=1`, `merchant_products=1`, `price_points=1`.

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
