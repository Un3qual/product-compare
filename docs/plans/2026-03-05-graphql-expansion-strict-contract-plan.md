# GraphQL Expansion + Strict Contract Behavior Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the GraphQL API with initial catalog read coverage while hardening contract behavior around typed mutation errors and strict cursor/global-ID validation.

**Architecture:** Keep resolver orchestration synchronous and context-backed, but make error semantics explicit at the GraphQL payload boundary. Use shared mutation error objects for affiliate mutations, strict connection cursor parsing, and a small first expansion slice (`products` connection) to avoid broad schema churn in one batch.

**Tech Stack:** Elixir, Phoenix, Absinthe, Ecto, ExUnit

---

## Checklist

- [x] Task 1: Convert affiliate mutation contracts to typed payload errors (no top-level resolver string errors for expected failures).
- [x] Task 2: Enforce strict cursor handling in GraphQL connections and map invalid cursors to deterministic resolver errors.
- [x] Task 3: Expand GraphQL query surface with catalog `products` connection (stable ordering + Relay-style IDs).
- [x] Task 4: Document sync-now/Oban-later execution boundaries and explicit pre-GA contract-change policy for future agents.
- [x] Task 5: Verification checkpoint + milestone commit.

## Task 1: Affiliate Typed Error Payloads

**Files:**
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `test/product_compare_web/graphql/affiliate_workflows_test.exs`

**Steps:**
1. Add `errors` field to affiliate mutation payload objects and allow entity field to be nullable on error paths.
2. Update affiliate resolvers to always return `{:ok, payload}` with `{entity, errors}` shape for auth/validation/ID failures.
3. Write/adjust GraphQL tests first for unauthorized and invalid-ID mutation paths to expect payload errors.
4. Run targeted affiliate GraphQL tests and iterate to green.

## Task 2: Strict Cursor Handling

**Files:**
- Modify: `lib/product_compare_web/graphql/connection.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `test/product_compare_web/graphql/api_token_auth_test.exs`
- Modify: `test/product_compare_web/graphql/affiliate_workflows_test.exs`

**Steps:**
1. Write failing tests for invalid `after` cursor in `myApiTokens` and `activeCoupons`.
2. Update connection helpers to return explicit cursor parsing errors instead of silently falling back.
3. Update resolvers to translate cursor parse failures into deterministic GraphQL errors.
4. Re-run targeted GraphQL tests to confirm strict behavior.

## Task 3: GraphQL Expansion (Catalog Products Connection)

**Files:**
- Create: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/graphql/global_id.ex`
- Create: `test/product_compare_web/graphql/catalog_queries_test.exs`

**Steps:**
1. Write failing GraphQL tests for a new `products` connection query (stable ordering, cursor paging, Relay product IDs).
2. Add product/brand GraphQL object and connection types.
3. Add `products` query resolver backed by Ecto query ordering and connection helper.
4. Re-run catalog GraphQL tests to green.

## Task 4: Documentation For Future Oban Migration + Contract Posture

**Files:**
- Create: `docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`
- Modify: `docs/implementation-checklist.md`

**Steps:**
1. Document that pre-GA client contract changes are explicitly allowed to improve API consistency/strictness.
2. Document sync-only current implementation and enumerate known future Oban handoff boundaries.
3. Link the decision from the implementation checklist so future agents see it during execution.

## Task 5: Verification + Milestone Commit

**Steps:**
1. Run targeted suites for affiliate/auth/catalog GraphQL changes.
2. Run `mix compile --warnings-as-errors`.
3. Run `mix typecheck`.
4. Run full `mix test` and record any unrelated known baseline failures.
5. Commit all plan/code/test/doc updates at milestone boundary.

Verification note:
- Final verification reached green across all gates (`mix compile --warnings-as-errors`, `mix typecheck`, `mix test`).
