# Bounded Viewer Community Submission Reads Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep authenticated `Product.viewerCommunitySubmissions` reads fixed
as one GraphQL request grows from one product parent to many.

**Architecture:** Discussions exposes an owner-scoped batch API keyed by
product ID. Each content kind is selected once with a parent-partitioned limit,
then a request-scoped KV Dataloader returns the existing review, question, and
answer lists for each product; anonymous requests retain their zero-query empty
result.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve authenticated owner-only visibility and anonymous empty results.
- Preserve the existing per-kind limit, descending order, and status policy.
- Preserve manageability of a published answer whose parent is not published.
- Keep the public GraphQL schema unchanged and never expose another user's
  submissions.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Owner-Scoped Product Submission Batches

**Files:**

- Modify: `lib/product_compare/discussions.ex`
- Modify: `test/product_compare/discussions/community_trust_test.exs`

**Interfaces:**

- Add `Discussions.viewer_community_submissions_for_products/2`, accepting one
  valid user ID and a list of product IDs and returning every requested valid
  product ID mapped to `%{reviews: [], questions: [], answers: []}` data.
- Make `viewer_community_submissions/2` delegate through the batch API for one
  product so owner visibility cannot drift.

- [ ] Add failing parity tests for empty input, missing products, mixed owner
  and non-owner content, every moderation state, per-kind limits, and the
  published-answer/non-public-question rule.
- [ ] Run the focused community trust suite and confirm the batch API is absent.
- [ ] Implement one parent-partitioned query per content kind with the exact
  existing order, limit, and visibility predicates.
- [ ] Fill every requested valid product ID and delegate the single-product API.
- [ ] Re-run the community trust suite.
- [ ] Commit with message `perf: batch viewer community submission reads`.

### Task 2: Request-Scoped Viewer Submission Dataloader

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/discussions_resolver.ex`
- Modify: `test/product_compare_web/graphql/community_content_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:**

- Add an authenticated KV batch key scoped by current-user ID and use each
  product parent as the Dataloader item.
- Keep the anonymous resolver clause as an immediate empty result without a
  database load.

- [ ] Add a failing authenticated GraphQL query that requests owner submissions
  for three products, grows to six, and captures review/thread/post SELECTs.
- [ ] Assert exact owner-only lists, order, statuses, and hidden-parent answer
  behavior, plus an anonymous zero-data/zero-query case.
- [ ] Prove the three content-table SELECT budgets are identical for three and
  six product parents.
- [ ] Register the source and delegate the authenticated resolver via
  `on_load/2`.
- [ ] Re-run community GraphQL and Dataloader suites.
- [ ] Commit with message `perf: bound viewer community graphql reads`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-viewer-community-submission-reads.md`

- [ ] Record before/after query counts and privacy/semantic coverage.
- [ ] Run `mix test test/product_compare/discussions/community_trust_test.exs
  test/product_compare_web/graphql/community_content_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.
