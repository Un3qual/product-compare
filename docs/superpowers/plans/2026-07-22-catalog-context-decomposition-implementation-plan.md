# Catalog Context Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Catalog` as the stable public context while
moving product/brand lifecycle, product evidence, and saved-comparison
implementations into focused internal modules.

**Architecture:** `ProductCompare.Catalog` remains the only caller-facing
facade and preserves every public function, arity, typespec, result, and error.
Three `ProductCompare.Catalog.*` owners receive the existing implementations by
responsibility, while `Filtering` and `FilterMetadata` remain the established
catalog-filter owners.

**Tech Stack:** Elixir, Ecto, PostgreSQL, ExUnit, Absinthe.

## Global Constraints

- Preserve every existing `ProductCompare.Catalog` public function, arity,
  guard, typespec, value, exception, and error.
- Preserve conflict targets, validation, ordering, filters, transactions,
  preloads, owner scope, entropy-ID handling, and historical slug behavior.
- Keep application callers dependent only on the facade.
- Do not change schemas, migrations, GraphQL SDL, frontend contracts,
  ingestion, taxonomy policy, or product behavior.
- Keep `Filtering` and `FilterMetadata` as the existing catalog-filter owners.

---

### Task 1: Product And Brand Ownership

**Files:**

- Create: `lib/product_compare/catalog/products.ex`
- Modify: `lib/product_compare/catalog.ex`
- Test: `test/product_compare/catalog/product_lookup_test.exs`
- Test: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Test: `test/product_compare_web/graphql/node_query_test.exs`

**Interfaces:** `ProductCompare.Catalog.Products` owns brand and product
persistence, type-taxon validation, ordered product listing, ID reads,
canonical and historical slug reads, and batched slug projections. The facade
keeps the existing public product and brand functions with their current
signatures.

- [ ] Run the three named suites as the green characterization baseline.
- [ ] Move brand/product changesets, conflict behavior, transactions, type
  guardrails, slug history, ID bounds, reads, and private helpers into
  `Products`.
- [ ] Replace the facade implementations with explicit wrappers retaining the
  existing guards, typespecs, and result shapes.
- [ ] Re-run the suites and confirm validation, slug history, batched ordering,
  invalid IDs, GraphQL values, and node authorization remain unchanged.
- [ ] Commit with message `refactor: isolate catalog product ownership`.

### Task 2: Product Evidence Ownership

**Files:**

- Create: `lib/product_compare/catalog/evidence.ex`
- Modify: `lib/product_compare/catalog.ex`
- Test: `test/product_compare/catalog/gtin_test.exs`
- Test: `test/product_compare/catalog/product_lookup_test.exs`
- Test: `test/product_compare_web/graphql/catalog_queries_test.exs`

**Interfaces:** `ProductCompare.Catalog.Evidence` owns validated identifier
lookup/persistence and product-media upsert/list behavior. The facade retains
every existing identifier- and media-oriented function.

- [ ] Run the three named suites as the green characterization baseline.
- [ ] Move identifier joins, status filtering, ordering, media conflict
  handling, accepted/rejected counts, ordering, and source preloads into
  `Evidence` without changing query semantics.
- [ ] Add explicit facade wrappers preserving struct matches, guards,
  typespecs, result maps, and changeset errors.
- [ ] Re-run the suites and confirm GTIN identity, replay, validation status,
  media persistence, ordering, preloads, and GraphQL values remain unchanged.
- [ ] Commit with message `refactor: isolate catalog evidence ownership`.

### Task 3: Saved-Comparison Ownership

**Files:**

- Create: `lib/product_compare/catalog/saved_comparisons.ex`
- Modify: `lib/product_compare/catalog.ex`
- Test: `test/product_compare/catalog/saved_comparison_set_test.exs`
- Test: `test/product_compare_web/graphql/saved_comparisons_test.exs`
- Test: `test/product_compare_web/graphql/node_query_test.exs`

**Interfaces:** `ProductCompare.Catalog.SavedComparisons` owns saved-set
creation, item persistence, owner queries, entropy-ID lookup, preloads,
ordering, validation, and deletion. The facade retains every current
saved-comparison function.

- [ ] Run the three named suites as the green characterization baseline.
- [ ] Move the `Ecto.Multi`, item insertion, validation, owner filtering,
  lookup, preload, ordering, and stale-delete handling into
  `SavedComparisons`.
- [ ] Add explicit facade wrappers preserving accepted input shapes, struct
  matches, guards, typespecs, domain errors, and missing-record behavior.
- [ ] Re-run the suites and confirm atomicity, item positions, validation,
  owner scope, entropy-ID handling, ordering, preloads, mutations, and node
  authorization remain unchanged.
- [ ] Commit with message `refactor: isolate catalog saved comparison ownership`.

### Task 4: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/catalog-context-decomposition.md`

- [ ] Confirm `list_products/0`, `filter_products/1`, and
  `product_filter_metadata/1` remain facade entry points over their focused
  owners with unchanged results.
- [ ] Run the exact 106-test characterization command recorded in the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no application caller references `Catalog.Products`,
  `Catalog.Evidence`, or `Catalog.SavedComparisons` directly.
- [ ] Record final ownership, facade size, exact test count, and gate results
  in the lane doc and include it in the final code/test milestone commit.
