# PostgreSQL Native Storage Types

## Batch Outcome

Store first-party IP addresses, SHA-256 digests, elapsed cooldowns, and
absolute instants in PostgreSQL-native types without changing public GraphQL
contracts. IP addresses remain textual only at the operator GraphQL projection
boundary; raw request diagnostics remain private and out of logs.

## Owned Paths

The completed coordinator batch owned only the paths named by
`docs/superpowers/plans/2026-08-03-postgresql-native-storage-types-implementation-plan.md`.
Task 1 owns the commerce click-session migration, schema, diagnostics,
operator projection, focused commerce tests, dependency manifest and lockfile,
and the queue/catalog records.

## Internal Slices

1. Native IP capture, `inet` persistence, and GraphQL string presentation.
2. Raw SHA-256 digest storage with existing replay and idempotency behavior.
3. Native cooldown interval and absolute timestamp storage.
4. Compiled-schema and PostgreSQL-catalog storage-policy enforcement.

## Observed Milestones And Verification

- Native `inet` click-address capture and textual GraphQL projection committed
  in `fe688455` (`refactor: store click addresses as postgres inet`).
- Raw SHA-256 `bytea` persistence and replay-safe producer boundaries committed
  in `f28e4c65` (`refactor: store sha256 values as binary digests`).
- Day-to-second cooldown intervals and the duration boundary committed in
  `1f26f37a` (`refactor: store watch cooldowns as postgres intervals`), with
  the duration-precision repair in `c30ed341`.
- This closeout commits the accepted Task 4 timestamp/policy diff under
  `refactor: store first-party instants as timestamptz`; its hash is intentionally
  not self-referenced here.

The fresh `product_compare_task5_closeout_test` rebuild proved 159
first-party `timestamptz(6)` columns. The catalog records `inet` click
addresses, three `bytea` SHA-256 columns with their named 32-byte checks, and
`price_watch_rules.cooldown` as `interval DAY TO SECOND` with its named
minimum, maximum, and whole-second checks. The only remaining
`timestamp without time zone` columns belong to `oban_jobs`, `oban_peers`, and
`schema_migrations`.

The required full backend/frontend closeout evidence is recorded in
`.superpowers/sdd/2026-08-03-postgresql-native-storage-types-implementation-plan/task-5-report.md`.
The normal-concurrency backend gate passed 1,170 tests with 0 failures at
85.86% coverage; the frontend gate passed 1,520 tests and both client and SSR
builds, with a 269,845-byte gzip initial bundle under its 300,000-byte budget.

The development database was not reset. It must run `mix ecto.reset` before
using these rewritten unreleased migrations.

## Completed Verification Contract

- Keep rows 15, 16, and 17 `ready` throughout this active batch.
- Modify only unreleased first-party migrations; never reset the development database.
- Rebuild only the test schema when migration verification requires it.
- Run each slice's focused red-green tests, then its documented focused suite.
- Run `mix work_queue.validate` and `git diff --check` at each stable milestone.
- Preserve textual GraphQL IP output, integer `cooldownSeconds`, and UTC
  ISO-8601 datetime output.
