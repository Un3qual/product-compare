# Backend GraphQL Affiliate Network Input Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route affiliate-network mutation attribute extraction through `ProductCompareWeb.GraphQL.Input` and remove stale unsupported attribute selection.

**Architecture:** `ProductCompareWeb.GraphQL.Input` owns resolver input lookup and optional attribute extraction. `AffiliateResolver.upsert_affiliate_network/3` should use that shared module instead of a resolver-local `Map.take/2`, and it should only select attributes that exist in the current GraphQL/schema contract.

**Tech Stack:** Phoenix, Absinthe GraphQL, Ecto, ExUnit.

---

## File Structure

- `lib/product_compare_web/resolvers/affiliate_resolver.ex`: affiliate network mutation input normalization.
- `test/product_compare_web/graphql/affiliate_workflows_test.exs`: request and resolver-level affiliate workflow coverage.
- `docs/work/backend-graphql-affiliate-network-input-helper.md`: source-of-truth work record for this batch.

## Task 1: Affiliate Network Mutation Input Helper

**Files:**
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `test/product_compare_web/graphql/affiliate_workflows_test.exs`
- Create: `docs/work/backend-graphql-affiliate-network-input-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing resolver coverage**

Add focused coverage proving `AffiliateResolver.upsert_affiliate_network/3` accepts string-key `"name"` input through the shared GraphQL input semantics.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/affiliate_workflows_test.exs
```

Expected: FAIL because the resolver still uses `Map.take(input, [:name, :homepage_url])` and ignores string-key `"name"`.

- [x] **Step 3: Route attribute extraction through the shared input helper**

Replace the resolver-local `Map.take/2` with `Input.take_present(input, [:name])`, preserving mutation payload behavior while removing unsupported `homepage_url` selection.

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
