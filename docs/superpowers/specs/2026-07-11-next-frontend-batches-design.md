# Next Frontend Batches Design

## Status

Approved by the user on 2026-07-11 by selecting batches 1, 2, 3, 5, 6,
7, 8, and 9 from the live queue audit.

## Goal

Complete the selected shopper-facing polish, route-foundation work, and
behavior-preserving React route decomposition while leaving three validated
ready rows in the live dispatcher.

## Architecture

### Bounded local filters

The compare picker and merchant directory filters remain client-local and
operate only on already-loaded or currently visible Relay records. They do not
change GraphQL variables, traverse cursors, or imply server-wide search.
Pagination remains available when a filter has no match.

### Route foundations

An explicit wildcard data route throws a 404 `Response`, renders through the
shared route error boundary, and preserves the 404 status in the SSR `Response`.
Route document metadata is declared on route handles and resolved by one
component under the root layout. React 19 `<title>` and `<meta>` resources keep
client navigation and SSR output on the same metadata path.

### Route decomposition

The API-token, offer-discovery, and product-detail route modules keep data
loading, Relay ownership, and mutation orchestration in their route owners.
Each extraction moves one cohesive presentation boundary into a directly
imported sibling module. No barrel files, new queries, mutation changes, or
state duplication are introduced.

## Error Handling

- Unknown application paths render a page-specific not-found message.
- Redirect `Response` behavior remains unchanged.
- Non-200 static-handler contexts return their rendered HTML with the same
  status code and headers.
- Existing route error boundaries continue to own loader and network failures.

## Testing

- New filter and route behavior follows RED/GREEN TDD with focused Vitest runs.
- Refactors use the existing route suites as characterization gates before and
  after each extraction.
- Final verification runs Relay generation, all frontend tests, TypeScript,
  client and SSR builds, the work-queue validator, and diff hygiene.

## Queue Boundary

The selected eight batches execute in five commits. Three unselected but
validated rows remain ready afterward: skip navigation, affiliate-setup form
decomposition, and feed-candidate review decomposition. Deferred ingestion,
eBay, production privacy, attribution controls, and production-readiness proof
remain excluded.
