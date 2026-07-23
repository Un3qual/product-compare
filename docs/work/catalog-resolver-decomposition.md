# Catalog Resolver Decomposition

## Snapshot

- Status: blocked
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-catalog-resolver-decomposition-implementation-plan.md`
- Last verified: 2026-07-23. The characterization, type, formatting, queue,
  caller, and diff-hygiene gates passed, but `mix ci` is blocked by an ExDNA
  clone-budget regression in the extracted facade.

## Batch Outcome

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

## Gate Evidence

- Ownership is complete but the lane is not complete: the stable 80-line
  `CatalogResolver` facade retains every public GraphQL callback and delegates
  discovery to the 107-line `Discovery`, input/filter normalization to the
  256-line `InputNormalization`, current-attribute loading and projection to
  the 224-line `CurrentAttributes`, and saved-comparison reads and mutations
  to the 155-line `SavedComparisons` (822 lines across the five modules).
- The exact characterization command passed 100 tests with 0 failures on
  2026-07-23:
  `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/specification_corrections_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs`.
- `mix typecheck` and `mix format --check-formatted` passed. `mix
  work_queue.validate` passed with 3 ready rows after the required local
  Mix.PubSub socket escalation. `git diff --check` passed.
- A repository caller scan of `lib` and `test`, excluding only the facade and
  the four internal owners, found no direct reference to
  `Resolvers.Catalog.Discovery`, `InputNormalization`, `CurrentAttributes`, or
  `SavedComparisons`. Schema, type, production, and test callers therefore
  remain on `ProductCompareWeb.Resolvers.CatalogResolver`.
- `mix ci` did not reach its test/build stages: ExDNA reports 7 clone groups
  against a configured budget of 6. The budget-exceeding group is the
  74-node duplicate between the facade's loader and non-loader clauses for
  `product/3`, `comparison_products/3`, and `products/3` (lines 12 and 26).
  The other six reported groups are within the configured budget. Credo found
  no issues before ExDNA stopped the gate; there were no compiler, type, or
  formatting warnings.
- This gate intentionally makes no production or test change. The owner must
  remove the facade duplication or otherwise restore the configured ExDNA
  budget, then rerun the full gate before the snapshot can be marked complete.
