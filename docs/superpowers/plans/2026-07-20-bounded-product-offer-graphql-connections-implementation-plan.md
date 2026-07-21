# Bounded Product Offer GraphQL Connections Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep product merchant-offer, active-coupon, and price-history
connection queries fixed as GraphQL product and MerchantProduct parent counts
grow.

**Architecture:** Pricing and Affiliate execute bounded parent-partitioned page
queries using the validated batch window from `Connection`. A request-scoped KV
Dataloader keys batches by field and normalized arguments, then projects the
pre-fetched rows through the existing Relay cursor/page-info contract. Coupon
batches collapse MerchantProduct parents to unique merchant IDs and use one
stable timestamp.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL window functions,
ExUnit.

## Global Constraints

- Preserve product/merchant filters, `activeOnly`, and merchant-product order.
- Preserve coupon validity, deterministic order, and one stable batch `now`.
- Preserve price-history range filters, descending order, and evidence fields.
- Preserve Relay cursors, invalid-input errors, page info, and latest-price
  Dataloader behavior.
- Keep the public GraphQL schema unchanged.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Verify The Shared Batched Connection Contract

**Files:**

- Verify or modify: `lib/product_compare_web/graphql/connection.ex`
- Modify: `test/product_compare_web/graphql/pricing_queries_test.exs`

**Interfaces:** Use `Connection.batch_window/1` and
`Connection.from_prefetched_page/2` from the bounded-community batch. If this
row is claimed first, implement those two interfaces exactly as specified in
`docs/superpowers/plans/2026-07-20-bounded-community-graphql-connections-implementation-plan.md`
and preserve `from_list/2` plus `from_query/3` behavior.

- [x] Verify equivalence coverage exists for default, zero, clamped, after,
  final-page, invalid-first, and malformed-cursor behavior.
- [x] If absent, add the failing tests and implement the shared APIs before
  touching Pricing or Affiliate.
- [x] Run existing GraphQL connection hardening tests.
- [x] Commit only if shared Connection production behavior changed, using
  `refactor: expose batched relay connection window`.

### Task 2: Parent-Partitioned Product Offer Pages

**Files:**

- Modify: `lib/product_compare/pricing.ex`
- Modify: `test/product_compare/pricing/pricing_test.exs`

**Interfaces:** Add
`Pricing.product_offer_pages(product_ids, filters, window) ::
%{optional(pos_integer()) => [MerchantProduct.t()]}`. Use one query with
`row_number()` partitioned by `product_id`, retain the existing optional
merchant and active-only filters, retain ascending merchant-product ID order,
and select rows between `offset + 1` and `offset + fetch_limit`.

- [x] Add failing parity tests against `list_merchant_products_query/1` for
  multiple products, empty parents, merchant filters, active-only values,
  offsets, and exact ID order.
- [x] Run the focused Pricing suite and confirm the batch API is absent.
- [x] Implement one bounded query for the entire product parent set and return
  an empty row list for every requested product without offers.
- [x] Re-run Pricing tests.
- [x] Commit with message `perf: batch product offer connection pages`.

### Task 3: Merchant-Keyed Coupon Pages

**Files:**

- Modify: `lib/product_compare/affiliate.ex`
- Modify: `test/product_compare/affiliate/affiliate_workflows_test.exs`

**Interfaces:** Add
`Affiliate.active_coupon_pages(merchant_ids, DateTime.t(), window) ::
%{optional(pos_integer()) => [Coupon.t()]}`. Use one query with `row_number()`
partitioned by `merchant_id`, the exact current active-window predicate and
order, and the requested bounded row range. Fill missing merchant IDs with
empty lists.

- [x] Add failing parity tests for current, future, expired, open-ended,
  multiple-network, empty-merchant, and after-offset cases.
- [x] Run the focused Affiliate suite and confirm the batch API is absent.
- [x] Implement one query for unique merchant IDs and one caller-supplied batch
  timestamp.
- [x] Re-run Affiliate tests.
- [x] Commit with message `perf: batch active coupon connection pages`.

### Task 4: Parent-Partitioned Price-History Pages

**Files:**

- Modify: `lib/product_compare/pricing.ex`
- Modify: `test/product_compare/pricing/pricing_test.exs`

**Interfaces:** Add
`Pricing.price_history_pages(merchant_product_ids, filters, window) ::
%{optional(pos_integer()) => [PricePoint.t()]}`. Apply existing `from`/`to`
filters before `row_number()`, partition by `merchant_product_id`, preserve
descending observation/ID order, and retain source-artifact loading behavior
used by the GraphQL price-point fields.

- [x] Add failing parity tests for multiple offers, empty offers, range bounds,
  equal timestamps, offsets, and artifact-backed observations.
- [x] Run the focused Pricing suite and confirm the batch API is absent.
- [x] Implement one bounded query for all MerchantProduct parents.
- [x] Re-run Pricing tests.
- [x] Commit with message `perf: batch price history connection pages`.

### Task 5: Offer Connection Dataloader And Budgets

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `test/product_compare_web/graphql/pricing_queries_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:** Register a KV source such as
`{ProductCompareWeb.GraphQL.Loader, :offer_connections}`. Batch keys are
`{:product_offers, connection_args, filters}`,
`{:active_coupons, connection_args}`, and
`{:price_history, connection_args, range_filters}`. Validate with
`Connection.batch_window/1`; callbacks delegate parent sets to the context page
APIs and project each result with `Connection.from_prefetched_page/2`.

- [x] Add a failing compare-shaped GraphQL request with at least three products,
  multiple offers per product, active coupons, and compact price history.
- [x] Assert exact filters, edge order, coupon validity, history range behavior,
  cursors, `hasNextPage`, and latest-price values.
- [x] Grow product and offer parent counts with unchanged field arguments and
  record the current merchant-product/coupon/price-point SELECT growth.
- [x] Route the three resolvers through the request-scoped source. Collapse
  coupon work to unique merchant IDs while returning a connection for each
  MerchantProduct parent.
- [x] Assert relevant SELECT counts remain fixed after parent growth.
- [x] Re-run pricing GraphQL, Dataloader, and product-detail contract suites.
- [x] Commit with message `perf: bound product offer graphql connections`.

### Task 6: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-product-offer-graphql-connections.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `docs/superpowers/plans/2026-07-20-bounded-product-offer-graphql-connections-implementation-plan.md`

- [x] Record before/after query counts and semantic regression coverage.
- [x] Mark this plan complete and reconcile every completed task checkbox.
- [x] Remove the completed active row from `docs/work/index.md`, preserve its
  completion evidence in the lane doc, and leave the three successor rows
  ready.
- [x] Remove this completed plan from the active plan catalog without changing
  the remaining ready plans.
- [x] Run all focused tests named in `docs/work/index.md`.
- [x] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [x] Commit the completion evidence and coordinator closeout as one docs
  workflow milestone.
