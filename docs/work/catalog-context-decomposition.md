# Catalog Context Decomposition

## Snapshot

- Status: active
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-catalog-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 at claim time against the direct Catalog and
  Catalog GraphQL characterization suites.

## Target Outcome

`ProductCompare.Catalog` remains the stable application-facing context while
product/brand lifecycle, product evidence, and saved-comparison implementations
move into focused internal modules with unchanged public APIs, transactions,
queries, ordering, errors, owner scope, and GraphQL behavior.

## Ready Evidence

- `lib/product_compare/catalog.ex` is 482 lines and owns three independently
  reviewable implementation responsibilities in addition to delegating to the
  existing focused `Filtering` and `FilterMetadata` owners.
- The public context is used by ingestion, taxonomy, recommendations, SEO,
  loaders, resolvers, fixtures, and tests, so the facade can remain stable.
- The selected five-suite characterization gate passed 106 tests on
  2026-07-22.
- Existing `ProductCompare.Catalog.Filtering` and `FilterMetadata` remain the
  catalog-filter owners; this row does not change their policy or queries.
- The row is path-disjoint from Pricing, SEO, and Alerts decomposition.

## Internal Slices

1. Product and brand persistence, validation, slug identity, and read
   ownership.
2. Product identifier and media persistence and read ownership.
3. Owner-scoped saved-comparison lifecycle and query ownership.
4. Existing filtering and metadata facade parity.

## Boundaries

- Preserve every public function, guard, typespec, value, and error.
- Preserve conflict targets, type-taxon validation, historical slugs, filters,
  ordering, preloads, transactions, item positions, owner scope, and entropy-ID
  handling.
- Keep callers dependent only on `ProductCompare.Catalog`.
- Do not change schemas, migrations, GraphQL SDL, frontend contracts,
  ingestion, taxonomy policy, or product behavior.

## Verification

- `mix test test/product_compare/catalog test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/node_query_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
