# Alerts Resolver Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-alerts-resolver-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against direct Alerts and GraphQL alert
  characterization paths.

## Target Outcome

`AlertsResolver` remains schema-facing while owner-scoped reads, watch
lifecycle actions, and event actions live in focused owners with unchanged
callbacks and payloads.

## Completion Evidence

- The former 202-line resolver is now a 31-line schema-facing facade.
- `Resolvers.Alerts.Reads` owns the two owner-scoped connections in 58 lines.
- `Resolvers.Alerts.WatchMutations` owns price-watch create, update, and delete
  behavior in 129 lines.
- `Resolvers.Alerts.EventMutations` owns the alert-event action in 39 lines.
- Schema callers still reference only `AlertsResolver`; no schema caller
  bypasses the facade.
- The focused Alerts domain and GraphQL gate passed 13 tests.
- Full `mix ci` passed 913 backend tests at 83.65% coverage, 1,507 frontend
  tests, and all queue, quality, duplication, type, Relay, build, and bundle
  gates.

## Internal Slices

1. Watch and event connections.
2. Price-watch create, update, and delete actions.
3. Alert-event read and dismiss actions.
4. Stable resolver wrappers and schema-call parity.

## Boundaries

- Preserve every callback, clause, owner check, ID rule, connection argument,
  value, payload, and error.
- Do not change Alerts context behavior, schemas, migrations, GraphQL SDL,
  Relay, or frontend behavior.

## Verification

- `mix test test/product_compare/alerts test/product_compare_web/graphql/price_watches_and_alerts_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
