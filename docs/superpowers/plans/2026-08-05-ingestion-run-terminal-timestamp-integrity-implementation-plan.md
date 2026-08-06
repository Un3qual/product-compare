# Ingestion Run Terminal Timestamp Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL preserve the established rule that terminal ingestion
runs have a completion timestamp while running rows may remain unfinished.

**Architecture:** Add one forward named PostgreSQL check for the terminal
status/timestamp relationship, map it through the owning import-run changeset,
and characterize the database boundary with direct writes. Correct the one
readiness fixture that currently represents a timestampless terminal row so it
uses the truthful running state instead.

**Tech Stack:** Elixir, Ecto SQL, PostgreSQL check constraints, ExUnit.

## Global Constraints

- Preserve scheduling, provider selection, request metadata, cursors, counters,
  reconciliation, source health, and CJ readiness behavior.
- Preserve nullable `finished_at` for `running` rows.
- Require `finished_at` only when `status` is `succeeded` or `failed`.
- Add no timestamp ordering, reconciliation timestamp, retry, or generic
  lifecycle-framework policy.
- Do not modify the separate ingestion request-bound contract.
- Use a forward migration and never reset or rewrite durable ingestion history.

## Task 1: Characterize The Persisted Terminal Boundary

**Files:**

- Create: `test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs`
- Read: `lib/product_compare_schemas/ingestion/import_run.ex`
- Read: `priv/repo/migrations/20260604191000_create_ingestion_runs.exs`
- Read: `priv/repo/migrations/20260713140000_add_ingestion_reconciliation.exs`

**Interfaces:**

- Consumes: the existing `ingestion_runs` table and terminal statuses.
- Produces: direct-write proof for the terminal timestamp invariant.

- [ ] **Step 1: Add failing terminal direct-write cases**

  Insert minimum valid source and ingestion-run rows with
  `ProductCompare.Repo.query/2` in the SQL sandbox. Assert that direct inserts
  of `succeeded` and `failed` with `finished_at = NULL` return the planned
  exact constraint name.

- [ ] **Step 2: Add accepted-boundary controls**

  Insert one `running` row with `finished_at = NULL` and one row for each
  terminal status with a non-null timestamp. Assert that all three writes
  succeed.

- [ ] **Step 3: Verify RED**

  Run:

  ```sh
  mix test test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs
  ```

  Expected: the terminal-null assertions fail because PostgreSQL has no
  terminal timestamp check yet.

## Task 2: Enforce And Map The Exact Check

**Files:**

- Create: `priv/repo/migrations/20260805040000_enforce_ingestion_run_terminal_timestamp_integrity.exs`
- Modify: `lib/product_compare_schemas/ingestion/import_run.ex`
- Test: `test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs`

**Interfaces:**

- Consumes: the frozen `running` versus terminal timestamp boundary.
- Produces: one named PostgreSQL check and an owning changeset mapping.

- [ ] **Step 1: Run the exact read-only preflight**

  ```sql
  SELECT id, status, finished_at
  FROM ingestion_runs
  WHERE status IN ('succeeded', 'failed')
    AND finished_at IS NULL
  ORDER BY id;
  ```

  Expected: zero rows. If it returns data, stop and report exact IDs and
  statuses; do not fabricate timestamps, change statuses, or delete history.

- [ ] **Step 2: Add the forward migration**

  Create `ingestion_runs_terminal_finished_at_required` with the check
  `status = 'running' OR finished_at IS NOT NULL`. Implement `down/0` to drop
  that exact constraint.

- [ ] **Step 3: Map database failures**

  Add `check_constraint/3` for
  `ingestion_runs_terminal_finished_at_required` in `ImportRun.changeset/2`
  against `:finished_at`. Retain `completion_changeset/2` and its existing
  required/inclusion validations unchanged.

- [ ] **Step 4: Apply the test migration**

  Run:

  ```sh
  MIX_ENV=test mix ecto.migrate
  ```

- [ ] **Step 5: Verify GREEN**

  Run:

  ```sh
  mix test test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs
  ```

  Expected: both terminal-null writes return the exact named check; the
  running-null and terminal-timestamp controls pass.

- [ ] **Step 6: Commit the integrity milestone**

  Commit message: `fix: require timestamps for terminal ingestion runs`

## Task 3: Restore Truthful Readiness Fixtures And Verify Parity

**Files:**

- Modify: `test/product_compare/ingestion/cj_run_readiness_test.exs`
- Test: `test/product_compare/ingestion/cj_run_health_test.exs`
- Test: `test/product_compare/ingestion/scheduled_cursor_test.exs`
- Test: `test/product_compare/ingestion/reconciliation_test.exs`
- Test: `test/product_compare/ingestion/source_health_test.exs`
- Modify: `docs/work/ingestion-run-terminal-timestamp-integrity.md`
- Modify at coordinator closeout only: `docs/work/index.md`, `docs/plans/INDEX.md`,
  `docs/plans/2026-07-31-work-index-history.md`,
  `docs/superpowers/plans/2026-08-05-ingestion-run-terminal-timestamp-integrity-implementation-plan.md`

**Interfaces:**

- Consumes: the named terminal timestamp check and unchanged ingestion readers.
- Produces: truthful readiness fixtures and lifecycle parity evidence.

- [ ] **Step 1: Correct the invalid readiness fixture**

  Replace the later terminal fixture in `cj_run_readiness_test.exs` (currently
  `succeeded` with `finished_at: nil`) with a `running` fixture with
  `finished_at: nil`.
  Retain the assertion that the latest completed success is selected. Keep the
  pure `CJRunReadiness.fresh?(%ImportRun{finished_at: nil}, _) == false` test.

- [ ] **Step 2: Run the focused lifecycle suite**

  Run:

  ```sh
  mix test test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs test/product_compare/ingestion/cj_run_readiness_test.exs test/product_compare/ingestion/cj_run_health_test.exs test/product_compare/ingestion/scheduled_cursor_test.exs test/product_compare/ingestion/reconciliation_test.exs test/product_compare/ingestion/source_health_test.exs
  ```

- [ ] **Step 3: Run repository gates**

  Run:

  ```sh
  mix test
  mix typecheck
  mix quality
  mix format --check-formatted
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 4: Record closeout evidence**

  Replace prospective lane language with observed results. A coordinator may
  update the shared queue, catalog, and history only at the dispatch boundary
  and only while preserving the ready-row floor.

- [ ] **Step 5: Commit closeout**

  Commit message: `docs: close ingestion run terminal timestamp integrity`

Exit condition: PostgreSQL rejects terminal `succeeded` and `failed` runs with
`finished_at = NULL`, accepts unfinished running rows and timestamped terminal
runs, the readiness fixture stores only truthful lifecycle state, and all
focused and repository gates pass.
