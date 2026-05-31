# Backend GraphQL Connection Result Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize resolver-facing connection query result/error mapping in `ProductCompareWeb.GraphQL.Connection`.

**Architecture:** `Connection.from_query/3` owns low-level connection construction and returns typed internal error atoms. Resolver code should consume a shared helper that maps those internal connection errors into stable GraphQL resolver errors.

**Tech Stack:** Phoenix, Absinthe GraphQL, Ecto, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/connection.ex`: shared GraphQL connection construction and resolver result helper.
- `lib/product_compare_web/resolvers/auth_resolver.ex`: API-token connection resolver.
- `lib/product_compare_web/resolvers/catalog_resolver.ex`: products and saved-comparison-set connection resolvers.
- `lib/product_compare_web/resolvers/affiliate_resolver.ex`: active-coupons connection resolver.
- `lib/product_compare_web/resolvers/pricing_resolver.ex`: merchant, merchant-product, and price-history connection resolvers.
- `test/product_compare_web/graphql/connection_test.exs`: focused connection helper coverage.
- `docs/work/backend-graphql-connection-result-helper.md`: source-of-truth work record for this batch.

## Task 1: Connection Result Helper

**Files:**
- Modify: `lib/product_compare_web/graphql/connection.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Modify: `test/product_compare_web/graphql/connection_test.exs`
- Create: `docs/work/backend-graphql-connection-result-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add focused coverage proving the resolver-facing connection helper maps malformed cursors to `{:error, "invalid cursor"}`.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/connection_test.exs
```

Expected: FAIL because the resolver-facing helper is not implemented yet.

- [x] **Step 3: Implement the shared helper**

Add `Connection.from_query_result/3` that delegates to `from_query/3` and maps `{:error, :invalid_cursor}` to `{:error, "invalid cursor"}`.

- [x] **Step 4: Replace resolver-local mapping**

Use `Connection.from_query_result/3` in Auth, Catalog, Affiliate, and Pricing resolvers while preserving resolver-specific payload wrappers.

- [x] **Step 5: Run focused connection resolver verification**

Run:

```bash
mix test test/product_compare_web/graphql/connection_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
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
