# Frontend Catalog Browse Work Doc

## Snapshot

- Status: ready (catalog product list presentation extraction)
- Priority: P1
- Source of truth: this file
- Last verified: 2026-07-09 after shopper decision-confidence aggregate verification
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
- Recently completed shopper decision-confidence plan:
  - `docs/plans/2026-07-09-catalog-result-guidance-and-removable-filters-implementation-plan.md`
- Definition of done:
  - The Bun frontend exposes a `/products` route with SSR-safe rendering.
  - The route loads the first page of products from the existing GraphQL `products` connection.
  - Root navigation and route-level tests cover the browse entry point plus success, empty, and unavailable states.
  - `docs/work/index.md` and `docs/plans/NOW.md` reflect the resulting steady state.

## Ready Next Batch

- Status: ready
- Plan: `docs/superpowers/plans/2026-07-11-next-presentation-reserve-batches.md`
- Next action: Extract product cards, specification highlights, and compare actions while preserving route-owned Relay, filter, URL, tray, and pagination orchestration.
- Owned paths:
  - `assets/src/routes/catalog/BrowseRoute.tsx`
  - `assets/src/routes/catalog/BrowseProductList.tsx`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `docs/work/frontend-catalog-browse.md`
- Prerequisites: Existing catalog browse route suite remains the characterization contract.
- Verification:
  - `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: Product-list presentation is isolated while filters, compare selection, navigation, and pagination behavior remain green.

## Catalog Result Guidance And Removable Filters Evidence

- Status: done.
- Plan:
  `docs/plans/2026-07-09-catalog-result-guidance-and-removable-filters-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/catalog/filters.ts`
  - `assets/src/routes/catalog/paths.ts`
  - `assets/src/routes/catalog/filter-form.tsx`
  - `assets/src/routes/catalog/browse.tsx`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `docs/work/frontend-catalog-browse.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/products` shows the complete metadata-backed result count
  and scoped filter-removal links that preserve unrelated filter, page-size,
  and compare state while dropping stale cursors.
- Implemented:
  - `/products` shows `No matching products`, `1 matching product`, or a plural
    match count from `productFilterMetadata.resultCount` on populated and empty
    pages.
  - Active search, sort, type, use-case, numeric, boolean, and enum summaries
    now expose scoped removal links through the existing first-page serializer.
  - Removal keeps unrelated normalized filters, page size, and repeated compare
    slugs while omitting stale `after` cursors.
- Completed verification:
  - RED: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    - 58 tests, 4 expected failures and 54 passes for missing count/removal UI.
  - GREEN: the same focused command - 58 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Catalog Search And Sort Evidence

- Status: done.
- Plan:
  `docs/plans/2026-07-08-catalog-search-and-sort-implementation-plan.md`.
- Owned paths:
  - `lib/product_compare/catalog/filtering.ex`
  - `lib/product_compare_web/resolvers/catalog_resolver.ex`
  - `lib/product_compare_web/schema.ex`
  - `test/product_compare_web/graphql/catalog_queries_test.exs`
  - `assets/schema.graphql`
  - `assets/src/routes/catalog/filters.ts`
  - `assets/src/routes/catalog/loader.ts`
  - `assets/src/routes/catalog/paths.ts`
  - `assets/src/routes/catalog/filter-form.tsx`
  - `assets/src/routes/catalog/browse.tsx`
  - `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts`
  - `assets/src/__generated__/ProductFilterMetadataQuery.graphql.ts`
  - `docs/work/frontend-catalog-browse.md`
- Verification:
  - `mix test test/product_compare_web/graphql/catalog_queries_test.exs`
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/products` supports bounded text search and deterministic
  sorting through URL state, and existing filters, pagination, and compare
  selection links preserve search/sort state.
- Implemented:
  - Extended `ProductFiltersInput` with a trimmed, 100-character-bounded text
    query and deterministic `ID_ASC`, `NAME_ASC`, `BRAND_NAME_ASC`, and
    `NEWEST` sort modes.
  - Catalog text search matches product name, slug, model number, description,
    and brand name case-insensitively while composing with existing facets.
  - Every sort mode includes stable product-key tie breakers for cursor
    pagination.
  - `/products` now parses `q` and `sort` URL state, renders native search and
    sort controls, labels active search/sort state, and preserves both values
    through filters, pagination, and compare-selection links.
  - Refreshed the frontend schema snapshot and Relay artifacts for the expanded
    product filter input.
