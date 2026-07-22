# Bounded Authorized Management GraphQL Connections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reuse each authorized management Relay connection read when identical
aliases repeat within one GraphQL request.

**Architecture:** One request-scoped KV Dataloader source keys management
connections by authorization scope, collection kind, normalized filters, and
Relay connection arguments. Resolvers authorize before scheduling a load, and
the loader executes the existing owner-filtered or operator-only query once for
each distinct key while preserving the current connection projection.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve owner filtering for specification corrections, price watches, alert
  events, API tokens, saved comparison sets, and comparison snapshots.
- Preserve operator gates for the specification-correction moderation queue and
  merchant feed candidates before any database read.
- Include the current principal ID and authorization role in every private
  cache key.
- Preserve filtering, ordering, cursor/page-size validation, nested values,
  unauthorized errors, and the public GraphQL schema.
- Distinct filters or connection arguments remain distinct reads; only
  identical authorized request work is reused.
- Keep direct resolver fallbacks for contexts without a loader.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Owner Management Connection Loading

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/specs_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/alerts_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/comparison_snapshots_resolver.ex`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`
- Modify the focused owner GraphQL suites named in Task 3 as needed.

**Interfaces:** `Loader.authorized_connection_source/0` exposes a KV source.
Owner resolvers use keys containing collection kind, owner ID, normalized
filters, and connection arguments, then return the existing Relay projection.

- [x] Add failing growing-alias regressions for all six owner collections.
- [x] Assert response semantics and unauthorized zero-query behavior before
  asserting fixed per-collection SELECT budgets.
- [x] Confirm RED because every alias currently executes its query directly.
- [x] Add the request-scoped source and route authenticated resolver paths
  through it while retaining direct fallbacks.
- [x] Re-run the owner management GraphQL suites.
- [x] Commit with message `perf: reuse owner management connection reads`.

### Task 2: Operator Queue Connection Loading

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/specs_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/ingestion_resolver.ex`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`
- Modify: `test/product_compare_web/graphql/specification_corrections_test.exs`
- Modify: `test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`

**Interfaces:** Operator keys contain collection kind, operator ID, normalized
filters, and connection arguments. Authorization runs before scheduling any
load.

- [x] Add failing growing-alias regressions for both operator queues.
- [x] Prove operator values, filters, pagination, forbidden errors, and
  unauthenticated zero-query behavior before query-budget assertions.
- [x] Route authorized operator paths through the shared source without
  changing the existing direct fallback.
- [x] Prove each identical two- and four-alias set has the same SELECT budget.
- [x] Commit with message `perf: reuse operator queue connection reads`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-authorized-management-graphql-connections.md`

- [x] Record exact before/after query counts and authorization, filter,
  pagination, nested-value, and semantic parity coverage.
- [x] Run `mix test test/product_compare_web/graphql/specification_corrections_test.exs
  test/product_compare_web/graphql/price_watches_and_alerts_test.exs
  test/product_compare_web/graphql/api_token_auth_test.exs
  test/product_compare_web/graphql/saved_comparisons_test.exs
  test/product_compare_web/graphql/comparison_snapshots_test.exs
  test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [x] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [x] Include lane evidence in the final code/test milestone commit.

## Completion Evidence

- Six owner collections and two operator queues each observed RED SELECT growth
  of 2/4 for two/four aliases, then GREEN fixed budgets of 1/1.
- Literal response, authorization-before-load, zero-query denial, filters,
  pagination, ordering, nested values, and direct-fallback coverage pass.
- The seven focused suites pass 67 tests; type, format, queue, and diff gates
  pass with three ready successor rows retained.
