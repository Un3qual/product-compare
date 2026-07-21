# Bounded Alert Evaluation Market Reads

## Snapshot

- Status: complete on `codex/bounded-public-opaque-graphql-reads`
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-alert-evaluation-market-reads-implementation-plan.md`
- Last verified: 2026-07-21 with the focused eight-test alert suite, typecheck,
  format check, queue validation, and diff hygiene green.

## Batch Outcome

Every watch applicable to one persisted price observation reuses one immutable
product-wide or triggering-listing market-fact snapshot, while per-watch row
locks, state updates, event uniqueness, cooldowns, replay safety, fault
isolation, and later-watch progress remain unchanged.

## Completion Evidence

- Before the change, growing a mixed product/listing run from two to six watches
  grew shared merchant-product SELECTs from 2 to 6 and shared latest-price
  SELECTs from 2 to 6.
- The default evaluator now derives only the product and listing scopes present
  in the applicable watch set, once, before entering the transaction loop.
- The locked watch row selects its unchanged scope from that immutable snapshot;
  each watch still owns one transaction, one `FOR UPDATE` read, its event and
  delivery inserts, and its state update.
- After the change, shared merchant-product SELECTs remain 2 for both two and
  six watches, and shared latest-price SELECTs remain 2 for both sizes. The
  triggering price-point read, triggering merchant-product read, and applicable-
  watch read remain 1 each, while required watch locks grow from 2 to 6.
- Both evaluation sizes preserve exact target-price event facts: USD 40 item
  price, USD 5 shipping, USD 45 landed price, triggering listing, and observed
  time. Their summaries remain 2/2 and 6/6 evaluated/events-created.
- The focused suite passes 8 tests covering edge and cooldown behavior, stale,
  incomplete and out-of-stock facts, percentage and availability rules, owner
  scope, durable replay, three-arity fault isolation, four-arity retry behavior,
  later-watch progress, and the mixed-scope query budget.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check` pass.

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
