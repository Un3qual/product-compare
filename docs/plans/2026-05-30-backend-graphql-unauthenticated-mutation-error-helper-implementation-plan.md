# Backend GraphQL Unauthenticated Mutation Error Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize typed mutation unauthenticated error construction for backend GraphQL resolver-local payloads.

**Architecture:** Keep the top-level GraphQL unauthenticated error and the resolver-local typed mutation error in `ProductCompareWeb.GraphQL.Errors`. Resolver modules continue shaping their entity-specific payloads, but they receive the shared typed error map instead of passing the unauthenticated code and message as separate literals.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/errors.ex`: shared GraphQL unauthenticated error helpers.
- `lib/product_compare_web/resolvers/auth_resolver.ex`: API token typed mutation auth failures.
- `lib/product_compare_web/resolvers/catalog_resolver.ex`: saved-comparison typed mutation auth failures.
- `lib/product_compare_web/resolvers/affiliate_resolver.ex`: affiliate typed mutation auth failures.
- `test/product_compare_web/graphql/errors_test.exs`: focused shared GraphQL error helper coverage.
- `docs/work/backend-graphql-unauthenticated-mutation-error-helper.md`: source-of-truth work record for this batch.

## Task 1: Typed Unauthenticated Mutation Error Helper

**Files:**
- Modify: `lib/product_compare_web/graphql/errors.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Create: `test/product_compare_web/graphql/errors_test.exs`
- Create: `docs/work/backend-graphql-unauthenticated-mutation-error-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Create `test/product_compare_web/graphql/errors_test.exs` with coverage that `ProductCompareWeb.GraphQL.Errors.unauthenticated_mutation_error/0` returns `%{code: "UNAUTHENTICATED", message: "unauthorized", field: nil}`.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/errors_test.exs
```

Expected: FAIL because `unauthenticated_mutation_error/0` does not exist yet.

- [x] **Step 3: Implement the shared helper**

Add `@unauthenticated_message "unauthorized"` and:

```elixir
@spec unauthenticated_mutation_error() :: %{
        required(:code) => String.t(),
        required(:message) => String.t(),
        required(:field) => nil
      }
def unauthenticated_mutation_error do
  %{code: unauthenticated_code(), message: @unauthenticated_message, field: nil}
end
```

Use `@unauthenticated_message` inside `unauthenticated/0`.

- [x] **Step 4: Run helper test to verify green**

Run:

```bash
mix test test/product_compare_web/graphql/errors_test.exs
```

Expected: PASS.

- [x] **Step 5: Replace resolver-local unauthenticated code/message pairs**

Update API token, saved-comparison, and affiliate unauthenticated typed mutation payloads to use `GraphQLErrors.unauthenticated_mutation_error/0`.

- [x] **Step 6: Run focused resolver verification**

Run:

```bash
mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
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
