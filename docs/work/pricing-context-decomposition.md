# Pricing Context Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-pricing-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the direct Pricing, merchant-detail, and
  Pricing GraphQL characterization suites.

## Target Outcome

`ProductCompare.Pricing` remains the stable application-facing context while
merchant, offer, price-history, and current offer-truth read implementations
move into focused internal modules with unchanged public APIs, transactions,
queries, ordering, errors, alerts, and GraphQL behavior.

## Ready Evidence

- `lib/product_compare/pricing.ex` is 625 lines and owns four independently
  reviewable implementation responsibilities behind one public boundary.
- The public context is used by ingestion, alerts, SEO, recommendations,
  snapshots, loaders, resolvers, and tests, so the facade can remain stable.
- The selected four-suite characterization gate passed 39 tests on 2026-07-22.
- Existing `ProductCompare.Pricing.OfferTruth` remains the single-offer policy
  owner; this row moves product-level reads without changing pricing policy.
- The row is path-disjoint from Accounts, Ingestion, and SEO decomposition.

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
