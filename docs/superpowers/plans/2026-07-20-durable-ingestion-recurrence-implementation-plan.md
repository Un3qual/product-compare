# Durable Ingestion Recurrence Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scheduled CJ jobs deduplicate within one explicit schedule
window while allowing the same normalized scope to run again in later windows.

**Architecture:** Oban remains the durable execution owner. Both schedulers
derive one UTC-hour window at dispatch time and pass it through the existing
argument normalizer; both workers include that value in their unique-key
projection.

**Tech Stack:** Elixir, Phoenix, Ecto, Oban, ExUnit, PostgreSQL.

## Global Constraints

- Preserve non-secret normalized job arguments and existing retry categories.
- Preserve bounded runner options, cursor resolution, timer behavior, and
  disabled-by-default production scheduling.
- Same operation, scope, and window conflict; a different window does not.
- Use behavior tests and verify RED before production changes.

---

### Task 1: Schedule-Window Job Identity

**Files:**

- Modify: `lib/product_compare/ingestion/jobs/cj_product_import_worker.ex`
- Modify: `lib/product_compare/ingestion/jobs/cj_feed_discovery_worker.ex`
- Modify: `test/product_compare/ingestion/jobs/durable_jobs_test.exs`

**Interfaces:** Both workers continue accepting `enqueue(keyword() | map())`.
Their Oban uniqueness key becomes operation-specific normalized scope plus
`schedule_window`.

- [ ] Add failing tests proving a same-window duplicate conflicts and a job
  whose only changed argument is `schedule_window` receives a different ID.
- [ ] Run
  `mix test test/product_compare/ingestion/jobs/durable_jobs_test.exs` and
  confirm the later-window assertions fail against the current uniqueness keys.
- [ ] Add `:schedule_window` to both workers' `@unique_args` lists without
  adding credentials, provider identifiers, or runtime-only values.
- [ ] Re-run the focused test and confirm same-window conflict, later-window
  insertion, normalized runner options, retry, and redaction cases pass.
- [ ] Commit worker and focused test changes together with message
  `fix: scope ingestion uniqueness by schedule window`.

### Task 2: Stable Scheduler Windows

**Files:**

- Modify: `lib/product_compare/ingestion/scheduler_support.ex`
- Modify: `lib/product_compare/ingestion/cj_product_import_scheduler.ex`
- Modify: `lib/product_compare/ingestion/cj_feed_discovery_scheduler.ex`
- Modify: `test/product_compare/ingestion/cj_product_import_scheduler_test.exs`
- Modify: `test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`

**Interfaces:** Add
`ProductCompare.Ingestion.SchedulerSupport.schedule_window(DateTime.t()) :: String.t()`.
It truncates a UTC DateTime to the hour and returns the existing ISO-8601
argument shape. Each scheduler accepts an injectable zero-arity `:clock`
option defaulting to `&DateTime.utc_now/0` and adds the derived
`:schedule_window` to the options passed to its enqueuer.

- [ ] Add scheduler tests with a fixed clock proving two ticks in the same hour
  pass the same window and a later-hour tick passes a different window; retain
  exact assertions for every pre-existing non-secret option.
- [ ] Run the two scheduler test files and confirm the missing window and clock
  contract fails.
- [ ] Implement `schedule_window/1`, normalize the injected clock during
  scheduler initialization, and add the derived value once per dispatch.
- [ ] Re-run both scheduler files and the durable-job test; confirm cursor
  advancement, unexpected-result handling, logging redaction, and recurrence
  remain green.
- [ ] Commit scheduler code and tests with message
  `fix: pass stable windows to ingestion jobs`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/durable-ingestion-recurrence.md`

- [ ] Record RED/GREEN counts and the exact same-window/later-window behavior in
  the lane document without changing the live queue.
- [ ] Run
  `mix test test/product_compare/ingestion/jobs/durable_jobs_test.exs test/product_compare/ingestion/cj_product_import_scheduler_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [ ] Commit lane evidence with the final code/test milestone if it was not
  already included; do not create a checkbox-only commit.
