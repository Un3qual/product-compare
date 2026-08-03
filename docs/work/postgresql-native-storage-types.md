# PostgreSQL Native Storage Types

## Approved Outcome

Store first-party IP addresses, SHA-256 digests, elapsed cooldowns, and
absolute instants in PostgreSQL-native types without changing public GraphQL
contracts. IP addresses remain textual only at the operator GraphQL projection
boundary; raw request diagnostics remain private and out of logs.

## Owned Paths

The active coordinator batch owns only the paths named by
`docs/superpowers/plans/2026-08-03-postgresql-native-storage-types-implementation-plan.md`.
Task 1 owns the commerce click-session migration, schema, diagnostics,
operator projection, focused commerce tests, dependency manifest and lockfile,
and the queue/catalog records.

## Internal Slices

1. Native IP capture, `inet` persistence, and GraphQL string presentation.
2. Raw SHA-256 digest storage with existing replay and idempotency behavior.
3. Native cooldown interval and absolute timestamp storage.
4. Compiled-schema and PostgreSQL-catalog storage-policy enforcement.

## Current Milestone

Task 1 is complete: Phoenix `remote_ip` tuples now persist through
`EctoNetwork.INET` to the unreleased PostgreSQL `inet` column, and the
operator ledger converts loaded `%Postgrex.INET{}` values back to textual IP
addresses. PostgreSQL reloads host addresses with their explicit `/32` netmask;
the focused tests assert that canonical native representation while GraphQL
continues exposing only the address text.

## Verification Contract

- Keep rows 15, 16, and 17 `ready` throughout this active batch.
- Modify only unreleased first-party migrations; never reset the development database.
- Rebuild only the test schema when migration verification requires it.
- Run each slice's focused red-green tests, then its documented focused suite.
- Run `mix work_queue.validate` and `git diff --check` at each stable milestone.
- Preserve textual GraphQL IP output, integer `cooldownSeconds`, and UTC
  ISO-8601 datetime output.
