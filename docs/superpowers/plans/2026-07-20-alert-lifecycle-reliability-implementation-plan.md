# Alert Lifecycle Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evaluate every applicable watch for each price observation and expose
truthful, row-local alert state in the account interface.

**Architecture:** Price-point persistence and Oban enqueue remain atomic.
Evaluation becomes fault-isolated per watch: all watches run, successful events
remain idempotent, and failures are aggregated for job retry. Existing strict
DateTime helpers and row-keyed React state own frontend truth and feedback.

**Tech Stack:** Elixir, Ecto, Oban, Absinthe, React 19, Relay 20, TypeScript,
Vitest, ExUnit.

## Global Constraints

- Do not move watch evaluation into ingestion or the price-point transaction.
- Preserve watch locking, event uniqueness, cooldown semantics, and delivery
  attempt persistence.
- Preserve successful frontend mutation payload handling and route revalidation.
- Use behavior tests and verify RED before production changes.

---

### Task 1: Fault-Isolated Watch Evaluation

**Files:**

- Modify: `lib/product_compare/alerts.ex`
- Modify: `lib/product_compare/alerts/jobs/alert_evaluation_worker.ex`
- Modify: `test/product_compare/alerts/alerts_test.exs`

**Interfaces:** `Alerts.evaluate_price_point/2` continues returning
`{:ok, summary}` when every watch succeeds. If any fail, it returns
`{:error, {:watch_evaluations_failed, failed_watch_ids, summary}}` only after
all watches have run. `summary` retains `evaluated` and `events_created` counts.

- [ ] Add a failing test with three ordered watches where the first evaluator
  fails and later evaluators still run; assert the ordered failed IDs and the
  successful-event summary.
- [ ] Add a replay test proving a retry after one partial failure does not
  duplicate events already created for successful watches.
- [ ] Run `mix test test/product_compare/alerts/alerts_test.exs` and confirm the
  current `Enum.reduce_while/3` halts before later watches.
- [ ] Replace halt-on-error reduction with full evaluation and deterministic
  failure aggregation; update the worker to retry the aggregate error while
  retaining cancellation for a missing price point.
- [ ] Re-run alert context tests and
  `test/product_compare_web/graphql/price_watches_and_alerts_test.exs`.
- [ ] Commit with message `fix: isolate alert watch evaluation failures`.

### Task 2: Strict Alert Observation Labels

**Files:**

- Modify: `assets/src/routes/account/alerts/alerts-view-data.ts`
- Modify: `assets/test/routes/account/alerts/alerts-view-data.test.ts`
- Modify: `assets/test/routes/account/alerts/alerts.route.test.tsx`

**Interfaces:** Alert observation labels use the existing
`graphQLDateTimeLabel(value)` contract. Invalid calendar dates, offset-free
timestamps, and malformed values return the existing exact-source fallback and
never a normalized different date.

- [ ] Add failing pure and route cases for an impossible date and a timestamp
  without an offset while retaining valid UTC and explicit-offset cases.
- [ ] Run the two focused Vitest files and confirm current permissive parsing
  produces a false label.
- [ ] Route alert observation labels through the strict shared helper without
  moving markup, query ownership, or StyleX definitions.
- [ ] Re-run the focused tests and `cd assets && bun run typecheck`.
- [ ] Commit with message `fix: enforce strict alert observation dates`.

### Task 3: Row-Local Alert Mutation Feedback

**Files:**

- Modify: `assets/src/routes/account/alerts/AlertsRoute.tsx`
- Modify: `assets/test/routes/account/alerts/alerts.route.test.tsx`

**Interfaces:** Mutation pending guards and error messages are keyed by alert or
watch ID. A failure on one row renders beside only that row; successful
operations clear that row and preserve route revalidation.

- [ ] Add failing multi-row cases for mark-read, toggle, and delete failures and
  assert the unrelated row remains enabled and error-free.
- [ ] Run the alert route test and confirm the current global error leaks across
  rows.
- [ ] Replace global mutation-error state with row-keyed state and clear only
  the affected key in completion paths.
- [ ] Re-run alert route, view-data, TypeScript, and accessibility assertions.
- [ ] Commit with message `fix: scope alert action state by row`.

### Task 4: Cross-Stack Batch Gate

**Files:**

- Modify: `docs/work/alert-lifecycle-reliability.md`

- [ ] Record backend and frontend RED/GREEN evidence in the new lane doc and
  preserve the coordinator's grouping references to the historical frontend
  evidence.
- [ ] Run focused backend alert and GraphQL suites.
- [ ] Run focused frontend alert suites followed by `cd assets && bun run check`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [ ] Include documentation evidence in the final code/test milestone commit.
