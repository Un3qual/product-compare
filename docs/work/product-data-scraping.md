# Product Data Scraping Work Doc

## Snapshot

- Status: needs_decision
- Priority: P2
- Source of truth: this file
- Live queue row: coordinator decision required in `docs/work/index.md`
- Last verified: 2026-06-26 after scheduled CJ discovery runtime/status/frontend
  controls tests, Relay generation, frontend typecheck, `mix typecheck`, focused
  code reviews, and diff checks
- Last plan refresh: 2026-06-26 for scheduled CJ discovery runtime, status, and review-controls rows
- Historical context:
  - `docs/decisions/2026-03-05-mvp-scope-freeze.md`
  - `docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`
  - `docs/implementation-checklist.md`
- Detailed plan:
  - `docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
- Current implementation plan:
  - None. The 2026-06-26 scheduled CJ discovery parallel batch is complete.
- Previous implementation plans:
  - `docs/plans/2026-06-26-scheduled-cj-feed-discovery-runtime-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-feed-discovery-status-task-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-feed-candidate-filter-controls-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-feed-candidate-ranking-contract-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-feed-candidate-review-workspace-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-shortlist-cohort-export-implementation-plan.md`
  - `docs/plans/2026-06-04-cj-feed-candidate-review-status-implementation-plan.md`
  - `docs/plans/2026-06-04-cj-feed-candidate-review-implementation-plan.md`
  - `docs/plans/2026-06-04-cj-feed-candidate-capture-implementation-plan.md`
  - `docs/plans/2026-06-04-cj-ingestion-expansion-implementation-plan.md`
  - `docs/plans/2026-06-04-manual-cj-connector-implementation-plan.md`
  - `docs/plans/2026-06-01-live-cj-provider-validation-and-source-onboarding-implementation-plan.md`
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

## Current Batch

- Status: completed
- Batch: 2026-06-26 scheduled CJ discovery parallel batch.
- Plans:
  - `docs/plans/2026-06-26-scheduled-cj-feed-discovery-runtime-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-feed-discovery-status-task-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-feed-candidate-filter-controls-implementation-plan.md`
- Completed actions:
  - Extract reusable CJ feed discovery from the manual Mix task and add a
    disabled-by-default bounded runtime scheduler.
  - Add a read-only latest-run/freshness Mix task for CJ feed discovery.
  - Add review-status and sort controls to `/ingestion/feed-candidates` using
    existing backend query args.
- Secret handling:
  - Store local CJ credentials outside git in ignored `.env.local` or `.env` files, or export them in the shell before running a manual validation task.
  - Variable names: `CJ_API_TOKEN`, `CJ_ACCOUNT_ID`, and optional `CJ_PROPERTY_ID` for the older Website/Property PID.
  - Read secrets at the manual task/client boundary with `System.get_env/1`.
  - Do not commit tokens, account-sensitive tracking parameters, live credentials, or credential-derived config.
- CJ evidence already recorded for the manual connector path: credential access, product-scope validation, quota observation, representative redacted sample evidence, and owner approval.
- Scope guardrails:
  - `shoppingProducts` remains the manual product import surface.
  - `shoppingProductFeeds` may be scheduled only for bounded feed-candidate
    discovery and only when runtime env explicitly enables it.
  - Expose only non-secret candidate fields; do not expose raw provider metadata, credentials, account IDs, tokens, or tracking parameters.
  - No Oban dependency, provider credential config, account-manager automation,
    merchant application submission, product import scheduling, broad scoring
    algorithms, or Tier-3 direct scraping in this batch.
- Next decision:
  - Choose exactly one follow-up ingestion batch before implementation resumes:
    provider credential config, merchant application/account-manager automation,
    product import scheduling, broader candidate scoring, or explicit deferral.

## Verification Commands

- Scheduled discovery runtime:
  - `mix test test/product_compare/ingestion/cj_feed_discovery_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`
  - `mix typecheck`
  - `git diff --check`
- Discovery status:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`
  - `mix typecheck`
  - `git diff --check`
- Feed candidate controls:
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates-loader.test.ts test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
  - `cd assets && bun run relay`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- `rg -n "CJ_API_TOKEN|CJ_ACCOUNT_ID|CJ_PROPERTY_ID|rawMetadata|raw_metadata|tracking|Tier-3" docs/work/product-data-scraping.md docs/work/index.md docs/plans/INDEX.md docs/plans/2026-06-04-cj-feed-candidate-review-implementation-plan.md docs/decisions/2026-06-01-live-cj-provider-validation-and-source-onboarding.md assets/src/routes/ingestion/feed-candidates lib/product_compare_web/schema.ex test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`

