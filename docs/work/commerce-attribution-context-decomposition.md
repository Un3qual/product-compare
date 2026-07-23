# Commerce Attribution Context Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-commerce-attribution-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 at implementation head `81fc6aa1` against the live
  facade, the exact five-suite characterization gate, and full repository CI.

## Batch Outcome

`ProductCompare.CommerceAttribution` remains the stable application-facing
context while click/redirect, conversion, purchase-fact, and revenue-summary
implementations live in focused internal modules with unchanged public APIs,
transactions, destination safety, attribution conflict handling, query
semantics, suppression, errors, and GraphQL behavior.

## Final Structure Evidence

- `ProductCompare.CommerceAttribution` is a 55-line stable public facade. It
  retains all ten source-defined public functions, their default arities,
  typespecs, result shapes, and error boundaries.
- `ProductCompare.CommerceAttribution.Clicks` (314 lines) owns commerce-link
  upserts, click sessions, tracked outbound clicks, trusted destination
  selection, public redirect lookup, and Impact click-ID projection.
- `ProductCompare.CommerceAttribution.Conversions` (341 lines) owns conversion
  ingestion, persisted attribution restoration, replay and stale-upsert
  behavior, click-dimension conflicts, and purchase-price facts.
- `ProductCompare.CommerceAttribution.Revenue` (416 lines) owns revenue filter
  normalization, aggregation queries and joins, calendar bounds, mixed-currency
  enforcement, money projection, and low-volume suppression.
- The facade and three focused modules total 1,126 lines. An application-caller
  scan found no references to `Clicks`, `Conversions`, or `Revenue` outside the
  facade and their own definitions, so controllers, resolvers, adapters, and
  tests continue to use only `ProductCompare.CommerceAttribution`.
- The exact direct attribution, destination-policy, redirect-controller,
  commerce-click GraphQL, and revenue GraphQL gate passed 81 tests with 0
  failures on 2026-07-22.

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
  — 81 tests, 0 failures.
- `mix typecheck` — passed.
- `mix format --check-formatted` — passed.
- `mix work_queue.validate` — passed with the required local Mix PubSub socket;
  3 ready rows.
- `mix ci` — passed (Credo: 3,590 mods/funs with no issues; ExDNA clone budget
  6/6; Reach: no new smells; Dialyzer: 15 baseline findings skipped; backend:
  905 tests, 0 failures, 83.79% coverage; frontend Relay validation,
  `tsc --noEmit`, and 1,507 Vitest tests across 105 files passed; client and SSR
  production builds passed; the bundle contract passed at 596,440 raw /
  182,164 gzip bytes against the 200,000-gzip-byte budget).
- `git diff --check` — passed.

## Handoff

- Implementation work is complete with no remaining code or test tasks in this
  lane.
- `docs/work/index.md` remains coordinator-owned and is intentionally unchanged
  here. The next dispatch-boundary reconciliation must remove this completed
  row only while preserving the three-ready-row floor.
