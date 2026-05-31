# GraphQL Price Point Node Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `PricePoint` resolvable through root `node(id:)` because the pricing GraphQL surface already exposes Relay global IDs for price points.

**Architecture:** Keep `PricePoint` in the public pricing node class with `Product`, `Brand`, `Merchant`, and `MerchantProduct`. Do not add node support for ingestion-only or internal IDs such as `SourceArtifact`; those remain unsupported until a future GraphQL object surface exists.

**Tech Stack:** Phoenix, Absinthe GraphQL, Ecto, ExUnit.

---

## File Structure

- `test/product_compare_web/graphql/node_query_test.exs`: focused GraphQL contract test for `PricePoint` root node lookup and unsupported ID behavior.
- `lib/product_compare/pricing.ex`: small read helper for price point records.
- `lib/product_compare_web/resolvers/node_resolver.ex`: public node allowlist and dispatch for `:price_point`.
- `lib/product_compare_web/schema.ex`: `PricePoint` object implements `:node` and resolves through the node interface.
- `docs/work/graphql-relay-contract-hardening.md`: backend lane source of truth for root-node contract status.
- `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, `ARCHITECTURE.md`: coordinator-owned queue and architecture summaries.

## Task 1: Public PricePoint Node Lookup

**Files:**
- Modify: `test/product_compare_web/graphql/node_query_test.exs`
- Modify: `lib/product_compare/pricing.ex`
- Modify: `lib/product_compare_web/resolvers/node_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`

- [x] **Step 1: Write the failing price point node contract test**

Add a test that creates a merchant product price point, queries it through root `node(id:)`, and expects `__typename`, global ID, merchant product global ID, observation timestamp, and decimal price. Keep unsupported-node coverage pointed at `SourceArtifact`, which still has no public GraphQL object node surface.

- [x] **Step 2: Run the focused failing test**

Run: `mix test test/product_compare_web/graphql/node_query_test.exs`

Expected: FAIL because `PricePoint` is not a possible `Node` fragment and root `node(id:)` still rejects the type.

- [x] **Step 3: Add pricing read support**

Add `ProductCompare.Pricing.get_price_point/1`, guarded like the other integer-backed pricing reads and backed by `Repo.get/2`.

- [x] **Step 4: Add resolver and schema support**

Add `:price_point` to the public node type allowlist, dispatch it through `Pricing.get_price_point/1`, add `interface(:node)` to the `:price_point` object, and include `%PricePoint{}` in the node interface resolver.

- [x] **Step 5: Run focused backend verification**

Run: `mix test test/product_compare_web/graphql/node_query_test.exs`

Expected: PASS.

## Task 2: Queue Handoff And Verification

**Files:**
- Modify: `docs/work/graphql-relay-contract-hardening.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`

- [x] **Step 1: Record the backend follow-up as complete**

Update the backend Relay contract work doc and queue summaries to show that `PricePoint` node lookup has landed and `SourceArtifact` remains intentionally unsupported pending a future GraphQL object contract.

- [x] **Step 2: Run full relevant verification**

Run:

```bash
mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs
mix format --check-formatted
mix compile --warnings-as-errors
mix typecheck
git diff --check
```

Expected: PASS.
