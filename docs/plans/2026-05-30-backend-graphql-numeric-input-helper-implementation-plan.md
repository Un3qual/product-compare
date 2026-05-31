# Backend GraphQL Numeric Input Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move GraphQL numeric filter value normalization into `ProductCompareWeb.GraphQL.Input`.

**Architecture:** `Input` already owns shared GraphQL input coercion and Relay ID parsing. This batch adds a small decimal-value helper that preserves existing nil, Decimal, integer, float, string, and invalid-value behavior, then routes Catalog numeric filters through it.

**Tech Stack:** Phoenix, Absinthe GraphQL, Decimal, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/input.ex`: shared GraphQL input lookup, coercion, and ID parsing helpers.
- `lib/product_compare_web/resolvers/catalog_resolver.ex`: Catalog GraphQL resolver and product filter normalization.
- `test/product_compare_web/graphql/input_test.exs`: focused shared input helper coverage.
- `test/product_compare_web/graphql/catalog_queries_test.exs`: request-level catalog filter behavior coverage.
- `docs/work/backend-graphql-numeric-input-helper.md`: source-of-truth work record for this batch.

## Task 1: Numeric Input Helper

**Files:**
- Modify: `lib/product_compare_web/graphql/input.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `test/product_compare_web/graphql/input_test.exs`
- Verify: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Create: `docs/work/backend-graphql-numeric-input-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add focused coverage proving the shared helper preserves nil and numeric values, parses decimal strings into `Decimal`, and returns `{:error, "invalid numeric value"}` for invalid strings or unsupported values.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs
```

Expected: FAIL because the shared numeric input helper is not implemented yet.

- [x] **Step 3: Implement the shared helper**

Add `Input.normalize_decimal_value/1` with the same behavior as the current Catalog resolver private decimal normalization.

- [x] **Step 4: Replace Catalog resolver-local parsing**

Use `Input.normalize_decimal_value/1` in `CatalogResolver.normalize_numeric_filters/1` and remove the private `normalize_decimal/1` helper.

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
