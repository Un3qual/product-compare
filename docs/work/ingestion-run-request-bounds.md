# Ingestion Run Request Bounds

## Snapshot

- Status: done (pending coordinator queue closeout)
- Owner: Codex `/root` in the detached workspace at
  `/Users/admin/.codex/worktrees/5ad5/backend`
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-04-ingestion-run-request-bounds-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-04-ingestion-run-request-bounds-design.md`
- Last verified: 2026-08-05. The focused request-boundary and ingestion
  lifecycle command passed 53 tests with no failures; the complete backend
  gates passed as recorded below.

## Batch Outcome

PostgreSQL rejects zero and negative `page_size` and `pages_requested` values
on direct `ingestion_runs` writes, while `NULL` and positive values remain
accepted. Existing import-run, scheduling, reconciliation, source-health, and
CJ run-health behavior remains unchanged.

## Completion Evidence

- `mix test test/product_compare/repo/ingestion_run_request_bounds_test.exs
  test/product_compare/ingestion/import_run_concurrency_test.exs
  test/product_compare/ingestion/ingestion_test.exs
  test/product_compare/ingestion/scheduled_cursor_test.exs
  test/product_compare/ingestion/reconciliation_test.exs
  test/product_compare/ingestion/source_health_test.exs
  test/product_compare/ingestion/cj_run_health_test.exs` passed 53 tests with
  no failures.
- `mix test`, `mix typecheck`, `mix quality`, and
  `mix format --check-formatted` completed successfully. Quality found no
  Credo issues and retained the existing ExDNA clone budget at 3/3.
- The sandbox invocation of `mix work_queue.validate` was blocked before
  validation by Mix PubSub's local TCP socket (`:eperm`). The unchanged command
  then passed outside that restriction: `work queue valid: 6 ready rows`.
- `git diff --check` passed after the Task 3 documentation updates.

## Boundaries

- Preserve ingestion scheduling, provider, cursor, reconciliation, and
  source-health behavior.
- Keep both request fields nullable.
- Add no upper bounds or requested-versus-fetched relationship.
- Add no generic numeric policy and never reset the development database.

## Internal Slices

1. Failing direct-write request-boundary characterization.
2. Named forward constraints and owning changeset mappings.
3. Ingestion lifecycle parity and complete backend verification.

## Verification

- focused ingestion-run direct-write suite
- import-run, scheduled-cursor, reconciliation, source-health, and CJ run-health
  suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

## Remaining Work

The coordinator will review this task, then close the live queue row only if
at least three other complete `ready` rows remain, and update the catalog and
dated work-index history.

## Blocker Rule

Stop and report the exact field and value if an existing row contains a
non-null request value below one. Do not rewrite or delete ingestion history to
make the migration pass.
