# Specs Context Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-specs-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the live Specs facade and five direct
  consumer characterization suites.

## Target Outcome

`ProductCompare.Specs` will remain the stable caller-facing context while
definition upserts, typed-value normalization, claim/import workflows,
correction/moderation workflows, and read projections live in focused internal
modules with unchanged public APIs and behavior.

## Ready Evidence

- `ProductCompare.Specs` is 1,212 lines and owns five independently explainable
  responsibilities behind one stable public context boundary.
- Existing callers already depend only on the facade, so the implementation can
  move internals without changing resolver, ingestion, catalog, SEO,
  recommendation, comparison, or fixture call sites.
- Direct Specs, ingestion enrichment, catalog filter metadata/filtering, and
  recommendation characterization passed 79 tests on 2026-07-22.
- The owned source and direct tests are path-disjoint from the three higher-
  ranked ready structural rows.

## Internal Slices

1. Definition upsert, conversion, typed-value, and read ownership extraction.
2. Claim, imported-observation, evidence, and current-selection extraction.
3. Correction proposal, query/count, and moderation extraction.
4. Full public-contract, transaction, query-budget, and consumer parity.

## Boundaries

- Preserve every public function, arity, default, typespec, value, error,
  ordering rule, preload, query budget, transaction, and lock boundary.
- Preserve claim fingerprints, evidence excerpts, replay and auto-acceptance,
  correction idempotency and stale-current behavior, and moderation policy.
- Preserve typed values, numeric ranges/conversion, enum and unit validation,
  invalid-ID handling, source-artifact projection, and filter metadata.
- Keep every caller on `ProductCompare.Specs`; do not expose internal modules as
  a new application contract.
- Do not change schemas, migrations, GraphQL SDL, domain policy, or SQL
  semantics.

## Verification

- `mix test test/product_compare/specs test/product_compare/ingestion/enrichment_test.exs test/product_compare/catalog/filter_metadata_test.exs test/product_compare/catalog/filtering_regression_test.exs test/product_compare/recommendations_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
