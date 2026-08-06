# User Email Shape Storage Integrity

## Snapshot

- Status: active
- Owner: Codex `/root` in the detached workspace at
  `/Users/admin/.codex/worktrees/5ad5/backend`
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-user-email-shape-storage-integrity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-05-user-email-shape-storage-integrity-design.md`
- Last verified: 2026-08-05 against the owning Accounts schema, all user
  migrations, and the live PostgreSQL test-database preflight.

## Target Outcome

PostgreSQL rejects persisted `users.email` values that fail the existing
non-whitespace, contains-`@` Accounts validation even when writes bypass
changesets.

## Ready Evidence

- `User.changeset/2` and `User.registration_changeset/2` both apply
  `~r/^[^\s]+@[^\s]+$/` after `User.normalize_email/1`.
- `users.email` is `citext`, non-null, and unique, but migrations define no
  email-shape check constraint.
- Live preflight returned zero rows for
  `email::text !~ '^[^[:space:]]+@[^[:space:]]+$'`.
- The 15-test `user_auth_schema_test.exs` baseline passed with no failures;
  it covers normalization, malformed-email rejection, password hashing, and
  bootstrap behavior.

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

- `test/product_compare/repo/user_email_shape_storage_integrity_test.exs`
- `test/product_compare/accounts/user_auth_schema_test.exs`
- `mix test`, `mix typecheck`, `mix quality`, and
  `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Stop if the target preflight returns a row. Record its `id` and `email` value
for a coordinator data decision; do not coerce, delete, or otherwise repair
the row as part of this storage-integrity batch.
