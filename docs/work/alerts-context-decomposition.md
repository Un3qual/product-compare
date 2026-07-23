# Alerts Context Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-alerts-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the direct characterization suites, full
  repository CI, type, format, queue, caller-boundary, and diff gates.

## Batch Outcome

`ProductCompare.Alerts` remains the stable application-facing context while
watch-rule lifecycle, market-fact projection, durable evaluation, and alert-
inbox implementations now live in focused internal modules with unchanged
public APIs, policy, transactions, locks, events, errors, jobs, and GraphQL
behavior.

## Completion Evidence

- `ProductCompare.Alerts` remains the only application-facing boundary and is
  now a 73-line facade preserving the existing public functions, defaults,
  guards, typespecs, values, and errors.
- `ProductCompare.Alerts.WatchRules` (164 lines) owns watch creation,
  validation, normalization, owner-scoped queries, updates, deletion, and
  loading.
- `ProductCompare.Alerts.MarketFacts` (80 lines) owns product- and
  listing-scoped current market facts plus eligible baselines.
- `ProductCompare.Alerts.Evaluation` (282 lines) owns applicable-watch
  selection, fact reuse, row-locked evaluation, transitions, cooldowns,
  events, delivery attempts, replay suppression, retries, and partial-failure
  summaries.
- `ProductCompare.Alerts.Inbox` (54 lines) owns owner-scoped event queries,
  unread filtering, deterministic ordering, preloads, and read-state updates.
- The application caller scan found zero direct references to `WatchRules`,
  `MarketFacts`, `Evaluation`, or `Inbox` outside the facade and internal Alerts
  implementation paths.
- The exact direct and GraphQL characterization command passed 13 tests with
  zero failures.
- The full contract and repository gate passed without changing schemas,
  migrations, GraphQL SDL, resolver authorization, Oban worker behavior,
  pricing policy, frontend contracts, or transports.
- One final-state CI attempt hit the pre-existing 250 ms async timeout in
  `CJFeedDiscoverySchedulerTest`; the exact test and full 12-test scheduler
  module passed immediately, and the repeated full CI gate passed without
  changing scheduler code or tests.

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
  passed 13 tests with zero failures.
- `mix typecheck` passed.
- `mix format --check-formatted` passed.
- `mix work_queue.validate` passed with three ready rows.
- `mix ci` passed: 905 backend tests and 1,507 frontend unit tests had zero
  failures; Relay validation, TypeScript typechecking, client and SSR builds,
  and the client bundle contract also passed.
- `rg -n "\b(WatchRules|MarketFacts|Evaluation|Inbox)\b" lib --glob '!lib/product_compare/alerts.ex' --glob '!lib/product_compare/alerts/**'`
  returned zero application-caller matches.
- `git diff --check` passed.

## Remaining Work

None in this lane. Catalog, Comparison Snapshots, and Taxonomy Context
Decomposition remain ready in the live queue.