- Completed verification:
  - RED: `mix test test/product_compare_web/graphql/catalog_queries_test.exs`
    failed with 5 expected feature failures because `ProductFiltersInput` did
    not expose `query` or `sort`.
  - GREEN: `mix test test/product_compare_web/graphql/catalog_queries_test.exs`
    - 31 tests, 0 failures.
  - RED: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    failed with 6 expected failures for missing URL parsing, controls, summary
    labels, and preserved search/sort links.
  - GREEN: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    - 52 tests, 0 failures.
  - Final: `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/catalog_filter_metadata_test.exs`
    - 34 tests, 0 failures.
  - Final: `cd assets && bun run relay` - completed with exit 0.
  - Final: `cd assets && bun run typecheck` - completed with exit 0.
  - Final: `git diff --check` - completed with exit 0.

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

## Completed Persistent Compare Tray Browse Support

- Status: done.
- Plan:
  `docs/plans/2026-07-01-persistent-compare-tray-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/catalog/paths.ts`
  - `assets/src/routes/catalog/filter-form.tsx`
  - `assets/src/routes/catalog/browse.tsx`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `docs/work/frontend-catalog-browse.md`
- Implemented:
  - `/products` now parses repeated `slug` params from the current URL and
    renders the shared selected-products tray when compare selections exist.
  - Browse card compare actions now add products in place by rewriting the
    current `/products` URL instead of jumping directly to `/compare`.
  - Product detail links, first/next pagination, filter GET submissions, and
    clear-filter links preserve selected compare slugs without preserving stale
    `after` cursors through filter submissions.
  - Off-page selected products use slug fallback labels; visible selected
    browse products use their route-loaded product names.
- Verification:
  - RED: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx -t "persistent compare tray|adds a browse product|preserves compare slugs|renders decision actions"` - failed as expected with 2 failed tests and 43 skipped because the tray was missing and card actions still linked directly to `/compare`.
  - GREEN: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx -t "persistent compare tray|adds a browse product|preserves compare slugs|renders decision actions"` - 2 passed, 43 skipped.
  - `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx` - 45 tests, 0 failures.
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx` - 163 tests, 0 failures.
  - `cd assets && bun run typecheck` - `tsc --noEmit` completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Completed Product-Facing Batch

- Status: done.
- Plan:
  `docs/plans/2026-07-02-catalog-product-card-spec-teasers-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`
  - `assets/src/routes/catalog/browse.tsx`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts`
  - `docs/work/frontend-catalog-browse.md`
- Verification:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/products` cards show bounded current-spec teasers without
  regressing filters, pagination, or compare-selection URL behavior.

### Catalog Product Card Spec Teasers Evidence

- Implemented:
  - `BrowseProductsRouteQuery` now requests product `currentAttributes` fields
    needed for browse-card specification teasers.
  - `/products` cards now render a `Specification highlights` list with at most
    three rows in Relay response order.
  - Cards with no current attributes omit the specification teaser list.
- Verification:
  - RED: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx -t "specification highlights|current specification"` failed with 2 expected failures because the query did not select `currentAttributes` and cards did not render a `Specification highlights` list.
  - GREEN: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx -t "specification highlights|current specification"` - 2 tests passed, 47 skipped.
  - Final: `cd assets && bun run relay` - completed with exit 0.
  - Final: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx` - 49 tests, 0 failures.
  - Final integration: `cd assets && bun run typecheck` - completed with exit 0.
  - Final: `git diff --check` - completed with exit 0.

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
- `assets/src/routes/catalog/browse.tsx` now renders URL-backed compare
  selections in the shared tray, uses route-local add links for browse cards,
  and preserves compare slugs through browse controls.
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

- Status: done.
- Plan:
  `docs/plans/2026-06-30-catalog-faceted-filtering-ui-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/catalog/filters.ts`
  - `assets/src/routes/catalog/paths.ts`
  - `assets/src/routes/catalog/queries/ProductFilterMetadataQuery.ts`
  - `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`
  - `assets/src/routes/catalog/loader.ts`
  - `assets/src/routes/catalog/browse.tsx`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `assets/schema.graphql`
  - `assets/src/__generated__/**`
  - `docs/work/frontend-catalog-browse.md`
