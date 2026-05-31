# Backend Core Attrs Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move reusable atom/string attr lookup and nil-skipping map insertion into a core ProductCompare helper.

**Architecture:** The GraphQL layer already has resolver-specific input helpers, but domain code should not depend on web modules. This batch adds `ProductCompare.Attrs` for core attr maps and routes API-token attr handling in `ProductCompare.Accounts` through it.

**Tech Stack:** Elixir, Phoenix context modules, ExUnit.

---

## File Structure

- `lib/product_compare/attrs.ex`: core attr map helper functions.
- `lib/product_compare/accounts.ex`: Accounts context and API-token attr handling.
- `test/product_compare/attrs_test.exs`: focused core attr helper coverage.
- `test/product_compare/accounts/api_token_test.exs`: API-token behavior coverage.
- `docs/work/backend-core-attrs-helper.md`: source-of-truth work record for this batch.

## Task 1: Core Attrs Helper

**Files:**
- Create: `lib/product_compare/attrs.ex`
- Modify: `lib/product_compare/accounts.ex`
- Create: `test/product_compare/attrs_test.exs`
- Verify: `test/product_compare/accounts/api_token_test.exs`
- Create: `docs/work/backend-core-attrs-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add focused coverage for:
- atom keys taking precedence over string keys
- fallback defaults for non-map inputs
- converting non-map attrs into `%{}`
- putting non-nil values and skipping nil values

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare/attrs_test.exs
```

Expected: FAIL because `ProductCompare.Attrs` does not exist yet.

- [x] **Step 3: Implement the helper**

Add `ProductCompare.Attrs.fetch/3`, `ensure_map/1`, and `put_present/3`.

- [x] **Step 4: Replace Accounts-local helpers**

Alias `ProductCompare.Attrs` in `ProductCompare.Accounts`, route API-token attr lookup and insertion through it, and remove private `fetch_attr/2`, `ensure_map/1`, and `maybe_put/3`.

- [x] **Step 5: Run focused Accounts verification**

Run:

```bash
mix test test/product_compare/attrs_test.exs test/product_compare/accounts/api_token_test.exs
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
