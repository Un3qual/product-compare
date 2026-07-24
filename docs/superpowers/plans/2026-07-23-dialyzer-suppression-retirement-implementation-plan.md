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

- [x] Run `mix dialyzer`; capture the reported 11 skipped findings and eight
  unnecessary skips.
- [x] Remove only entries identified as unnecessary by that run.
- [x] Re-run `mix dialyzer`; no unnecessary-skip diagnostics and the
  same reachable warning set.
- [x] Commit with message `chore: remove stale dialyzer suppressions`.

## Task 2: Context And Schema Type Corrections

**Files:**

- Modify: `lib/product_compare/ingestion/sources/cj/product_parser.ex`
- Modify: `lib/product_compare/specs.ex`
- Modify: `lib/product_compare/taxonomy/hierarchy.ex`
- Test: `test/product_compare/ingestion/sources/cj/product_parser_test.exs`
- Test: `test/product_compare/specs/read_helpers_test.exs`
- Test: `test/product_compare/taxonomy/taxon_closure_test.exs`

**Interfaces:**

- Produces: reachable clauses and specs whose success types agree with the
  existing runtime contracts.

- [x] Confirm the existing behavior tests cover the affected parser, enum
  option, and taxonomy transaction contracts.
- [x] Correct the owning pattern/spec or convert opaque collection operations
  to their public API; do not broaden accepted inputs.
- [x] Run all named context suites and `mix dialyzer`; 15 focused tests pass
  and the context/schema findings are absent.
- [x] Commit with message `fix: align context types with runtime contracts`.

## Task 3: Web Boundary Type Corrections

**Files:**

- Modify: `lib/product_compare_web/plugs/fetch_current_user.ex`
- Modify: `lib/product_compare_web/plugs/require_same_origin.ex`
- Modify: `lib/product_compare_web/runtime_config.ex`
- Modify: `test/support/conn_case.ex`
- Test: `test/product_compare_web/runtime_config_test.exs`
- Test: `test/product_compare_web/graphql/session_auth_test.exs`
- Test: `test/product_compare_web/plugs/put_absinthe_context_test.exs`

**Interfaces:**

- Produces: explicit string/port, authorization, and opaque-membership
  boundaries accepted by Dialyzer.

- [x] Characterize the currently accepted config values, origin ports,
  authenticated-user states, and catalog enum selections.
- [x] Normalize values once at their ingress and retain the existing external
  errors and fallbacks.
- [x] Run the named web suites and `mix dialyzer`; 33 focused tests pass and
  no web-boundary findings remain.
- [x] Commit with message `fix: align web boundary types with runtime inputs`.

## Task 4: Remove The Ignore File

**Files:**

- Delete: `.dialyzer_ignore.exs`
- Modify: `docs/work/dialyzer-suppression-retirement.md`

**Interfaces:**

- Produces: an unsuppressed `mix dialyzer` gate with zero findings.

- [x] Remove the default ignore file after the last finding is fixed.
- [x] Run `mix dialyzer`; zero errors, zero skipped findings, and zero
  unnecessary skips.
- [x] Run `mix format --check-formatted`, `mix typecheck`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [x] Record the final warning count and focused-test evidence.
- [ ] Commit with message `chore: enforce unsuppressed dialyzer`.