## Scheduled Discovery Batch Evidence

### Combined Verification

- Focused runtime/status backend verification:
  - `mix test test/product_compare/ingestion/cj_feed_discovery_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`
    - Result: passed, 21 tests, 0 failures.
- Focused frontend verification:
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates-loader.test.ts test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
    - Result: passed, 2 files, 22 tests.
- Generated artifacts and typechecks:
  - `cd assets && bun run relay`
    - Result: completed; compiled 29 reader, 28 normalization, and 28 operation
      text documents.
  - `cd assets && bun run typecheck`
    - Result: `tsc --noEmit` completed with exit 0.
  - `mix typecheck`
    - Result: passed with no output.
  - `git diff --check`
    - Result: passed with no output.
- Review:
  - Runtime reviewer approved after the Logger follow-up; no remaining Critical
    or Important issues.
  - Status reviewer approved after error-summary sanitization; no remaining
    Critical or Important issues.
  - Frontend reviewer approved with no Critical, Important, or Minor issues.

### Scheduled Discovery Runtime

- Completed
  `docs/plans/2026-06-26-scheduled-cj-feed-discovery-runtime-implementation-plan.md`.
- Red verification:
  - `mix test test/product_compare/ingestion/cj_feed_discovery_test.exs`
    - Result: failed as expected with 5 failures because
      `ProductCompare.Ingestion.CJFeedDiscovery.run/1` was undefined.
  - `mix test test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`
    - Result: failed as expected with 4 failures because
      `ProductCompare.Ingestion.CJFeedDiscoveryScheduler` did not exist.
  - `mix test test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`
    - Result: failed as expected with 1 failure because the Mix task did not
      print the report before raising on `{:row_failures, report}`.
- Green verification:
  - `mix test test/product_compare/ingestion/cj_feed_discovery_test.exs`
    - Result: passed, 5 tests, 0 failures.
  - `mix test test/product_compare/ingestion/cj_feed_discovery_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`
    - Result: passed, 8 tests, 0 failures.
  - `mix test test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`
    - Result: passed, 4 tests, 0 failures.
  - `mix test test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`
    - Result: passed, 4 tests, 0 failures.
- Final verification:
  - `mix test test/product_compare/ingestion/cj_feed_discovery_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`
    - Result: passed, 13 tests, 0 failures.
  - `mix typecheck`
    - Result: passed with no output.
  - `git diff --check`
    - Result: passed with no output.
- Follow-up review fix:
  - Removed global `Logger.configure/1` quieting from
    `ProductCompare.Ingestion.CJFeedDiscovery.run/1`; manual Mix task quieting
    remains local to `mix product_compare.ingestion.cj_feeds`.
- Follow-up red verification:
  - `mix test test/product_compare/ingestion/cj_feed_discovery_test.exs`
    - Result: failed as expected with 1 failure because the injected fetcher
      observed Logger level `:warning` instead of the caller's `:debug`.
- Follow-up green verification:
  - `mix test test/product_compare/ingestion/cj_feed_discovery_test.exs`
    - Result: passed, 6 tests, 0 failures.
- Follow-up final verification:
  - `mix test test/product_compare/ingestion/cj_feed_discovery_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`
    - Result: passed, 14 tests, 0 failures.
  - `mix typecheck`
    - Result: passed with no output.
  - `git diff --check`
    - Result: passed with no output.

### Discovery Status

- Completed `docs/plans/2026-06-26-cj-feed-discovery-status-task-implementation-plan.md`.
- Red verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`
    - Result: failed as expected with 6 failures because
      `Mix.Tasks.ProductCompare.Ingestion.CjDiscoveryStatus.run/1` was undefined.
  - `mix test test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`
    - Result: failed as expected with 1 failure because multiline
      `latest_error_summary` output split the compact line-oriented report.
- Green verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`
    - Result: passed, 6 tests, 0 failures.
  - `mix test test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`
    - Result: passed, 6 tests, 0 failures after single-line value formatting.
