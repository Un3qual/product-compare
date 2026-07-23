# Ingestion Context Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-ingestion-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the decomposed facade, focused ingestion,
  enrichment, reconciliation, merchant-feed-candidate GraphQL, and full
  repository gates.

## Batch Outcome

`ProductCompare.Ingestion` remains the stable application-facing context while
import-run lifecycle, feed-candidate policy, merchant identity, and canonical
normalized-listing persistence implementations now live in focused
internal modules with unchanged public APIs, transactions, conflicts,
freshness, provenance, reconciliation, errors, and GraphQL behavior.

## Pre-decomposition Evidence

- Before this batch, `lib/product_compare/ingestion.ex` was 1,291 lines and
  owned four separately testable responsibilities: import-run lifecycle and
  reconciliation, merchant-feed-candidate query/review policy, merchant
  identity resolution, and the canonical listing persistence transaction.
- The public context was already a stable boundary used by Mix tasks,
  ingestion jobs, resolvers, GraphQL request loaders, fixtures, and tests, so
  extraction could preserve callers while narrowing implementation ownership.
- The selected four-suite characterization gate passed 57 tests on 2026-07-22.
  It covers run completion and reconciliation, candidate filtering/ranking and
  GraphQL behavior, merchant identity conflict/freshness behavior, canonical
  GTIN persistence, enrichment/provenance, offer and price persistence, replay,
  and stale observations.
- This structural row did not reopen deferred eBay, ingestion dashboard,
  operator, provider, credential, scheduling, or application-submission work.
  It was path-disjoint from the Discussions, Specs, and Commerce Attribution
  context rows because every caller continued to use its current facade.

## Internal Slices

1. Import-run lifecycle and reconciliation ownership extraction.
2. Merchant-feed-candidate query, ordering, and review ownership extraction.
3. Merchant identity resolution and freshness-safe conflict ownership.
4. Canonical normalized-listing transaction and persistence ownership.

## Boundaries

- Preserve every public `ProductCompare.Ingestion` function, arity, typespec,
  result, and error.
- Preserve transactions, conflict targets, locks, freshness comparisons,
  replay, reconciliation, product identity, enrichment, provenance, offer and
  price persistence, and alert enqueueing.
- Keep Mix tasks, jobs, resolvers, loaders, fixtures, and tests dependent only
  on the facade.
- Do not change schemas, migrations, GraphQL SDL, providers, scheduling,
  product policy, or deferred ingestion/operator scope.
- Use responsibility-focused modules; do not replace the monolith with generic
  callback dispatch or one renamed catch-all implementation module.

## Verification

- `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/enrichment_test.exs test/product_compare/ingestion/reconciliation_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

## Completion Evidence

- `ProductCompare.Ingestion` is a 75-line stable public facade.
  `Runs` is 63 lines, `FeedCandidates` is 171 lines,
  `MerchantIdentities` is 238 lines, and `ListingPersistence` is 840 lines.
- The exact four-suite characterization gate passed 57 tests with 0 failures.
  The earlier 60-test lane snapshot had drifted before implementation; the
  current baseline and completion command both executed the same four files.
- The internal-owner caller scan is empty outside the facade and the four
  implementation modules.
- Module-local Dialyzer annotations preserve existing fallback clauses whose
  reachability became more precise after extraction; no runtime clause or
  result was removed to satisfy static analysis.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check` passed. The queue validator
  reported three complete ready rows.
- `mix ci` passed 905 backend tests at 83.79% coverage, 1,507 frontend tests,
  Credo, Reach, ExDNA at the unchanged 6/6 clone budget, Dialyzer, Relay,
  TypeScript, both production builds, and the client-bundle contract.
