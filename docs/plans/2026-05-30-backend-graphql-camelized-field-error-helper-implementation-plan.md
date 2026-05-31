# Backend GraphQL Camelized Field Error Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move GraphQL typed mutation error camelCase field-name normalization into `ProductCompareWeb.GraphQL.Errors`.

**Architecture:** `ProductCompareWeb.GraphQL.Errors` owns typed mutation error map construction. Resolvers that expose field names in GraphQL mutation payloads should call a shared helper for camelCase GraphQL input field names instead of carrying resolver-local string conversion.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/errors.ex`: shared GraphQL error helpers.
- `test/product_compare_web/graphql/errors_test.exs`: focused helper coverage.
- `lib/product_compare_web/resolvers/affiliate_resolver.ex`: affiliate mutation payload field names.
- `docs/work/backend-graphql-camelized-field-error-helper.md`: source-of-truth work record for this batch.

## Task 1: GraphQL Camelized Mutation Field Helper Adoption

**Files:**
- Modify: `lib/product_compare_web/graphql/errors.ex`
- Modify: `test/product_compare_web/graphql/errors_test.exs`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Create: `docs/work/backend-graphql-camelized-field-error-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add tests proving `Errors.camelized_mutation_error/3` returns typed mutation errors with camelCase field names for snake_case atoms and strings, while preserving `nil`.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/errors_test.exs
```

Expected: FAIL because the new helper function is not exported yet.

- [x] **Step 3: Implement the shared camelized mutation error helper**

Add `camelized_mutation_error/3` to `ProductCompareWeb.GraphQL.Errors`.

- [x] **Step 4: Replace Affiliate resolver-local field-name normalization**

Update `ProductCompareWeb.Resolvers.AffiliateResolver` to call `GraphQLErrors.camelized_mutation_error/3` and remove private field-name camelization helpers.

- [x] **Step 5: Run focused GraphQL mutation verification**

Run:

```bash
mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
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
