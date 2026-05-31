# Backend GraphQL Connection Args Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize GraphQL connection pagination argument extraction in `ProductCompareWeb.GraphQL.Input` and use it from backend resolvers.

**Architecture:** GraphQL resolver input lookup belongs in `ProductCompareWeb.GraphQL.Input`, while `ProductCompareWeb.GraphQL.Connection` owns connection construction. Resolvers should delegate pagination arg extraction to the shared input helper so atom/string GraphQL input semantics do not drift across catalog, pricing, auth, and affiliate paths.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/input.ex`: shared GraphQL resolver input helpers.
- `lib/product_compare_web/resolvers/catalog_resolver.ex`: catalog query and saved-set connection resolvers.
- `lib/product_compare_web/resolvers/pricing_resolver.ex`: merchant and price connection resolvers.
- `lib/product_compare_web/resolvers/auth_resolver.ex`: API-token connection resolver.
- `lib/product_compare_web/resolvers/affiliate_resolver.ex`: active-coupon connection resolver.
- `test/product_compare_web/graphql/input_test.exs`: focused helper coverage.
- `test/product_compare_web/graphql/catalog_queries_test.exs`: resolver-level regression coverage.
- `docs/work/backend-graphql-connection-args-helper.md`: source-of-truth work record for this batch.

## Task 1: Shared Connection Args Extraction

**Files:**
- Modify: `lib/product_compare_web/graphql/input.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `test/product_compare_web/graphql/input_test.exs`
- Modify: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Create: `docs/work/backend-graphql-connection-args-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper and resolver coverage**

Add focused coverage proving shared connection arg extraction accepts string-key `first`/`after` values and a direct catalog resolver call honors string-key pagination args.

- [x] **Step 2: Run the focused failing tests**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs
```

Expected: FAIL because the shared helper does not exist yet and catalog direct resolver pagination drops string-key args.

- [x] **Step 3: Implement the shared connection args helper**

Add `Input.connection_args/1` that extracts `:first` and `:after` through shared atom/string lookup semantics and omits nil values.

- [x] **Step 4: Replace resolver-local pagination extraction**

Route catalog, pricing, auth, and affiliate connection arg extraction through `Input.connection_args/1`, removing duplicate resolver-local pagination helper logic.

- [x] **Step 5: Run focused backend verification**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
```

Expected: PASS.

- [x] **Step 6: Run final verification**

Run:

```bash
cd assets && bun run check
mix test
mix format --check-formatted
mix compile --warnings-as-errors
mix typecheck
git diff --check
```

Expected: PASS.
