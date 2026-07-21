# Bounded Merchant Offer GraphQL Connections Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `Merchant.merchantProducts` database reads fixed as one GraphQL
request grows from one merchant parent to many.

**Architecture:** Pricing exposes a parent-partitioned active-offer page API
keyed by merchant ID. A request-scoped KV Dataloader groups equal Relay
arguments across merchant parents and returns the existing connection shape;
the existing association and latest-price loaders continue resolving nested
fields.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve active-only merchant-offer filtering and ascending offer-ID order.
- Preserve Relay cursor validation, page-size limits, edges, and `pageInfo`.
- Preserve existing `merchant`, `product`, and `latestPrice` field behavior.
- Keep the public GraphQL schema unchanged.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Parent-Partitioned Merchant Offer Pages

**Files:**

- Modify: `lib/product_compare/pricing.ex`
- Modify: `lib/product_compare_web/graphql/connection.ex`
- Modify: `test/product_compare/pricing/pricing_test.exs`

**Interfaces:**

- Add a set-based Pricing API that accepts valid merchant IDs plus normalized
  forward Relay arguments and returns one connection page per requested ID.
- Reuse the shared parent-partitioned connection window when it exists; if this
  is the first connection batch to land, extract the reusable cursor/window and
  `pageInfo` projection in `Connection` rather than copying SQL policy.
- Fill valid merchants with empty pages when they have no active offers.

- [ ] Add failing parity tests for empty input, missing IDs, active/inactive
  offers, first-page truncation, advancing cursors, and independent parent
  partitions.
- [ ] Run the focused Pricing tests and confirm the batch API is absent.
- [ ] Implement one bounded query per page-argument group with stable
  parent-local ordering and one-row lookahead.
- [ ] Compare the batch result with the existing single-parent GraphQL
  connection behavior.
- [ ] Commit with message `perf: batch merchant offer connection reads`.

### Task 2: Request-Scoped Merchant Offer Dataloader

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Modify: `test/product_compare_web/graphql/merchant_detail_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:**

- Register a KV source batch key containing normalized forward connection
  arguments and use each merchant parent as the Dataloader item.
- Change `PricingResolver.merchant_offers/3` to load through that source and
  return the same connection payload through `on_load/2`.

- [ ] Add a failing GraphQL query that requests merchant products for three
  merchants, grows to six, and captures merchant-product SELECTs.
- [ ] Assert exact edges, active-only visibility, cursors, `pageInfo`, product
  association, and latest price values before asserting the query budget.
- [ ] Prove the merchant-product SELECT budget is identical for three and six
  parents and nested latest-price reads remain bounded.
- [ ] Register the source and delegate the resolver.
- [ ] Re-run merchant-detail and Dataloader suites.
- [ ] Commit with message `perf: bound merchant offer graphql reads`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-merchant-offer-graphql-connections.md`

- [ ] Record before/after query counts and semantic parity coverage.
- [ ] Run `mix test test/product_compare/pricing/pricing_test.exs
  test/product_compare_web/graphql/merchant_detail_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.
