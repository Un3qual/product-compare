# Bounded Merchant Offer GraphQL Connections

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-20-bounded-merchant-offer-graphql-connections-implementation-plan.md`
- Last verified: 2026-07-20 against the merchant connection resolver, active
  merchant-offer query, merchant-detail GraphQL suite, and Dataloader coverage.

## Batch Outcome

`Merchant.merchantProducts` keeps a fixed SELECT budget as a GraphQL merchant
connection grows, without changing active-offer, Relay, association, or latest-
price behavior.

## Ready Evidence

- `PricingResolver.merchant_offers/3` executes one merchant-scoped connection
  query for each merchant parent.
- `Pricing.list_merchant_offers_query/2` is intentionally single-merchant and
  preserves active-only filtering plus ascending offer-ID order.
- Existing coverage exercises one `merchant(slug:)` parent and does not prove a
  growing merchant-parent query budget.

## Internal Slices

1. Parent-partitioned active merchant-offer pages.
2. Request-scoped merchant-offer Dataloader integration.
3. Relay parity and fixed query-budget coverage.

## Boundaries

- Preserve active-only filtering, order, cursors, and page info.
- Preserve nested merchant, product, and latest-price behavior.
- Do not change the public GraphQL schema.

## Verification

- Pricing context parity tests.
- Merchant-detail and growing-parent Dataloader tests.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
