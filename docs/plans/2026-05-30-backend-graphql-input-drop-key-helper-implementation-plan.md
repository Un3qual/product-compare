# Backend GraphQL Input Drop-Key Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize atom/string key removal for resolver input maps and use it in API-token listing argument handling.

**Architecture:** The backend GraphQL layer uses shared input helpers so resolvers handle Absinthe atom-key args and direct string-key maps consistently. Connection helpers already consume the shared lookup path; resolver-specific non-pagination args should be removed through the same atom/string key boundary before forwarding remaining pagination args.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/input.ex`: shared GraphQL resolver input helpers.
- `lib/product_compare_web/resolvers/auth_resolver.ex`: API token resolver argument handling.
- `test/product_compare_web/graphql/input_test.exs`: focused helper coverage.
- `test/product_compare_web/graphql/api_token_auth_test.exs`: API token GraphQL/resolver coverage.
- `docs/work/backend-graphql-input-drop-key-helper.md`: source-of-truth work record for this batch.

## Task 1: GraphQL Input Drop-Key Helper Adoption

**Files:**
- Modify: `lib/product_compare_web/graphql/input.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify: `test/product_compare_web/graphql/input_test.exs`
- Modify: `test/product_compare_web/graphql/api_token_auth_test.exs`
- Create: `docs/work/backend-graphql-input-drop-key-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper and resolver coverage**

Add tests proving the shared input helper can drop both atom and string forms of a key, and `my_api_tokens/3` honors a string-key `status` resolver arg without treating it as pagination input.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/api_token_auth_test.exs
```

Expected: FAIL because `Input.drop_key/2` does not exist and the Auth resolver does not normalize string-key status args.

- [x] **Step 3: Implement the shared input drop helper**

Add `ProductCompareWeb.GraphQL.Input.drop_key/2` to remove both the atom key and its string form from a map.

- [x] **Step 4: Adopt the helper in AuthResolver**

Update `my_api_tokens/3` to read `status` via `Input.fetch_value/3` and build connection args via `Input.drop_key/2`.

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
