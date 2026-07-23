# Catalog Context Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-catalog-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against the direct characterization suites, full
  repository CI, type, format, queue, caller-boundary, and diff gates.

## Batch Outcome

`ProductCompare.Catalog` remains the stable application-facing context while
product/brand lifecycle, product evidence, and saved-comparison implementations
now live in focused internal modules with unchanged public APIs, transactions,
queries, ordering, errors, owner scope, and GraphQL behavior.

## Completion Evidence

- `ProductCompare.Catalog` remains the only application-facing boundary and is
  now a 164-line facade preserving the existing public functions, clauses,
  guards, typespecs, values, and errors.
- `ProductCompare.Catalog.Products` (217 lines) owns product and brand
  persistence, type-taxon validation, canonical and historical slug identity,
  ID reads, and ordered batched slug projections.
- `ProductCompare.Catalog.Evidence` (95 lines) owns validated identifier
  persistence and reads plus replay-safe product-media upserts, ordering, and
  source-artifact preloads.
- `ProductCompare.Catalog.SavedComparisons` (168 lines) owns saved-set
  validation, atomic item persistence, owner-scoped queries and entropy-ID
  lookups, preloads, ordering, and stale-delete normalization.
- Existing `Filtering` and `FilterMetadata` remain the catalog-filter owners
  with unchanged entry points, policy, and queries.
- The application caller scan found zero direct references to `Products`,
  `Evidence`, or `SavedComparisons` outside the facade and internal Catalog
  implementation paths.
- The exact direct and GraphQL characterization command passed 106 tests with
  zero failures.
- The full contract and repository gate passed without changing schemas,
  migrations, GraphQL SDL, resolver authorization, frontend contracts,
  ingestion, taxonomy policy, or product behavior.
- The moved saved-comparison transaction carries a narrow in-module Dialyzer
  suppression for the same known Ecto opaque-type false positive previously
  ignored at the facade path; the dedicated Dialyzer gate and full CI both
  pass.

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
  passed 106 tests with zero failures.
- `mix typecheck` passed.
- `mix format --check-formatted` passed.
- `mix work_queue.validate` passed with three ready rows.
- `mix ci` passed: 909 backend tests at 83.53% coverage and 1,507 frontend
  tests had zero failures; Credo, Reach, ExDNA at 6/6, Dialyzer, Relay,
  TypeScript, client and SSR builds, and the 182,164-byte gzip client bundle
  contract also passed.
- `rg -n "Catalog\.(Products|Evidence|SavedComparisons)" lib --glob '!lib/product_compare/catalog.ex' --glob '!lib/product_compare/catalog/products.ex' --glob '!lib/product_compare/catalog/evidence.ex' --glob '!lib/product_compare/catalog/saved_comparisons.ex'`
  returned zero application-caller matches.
- `git diff --check` passed.

## Remaining Work

None in this lane. Comparison Snapshots, Taxonomy, and CJ Import Task
Decomposition remain ready in the live queue.
