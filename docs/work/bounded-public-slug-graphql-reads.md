# Bounded Public Slug GraphQL Reads

## Snapshot

- Status: active on `codex/bounded-graphql-read-budgets`
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-public-slug-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-21 against the public product and merchant resolvers,
  canonical and historical product slug lookups, merchant slug lookups, alias
  GraphQL coverage, and request-scoped Dataloader sources.

## Batch Outcome

Aliased public `product(slug:)` and `merchant(slug:)` entry-point reads keep a
fixed SELECT budget per entity type as alias count grows, without changing
canonical or historical product-slug precedence, merchant identity, nested
Dataloader fields, cache scope, or missing-entity behavior.

## Ready Evidence

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
