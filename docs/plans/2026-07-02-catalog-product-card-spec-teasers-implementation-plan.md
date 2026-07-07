# Catalog Product Card Spec Teasers Implementation Plan

Goal: make `/products` cards more useful for shoppers by showing a bounded
preview of each product's current specifications.

Constraints and non-goals:

- Use the existing `Product.currentAttributes` GraphQL field.
- Do not add backend schema, resolver, database, or ingestion changes.
- Preserve current filter, pagination, and compare-selection URL behavior.
- Keep the card teaser bounded so browse pages do not become full detail pages.

Owned paths:

- `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`
- `assets/src/routes/catalog/browse.tsx`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts`
- `docs/work/frontend-catalog-browse.md`

Batches:

1. Extend `BrowseProductsRouteQuery` to request the current attribute fields
   needed for display: `code`, `displayName`, `valueText`, `sortOrder`, and
   `groupLabel`.
2. Update browse-card test fixtures to include products with zero, one, and
   more than three current attributes.
3. Render a `Specification highlights` list on each card with at most three
   rows, ordered by the Relay response order, and omit the list when no current
   attributes exist.
4. Preserve existing card actions, selected compare tray behavior, filter
   summaries, and pagination links.
5. Record completion evidence under
   `### Catalog Product Card Spec Teasers Evidence`.

Verification:

- `cd assets && bun run relay`
- `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Fallback:

- If Relay schema generation shows `Product.currentAttributes` is unavailable in
  the local schema snapshot, stop and record a blocker in the lane doc instead
  of adding backend schema work to this row.
