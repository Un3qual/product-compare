# Product Data Scraping Work Doc

## Snapshot

- Status: live ready parallel batch
- Priority: P2
- Source of truth: this file
- Live queue row: promoted on 2026-07-01 as the CJ read-model and weekly
  operator-runbook parallel batch
- Last verified: 2026-06-27 after source-health focused tests, `mix typecheck`,
  and `git diff --check`
- Last plan refresh: 2026-07-01 after promoting the CJ read-model and weekly
  operator runbook candidate pool into the live queue
- Historical context:
  - `docs/decisions/2026-03-05-mvp-scope-freeze.md`
  - `docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`
  - `docs/implementation-checklist.md`
- Detailed plan:
  - `docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
- Active implementation plans:
  - `docs/plans/2026-07-01-cj-candidate-cohort-read-model-implementation-plan.md`
  - `docs/plans/2026-07-01-cj-candidate-market-coverage-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-candidate-freshness-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-run-health-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-run-throughput-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-import-artifact-quality-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-import-price-quality-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-merchant-identity-quality-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-application-readiness-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-weekly-operator-runbook-implementation-plan.md`
- Recently completed implementation plans:
  - `docs/plans/2026-06-27-project-source-health-read-model-implementation-plan.md`
- Previous implementation plans:
  - `docs/plans/2026-06-27-cj-product-import-resume-task-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-feed-discovery-resume-task-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-product-import-history-task-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-feed-discovery-history-task-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-feed-candidate-staleness-task-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-feed-candidate-batch-review-task-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-application-cohort-markdown-task-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-ingestion-readiness-gate-task-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-failed-run-report-task-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-feed-candidate-fit-gap-report-task-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-provider-credential-status-task-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-import-credential-preflight-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-feed-discovery-credential-preflight-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-application-cohort-report-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-product-import-status-task-implementation-plan.md`
  - `docs/plans/2026-06-26-scheduled-cj-product-import-runtime-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-feed-candidate-fit-score-sort-implementation-plan.md`
  - `docs/plans/2026-06-26-cj-feed-candidate-score-badges-implementation-plan.md`
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
- Run a weekly CJ-driven merchant discovery loop (candidate review -> scoring -> application cohort -> data viability check) so merchant growth and ingestion quality evolve together.
- Defer broad direct-site scraping until at least two official source connectors are operational.
- This is currently a personal project: record Ryan's owner approval for CJ account use instead of requiring external approval for Tier-1 CJ validation. Keep Tier-3 direct scraping out of scope for this batch.

## Current Batch

- Status: ready
- Batch: CJ read-model and weekly operator runbook live parallel batch.
- Plans:
  - `docs/plans/2026-07-01-cj-candidate-cohort-read-model-implementation-plan.md`
  - `docs/plans/2026-07-01-cj-candidate-market-coverage-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-candidate-freshness-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-run-health-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-run-throughput-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-import-artifact-quality-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-import-price-quality-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-merchant-identity-quality-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-application-readiness-read-model-implementation-plan.md`
  - `docs/plans/2026-06-27-cj-weekly-operator-runbook-implementation-plan.md`
- Decision:
  - Promote the CJ-only read-model/runbook candidate pool now that the
    usable-product, product filtering/in-depth comparison, and persistent
    compare tray queues have moved.
- Parallel slices:
  - Candidate cohort, market coverage, freshness, run health, run throughput,
    import artifact quality, import price quality, merchant identity quality,
    application readiness, and the weekly operator runbook.
- Work-item guardrails:
  - Read-model rows add one standalone read-only module plus focused tests.
  - The runbook row is docs-only for the workflow system and creates no
    execution surface.
  - Rows must not add scheduler behavior, GraphQL fields, browser routes,
    network calls, mutations, credential persistence, application submission, or
    CSV export paths.
  - Rows must not expose raw source-artifact payloads, artifact URLs, import
    queries, raw metadata, credentials, account ids, tracking params, provider
    error payloads, or secret values.
  - Parallel workers may edit only their row's target paths and the named
    evidence heading in this lane doc.

## Live Batch Evidence Headings

Parallel workers must add completion evidence only under their assigned heading.

### Candidate Cohort Evidence

- Worker implementation:
  - Added `ProductCompare.Ingestion.CJCandidateCohort.summary/1` as a safe,
    read-only CJ candidate cohort read model over `merchant_feed_candidates`.
  - Returned CJ-only pending, shortlisted, dismissed, and total review-status
    counts plus highest-fit shortlisted CJ candidates with explicit safe fields
    and derived `fit_score`.
  - Added focused tests for CJ-only counts, CJ-only fit-score ordering,
    same-score `last_seen_at`, advertiser name, feed name, provider feed id,
    and id tiebreaking, limit normalization, safe returned keys, and read-only
    behavior.
  - Red verification:
    initial `mix test test/product_compare/ingestion/cj_candidate_cohort_test.exs`
    stopped before compile because test dependencies had not been fetched in the
    worktree; after `mix deps.get`, the same focused test failed with undefined
    `ProductCompare.Ingestion.CJCandidateCohort.summary/0` and `summary/1`
    calls, 5 tests, 5 failures.
  - Green verification:
    `mix test test/product_compare/ingestion/cj_candidate_cohort_test.exs`
    passed with 5 tests, 0 failures.
  - Review follow-up verification:
    `mix test test/product_compare/ingestion/cj_candidate_cohort_test.exs`
    passed with 6 tests, 0 failures after adding explicit same-score,
    same-timestamp coverage for advertiser name, feed name, provider feed id,
    and id tiebreakers.
  - Final gates:
    `mix format --check-formatted`, `mix typecheck`, and `git diff --check`
    completed with exit 0.
  - Scope guardrails:
    no Mix task, GraphQL or browser route, mutation path, CJ network call,
    scheduler behavior, credential persistence, credential/account/tracking
    exposure, raw metadata exposure, provider payload exposure, or CSV export
    path was added.

### Candidate Market Coverage Evidence

- Added `ProductCompare.Ingestion.CJCandidateMarketCoverage` and
  `test/product_compare/ingestion/cj_candidate_market_coverage_test.exs` as a
  read-only CJ market coverage aggregate over persisted merchant feed
  candidates.
- Red verification:
  `mix test test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`
  failed with undefined `ProductCompare.Ingestion.CJCandidateMarketCoverage.summary/1`
  before the production module existed.
- Green focused verification:
  `mix test test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`
  passed with 3 tests, 0 failures.
- Final gates:
  `mix format --check-formatted`, `mix typecheck`, and `git diff --check`
  completed with exit 0.
- Guardrail evidence:
  no Mix task, GraphQL or browser route, mutation, network call, file write,
  raw metadata exposure, secret/account/tracking exposure, scheduler behavior,
  or CSV export path was added.

### Candidate Freshness Evidence

- Pending.

### Run Health Evidence

- Pending.

### Run Throughput Evidence

- Pending.

### Import Artifact Quality Evidence

- Pending.

### Import Price Quality Evidence

- Pending.

### Merchant Identity Quality Evidence

- Pending.

### Application Readiness Evidence

- Pending.

### Weekly Operator Runbook Evidence

- Pending.

## Recent Completed Batch

- Source health read model:
  - Plan:
    `docs/plans/2026-06-27-project-source-health-read-model-implementation-plan.md`
  - Decision:
    promote only one Product data scraping row so the active 2026-06-27 ten-row
    queue spanned the whole project instead of remaining CJ-only.
  - Parallel slice:
    add a provider-neutral source health read model over existing source,
    source-artifact, and ingestion-run data.
  - Work-item guardrails:
    the row added one standalone read-model module and focused tests; did not add
    Mix tasks, scheduler behavior, GraphQL fields, browser routes, network calls,
    mutations, raw source-artifact payload exposure, artifact URLs, import
    queries, credentials, account ids, tracking params, or provider error
    payloads.
  - Worker 10 implementation evidence:
    - Added `ProductCompare.Ingestion.SourceHealth` as a provider-neutral,
      read-only aggregate over sources, source artifacts, and ingestion runs.
    - Added focused tests covering active sources, no-activity sources,
      successful latest runs, failed runs inside and outside the recent window,
      failure-window clamping, and safe returned keys.
    - Red verification:
      `mix test test/product_compare/ingestion/source_health_test.exs` failed
      with undefined `ProductCompare.Ingestion.SourceHealth.summary/2`.
    - Green verification:
      `mix test test/product_compare/ingestion/source_health_test.exs` passed
      with 2 tests, 0 failures.
    - Typecheck: `mix typecheck` completed with exit 0.
    - Whitespace: `git diff --check` completed with exit 0.
- Credential readiness contract:
  - `CJ_API_TOKEN` and `CJ_ACCOUNT_ID` are required for CJ API use.
  - `CJ_PROPERTY_ID` is optional legacy Website/Property PID context and should
    be reported only by presence, never by value.
  - Blank or whitespace-only values count as missing.
  - Readiness output may include provider name, surface name, readiness boolean,
    counts, and missing env var names only.
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
  - Do not persist provider credentials or credential-derived config.
  - Do not call CJ, resolve sources, create import runs, persist candidates, or
    persist product records during credential preflight paths.
  - Do not add CJ candidate CSV export scoring or any new CSV export path; that
    direction has been explicitly rejected and should not be promoted in later
    queue work. Markdown or line-oriented stdout reports are allowed only when
    they are read-only, non-secret, and do not write files.
  - No Oban dependency, account-manager automation, merchant application
    contact, merchant application submission, live CJ network calls in tests,
    GraphQL/UI surfaces, credential persistence, or Tier-3 direct scraping in
    this batch.
- Next decision:
  - After the ten CJ read-model/operator rows complete, choose whether to expose
    these read models through a dashboard contract, continue with another
    source-health/dashboard slice, or explicitly defer further ingestion work.
  - Do not choose CJ candidate CSV score export; that path is rejected.

## Deferred Follow-Up Plan Candidates

- eBay Browse fallback connector remains blocked until CJ evidence shows the
  approved CJ account lacks usable product catalog scope.
- CJ candidate CSV score export is rejected and should not be promoted.

## Current Batch Verification Commands

- CJ candidate cohort read model:
  - `mix test test/product_compare/ingestion/cj_candidate_cohort_test.exs`
- CJ candidate market coverage read model:
  - `mix test test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`
- CJ candidate freshness read model:
  - `mix test test/product_compare/ingestion/cj_candidate_freshness_test.exs`
- CJ run health read model:
  - `mix test test/product_compare/ingestion/cj_run_health_test.exs`
- CJ run throughput read model:
  - `mix test test/product_compare/ingestion/cj_run_throughput_test.exs`
- CJ import artifact quality read model:
  - `mix test test/product_compare/ingestion/cj_import_artifact_quality_test.exs`
- CJ import price quality read model:
  - `mix test test/product_compare/ingestion/cj_import_price_quality_test.exs`
- CJ merchant identity quality read model:
  - `mix test test/product_compare/ingestion/cj_merchant_identity_quality_test.exs`
- CJ application readiness read model:
  - `mix test test/product_compare/ingestion/cj_application_readiness_test.exs`
- CJ weekly operator runbook:
  - `rg -n "T[O]DO|T[B]D|CJ candidate CSV score export is all[ow]ed|CJ_(API_T[O]KEN|ACCOUNT_ID)=[^[:space:]]+" docs/runbooks/cj-weekly-operator-loop.md`
    must exit 1 with no matches.
- Final gates:
  - `mix format --check-formatted` for Elixir read-model rows
  - `mix typecheck`
  - `git diff --check`
- Recently completed source health read model:
  - `mix test test/product_compare/ingestion/source_health_test.exs`
- Previous readiness batch verification commands:
  - Provider credential status:
    - `mix test test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs`
  - Product import credential preflight:
    - `mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs`
  - Feed discovery credential preflight:
    - `mix test test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`
  - Application cohort report:
    - `mix test test/mix/tasks/product_compare_ingestion_cj_application_cohort_test.exs`
  - Product import status:
    - `mix test test/mix/tasks/product_compare_ingestion_cj_import_status_test.exs`
  - Scheduled product import runtime:
    - `mix test test/product_compare/ingestion/cj_product_import_scheduler_test.exs`
    - `mix test test/product_compare/ingestion/cj_product_import_scheduler_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`
  - Combined final verification:
    - `mix test test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs test/mix/tasks/product_compare_ingestion_cj_application_cohort_test.exs test/mix/tasks/product_compare_ingestion_cj_import_status_test.exs test/product_compare/ingestion/cj_product_import_scheduler_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`
    - `mix typecheck`
    - `git diff --check`

## Recent Verification Commands

- CJ operator loop batch:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_import_resume_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_resume_test.exs test/mix/tasks/product_compare_ingestion_cj_import_history_test.exs test/mix/tasks/product_compare_ingestion_cj_discovery_history_test.exs test/mix/tasks/product_compare_ingestion_cj_candidate_staleness_test.exs test/mix/tasks/product_compare_ingestion_cj_candidate_review_batch_test.exs test/mix/tasks/product_compare_ingestion_cj_application_cohort_markdown_test.exs test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs test/mix/tasks/product_compare_ingestion_cj_failed_runs_test.exs test/mix/tasks/product_compare_ingestion_cj_candidate_fit_gaps_test.exs`
    - Result: passed, 67 tests, 0 failures.
  - `mix typecheck`
    - Result: completed with exit 0.
  - `git diff --check`
    - Result: completed with exit 0.
  - `mix format --check-formatted` for the ten new Mix tasks and focused test
    files
    - Result: completed with exit 0.
  - 5.5 xhigh review:
    - Result: no critical issues; important staleness contract and lane evidence
      findings fixed, minor discovery-history limit clamp fixed.
