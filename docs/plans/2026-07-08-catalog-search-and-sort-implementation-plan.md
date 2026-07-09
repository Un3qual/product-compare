# Catalog Search And Sort Implementation Plan

Goal: make `/products` easier to browse by adding URL-backed text search and
sort controls to the existing filtered catalog route.

Constraints and non-goals:

- Keep this product-facing; do not add ingestion, provider, eBay, dashboard, or
  operator surfaces.
- Reuse the existing `products` connection and `ProductFiltersInput` contract.
- Preserve existing faceted filters, page-size controls, pagination, and
  compare-selection URL behavior.
- Keep ordering deterministic for cursor pagination.

Owned paths:

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

Batches:

1. Add a normalized text query field to `ProductFiltersInput` and apply it in
   catalog filtering against product name, slug, model number, description, and
   brand name.
2. Add a deterministic product sort enum for default id order, product name,
   brand name, and newest product order.
3. Extend GraphQL catalog coverage for search, search plus existing filters,
   sort order, pagination stability, and invalid/blank search normalization.
4. Add `q` and `sort` URL parsing, path generation, filter summary labels, and
   form controls on `/products`.
5. Refresh the frontend schema and Relay artifacts, then update browse route
   coverage for search/sort preservation through filters, pagination, and
   compare-selection links.
6. Record completion evidence under
   `### Catalog Search And Sort Evidence`.

Verification:

- `mix test test/product_compare_web/graphql/catalog_queries_test.exs`
- `cd assets && bun run relay`
- `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Fallback:

- If backend text search needs database-specific full-text indexing, keep this
  batch on bounded `ilike` matching and record a later performance follow-up
  instead of adding migrations or search infrastructure here.
