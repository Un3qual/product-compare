# Backend GraphQL Affiliate At Input Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route the optional `activeCoupons` timestamp lookup through `ProductCompareWeb.GraphQL.Input` so it follows the same atom/string GraphQL input semantics as the surrounding resolver code.

**Architecture:** `ProductCompareWeb.GraphQL.Input` owns resolver input lookup, optional Relay ID field normalization, and connection argument extraction. `AffiliateResolver.active_coupons/3` should delegate optional input reads to that shared module rather than using resolver-local `Map.get/2` lookups.

**Tech Stack:** Phoenix, Absinthe GraphQL, Ecto, ExUnit.

---

## File Structure

- `lib/product_compare_web/resolvers/affiliate_resolver.ex`: active-coupon resolver input normalization.
- `test/product_compare_web/graphql/affiliate_workflows_test.exs`: request and resolver-level affiliate workflow coverage.
- `docs/work/backend-graphql-affiliate-at-input-helper.md`: source-of-truth work record for this batch.

## Task 1: Affiliate Active-Coupons Timestamp Input Helper

**Files:**
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `test/product_compare_web/graphql/affiliate_workflows_test.exs`
- Create: `docs/work/backend-graphql-affiliate-at-input-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing resolver coverage**

Add focused coverage proving `AffiliateResolver.active_coupons/3` honors a string-key `"at"` timestamp input after merchant ID normalization.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/affiliate_workflows_test.exs
```

Expected: FAIL because the resolver still uses `Map.get(attrs, :at)` and ignores string-key timestamp input.

- [x] **Step 3: Route timestamp lookup through the shared input helper**

Replace the resolver-local `Map.get(attrs, :at)` lookup with `Input.fetch_value(attrs, :at)` while preserving the current default-to-now behavior for absent or invalid timestamp values.

- [x] **Step 4: Run focused affiliate/input verification**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
```

Expected: PASS.

- [x] **Step 5: Run final verification**

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
