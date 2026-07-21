# Bounded Public Opaque-Key GraphQL Reads Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the remaining public nullable root lookups keyed by opaque IDs
or tokens within fixed SELECT budgets as aliases in one GraphQL request grow.

**Architecture:** Specs, Discussions, and ComparisonSnapshots expose set-based
lookup APIs that preserve their existing source preload, publication gate,
revocation gate, hydration, invalid-input, and missing-result behavior. One
request-scoped KV Dataloader source batches `sourceArtifact(id:)`,
`productQuestion(id:)`, and `comparisonSnapshot(token:)` independently by
lookup kind, after the resolvers perform the same ID decoding they do today.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Keep the public GraphQL schema unchanged.
- Preserve invalid global-ID errors for source artifacts and product questions.
- Preserve valid missing lookups as `nil` without GraphQL errors.
- Preserve SourceArtifact source preloading and safe public fields.
- Preserve product-question publication filtering and accepted-answer loading.
- Preserve snapshot token validation, revocation filtering, payload hydration,
  and the absence of owner identity from public reads.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Set-Based Public Opaque Lookups

**Files:**

- Modify: `lib/product_compare/specs.ex`
- Modify: `lib/product_compare/discussions.ex`
- Modify: `lib/product_compare/comparison_snapshots.ex`
- Modify: `test/product_compare/specs/source_artifact_changeset_test.exs`
- Modify: `test/product_compare/discussions/community_trust_test.exs`
- Modify: `test/product_compare/comparison_snapshots_test.exs`

**Interfaces:**

- Add `Specs.get_source_artifacts/1`, returning each requested valid unique
  integer ID mapped to its artifact with `:source` preloaded or `nil`.
- Add `Discussions.get_public_questions/1`, returning each requested valid
  unique UUID mapped to its published question with `:accepted_post` preloaded
  or `nil`.
- Add `ComparisonSnapshots.get_public_many/1`, returning each requested valid
  unique 43-character public token mapped to its active hydrated snapshot or
  `nil`.
- Make each existing singular lookup delegate through its set-based API so the
  parity and visibility contracts cannot drift.

- [x] Add failing parity tests for empty, duplicate, malformed, missing,
  visible, unpublished or revoked inputs as applicable to each context.
- [x] Run the three focused context suites and confirm the batch APIs are absent.
- [x] Implement one bounded query per context plus the existing association
  preloads, publication/revocation predicates, and snapshot hydration.
- [x] Compare singular and batch results and prove query counts are independent
  of requested key count.
- [x] Commit the context slices with messages scoped to their public lookup
  contracts.

### Task 2: Request-Scoped Public Opaque Lookup Dataloader

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/specs_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/discussions_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/comparison_snapshots_resolver.ex`
- Modify: `test/product_compare_web/graphql/source_artifact_query_test.exs`
- Modify: `test/product_compare_web/graphql/community_content_test.exs`
- Modify: `test/product_compare_web/graphql/comparison_snapshots_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:** Register one public opaque-lookup KV source with separate
`:source_artifact`, `:product_question`, and `:comparison_snapshot` batch keys.
Use the decoded integer ID, decoded UUID, or raw public token as the Dataloader
item, and return the existing entity-or-`nil` resolver shapes through
`on_load/2`.

- [x] Add a failing GraphQL regression that grows from two aliases to four for
  every lookup kind and captures source-artifact/source, question/accepted-post,
  and comparison-snapshot SELECTs.
- [x] Assert IDs, safe metadata, publication and accepted-answer values,
  snapshot hydration, invalid-ID errors, revoked results, and missing results
  before asserting query budgets.
- [x] Confirm RED because direct resolver lookups grow SELECTs with alias count.
- [x] Register the source and route only the three public root resolvers through
  it, preserving the existing decode/error steps.
- [x] Confirm each per-kind SELECT budget is identical at both alias counts.
- [x] Commit with message `perf: bound public opaque graphql reads`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-public-opaque-key-graphql-reads.md`

- [x] Record exact before/after query counts and semantic parity coverage.
- [x] Run `mix test test/product_compare/specs/source_artifact_changeset_test.exs
  test/product_compare/discussions/community_trust_test.exs
  test/product_compare/comparison_snapshots_test.exs
  test/product_compare_web/graphql/source_artifact_query_test.exs
  test/product_compare_web/graphql/community_content_test.exs
  test/product_compare_web/graphql/comparison_snapshots_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [x] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [x] Include lane evidence in the final code/test milestone commit.
