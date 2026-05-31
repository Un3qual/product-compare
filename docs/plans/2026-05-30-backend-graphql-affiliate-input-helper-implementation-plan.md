# Backend GraphQL Affiliate Input Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Affiliate resolver optional Relay integer-ID field normalization onto `ProductCompareWeb.GraphQL.Input`.

**Architecture:** `ProductCompareWeb.GraphQL.Input` owns shared GraphQL resolver input lookup and integer global ID decoding behavior. Affiliate mutation and active-coupon inputs should delegate optional ID field normalization to this helper instead of carrying resolver-local global ID casting.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/input.ex`: shared GraphQL resolver input helpers.
- `test/product_compare_web/graphql/input_test.exs`: focused helper coverage.
- `lib/product_compare_web/resolvers/affiliate_resolver.ex`: affiliate mutation and active-coupon input normalization.
- `docs/work/backend-graphql-affiliate-input-helper.md`: source-of-truth work record for this batch.

## Task 1: Affiliate GraphQL Input Helper Adoption

**Files:**
- Modify: `lib/product_compare_web/graphql/input.ex`
- Modify: `test/product_compare_web/graphql/input_test.exs`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Create: `docs/work/backend-graphql-affiliate-input-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add tests proving `Input.decode_optional_integer_id_field/4` decodes present Relay IDs into the target map field, preserves missing and nil optional fields, and returns field-specific invalid ID errors.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs
```

Expected: FAIL because the new helper function is not exported yet.

- [x] **Step 3: Implement the shared optional ID field helper**

Add `decode_optional_integer_id_field/4` to `ProductCompareWeb.GraphQL.Input`.

- [x] **Step 4: Replace Affiliate resolver-local ID casting**

Update `ProductCompareWeb.Resolvers.AffiliateResolver` to use the shared helper for `affiliate_network_id`, `merchant_id`, `merchant_product_id`, and `artifact_id` normalization. Remove the resolver-local `cast_global_id/2` helper.

- [x] **Step 5: Run focused affiliate verification**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
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
