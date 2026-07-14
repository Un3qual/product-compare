# Offer Truth Read Contract Implementation Plan

**Goal:** Expose complete observation facts and a database-wide comparable
offer summary that is not limited to one browser page.

**Design:**
`docs/superpowers/specs/2026-07-13-offer-truth-and-durable-ingestion-design.md`

**Owned paths:**

- `lib/product_compare/pricing.ex`
- `lib/product_compare/pricing/offer_truth.ex`
- `lib/product_compare_web/graphql/loader.ex`
- `lib/product_compare_web/resolvers/pricing_resolver.ex`
- `lib/product_compare_web/schema.ex`
- `assets/schema.graphql`
- `test/product_compare/pricing/pricing_test.exs`
- `test/product_compare_web/graphql/pricing_queries_test.exs`
- `test/product_compare_web/graphql/schema_snapshot_test.exs`
- `docs/work/product-trust-and-discovery.md`

## Tasks

1. Add failing pure/context tests for landed-price completeness, unknown stock,
   fresh/aging/stale classification, stale exclusion, and same-currency global
   best-offer selection.
2. Implement a configurable `OfferTruth` policy and aggregate query that reads
   all eligible active offers for a product.
3. Add failing GraphQL tests; expose `shipping`, `inStock`, observation source,
   freshness fields, landed-price completeness, and product-level offer truth.
4. Update the schema snapshot and run focused pricing/GraphQL tests, formatting,
   typecheck, queue validation, and `git diff --check`.

Tax quoting, currency conversion, reconciliation, and frontend rendering are
separate dependent slices.
