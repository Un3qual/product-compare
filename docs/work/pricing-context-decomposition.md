# Pricing Context Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-pricing-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the direct Pricing, merchant-detail, and
  Pricing GraphQL characterization suites.
- Claimed: 2026-07-22 on the current detached worktree after Catalog Context
  Decomposition restored the three-ready-row floor.

## Batch Outcome

`ProductCompare.Pricing` remains the stable application-facing context while
merchant, offer, price-history, and current offer-truth read implementations
now live in focused internal modules with unchanged public APIs, transactions,
queries, ordering, errors, alerts, and GraphQL behavior.

## Pre-decomposition Evidence

- Before this batch, `lib/product_compare/pricing.ex` was 625 lines and owned
  four independently reviewable implementation responsibilities behind one
  public boundary.
- The public context was used by ingestion, alerts, SEO, recommendations,
  snapshots, loaders, resolvers, and tests, so the facade could remain stable.
- The selected four-suite characterization gate passed 39 tests on 2026-07-22.
- Existing `ProductCompare.Pricing.OfferTruth` remained the single-offer policy
  owner; this row moved product-level reads without changing pricing policy.
- The row was path-disjoint from Accounts, Ingestion, and SEO decomposition.

## Internal Slices

1. Merchant persistence and merchant-detail ownership.
2. Merchant-product persistence, query, and page ownership.
3. Price-point transaction, latest-price, and history ownership.
4. Product-level current offer-truth read ownership.

## Boundaries

- Preserve every public function, default, guard, typespec, value, and error.
- Preserve conflict targets, filters, ordering, pages, preloads, transaction
  and alert enqueueing atomicity, price tie breaking, and offer-truth policy.
- Keep callers dependent only on `ProductCompare.Pricing`.
- Do not change schemas, migrations, GraphQL SDL, frontend contracts,
  ingestion, alerts policy, or product behavior.

## Verification

- `mix test test/product_compare/pricing/pricing_test.exs test/product_compare/pricing/merchant_detail_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/merchant_detail_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

## Completion Evidence

- Completed: 2026-07-22 on the current detached worktree.
- `ProductCompare.Pricing` is now a 161-line stable facade. `Merchants` owns
  merchant persistence, identity, listing, and detail projection; `Offers`
  owns merchant-product persistence, filtering, reads, and parent pages;
  `PriceHistory` owns price-point transactions, alert enqueueing, latest-price
  reads, history queries, and pages; and `TruthReads` owns product-level
  current offer truth. `OfferTruth` remains the unchanged single-offer policy
  owner.
- A public-function comparison against the pre-refactor facade found the same
  caller-facing functions, defaults, guards, and clauses. A source scan found
  no application caller using `Pricing.Merchants`, `Pricing.Offers`,
  `Pricing.PriceHistory`, or `Pricing.TruthReads` directly.
- The exact four-suite characterization gate passed 39 tests with 0 failures
  after extraction. `mix typecheck` and `mix format --check-formatted` passed.
- Full `mix ci` passed 905 backend tests with 83.61% coverage, 1,507 frontend
  tests across 105 files, Credo with no issues, Reach with no new findings,
  ExDNA at the unchanged 6/6 budget, Dialyzer, Relay validation, TypeScript,
  client and SSR builds, and the client-bundle contract.
- `mix work_queue.validate` and `git diff --check` passed at closeout with SEO,
  Alerts, and Catalog retained as the three ready successors.
