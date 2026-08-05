# Credential Artifact Storage Constraints

## Snapshot

- Status: complete
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-04-credential-artifact-storage-constraints-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-04-credential-artifact-storage-constraints-design.md`
- Last verified: 2026-08-05 with 148 affected lifecycle tests and 1,214 full
  backend tests, all with zero failures; type, quality, formatting, queue, and
  diff gates also passed.

## Completed Outcome

PostgreSQL retains the fixed digest and display-metadata boundaries of account
credential artifacts even when a write bypasses application changesets.

## Completed Evidence

- User session, confirmation, and reset tokens hash raw tokens with SHA-256,
  yielding 32 bytes; the prior `users_tokens.token_hash` schema lacked a
  database length check.
- API-token changesets require prefix lengths from 1 through 32 characters;
  the prior PostgreSQL check required only a non-empty prefix.
- API-token changesets limit optional labels to 120 characters; the prior
  PostgreSQL schema had no label-length check.
- The pre-migration catalog exposed only `api_tokens_hash_length_check` and
  `api_tokens_prefix_not_empty` across the two credential-artifact tables.
- Direct-write regressions confirm PostgreSQL rejects 31-byte and 33-byte user
  token digests, empty and 33-character API-token prefixes, and 121-character
  API-token labels with their exact named constraints.
- Direct-write controls confirm PostgreSQL accepts a 32-byte digest, prefixes
  of one and 32 characters, and `NULL` and 120-character labels.
- The affected account lifecycle suite passed 148 tests with no failures; the
  complete backend suite passed 1,214 tests with no failures.

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

## Completion

- Direct-write characterization completed in `ff5f751b` (`test: characterize
  credential artifact storage bounds`).
- Named storage constraints and changeset mappings completed in `89bda46e`
  (`fix: constrain credential artifact storage`).
- On 2026-08-05, `mix typecheck`, `mix quality`, `mix format
  --check-formatted`, `mix work_queue.validate`, and `git diff --check` passed
  after the lifecycle and full-backend test suites.

## Blocker Rule

Stop and report the exact table, column, and length if an existing credential
row violates these established boundaries. Do not truncate, rewrite, or delete
credential artifacts to make the migration pass.
