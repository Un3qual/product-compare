# User Email Shape Storage Integrity

## Snapshot

- Status: done
- Owner: Codex `/root` in the detached workspace at
  `/Users/admin/.codex/worktrees/5ad5/backend`
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-user-email-shape-storage-integrity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-05-user-email-shape-storage-integrity-design.md`
- Last verified: 2026-08-06 with the applied forward migration, focused
  Accounts lifecycle coverage, and all repository gates.

## Batch Outcome

PostgreSQL rejects persisted `users.email` values that fail the existing
non-whitespace, contains-`@` Accounts validation even when writes bypass
changesets. The named `users_email_shape_check` rejects the `@`-free and
whitespace-containing direct writes, while the valid direct-write control and
existing Accounts lifecycle behavior remain accepted.

## Observed Evidence

- The pre-migration live preflight returned 0 invalid rows for
  `email::text !~ '^[^[:space:]]+@[^[:space:]]+$'`.
- `MIX_ENV=test mix ecto.migrate` applied migration `20260805050000`.
- `mix test test/product_compare/repo/user_email_shape_storage_integrity_test.exs
  test/product_compare/accounts/user_auth_schema_test.exs` passed: 18 tests,
  0 failures (3 direct-write checks and 15 Accounts schema checks).
- The affected Accounts authentication, session, token, and GraphQL browser-auth
  suites passed: 88 tests, 0 failures.
- `mix test` passed: 1,255 tests, 0 failures in 111.8 seconds.
- `mix typecheck`, `mix quality`, and `mix format --check-formatted` passed.
  Quality checked 505 source files and reported no Credo issues; its ExDNA
  clone budget remained at 3/3.
- `mix work_queue.validate` passed with 3 ready rows; `git diff --check` passed.

## Boundaries

- Preserve trimming, lowercasing, `citext` uniqueness, authentication,
  confirmation, session, and API-token behavior.
- Mirror only the existing minimal shape using
  `email::text ~ '^[^[:space:]]+@[^[:space:]]+$'`.
- Add no RFC policy, length limit, domain verification, database trigger, or
  generic validation framework.
- Stop if preflight finds an invalid row; do not rewrite or delete identities.

## Internal Slices

1. Failing direct-write email-shape characterization and valid control.
2. Named forward check plus mappings in both email-owning changesets.
3. Accounts lifecycle parity and repository-gate evidence.

## Verification

- Focused direct-write and Accounts schema suites: 18 tests, 0 failures.
- Accounts authentication, session, token, and GraphQL browser-auth suites:
  88 tests, 0 failures.
- Full backend suite: 1,255 tests, 0 failures.
- Static gates: typecheck, quality, and formatting passed.
- Dispatch and diff gates: `mix work_queue.validate` (3 ready rows) and
  `git diff --check` passed.

## Completion Handoff

- What changed: the direct-write shape constraint and both Accounts changeset
  mappings are verified with lifecycle and repository-gate evidence.
- Remaining work: coordinator dispatch closeout only; no implementation or
  verification blocker remains in this lane.

## Blocker Rule

Stop if the target preflight returns a row. Record its `id` and `email` value
for a coordinator data decision; do not coerce, delete, or otherwise repair
the row as part of this storage-integrity batch.
