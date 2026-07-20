# Bounded Merchant GraphQL Reads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make merchant detail summaries use a fixed database-query budget for
one or many merchant parents.

**Architecture:** Pricing exposes a set-based batch read that loads active
offers for all requested merchant IDs, loads latest prices once, applies the
existing OfferTruth summarizer, and returns the unchanged detail shape keyed by
merchant. The GraphQL KV Dataloader delegates to that batch.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve the existing merchant detail summary shape and freshness/eligibility
  semantics.
- Include every active offer, independent of GraphQL connection page size.
- Empty merchants return zeroed summaries.
- Query counts must remain constant as merchant parent count increases.
- Use behavior tests and verify RED before production changes.

---

### Task 1: Set-Based Pricing Read Model

**Files:**

- Modify: `lib/product_compare/pricing.ex`
- Modify: `test/product_compare/pricing/pricing_test.exs`

**Interfaces:** Add
`Pricing.merchant_details([Merchant.t()], keyword()) :: %{Merchant.t() => map()}`.
`Pricing.merchant_detail/2` delegates through the batch for one merchant so
single-merchant and batch semantics cannot drift.

- [ ] Add failing pricing tests comparing one-merchant and multi-merchant
  results across fresh, stale, unobserved, inactive, and empty merchants.
- [ ] Run the focused pricing test and confirm the batch API is absent.
- [ ] Implement one active-offer query for all merchant IDs and one existing
  latest-price query for all offer IDs; group and summarize in memory with the
  same `now` value for the whole batch.
- [ ] Re-run focused pricing tests and existing merchant-detail tests.
- [ ] Commit with message `perf: batch merchant detail summaries`.

### Task 2: Dataloader Query Budget

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`
- Modify: `test/product_compare_web/graphql/merchant_detail_test.exs`

**Interfaces:** `merchant_detail_batch(:summary, merchants)` returns
`Pricing.merchant_details(merchants, now: DateTime.utc_now())`. The GraphQL
field contract remains `Merchant.detailSummary: MerchantDetailSummary!`.

- [ ] Add a failing GraphQL request for multiple merchants with
  `detailSummary`; assert exact values and a fixed merchant-products and
  price-points SELECT budget.
- [ ] Prove the same budget holds after increasing the merchant count in the
  fixture.
- [ ] Run the Dataloader test and confirm query counts currently grow per
  merchant.
- [ ] Delegate the KV batch to the new Pricing API and preserve missing/empty
  result behavior.
- [ ] Re-run Dataloader, merchant detail, and pricing GraphQL suites.
- [ ] Commit with message `perf: bound merchant summary graphql reads`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-merchant-graphql-reads.md`

- [ ] Record before/after query counts and semantic regression coverage.
- [ ] Run focused pricing and GraphQL tests, `mix typecheck`,
  `mix format --check-formatted`, `mix work_queue.validate`, and
  `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.
