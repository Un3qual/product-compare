# Frontend Offer Discovery Demo Parity Implementation Plan (2026-06-01)

Execution status lives in `docs/work/frontend-offer-discovery-demo-parity.md`, `docs/work/index.md`, and `docs/plans/NOW.md`.

Status: completed on 2026-06-01.

## Goal

Expose the existing top-level GraphQL `merchantProducts(input:)` contract through a Relay-backed `/offers` frontend route so product offer discovery is demoable outside an individual product detail page.

## Architecture

- Keep the backend contract unchanged: `merchantProducts(input:)` already exists and is covered by pricing GraphQL tests.
- Add a frontend route that accepts URL filters and preloads a Relay query with the request-scoped route Relay environment.
- Use product browse cards as the ergonomic entry point because they already have product global IDs.
- Keep the first batch display-only: no affiliate mutation flow, scheduled ingestion, or admin-only semantics.

## Task 1: Add Offer Discovery Route Loading And Query

Status: completed on 2026-06-01.

### Files

- Create: `assets/src/routes/offers/queries/OfferDiscoveryRouteQuery.ts`
- Create: `assets/src/routes/offers/loader.ts`
- Create: `assets/src/routes/offers/__tests__/offer-discovery-loader.test.ts`
- Update: `assets/schema.graphql` only if Relay proves the local schema snapshot is stale.
- Generate: `assets/src/__generated__/OfferDiscoveryRouteQuery.graphql.ts`

### Acceptance Criteria

- `/offers?productId=<global-product-id>` preloads `merchantProducts(input:)` with `activeOnly: true` by default.
- URL params supported by the loader:
  - `productId`
  - `merchantId`
  - `activeOnly`, defaulting to `true`
  - `first`, defaulting to `6`
  - `after`
- Missing `productId` returns a typed missing-product state without issuing a Relay preload.
- Relay preload failures recover to a typed error state.

### TDD Steps

1. Add loader tests proving missing product ID, default variables, explicit filters, cursor params, and recoverable preload errors.
2. Run `cd assets && bun x vitest run src/routes/offers/__tests__/offer-discovery-loader.test.ts`.
   - Expected RED: route loader/query modules do not exist.
3. Add `OfferDiscoveryRouteQuery` and `offerDiscoveryLoader`.
4. Run `cd assets && bun run relay`.
5. Re-run the loader test.
   - Expected GREEN.

## Task 2: Render Offer Discovery States

Status: completed on 2026-06-01.

### Files

- Create: `assets/src/routes/offers/index.tsx`
- Create: `assets/src/routes/offers/__tests__/offer-discovery.route.test.tsx`

### Acceptance Criteria

- The missing-product state asks the user to start from browse products.
- Ready state renders:
  - product offer rows with merchant name, URL, active/inactive state, latest price, currency, coupon summary, and compact price-history summary.
  - empty state when no offers match.
  - next-page link preserving current filters.
  - first-page reset link after a cursor page.
- Loader and query failure states render an unavailable fallback.

### TDD Steps

1. Add route component tests for missing-product, ready rows, empty state, next-page link, first-page reset, loader error, and query unavailable fallback.
2. Run `cd assets && bun x vitest run src/routes/offers/__tests__/offer-discovery.route.test.tsx`.
   - Expected RED: route component does not exist.
3. Add `OfferDiscoveryRoute` and small formatting helpers local to the route.
4. Re-run the route component test.
   - Expected GREEN.

## Task 3: Register The Route And Add Entry Points

Status: completed on 2026-06-01.

### Files

- Update: `assets/src/router.tsx`
- Update: `assets/src/routes/root.tsx`
- Update: `assets/src/routes/catalog/browse.tsx`
- Update: `assets/src/routes/catalog/__tests__/browse.route.test.tsx`
- Update: `assets/src/routes/__tests__/root.route.test.tsx`
- Update: `assets/src/__tests__/router.test.tsx`
- Update: `docs/work/frontend-offer-discovery-demo-parity.md`
- Update: `docs/plans/NOW.md`

### Acceptance Criteria

- `/offers` is registered with `offerDiscoveryLoader`, `OfferDiscoveryRoute`, and a route-level error boundary.
- Root navigation and home actions include an `Offers` link.
- Product browse cards include a direct offer-discovery link using each product's GraphQL ID.
- Focused router/root/browse tests cover the new route and links.

### TDD Steps

1. Update focused router/root/browse tests to expect the route and links.
2. Run `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx`.
   - Expected RED: route and links are missing.
3. Register the route and add links.
4. Re-run focused router/root/browse tests.
   - Expected GREEN.

## Task 4: Final Verification And Queue Closure

Status: completed on 2026-06-01.

### Files

- Update: `docs/work/frontend-offer-discovery-demo-parity.md`
- Update: `docs/work/index.md`
- Update: `docs/plans/INDEX.md`
- Update: `docs/plans/NOW.md`
- Update: `ARCHITECTURE.md`

### Acceptance Criteria

- Focused offer-discovery frontend tests pass.
- Frontend typecheck and check pass.
- Backend pricing GraphQL contract test still passes.
- Queue docs record whether any unblocked offer-discovery batch remains.
- `ARCHITECTURE.md` records `/offers` as delivered only after verification passes.

### Verification

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/offers/__tests__/offer-discovery-loader.test.ts src/routes/offers/__tests__/offer-discovery.route.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx
cd assets && bun run typecheck
mix test test/product_compare_web/graphql/pricing_queries_test.exs
cd assets && bun run check
git diff --check
```

Expected: all pass.
