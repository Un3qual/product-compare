# Thread Post Parent Scope Storage Integrity

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-thread-post-parent-scope-storage-integrity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-05-thread-post-parent-scope-storage-integrity-design.md`
- Last verified: 2026-08-05 against the owning application validation,
  original migration, live cross-thread preflight, and focused thread-post
  tests.

## Target Outcome

PostgreSQL permits a thread post with no parent and rejects a non-null
`parent_post_id` unless that parent belongs to the same thread, even when a
write bypasses `ContentLifecycle.validate_post_parent/1`.

## Ready Evidence

- `ContentLifecycle.validate_post_parent/1` loads the requested parent and adds
  `"must belong to the same thread"` when the parent and child thread IDs
  differ.
- The original migration has an ordinary `parent_post_id` foreign key and
  `thread_posts_parent_not_self_check`, but no composite relationship tying the
  child and parent thread IDs together.
- The live preflight returned zero cross-thread parent relationships:

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

- Fresh focused baseline: `thread_post_validation_test.exs` passed five tests,
  including cross-thread rejection and serialized inverse-parent cycle
  protection.

## Boundaries

- Keep `parent_post_id` nullable.
- Preserve the current single-column parent foreign key, self-parent check,
  deletion behavior, and application error contract.
- Use PostgreSQL 18 column-specific `ON DELETE SET NULL (parent_post_id)` on
  the composite foreign key so parent deletion never attempts to null
  non-null `thread_id`.
- Preserve thread-row locking and recursive application cycle validation.
- Add no recursive cycle trigger, reply-depth limit, accepted-answer rule,
  moderation rule, authored-text rule, or generic hierarchy framework.
- Stop rather than rewriting or deleting a pre-existing cross-thread link.

## Internal Slices

1. Failing direct-write cross-thread characterization with null and same-thread
   controls plus parent-deletion parity.
2. Unique composite target, named same-thread foreign key, and owning changeset
   mapping.
3. Parent/cycle behavior parity, community lifecycle verification, and complete
   backend gates.

## Verification

- `mix test test/product_compare/repo/thread_post_parent_scope_storage_integrity_test.exs`
  for RED and GREEN database-boundary proof
- `MIX_ENV=test mix ecto.migrate`
- `mix test test/product_compare/repo/thread_post_parent_scope_storage_integrity_test.exs test/product_compare/discussions/thread_post_validation_test.exs test/product_compare/discussions/content_lifecycle_test.exs test/product_compare/discussions/community_trust_test.exs test/product_compare_web/graphql/community_content_test.exs`
- `mix test`, `mix typecheck`, `mix quality`, and `mix format --check-formatted`
- `mix work_queue.validate` and `git diff --check`

## Blocker Rule

If preflight finds a cross-thread parent, stop and report the child ID,
parent-post ID, child thread ID, and parent thread ID. Do not detach, reparent,
move, or delete community content, and do not weaken the composite foreign key.
