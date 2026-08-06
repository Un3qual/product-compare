# Community Authored Text Storage Bounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL enforce the established Unicode code-point bounds of community-authored thread, post, review, and report text.

**Architecture:** Add one forward migration with six named checks covering the missing authored-text bounds. Prove the database boundary with direct writes, change all six owning Ecto length validations to count code points explicitly, map failures through the four schemas, and preserve all community lifecycle behavior.

**Tech Stack:** Elixir, Ecto SQL, PostgreSQL check constraints, ExUnit.

## Global Constraints

- Preserve GraphQL payloads, moderation, ownership, write limits, idempotency, and seed behavior.
- Do not change whitespace handling, Markdown policy, nullability, or required fields.
- Do not normalize, truncate, or otherwise transform stored Unicode values.
- Do not add moderation-note, generic text-length, or frontend validation policy.
- Keep the existing `community_reports.reason` `varchar(500)` upper bound unchanged.
- Do not reset the development database.

---

## Task 1: Freeze The Community Authored Text Boundary

**Files:**

- Create: `test/product_compare/repo/community_authored_text_storage_bounds_test.exs`
- Modify: `test/product_compare/discussions/community_trust_test.exs`
- Modify: `test/product_compare/discussions/thread_post_validation_test.exs`
- Modify: `test/product_compare_web/graphql/community_content_test.exs`
- Read: `lib/product_compare_schemas/discussions/product_thread.ex`
- Read: `lib/product_compare_schemas/discussions/thread_post.ex`
- Read: `lib/product_compare_schemas/discussions/product_review.ex`
- Read: `lib/product_compare_schemas/discussions/community_report.ex`

**Interfaces:**

- Consumes: the current community tables plus valid user and product fixtures.
- Produces: direct- and application-write regressions for six named storage checks and their accepted boundaries.

- [ ] **Step 1: Add failing direct- and application-write tests**

  Use `ProductCompare.Repo.query/2` in the SQL sandbox and valid fixture parent
  rows. Assert the exact planned constraint for a zero-code-point and
  201-code-point thread title, a 5,001-code-point thread body, a 5,001-code-point
  post body, a 121-code-point review title, a 5,001-code-point review body, and a
  two-code-point report reason. Add matching changeset/context regressions that
  prove all six owning `validate_length/3` calls use code points rather than
  graphemes. Both the direct-write and application-write suites must each
  contain decomposed combining-text and emoji ZWJ boundary cases.

- [ ] **Step 2: Add accepted-boundary controls**

  Insert distinct valid records proving one- and 200-code-point thread titles;
  `NULL` and 5,000-code-point optional thread/review bodies; a 5,000-code-point
  post body; `NULL` and 120-code-point review titles; and a three-code-point
  report reason. Prove the existing 500-code-point report maximum through an
  application write and the `varchar(500)` database boundary. Derive fixture
  sizes independently and use separate target rows where uniqueness or
  report-target constraints require them.

- [ ] **Step 3: Run the focused test and verify RED**

  Run: `mix test test/product_compare/repo/community_authored_text_storage_bounds_test.exs test/product_compare/discussions/community_trust_test.exs test/product_compare/discussions/thread_post_validation_test.exs test/product_compare_web/graphql/community_content_test.exs`

  Expected: invalid direct writes are accepted because the planned named
  constraints do not exist yet, and the decomposed/emoji application cases
  expose the current grapheme-counting mismatch before production edits.

## Task 2: Enforce And Map The Named Checks

**Files:**

- Create: `priv/repo/migrations/20260805010000_enforce_community_authored_text_storage_bounds.exs`
- Modify: `lib/product_compare_schemas/discussions/product_thread.ex`
- Modify: `lib/product_compare_schemas/discussions/thread_post.ex`
- Modify: `lib/product_compare_schemas/discussions/product_review.ex`
- Modify: `lib/product_compare_schemas/discussions/community_report.ex`
- Test: `test/product_compare/repo/community_authored_text_storage_bounds_test.exs`

**Interfaces:**

- Consumes: the exact Unicode code-point boundaries frozen by Task 1.
- Produces: six named PostgreSQL checks, six explicitly code-point-counting
  changeset validations, and owning constraint mappings.
- Canonical checks and predicates reused by the migration, direct constraint-name
  assertions, Ecto mappings, and completion evidence:
  - `product_threads_title_length_check`:
    `char_length(title) BETWEEN 1 AND 200`
  - `product_threads_body_length_check`:
    `body_md IS NULL OR char_length(body_md) <= 5000`
  - `thread_posts_body_length_check`:
    `char_length(body_md) <= 5000`
  - `product_reviews_title_length_check`:
    `title IS NULL OR char_length(title) <= 120`
  - `product_reviews_body_length_check`:
    `body_md IS NULL OR char_length(body_md) <= 5000`
  - `community_reports_reason_length_check`:
    `char_length(reason) >= 3`

- [ ] **Step 1: Add the forward migration**

  Implement explicit `up/0` and `down/0` functions. `up/0` creates the six
  canonical checks above using `char_length`; nullable fields explicitly allow
  `NULL`. `down/0` drops only those six checks.

- [ ] **Step 2: Align all owning validations and map constraint failures**

  Before or with the database constraints, pass `count: :codepoints` to all six
  owning `validate_length/3` calls: title and body on `ProductThread`, body on
  `ThreadPost`, title and body on `ProductReview`, and reason on
  `CommunityReport`. Add the matching `check_constraint/3` mappings. Preserve
  every existing minimum, maximum, message, nullability, and required-field
  rule.

- [ ] **Step 3: Rebuild only the test database**

  Run: `MIX_ENV=test mix ecto.reset`

  If any existing environment reports violating content, stop with the exact
  table, column, and code-point length. Do not mutate authored content.

- [ ] **Step 4: Run the focused suite and verify GREEN**

  Run the same focused direct- and application-write command from Task 1.

  Expected: each invalid direct write returns its exact named constraint and
  every accepted boundary insert succeeds.

- [ ] **Step 5: Commit the storage boundary milestone**

  Commit message: `fix: constrain community authored text storage`

## Task 3: Verify Community Lifecycle Parity And Close

**Files:**

- Modify: `docs/work/community-authored-text-storage-bounds.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `docs/plans/2026-07-31-work-index-history.md`
- Modify: `docs/superpowers/plans/2026-08-05-community-authored-text-storage-bounds-implementation-plan.md`

**Interfaces:**

- Consumes: the database checks and schema mappings from Task 2.
- Produces: lifecycle verification evidence and a queue closeout retaining at least three other ready rows.

- [ ] **Step 1: Run affected community suites**

  Run content lifecycle, thread-post validation, community trust, GraphQL
  community content, node-query, Dataloader batching, and deterministic seed
  suites serially.

- [ ] **Step 2: Run repository gates**

  Run `mix test`, `mix typecheck`, `mix quality`,
  `mix format --check-formatted`, `mix work_queue.validate`, and
  `git diff --check`.

- [ ] **Step 3: Record evidence and close the row**

  Replace prospective lane language with observed results, remove the
  completed row only when at least three other complete ready rows remain,
  update the candidate catalog and dated queue history, and mark this plan's
  checklist complete.

- [ ] **Step 4: Commit closeout**

  Commit message: `docs: close community authored text storage bounds`

Exit condition: PostgreSQL rejects out-of-bounds community-authored text, all valid boundaries remain accepted, community behavior is unchanged, and all backend gates pass.
