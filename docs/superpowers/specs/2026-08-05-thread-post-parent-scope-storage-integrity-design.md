# Thread Post Parent Scope Storage Integrity Design

## Context

`thread_posts` supports root posts and replies. A root post has
`parent_post_id = NULL`; a reply may reference another post only inside its own
thread. `ProductCompare.Discussions.ContentLifecycle` already loads the parent
and rejects a parent whose `thread_id` differs from the child's `thread_id`.

PostgreSQL currently enforces that `parent_post_id` references an existing
`thread_posts.id` and that a post cannot directly parent itself. Those checks do
not prevent a direct SQL, bulk, or future bypass write from attaching a post in
one thread to a parent in another thread.

The 2026-08-05 live preflight found zero cross-thread parent references. The
focused `thread_post_validation_test.exs` baseline passed five tests.

## Approaches Considered

### 1. Composite same-thread foreign key

Add a unique `(thread_id, id)` target and a composite foreign key from
`(thread_id, parent_post_id)` to that target. PostgreSQL foreign-key null
semantics preserve root posts, while a non-null parent must match both the
owning thread and post ID.

This is the selected approach. It expresses the existing containment rule as
ordinary referential integrity, uses no trigger, and upgrades existing
databases through one forward migration.

### 2. Trigger-based hierarchy validation

A trigger could enforce same-thread containment and recursively search for
cycles. The application already owns cycle prevention with a thread-row lock
and parent-chain validation. Adding a recursive database trigger would broaden
this batch, duplicate concurrency policy, and introduce a different failure
and rollback boundary.

### 3. Keep application-only validation

This preserves current context behavior but leaves direct writes able to create
cross-thread reply graphs. It does not close the storage-integrity gap.

### 4. Fold accepted-answer references into the same migration

`product_threads.accepted_post_id` has different publication and transaction
semantics. It would need a separate reviewer decision and potentially deferred
enforcement. It is not part of parent-reply containment.

## Design

Create
`20260805070000_enforce_thread_post_parent_scope_integrity.exs` with:

- unique index `thread_posts_thread_id_id_uq` on `(thread_id, id)`; and
- composite foreign key `thread_posts_parent_same_thread_fkey` from
  `(thread_id, parent_post_id)` to `thread_posts(thread_id, id)`.

The forward SQL is:

```sql
ALTER TABLE thread_posts
ADD CONSTRAINT thread_posts_parent_same_thread_fkey
FOREIGN KEY (thread_id, parent_post_id)
REFERENCES thread_posts(thread_id, id)
ON DELETE SET NULL (parent_post_id);
```

Keep the current single-column parent foreign key and
`thread_posts_parent_not_self_check`. PostgreSQL 18's column-specific
`ON DELETE SET NULL (parent_post_id)` on the composite foreign key preserves
the existing deletion behavior without attempting to null non-null
`thread_id`; both foreign keys therefore converge on the same child update.

Map `thread_posts_parent_same_thread_fkey` to `:parent_post_id` in
`ProductCompareSchemas.Discussions.ThreadPost.changeset/2`. Add a focused
repository test proving that a cross-thread direct write fails under the exact
constraint name, while a root post, same-thread reply, and existing
parent-deletion-to-null behavior remain valid. Retain the existing context test
proving the application returns "must belong to the same thread" before
attempting the write.

## Preflight

Run this read-only query before adding the composite foreign key:

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

The verified 2026-08-05 result is zero rows.

## Boundaries

- Keep `parent_post_id` nullable.
- Preserve the current single-column parent foreign key, self-parent check,
  deletion behavior, and application error contract.
- Preserve the existing thread-row lock and recursive application cycle
  validation.
- Add no recursive cycle trigger, reply-depth limit, accepted-answer rule,
  moderation rule, authored-text rule, or generic hierarchy framework.
- Use a forward migration and never rewrite or delete community content to make
  it pass.

## Verification

- The focused direct-write test first demonstrates RED without the composite
  foreign key and then proves its exact name after migration.
- Existing thread-post validation tests retain identity immutability,
  cross-thread rejection, cycle rejection, query-free changesets, and
  concurrency behavior.
- Community lifecycle and GraphQL suites confirm reply behavior is unchanged.
- Complete backend tests, type checks, quality, formatting, queue validation,
  and diff checks pass before closeout.

## Failure Handling

If preflight returns any cross-thread relationship, stop and report the child,
parent, and both thread IDs. Do not detach, reparent, move, or delete community
content, and do not weaken the composite foreign key.