- Fit-score sort:
  - `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`
  - `cd assets && bun run relay`
  - `mix typecheck`
  - `git diff --check`
- Frontend score badges:
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Combined final verification:
  - `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
  - `cd assets && bun run relay`
  - `cd assets && bun run typecheck`
  - `mix typecheck`
  - `git diff --check`
- Secret/raw-metadata check:
  - `rg -n "CJ_API_TOKEN|CJ_ACCOUNT_ID|CJ_PROPERTY_ID|rawMetadata|raw_metadata|tracking|Tier-3" docs/work/product-data-scraping.md docs/work/index.md docs/plans/INDEX.md docs/plans/2026-06-26-cj-feed-candidate-fit-score-sort-implementation-plan.md docs/plans/2026-06-26-cj-feed-candidate-score-badges-implementation-plan.md assets/src/routes/ingestion/feed-candidates lib/product_compare_web/schema.ex test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`

### Frontend Score Badges Evidence

- Red verification:
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx` - failed before route changes: 1 file failed, 1 test failed, 13 tests passed; missing `Fit score 85`.
- Green verification:
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx` - passed, 1 file, 14 tests.
  - `cd assets && bun run typecheck` - `tsc --noEmit` completed with exit 0.
  - `git diff --check` - completed with exit 0.

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
      `latest_error_summary` included a CJ API token assignment and raw GraphQL/HTTP
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

### Provider Credential Status Task Evidence

- Completed
  `docs/plans/2026-06-26-cj-provider-credential-status-task-implementation-plan.md`.
- Added `mix product_compare.ingestion.cj_credentials` for redacted CJ
  credential readiness across `shoppingProducts` and `shoppingProductFeeds`.
- The task reports only provider/surface names, readiness booleans, counts, and
  missing env var names; it does not print token, account, or property values.
- Focused verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs`
    - Result: passed, 7 tests, 0 failures.
  - `mix typecheck`
    - Result: passed with no output.
  - `git diff --check`
    - Result: passed with no output.

