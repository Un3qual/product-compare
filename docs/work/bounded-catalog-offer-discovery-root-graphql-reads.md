# Bounded Catalog And Offer Discovery Root GraphQL Reads

## Snapshot

- Status: complete
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-catalog-offer-discovery-root-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-21 against the committed catalog and offer discovery
  root behavior, request loader, connection helper, and 95 passing focused
  tests. Coordinator closeout has recorded the completed lane; final docs
  re-review and exact-head post-closeout CI remain coordinator verification,
  not lane implementation blockers.
- Owner: `codex/bounded-comparison-root-reads`

## Batch Outcome

Identical catalog, filter-metadata, merchant-directory, and offer-discovery
root aliases reuse one database read per normalized field, filters, and page
within a GraphQL request without changing public values, filtering, ordering,
pagination, validation, nested values, or schema behavior.

## Verified Evidence

### Root-read SELECT budgets

| Root field | Request shape | Before | After |
| --- | --- | ---: | ---: |
| `products` | Two identical aliases | 2 `products` SELECTs | 1 `products` SELECT |
| `products` | Four identical aliases | 4 `products` SELECTs | 1 `products` SELECT |
| `productFilterMetadata` | Two identical aliases | 6 `products` SELECTs | 3 `products` SELECTs |
| `productFilterMetadata` | Four identical aliases | 12 `products` SELECTs | 3 `products` SELECTs |
| `merchants` | Two identical aliases | 2 `merchants` SELECTs | 1 `merchants` SELECT |
| `merchants` | Four identical aliases | 4 `merchants` SELECTs | 1 `merchants` SELECT |
| `merchantProducts` | Two identical aliases | 2 `merchant_products` SELECTs | 1 `merchant_products` SELECT |
| `merchantProducts` | Four identical aliases | 4 `merchant_products` SELECTs | 1 `merchant_products` SELECT |

The independently established budgets are products 2/4 to 1/1,
`productFilterMetadata` 6/12 to 3/3, merchants 2/4 to 1/1, and
`merchantProducts` 2/4 to 1/1.

Products-only and metadata-only GraphQL requests establish these individual
budgets directly. Mutation verification temporarily restored each root's direct
resolver path independently: products grew to 2 then 4 SELECTs, and metadata
grew to 6 then 12 SELECTs, while their exact value assertions remained ahead of
the budget assertions. The loader-backed production bytes were then restored.

### Public-behavior coverage

- Growing-alias tests first assert exact Relay edge, cursor, page-info, Relay
  ID, merchant, product, latest-price, active-coupon, price-history, and
  source-artifact values; the SELECT budgets are asserted only afterward.
- Catalog tests retain exact search, sort, numeric, boolean, enum, use-case,
  and combined filter behavior. Filter metadata retains display-safe values,
  Relay IDs, result counts, and selected numeric, boolean, and enum state.
- Mixed-key requests prove isolation: normalized product filters and an
  independent next Relay page use three `products` SELECTs; duplicate merchant
  first pages plus a distinct next page use two `merchants` SELECTs; duplicate
  offer keys plus distinct product, merchant, `activeOnly`, and next-page keys
  use five `merchant_products` SELECTs.
- Invalid catalog filters, IDs, cursors, and page sizes preserve their exact
  GraphQL errors and execute zero root collection SELECTs before loading.
- Direct no-loader resolver fallbacks remain covered for `products`,
  `productFilterMetadata`, `merchants`, and `merchantProducts`.

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

- `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs` — 95 tests, 0 failures.
- `mix typecheck` — passed.
- `mix format --check-formatted` — passed.
- `mix work_queue.validate` — passed: 3 ready rows. The restricted-sandbox
  attempt could not open Mix.PubSub's local socket (`:eperm`); the
  permission-enabled retry passed.
- `git diff --check` — passed.
- Pre-closeout full `mix ci` — exit 0: 895 backend tests and 1,507 frontend
  tests.
- ExDNA unchanged gate — passed.

## Closeout

This lane is complete. The exact focused four-suite gate passed 95 tests with
0 failures. Final docs re-review and exact-head post-closeout CI are coordinator
verification after the implementation closeout; they are not lane blockers.
