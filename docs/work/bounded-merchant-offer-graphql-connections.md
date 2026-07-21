# Bounded Merchant Offer GraphQL Connections

## Snapshot

- Status: complete
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-20-bounded-merchant-offer-graphql-connections-implementation-plan.md`
- Completed: 2026-07-21 on `codex/bounded-merchant-offer-connections`.
- Last verified: 2026-07-21 against the Pricing context, merchant connection
  resolver, merchant-detail GraphQL suite, growing-parent Dataloader coverage,
  and the full repository gate.

## Batch Outcome

`Merchant.merchantProducts` keeps a fixed SELECT budget as a GraphQL merchant
connection grows, without changing active-offer, Relay, association, or latest-
price behavior.

## Completion Evidence

- Before batching, growing from three to six merchant parents increased the
  `merchant_products` SELECT count from three to six. `price_points` already
  held at one SELECT at both sizes.
- After batching, both parent counts hold at
  `{merchant_products: 1, price_points: 1}`.
- `Pricing.merchant_offer_pages/2` performs one active-only, ascending-ID,
  parent-partitioned read and preserves empty, missing-parent, offset, and
  window behavior. Its parity coverage compares each page with the existing
  single-merchant query contract.
- The request-scoped loader projects each partition through the shared Relay
  connection contract. The growing-parent regression verifies exact merchant,
  product, latest-price, cursor, and `pageInfo` values at both parent counts.
- Invalid page-size behavior remains unchanged: the non-null
  `merchantProducts` field bubbles the merchant result to `nil` with the
  existing GraphQL error.
- The final projection shared by merchant- and product-partitioned offer pages
  was extracted after ExDNA identified the duplicated implementation. The
  structural fix restored the existing 6/6 clone budget without suppressing
  the finding or weakening the gate.

## Internal Slices

1. Parent-partitioned active merchant-offer pages.
2. Request-scoped merchant-offer Dataloader integration.
3. Relay parity and fixed query-budget coverage.

## Boundaries

- Preserve active-only filtering, order, cursors, and page info.
- Preserve nested merchant, product, and latest-price behavior.
- Do not change the public GraphQL schema.

## Verification

- `mix test test/product_compare/pricing/pricing_test.exs test/product_compare_web/graphql/merchant_detail_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs` — 26 tests, 0 failures.
- `mix typecheck` — passed.
- `mix format --check-formatted` — passed.
- `mix work_queue.validate` — passed with three ready rows after closeout.
- `git diff --check` — passed.
- `mix ci` — passed with queue validation, Credo clean, clone budget 6/6, no
  new cross-function smells, Dialyzer clean, backend tests and coverage, Relay
  validation, TypeScript, 1,507 frontend tests, client and SSR builds, and the
  client bundle budget.
