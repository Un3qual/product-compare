# Catalog Resolver Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-catalog-resolver-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against catalog discovery, filter metadata,
  current-attribute, saved-comparison, and Dataloader characterization paths.

## Target Outcome

`ProductCompareWeb.Resolvers.CatalogResolver` remains the stable GraphQL
resolver facade while catalog discovery and input normalization,
current-attribute projection, and saved-comparison behavior move into focused
internal modules with unchanged public callbacks, loader keys, query budgets,
values, authorization, mutation payloads, and errors.

## Ready Evidence

- `lib/product_compare_web/resolvers/catalog_resolver.ex` is 720 lines and owns
  four concrete responsibilities: discovery resolution, input normalization,
  current-attribute projection, and saved-comparison resolution.
- `lib/product_compare_web/schema.ex`,
  `lib/product_compare_web/schema/types/catalog.ex`, and direct tests all use
  the stable resolver facade, so ownership can move without caller changes.
- The selected five-suite characterization gate passed 100 tests on
  2026-07-23.
- Discovery plus its shared input policy, current attributes, and saved
  comparisons share one GraphQL catalog-resolver acceptance boundary and are
  internal slices rather than separate queue batches.
- The implementation paths are disjoint from Taxonomy, CJ Import, and CJ Runs
  decomposition.

## Internal Slices

1. Catalog discovery resolver ownership.
2. Catalog resolver input normalization ownership.
3. Current-attribute loading and projection ownership.
4. Saved-comparison resolver ownership.

## Boundaries

- Preserve every public resolver function, clause, typespec, value, loader
  tuple, result, and error.
- Preserve connection arguments, loader sources and keys, filter and
  comparison validation, request-local cache behavior, evidence bounds,
  correction counts, authorization, global IDs, and mutation payloads.
- Keep schema, type, production, and test callers dependent only on
  `ProductCompareWeb.Resolvers.CatalogResolver`.
- Do not change schemas, migrations, GraphQL SDL, Relay behavior, catalog,
  specification, taxonomy, saved-comparison, query-budget, or frontend policy.

## Verification

- `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/specification_corrections_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
