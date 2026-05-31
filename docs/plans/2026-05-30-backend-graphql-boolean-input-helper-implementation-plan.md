# Backend GraphQL Boolean Input Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move GraphQL boolean value normalization into `ProductCompareWeb.GraphQL.Input`.

**Architecture:** `Input` already owns shared GraphQL input coercion for lookup, lists, IDs, connections, and numeric values. This batch adds a tiny boolean coercion helper that preserves the existing `true`, `false`, and fallback-to-`false` behavior used by Catalog filters.

**Tech Stack:** Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/input.ex`: shared GraphQL input lookup, coercion, and ID parsing helpers.
- `lib/product_compare_web/resolvers/catalog_resolver.ex`: Catalog GraphQL resolver and product filter normalization.
- `test/product_compare_web/graphql/input_test.exs`: focused shared input helper coverage.
- `test/product_compare_web/graphql/catalog_queries_test.exs`: request-level catalog filter behavior coverage.
- `docs/work/backend-graphql-boolean-input-helper.md`: source-of-truth work record for this batch.

## Task 1: Boolean Input Helper

**Files:**
- Modify: `lib/product_compare_web/graphql/input.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `test/product_compare_web/graphql/input_test.exs`
- Verify: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Create: `docs/work/backend-graphql-boolean-input-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add focused coverage proving the shared helper preserves `true` and `false`, and normalizes non-boolean values to `false`.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs
```

Expected: FAIL because the shared boolean input helper is not implemented yet.

- [x] **Step 3: Implement the shared helper**

Add `Input.normalize_boolean_value/1` with the same behavior as the current Catalog resolver private boolean normalization.

- [x] **Step 4: Replace Catalog resolver-local parsing**

Use `Input.normalize_boolean_value/1` in `CatalogResolver.normalize_filters/1` and remove the private `normalize_boolean/1` helper.

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
