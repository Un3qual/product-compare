# Test Database Process Exclusivity

## Snapshot

- Status: done
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-04-test-database-process-exclusivity-implementation-plan.md`
- Last verified: 2026-08-05 with the focused release regression, an external
  same-database contender, an independent partition, and the complete backend
  gate.

## Batch Outcome

Accidental concurrent `mix test` processes cannot share one PostgreSQL test
database and contaminate each other's committed-transaction evidence.
Intentional parallel processes remain available through distinct
`MIX_TEST_PARTITION` databases.

## What Changed

- `ProductCompare.TestDatabaseProcessGuard` opens a dedicated Postgrex session
  from the Repo configuration, derives a signed 64-bit advisory-lock key from
  the connected database and lock namespace, and holds it for the BEAM process.
- `test/test_helper.exs` acquires the default external-process lock before
  ExUnit or SQL-sandbox setup starts.
- The focused real-PostgreSQL test proves same-database contention and that
  stopping the owner session releases the namespace for a later acquisition.

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

## Completion Evidence

- `mix test test/product_compare/test_database_process_guard_test.exs` passed
  one focused contention-and-release regression, and
  `mix test test/product_compare/accounts/concurrency_test.exs` passed five
  representative committed-concurrency tests.
- With an external BEAM process holding the default guard, a second
  `mix test test/product_compare/test_database_process_guard_test.exs` stopped
  in `test/test_helper.exs` before ExUnit with: `another mix test process
  already owns the product_compare_test test database; set MIX_TEST_PARTITION
  to use a separate test database`.
- While that default-database guard remained held,
  `MIX_TEST_PARTITION=_test_database_guard_proof mix test
  test/product_compare/test_database_process_guard_test.exs` passed its one
  test against the separate partition database.
- `mix format --check-formatted`, `mix typecheck`, `mix quality`, and the full
  `mix test` gate completed successfully. `mix quality` retained the existing
  clone budget at 3/3 and reported no new Credo or cross-function smell issues.

## Remaining Work

None. Current dispatch order remains owned by `docs/work/index.md`.

## Blocker Rule

Stop if holding the advisory lock requires production application changes or
changes the configured database. Preserve `MIX_TEST_PARTITION` and record the
exact Postgrex startup limitation instead of introducing automatic disposable
databases.
