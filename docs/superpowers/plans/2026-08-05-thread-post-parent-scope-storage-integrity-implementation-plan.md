# Thread Post Parent Scope Storage Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL preserve the established rule that a thread post's
non-null parent belongs to the same thread.

**Architecture:** Add a unique `(thread_id, id)` referential target and one
composite foreign key from `(thread_id, parent_post_id)` to that target. Map the
named foreign key through the owning `ThreadPost` changeset and prove direct
write enforcement while retaining the existing self-parent check and
application cycle-lock behavior.

**Tech Stack:** Elixir, Ecto SQL, PostgreSQL composite foreign keys and unique
indexes, ExUnit.

## Global Constraints

- Keep `parent_post_id` nullable.
- Preserve the current single-column parent foreign key, self-parent check,
  deletion behavior, and application error message.
- Preserve the thread-row lock and application parent-chain cycle validation.
- Add no cycle trigger, reply-depth policy, accepted-answer policy, moderation
  policy, authored-text policy, or generic hierarchy framework.
- Use one forward migration and never rewrite durable community content.

## Task 1: Characterize Same-Thread Parent Storage

**Files:**

- Create: `test/product_compare/repo/thread_post_parent_scope_storage_integrity_test.exs`
- Read: `lib/product_compare_schemas/discussions/thread_post.ex`
- Read: `lib/product_compare/discussions/content_lifecycle.ex`
- Read: `priv/repo/migrations/20260303222611_create_pricing_affiliate_discussions.exs`

**Interfaces:**

- Consumes: nullable `thread_posts.parent_post_id` and two independent threads.
- Produces: direct-write regressions for the planned composite foreign key.

- [ ] **Step 1: Add the failing cross-thread direct-write case**

  Create two threads and posts using existing fixtures. Use
  `ProductCompare.Repo.query/2` in the SQL sandbox to set a child post's
  `parent_post_id` to a post in the other thread. Assert that PostgreSQL returns
  `thread_posts_parent_same_thread_fkey`.

- [ ] **Step 2: Add accepted-boundary controls**

  Prove that `parent_post_id = NULL` remains valid and that a child may refer to
  a parent with the same `thread_id`. Do not alter the existing
  `thread_posts_parent_not_self_check`. Delete a referenced same-thread parent
  and prove the existing single-column foreign key still nulls the child's
  `parent_post_id`.

- [ ] **Step 3: Verify RED**

  Run:

  ```sh
  mix test test/product_compare/repo/thread_post_parent_scope_storage_integrity_test.exs
  ```

  Expected: the cross-thread assertion fails because PostgreSQL currently
  checks only the parent ID and direct self-parent relationship.

## Task 2: Add And Map Composite Referential Integrity

**Files:**

- Create: `priv/repo/migrations/20260805070000_enforce_thread_post_parent_scope_integrity.exs`
- Modify: `lib/product_compare_schemas/discussions/thread_post.ex`
- Test: `test/product_compare/repo/thread_post_parent_scope_storage_integrity_test.exs`

**Interfaces:**

- Consumes: the existing same-thread application invariant and clean preflight.
- Produces: `thread_posts_thread_id_id_uq` and
  `thread_posts_parent_same_thread_fkey`.

- [ ] **Step 1: Re-run the exact preflight**

  Run this read-only SQL before creating either database object:

  ```sql
  SELECT
    child.id AS child_id,
    child.thread_id AS child_thread_id,
    child.parent_post_id,
    parent.thread_id AS parent_thread_id
  FROM thread_posts AS child
  JOIN thread_posts AS parent ON parent.id = child.parent_post_id
  WHERE child.thread_id <> parent.thread_id;
  ```

  Expected: zero rows, matching the 2026-08-05 live preflight.

