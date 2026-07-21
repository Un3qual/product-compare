# Bounded Alert Evaluation Market Reads

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-alert-evaluation-market-reads-implementation-plan.md`
- Last verified: 2026-07-21 against the alert evaluator, its shared market-fact
  reads, per-watch transaction boundary, and focused seven-test lifecycle suite.

## Batch Outcome

Every watch applicable to one persisted price observation reuses one immutable
product-wide or triggering-listing market-fact snapshot, while per-watch row
locks, state updates, event uniqueness, cooldowns, replay safety, fault
isolation, and later-watch progress remain unchanged.

## Ready Evidence

- `Alerts.evaluate_price_point/2` loads every applicable enabled watch for the
  same product, currency, and triggering merchant product.
- The default evaluator then enters one transaction per watch and calls
  `current_scope_fact/4` inside every transaction.
- Product-scoped watches therefore repeat the same
  `Pricing.current_offer_truth/2` merchant-product and latest-price reads, and
  listing-scoped watches repeat the same merchant-product and latest-price
  reads for the triggering listing.
- These shared market facts can be derived once per evaluation run. Required
  per-watch row locks and writes must remain independent and are not part of
  the fixed shared-read budget.
- `mix test test/product_compare/alerts/alerts_test.exs` passed 7 tests on
  2026-07-21. It covers lifecycle semantics, replay, and fault isolation, but
  does not yet characterize shared-read growth.

## Internal Slices

1. Mixed product/listing watch query-budget characterization.
2. One immutable market-fact snapshot per evaluation run.
3. Semantic, replay, fault-isolation, lock, and shared-read parity evidence.

## Boundaries

- Preserve one transaction and row lock per watch.
- Preserve product-wide and listing-scoped fact selection.
- Preserve event and delivery-attempt uniqueness, cooldowns, edge-trigger
  state, failed-watch reporting, and later-watch progress.
- Preserve existing three- and four-arity custom evaluator hooks.
- Do not change the GraphQL schema or frontend alert contract.

## Verification

- `mix test test/product_compare/alerts/alerts_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
