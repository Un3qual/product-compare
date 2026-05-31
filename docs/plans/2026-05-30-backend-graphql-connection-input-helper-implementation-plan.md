# Backend GraphQL Connection Input Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move GraphQL connection pagination argument lookup onto the shared GraphQL input helper.

**Architecture:** `ProductCompareWeb.GraphQL.Input` already owns atom/string GraphQL input lookup semantics. `ProductCompareWeb.GraphQL.Connection` should delegate pagination argument lookup to that helper and retain only connection-specific page sizing and cursor behavior.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/connection.ex`: shared GraphQL connection pagination helper.
- `test/product_compare_web/graphql/connection_test.exs`: focused connection pagination coverage.
- `docs/work/backend-graphql-connection-input-helper.md`: source-of-truth work record for this batch.

## Task 1: GraphQL Connection Input Helper Adoption

**Files:**
- Modify: `lib/product_compare_web/graphql/connection.ex`
- Create: `test/product_compare_web/graphql/connection_test.exs`
- Create: `docs/work/backend-graphql-connection-input-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add focused connection coverage**

Add focused tests proving connection pagination reads string-key GraphQL args, preserves atom-key precedence, returns stable cursors, and rejects malformed cursors.

- [x] **Step 2: Run focused connection tests**

Run:

```bash
mix test test/product_compare_web/graphql/connection_test.exs
```

Expected: PASS before and after the refactor because this is public behavior preservation around a readability cleanup.

- [x] **Step 3: Replace local input lookup duplication**

Update `ProductCompareWeb.GraphQL.Connection` to call `ProductCompareWeb.GraphQL.Input.fetch_value/3` for `:first` and `:after` lookup, then remove the private `fetch_arg/3` helper.

- [x] **Step 4: Run focused connection and GraphQL pagination verification**

Run:

```bash
mix test test/product_compare_web/graphql/connection_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
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
