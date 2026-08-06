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
- Last verified: 2026-08-06 with the corrected test-only migration, focused
  Accounts lifecycle coverage, and post-fix static, dispatch, and diff gates.

## Batch Outcome

PostgreSQL rejects persisted `users.email` values that fail the existing
ASCII-regex-whitespace, contains-`@` Accounts validation even when writes
bypass changesets. The named `users_email_shape_check` rejects the `@`-free and
ASCII-whitespace direct writes, while internal U+2003, U+2028, and U+2029
separators plus the valid direct-write control remain accepted exactly as the
existing non-Unicode Elixir regex accepts them.

## Observed Evidence

- The pre-migration live preflight returned 0 invalid rows for the same
  C-collated predicate used by the constraint.
- The test-only migration `20260805050000` was rolled back and reapplied
  directly after its final-review correction; later test migrations remained
  applied and the development database was not touched.
- `mix test test/product_compare/repo/user_email_shape_storage_integrity_test.exs
  test/product_compare/accounts/user_auth_schema_test.exs` passed: 21 tests,
  0 failures (6 direct-write checks and 15 Accounts schema checks).
- The affected Accounts authentication, session, token, and GraphQL browser-auth
  suites passed: 88 tests, 0 failures.
- Final post-fix `mix test` passed 1,258 tests with 0 failures in 118.1 seconds.
- Final post-fix `mix typecheck`, `mix quality`,
  `mix format --check-formatted`, `mix work_queue.validate` (3 ready rows), and
  `git diff --check` passed. Quality checked 505 source files with no Credo
  issues, retained the ExDNA 3/3 clone budget, and passed Dialyzer.

## Boundaries

- Preserve trimming, lowercasing, `citext` uniqueness, authentication,
  confirmation, session, and API-token behavior.
- Mirror the existing non-Unicode Elixir regex exactly with
  `email::text COLLATE "C" ~ '^[^[:space:]]+@[^[:space:]]+$'`: `C` makes the
  POSIX whitespace class ASCII-scoped, so internal Unicode separators remain
  accepted and ASCII regex whitespace remains rejected.
- Add no RFC policy, length limit, domain verification, database trigger, or
  generic validation framework.
- Stop if preflight finds an invalid row; do not rewrite or delete identities.

## Internal Slices

1. Failing direct-write email-shape characterization, valid control, and
   Unicode/ASCII whitespace parity regressions.
2. Named forward check plus mappings in both email-owning changesets.
3. Accounts lifecycle parity and repository-gate evidence.

## Verification

- Focused direct-write and Accounts schema suites: 21 tests, 0 failures.
- Accounts authentication, session, token, and GraphQL browser-auth suites:
  88 tests, 0 failures.
- Final post-fix full suite: 1,258 tests, 0 failures.
- Final post-fix type, quality, formatting, dispatch, and diff gates passed.
- Dispatch and diff gates: `mix work_queue.validate` (3 ready rows) and
  `git diff --check` passed.

## Blocker Rule

Stop if the target preflight returns a row. Record its `id` and `email` value
for a coordinator data decision; do not coerce, delete, or otherwise repair
the row as part of this storage-integrity batch.
