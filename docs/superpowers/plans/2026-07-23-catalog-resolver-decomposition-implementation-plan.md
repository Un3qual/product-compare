# Catalog Resolver Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompareWeb.Resolvers.CatalogResolver` as the stable
GraphQL resolver facade while moving catalog discovery and input
normalization, current-attribute projection, and saved-comparison behavior into
focused internal modules.

**Architecture:** The existing resolver remains the only schema- and
test-facing module and preserves every public callback, clause, result, and
error. `Discovery`, `InputNormalization`, `CurrentAttributes`, and
`SavedComparisons` receive the current implementations by responsibility
without changing GraphQL SDL, loader keys, query budgets, catalog policy, or
frontend contracts.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, Decimal, ExUnit.

## Global Constraints

- Preserve every existing `CatalogResolver` public function, clause, typespec,
  value, loader tuple, result, and error.
- Preserve connection arguments, loader sources and keys, filter and comparison
  validation, process-local unit-symbol caching, evidence bounds, correction
  counts, authorization, global-ID handling, and mutation payloads.
- If an unchanged path-scoped Dialyzer baseline moves with extracted code,
  relocate only that existing entry; do not add or broaden a suppression.
- Keep schema, type, and test callers dependent only on
  `ProductCompareWeb.Resolvers.CatalogResolver`.
- Do not change schemas, migrations, GraphQL SDL, Relay behavior, catalog,
  specification, taxonomy, or saved-comparison policy, query budgets, or
  frontend contracts.

---

### Task 1: Discovery And Input Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/catalog/discovery.ex`
- Create: `lib/product_compare_web/resolvers/catalog/input_normalization.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Test: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Test: `test/product_compare_web/graphql/catalog_filter_metadata_test.exs`
- Test: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:** `Discovery` owns product, comparison-product, product
connection, and product-filter-metadata resolution. `InputNormalization` owns
comparison slug validation plus product search, sort, taxon, use-case, numeric,
boolean, and enum filter normalization and semantic validation. The facade
retains `product/3`, `comparison_products/3`, `products/3`, and
`product_filter_metadata/3`.

- [ ] Run the three named discovery paths as the green characterization
  baseline.
- [ ] Move discovery resolution and input normalization behind the two focused
  owners without changing loader and fallback branches, query construction,
  batch windows, values, validation messages, or ordering.
- [ ] Replace facade implementations with explicit wrappers preserving
  clauses, typespecs, arguments, results, and errors.
- [ ] Re-run the three characterization paths and confirm discovery values,
  filters, validation, and fixed query budgets remain unchanged.
- [ ] Commit with message `refactor: isolate catalog resolver discovery`.

### Task 2: Current Attribute Projection Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/catalog/current_attributes.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Test: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Test: `test/product_compare_web/graphql/specification_corrections_test.exs`
- Test: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:** `CurrentAttributes` owns Dataloader and direct current-attribute
reads, taxon metadata merging, request-local base-unit symbol caching,
correction counts, value projection, evidence projection, and cache reset.
The facade retains `current_attributes/3`; discovery entry points continue to
reset the same request-local cache through the focused owner.

- [ ] Run the three named attribute paths before the extraction.
- [ ] Move current-attribute loading, metadata, formatting, evidence bounds,
  unit conversion presentation, correction counts, and cache behavior into
  `CurrentAttributes`.
- [ ] Add the explicit facade wrapper and preserve the exact process-local
  cache key supplied by the schema context.
- [ ] Re-run the three characterization paths and confirm attribute values,
  evidence, correction counts, unit symbols, loader batching, and cache
  isolation remain unchanged.
- [ ] Commit with message `refactor: isolate catalog attribute projection`.

### Task 3: Saved Comparison Resolver Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/catalog/saved_comparisons.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Test: `test/product_compare_web/graphql/saved_comparisons_test.exs`
- Test: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:** `SavedComparisons` owns owner-scoped connection reads, create
and delete input decoding, catalog calls, authorization fallbacks, and mutation
error payloads. The facade retains `my_saved_comparison_sets/3`,
`create_saved_comparison_set/3`, and `delete_saved_comparison_set/3`.

- [ ] Run the two named saved-comparison paths before the extraction.
- [ ] Move saved-comparison resolver implementations and payload helpers into
  `SavedComparisons` without changing ownership, loader and direct query
  branches, IDs, product limits, error codes, fields, messages, or values.
- [ ] Add explicit facade wrappers preserving typespecs, clauses, results, and
  errors.
- [ ] Re-run both characterization paths and confirm authorization, pagination,
  mutation results, validation, and fixed query budgets remain unchanged.
- [ ] Commit with message `refactor: isolate saved comparison resolution`.

### Task 4: Full Contract And Lane Gate

**Files:**

- Modify: `.dialyzer_ignore.exs`
- Modify: `docs/work/catalog-resolver-decomposition.md`

- [ ] Run the exact 100-test characterization command recorded in the lane doc.
- [ ] Relocate the existing catalog-resolver `MapSet.member?/2` Dialyzer
  baseline to `catalog/input_normalization.ex` with the unchanged call; do not
  add or broaden a suppression.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no schema, type, production, or test caller references
  `Resolvers.Catalog.Discovery`, `InputNormalization`, `CurrentAttributes`, or
  `SavedComparisons` directly.
- [ ] Record final ownership, facade and module sizes, exact test count, and
  gate results in the lane doc and include it in the final code/test milestone
  commit.
