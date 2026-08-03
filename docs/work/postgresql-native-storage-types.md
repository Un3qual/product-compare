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

Task 2 is complete: application-owned SHA-256 values for source artifacts,
ingestion reconciliation scopes, and imported product-attribute claims now
persist as constrained 32-byte `bytea` values. The existing unique and partial
index replay behavior is unchanged; reconciliation encodes only its transient
advisory-lock name as hexadecimal text. Focused owner, seed, GraphQL fixture,
and CJ-import suites passed after rebuilding the test schema.

## Next Action

Execute Task 3: migrate the approved cooldown interval and absolute timestamp
values to PostgreSQL-native storage types while preserving their GraphQL
projections.

## Verification Contract

- Keep rows 15, 16, and 17 `ready` throughout this active batch.
- Modify only unreleased first-party migrations; never reset the development database.
- Rebuild only the test schema when migration verification requires it.
- Run each slice's focused red-green tests, then its documented focused suite.
- Run `mix work_queue.validate` and `git diff --check` at each stable milestone.
- Preserve textual GraphQL IP output, integer `cooldownSeconds`, and UTC
  ISO-8601 datetime output.
