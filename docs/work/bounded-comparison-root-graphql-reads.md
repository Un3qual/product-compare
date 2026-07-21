# Bounded Comparison Root GraphQL Reads

## Snapshot

- Status: ready
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
