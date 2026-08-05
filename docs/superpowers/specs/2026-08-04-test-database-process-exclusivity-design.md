# Test Database Process Exclusivity Design

## Problem

The SQL sandbox isolates tests inside one BEAM process, but it does not isolate
separate `mix test` processes that use the same PostgreSQL database. During the
Batch 16 closeout, two overlapping processes contaminated each other's
committed concurrency tests: one reported three deadlocks while the other
reported an unrelated seed serialization failure. Both suites passed when run
without the competing process.

`MIX_TEST_PARTITION` already provides intentional database separation. The
missing contract is a fail-fast guard for accidental same-database overlap.

## Decision

Acquire one PostgreSQL session advisory lock when `test/test_helper.exs` starts.
The lock identity includes the current database name, so processes using
different `MIX_TEST_PARTITION` databases remain independent. Keep the
dedicated Postgrex connection alive for the lifetime of the test process; the
database releases the lock automatically when the VM exits.

If the lock is already owned, abort before ExUnit runs and explain that another
test process is using the same database. The error must point to
`MIX_TEST_PARTITION` as the supported parallel-execution mechanism.

## Components And Data Flow

- `ProductCompare.TestDatabaseProcessGuard` is test-only support. It opens one
  dedicated Postgrex connection from `ProductCompare.Repo.config/0`, attempts
  the database-scoped advisory lock, returns the connection PID on success,
  and raises an actionable error on contention.
- `test/test_helper.exs` acquires the guard before `ExUnit.start/0` and SQL
  sandbox configuration. No test body begins without ownership.
- A focused test uses a unique lock namespace to prove a second connection to
  the same database is rejected and that stopping the owner releases the lock.

## Alternatives Rejected

- Automatically choose a database per OS process: this would create and retain
  disposable databases, complicate migrations, and bypass the established
  `MIX_TEST_PARTITION` contract.
- Documentation only: guidance cannot prevent concurrent agents or terminals
  from producing false failure evidence.
- Retry deadlocks and serialization failures: retries would hide the invalid
  shared-database execution instead of preventing it.

## Boundaries

- Do not change production runtime, Repo pooling, SQL sandbox ownership, test
  isolation levels, or concurrency assertions.
- Do not serialize processes that use distinct test databases.
- Do not add a generic distributed-lock framework or persistent lock table.
- Database creation and migration behavior remains owned by the existing
  `mix test` alias.

## Verification

- Focused guard contract, including contention and release.
- An external second `mix test` process fails before ExUnit when the first owns
  the same database.
- A normal focused suite and the complete backend suite remain green.
- Formatting, typechecking, quality, queue validation, and diff checks pass.

