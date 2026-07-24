# Community Reads Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Discussions.Reads` as the stable
Discussions-internal read facade while moving legacy reads, public content,
viewer submissions, and public connection paging into focused owners.

**Architecture:** `Legacy` owns direct thread/post/review lists,
`PublicContent` owns published review and Q&A projections,
`ViewerSubmissions` owns owner-scoped non-public projections, and
`Connections` owns bounded per-parent connection queries. The facade retains
all current public functions and shared pagination normalization.

**Tech Stack:** Elixir, Ecto, PostgreSQL window queries, ExUnit, Absinthe
Dataloader.

## Global Constraints

- Preserve every current `Reads` public function, default, guard, result,
  query, order, preload, visibility rule, and query budget.
- Keep `ProductCompare.Discussions` as the only production caller.
- Preserve the limits `50`, `200`, and `50` for default page, maximum page, and
  owner submissions.
- Do not change schemas, migrations, moderation, GraphQL, loaders, Relay, or
  frontend behavior.
- Use behavioral characterization; do not assert internal module names.

---

## Task 1: Legacy Read Ownership

**Files:**

- Create: `lib/product_compare/discussions/reads/legacy.ex`
- Modify: `lib/product_compare/discussions/reads.ex`
- Test: `test/product_compare/discussions/thread_crud_test.exs`
- Test: `test/product_compare/discussions/community_trust_test.exs`

**Interfaces:**

- Consumes: `{limit, offset}` normalized by the `Reads` facade.
- Produces:
  `Legacy.list_threads_for_product/2`,
  `Legacy.list_posts_for_thread/2`, and
  `Legacy.list_reviews_for_product/2`.

- [ ] Run the two named suites as the green baseline.
- [ ] Add explicit facade calls to `Legacy` and run the suites; expect
  compilation to fail because `Legacy` does not exist.
- [ ] Move the three direct list-query implementations into `Legacy`, accepting
  normalized `{limit, offset}` instead of re-normalizing caller options.
- [ ] Retain the current `Reads` public specs, defaults, and wrappers.
- [ ] Re-run both suites; expect all tests to pass with unchanged ordering and
  pagination.
- [ ] Commit with message `refactor: isolate legacy discussion reads`.

## Task 2: Public Content Ownership

**Files:**

- Create: `lib/product_compare/discussions/reads/public_content.ex`
- Modify: `lib/product_compare/discussions/reads.ex`
- Test: `test/product_compare/discussions/community_trust_test.exs`
- Test: `test/product_compare_web/graphql/community_content_test.exs`

**Interfaces:**

- Produces:
  `PublicContent.list_reviews/2`,
  `reviews_query/1`,
  `review_summaries/1`,
  `review_summary/1`,
  `list_questions/2`,
  `questions_query/1`,
  `answers_query/1`,
  `get_question/1`, and
  `get_questions/1`.
- `list_reviews/2` and `list_questions/2` receive normalized
  `{limit, offset}`.

- [ ] Run the two named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner compilation
  failure.
- [ ] Move published review/Q&A queries, review aggregation, entropy-ID lookup,
  ordering, and preloads into `PublicContent`.
- [ ] Preserve zero summaries for valid products without published reviews and
  current invalid-ID lookup behavior.
- [ ] Re-run both suites; expect public visibility and GraphQL behavior to
  remain green.
- [ ] Commit with message `refactor: isolate public discussion reads`.

## Task 3: Viewer Submission Ownership

**Files:**

- Create: `lib/product_compare/discussions/reads/viewer_submissions.ex`
- Modify: `lib/product_compare/discussions/reads.ex`
- Test: `test/product_compare/discussions/community_trust_test.exs`
- Test: `test/product_compare_web/graphql/community_content_test.exs`

**Interfaces:**

- Produces:
  `ViewerSubmissions.for_product/2` and
  `ViewerSubmissions.for_products/2`.
- Returns the current `%{reviews: list(), questions: list(), answers: list()}`
  map per requested product.

- [ ] Run the two named suites before extraction.
- [ ] Add wrappers and verify the expected missing-owner failure.
- [ ] Move owner review, question, and answer queries plus partitioned
  per-product limits into `ViewerSubmissions`.
- [ ] Preserve pending/hidden/rejected visibility and the published-answer
  visibility exception for a non-public parent question.
- [ ] Re-run both suites; expect identical owner privacy and ordering.
- [ ] Commit with message `refactor: isolate viewer discussion reads`.

## Task 4: Public Connection Ownership

**Files:**

- Create: `lib/product_compare/discussions/reads/connections.ex`
- Modify: `lib/product_compare/discussions/reads.ex`
- Test: `test/product_compare_web/graphql/community_content_test.exs`
- Test: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:**

- Produces:
  `Connections.pages/3`, accepting
  `:reviews | :questions | :answers`, parent IDs, and
  `%{offset: non_neg_integer(), fetch_limit: pos_integer()}`.

- [ ] Run both GraphQL suites before extraction.
- [ ] Add the facade delegate and verify the expected missing-owner failure.
- [ ] Move per-parent window queries, published filtering, accepted-post
  preload, order direction, empty-page defaults, and parent-ID projection into
  `Connections`.
- [ ] Re-run both suites; expect semantic results and fixed Dataloader query
  budgets to remain green.
- [ ] Commit with message `refactor: isolate discussion connection reads`.

## Task 5: Full Community Read Gate

**Files:**

- Modify: `docs/work/community-reads-decomposition.md`

- [ ] Run
  `mix test test/product_compare/discussions
  test/product_compare_web/graphql/community_content_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no production caller references `Reads.Legacy`,
  `Reads.PublicContent`, `Reads.ViewerSubmissions`, or `Reads.Connections`
  outside the Discussions read namespace and facade.
- [ ] Record final owner sizes, exact test counts, and gate results in the lane
  doc.
- [ ] Include lane completion evidence in the final community-read code
  milestone commit.
