# Catalog Resolver Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-catalog-resolver-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 with the exact 100-test characterization gate,
  typechecking, formatting, Dialyzer, full `mix ci`, caller-boundary scan, and
  diff hygiene green.

## Batch Outcome

`ProductCompareWeb.Resolvers.CatalogResolver` remains the stable GraphQL
resolver facade while catalog discovery and input normalization,
current-attribute projection, and saved-comparison behavior move into focused
internal modules with unchanged public callbacks, loader keys, query budgets,
values, authorization, mutation payloads, and errors.

## Pre-decomposition Evidence

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
- Relocate only the existing path-scoped `MapSet.member?/2` Dialyzer baseline
  with its unchanged call; do not add or broaden a suppression.
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

## Completion Evidence

- Ownership is complete: the stable 65-line `CatalogResolver` facade retains
  every public GraphQL callback and the request cache-clear boundary;
  `Discovery` is 107 lines and owns catalog discovery and filter metadata;
  `InputNormalization` is 256 lines and owns comparison-slug and filter
  normalization; `CurrentAttributes` is 224 lines and owns Dataloader-backed
  loading and projection; and `SavedComparisons` is 155 lines and owns
  owner-scoped reads and mutations. The five modules total 807 lines.
- The exact five-file characterization command passed 100 tests with 0
  failures on 2026-07-23. `mix typecheck`, `mix format --check-formatted`, and
  `git diff --check` passed. `mix work_queue.validate` passed with 3 ready
  rows after the required local Mix.PubSub socket escalation.
- `mix dialyzer` passed with the historical 11 skipped warnings and 8
  unnecessary skips. The existing path-scoped `member?/2` baseline entry moved
  unchanged from `catalog_resolver.ex` to `input_normalization.ex` with the
  identical warning text, because the unchanged call moved with the extracted
  implementation.
- Full `mix ci` passed: Credo found no issues across 352 source files; ExDNA
  remained at the configured 6/6 clone budget; cross-function detection found
  no issues with 33 baseline findings suppressed; Dialyzer passed; 909 backend
  tests passed with 0 failures at 83.44% total coverage; Relay and TypeScript
  validation passed; 105 frontend test files and 1,507 tests passed; client
  and SSR production builds passed; and the client-bundle contract passed at
  182,164 gzip bytes against its 200,000-byte budget.
- The CI output retained non-failing baseline diagnostics: six ExDNA clone
  groups within budget, 33 suppressed cross-function findings, expected test
  warning logs from failure-path fixtures, and Vite's existing large-chunk
  advisory for the 596,440-byte raw client chunk. None failed the gate.
- A caller scan of `lib` and `test`, excluding only the facade and four
  implementation owners, found no direct reference to
  `Resolvers.Catalog.Discovery`, `InputNormalization`, `CurrentAttributes`, or
  `SavedComparisons`. Schema, type, production, and test callers remain on
  `ProductCompareWeb.Resolvers.CatalogResolver`.
