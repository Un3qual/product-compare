# Bounded Public Slug GraphQL Reads

## Snapshot

- Status: complete on `codex/bounded-graphql-read-budgets`
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-public-slug-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-21 against the public product and merchant resolvers,
  canonical and historical product slug lookups, merchant slug lookups, alias
  GraphQL coverage, and request-scoped Dataloader sources.

## Current Reconciliation

The 2026-07-31 GraphQL simplification removed the singleton public-slug source.
Product and merchant slug entry points now resolve directly per root field, so
identical aliases intentionally execute independently. The prior reuse budgets
remain historical completion evidence; canonical/history behavior, merchant
identity, missing results, and GraphQL errors remain current.

## Historical Batch Outcome

Aliased public `product(slug:)` and `merchant(slug:)` entry-point reads keep a
fixed SELECT budget per entity type as alias count grows, without changing
canonical or historical product-slug precedence, merchant identity, nested
Dataloader fields, cache scope, or missing-entity behavior.

## Initial Evidence

- `CatalogResolver.product/3` calls `Catalog.get_product_by_slug/1` for every
  GraphQL alias. Each lookup first checks the canonical product slug and may
  perform a second historical-alias query.
- `PricingResolver.merchant/3` calls `Pricing.get_merchant_by_slug/1` for every
  GraphQL alias.
- Existing aliased product coverage proves nested brand batching for two
  products but retains two direct root product SELECTs. Merchant-detail
  coverage exercises one slug and does not prove a growing alias budget.

## Internal Slices

1. Set-based canonical and historical product-slug lookup with canonical
   precedence.
2. Set-based merchant-slug lookup.
3. Request-scoped public lookup loading with semantic and fixed-budget
   GraphQL coverage.

## Boundaries

- Preserve canonical product-slug precedence over historical aliases.
- Preserve duplicate, blank, missing, and invalid slug behavior.
- Preserve nested product and merchant Dataloader behavior plus product
  resolver cache clearing.
- Do not change the public GraphQL schema.

## Verification

- Catalog and Pricing context parity tests.
- Catalog, merchant-detail, and growing-alias Dataloader tests.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

## Completion Evidence

- Before batching, two product and merchant aliases issued `%{products: 3,
  product_slug_aliases: 1, brands: 1, merchants: 2, merchant_products: 1,
  price_points: 1}` SELECTs. Four aliases issued `%{products: 6,
  product_slug_aliases: 2, brands: 1, merchants: 4, merchant_products: 1,
  price_points: 1}`.
- After batching, both request sizes issue `%{products: 2,
  product_slug_aliases: 1, brands: 1, merchants: 1, merchant_products: 1,
  price_points: 1}`. The product pair is one canonical query plus one
  unresolved historical-alias query; every nested Dataloader budget remains
  fixed.
- Catalog context coverage proves canonical precedence over a conflicting
  stored alias, historical lookup, canonical result identity, empty, duplicate,
  blank, missing, and invalid-term behavior. Mixed two- and four-slug requests
  both use two SELECTs, and empty input uses none.
- Pricing context coverage proves canonical merchant identity plus empty,
  duplicate, blank, missing, and invalid-term behavior. Two- and four-slug
  requests both use one SELECT, and empty input uses none.
- GraphQL coverage asserts exact product and merchant IDs/slugs, historical
  product canonicalization, nested brands, merchant summaries, and nullable
  missing results. Product resolution still clears the request-local base-unit
  symbol cache before scheduling its lookup.
- Focused verification passed 70 tests across the Catalog/Pricing context and
  catalog/merchant/Dataloader GraphQL suites; typecheck, formatting, queue
  validation with three ready rows, and diff hygiene passed.
- `mix ci` passed 839 backend tests with 83.66% coverage, Credo with no issues,
  the 6/6 ExDNA clone budget, cross-function smell detection, Dialyzer, Relay
  validation, TypeScript, 1,507 frontend tests across 105 files, client and SSR
  builds, and the 182,164-byte gzip client-bundle budget.

## Remaining Work

None. Public opaque-key, comparison-evidence, and authorized-node read-budget
outcomes remain ready in the live queue.
