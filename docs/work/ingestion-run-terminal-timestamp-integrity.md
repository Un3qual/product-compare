# Ingestion Run Terminal Timestamp Integrity

## Snapshot

- Status: validated successor; promote after active ingestion request-bound
  batch 22 closes
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-ingestion-run-terminal-timestamp-integrity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-05-ingestion-run-terminal-timestamp-integrity-design.md`
- Last verified: 2026-08-05 against the live PostgreSQL catalog and row
  preflight, the owning import-run changeset and lifecycle path, and focused
  ingestion tests (41 passing tests).

## Target Outcome

PostgreSQL rejects terminal `succeeded` and `failed` ingestion runs without
`finished_at`, while a `running` ingestion run may remain unfinished even when
a write bypasses application changesets.

## Ready Evidence

- `ImportRun.completion_changeset/2` requires `finished_at` and permits only
  terminal `succeeded` or `failed` statuses for completion.
- `Runs.complete_import_run/2` defaults `finished_at` and invokes that
  completion changeset only for an existing `running` row.
- The original `ingestion_runs` migration makes `finished_at` nullable and
  defines only the nonnegative result-counter check; no terminal timestamp
  check exists.
- The live preflight returned zero rows for terminal statuses with a null
  completion timestamp:

  ```sql
  SELECT id, status, finished_at
  FROM ingestion_runs
  WHERE status IN ('succeeded', 'failed')
    AND finished_at IS NULL;
  ```

- Fresh focused baseline: `cj_run_health`, `cj_run_readiness`, and
  `ingestion_test` passed 41 tests. `CJRunReadiness` explicitly exercises
  latest-success selection and nil-timestamp defensiveness, while
  `CJRunHealth` projects timestamped successful and failed runs. The former's
  one persisted timestampless-success fixture must become a truthful
  unfinished `running` fixture before the storage check lands.

## Boundaries

- Preserve scheduling, provider selection, request metadata, cursors, counters,
  reconciliation, source health, and CJ readiness behavior.
- Keep `finished_at` nullable for `running` rows.
- Require it only for terminal `succeeded` and `failed` rows.
- Add no timestamp ordering, reconciliation timestamp, retry, or generic
  lifecycle/storage policy.
- Do not modify the separately ready ingestion request-bounds outcome.
- Stop rather than rewriting or deleting a pre-existing invalid ingestion row.

## Internal Slices

1. Failing direct-write terminal timestamp characterization and accepted
   running/terminal controls.
2. One named forward check and its owning import-run changeset mapping.
3. Truthful CJ readiness fixture replacement, lifecycle parity, and complete
   backend verification.

## Verification

- `mix test test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs`
  for RED and GREEN boundary proof
- `MIX_ENV=test mix ecto.migrate`
- `mix test test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs test/product_compare/ingestion/cj_run_readiness_test.exs test/product_compare/ingestion/cj_run_health_test.exs test/product_compare/ingestion/scheduled_cursor_test.exs test/product_compare/ingestion/reconciliation_test.exs test/product_compare/ingestion/source_health_test.exs`
- `mix test`, `mix typecheck`, `mix quality`, and `mix format --check-formatted`
- `mix work_queue.validate` and `git diff --check`

## Blocker Rule

If preflight finds a `succeeded` or `failed` row whose `finished_at` is null,
stop and report the exact IDs and statuses. Do not fabricate a completion time,
downgrade the status, delete ingestion history, or weaken the terminal check.
