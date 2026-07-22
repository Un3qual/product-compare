# Bounded Catalog And Offer Discovery Root GraphQL Reads

## Snapshot

- Status: active
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-catalog-offer-discovery-root-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-21 against the live root schema, catalog and pricing
  resolvers, request loader, connection helper, and 51 passing focused tests.
- Owner: `codex/bounded-comparison-root-reads`

## Batch Outcome

Identical catalog, filter-metadata, merchant-directory, and offer-discovery
root aliases reuse one database read per normalized field, filters, and page
within a GraphQL request without changing public values, filtering, ordering,
pagination, validation, nested values, or schema behavior.

## Ready Evidence

- `products` validates filters and calls `Connection.from_query_result/3`
  directly for every alias.
- `productFilterMetadata` validates the same catalog filter contract and calls
  `Catalog.product_filter_metadata/1` directly for every alias.
- `merchants` and top-level `merchantProducts` each call
  `Connection.from_query_result/3` directly for every alias after their current
  argument normalization.
- The focused catalog-query, filter-metadata, and pricing-query suites pass 51
  tests. They characterize search, sorting, filters, selected metadata, Relay
  IDs, connection order, cursors, page sizes, missing values, and nested offer
  data, but do not prove repeated-alias budgets.

## Internal Slices

1. Catalog connection and filter-metadata request reuse.
2. Merchant-directory and top-level offer connection request reuse.
3. Growing-alias query budgets plus filter, pagination, validation, and nested-
   value parity.

## Boundaries

- Normalize and validate inputs before scheduling any load.
- Key every load by field kind, normalized filters, and Relay connection
  arguments.
- Do not share cache entries across distinct arguments.
- Preserve direct resolver fallbacks and the public GraphQL schema.
- Do not reopen deferred ingestion dashboard or eBay connector work.

## Verification

- Catalog-query, catalog-filter-metadata, pricing-query, and Dataloader batching
  suites.
- Growing-alias query-budget regressions for all four root fields.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
