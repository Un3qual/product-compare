# Discussions Resolver Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompareWeb.Resolvers.DiscussionsResolver` as the stable
schema-facing resolver while moving public community reads and community
mutation handling into focused internal modules.

**Architecture:** The existing resolver remains the only schema- and
type-facing module and preserves every public callback, clause, result, and
error. `Reads` owns review, question, answer, and viewer-submission resolution;
`Mutations` owns authenticated writes, Global ID decoding, mutation payloads,
and error translation. The facade retains the shared presentation fields and
explicit wrappers.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve every existing `DiscussionsResolver` public function, clause,
  value, loader tuple, result, mutation payload, and error.
- Preserve connection arguments, loader sources and keys, public visibility,
  owner visibility, request batching, authorization, Global ID handling,
  idempotency, rate-limit errors, and moderation behavior.
- Keep schema, type, and test callers dependent only on
  `ProductCompareWeb.Resolvers.DiscussionsResolver`.
- Do not change schemas, migrations, GraphQL SDL, Relay behavior, discussion
  context policy, query budgets, or frontend contracts.

---

### Task 1: Public Read Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/discussions/reads.ex`
- Modify: `lib/product_compare_web/resolvers/discussions_resolver.ex`
- Test: `test/product_compare_web/graphql/community_content_test.exs`
- Test: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:** `Reads` owns review summaries, public review/question/answer
connections, viewer-community-submission reads, public question lookup, and
their Dataloader/direct-query branches. The facade retains
`review_summary/3`, `reviews/3`, `questions/3`,
`viewer_community_submissions/3`, `answers/3`, and `question/3`.

- [ ] Run the two named GraphQL paths as the green characterization baseline.
- [ ] Move the public and viewer-scoped read implementations behind `Reads`
  without changing connection arguments, loader sources or keys, direct-query
  fallbacks, values, visibility, validation errors, or fixed query budgets.
- [ ] Replace facade implementations with explicit wrappers preserving
  clauses, arguments, results, and errors.
- [ ] Re-run the two characterization paths and confirm public values, owner
  values, pagination, validation, and Dataloader budgets remain unchanged.
- [ ] Commit with message `refactor: isolate discussion resolver reads`.

### Task 2: Community Mutation Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/discussions/mutations.ex`
- Modify: `lib/product_compare_web/resolvers/discussions_resolver.ex`
- Test: `test/product_compare_web/graphql/community_content_test.exs`

**Interfaces:** `Mutations` owns review, question, and answer submission;
owner updates and removals; answer acceptance; reporting; moderation; input
and Global ID decoding; success payloads; and mutation-error translation. The
facade retains `submit_review/3`, `ask_question/3`, `answer_question/3`,
`update_review/3`, `update_question/3`, `update_answer/3`, `remove/3`,
`accept_answer/3`, `report/3`, and `moderate/3`.

- [ ] Run the named community GraphQL path before the extraction.
- [ ] Move mutation implementations and their input, action, payload, and
  error helpers into `Mutations` without changing authentication, IDs, input
  fields, ownership, idempotency, moderation, error codes, messages, or
  values.
- [ ] Add explicit facade wrappers preserving clauses, arguments, payloads,
  and errors.
- [ ] Re-run the characterization path and confirm authenticated and anonymous
  behavior, lifecycle policy, replay/conflict, exact limits, payloads, and
  errors remain unchanged.
- [ ] Commit with message `refactor: isolate discussion resolver mutations`.

### Task 3: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/discussions-resolver-decomposition.md`

- [ ] Run the exact 61-test characterization command recorded in the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no schema, type, production, or test caller references
  `Resolvers.Discussions.Reads` or `Resolvers.Discussions.Mutations` directly.
- [ ] Record final ownership, facade and module sizes, exact test count, and
  gate results in the lane doc and include it in the final code/test milestone
  commit.