### Product Import Credential Preflight Evidence

- Completed
  `docs/plans/2026-06-26-cj-import-credential-preflight-implementation-plan.md`.
- Added `--check-credentials` and `--require-ready` to
  `mix product_compare.ingestion.cj_import`.
- The preflight returns before source resolution, CJ fetcher calls,
  `ImportRun` creation, or product persistence and prints only the required env
  var names when credentials are missing.
- Focused verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs`
    - Result: passed, 8 tests, 0 failures before the background output
      follow-up; passed as part of the final combined gate with one added
      regression covering `print_report: false`.
  - `mix typecheck`
    - Result: passed with no output.
  - `git diff --check`
    - Result: passed with no output.

### Feed Discovery Credential Preflight Evidence

- Completed
  `docs/plans/2026-06-26-cj-feed-discovery-credential-preflight-implementation-plan.md`.
- Added `--check-credentials` and `--require-ready` to
  `mix product_compare.ingestion.cj_feeds`.
- The preflight returns before the configured discovery runner, source
  resolution, CJ transport, candidate persistence, or `ImportRun` persistence
  and prints only non-secret readiness fields.
- Focused verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`
    - Result: passed, 8 tests, 0 failures.
  - `mix typecheck`
    - Result: passed with no output.
  - `git diff --check`
    - Result: passed with no output.

