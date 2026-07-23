# Commerce Attribution Internals Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-commerce-attribution-internals-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against direct Commerce Attribution, controller,
  and GraphQL characterization paths.

## Target Outcome

`Clicks`, `Conversions`, `Revenue`, and `CommerceAttributionResolver` remain
stable facades while link, destination, session, redirect, attribution,
persistence, purchase-fact, revenue, and resolver workflows live in focused
owners.

## Ready Evidence

- The four facades are 304, 331, 416, and 241 lines and combine multiple
  concrete commerce responsibilities.
- Existing suites characterize safe destinations, redirects, attribution,
  replay, aggregation, suppression, authorization, and payloads.

## Internal Slices

1. Commerce links, destinations, click sessions, and redirects.
2. Conversion attribution, persistence, and purchase facts.
3. Revenue filters, aggregation, and projection.
4. GraphQL reads and mutations.
5. Stable facades and caller-path parity.

## Boundaries

- Complete Destination URL decomposition first.
- Preserve every function, result, error, conflict, transaction, redirect,
  dimension, query, suppression rule, and GraphQL payload.
- Do not change schemas, migrations, providers, GraphQL SDL, controllers,
  Relay, frontend behavior, or product policy.

## Verification

- `mix test test/product_compare/commerce_attribution test/product_compare_web/controllers/commerce_click_controller_test.exs test/product_compare_web/graphql/commerce_attribution_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
