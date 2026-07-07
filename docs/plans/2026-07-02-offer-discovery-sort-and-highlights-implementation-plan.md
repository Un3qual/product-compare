# Offer Discovery Sort And Highlights Implementation Plan

Goal: let shoppers sort the currently loaded `/offers` result page and quickly
identify the strongest visible offer.

Constraints and non-goals:

- Sort only the loaded page client-side; do not change backend ordering,
  cursor semantics, or GraphQL input shape.
- Preserve existing product, merchant, active-only, page-size, reset, and
  pagination URL behavior.
- Do not add merchant-only offer browsing; `merchantProducts(input:)` still
  requires `productId`.

Owned paths:

- `assets/src/routes/offers/loader.ts`
- `assets/src/routes/offers/paths.ts`
- `assets/src/routes/offers/filters.tsx`
- `assets/src/routes/offers/index.tsx`
- `assets/test/routes/offers/offer-discovery-loader.test.ts`
- `assets/test/routes/offers/offer-discovery.route.test.tsx`
- `docs/work/frontend-offer-discovery-demo-parity.md`

Batches:

1. Add a normalized `sort` filter with allowed values `default`, `price_asc`,
   `price_desc`, and `merchant_name`.
2. Preserve `sort` through filter forms, reset behavior, clear-merchant links,
   first-page links, and next-page links.
3. Render a sort control on `/offers` and summarize the active sort in the
   filter summary.
4. Sort visible offers using parsed latest price for price modes, merchant name
   for merchant mode, and original connection order for default mode.
5. Mark the first visible price-sorted result with a concise page-local best
   price label when it has a numeric latest price.
6. Record completion evidence under
   `### Offer Discovery Sort And Highlights Evidence`.

Verification:

- `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Fallback:

- If price parsing is ambiguous for a value, keep that offer after numeric
  prices and preserve original relative order among ambiguous values.
