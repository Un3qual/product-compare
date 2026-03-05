# GraphQL Catalog Discovery + Quality Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the `products` GraphQL query into a catalog discovery surface with typed filters while hardening executable quality gates (`typecheck`, `precommit`, `ci`) to enforce stricter checks.

**Architecture:** Keep filter logic in existing catalog domain/query modules and only add GraphQL input/normalization glue in the resolver. Enforce Relay global-ID contracts for filter IDs at resolver boundaries. Tighten developer gates in `mix.exs` so routine local/CI commands enforce typecheck and coverage expectations.

**Tech Stack:** Elixir, Phoenix, Absinthe, Ecto, ExUnit

---

## Checklist

- [x] Task 1: Add catalog discovery filters to GraphQL `products` connection with strict ID handling.
- [ ] Task 2: Strengthen quality gates in `mix` aliases and coverage settings.
- [ ] Task 3: Verification checkpoint and milestone commit.

## Task 1: Catalog Discovery Filters On `products`

**Files:**
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/graphql/global_id.ex`
- Test: `test/product_compare_web/graphql/catalog_queries_test.exs`

### Step 1: Write failing GraphQL tests

Add tests for:
- numeric filter by attribute + min/max.
- boolean filter by attribute + value.
- enum filter by attribute + enum option.
- use-case taxon filter.
- invalid filter global IDs rejected deterministically.

### Step 2: Run targeted test file and confirm failure

Run:

```bash
mix test test/product_compare_web/graphql/catalog_queries_test.exs
```

Expected: new filter tests fail before implementation.

### Step 3: Implement minimal resolver/schema support

1. Add `filters` argument to `products` query and define filter input objects.
2. Decode Relay global IDs for `attribute_id`, `enum_option_id`, and `use_case_taxon_ids`.
3. Build query through `Catalog.Filtering.apply_filters/2` and keep stable ordering.
4. Return `invalid ... id` style resolver errors for bad IDs.

### Step 4: Run targeted tests to green

Run:

```bash
mix test test/product_compare_web/graphql/catalog_queries_test.exs
```

Expected: all catalog GraphQL tests pass.

### Step 5: Milestone commit (task section boundary)

```bash
git add \
  lib/product_compare_web/schema.ex \
  lib/product_compare_web/resolvers/catalog_resolver.ex \
  lib/product_compare_web/graphql/global_id.ex \
  test/product_compare_web/graphql/catalog_queries_test.exs \
  docs/plans/2026-03-05-graphql-catalog-discovery-and-quality-hardening-plan.md
git commit -m "feat: add typed catalog discovery filters to products query"
```

## Task 2: Quality Gate Hardening

**Files:**
- Modify: `mix.exs`
- Modify: `docs/implementation-checklist.md`

### Step 1: Write failing gate expectations

Execute stricter gate commands that are expected to fail pre-change if not enforced by aliases:

```bash
mix typecheck
mix precommit
mix ci
```

Expected: aliases are currently weaker than intended policy.

### Step 2: Implement minimal gate tightening

1. Update `typecheck` alias to include compile warnings gate plus xref.
2. Update `precommit` to require `typecheck` and coverage run.
3. Update `ci` to include `typecheck` and coverage run.
4. Add project-level coverage threshold setting with an attainable strict floor for the current suite.
5. Record checkpoint in implementation checklist.

### Step 3: Run gate commands to validate behavior

Run:

```bash
mix typecheck
mix test --cover
mix precommit
mix ci
```

Expected: commands pass with stricter gate path.

### Step 4: Milestone commit (task section boundary)

```bash
git add \
  mix.exs \
  docs/implementation-checklist.md \
  docs/plans/2026-03-05-graphql-catalog-discovery-and-quality-hardening-plan.md
git commit -m "chore: harden mix quality gates and coverage checks"
```

## Task 3: Verification Checkpoint + Batch Commit Summary

### Step 1: Run full verification

```bash
mix compile --warnings-as-errors
mix typecheck
mix test
```

### Step 2: Update checklist/plan progress

- Mark all completed checklist boxes in this plan.
- Update implementation checklist with one concise checkpoint entry.

### Step 3: Final batch checkpoint commit (if needed)

Only if verification/checklist updates are not already included in prior milestone commits.
