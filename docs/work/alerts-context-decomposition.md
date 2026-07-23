# Alerts Context Decomposition

## Snapshot

- Status: active
- Claimed by: current detached worktree
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-alerts-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the direct Alerts and price-watch/alert
  GraphQL characterization suites.

## Target Outcome

`ProductCompare.Alerts` remains the stable application-facing context while
watch-rule lifecycle, market-fact projection, durable evaluation, and alert-
inbox implementations move into focused internal modules with unchanged public
APIs, policy, transactions, locks, events, errors, jobs, and GraphQL behavior.

## Ready Evidence

- `lib/product_compare/alerts.ex` is 543 lines and owns four focused
  implementation responsibilities behind one public boundary.
- Resolvers, the evaluation worker, GraphQL loader sources, pricing, and tests
  depend on the facade, so implementation ownership can move without changing
  application call sites.
- The selected direct and GraphQL characterization gate passed 13 tests on
  2026-07-22.
- Existing price-point enqueueing, watch policy, event delivery scope, and
  resolver authorization remain unchanged.
- The row is path-disjoint from Accounts, Pricing, and SEO decomposition.

## Internal Slices

1. Watch lifecycle, validation, normalization, and query ownership.
2. Product- and listing-scoped current market-fact ownership.
3. Durable evaluation, transitions, events, delivery attempts, and retries.
4. Owner-scoped alert inbox query and read-state ownership.

## Boundaries

- Preserve every public function, default, guard, typespec, value, and error.
- Preserve owner scope, queries, ordering, preloads, fact eligibility,
  transactions, locks, cooldowns, replay suppression, partial failures, retry
  behavior, delivery attempts, and query bounds.
- Keep callers dependent only on `ProductCompare.Alerts`.
- Do not change schemas, migrations, GraphQL SDL, resolver authorization,
  Oban worker behavior, pricing policy, frontend contracts, or transports.

## Verification

- `mix test test/product_compare/alerts/alerts_test.exs test/product_compare_web/graphql/price_watches_and_alerts_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