### Application Cohort Report Evidence

- Completed
  `docs/plans/2026-06-26-cj-application-cohort-report-implementation-plan.md`.
- Added `mix product_compare.ingestion.cj_application_cohort` for read-only,
  non-secret review of CJ feed candidates by status, country, currency,
  language, product count, and limit.
- The report uses existing candidate rows only; it does not create merchants,
  applications, emails, provider calls, scheduled work, or CSV files.
- Focused verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_application_cohort_test.exs`
    - Result: passed, 6 tests, 0 failures.
  - `mix typecheck`
    - Result: passed with no output.
  - `git diff --check`
    - Result: passed with no output.

### Product Import Status Evidence

- Completed
  `docs/plans/2026-06-26-cj-product-import-status-task-implementation-plan.md`.
- Added `mix product_compare.ingestion.cj_import_status` for read-only status
  reporting over CJ `shoppingProducts` import runs.
- The task reports aggregate run and freshness fields only, ignores
  `shoppingProductFeeds` discovery runs, and redacts non-empty error summaries
  instead of printing raw provider or credential-bearing text.
- Focused verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_import_status_test.exs`
    - Result: passed, 6 tests, 0 failures.
  - `mix typecheck`
    - Result: passed with no output.
  - `git diff --check`
    - Result: passed with no output.

