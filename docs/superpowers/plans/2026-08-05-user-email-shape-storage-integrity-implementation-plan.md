# User Email Shape Storage Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL reject persisted user emails that the established Accounts changesets reject when a write bypasses application validation.

**Architecture:** Freeze the current narrow email-shape boundary with a direct-write regression, add one reversible named check to `users`, and map the database failure in both existing email-owning changesets. Keep the existing normalization and `citext` uniqueness paths untouched.

**Tech Stack:** Elixir 1.19, Ecto 3.13, PostgreSQL check constraints, ExUnit.

## Global Constraints

- Preserve `User.normalize_email/1`, `citext` uniqueness, registration,
  password, confirmation, session, API-token, and GraphQL browser-auth behavior.
- Use only the existing email rule: at least one `@` and no whitespace.
- Use the semantically equivalent PostgreSQL POSIX predicate
  `email::text ~ '^[^[:space:]]+@[^[:space:]]+$'`.
- Add no RFC email policy, length limit, domain verification, database
  normalization trigger, generic validation helper, or storage framework.
- Stop rather than rewrite identities if the preflight discovers invalid data.
- Use a forward migration and never reset the development database.

---

### Task 1: Characterize the Existing Accounts Storage Gap

**Files:**

- Create: `test/product_compare/repo/user_email_shape_storage_integrity_test.exs`
- Read: `lib/product_compare_schemas/accounts/user.ex`
- Read: `priv/repo/migrations/20260303222608_create_accounts_taxonomy_catalog.exs`
- Read: `priv/repo/migrations/20260306013000_add_hashed_password_to_users.exs`

**Interfaces:**

- Consumes: `users.email`, `users.hashed_password`, and the current Accounts
  changesets.
- Produces: direct-SQL characterization for the planned
  `users_email_shape_check` constraint.

- [ ] **Step 1: Add failing direct-write cases**

  In `UserEmailShapeStorageIntegrityTest`, use `ProductCompare.Repo.query/2`
  to insert rows with a unique valid 32-byte-or-longer fixed test password
  hash and each invalid email `not-an-email` and `has space@example.com`.
  Assert each result is a Postgrex constraint error naming
  `users_email_shape_check`.

- [ ] **Step 2: Add an accepted direct-write control**

  Insert `valid@example.com` with the same required timestamp and password-hash
  columns, then assert the insert succeeds. This proves the check preserves the
  existing non-whitespace, contains-`@` acceptance boundary.

- [ ] **Step 3: Run the focused RED command**

  Run:

  ```bash
  mix test test/product_compare/repo/user_email_shape_storage_integrity_test.exs
  ```

  Expected before the migration: both invalid direct inserts succeed, so the
  exact constraint-name assertions fail.

### Task 2: Add and Map the Exact Named Check

**Files:**

- Create: `priv/repo/migrations/20260805050000_enforce_user_email_shape_integrity.exs`
- Modify: `lib/product_compare_schemas/accounts/user.ex`
- Test: `test/product_compare/repo/user_email_shape_storage_integrity_test.exs`
- Verify: `test/product_compare/accounts/user_auth_schema_test.exs`

**Interfaces:**

- Consumes: the direct-write contract from Task 1.
- Produces: `users_email_shape_check`, mapped to `:email` in both
  `User.changeset/2` and `User.registration_changeset/2`.

- [ ] **Step 1: Run the invalid-row preflight before migrating**

  Run this read-only query against the target database:

  ```sql
  SELECT id, email
  FROM users
  WHERE email::text !~ '^[^[:space:]]+@[^[:space:]]+$'
  ORDER BY id;
  ```

  Expected: zero rows. If rows appear, stop and report their IDs and values;
  do not modify them or run the migration.

- [ ] **Step 2: Add the reversible forward migration**

  In `up/0`, create exactly:

  ```elixir
  create constraint(:users, :users_email_shape_check,
           check: "email::text ~ '^[^[:space:]]+@[^[:space:]]+$'"
         )
  ```

  In `down/0`, remove exactly `:users_email_shape_check` from `:users`.

- [ ] **Step 3: Map the constraint without changing validation policy**

  Add `check_constraint(:email, name: :users_email_shape_check)` after the
  existing `validate_format/4` invocation in both `User.changeset/2` and
  `User.registration_changeset/2`. Retain `update_change(:email,
  &normalize_email/1)` and `unique_constraint(:email)` unchanged.

- [ ] **Step 4: Apply and verify GREEN**

  Run:

  ```bash
  MIX_ENV=test mix ecto.migrate
  mix test test/product_compare/repo/user_email_shape_storage_integrity_test.exs test/product_compare/accounts/user_auth_schema_test.exs
  ```

  Expected: both invalid direct writes report `users_email_shape_check`, the
  valid control succeeds, and all 15 existing Accounts schema tests pass.

- [ ] **Step 5: Commit the implementation milestone**

  ```bash
  git add priv/repo/migrations/20260805050000_enforce_user_email_shape_integrity.exs lib/product_compare_schemas/accounts/user.ex test/product_compare/repo/user_email_shape_storage_integrity_test.exs docs/work/user-email-shape-storage-integrity.md docs/superpowers/plans/2026-08-05-user-email-shape-storage-integrity-implementation-plan.md
  git commit -m "fix: constrain user email shape"
  ```

### Task 3: Record Evidence and Run the Repository Gates

**Files:**

- Modify: `docs/work/user-email-shape-storage-integrity.md`
- Modify: `docs/superpowers/plans/2026-08-05-user-email-shape-storage-integrity-implementation-plan.md`

**Interfaces:**

- Consumes: the named check and passing focused suites from Task 2.
- Produces: observed verification evidence for coordinator dispatch closeout.

- [ ] **Step 1: Record observed data and focused-suite evidence**

  Replace the prospective lane wording only with the actual preflight result,
  direct-write assertion count, and Accounts-suite result. Do not edit
  `docs/work/index.md`, `docs/plans/INDEX.md`, or work-index history; those
  are coordinator-owned dispatch records.

- [ ] **Step 2: Run the full gates**

  ```bash
  mix test
  mix typecheck
  mix quality
  mix format --check-formatted
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 3: Commit the verification record when it changed**

  ```bash
  git add docs/work/user-email-shape-storage-integrity.md docs/superpowers/plans/2026-08-05-user-email-shape-storage-integrity-implementation-plan.md
  git commit -m "docs: verify user email shape integrity"
  ```

Exit condition: PostgreSQL rejects whitespace-containing and `@`-free direct
writes under `users_email_shape_check`, the existing valid shape remains
accepted, and Accounts authentication behavior is unchanged.
