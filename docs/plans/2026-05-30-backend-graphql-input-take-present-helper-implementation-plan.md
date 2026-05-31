# Backend GraphQL Input Take-Present Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize optional non-nil GraphQL input attribute extraction and use it for API-token mutation attrs.

**Architecture:** GraphQL resolver inputs should use shared `ProductCompareWeb.GraphQL.Input` helpers so Absinthe atom-key args and direct string-key maps behave consistently. Optional mutation attrs should be normalized in one place instead of copied through resolver-local `Map.take(...); Enum.reject(nil)` pipelines.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/input.ex`: shared GraphQL resolver input helpers.
- `lib/product_compare_web/resolvers/auth_resolver.ex`: API token mutation argument handling.
- `test/product_compare_web/graphql/input_test.exs`: focused helper coverage.
- `test/product_compare_web/graphql/api_token_auth_test.exs`: API token resolver coverage.
- `docs/work/backend-graphql-input-take-present-helper.md`: source-of-truth work record for this batch.

## Task 1: GraphQL Input Take-Present Helper Adoption

**Files:**
- Modify: `lib/product_compare_web/graphql/input.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify: `test/product_compare_web/graphql/input_test.exs`
- Modify: `test/product_compare_web/graphql/api_token_auth_test.exs`
- Create: `docs/work/backend-graphql-input-take-present-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper and resolver coverage**

Add tests proving a shared helper extracts requested non-nil atom/string input values into atom-key attrs, and Auth resolver API-token create/rotate paths preserve string-key optional attrs.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/api_token_auth_test.exs
```

Expected: FAIL because `Input.take_present/2` does not exist and the Auth resolver drops string-key optional attrs.

- [x] **Step 3: Implement the shared take-present helper**

Add `ProductCompareWeb.GraphQL.Input.take_present/2` to extract requested atom-key fields through `fetch_value/3` and omit `nil` values.

- [x] **Step 4: Adopt the helper in AuthResolver**

Update `create_api_token/3` and `rotate_api_token/3` to use the shared helper for optional `label` and `expires_at` attrs.

- [x] **Step 5: Run focused verification**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/api_token_auth_test.exs
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
