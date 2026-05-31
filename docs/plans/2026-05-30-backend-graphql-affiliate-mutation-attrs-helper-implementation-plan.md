# Backend GraphQL Affiliate Mutation Attrs Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize Affiliate mutation attrs through shared GraphQL input semantics after Relay ID decoding.

**Architecture:** `ProductCompareWeb.GraphQL.Input` owns atom/string resolver input lookup and optional attribute extraction. Affiliate mutations that decode Relay ID fields should also project the known mutation attrs into a normalized atom-key map before calling context changesets.

**Tech Stack:** Phoenix, Absinthe GraphQL, Ecto, ExUnit.

---

## File Structure

- `lib/product_compare_web/resolvers/affiliate_resolver.ex`: Affiliate mutation input normalization.
- `test/product_compare_web/graphql/affiliate_workflows_test.exs`: request and resolver-level Affiliate workflow coverage.
- `docs/work/backend-graphql-affiliate-mutation-attrs-helper.md`: source-of-truth work record for this batch.

## Task 1: Affiliate Mutation Attrs Helper

**Files:**
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `test/product_compare_web/graphql/affiliate_workflows_test.exs`
- Create: `docs/work/backend-graphql-affiliate-mutation-attrs-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing resolver coverage**

Add focused coverage proving `AffiliateResolver.upsert_affiliate_program/3` accepts direct string-key attrs after Relay ID normalization.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/affiliate_workflows_test.exs
```

Expected: FAIL because the resolver decodes ID fields to atom keys while leaving non-ID attrs string-keyed before the Ecto changeset call.

- [x] **Step 3: Implement normalized Affiliate mutation attrs**

Add a resolver-local helper that decodes ID fields, then projects the expected mutation attrs through `Input.take_present/2`. Use it for program, link, and coupon mutation attrs.

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
