# Discussions Context Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Discussions` as the stable public context while
moving its unrelated read, CRUD, submission-policy, and moderation
responsibilities into focused internal modules.

**Architecture:** `ProductCompare.Discussions` remains the only caller-facing
facade and preserves every public function, default argument, typespec, result,
and exception boundary. Four `ProductCompare.Discussions.*` modules own the
current implementation by responsibility; callers and schemas do not depend on
the internal modules.

**Tech Stack:** Elixir, Ecto, PostgreSQL, ExUnit, Absinthe.

## Global Constraints

- Preserve every existing `ProductCompare.Discussions` public function and
  arity, including default-argument behavior.
- Preserve query filters, ordering, pagination, locks, transaction boundaries,
  moderation transitions, accepted-answer cleanup, owner privacy, write
  limits, idempotency replay/conflict behavior, and returned errors.
- Keep `ProductCompare.Discussions` as the only application-facing facade;
  resolver, SEO, and test callers must not move to internal modules.
- Do not change database schemas, migrations, GraphQL SDL, Relay behavior, or
  product policy.
- Move code by responsibility without introducing a generic callback or shared
  helper module that obscures ownership.

---

### Task 1: Read Ownership

**Files:**

- Create: `lib/product_compare/discussions/reads.ex`
- Modify: `lib/product_compare/discussions.ex`
- Test: `test/product_compare/discussions/community_trust_test.exs`
- Test: `test/product_compare/seo_test.exs`
- Test: `test/product_compare_web/graphql/community_content_test.exs`
- Test: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:** `ProductCompare.Discussions.Reads` owns the existing list,
public-query, review-summary, owner-submission, public-connection-page, and
public-question lookup implementations. `ProductCompare.Discussions` retains
the exact public wrappers and defaults for:

```elixir
list_threads_for_product/1,2
list_posts_for_thread/1,2
list_reviews_for_product/1,2
list_public_reviews/1,2
public_reviews_query/1
review_summaries/1
review_summary/1
list_public_questions/1,2
viewer_community_submissions/2
viewer_community_submissions_for_products/2
public_questions_query/1
public_answers_query/1
public_connection_pages/3
get_public_question/1
get_public_questions/1
```

- [ ] Run the four named read/GraphQL suites as the green characterization
  baseline.
- [ ] Move the listed implementations and their private query/projection
  helpers into `Reads`, retaining the exact Ecto query construction.
- [ ] Replace each facade implementation with an explicit wrapper that keeps
  its current typespec, defaults, and return value, for example:

```elixir
def list_public_reviews(product_id, opts \\ []),
  do: Reads.list_public_reviews(product_id, opts)
```

- [ ] Re-run the four suites and confirm public values, privacy, pagination,
  query budgets, and SEO qualification remain unchanged.
- [ ] Commit with message `refactor: isolate discussion read ownership`.

### Task 2: Legacy CRUD Ownership

**Files:**

- Create: `lib/product_compare/discussions/crud.ex`
- Modify: `lib/product_compare/discussions.ex`
- Test: `test/product_compare/discussions/product_review_immutability_test.exs`
- Test: `test/product_compare/discussions/thread_crud_test.exs`
- Test: `test/product_compare/discussions/thread_post_validation_test.exs`

**Interfaces:** `ProductCompare.Discussions.Crud` owns raw thread, post, and
review create/update/delete operations plus post-parent validation.
`ProductCompare.Discussions` retains the exact wrappers:

```elixir
create_thread/1
update_thread/2
delete_thread/1
create_post/1
update_post/2
delete_post/1
create_review/1
update_review/2
delete_review/1
```

- [ ] Run the three named CRUD suites as the green characterization baseline.
- [ ] Move the listed operations, verified-purchase sanitization, review row
  lock, and post-parent chain validation into `Crud` without changing
  changesets or transactions.
- [ ] Add explicit facade wrappers with the existing typespecs and pattern
  matches, for example:

```elixir
def update_post(%ThreadPost{} = post, attrs), do: Crud.update_post(post, attrs)
```

- [ ] Re-run the three suites and confirm immutable verified-purchase state,
  parent validation, ordering, errors, and transaction results are unchanged.
- [ ] Commit with message `refactor: isolate discussion crud ownership`.

### Task 3: Submission And Moderation Ownership

**Files:**

- Create: `lib/product_compare/discussions/submissions.ex`
- Create: `lib/product_compare/discussions/moderation.ex`
- Modify: `lib/product_compare/discussions.ex`
- Test: `test/product_compare/discussions/community_trust_test.exs`
- Test: `test/product_compare_web/graphql/community_content_test.exs`

**Interfaces:** `Submissions` owns review/question/answer submission,
owner update/removal, reporting, idempotency receipts, hourly write limits, and
accepted-answer cleanup caused by owner lifecycle changes. `Moderation` owns
answer acceptance and operator moderation. The facade retains:

```elixir
submit_review/3,4
ask_question/3,4
answer_question/3,4
update_owned/4
remove_owned/3
report/4
accept_answer/3
moderate/4,5
```

- [ ] Run the two named lifecycle suites as the green characterization
  baseline.
- [ ] Move submission, idempotency, owner lifecycle, report, and rate-limit
  implementations and their private helpers into `Submissions`.
- [ ] Move answer acceptance, operator moderation, record locking, moderation
  changesets, and terminal-status guards into `Moderation`.
- [ ] Add explicit facade wrappers that retain current guards, default
  arguments, typespecs, and return shapes; keep all resolver calls pointed at
  `ProductCompare.Discussions`.
- [ ] Re-run the lifecycle suites and confirm replay/conflict, exact limits,
  edit-to-pending, retained removal, reporting, accepted-answer cleanup,
  moderation, privacy, and GraphQL errors remain unchanged.
- [ ] Commit with message `refactor: isolate discussion lifecycle ownership`.

### Task 4: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/discussions-context-decomposition.md`

- [ ] Run:

```bash
mix test test/product_compare/discussions/community_trust_test.exs \
  test/product_compare/discussions/product_review_immutability_test.exs \
  test/product_compare/discussions/thread_crud_test.exs \
  test/product_compare/discussions/thread_post_validation_test.exs \
  test/product_compare/seo_test.exs \
  test/product_compare_web/graphql/community_content_test.exs \
  test/product_compare_web/graphql/dataloader_batching_test.exs
```

- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Record final module responsibilities, facade size, exact test counts, and
  gate results in the lane doc.
- [ ] Include the lane evidence in the final code/test milestone commit.
