# Bounded Comparison Root GraphQL Reads

## Snapshot

- Status: complete on `codex/bounded-comparison-root-reads`
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-comparison-root-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-21 against live catalog comparison and recommendation
  GraphQL/context suites.

## Batch Outcome

Public comparison-product and comparison-recommendation root aliases keep fixed
SELECT budgets as aliases grow within one GraphQL request, without changing
input validation, order, missing positions, ranking, evidence, or errors.

## Ready Evidence

- `CatalogResolver.comparison_products/3` calls the canonical-only
  `Catalog.list_products_by_slugs/1` independently for every valid alias.
- `RecommendationsResolver.comparison_recommendation/3` independently resolves
  slugs and calls `Recommendations.compare/3` for every alias, repeating
  product, accepted-claim, merchant-product, and price-point reads.
- Both fields are public bounded comparison-selection entry points and share one
  ordering and selection lifecycle, so product-list and recommendation variants
  are internal slices rather than separate rows.
- Catalog comparison, recommendation context/GraphQL, and snapshot suites passed
  52 tests on 2026-07-21, but none proves fixed budgets as aliases grow.

## Internal Slices

1. Set-based canonical product projection for multiple slug selections.
2. Set-based recommendation projection for multiple product/profile requests.
3. Request-scoped GraphQL loading plus semantic and fixed-budget parity.

## Boundaries

- Preserve every current slug-count, uniqueness, blank-input, missing-product,
  profile, winner/tie/insufficient, ordering, reason, and evidence-ID contract.
- Preserve one request-scoped observation time for batched recommendations.
- Keep direct resolver fallbacks and the public GraphQL schema unchanged.
- Execute serially with other work that owns Recommendations or Loader paths.

## Verification

- Recommendation context, catalog comparison GraphQL, recommendation GraphQL,
  and Dataloader batching suites.
- Growing-alias query-budget regressions for both root fields.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

## Completion Evidence

- `Catalog.list_products_by_slug_selections/1` projects duplicate and missing
  positions from one union product lookup.
- `Recommendations.compare_many/2` uses one timestamp and one union of products,
  accepted claims, merchant products, and current price evidence, while the
  singular API delegates without changing behavior.
- The request-scoped comparison source keeps the two- and four-alias GraphQL
  budgets equal at three product SELECTs, one current-claim SELECT, one merchant-
  product SELECT, and one price-point SELECT. Before batching, the same counts
  grew from six/two/two/two to twelve/four/four/four.
- Literal behavior oracles cover lowest-cost winner and tie plus best-value
  winner and insufficient-evidence results, including timestamps, profiles,
  versions, currencies, reasons, rankings, and exact evidence IDs.
- The recommendation context, catalog comparison, recommendation GraphQL, and
  Dataloader batching suites pass 59 tests.
- `mix typecheck`, `mix format --check-formatted`, `mix work_queue.validate`
  (`work queue valid: 3 ready rows`), and `git diff --check` pass.
- The full `mix ci` gate passes with 856 backend tests, 1,507 frontend tests,
  Relay validation, client/SSR builds, static analysis, and 83.60% coverage.

## Remaining Work

Bounded authorized management connections, bounded catalog and offer-discovery
roots, and bounded operator reporting roots remain ready in the shared queue.
