# Ingestion Run Request Bounds

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-04-ingestion-run-request-bounds-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-04-ingestion-run-request-bounds-design.md`
- Last verified: 2026-08-04 against the live PostgreSQL test catalog, owning
  import-run changeset and migrations, and 32 focused ingestion tests.

## Target Outcome

PostgreSQL retains the positive-when-present bounds of import-run request
metadata even when a write bypasses application changesets.

## Ready Evidence

- `ImportRun.changeset/2` rejects non-null `page_size` and `pages_requested`
  values below one.
- Normal ingestion fixtures and workflows persist positive request values,
  while historical and source-health rows legitimately permit `NULL`.
- The live PostgreSQL catalog has checks for nonnegative result counters and
  reconciliation metadata but no checks for these two request fields.
- The focused ingestion baseline passes 32 tests with no failures.

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

## Blocker Rule

Stop and report the exact field and value if an existing row contains a
non-null request value below one. Do not rewrite or delete ingestion history to
make the migration pass.
