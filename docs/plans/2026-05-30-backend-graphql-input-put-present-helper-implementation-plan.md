# Backend GraphQL Input Put-Present Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move nil-skipping GraphQL input map insertion into `ProductCompareWeb.GraphQL.Input`.

**Architecture:** `Input` already owns shared GraphQL input lookup, optional attr projection, list defaults, ID parsing, connection args, and primitive filter value normalization. This batch adds a tiny map insertion helper so Catalog filter normalization no longer carries a resolver-local optional-value helper.

**Tech Stack:** Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/input.ex`: shared GraphQL input lookup, coercion, and ID parsing helpers.
- `lib/product_compare_web/resolvers/catalog_resolver.ex`: Catalog GraphQL resolver and product filter normalization.
- `test/product_compare_web/graphql/input_test.exs`: focused shared input helper coverage.
- `test/product_compare_web/graphql/catalog_queries_test.exs`: request-level catalog filter behavior coverage.
- `docs/work/backend-graphql-input-put-present-helper.md`: source-of-truth work record for this batch.

## Task 1: Input Put-Present Helper

**Files:**
- Modify: `lib/product_compare_web/graphql/input.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `test/product_compare_web/graphql/input_test.exs`
- Verify: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Create: `docs/work/backend-graphql-input-put-present-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add focused coverage proving the shared helper inserts non-nil values and leaves the map unchanged for nil values.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs
```

Expected: FAIL because the shared put-present helper is not implemented yet.

- [x] **Step 3: Implement the shared helper**

Add `Input.put_present/3` with the same nil-skipping behavior as the current Catalog resolver private `maybe_put/3`.

- [x] **Step 4: Replace Catalog resolver-local insertion**

Use `Input.put_present/3` in `CatalogResolver.normalize_filters/1` and `normalize_numeric_filters/1`, then remove the private `maybe_put/3` helper.

- [x] **Step 5: Run focused Catalog verification**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs
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