- Final verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`
    - Result: passed, 6 tests, 0 failures.
  - `mix typecheck`
    - Result: passed with no output.
  - `git diff --check`
    - Result: passed with no output.
- Follow-up review fix:
  - Sanitized persisted `latest_error_summary` output so the status task never
    echoes raw provider/client error text, live payloads, account IDs, tokens, or
    tracking parameters.
- Follow-up red verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`
    - Result: failed as expected with 1 failure because
      `latest_error_summary` included `CJ_API_TOKEN=secret` and raw GraphQL/HTTP
      body text.
- Follow-up green verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`
    - Result: passed, 7 tests, 0 failures.
- Follow-up final verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`
    - Result: passed, 7 tests, 0 failures.
  - `mix typecheck`
    - Result: passed with no output.
  - `git diff --check`
    - Result: passed with no output.

### Feed Candidate Controls

- Completed
  `docs/plans/2026-06-26-cj-feed-candidate-filter-controls-implementation-plan.md`.
- Red verification:
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates-loader.test.ts` - failed before implementation: 1 file failed, 8 tests failed because loader data and preload variables lacked `reviewStatus` and `sort`.
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx` - failed before implementation: 1 file failed, 4 tests failed and 10 passed because filter controls were missing and pagination links omitted selected filters.
- Final verification:
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates-loader.test.ts test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx` - 2 files passed, 22 tests passed.
  - `cd assets && bun run relay` - completed; compiled 29 reader, 28 normalization, and 28 operation text documents.
  - `cd assets && bun run typecheck` - `tsc --noEmit` completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Deferred Note

- Data governance and privacy hardening tasks are intentionally deferred until further notice to prioritize a functioning first implementation.

## Parallel Batch Evidence

### Combined Verification

- Final spec reviewer status: approved, with no missing requirements,
  over-scope implementation, forbidden-path edits, or docs evidence
  inconsistencies found.
- Verification:
  - `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs` - 39 tests, 0 failures.
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx` - 1 file, 11 tests passed.
  - `cd assets && bun run relay` - completed.
  - `cd assets && bun run typecheck` - passed.
  - `mix typecheck` - passed.
  - `git diff --check` - passed.

### Ranking Contract

- Added backend `review_status` filtering and deterministic candidate ordering
  for `name_asc`, `product_count_desc`, and `last_seen_desc`, preserving the
  zero-arity query helper behavior.
- Added GraphQL `MerchantFeedCandidateSort` plus `reviewStatus` and `sort`
  args on `merchantFeedCandidates`; refreshed `assets/schema.graphql` for Relay.
- Verification:
  - `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs` - 33 tests, 0 failures.
  - `cd assets && bun run relay` - completed.
  - `mix typecheck` - passed.
  - `git diff --check` - passed.

### Review Workspace

- Added current-page pending/shortlisted/dismissed review counts, existing
  review note and reviewed timestamp display, per-candidate note capture, and
  trimmed optional note submission for `reviewMerchantFeedCandidate`.
- Verification:
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
    - 1 file, 11 tests passed.
  - `cd assets && bun run typecheck` - passed.
  - `git diff --check` - passed.

### Shortlist Export

- Added `mix product_compare.ingestion.cj_candidate_export` for read-only,
  non-secret CJ feed candidate CSV export with default shortlisted status,
  explicit pending/shortlisted/dismissed status filtering, direct candidate
  queries, CSV escaping, and raw metadata exclusion.
- Verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs`
    - 6 tests, 0 failures.
  - `mix typecheck` - passed.
  - `git diff --check` - passed.

## Just Completed

- Parallel CJ candidate planning batch:
  - Added backend ranking/filtering for CJ feed candidates through context and
    GraphQL query args.
  - Added current-page review counts, note capture, reviewed metadata, and
    optional note submission to `/ingestion/feed-candidates`.
  - Added `mix product_compare.ingestion.cj_candidate_export` for non-secret
    reviewed candidate CSV export.
  - Verified the combined backend/export/frontend gates plus Relay generation,
    typechecks, final spec review, and `git diff --check`.

- CJ feed candidate review status:
  - Added durable `review_status`, `review_note`, and `reviewed_at` fields to `merchant_feed_candidates`, with `pending`, `shortlisted`, and `dismissed` as the allowed review states.
  - Added `ProductCompare.Ingestion.review_merchant_feed_candidate/2` while preserving review state during feed-discovery replays.
  - Added GraphQL `reviewMerchantFeedCandidate(input:)` plus review fields on the existing `merchantFeedCandidates` read model.
  - Updated `/ingestion/feed-candidates` to show current review status and commit Shortlist, Dismiss, and Reset actions through Relay.
  - Verified `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`, `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/ingestion/feed-candidates/__tests__/feed-candidates-loader.test.ts src/routes/ingestion/feed-candidates/__tests__/feed-candidates.route.test.tsx`, `cd assets && bun run typecheck`, `mix typecheck`, and `git diff --check`.

- CJ feed candidate review:
  - Added `ProductCompare.Ingestion.list_merchant_feed_candidates_query/0`.
  - Added `ProductCompareWeb.Resolvers.IngestionResolver.merchant_feed_candidates/3`.
  - Added `MerchantFeedCandidate` GraphQL type, connection, query field, and global ID encoding support without adding root `node(id:)` lookup.
  - Updated `assets/schema.graphql`, added `MerchantFeedCandidatesRouteQuery`, generated `MerchantFeedCandidatesRouteQuery.graphql.ts`, and mounted `/ingestion/feed-candidates`.
  - Added read-only route loading, pagination, empty/error states, and focused loader/route tests.
  - Verified `mix test test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs test/product_compare/ingestion/ingestion_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`, `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/ingestion/feed-candidates/__tests__/feed-candidates-loader.test.ts src/routes/ingestion/feed-candidates/__tests__/feed-candidates.route.test.tsx`, `cd assets && bun run typecheck`, `mix typecheck`, the secret/raw metadata scan, and `git diff --check`.

- CJ feed candidate capture:
  - Added `merchant_feed_candidates` plus `ProductCompareSchemas.Ingestion.MerchantFeedCandidate` for non-secret, source-scoped CJ feed metadata.
  - Added `ProductCompare.Ingestion.upsert_merchant_feed_candidate/2` and `list_merchant_feed_candidates/1`.
  - Updated `mix product_compare.ingestion.cj_feeds` to persist each fetched feed as a candidate and report `candidates_persisted`.
  - Live feed discovery reported `feeds_fetched=1 candidates_persisted=1 pages_fetched=1 failed=0`.
  - Non-secret row counts after live discovery: `merchant_feed_candidates=1`.
  - Latest non-secret feed run metadata: `status=succeeded`, `pages_requested=1`, `pages_fetched=1`, `records_fetched=1`, `records_persisted=1`, `records_failed=0`, `cursor_start=0`, `cursor_end=1`.
  - Verified `mix test test/product_compare/ingestion/ingestion_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`, `mix test test/product_compare/ingestion/sources/cj/client_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs`, `mix typecheck`, and `git diff --check`.

- CJ ingestion expansion:
  - Added `ingestion_runs` plus `ProductCompareSchemas.Ingestion.ImportRun` and `ProductCompare.Ingestion.start_import_run/1` / `complete_import_run/2` for durable run metadata.
  - Updated `mix product_compare.ingestion.cj_import` to record completed runs with cursor, page, and record counts.
  - Added `ProductCompare.Ingestion.Sources.CJ.Client.fetch_feeds/2` and `mix product_compare.ingestion.cj_feeds` for manual `shoppingProductFeeds` discovery.
  - Added bounded manual product pagination through `--pages`; imports stop when the page limit is reached or CJ returns no next cursor.
  - Live feed discovery reported `feeds_fetched=1 pages_fetched=1 failed=0`.
  - Bounded live product import requested two pages and reported `fetched=1 normalized=1 persisted=1 failed=0 pages_fetched=1` because CJ returned no next cursor after the first page.
  - Latest non-secret run metadata: `shoppingProducts` succeeded with `pages_requested=2`, `pages_fetched=1`, `records_fetched=1`, `records_persisted=1`, `records_failed=0`, `cursor_start=0`, `cursor_end=nil`; `shoppingProductFeeds` succeeded with `pages_requested=1`, `pages_fetched=1`, `records_fetched=1`, `records_persisted=0`, `records_failed=0`, `cursor_start=0`, `cursor_end=1`.
  - Non-secret row counts after replay: CJ source-scoped `source_artifacts=1`, `external_products=1`, `merchant_source_identities=1`; current dev pricing totals `merchant_products=2`, `price_points=4`.
  - Verified `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/client_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`, `mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`, `mix typecheck`, and `git diff --check`.

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
