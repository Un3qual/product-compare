# Backend GraphQL Input Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize common GraphQL resolver input lookup and Relay integer ID decoding helpers.

**Architecture:** Add `ProductCompareWeb.GraphQL.Input` beside the other GraphQL support modules. Pricing and commerce attribution resolvers should delegate atom/string key lookup and required/optional integer global ID decoding to this helper while preserving their public GraphQL behavior.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/input.ex`: shared GraphQL resolver input helpers.
- `test/product_compare_web/graphql/input_test.exs`: focused helper coverage.
- `lib/product_compare_web/resolvers/pricing_resolver.ex`: merchant product input normalization.
- `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`: revenue summary input normalization.
- `docs/work/backend-graphql-input-helper.md`: source-of-truth work record for this batch.

## Task 1: GraphQL Input Helper

**Files:**
- Create: `lib/product_compare_web/graphql/input.ex`
- Create: `test/product_compare_web/graphql/input_test.exs`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`
- Create: `docs/work/backend-graphql-input-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add tests proving `ProductCompareWeb.GraphQL.Input.fetch_value/3`, `decode_required_integer_id/3`, and `decode_optional_integer_id/3` preserve the existing resolver input semantics.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs
```

Expected: FAIL because `ProductCompareWeb.GraphQL.Input` does not exist yet.

- [x] **Step 3: Implement the shared helper**

Add `ProductCompareWeb.GraphQL.Input` with atom/string key lookup, required integer global ID decoding, and optional integer global ID decoding.

- [x] **Step 4: Run helper test to verify green**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs
```

Expected: PASS.

- [x] **Step 5: Replace resolver-local input helper duplication**

Update pricing and commerce attribution resolvers to use `ProductCompareWeb.GraphQL.Input` for input lookup and integer global ID decoding, then remove the duplicate resolver-local helpers.

- [x] **Step 6: Run focused resolver verification**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs
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
