# Credential Artifact Storage Constraints

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-04-credential-artifact-storage-constraints-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-04-credential-artifact-storage-constraints-design.md`
- Last verified: 2026-08-04 against the live PostgreSQL test catalog, account
  token generation code, owning changesets, and 21 focused account tests.

## Target Outcome

PostgreSQL retains the fixed digest and display-metadata boundaries of account
credential artifacts even when a write bypasses application changesets.

## Ready Evidence

- User session, confirmation, and reset tokens always hash raw tokens with
  SHA-256, yielding 32 bytes, but `users_tokens.token_hash` has no database
  length check.
- API-token changesets require prefix lengths from 1 through 32 characters,
  while PostgreSQL checks only that the prefix is non-empty.
- API-token changesets limit optional labels to 120 characters, while
  PostgreSQL has no label-length check.
- The live catalog reports only `api_tokens_hash_length_check` and
  `api_tokens_prefix_not_empty` across the two credential-artifact tables.
- The focused account baseline passes 21 tests with no failures.

## Boundaries

- Preserve GraphQL, browser-auth, API-token, and cookie-session behavior.
- Keep token generation, hashing algorithms, prefix derivation, labels, and
  expiry behavior unchanged.
- Add no email, password, timestamp-ordering, or generic text-length policy.
- Use a forward migration; never reset the development database.

## Internal Slices

1. Failing direct-write digest and metadata-boundary characterization.
2. Named forward constraints and changeset error mappings.
3. Account lifecycle parity and complete backend verification.

## Verification

- focused credential-artifact direct-write suite
- account auth, API-token, user-session-token schema, GraphQL auth/token/node,
  and deterministic seed suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Stop and report the exact table, column, and length if an existing credential
row violates these established boundaries. Do not truncate, rewrite, or delete
credential artifacts to make the migration pass.
