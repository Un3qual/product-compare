# Test Database Process Exclusivity

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-04-test-database-process-exclusivity-implementation-plan.md`
- Last verified: 2026-08-04 against `config/test.exs`, the SQL sandbox setup,
  and observed overlapping Batch 16 verification processes.

## Target Outcome

Accidental concurrent `mix test` processes cannot share one PostgreSQL test
database and contaminate each other's committed-transaction evidence.
Intentional parallel processes remain available through distinct
`MIX_TEST_PARTITION` databases.

## Ready Evidence

- Two overlapping test processes against `product_compare_test` produced three
  `40P01` deadlocks in one focused concurrency gate and an unrelated `40001`
  seed serialization failure in the complete suite.
- The failed seed case and both affected suites passed when rerun without the
  competing process.
- Ecto's SQL sandbox scopes ownership inside one BEAM process; it does not
  isolate independent OS processes using the same database.
- `config/test.exs` already appends `MIX_TEST_PARTITION` to the default database
  name, so intentional external parallelism has an established path.

## Boundaries

- Keep production code, Repo pooling, migrations, SQL sandbox semantics,
  isolation levels, and concurrency assertions unchanged.
- Fail fast instead of retrying or hiding database concurrency failures.
- Use one dedicated Postgrex session advisory lock, not a persistent table or
  general locking abstraction.
- Do not block processes connected to different test databases.

## Internal Slices

1. Same-database contention and session-release regression.
2. Test-helper acquisition before ExUnit execution.
3. External-process proof plus complete backend verification.

## Verification

- focused test-database guard and representative concurrency suites
- same-database second-process failure before ExUnit
- session release with existing `MIX_TEST_PARTITION` configuration unchanged
- full backend test, type, quality, and formatting gates
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Stop if holding the advisory lock requires production application changes or
changes the configured database. Preserve `MIX_TEST_PARTITION` and record the
exact Postgrex startup limitation instead of introducing automatic disposable
databases.
