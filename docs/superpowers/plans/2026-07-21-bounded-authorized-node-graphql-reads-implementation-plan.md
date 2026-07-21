# Bounded Authorized Node GraphQL Reads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep operator-only and owner-scoped Relay `node(id:)` reads fixed as
one authorized GraphQL request grows from one alias to many.

**Architecture:** Affiliate, Accounts, and Catalog expose set-based lookup APIs
for the six remaining non-public node types. One request-scoped KV Dataloader
batches by authorization scope and node type; the resolver authorizes before
loading and includes the current user ID in owner-scoped batch keys so cache
entries cannot cross principals.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve the operator gate for affiliate networks, programs, links, and
  coupons before any database read.
- Preserve owner-only visibility for saved comparison sets and API tokens.
- Preserve anonymous `nil`, cross-owner `nil`, forbidden errors, malformed-ID
  errors, missing-node `nil`, lazy nested Dataloader behavior, and Relay type
  behavior.
- Key owner-scoped batches by current user ID and node type.
- Keep the public GraphQL schema unchanged.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Set-Based Operator Node Lookups

**Files:**

- Modify: `lib/product_compare/affiliate.ex`
- Modify: `test/product_compare/affiliate/affiliate_workflows_test.exs`

**Interfaces:**

- Add an Affiliate set-based lookup accepting one supported operator node type
  plus unique positive integer IDs and returning every requested ID mapped to
  its record or `nil`.
- Keep singular Affiliate getters delegating through the corresponding shared
  lookup policy where practical so values cannot drift.

- [ ] Add failing empty, duplicate, missing, and two-versus-four ID parity and
  query-budget tests for all four affiliate node schemas.
- [ ] Run the focused Affiliate tests and confirm the set-based API is absent.
- [ ] Implement one bounded query per requested node schema.
- [ ] Re-run the focused tests and prove exact singular parity with fixed
  per-schema SELECT counts.
- [ ] Commit with message `perf: batch operator node reads`.

### Task 2: Set-Based Owner-Scoped Node Lookups

**Files:**

- Modify: `lib/product_compare/accounts.ex`
- Modify: `lib/product_compare/catalog.ex`
- Modify: `test/product_compare/accounts/api_token_test.exs`
- Modify: `test/product_compare/catalog/saved_comparison_set_test.exs`

**Interfaces:**

- Add owner-scoped set APIs for API-token entropy IDs and saved-comparison-set
  entropy IDs, keyed by every requested valid UUID.
- Preserve lazy saved-set associations and token owner filtering.

- [ ] Add failing empty, duplicate, missing, cross-owner, and two-versus-four
  parity/query-budget tests for both owner-scoped types.
- [ ] Run the focused Accounts and Catalog tests and confirm the APIs are absent.
- [ ] Implement bounded owner-filtered reads without eager association loads.
- [ ] Re-run the focused tests and prove exact singular, privacy, and lazy-load
  parity with fixed budgets.
- [ ] Commit with message `perf: batch owner scoped node reads`.

### Task 3: Authorization-Aware Node Dataloader

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/node_resolver.ex`
- Modify: `test/product_compare_web/graphql/node_query_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:**

- Register one authorized-node KV source with operator type keys and
  `{owner_type, user_id}` keys.
- Authorize operator aliases before scheduling loads; return anonymous
  owner-scoped aliases without scheduling any query.

- [ ] Add failing GraphQL alias-growth tests for every operator and owner type.
- [ ] Assert exact values, missing behavior, nested saved-set items, forbidden
  errors, anonymous zero-query behavior, and cross-owner privacy before budgets.
- [ ] Prove per-type SELECT budgets remain identical from two aliases to four.
- [ ] Register the source and route non-public node types through `on_load/2`.
- [ ] Re-run node and Dataloader suites.
- [ ] Commit with message `perf: bound authorized graphql node reads`.

### Task 4: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-authorized-node-graphql-reads.md`

- [ ] Record before/after query counts, authorization, privacy, and semantic
  parity coverage.
- [ ] Run `mix test test/product_compare/affiliate/affiliate_workflows_test.exs
  test/product_compare/accounts/api_token_test.exs
  test/product_compare/catalog/saved_comparison_set_test.exs
  test/product_compare_web/graphql/node_query_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.
