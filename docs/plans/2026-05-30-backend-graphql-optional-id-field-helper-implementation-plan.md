# Backend GraphQL Optional ID Field Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ProductCompareWeb.GraphQL.Input.decode_optional_integer_id_field/4` honor the same atom/string input lookup semantics as the rest of the shared GraphQL input helpers.

**Architecture:** GraphQL resolver input lookup and Relay ID normalization are centralized in `ProductCompareWeb.GraphQL.Input` and `ProductCompareWeb.GraphQL.GlobalId`. Optional ID field normalization should not drift from the atom/string behavior used by `fetch_value/3`, list lookup, key dropping, and optional attr extraction.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/input.ex`: shared GraphQL resolver input helpers.
- `test/product_compare_web/graphql/input_test.exs`: focused helper coverage.
- `docs/work/backend-graphql-optional-id-field-helper.md`: source-of-truth work record for this batch.

## Task 1: Optional ID Field Atom/String Normalization

**Files:**
- Modify: `lib/product_compare_web/graphql/input.ex`
- Modify: `test/product_compare_web/graphql/input_test.exs`
- Create: `docs/work/backend-graphql-optional-id-field-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add a focused test proving `Input.decode_optional_integer_id_field/4` decodes string-key optional Relay ID fields into atom-key attrs and removes the string-key duplicate.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs
```

Expected: FAIL because string-key optional ID fields are currently treated as absent.

- [x] **Step 3: Implement atom/string field normalization**

Update `Input.decode_optional_integer_id_field/4` to use the shared lookup semantics for atom and string forms, preserve missing/nil behavior, return the same field-specific invalid ID errors, and emit a normalized atom-key field when a value is present.

- [x] **Step 4: Run focused backend verification**

Run:

```bash
mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
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
