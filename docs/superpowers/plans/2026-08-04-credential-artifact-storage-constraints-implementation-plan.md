# Credential Artifact Storage Constraints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL enforce the established digest and Unicode code-point display-metadata bounds of account credential artifacts.

**Architecture:** Add one forward migration with named checks for user-token digest bytes and API-token prefix/label code-point lengths. Prove the database boundary with direct writes, make the owning changesets count code points explicitly, map mutable constraint failures, and preserve all auth behavior.

**Tech Stack:** Elixir, Ecto SQL, PostgreSQL check constraints, ExUnit.

## Global Constraints

- Preserve all GraphQL, browser-auth, API-token, and cookie-session contracts.
- Do not change token generation, hashing algorithms, prefixes, labels, or expiry behavior.
- Do not normalize, truncate, or otherwise transform stored Unicode values.
- Do not add email-format, password-hash, timestamp-ordering, or expiry policy.
- Do not reset the development database.
- Do not introduce a generic string-length policy framework.

---

## Task 1: Freeze The Credential Artifact Boundary

**Files:**

- Create: `test/product_compare/repo/credential_artifact_storage_constraints_test.exs`
- Read: `lib/product_compare/accounts/user_auth/sessions.ex`
- Read: `lib/product_compare/accounts/api_tokens/secrets.ex`
- Read: `lib/product_compare_schemas/accounts/api_token.ex`
- Read: `lib/product_compare_schemas/accounts/user_session_token.ex`

**Interfaces:**

- Consumes: the current `api_tokens` and `users_tokens` PostgreSQL tables.
- Produces: direct-write regressions for three named storage constraints and their valid boundaries.

- [x] **Step 1: Add failing direct-write tests**

  Use account fixtures for valid parent users and `ProductCompare.Repo.query/2`
  inside the SQL sandbox. Assert the expected named PostgreSQL error for:

  - 31-byte and 33-byte `users_tokens.token_hash` values;
  - empty and 33-code-point `api_tokens.token_prefix` values; and
  - a 121-code-point `api_tokens.label` value.

- [x] **Step 2: Add accepted-boundary controls**

  Insert distinct valid rows proving acceptance of an exactly 32-byte user
  token digest, API-token prefixes of 1 and 32 code points, and API-token labels
  of `NULL` and 120 code points. Use decomposed combining text and an emoji ZWJ
  sequence so the fixtures distinguish code points from graphemes.

- [x] **Step 3: Run the focused test and verify RED**

  Run: `mix test test/product_compare/repo/credential_artifact_storage_constraints_test.exs`

  Expected: user-token digest length, the 33-code-point API-token prefix, and
  the 121-code-point API-token label are accepted instead of returning their
  planned named constraints. The historical empty-prefix check may already
  reject its case under the old name.

## Task 2: Enforce And Map The Named Constraints

**Files:**

- Create: `priv/repo/migrations/20260804220000_enforce_credential_artifact_storage_constraints.exs`
- Modify: `lib/product_compare_schemas/accounts/api_token.ex`
- Modify: `lib/product_compare_schemas/accounts/user_session_token.ex`
- Test: `test/product_compare/repo/credential_artifact_storage_constraints_test.exs`

**Interfaces:**

- Consumes: the exact byte and Unicode code-point boundaries frozen by Task 1.
- Produces: `api_tokens_prefix_length_check`, `api_tokens_label_length_check`, and `users_tokens_hash_length_check` plus owning changeset mappings.

- [x] **Step 1: Add the forward migration**

  In `up/0`, drop `api_tokens_prefix_not_empty`, then create:

  - `api_tokens_prefix_length_check` with
    `char_length(token_prefix) BETWEEN 1 AND 32`;
  - `api_tokens_label_length_check` with
    `label IS NULL OR char_length(label) <= 120`; and
  - `users_tokens_hash_length_check` with
    `octet_length(token_hash) = 32`.

  In `down/0`, remove those three checks and restore
  `api_tokens_prefix_not_empty` with `char_length(token_prefix) > 0`.

- [x] **Step 2: Align application counting and map changeset failures**

  Pass `count: :codepoints` to the prefix and label `validate_length/3` calls,
  then add `check_constraint/3` mappings for both checks in
  `ApiToken.changeset/2`. Add an exact 32-byte `validate_change/3` and the
  `users_tokens_hash_length_check` mapping in `UserSessionToken.changeset/2`.

- [x] **Step 3: Rebuild only the test database**

  Run: `MIX_ENV=test mix ecto.reset`

  If existing data blocks the forward migration outside this clean test
  rebuild, stop and report the exact violating table, column, and length. Do
  not mutate credential data to make the migration pass.

- [x] **Step 4: Run the focused suite and verify GREEN**

  Run: `mix test test/product_compare/repo/credential_artifact_storage_constraints_test.exs`

  Expected: every invalid direct write returns its exact planned constraint and
  every valid boundary insert succeeds.

- [x] **Step 5: Commit the storage boundary milestone**

  Commit message: `fix: constrain credential artifact storage`

## Task 3: Verify Account Lifecycle Parity And Close

**Files:**

- Modify: `docs/work/credential-artifact-storage-constraints.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `docs/plans/2026-07-31-work-index-history.md`
- Modify: `docs/superpowers/plans/2026-08-04-credential-artifact-storage-constraints-implementation-plan.md`

**Interfaces:**

- Consumes: the database constraints and schema mappings delivered by Task 2.
- Produces: lifecycle verification evidence and a queue closeout that retains at least three other ready rows.

- [x] **Step 1: Run affected account suites**

  Run account auth, API-token, user-session-token schema, GraphQL API-token,
  GraphQL session-auth, node-query, and deterministic seed suites.

- [x] **Step 2: Run repository gates**

  Run:

  - `mix test`
  - `mix typecheck`
  - `mix quality`
  - `mix format --check-formatted`
  - `mix work_queue.validate`
  - `git diff --check`

- [x] **Step 3: Record evidence and close the row**

  Replace prospective lane language with observed results, remove the completed
  row only when at least three other complete ready rows remain, update the
  candidate catalog and dated queue history, and mark this plan's checklist
  complete.

- [x] **Step 4: Commit closeout**

  Commit message: `docs: close credential artifact storage constraints`

- [x] **Step 5: Resolve final-review Unicode boundary mismatch**

  Add application and direct-write behavior regressions for decomposed
  combining text and emoji ZWJ sequences. Prove 32/33-code-point prefixes and
  120/121-code-point labels agree between Ecto and PostgreSQL, then record the
  approved code-point unit across the completed lane, catalog, and history.

Exit condition: PostgreSQL rejects malformed credential digests and overlong API-token metadata, valid boundaries remain accepted, account behavior is unchanged, and all backend gates pass.
