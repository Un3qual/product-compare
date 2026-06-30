# Frontend Catalog Browse Work Doc

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-29 (working tree)
- Recently completed usable-product plan:
  - `docs/plans/2026-06-29-product-catalog-decision-cards-implementation-plan.md`
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- Recently completed implementation plan:
  - `docs/plans/2026-06-27-project-catalog-browse-page-size-implementation-plan.md`
- Planned faceted filtering follow-up:
  - `docs/plans/2026-06-30-product-filter-metadata-and-facets-implementation-plan.md`
  - `docs/plans/2026-06-30-catalog-faceted-filtering-ui-implementation-plan.md`
- Definition of done:
  - The Bun frontend exposes a `/products` route with SSR-safe rendering.
  - The route loads the first page of products from the existing GraphQL `products` connection.
  - Root navigation and route-level tests cover the browse entry point plus success, empty, and unavailable states.
  - `docs/work/index.md` and `docs/plans/NOW.md` reflect the resulting steady state.

## Current Usable Product Batch

- Status: done.
- Plan:
  `docs/plans/2026-06-29-product-catalog-decision-cards-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/catalog/browse.tsx`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `docs/work/frontend-catalog-browse.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/products` cards expose clear detail, compare, and offer
  actions without backend or Relay schema changes.
- Implemented:
  - `/products` product cards now render as named article regions with product
    name headings, slug, brand, and a labelled decision-action list.
  - Each card exposes stable `View details`, `Compare`, and `View offers` links
    using the existing slug/product-id URL contracts and current Relay browse
    data.
  - Product detail action paths encode slugs as URL path segments so reserved
    slug characters cannot split the `/products/:slug` route.
  - Product card article labels use the product name directly instead of
    slug-derived DOM ids, so whitespace in slugs cannot break `aria-labelledby`
    IDREF parsing.
  - Route coverage asserts card action destinations and confirms page-size plus
    pagination controls remain present with the card action markup.
- Completed verification:
  - RED: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    failed with 2 expected failures because the previous markup had no named
    product `article` card or decision-action list.
  - GREEN: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    - 24 tests, 0 failures.
  - Review-fix RED: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    failed with 1 expected failure because a reserved-character slug rendered
    as `/products/reserved/product?variant=1` instead of an encoded path
    segment.
  - Review-fix GREEN: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    - 25 tests, 0 failures.
  - Final-review RED: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    failed with 1 expected failure because a space-containing slug made the
    product `article` lose its accessible name.
  - Final-review GREEN: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    - 26 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Current Cross-Project Batch

- Status: done.
- Plan: `docs/plans/2026-06-27-project-catalog-browse-page-size-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/catalog/loader.ts`
  - `assets/src/routes/catalog/browse.tsx`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `docs/work/frontend-catalog-browse.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/products` accepts bounded `first` values and preserves page size through pagination.
- Completed verification:
  - `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx` - 22 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Verified Current State

- `assets/src/router.tsx` now mounts `/products` with a route loader alongside `/` and the auth routes under `/auth/*`.
- `assets/src/routes/root.tsx` now exposes `Browse products` links from both the app navigation and the home action row.
- `assets/src/routes/catalog/api.ts` now loads the first `products(first: 12)` page and normalizes typed product rows for the route.
- `assets/src/routes/catalog/api.ts` now returns route-local `"ready"` and `"error"` states so failed fetches render fallback UI instead of rejecting the route.
- `assets/src/routes/catalog/browse.tsx` now renders product name, slug, and brand rows from route loader data on `/products`, plus empty and unavailable fallback copy.
- `assets/src/entry.server.tsx` now uses React Router's static handler/static router path so `/products` can SSR its loader data and hydrate on the client.
- `assets/src/routes/catalog/loader.ts` now parses `first` from `/products` URL params with default `12`, max `48`, and malformed/oversized fallback behavior.
- `assets/src/routes/catalog/browse.tsx` now renders a compact `Products per page` control (`12`, `24`, `48`) and preserves `first` in `Next products` and `First products` links.
- `assets/src/routes/catalog/browse.tsx` now renders each populated product row
  as a named decision card with explicit details, compare, and offers actions
  without changing the browse loader or Relay query shape.
- `assets/test/routes/catalog/browse.route.test.tsx` now covers page-size normalization, selected page-size rendering, and pagination link preservation.
- `assets/test/routes/catalog/browse.route.test.tsx` now covers the decision-card
  action labels/destinations while keeping page-size and pagination regressions
  covered.
- The frontend already has Bun SSR, route-level tests, and a shared GraphQL transport helper in `assets/src/relay/fetch-graphql.ts`.
- The backend already exposes the paginated `products` query in `lib/product_compare_web/schema.ex` with coverage in `test/product_compare_web/graphql/catalog_queries_test.exs`.

## Completed

- Rebaselined the next frontend slice into a current implementation plan at `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`.
- Completed Task 1 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md` by adding the `/products` route shell, root browse links, and focused route tests.
- Completed Task 2 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md` by wiring the typed browse loader, route rendering, and SSR hydration path for `/products`.
- Completed Task 3 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md` by adding empty/unavailable state handling, focused route regressions, and slice verification.

## Previous Steady State

1. The 2026-03-17 catalog browse baseline batch is complete.
2. The 2026-06-27 cross-project page-size follow-up is complete.
3. The 2026-06-29 decision-card follow-up is complete.

## Planned Follow-Up

- Product filter metadata and facets:
  - Add a backend and GraphQL `productFilterMetadata(filters:)` contract for
    display-safe type, use-case, numeric, boolean, and enum filter metadata.
  - Keep result filtering on the existing `products(filters:)` surface and
    compute metadata from unpaginated, selected-current-claim filters.
- Catalog faceted filtering UI:
  - Wire `/products` to parse and serialize filter URL state, preload
    metadata, render filter controls, preserve filters across pagination, and
    show filtered empty states.
  - This UI row depends on the metadata/facet contract and should not hardcode
    environment-specific IDs.

## Active Dispatch

- Status: ready.
- Plan:
  `docs/plans/2026-06-30-product-filter-metadata-and-facets-implementation-plan.md`.
- Owned paths:
  - `lib/product_compare/catalog/filter_metadata.ex`
  - `test/product_compare/catalog/filter_metadata_test.exs`
  - `test/product_compare_web/graphql/catalog_filter_metadata_test.exs`
  - `lib/product_compare/catalog.ex`
  - `lib/product_compare/catalog/filtering.ex`
  - `lib/product_compare/specs.ex`
  - `lib/product_compare/taxonomy.ex`
  - `lib/product_compare_web/schema.ex`
  - `lib/product_compare_web/resolvers/catalog_resolver.ex`
  - `test/product_compare_web/graphql/catalog_queries_test.exs`
  - `docs/work/frontend-catalog-browse.md`
- Verification:
  - `mix test test/product_compare/catalog/filter_metadata_test.exs`
  - `mix test test/product_compare_web/graphql/catalog_filter_metadata_test.exs`
  - `mix test test/product_compare_web/graphql/catalog_queries_test.exs`
  - `mix typecheck`
  - `git diff --check`
- Exit condition: GraphQL exposes display-safe filter metadata/facet counts for
  the same filter input accepted by `products(filters:)`.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-catalog-browse.md`
- `sed -n '1,260p' docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- `sed -n '1,220p' assets/src/router.tsx`
- `sed -n '1,220p' assets/src/routes/root.tsx`
- `rg -n "field :products" lib/product_compare_web/schema.ex`
