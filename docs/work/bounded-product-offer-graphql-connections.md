# Bounded Product Offer GraphQL Connections

## Snapshot

- Status: complete
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-20-bounded-product-offer-graphql-connections-implementation-plan.md`
- Completed: 2026-07-20 on `codex/bounded-product-offer-connections`.
- Last verified: 2026-07-20 against Pricing and Affiliate context queries,
  Product and MerchantProduct GraphQL fields, product-detail/compare Relay
  queries, fixed query budgets, and the focused batch suites.
- Active branch: `codex/bounded-product-offer-connections`

## Batch Outcome

Product offer, active-coupon, and price-history Relay connections use bounded
set-based reads whose query count does not grow with product or merchant-product
parent count. The completed batch keeps the query budget at one merchant-product
SELECT, one coupon SELECT, and two price-point SELECTs at both three and six
product parents.

## Completion Evidence

- Before batching, growing from three to six products increased SELECT counts
  from `{merchant_products: 3, coupons: 6, price_points: 7}` to
  `{merchant_products: 6, coupons: 12, price_points: 13}`.
- After batching, both parent counts hold at
  `{merchant_products: 1, coupons: 1, price_points: 2}`.
- The Task 5 compare-shaped regression covers product ordering, active-only
  merchant-product ordering, active-coupon validity, price-history range
  bounds and descending order, Relay cursors and `pageInfo`, latest-price
  values, and fixed nested SELECT budgets as parent count grows. Pricing
  context parity tests separately cover product, merchant, and active-only
  offer filtering.
- Product-detail and compare-shaped queries request active coupons and compact
  price history beneath every loaded offer, while the request-scoped source
  preserves association and latest-price batching.

## Internal Slices

1. Parent-partitioned product merchant-product pages.
2. Merchant-keyed current active-coupon pages.
3. Parent-partitioned price-history pages and nested query-budget coverage.

## Boundaries

- Preserve active-only and merchant filtering for product offers.
- Preserve coupon validity at one stable batch timestamp.
- Preserve price-history range filters, descending order, Relay cursor/page-
  size behavior, and latest-price batching.
- Do not change the public GraphQL schema.

## Verification

- `mix test test/product_compare/pricing/pricing_test.exs test/product_compare/affiliate/affiliate_workflows_test.exs` — 24 tests, 0 failures.
- `mix test test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs` — 15 tests, 0 failures.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
