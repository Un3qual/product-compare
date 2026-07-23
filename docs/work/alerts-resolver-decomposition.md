# Alerts Resolver Decomposition

## Snapshot

- Status: ready
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

## Ready Evidence

- The 202-line resolver combines three concrete responsibilities.
- Existing Alerts suites characterize owner scope, Global IDs, filters,
  pagination, lifecycle values, payloads, and errors.

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
