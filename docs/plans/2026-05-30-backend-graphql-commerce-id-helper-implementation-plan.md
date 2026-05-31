# Backend GraphQL Commerce ID Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Commerce attribution GraphQL optional ID decode/encode wrappers onto shared GraphQL helpers.

**Architecture:** `ProductCompareWeb.GraphQL.Input` owns resolver input ID decoding, and `ProductCompareWeb.GraphQL.GlobalId` owns Relay global ID encoding. Commerce attribution revenue summary should delegate optional merchant/product filter ID decoding and response filter ID encoding to those shared modules.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/global_id.ex`: shared GraphQL global ID helper.
- `test/product_compare_web/graphql/global_id_test.exs`: focused global ID coverage.
- `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`: revenue summary input/output normalization.
- `docs/work/backend-graphql-commerce-id-helper.md`: source-of-truth work record for this batch.

## Task 1: Commerce GraphQL ID Helper Adoption

**Files:**
- Modify: `lib/product_compare_web/graphql/global_id.ex`
- Modify: `test/product_compare_web/graphql/global_id_test.exs`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`
- Create: `docs/work/backend-graphql-commerce-id-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add tests proving `GlobalId.encode_optional_value/2` returns `nil` for nil local IDs and an encoded Relay ID for integer and binary local IDs.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/global_id_test.exs
```

Expected: FAIL because the new helper function is not exported yet.

- [x] **Step 3: Implement the shared raw optional ID encoder**

Add `encode_optional_value/2` to `ProductCompareWeb.GraphQL.GlobalId`.

- [x] **Step 4: Replace Commerce resolver-local ID wrappers**

Update `ProductCompareWeb.Resolvers.CommerceAttributionResolver` to use `Input.decode_optional_integer_id_field/4` for merchant/product input IDs and `GlobalId.encode_optional_value/2` for response filter IDs. Remove the private decode/encode wrappers.

- [x] **Step 5: Run focused Commerce GraphQL verification**

Run:

```bash
mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs
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