### Scheduled Product Import Runtime Evidence

- Completed
  `docs/plans/2026-06-26-scheduled-cj-product-import-runtime-implementation-plan.md`.
- Added disabled-by-default CJ `shoppingProducts` scheduling through
  `ProductCompare.Ingestion.CJProductImportScheduler`, runtime env config, and
  conditional supervision.
- Scheduler tests use an injected runner, pass only non-secret query bounds to
  the import runner, and verify success and failure paths reschedule without
  logging raw provider errors or credential values.
- Focused verification:
  - `mix test test/product_compare/ingestion/cj_product_import_scheduler_test.exs`
    - Result: passed, 5 tests, 0 failures before the background output
      follow-up; passed, 5 tests, 0 failures after suppressing manual import
      stdout for the scheduler default runner.
  - `mix test test/product_compare/ingestion/cj_product_import_scheduler_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`
    - Result: passed, 9 tests, 0 failures.
  - `mix typecheck`
    - Result: passed with no output.
  - `git diff --check`
    - Result: passed with no output.

### Six-Plan Combined Verification

- `mix test test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs test/mix/tasks/product_compare_ingestion_cj_application_cohort_test.exs test/mix/tasks/product_compare_ingestion_cj_import_status_test.exs test/product_compare/ingestion/cj_product_import_scheduler_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`
  - Result: passed, 45 tests, 0 failures after the scheduler background-output
    follow-up.
