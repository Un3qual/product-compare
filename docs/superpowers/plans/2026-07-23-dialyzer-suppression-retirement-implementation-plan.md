# Dialyzer Suppression Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove stale and reachable Dialyzer suppressions while preserving
runtime behavior and keeping useful public types precise.

**Architecture:** Retire unnecessary ignores first, then correct findings at
their existing Accounts/Catalog/Ingestion/Specs/Taxonomy and web-boundary
owners. The ignore file is deleted only after an unsuppressed run reports no
findings.

**Tech Stack:** Elixir, Dialyzer, Ecto, Phoenix, ExUnit.

## Global Constraints

- Preserve public functions, arities, guards, results, changesets, and errors.
- Do not silence findings with `term()`, `no_return()`, blanket callbacks, or
  replacement ignore patterns.
- Keep opaque Ecto and MapSet handling at the boundary that owns the value.
- Do not change database, GraphQL, browser-auth, or runtime-config policy.

---

## Task 1: Remove Stale Suppressions

**Files:**

- Modify: `.dialyzer_ignore.exs`

**Interfaces:**

- Produces: an ignore file containing only findings emitted by a fresh
  `mix dialyzer` run.

- [ ] Run `mix dialyzer`; capture the reported 11 skipped findings and eight
  unnecessary skips.
- [ ] Remove only entries identified as unnecessary by that run.
- [ ] Re-run `mix dialyzer`; expect no unnecessary-skip diagnostics and the
  same reachable warning set.
- [ ] Commit with message `chore: remove stale dialyzer suppressions`.

## Task 2: Context And Schema Type Corrections

**Files:**

- Modify: `lib/product_compare/accounts.ex`
- Modify: `lib/product_compare/catalog.ex`
- Modify: `lib/product_compare/ingestion.ex`
- Modify: `lib/product_compare/ingestion/sources/cj/product_parser.ex`
- Modify: `lib/product_compare/specs.ex`
- Modify: `lib/product_compare/taxonomy/hierarchy.ex`
- Modify: `lib/product_compare_schemas/discussions/thread_post.ex`
- Test: `test/product_compare/accounts/`
- Test: `test/product_compare/catalog/`
- Test: `test/product_compare/ingestion/`
- Test: `test/product_compare/specs/`
- Test: `test/product_compare/taxonomy/`
- Test: `test/product_compare/discussions/thread_post_validation_test.exs`

**Interfaces:**

- Produces: reachable clauses and specs whose success types agree with the
  existing runtime contracts.

- [ ] Add or extend behavior tests for every clause that Dialyzer identifies
  as unreachable before changing its pattern or spec.
- [ ] Correct the owning pattern/spec or convert opaque collection operations
  to their public API; do not broaden accepted inputs.
- [ ] Run all named context suites and `mix dialyzer`; expect the context and
  schema findings to be absent.
- [ ] Commit with message `fix: align context types with runtime contracts`.

## Task 3: Web Boundary Type Corrections

**Files:**

- Modify: `lib/product_compare_web/plugs/fetch_current_user.ex`
- Modify: `lib/product_compare_web/plugs/require_same_origin.ex`
- Modify: `lib/product_compare_web/resolvers/catalog/input_normalization.ex`
- Modify: `lib/product_compare_web/runtime_config.ex`
- Modify: `test/support/conn_case.ex`
- Test: `test/product_compare_web/runtime_config_test.exs`
- Test: `test/product_compare_web/plugs/`
- Test: `test/product_compare_web/graphql/catalog_filter_metadata_test.exs`

**Interfaces:**

- Produces: explicit string/port, authorization, and opaque-membership
  boundaries accepted by Dialyzer.

- [ ] Characterize the currently accepted config values, origin ports,
  authenticated-user states, and catalog enum selections.
- [ ] Normalize values once at their ingress and retain the existing external
  errors and fallbacks.
- [ ] Run the named web suites and `mix dialyzer`; expect no web-boundary
  findings.
- [ ] Commit with message `fix: align web boundary types with runtime inputs`.

## Task 4: Remove The Ignore File

**Files:**

- Delete: `.dialyzer_ignore.exs`
- Modify: `mix.exs`
- Modify: `docs/work/dialyzer-suppression-retirement.md`

**Interfaces:**

- Produces: an unsuppressed `mix dialyzer` gate with zero findings.

- [ ] Remove the ignore-file option or default-file dependency after the last
  finding is fixed.
- [ ] Run `mix dialyzer`; expect zero errors, zero skipped findings, and zero
  unnecessary skips.
- [ ] Run `mix format --check-formatted`, `mix typecheck`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Record the final warning count and focused-test evidence.
- [ ] Commit with message `chore: enforce unsuppressed dialyzer`.
