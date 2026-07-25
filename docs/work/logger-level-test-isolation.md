# Logger-Level Test Isolation

## Snapshot

- Status: complete
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-24-logger-level-test-isolation-implementation-plan.md`
- Last verified: 2026-07-24 after final-review characterization strengthening
  and focused verification.

## Target Outcome

Ingestion logging-policy tests use process-local Logger overrides and no longer
leak a temporary global debug level into concurrent tests.

## Baseline Evidence

- Before isolation, two ingestion tests called
  `Logger.configure(level: :debug)` and restored it only during `on_exit`.
- The baseline full CI run emitted concurrent SQL/debug output while one of
  those tests held the global debug level.
- The current Elixir runtime exposed process-local Logger level APIs.

## Verification

- `mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/product_compare/ingestion/cj_feed_discovery_test.exs`
- `mix test`
- `mix ci`

## Implementation Evidence

- Replaced the two test-global `Logger.configure(level: :debug)` calls with
  `Logger.put_process_level(self(), :debug)` and test-process `after` cleanup
  through `Logger.delete_process_level(self())`.
- After installing the local override, each test proves the global level is
  unchanged. Each fetcher then proves it sees the original global level and
  `Logger.get_process_level(self()) == :debug` during ingestion; post-call
  assertions prove both policies remain unchanged.
- RED: `mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/product_compare/ingestion/cj_feed_discovery_test.exs`
  (seed `890418`) failed as expected under the previous global configuration:
  both fetchers reported `{:logger_level, nil}` where process-local `:debug`
  was required. The run also emitted the concurrent SQL debug output this batch
  removes.
- GREEN: the final focused command (seed `459573`) passed with `31 tests,
  0 failures` and no leaked SQL/debug output.
- The pre-waiver `mix ci` run passed (exit `0`): work queue validation,
  formatting, compilation, Credo, ExDNA (within its `3/3` clone budget), Reach,
  Dialyzer (`0` errors), backend coverage, Relay, TypeScript, Vitest,
  production build, and the client bundle contract (`182,164` gzip bytes under
  the `200,000` budget). That run preceded final reserve-floor waiver
  reconciliation.
- `git diff --check` passed.

## Verification Concern

- A standalone `mix test` run failed outside this task's owned test area:
  `928 tests, 3 failures`. `test/product_compare/catalog/filtering_regression_test.exs`
  also reproduces the same three query-plan assertions (boolean, enum, and
  numeric filters); PostgreSQL chose `pacur_product_attr_uq` instead of the
  expected `pac_bool_filter_idx`, `pac_enum_filter_idx`, and
  `pac_numeric_filter_idx`. The pre-waiver aggregate `mix ci` test/coverage
  gate passed.