- [ ] **Step 2: Add the forward migration**

  Create unique index `thread_posts_thread_id_id_uq` on `(thread_id, id)`, then
  add `thread_posts_parent_same_thread_fkey` with raw `ALTER TABLE` SQL from
  `(thread_id, parent_post_id)` to `thread_posts(thread_id, id)`. In `down/0`,
  drop the composite foreign key before dropping the unique index.

  Use this exact forward statement after creating the unique index:

  ```sql
  ALTER TABLE thread_posts
ADD CONSTRAINT thread_posts_parent_same_thread_fkey
FOREIGN KEY (thread_id, parent_post_id)
REFERENCES thread_posts(thread_id, id)
ON DELETE SET NULL (parent_post_id);
```

  The column-specific action is required: it preserves the existing parent
  deletion behavior without attempting to null the non-null `thread_id`.

- [ ] **Step 3: Map the named foreign key**

  Add
  `foreign_key_constraint(:parent_post_id, name: :thread_posts_parent_same_thread_fkey)`
  to `ThreadPost.changeset/2`. Retain the current `parent_post_id` foreign-key
  mapping and every application validation.

- [ ] **Step 4: Apply the test migration**

  Run:

  ```sh
  MIX_ENV=test mix ecto.migrate
  ```

  If preflight finds a cross-thread parent, stop and report the exact child,
  parent, and thread IDs. Do not mutate content to force migration success.

- [ ] **Step 5: Verify GREEN**

  Run:

  ```sh
  mix test test/product_compare/repo/thread_post_parent_scope_storage_integrity_test.exs
  ```

  Expected: the cross-thread write returns the exact named foreign key; null
  parent, same-thread, and parent-deletion controls pass.

- [ ] **Step 6: Commit the storage-integrity milestone**

  Commit message: `fix: constrain thread post parents to their thread`

## Task 3: Verify Community Behavior And Close

**Files:**

- Test: `test/product_compare/discussions/thread_post_validation_test.exs`
- Test: `test/product_compare/discussions/content_lifecycle_test.exs`
- Test: `test/product_compare/discussions/community_trust_test.exs`
- Test: `test/product_compare_web/graphql/community_content_test.exs`
- Modify: `docs/work/thread-post-parent-scope-storage-integrity.md`
- Modify at coordinator closeout only: `docs/work/index.md`, `docs/plans/INDEX.md`,
  `docs/plans/2026-07-31-work-index-history.md`,
  `docs/superpowers/plans/2026-08-05-thread-post-parent-scope-storage-integrity-implementation-plan.md`

**Interfaces:**

- Consumes: the named composite foreign key and unchanged application cycle
  protection.
- Produces: same-thread containment plus community lifecycle parity evidence.

- [ ] **Step 1: Run focused parent and community suites**

  Run:

  ```sh
  mix test test/product_compare/repo/thread_post_parent_scope_storage_integrity_test.exs test/product_compare/discussions/thread_post_validation_test.exs test/product_compare/discussions/content_lifecycle_test.exs test/product_compare/discussions/community_trust_test.exs test/product_compare_web/graphql/community_content_test.exs
  ```

- [ ] **Step 2: Confirm cycle behavior remains application-owned**

  Verify that `thread_post_validation_test.exs` still passes its direct
  identity-immutability, longer-cycle, cross-thread, query-free
  schema-changeset, and concurrent inverse-parent cases without a new database
  trigger.

- [ ] **Step 3: Run repository gates**

  Run:

  ```sh
  mix test
  mix typecheck
  mix quality
  mix format --check-formatted
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 4: Record closeout evidence**

  Replace prospective lane language with observed results. A coordinator may
  update shared queue, catalog, and history only at a dispatch boundary and
  only while preserving the ready-row floor.

- [ ] **Step 5: Commit closeout**

  Commit message: `docs: close thread post parent scope integrity`

Exit condition: PostgreSQL rejects cross-thread parent references under
`thread_posts_parent_same_thread_fkey`, accepts root and same-thread posts, the
current self-parent and cycle protections remain unchanged, and all focused and
repository gates pass.
