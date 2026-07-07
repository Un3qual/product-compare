# Product Detail Offer Summary Implementation Plan

Goal: make `/products/:slug` faster to scan by summarizing the loaded active
offers before the detailed offer list.

Constraints and non-goals:

- Use only fields already loaded by `ProductOffersRouteQuery`.
- Do not change GraphQL schema, pricing resolvers, pagination contracts, or
  product ingestion.
- Preserve offer pagination, compare-slug preservation, coupon rendering, and
  price-history rows.

Owned paths:

- `assets/src/routes/products/detail.tsx`
- `assets/test/routes/products/detail.route.test.tsx`
- `docs/work/frontend-product-detail.md`

Batches:

1. Extend route tests with a product that has multiple active offers, latest
   prices, coupons, and one offer missing a latest price.
2. Add a compact `Offer snapshot` section above the active-offer list for ready
   offer data.
3. Derive summary values from the already rendered page of active offers:
   current offer count, lowest visible price with merchant name when available,
   coupon availability count, and missing-price count.
4. Keep empty, unavailable, and paginated states unchanged except for omitting
   the summary when there are no visible offers.
5. Record completion evidence under
   `### Product Detail Offer Summary Evidence`.

Verification:

- `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Fallback:

- If the existing route query lacks enough data for one of the summary values,
  omit that value and document the omission in the lane evidence rather than
  widening this row into backend work.
