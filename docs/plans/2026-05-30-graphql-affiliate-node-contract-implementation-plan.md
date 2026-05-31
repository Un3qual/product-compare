# GraphQL Affiliate Node Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend root `node(id:)` lookup to authenticated affiliate entities that already expose Relay global IDs.

**Architecture:** Keep public catalog/pricing node lookups public, keep saved comparison sets and API tokens owner-scoped, and add a third authenticated-only node class for affiliate records. Affiliate records are not owner-scoped today, so node lookup should require `current_user` and return `nil` without errors for anonymous viewers.

**Tech Stack:** Phoenix, Absinthe GraphQL, Ecto, ExUnit.

---

## File Structure

- `test/product_compare_web/graphql/node_query_test.exs`: focused GraphQL contract tests for affiliate node success and anonymous nil behavior.
- `lib/product_compare/affiliate.ex`: small read helpers for affiliate network, program, link, and coupon records.
- `lib/product_compare_web/resolvers/node_resolver.ex`: decode and dispatch affiliate integer-backed IDs through an authenticated node branch.
- `lib/product_compare_web/schema.ex`: mark affiliate object types as `:node` implementors and teach the `:node` interface resolver their schema structs.
- `docs/work/graphql-relay-contract-hardening.md`: source-of-truth backend lane status.
- `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, `ARCHITECTURE.md`: coordinator-owned queue and architecture summaries.

## Task 1: Authenticated Affiliate Node Lookup

**Files:**
- Modify: `test/product_compare_web/graphql/node_query_test.exs`
- Modify: `lib/product_compare/affiliate.ex`
- Modify: `lib/product_compare_web/resolvers/node_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`

- [x] **Step 1: Write failing affiliate node contract tests**

Add tests that create an affiliate network, affiliate program, affiliate link, and coupon, then assert authenticated `node(id:)` lookups return the matching object fields through affiliate fragments. Add anonymous lookup coverage that expects the same valid IDs to return `node: null` without GraphQL errors.

- [x] **Step 2: Run the focused failing test**

Run: `mix test test/product_compare_web/graphql/node_query_test.exs`

Expected: FAIL because affiliate types do not yet implement the `Node` interface and affiliate IDs are still treated as unsupported by `NodeResolver`.

- [x] **Step 3: Add affiliate context read helpers**

Add `get_affiliate_network/1`, `get_affiliate_program/1`, `get_affiliate_link/1`, and `get_coupon/1` to `ProductCompare.Affiliate`, each using `Repo.get/2` and returning the record or `nil`.

- [x] **Step 4: Add authenticated affiliate node resolver support**

Update `NodeResolver` so affiliate network, program, link, and coupon IDs parse as positive integer local IDs, dispatch only when `current_user` is present, and otherwise return `nil` through the same no-leak shape used by private owner-scoped nodes.

- [x] **Step 5: Register affiliate types as node implementors**

Add `interface(:node)` to the affiliate object types and include the affiliate schema structs in the `:node` interface `resolve_type/2`.

- [x] **Step 6: Run focused backend verification**

Run: `mix test test/product_compare_web/graphql/node_query_test.exs`

Expected: PASS.

## Task 2: Queue Handoff And Backend Verification

**Files:**
- Modify: `docs/work/graphql-relay-contract-hardening.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`

- [x] **Step 1: Record the backend follow-up as complete**

Update the backend Relay contract work doc and queue summaries to show that authenticated affiliate entity node lookup has landed and no additional backend node follow-up is queued.

- [x] **Step 2: Run full relevant backend verification**

Run:

```bash
mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs
mix format --check-formatted
mix compile --warnings-as-errors
mix typecheck
git diff --check
```

Expected: PASS.
