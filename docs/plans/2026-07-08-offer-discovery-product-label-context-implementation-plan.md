# Offer Discovery Product Label Context Implementation Plan

Goal: make `/offers` product context readable by showing the selected product's
name, brand, and detail link instead of relying on raw product global IDs.

Constraints and non-goals:

- Keep this frontend/GraphQL-query only; do not change backend pricing,
  ingestion, provider, dashboard, or operator contracts.
- Continue to require `productId` for `merchantProducts(input:)`.
- Preserve active-only, merchant, page-size, sort, reset, visible merchant
  quick-filter, tracking, and pagination behavior.
- Fall back to the raw product ID only when the product node lookup is missing
  or unavailable.

Owned paths:

- `assets/src/routes/offers/queries/OfferDiscoveryRouteQuery.ts`
- `assets/src/routes/offers/loader.ts`
- `assets/src/routes/offers/filters.tsx`
- `assets/src/routes/offers/index.tsx`
- `assets/test/routes/offers/offer-discovery-loader.test.ts`
- `assets/test/routes/offers/offer-discovery.route.test.tsx`
- `assets/src/__generated__/OfferDiscoveryRouteQuery.graphql.ts`
- `docs/work/frontend-offer-discovery-demo-parity.md`

Batches:

1. Extend `OfferDiscoveryRouteQuery` with a `node(id: $productId)` product
   lookup for the selected product id.
2. Pass the normalized product id as both the `merchantProducts(input:)`
   product id and the product node lookup id from the route loader.
3. Render selected-product context with product name, brand name, and a
   `/products/:slug` detail link when the node lookup returns a product.
4. Keep the existing raw product-id summary as a fallback for missing or
   non-product node results.
5. Update focused loader and route tests for product label context, empty
   offers, loader errors, missing product id, pagination, reset links, merchant
   filters, and sort preservation.
6. Record completion evidence under
   `### Offer Discovery Product Label Context Evidence`.

Verification:

- `cd assets && bun run relay`
- `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Fallback:

- If the local schema snapshot cannot query `node(id:)` as `Product`, stop and
  record a blocker instead of adding a new backend product lookup field.
