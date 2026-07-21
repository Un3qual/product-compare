# Bounded Community GraphQL Connections Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep public review, question, and nested answer connection queries
fixed as GraphQL product and question parent counts grow.

**Architecture:** The shared Connection module exposes a validated batch window
and converts a pre-fetched `first + 1` row set into the existing Relay shape.
Discussions uses PostgreSQL `row_number()` partitions to fetch one bounded page
per parent in a single query. A request-scoped KV Dataloader keys batches by
connection kind and normalized arguments.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL window functions,
ExUnit.

## Global Constraints

- Public community reads remain published-only and anonymous.
- Preserve current review/question/answer ordering and accepted-answer data.
- Preserve Relay cursors, invalid `first`/cursor errors, and page-info behavior.
- Do not change community writes, moderation, rate limits, or schema shape.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Reusable Pre-Fetched Connection Window

**Files:**

- Modify: `lib/product_compare_web/graphql/connection.ex`
- Modify: `test/product_compare_web/graphql/community_content_test.exs`

**Interfaces:**

- Add `Connection.batch_window(map()) ::
  {:ok, %{offset: non_neg_integer(), fetch_limit: non_neg_integer()}} |
  {:error, :invalid_first | :invalid_cursor}` using the existing first/cursor
  normalization. `fetch_limit` is the normalized `first + 1`.
- Add `Connection.from_prefetched_page([term()], map()) ::
  {:ok, map()} | {:error, :invalid_first | :invalid_cursor}`. Input rows already
  start at the decoded offset and contain at most `first + 1` items; edge cursors
  use absolute indices and page info matches `from_query/3`.

- [x] Add failing equivalence tests for default, zero, clamped, after-cursor,
  final-page, invalid-first, and malformed-cursor cases.
- [x] Run the focused connection/community tests and confirm both APIs are absent.
- [x] Extract shared edge/page projection without changing `from_list/2` or
  `from_query/3` behavior.
- [x] Re-run existing GraphQL connection hardening tests.
- [x] Commit with message `refactor: expose batched relay connection window`.

### Task 2: Parent-Partitioned Community Pages

**Files:**

- Modify: `lib/product_compare/discussions.ex`
- Modify: `test/product_compare/discussions/community_trust_test.exs`

**Interfaces:** Add
`Discussions.public_connection_pages(kind, parent_ids, window)` where `kind` is
`:reviews`, `:questions`, or `:answers`; return
`%{optional(pos_integer()) => [ProductReview.t() | ProductThread.t() |
ThreadPost.t()]}`. Each query computes `row_number()` partitioned by `product_id`
or `thread_id`, applies the current published-only filter/order, and keeps rows
whose number is between `offset + 1` and `offset + fetch_limit`. Question rows
retain accepted-answer preload behavior.

- [x] Add failing context tests comparing batch rows with each current
  single-parent query for multiple parents, empty parents, after offsets, hidden
  rows, exact ties, and accepted answers.
- [x] Run the focused discussion suite and confirm the batch API is absent.
- [x] Implement one query per connection kind, not one query per parent.
- [x] Keep every requested parent ID in the result map with an empty row list
  when it has no published content.
- [x] Re-run all discussion context tests.
- [x] Commit with message `perf: batch public community connection pages`.

### Task 3: Community Connection Dataloader And Budgets

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/discussions_resolver.ex`
- Modify: `test/product_compare_web/graphql/community_content_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:** Register a KV source such as
`{ProductCompareWeb.GraphQL.Loader, :community_connections}`. Resolver batch keys
are `{kind, connection_args}`. Validate arguments with
`Connection.batch_window/1` before loading; the batch callback obtains grouped
rows from Discussions and builds each parent result with
`Connection.from_prefetched_page/2`.

- [x] Add failing GraphQL requests for multiple products with reviews/questions
  and multiple questions with nested answers; capture current SELECT growth.
- [x] Assert published-only edges, exact order, accepted-answer IDs, cursors, and
  `hasNextPage` before asserting budgets.
- [x] Grow product and question fixtures while preserving the same field args;
  assert review/question/answer SELECT counts remain fixed.
- [x] Route all three resolvers through the request-scoped source and preserve
  exact GraphQL error strings for invalid pagination input.
- [x] Re-run community GraphQL and Dataloader suites.
- [x] Commit with message `perf: bound community graphql connections`.

### Task 4: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-community-graphql-connections.md`

- [x] Record before/after query counts and behavior coverage.
- [x] Run the focused tests named in `docs/work/index.md`.
- [x] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [x] Include lane evidence in the final code/test milestone commit.
