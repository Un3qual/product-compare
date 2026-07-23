# Alerts Context Decomposition Design

## Goal

Keep `ProductCompare.Alerts` as the stable application-facing context while
moving watch-rule lifecycle, market-fact projection, durable evaluation, and
alert-inbox implementations into focused internal modules without changing
alert policy or public contracts.

## Current Boundary

The 543-line context currently owns four distinct responsibilities:

1. Owner-scoped watch creation, validation, listing, updates, and deletion.
2. Product- and listing-scoped current market-fact construction used by watch
   baselines and evaluation.
3. Durable price-point evaluation, condition transitions, cooldowns, event
   insertion, delivery-attempt persistence, and retry summaries.
4. Owner-scoped alert-event queries and read-state updates.

Resolvers, the alert-evaluation worker, GraphQL loader sources, pricing, and
tests use `ProductCompare.Alerts` as the public boundary and continue to do so
after the extraction.

## Architecture

- `ProductCompare.Alerts.WatchRules` owns watch creation, scope validation,
  list queries, updates, deletion, attribute normalization, and watch loading.
- `ProductCompare.Alerts.MarketFacts` owns product- and listing-scoped current
  fact construction, eligible baselines, and empty/ineligible fact shapes.
- `ProductCompare.Alerts.Evaluation` owns price-point evaluation, independent
  watch transactions, condition and cooldown policy, immutable alert events,
  delivery attempts, fact snapshots, and partial-failure summaries.
- `ProductCompare.Alerts.Inbox` owns alert-event queries, unread filtering,
  read-state updates, and event loading.
- `ProductCompare.Alerts` retains every public function, guard, default
  argument, typespec, result, error, and explicit wrapper.

Internal modules may collaborate directly through the stated functions, but
application callers must continue to depend only on the facade.

## Preserved Behavior

- Owner scoping, positive-bigint guards, entropy-ID handling, invalid argument
  and not-found results, watch defaults, and update reset fields.
- Product/listing scope validation, currency normalization, complete and fresh
  landed-price eligibility, current-offer selection, baseline capture, and
  initial condition state.
- Applicable-watch ordering, shared market-fact query bounds, per-watch row
  locks and transactions, replay suppression, cooldown transitions, partial
  failure isolation, retry behavior, and evaluation summaries.
- Immutable event facts, unique watch/price-point conflicts, in-app delivery
  attempts, unread filtering, deterministic ordering, preloads, and read
  idempotency.
- Existing schemas, migrations, Oban worker behavior, GraphQL SDL, resolver
  authorization, frontend contracts, pricing policy, and delivery scope.

## Errors And Transactions

The extraction preserves one transaction per watch evaluation, the existing
row lock, rollback reasons, event uniqueness conflict, and delivery-attempt
insert behavior. It introduces no new rescue, callback, adapter, or outer
transaction boundary. The existing test-only evaluator option remains
available through the facade with the same arity handling.

## Verification

The characterization gate is:

```bash
mix test \
  test/product_compare/alerts/alerts_test.exs \
  test/product_compare_web/graphql/price_watches_and_alerts_test.exs
```

It currently passes 13 tests. Completion also requires `mix typecheck`,
`mix format --check-formatted`, `mix work_queue.validate`, `mix ci`,
`git diff --check`, and a caller scan proving the four internal owners are not
used outside the facade, internal modules, and their own focused tests.

## Non-Goals

- No new watch type, alert transport, delivery worker, notification surface,
  schema, migration, GraphQL field, pricing rule, or frontend behavior.
- No change to the alert-evaluation worker or price-point enqueue semantics.
- No generic repository, callback, adapter, or catch-all implementation layer.
- No separate queue row per internal module; the four slices share one stable
  Alerts contract and one reviewer decision.