- Verification:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `mix test test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`
  - `git diff --check`
- Exit condition: `/products` exposes metadata-backed filters, preserves active
  filter URLs through pagination, and clears back to the unfiltered browse page.
- Implemented:
  - Added route-local catalog filter URL parsing and path serialization for
    type, descendant, use-case, numeric, boolean, and enum filters.
  - `/products` now passes the parsed `ProductFiltersInput` to both
    `products(filters:)` and `productFilterMetadata(filters:)` through Relay.
  - Added a metadata-backed GET filter form that preserves page size, omits
    stale `after` cursors, and renders type, use-case, numeric, boolean, and
    enum controls from GraphQL metadata.
  - Added active filter summary rows, a `Clear filters` link, filtered empty
    copy, and filter-preserving first/next pagination links.
  - Refreshed `assets/schema.graphql` and generated Relay artifacts for
    `BrowseProductsRouteQuery` and `ProductFilterMetadataQuery`.
- Completed verification:
  - RED: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    failed with 2 expected loader failures because URL filter params were not
    passed as `filters` variables.
  - GREEN: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    - 28 tests, 0 failures after adding filter parsing and metadata preload.
  - RED: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    failed with 4 expected UI failures because the filter form, active summary,
    filter-preserving pagination links, and filtered empty copy were missing.
  - GREEN: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    - 32 tests, 0 failures after rendering metadata-backed controls.
  - Final: `cd assets && bun run relay` - completed with exit 0.
  - Final: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
    - 32 tests, 0 failures.
  - Final: `cd assets && bun run typecheck` - completed with exit 0.
  - Final: `mix test test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`
    - 23 tests, 0 failures.
  - Final: `git diff --check` - completed with exit 0.

## Completed Filter Metadata Dispatch

- Status: done.
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
- Implemented:
  - Added `ProductCompare.Catalog.product_filter_metadata/1` backed by a focused
    `ProductCompare.Catalog.FilterMetadata` query module.
  - The metadata contract returns display-safe result counts, type and use-case
    options, numeric ranges, boolean counts, enum option counts, selected state,
    and disabled zero-count options.
  - Facet counts and ranges reuse `ProductCompare.Catalog.Filtering` and omit
    only the facet group being counted, preserving selected-current-claim
    semantics.
  - GraphQL now exposes `productFilterMetadata(filters:)` using the existing
    `ProductFiltersInput` shape and Relay-safe IDs for taxons, attributes, and
    enum options.
  - Filter validation now rejects mismatched numeric, boolean, and enum
    attribute types/options plus numeric filters where `min` exceeds `max`.
- Completed verification:
  - RED: `mix test test/product_compare/catalog/filter_metadata_test.exs` failed
    with `ProductCompare.Catalog.product_filter_metadata/1 is undefined or
    private`.
  - RED: `mix test test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`
    failed because `productFilterMetadata` was not in the schema and invalid
    typed filters were accepted by `products(filters:)`.
  - GREEN: `mix test test/product_compare/catalog/filter_metadata_test.exs` - 1
    test, 0 failures.
  - GREEN: `mix test test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`
    - 23 tests, 0 failures.
  - `mix typecheck` - completed with exit 0.
  - Final: `mix test test/product_compare/catalog/filter_metadata_test.exs` -
    1 test, 0 failures.
  - Final: `mix test test/product_compare_web/graphql/catalog_filter_metadata_test.exs`
    - 2 tests, 0 failures.
  - Final: `mix test test/product_compare_web/graphql/catalog_queries_test.exs`
    - 21 tests, 0 failures.
  - Final: `mix typecheck` - completed with exit 0.
  - Final: `git diff --check` - completed with exit 0.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-catalog-browse.md`
- `sed -n '1,260p' docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- `sed -n '1,220p' assets/src/router.tsx`
- `sed -n '1,220p' assets/src/routes/root.tsx`
- `rg -n "field :products" lib/product_compare_web/schema.ex`
