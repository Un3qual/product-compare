# Ingestion Run Terminal Timestamp Integrity Design

## Context

`ingestion_runs` records the durable lifecycle of each ingestion attempt. A run
starts in `running` state and `ProductCompare.Ingestion.Runs.complete_import_run/2`
only transitions it to `succeeded` or `failed` through
`ImportRun.completion_changeset/2`. That changeset requires `finished_at`.

The PostgreSQL table leaves `finished_at` nullable, which is correct for a
running row, but its current checks cover only result counters. A direct SQL or
bulk write can therefore persist a terminal `succeeded` or `failed` row with no
completion timestamp. Readiness and health readers defensively treat such a
row as incomplete, but it is not a truthful durable lifecycle record.

The 2026-08-05 live preflight found zero terminal rows without `finished_at`.

## Approaches Considered

### 1. One forward terminal-status check

Add a named check that accepts `running` rows and requires `finished_at` for
both terminal statuses. Map that named check through the owning import-run
changeset and prove it with direct writes.

This is the selected approach. It exactly matches the existing completion
boundary, preserves unfinished runs, and upgrades already-migrated databases.

### 2. Make `finished_at` non-null

This would reject legitimate in-progress runs. It conflicts with the existing
start-then-complete lifecycle and is not the established invariant.

### 3. Add timestamp ordering or reconciliation rules

The existing lifecycle does not establish that `finished_at >= started_at`, a
relationship between completion and reconciliation timestamps, or any new
terminal-state policy. Adding those rules would expand scope beyond storage
integrity for the one known terminal-timestamp invariant.

### 4. Rewrite the original ingestion-run migration

Changing the historical migration would not upgrade databases that already ran
it. A forward migration is required for the durable table.

## Design

Create `20260805040000_enforce_ingestion_run_terminal_timestamp_integrity.exs`
with the named check `ingestion_runs_terminal_finished_at_required`:

```sql
status = 'running' OR finished_at IS NOT NULL
```

Add `check_constraint/3` for that name to
`ProductCompareSchemas.Ingestion.ImportRun.changeset/2`. The existing
`completion_changeset/2` remains the application-level boundary and continues
to require `finished_at` before completing a run.

Add a focused direct-write test that proves PostgreSQL rejects both terminal
statuses with `finished_at = NULL`, while it accepts an unfinished `running`
row and terminal rows with a timestamp. Correct the readiness fixture that
currently creates `succeeded` with `finished_at: nil`: it should model a
truthful unfinished `running` row instead. The pure `fresh?/2` nil-timestamp
case remains useful defensive behavior and does not require persisted-invalid
data.

## Boundaries

- Preserve scheduling, provider selection, request metadata, cursors, result
  counters, reconciliation, source health, and CJ readiness behavior.
- Permit `running` rows with `finished_at = NULL`.
- Require a timestamp only for `succeeded` and `failed` rows.
- Add no timestamp ordering requirement and no reconciliation-timestamp rule.
- Do not alter existing request-bound work, counter checks, or introduce a
  generic lifecycle/storage framework.
- Use a forward migration; never reset or rewrite ingestion history to make it
  pass.

## Verification

- The focused direct-write test must first fail before the new migration and
  then prove the exact named constraint after it.
- The CJ readiness fixture must no longer persist a timestampless terminal
  state; readiness and health suites retain their current observable behavior.
- Complete backend tests, type checks, quality, formatting, queue validation,
  and diff checks must pass before closeout.

## Failure Handling

Before adding the check, run:

```sql
SELECT id, status, finished_at
FROM ingestion_runs
WHERE status IN ('succeeded', 'failed')
  AND finished_at IS NULL;
```

If it returns any rows, stop and report their IDs and statuses. Do not invent a
timestamp, downgrade the run, delete ingestion history, or weaken the check.
