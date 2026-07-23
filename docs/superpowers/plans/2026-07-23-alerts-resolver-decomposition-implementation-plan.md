# Alerts Resolver Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompareWeb.Resolvers.AlertsResolver` schema-facing while
moving owner-scoped reads, watch lifecycle actions, and event actions into
focused owners.

**Architecture:** `Resolvers.Alerts.Reads` owns watch and event connections,
`WatchMutations` owns create/update/delete, and `EventMutations` owns inbox
event state changes. The existing resolver retains explicit callback wrappers.

**Tech Stack:** Elixir, Absinthe, Dataloader, Ecto, ExUnit.

## Global Constraints

- Preserve every callback, clause, owner check, Global ID rule, connection
  argument, value, payload, and error.
- Keep schema files dependent only on `AlertsResolver`.
- Preserve watch target/currency/threshold policy and alert event UUID
  behavior.
- Do not change Alerts context behavior, schemas, migrations, GraphQL SDL,
  Relay, or frontend behavior.

---

## Task 1: Alert Read Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/alerts/reads.ex`
- Modify: `lib/product_compare_web/resolvers/alerts_resolver.ex`
- Test: `test/product_compare_web/graphql/price_watches_and_alerts_test.exs`

**Interfaces:**

- Produces:
  `Reads.my_price_watches/3` and
  `Reads.my_alert_events/3`.

- [ ] Run the GraphQL alerts suite as the green baseline.
- [ ] Add facade delegation and verify the expected missing-owner compilation
  failure.
- [ ] Move authenticated owner checks, Dataloader/direct connection loading,
  collection-kind/filter selection, and connection arguments into `Reads`.
- [ ] Preserve unauthenticated errors, status/read filters, pagination, and
  query results.
- [ ] Re-run the suite; expect all tests to pass.
- [ ] Commit with message `refactor: isolate graphql alert reads`.

## Task 2: Price Watch Mutation Ownership

**Files:**

- Create:
  `lib/product_compare_web/resolvers/alerts/watch_mutations.ex`
- Modify: `lib/product_compare_web/resolvers/alerts_resolver.ex`
- Test: `test/product_compare/alerts/alerts_test.exs`
- Test: `test/product_compare_web/graphql/price_watches_and_alerts_test.exs`

**Interfaces:**

- Produces:
  `WatchMutations.create_price_watch/3`,
  `update_price_watch/3`, and
  `delete_price_watch/3`.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move product/merchant-product ID decoding, optional IDs, owner context
  calls, mutation input projection, delete ID projection, and watch/delete
  payload errors into `WatchMutations`.
- [ ] Preserve target validation, currency/threshold values, owner scope,
  error codes/messages/fields, and unauthenticated payloads.
- [ ] Re-run both suites; expect exact watch lifecycle behavior.
- [ ] Commit with message `refactor: isolate graphql watch mutations`.

## Task 3: Alert Event Mutation Ownership

**Files:**

- Create:
  `lib/product_compare_web/resolvers/alerts/event_mutations.ex`
- Modify: `lib/product_compare_web/resolvers/alerts_resolver.ex`
- Test: `test/product_compare_web/graphql/price_watches_and_alerts_test.exs`

**Interfaces:**

- Produces:
  `EventMutations.mark_alert_read/3`.

- [ ] Run the GraphQL alerts suite before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move alert-event Global UUID decoding, owner context call, and event
  payload errors into `EventMutations`.
- [ ] Preserve invalid UUID, not-found/owner, unauthenticated, and idempotent
  read behavior.
- [ ] Re-run the suite; expect all tests to pass.
- [ ] Commit with message `refactor: isolate graphql alert event actions`.

## Task 4: Full Alerts Resolver Gate

**Files:**

- Modify: `docs/work/alerts-resolver-decomposition.md`

- [ ] Run
  `mix test test/product_compare/alerts
  test/product_compare_web/graphql/price_watches_and_alerts_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm schema files call only `AlertsResolver` and focused owners are
  used only by the facade and their own namespace.
- [ ] Record final owner sizes, exact test counts, and gate evidence.
- [ ] Include the lane doc in the final alerts-resolver milestone commit.
