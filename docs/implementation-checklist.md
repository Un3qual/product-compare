# ProductCompare Backend Implementation Checklist

## Migration Order

1. `20260303222607_init_extensions`
2. `20260303222608_create_accounts_taxonomy_catalog`
3. `20260303222610_create_specs_and_sources`
4. `20260303222611_create_pricing_affiliate_discussions`

## Context Boundaries

- `ProductCompare.Accounts`: users + reputation
- `ProductCompare.Taxonomy`: taxonomy trees, closure maintenance, use-case tagging
- `ProductCompare.Catalog`: products/brands + primary-type guardrail + filtering entrypoint
- `ProductCompare.Specs`: dimensions/units, typed claims, claim moderation, current claim selection
- `ProductCompare.Pricing`: merchants/listings/history queries
- `ProductCompare.Affiliate`: networks/programs/links/coupons
- `ProductCompare.Discussions`: threads/posts/reviews CRUD

## MVP Done

- Hard type + soft use-case taxonomy with closure table and reparenting.
- Richly typed claims with unit normalization to base values.
- Canonical current claim pointer with unique `(product_id, attribute_id)` and transactional swap.
- Filtering helper for type descendants, numeric ranges, bool, enum, and use-case tags.
- Pricing upsert/history APIs.
- Discussion/review CRUD context APIs.
- Deterministic seeds with sample monitors and price timeline.
- Required tests for conversion, closure traversal, and current-claim atomic swap.

## Deferred Scope

- Scraping ingestion jobs and scheduling pipelines (Oban, retries, dead letters).
- Derived formula execution engine and dependency-driven recomputation workers.
- Affiliate API ingestion/normalization jobs.
- Advanced moderation and anti-spam/reputation governance.
- Embeddings/semantic search and frontend search UI.
- Full GraphQL Relay API surface and auth lifecycle hardening.
