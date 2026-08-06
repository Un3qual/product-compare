# Test Database Process Exclusivity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent accidental concurrent `mix test` processes from corrupting evidence by making one process exclusively own each PostgreSQL test database while ExUnit runs.

**Architecture:** A test-only support module holds a dedicated Postgrex session advisory lock derived from the current database and a narrow lock namespace. `test/test_helper.exs` acquires it before ExUnit starts; intentional parallel runs continue to use distinct `MIX_TEST_PARTITION` databases.

**Tech Stack:** Elixir 1.19, ExUnit, Postgrex, PostgreSQL advisory locks, Ecto test configuration.

## Global Constraints

- Keep production runtime, Repo pooling, SQL sandbox ownership, isolation levels, migrations, and concurrency assertions unchanged.
- Fail before ExUnit starts when another process owns the same database lock.
- Name `MIX_TEST_PARTITION` as the supported remedy for intentional parallel execution.
- Release ownership through the dedicated Postgrex session lifetime; do not add a lock table, retry, timeout, sleep, or generic distributed-lock framework.
- Keep different PostgreSQL test databases independent.

---

### Task 1: Guard One Test Database Per External Process

**Files:**

- Create: `test/support/test_database_process_guard.ex`
- Create: `test/product_compare/test_database_process_guard_test.exs`
- Modify: `test/test_helper.exs`
- Modify: `docs/work/test-database-process-exclusivity.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `docs/plans/2026-07-31-work-index-history.md`

**Interfaces:**

- Consumes: `ProductCompare.Repo.config/0`, a test-only lock namespace, and PostgreSQL `pg_try_advisory_lock`.
- Produces: `ProductCompare.TestDatabaseProcessGuard.acquire!/2`, returning the dedicated connection PID on success and raising `RuntimeError` with the database plus `MIX_TEST_PARTITION` guidance on contention.

- [x] **Step 1: Add the failing same-database contention contract**

Create a non-DataCase focused test that generates a unique namespace, acquires
the first guard connection against `ProductCompare.Repo`, and asserts a second
`acquire!/2` raises an error naming the current database and
`MIX_TEST_PARTITION`. Stop the first connection and assert a later acquisition
of the same namespace succeeds, proving session-lifetime release.

Run:

```bash
mix test test/product_compare/test_database_process_guard_test.exs
```

Expected before implementation: compilation fails because
`ProductCompare.TestDatabaseProcessGuard` does not exist.

- [x] **Step 2: Implement the dedicated advisory-lock owner**

Add `acquire!(repo, namespace \\ "external-mix-test-process")`. Start one
dedicated Postgrex connection from `repo.config/0`, query the current database
and atomically attempt a 64-bit advisory lock derived from that database plus
namespace, and return the PID only for `true`. Stop the rejected connection on
`false` and on every query or acquisition failure before reraising or raising
the actionable contention error. Keep the helper test-only under
`test/support`.

- [x] **Step 3: Acquire before ExUnit starts**

Call `ProductCompare.TestDatabaseProcessGuard.acquire!(ProductCompare.Repo)` at
the top of `test/test_helper.exs`, before `ExUnit.start/0` and SQL sandbox mode.
Retain the returned PID in the test-helper process so the Postgrex session owns
the advisory lock until the BEAM exits.

Run:

```bash
mix test test/product_compare/test_database_process_guard_test.exs
mix test test/product_compare/accounts/concurrency_test.exs
```

Expected: both commands pass when run serially. While either command owns the
default test database, a second command without `MIX_TEST_PARTITION` exits
before ExUnit with the actionable contention error.

- [x] **Step 4: Verify and close the reserve outcome**

Run:

```bash
mix format --check-formatted
mix typecheck
mix quality
mix test
mix work_queue.validate
git diff --check
```

Record the observed contention, release, serial focused, and full-gate evidence
in the lane doc. Remove the completed queue row only when at least three other
ready rows remain, append its completion record to work-index history, and move
the plan from the active catalog into completion history.

- [x] **Step 5: Commit**

```bash
git add test/support/test_database_process_guard.ex test/product_compare/test_database_process_guard_test.exs test/test_helper.exs docs/work/test-database-process-exclusivity.md docs/work/index.md docs/plans/INDEX.md docs/plans/2026-07-31-work-index-history.md docs/superpowers/plans/2026-08-04-test-database-process-exclusivity-implementation-plan.md
git commit -m "test: guard shared test database processes"
```
