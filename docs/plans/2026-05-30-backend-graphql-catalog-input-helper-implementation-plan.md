# Backend GraphQL Catalog Input Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Catalog resolver input list and UUID ID normalization onto the shared GraphQL input helper.

**Architecture:** Extend `ProductCompareWeb.GraphQL.Input` with the remaining catalog input primitives: list-value lookup, integer ID list decoding, and required UUID-backed global ID decoding. `CatalogResolver` should delegate to those helpers while preserving existing public GraphQL errors and mutation payload shapes.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/input.ex`: shared GraphQL resolver input helpers.
- `test/product_compare_web/graphql/input_test.exs`: focused helper coverage.
- `lib/product_compare_web/resolvers/catalog_resolver.ex`: catalog query filter and saved-comparison mutation input normalization.
- `docs/work/backend-graphql-catalog-input-helper.md`: source-of-truth work record for this batch.

## Task 1: Catalog GraphQL Input Helper Adoption

**Files:**
- Modify: `lib/product_compare_web/graphql/input.ex`
- Modify: `test/product_compare_web/graphql/input_test.exs`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Create: `docs/work/backend-graphql-catalog-input-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add tests proving `fetch_list_value/2`, `decode_integer_id_list/4`, and `decode_required_uuid_id/3` preserve the catalog resolver input semantics.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs
```

Expected: FAIL because the new helper functions are not exported yet.

- [x] **Step 3: Implement the shared helper extensions**

Add list-value lookup, integer ID list decoding, and required UUID global ID decoding to `ProductCompareWeb.GraphQL.Input`.

- [x] **Step 4: Run helper test to verify green**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs
```

Expected: PASS.

- [x] **Step 5: Replace Catalog resolver input helper duplication**

Update `ProductCompareWeb.Resolvers.CatalogResolver` to use `ProductCompareWeb.GraphQL.Input` for input lookup, list lookup, integer ID list decoding, integer ID decoding, optional integer ID decoding, and UUID ID decoding. Remove the resolver-local duplicate helpers.

- [x] **Step 6: Run focused catalog verification**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs
```

Expected: PASS.

- [x] **Step 7: Run final verification**

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
