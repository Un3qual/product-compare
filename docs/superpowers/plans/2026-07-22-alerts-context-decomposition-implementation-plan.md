# Alerts Context Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Alerts` as the stable public context while
moving watch-rule lifecycle, market-fact projection, durable evaluation, and
alert-inbox implementations into focused internal modules.

**Architecture:** `ProductCompare.Alerts` remains the only caller-facing
facade and preserves every public function, arity, typespec, result, and error.
Four `ProductCompare.Alerts.*` owners receive the existing implementations by
responsibility, with explicit internal collaboration for shared market facts.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Oban, Decimal, ExUnit, Absinthe.

## Global Constraints

- Preserve every existing `ProductCompare.Alerts` public function, arity,
  default, guard, typespec, value, and error.
- Preserve owner scope, validation, query ordering/preloads, market-fact
  eligibility, transitions, cooldowns, transactions, locks, event replay
  suppression, delivery attempts, partial failures, retries, and query bounds.
- Keep application callers dependent only on the facade.
- Do not change schemas, migrations, GraphQL SDL, resolver authorization,
  Oban worker behavior, pricing policy, frontend contracts, or transports.

---

### Task 1: Market-Fact And Watch-Rule Ownership

**Files:**

- Create: `lib/product_compare/alerts/market_facts.ex`
- Create: `lib/product_compare/alerts/watch_rules.ex`
- Modify: `lib/product_compare/alerts.ex`
- Test: `test/product_compare/alerts/alerts_test.exs`
- Test: `test/product_compare_web/graphql/price_watches_and_alerts_test.exs`

**Interfaces:** `ProductCompare.Alerts.MarketFacts` owns current product- and
listing-scope facts plus eligible baselines. `ProductCompare.Alerts.WatchRules`
owns watch creation, validation, list queries, updates, deletion, normalization,
and loading. The facade retains `create_watch/2`,
`list_watch_rules_query/1,2`, `update_watch/3`, and `delete_watch/2`.

- [ ] Run the two named suites as the green characterization baseline.
- [ ] Move current-scope fact projection and baseline eligibility into
  `MarketFacts` without changing offer-truth policy, time handling, or maps.
- [ ] Move watch lifecycle implementations into `WatchRules`, consuming
  `MarketFacts` for creation baselines without changing scope validation,
  changesets, reset fields, queries, preloads, results, or errors.
- [ ] Replace the facade implementations with explicit wrappers retaining
  existing defaults, guards, typespecs, and clauses.
- [ ] Re-run both suites and confirm watch creation, validation, owner scope,
  list filtering, updates, deletion, baselines, and GraphQL behavior.
- [ ] Commit with message `refactor: isolate alert watch ownership`.

### Task 2: Inbox Ownership

**Files:**

- Create: `lib/product_compare/alerts/inbox.ex`
- Modify: `lib/product_compare/alerts.ex`
- Test: `test/product_compare/alerts/alerts_test.exs`
- Test: `test/product_compare_web/graphql/price_watches_and_alerts_test.exs`

**Interfaces:** `ProductCompare.Alerts.Inbox` owns owner-scoped event queries,
unread filtering, deterministic ordering, preloads, read-state updates, and
event loading. The facade retains `list_alert_events_query/1,2` and
`mark_alert_read/2`.

- [ ] Run the two named suites as the green characterization baseline.
- [ ] Move alert-event query and read-state implementations into `Inbox`
  without changing owner filters, ordering, preloads, idempotency, or errors.
- [ ] Add explicit facade wrappers preserving defaults, guards, typespecs,
  invalid-input clauses, and result shapes.
- [ ] Re-run both suites and confirm owner isolation, unread pagination,
  preloaded GraphQL values, read idempotency, and not-found behavior.
- [ ] Commit with message `refactor: isolate alert inbox ownership`.

### Task 3: Evaluation Ownership

**Files:**

- Create: `lib/product_compare/alerts/evaluation.ex`
- Modify: `lib/product_compare/alerts.ex`
- Read: `lib/product_compare/alerts/market_facts.ex`
- Test: `test/product_compare/alerts/alerts_test.exs`
- Test: `test/product_compare_web/graphql/price_watches_and_alerts_test.exs`

**Interfaces:** `ProductCompare.Alerts.Evaluation` owns
`evaluate_price_point/1,2`, applicable-watch selection, shared fact projection,
independent row-locked watch transactions, transition/cooldown policy, event
and delivery-attempt insertion, snapshots, retries, and partial-failure
summaries. It consumes `MarketFacts`; the facade retains the public entry point.

- [ ] Run the two named suites as the green characterization baseline.
- [ ] Move evaluation, condition, cooldown, event, delivery, snapshot, and
  summary implementations into `Evaluation` while preserving callback arities,
  transactions, row locks, conflict targets, rollback reasons, and counts.
- [ ] Replace the facade implementation with explicit wrappers preserving the
  default argument, guard, typespec, invalid-ID result, and option behavior.
- [ ] Re-run both suites and confirm freshness/incomplete suppression,
  transitions, cooldowns, replay safety, job behavior, partial failures,
  retries, shared query budgets, event facts, and GraphQL inbox behavior.
- [ ] Commit with message `refactor: isolate alert evaluation ownership`.

### Task 4: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/alerts-context-decomposition.md`

- [ ] Run the exact 13-test characterization command recorded in the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no application caller references `Alerts.WatchRules`,
  `Alerts.MarketFacts`, `Alerts.Evaluation`, or `Alerts.Inbox` directly.
- [ ] Record final ownership, facade size, exact test count, and gate results
  in the lane doc and include it in the final code/test milestone commit.
