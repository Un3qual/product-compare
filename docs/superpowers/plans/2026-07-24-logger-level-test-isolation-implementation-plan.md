# Logger-Level Test Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove ingestion code preserves caller logging policy without mutating
the process-global Logger level during tests.

**Architecture:** The two affected tests use Logger's process-level override
for the test process and remove it on exit. Production logging behavior remains
unchanged, while concurrent tests no longer inherit a temporary global debug
level.

**Tech Stack:** Elixir, Logger, ExUnit.

## Global Constraints

- Do not change production logging levels or suppress warning assertions.
- Preserve the existing proof that ingestion functions do not alter caller
  logging policy.

---

## Task 1: Process-Local Logger Proof

**Files:**

- Modify: `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`
- Modify: `test/product_compare/ingestion/cj_feed_discovery_test.exs`
- Modify: `docs/work/logger-level-test-isolation.md`

**Interfaces:**

- Produces: test-local debug policy through
  `Logger.put_process_level(self(), :debug)` and cleanup through
  `Logger.delete_process_level(self())`.

- [ ] Add a regression assertion that the global `Logger.level/0` remains
  unchanged while the fetcher observes the process-local debug level.
- [ ] Run both focused suites and verify the assertion fails with the current
  global `Logger.configure/1` setup.
- [ ] Replace global Logger mutation and restoration with process-level setup
  and cleanup in both tests.
- [ ] Re-run both focused suites; expect zero failures and no leaked SQL/debug
  output from concurrent tests.
- [ ] Run `mix test`, `mix ci`, and `git diff --check`; record the clean output
  evidence in the lane doc.
- [ ] Commit with message `test: isolate ingestion logger levels`.
