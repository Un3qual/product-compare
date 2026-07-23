# Commerce Attribution Context Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-commerce-attribution-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the live context, direct attribution
  suites, redirect controller, commerce-click GraphQL, and revenue GraphQL.

## Target Outcome

`ProductCompare.CommerceAttribution` will remain the stable application-facing
context while click/redirect, conversion, purchase-fact, and revenue-summary
implementations move into focused internal modules with unchanged public APIs,
transactions, destination safety, attribution conflict handling, query
semantics, suppression, errors, and GraphQL behavior.

## Ready Evidence

- `lib/product_compare/commerce_attribution.ex` is 1,041 lines and owns three
  independently describable responsibilities: tracked link/click redirects,
  conversion and purchase-fact persistence, and filtered revenue summaries.
- The ten public functions already form a stable facade used by controllers,
  resolvers, adapters, and tests, so internal ownership can move without caller
  changes.
- The exact five-suite characterization gate passed 81 tests on 2026-07-22. It
  covers direct persistence and attribution behavior, destination URL policy,
  redirect-controller behavior, commerce-click GraphQL, and revenue GraphQL.
- This row is path-disjoint from GraphQL schema, Discussions, and Specs
  decomposition. Its callers continue to depend only on the unchanged facade.

## Internal Slices

1. Commerce-link, click-session, tracked-click, and redirect ownership.
2. Conversion attribution, replay/conflict, and purchase-fact ownership.
3. Revenue query, normalization, aggregation, and suppression ownership.
4. Public-contract, controller, GraphQL, type, and full-suite parity.

## Boundaries

- Preserve every public `ProductCompare.CommerceAttribution` function, arity,
  default, typespec, result, and error.
- Preserve transactions, conflict targets, replay and stale-update behavior,
  destination validation/canonicalization, public click-ID handling,
  attribution conflict checks, and persisted dimensions.
- Preserve revenue filters, joins, calendar boundaries, mixed-currency errors,
  JSON-ready values, low-volume suppression, and query behavior.
- Keep controllers, resolvers, adapters, and other contexts dependent only on
  the facade. Keep the existing destination-policy module and schema
  compatibility API intact.
- Do not change schemas, migrations, GraphQL SDL, frontend behavior, provider
  policy, or deferred ingestion/operator work.

## Verification

- `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare/commerce_attribution/destination_url_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs test/product_compare_web/graphql/commerce_click_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
