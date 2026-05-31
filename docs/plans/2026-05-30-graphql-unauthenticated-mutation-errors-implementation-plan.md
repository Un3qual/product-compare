# GraphQL Unauthenticated Mutation Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make typed GraphQL mutation payloads use the same `UNAUTHENTICATED` code as top-level auth-required GraphQL errors when no current user is present.

**Architecture:** Keep top-level auth-required query failures in `ProductCompareWeb.GraphQL.Errors.unauthenticated/0`, and expose the same code through a small helper for resolver-local typed payloads. Do not change permission or not-found errors; this slice only covers missing-session mutation payloads.

**Tech Stack:** Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `test/product_compare_web/graphql/api_token_auth_test.exs`: API token mutation unauthenticated payload expectation.
- `test/product_compare_web/graphql/saved_comparisons_test.exs`: saved-comparison mutation unauthenticated payload expectation.
- `test/product_compare_web/graphql/affiliate_workflows_test.exs`: affiliate mutation unauthenticated payload expectation.
- `lib/product_compare_web/graphql/errors.ex`: shared unauthenticated error code helper.
- `lib/product_compare_web/resolvers/auth_resolver.ex`: API token mutation payload codes.
- `lib/product_compare_web/resolvers/catalog_resolver.ex`: saved-comparison mutation payload codes.
- `lib/product_compare_web/resolvers/affiliate_resolver.ex`: affiliate mutation payload codes.
- `docs/work/graphql-auth-migration.md`: auth contract work doc.
- `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, `ARCHITECTURE.md`: coordinator-owned queue and architecture summaries.

## Task 1: Typed Mutation Code Consistency

**Files:**
- Modify: `test/product_compare_web/graphql/api_token_auth_test.exs`
- Modify: `test/product_compare_web/graphql/saved_comparisons_test.exs`
- Modify: `test/product_compare_web/graphql/affiliate_workflows_test.exs`
- Modify: `lib/product_compare_web/graphql/errors.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`

- [x] **Step 1: Write failing unauthenticated mutation payload tests**

Update focused GraphQL tests so missing-session API token, saved-comparison, and affiliate mutation payloads expect `UNAUTHENTICATED` instead of `UNAUTHORIZED`.

- [x] **Step 2: Run the focused failing tests**

Run: `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`

Expected: FAIL because resolver-local typed mutation payloads still return `UNAUTHORIZED`.

- [x] **Step 3: Centralize the unauthenticated code**

Add `ProductCompareWeb.GraphQL.Errors.unauthenticated_code/0` and have `unauthenticated/0` use that helper.

- [x] **Step 4: Update typed mutation payloads**

Use `GraphQLErrors.unauthenticated_code()` in unauthenticated branches for API token, saved-comparison, and affiliate mutation payloads.

- [x] **Step 5: Run focused backend verification**

Run: `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`

Expected: PASS.

## Task 2: Queue Handoff And Verification

**Files:**
- Modify: `docs/work/graphql-auth-migration.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`

- [x] **Step 1: Record the backend contract cleanup**

Update the auth work doc and queue summaries to record that missing-session typed mutation payloads now use `UNAUTHENTICATED` consistently.

- [x] **Step 2: Run full relevant verification**

Run:

```bash
mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
mix format --check-formatted
mix compile --warnings-as-errors
mix typecheck
git diff --check
```

Expected: PASS.
