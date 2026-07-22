# Bounded Comparison Root GraphQL Reads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep public comparison-product and comparison-recommendation root
SELECT budgets fixed as repeated aliases grow within one GraphQL request.

**Architecture:** Catalog will project multiple validated slug selections from
one canonical-product lookup, and Recommendations will project multiple
product-ID/profile requests from one set-based product, accepted-claim, and
current-offer evidence snapshot. A request-scoped comparison Dataloader source
will batch both public root fields while their resolvers retain existing input
and error contracts.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve the one-to-three unique non-blank slug boundary for
  `comparisonProducts` and the two-or-three existing-product boundary for
  `comparisonRecommendation`.
- Preserve requested order, missing `comparisonProducts` positions,
  recommendation profiles, versions, winner/tie/insufficient semantics,
  ranking order, currencies, reasons, and exact evidence IDs.
- Use one request-scoped observation timestamp for each batched recommendation
  group.
- Preserve current fallback resolver behavior when no loader is present.
- Keep the public GraphQL schema unchanged.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Set-Based Comparison Context Reads

**Files:**

- Modify: `lib/product_compare/catalog.ex`
- Modify: `lib/product_compare/recommendations.ex`
- Modify: `test/product_compare/recommendations_test.exs`

**Interfaces:** `Catalog.list_products_by_slug_selections/1` returns one ordered
product-or-`nil` list per requested slug selection from one canonical-product
query. `Recommendations.compare_many/2` returns results aligned with a list of
`{product_ids, profile}` requests after loading the union of products, accepted
claims, and current offer truth once; `compare/3` delegates without changing
its result.

- [x] Add failing context regressions for duplicate/missing slug selections and
  two versus four valid recommendation requests.
- [x] Assert exact ordered products and full recommendation-result parity before
  asserting equal products, current-claim, merchant-product, and price-point
  SELECT counts for the small and growing request sets.
- [x] Confirm RED because no multi-selection context APIs exist.
- [x] Implement one union slug lookup and pure ordered selection projection.
- [x] Implement one union recommendation evidence load and pure aligned result
  projection, then delegate the singular API.
- [x] Re-run the recommendation context suite.
- [x] Commit with message `perf: batch comparison root context reads`.

### Task 2: Request-Scoped Comparison Root Loading

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/recommendations_resolver.ex`
- Modify: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Modify: `test/product_compare_web/graphql/recommendations_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:** `Loader.comparison_source/0` exposes a request-scoped KV source
with separate `:products` and `:recommendation` batch keys. Resolver callbacks
load the normalized slug selection or `{slugs, profile}` request and return the
same product list, recommendation result, or existing validation error.

- [x] Add a failing growing-alias GraphQL regression with exact ordered product
  values, missing positions, recommendation evidence IDs, and error parity.
- [x] Capture two and four valid aliases and assert identical per-table SELECT
  budgets after checking response equality.
- [x] Confirm RED because both root resolvers currently execute their context
  reads independently for every alias.
- [x] Add the comparison KV source and route loader-present resolver paths
  through it while retaining direct fallbacks.
- [x] Re-run catalog, recommendation, and Dataloader batching suites.
- [x] Commit with message `perf: bound comparison root graphql reads`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-comparison-root-graphql-reads.md`

- [x] Record exact before/after query counts and semantic parity coverage.
- [x] Run `mix test test/product_compare/recommendations_test.exs
  test/product_compare_web/graphql/catalog_queries_test.exs
  test/product_compare_web/graphql/recommendations_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [x] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [x] Include lane evidence in the final code/test milestone commit.

## Completion Evidence

- Context and GraphQL regressions observed RED on the missing set-based APIs and
  per-alias query growth, then GREEN after the request-scoped implementation.
- The four focused suites pass 59 tests with exact response and validation
  parity; two and four aliases share the same three/one/one/one tracked SELECT
  budget.
- Type, format, queue validation with three ready rows, and diff hygiene pass.
- The full `mix ci` gate passes with 856 backend tests, 1,507 frontend tests,
  Relay validation, client/SSR builds, static analysis, and 83.60% coverage.
