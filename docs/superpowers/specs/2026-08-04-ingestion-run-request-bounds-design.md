# Ingestion Run Request Bounds Design

## Context

Import runs persist two optional request-shape values: `page_size` and
`pages_requested`. The owning changeset accepts either value only when it is a
positive integer, and normal ingestion paths persist positive values. The live
PostgreSQL test catalog enforces nonnegative result counters but has no matching
checks for these request values.

That mismatch lets direct SQL, bulk operations, or a future write path persist
zero or negative request metadata even though the application rejects it. Null
remains meaningful for historical or synthetic health rows and must stay
accepted.

## Approaches Considered

### 1. Forward named constraints with changeset mappings

Add one forward migration with a separate named check for each request field,
permitting `NULL` and otherwise requiring a value greater than zero. Map both
checks through `ImportRun.changeset/2`.

This is the selected approach. Separate names make direct-write failures and
changeset errors actionable, and a forward migration upgrades existing
databases without changing request policy.

### 2. Rewrite the historical ingestion-run migration

This would correct clean rebuilds but would not upgrade databases that already
ran the migration. The table predates this queue work, so a historical rewrite
is not sufficient.

### 3. Add a generic numeric-storage policy

Numeric domains vary across ingestion, pricing, measurements, and evidence.
One classifier would add policy machinery without enforcing these two exact
request invariants. The concrete table checks are smaller and clearer.

## Design

Create a forward migration that adds:

- `ingestion_runs_page_size_positive`, requiring `page_size IS NULL OR
  page_size > 0`; and
- `ingestion_runs_pages_requested_positive`, requiring `pages_requested IS
  NULL OR pages_requested > 0`.

Add both names to `ProductCompareSchemas.Ingestion.ImportRun.changeset/2` with
the corresponding field. A focused repository test uses direct SQL to prove
that zero and negative values fail under the exact constraint name while
`NULL` and `1` remain valid.

## Boundaries

- Preserve ingestion scheduling, cursors, provider calls, reconciliation, and
  source-health behavior.
- Keep both request fields nullable.
- Add no upper limits and no relationship between requested and fetched pages.
- Do not change result-counter constraints or introduce a generic numeric
  policy module.
- Use a forward migration and never reset the development database.

## Verification

- Focused direct-write tests prove both named constraints and accepted
  boundaries.
- Existing ingestion-run and scheduled-cursor suites prove lifecycle parity.
- Full backend tests, type checks, quality, formatting, queue validation, and
  diff checks pass.

## Failure Handling

If an existing row contains a non-null value below one, stop and report its
field and value. Do not rewrite or delete ingestion history to make the
migration pass.