- `mix typecheck`
  - Result: passed with no output.
- `git diff --check`
  - Result: passed with no output.
- Spec review:
  - Required only plan/evidence corrections after implementation verification:
    the credential task output key is `missing_required`, and the application
    cohort task does not need an unused `Ecto.Query` import.
- Quality review:
  - No Critical issues.
  - Fixed the Important queue/documentation issue by returning the lane to a
    `needs_decision` dispatch row instead of leaving the completed batch as
    ready work.
  - Fixed the Minor scheduler output issue by adding a non-printing
    programmatic import path for the scheduler default runner while preserving
    manual CLI output.

### Fit Score Sort Evidence

- Red verification:
  - `mix test test/product_compare/ingestion/ingestion_test.exs` - failed before implementation: 25 tests, 1 failure because `:fit_score_desc` still fell back to name ordering.
  - `mix test test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs` - failed before schema update: 10 tests, 1 failure because `FIT_SCORE_DESC` was not a valid `MerchantFeedCandidateSort` value.
- Green verification:
  - `mix test test/product_compare/ingestion/ingestion_test.exs` - passed after context ordering implementation: 25 tests, 0 failures.
  - `mix test test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs` - passed after GraphQL enum update: 10 tests, 0 failures.
- Final verification:
  - `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs` - passed: 35 tests, 0 failures.
  - `cd assets && bun run relay` - first sandboxed run failed because Watchman could not `fchmod` `/Users/admin/.local/state/watchman/admin-state`; rerun with Watchman state access passed and compiled 29 reader, 28 normalization, and 28 operation text documents.
  - `mix typecheck` - passed with exit 0.
  - `git diff --check` - passed with exit 0.

### Combined Verification

- CSV export scoring was removed after user decision; it is not part of the
  active or deferred CJ scoring plan.
- Review:
  - Backend fit-score sort spec review approved with no issues.
  - Frontend score badge spec and quality reviews approved with no Critical,
    Important, or Minor issues.
- Verification:
  - `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`
    - Result: passed, 35 tests, 0 failures.
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
    - Result: passed, 1 file, 14 tests.
  - `cd assets && bun run relay`
    - Result: first sandboxed run failed because Watchman could not `fchmod`
      `/Users/admin/.local/state/watchman/admin-state`; rerun with Watchman
      state access passed and compiled 29 reader, 28 normalization, and 28
      operation text documents.
  - `cd assets && bun run typecheck`
    - Result: `tsc --noEmit` completed with exit 0.
  - `mix typecheck`
    - Result: passed with no output.
  - `git diff --check`
    - Result: passed with no output.

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

- Rejected CJ candidate CSV export. The old
  `mix product_compare.ingestion.cj_candidate_export` command now fails fast
  instead of rendering candidate data.
- Verification:
  - `mix test test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs`
    - rejection contract tests pass.
  - `mix typecheck` - passed.
  - `git diff --check` - passed.

## Just Completed

- Parallel CJ candidate planning batch:
  - Added backend ranking/filtering for CJ feed candidates through context and
    GraphQL query args.
  - Added current-page review counts, note capture, reviewed metadata, and
    optional note submission to `/ingestion/feed-candidates`.
  - Kept CJ candidate CSV export rejected; the old command fails fast.
  - Verified the combined backend/frontend gates plus Relay generation,
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
