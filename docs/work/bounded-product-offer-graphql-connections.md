# Bounded Product Offer GraphQL Connections

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-20-bounded-product-offer-graphql-connections-implementation-plan.md`
- Last verified: 2026-07-20 against Pricing and Affiliate context queries,
  Product and MerchantProduct GraphQL fields, product-detail/compare Relay
  queries, and current Dataloader coverage.

## Batch Outcome

Product offer, active-coupon, and price-history Relay connections use bounded
set-based reads whose query count does not grow with product or merchant-product
parent count.

## Ready Evidence

- `PricingResolver.product_merchant_products/3` executes one connection query
  per Product parent.
- `AffiliateResolver.merchant_product_active_coupons/3` executes one current
  coupon connection query per MerchantProduct parent.
- `PricingResolver.price_history/3` executes one time-bounded history connection
  query per MerchantProduct parent.
- Product-detail and compare-shaped queries request active coupons and compact
  price history beneath every loaded offer, while current batching covers only
  associations and latest prices.

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

- Pricing and Affiliate context parity tests.
- Pricing GraphQL behavior and growing-parent query-budget tests.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

