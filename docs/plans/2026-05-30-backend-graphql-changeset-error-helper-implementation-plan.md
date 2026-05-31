# Backend GraphQL Changeset Error Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize first changeset error extraction in `ProductCompareWeb.GraphQL.Errors`.

**Architecture:** `ProductCompareWeb.GraphQL.Errors` owns GraphQL mutation error construction and changeset error shaping. Resolvers should call shared helpers for first changeset field/message extraction instead of duplicating private pattern matches.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/errors.ex`: shared GraphQL error helpers.
- `test/product_compare_web/graphql/errors_test.exs`: focused helper coverage.
- `lib/product_compare_web/resolvers/auth_resolver.ex`: API token mutation error payloads.
- `lib/product_compare_web/resolvers/affiliate_resolver.ex`: affiliate mutation error payloads.
- `docs/work/backend-graphql-changeset-error-helper.md`: source-of-truth work record for this batch.

## Task 1: GraphQL Changeset First Error Helper Adoption

**Files:**
- Modify: `lib/product_compare_web/graphql/errors.ex`
- Modify: `test/product_compare_web/graphql/errors_test.exs`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Create: `docs/work/backend-graphql-changeset-error-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add tests proving `Errors.changeset_first_error/1` returns the first normalized field and interpolated message, and `Errors.changeset_first_message/1` returns only the message with a stable fallback for empty changesets.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/errors_test.exs
```

Expected: FAIL because the new helper functions are not exported yet.

- [x] **Step 3: Implement the shared first-error helpers**

Add `changeset_first_error/1` and `changeset_first_message/1` to `ProductCompareWeb.GraphQL.Errors`, reusing the same interpolation behavior as `changeset_mutation_errors/1`.

- [x] **Step 4: Replace resolver-local first-error helpers**

Update `AuthResolver` and `AffiliateResolver` to use the shared helpers, then remove the private duplicate functions.

- [x] **Step 5: Run focused GraphQL mutation verification**

Run:

```bash
mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
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
