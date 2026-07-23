# Ingestion Context Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-ingestion-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the live facade, direct ingestion,
  enrichment, reconciliation, and merchant-feed-candidate GraphQL suites.

## Target Outcome

`ProductCompare.Ingestion` will remain the stable application-facing context
while import-run lifecycle, feed-candidate policy, merchant identity, and
canonical normalized-listing persistence implementations move into focused
internal modules with unchanged public APIs, transactions, conflicts,
freshness, provenance, reconciliation, errors, and GraphQL behavior.

## Ready Evidence

- `lib/product_compare/ingestion.ex` is 1,291 lines and owns four separately
  testable responsibilities: import-run lifecycle and reconciliation,
  merchant-feed-candidate query/review policy, merchant identity resolution,
  and the canonical listing persistence transaction.
- The public context is already a stable boundary used by Mix tasks, ingestion
  jobs, resolvers, GraphQL request loaders, fixtures, and tests, so extraction
  can preserve callers while narrowing implementation ownership.
- The selected four-suite characterization gate passed 60 tests on 2026-07-22.
  It covers run completion and reconciliation, candidate filtering/ranking and
  GraphQL behavior, merchant identity conflict/freshness behavior, canonical
  GTIN persistence, enrichment/provenance, offer and price persistence, replay,
  and stale observations.
- This structural row does not reopen deferred eBay, ingestion dashboard,
  operator, provider, credential, scheduling, or application-submission work.
  It is path-disjoint from the Discussions, Specs, and Commerce Attribution
  context rows because every caller continues to use its current facade.

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
