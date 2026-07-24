# Commerce Attribution Internals Decomposition

## Snapshot

- Status: complete
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

- Focused gate:
  `mix test test/product_compare/commerce_attribution
  test/product_compare_web/controllers/commerce_redirect_controller_test.exs
  test/product_compare_web/graphql/commerce_click_test.exs
  test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
  passed 81 tests with 0 failures.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check` passed.
- `mix ci` passed 913 backend tests at 83.50% coverage, 1,507 frontend
  tests, and every queue, quality, duplication, type, Relay, build, and
  bundle gate.

## Completion Evidence

- Stable facades are now 29 lines (`Clicks`), 16 lines (`Conversions`),
  34 lines (`Revenue`), and 18 lines (`CommerceAttributionResolver`).
- Click owners are 52 lines (`Links`), 129 lines (`Destinations`), 84 lines
  (`Sessions`), and 48 lines (`Redirects`).
- Conversion owners are 232 lines (`Attribution`), 100 lines
  (`Persistence`), and 13 lines (`PurchaseFacts`).
- Revenue owners are 142 lines (`Filters`), 215 lines (`Aggregation`), and
  55 lines (`Projection`).
- GraphQL owners are 176 lines (`Reads`) and 71 lines (`Mutations`).
- Production and test caller scans found no bypass of
  `ProductCompare.CommerceAttribution`; schema-facing code remains on
  `CommerceAttributionResolver`.
- The extraction preserves all public names and arities, destinations,
  redirects, transactions, attribution conflict behavior, revenue filters
  and suppression, authorization, and GraphQL result shapes.
