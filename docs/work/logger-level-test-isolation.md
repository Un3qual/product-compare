# Logger-Level Test Isolation

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-24-logger-level-test-isolation-implementation-plan.md`
- Last verified: 2026-07-24 against full baseline CI output.

## Target Outcome

Ingestion logging-policy tests use process-local Logger overrides and no longer
leak a temporary global debug level into concurrent tests.

## Ready Evidence

- Two ingestion tests call `Logger.configure(level: :debug)` and restore it
  only during `on_exit`.
- Full CI emitted concurrent SQL/debug output while one of those tests held the
  global debug level.
- Logger provides process-local level APIs in the current Elixir runtime.

## Verification

- `mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/product_compare/ingestion/cj_feed_discovery_test.exs`
- `mix test`
- `mix ci`
