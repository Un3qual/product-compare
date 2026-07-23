# Pricing Context Decomposition Design

## Goal

Keep `ProductCompare.Pricing` as the stable application-facing context while
moving merchant, offer, price-history, and offer-truth implementations into
focused internal modules without changing product behavior or public contracts.

## Current Boundary

The 625-line facade currently owns four distinct responsibilities:

1. Merchant upsert, lookup, slug identity, and merchant-detail summaries.
2. Merchant-product persistence, filtering, parent-scoped pagination, and
   lookup behavior.
3. Price-point persistence, alert enqueueing, latest-price reads, and bounded
   history queries.
4. Current product offer-truth aggregation over active merchant products and
   latest observations.

The existing `ProductCompare.Pricing.OfferTruth` module remains the policy and
single-offer summarization owner. The context facade remains the only public
entry point used by ingestion, alerts, SEO, recommendations, snapshots,
GraphQL loaders/resolvers, and tests.

## Architecture

- `ProductCompare.Pricing.Merchants` owns merchant persistence, list/get/slug
  reads, and merchant-detail summaries.
- `ProductCompare.Pricing.Offers` owns merchant-product persistence, query
  construction, parent-scoped connection pages, and entity reads.
- `ProductCompare.Pricing.PriceHistory` owns price-point persistence and alert
  enqueueing, latest-price reads, range filtering, ordering, and parent-scoped
  history pages.
- `ProductCompare.Pricing.TruthReads` owns product-level current offer-truth
  aggregation while continuing to use `OfferTruth` for policy and individual
  offer summaries.
- `ProductCompare.Pricing` retains every existing public function, guard,
  default argument, typespec, result, exception, and explicit wrapper.

Internal modules may collaborate directly where the current implementation
already crosses these responsibilities, but application callers must continue
to depend only on the facade.

## Preserved Behavior

- Merchant name/domain convergence, canonical slug construction, conflict
  handling, list order, and invalid-ID behavior.
- Offer upsert conflict targets, filters, active-only policy, deterministic
  ordering, Relay page windows, preloads, and missing-record behavior.
- Price-point transaction and alert-job atomicity, latest-price tie breaking,
  range filters, history ordering, source preloads, and page bounds.
- Offer completeness, landed-price eligibility, freshness, currency grouping,
  best-offer selection, shared-time semantics, and empty-product behavior.
- Existing schemas, migrations, GraphQL SDL, alert policy, ingestion behavior,
  and frontend contracts.

## Errors And Transactions

The extraction preserves the existing `Repo.transaction` around price-point
creation and alert enqueueing. Merchant and offer conflict targets, changeset
errors, exceptions, and invalid-input function clauses remain unchanged. No
new fallback, callback dispatch, or rescue boundary is introduced.

## Verification

The characterization gate is:

```bash
mix test \
  test/product_compare/pricing/pricing_test.exs \
  test/product_compare/pricing/merchant_detail_test.exs \
  test/product_compare_web/graphql/pricing_queries_test.exs \
  test/product_compare_web/graphql/merchant_detail_test.exs
```

It currently passes 39 tests. Completion also requires `mix typecheck`,
`mix format --check-formatted`, `mix work_queue.validate`, `mix ci`,
`git diff --check`, and a caller scan proving the four internal owners are not
used outside the facade and their own implementation files.

## Non-Goals

- No query-budget redesign, schema or migration changes, GraphQL changes,
  frontend changes, pricing-policy changes, new alert behavior, or ingestion
  work.
- No generic repository, callback, adapter, or catch-all implementation layer.
- No separate queue row per internal module; the four slices share one stable
  Pricing contract and one reviewer decision.
