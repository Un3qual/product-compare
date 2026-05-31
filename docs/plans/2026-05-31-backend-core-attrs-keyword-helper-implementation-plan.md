# Backend Core Attrs Keyword Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add keyword-option lookup support to `ProductCompare.Attrs` and reuse it for Commerce Attribution revenue filters.

**Architecture:** `ProductCompare.Attrs` already centralizes atom/string map lookup and presence checks. This batch extends `fetch/3`, `has_key?/2`, and `present?/2` to keyword lists, then removes Commerce Attribution's private revenue-filter lookup helper in favor of the shared core helper.

**Tech Stack:** Elixir, Phoenix context modules, ExUnit.

---

## File Structure

- `lib/product_compare/attrs.ex`: core attr/option lookup helper functions.
- `lib/product_compare/commerce_attribution.ex`: Commerce Attribution context and revenue summary filter normalization.
- `test/product_compare/attrs_test.exs`: focused core attr helper coverage.
- `test/product_compare/commerce_attribution/commerce_attribution_test.exs`: Commerce Attribution revenue summary behavior coverage.
- `docs/work/backend-core-attrs-keyword-helper.md`: source-of-truth work record for this batch.

## Task 1: Core Attrs Keyword Helper

**Files:**
- Modify: `lib/product_compare/attrs.ex`
- Modify: `lib/product_compare/commerce_attribution.ex`
- Modify: `test/product_compare/attrs_test.exs`
- Verify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Create: `docs/work/backend-core-attrs-keyword-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add focused coverage for:
- `Attrs.fetch/3` reading keyword-list values.
- `Attrs.has_key?/2` detecting keyword keys even when the value is nil.
- `Attrs.present?/2` treating keyword nil values as not present.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare/attrs_test.exs
```

Expected: FAIL because keyword inputs currently fall through to default values.

- [x] **Step 3: Implement keyword support**

Add keyword-list clauses to `ProductCompare.Attrs.fetch/3` and `has_key?/2`.

- [x] **Step 4: Replace Commerce Attribution-local revenue filter lookup**

Alias reuse is already present in `ProductCompare.CommerceAttribution`; route `normalize_revenue_filters/1` through `Attrs.fetch/2` and remove private `get_revenue_filter/2`.

- [x] **Step 5: Run focused Commerce Attribution verification**

Run:

```bash
mix test test/product_compare/attrs_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs
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
