# Backend GraphQL Mutation Error Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize typed GraphQL mutation error maps and changeset traversal in `ProductCompareWeb.GraphQL.Errors`.

**Architecture:** Keep resolver-specific payload shapes in each resolver, but move generic `%{code, message, field}` construction and Ecto changeset interpolation into the shared GraphQL error module. Resolvers keep mapping domain outcomes to payload fields while delegating the low-level mutation error shape.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, Ecto changesets, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/errors.ex`: shared GraphQL typed mutation error and changeset helpers.
- `lib/product_compare_web/resolvers/auth_resolver.ex`: auth and API token mutation payload shaping.
- `lib/product_compare_web/resolvers/catalog_resolver.ex`: saved-comparison mutation payload shaping.
- `lib/product_compare_web/resolvers/affiliate_resolver.ex`: affiliate mutation payload shaping.
- `test/product_compare_web/graphql/errors_test.exs`: focused shared helper coverage.
- `docs/work/backend-graphql-mutation-error-helper.md`: source-of-truth work record for this batch.

## Task 1: Generic Mutation Error Helper

**Files:**
- Modify: `lib/product_compare_web/graphql/errors.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `test/product_compare_web/graphql/errors_test.exs`
- Create: `docs/work/backend-graphql-mutation-error-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing shared helper coverage**

Add tests that prove `ProductCompareWeb.GraphQL.Errors.mutation_error/3` returns `%{code, message, field}` with atom fields normalized to strings, and `changeset_mutation_errors/1` returns `INVALID_ARGUMENT` mutation errors with Ecto interpolation applied.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/errors_test.exs
```

Expected: FAIL because `mutation_error/3` and `changeset_mutation_errors/1` do not exist yet.

- [x] **Step 3: Implement shared helpers**

Add `mutation_error/3` and `changeset_mutation_errors/1` to `ProductCompareWeb.GraphQL.Errors`. Reuse `mutation_error/3` from `unauthenticated_mutation_error/0`.

- [x] **Step 4: Run helper test to verify green**

Run:

```bash
mix test test/product_compare_web/graphql/errors_test.exs
```

Expected: PASS.

- [x] **Step 5: Replace resolver-local generic mutation error helpers**

Update auth, catalog, and affiliate resolvers to call `GraphQLErrors.mutation_error/3`; update auth and catalog changeset payloads to call `GraphQLErrors.changeset_mutation_errors/1`; remove duplicated private helpers.

- [x] **Step 6: Run focused resolver verification**

Run:

```bash
mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
```

Expected: PASS.

- [x] **Step 7: Run final verification**

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
