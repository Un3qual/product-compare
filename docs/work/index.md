# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- If no `ready` row exists, do not scan historical plans looking for work.
- `needs_decision` rows are coordinator work: make one decision, then promote exactly
  one concrete `ready` row or one explicitly requested parallel batch of independent
  ready rows, remove the decision row so the selected `blocked` row becomes
  highest-ranked, or leave the missing decision named.
- `blocked` rows need external evidence or a product decision. Do not code around
  them.
- `active` rows are already owned by a named worker or branch. Do not start a
  second worker on them unless the coordinator reassigns the row.
- Completed lanes do not stay in this queue. Their history remains in the lane
  work doc and dated plan archive.

## Current Queue

Updated: 2026-06-30

The 2026-06-29 usable-product batch is complete. It moved the shopper decision
loop forward across product browse cards, product detail actions, compare
selection, offer filter context, and saved-comparison return paths.

The first explicitly requested parallel batch from the product filtering and
in-depth comparison plan set is complete. Backend filter metadata/facets and
frontend compare matrix modes landed in separate commits with focused
verification.

The next executable row is catalog faceted filtering UI. The deeper compare
attribute metadata and offer-helper rows remain sequenced behind this row
because they overlap Relay schema/generated artifacts and compare route files.

## Ready Work

### Catalog Faceted Filtering UI

- Status: ready
- Lane: Frontend catalog browse
- Work doc: `docs/work/frontend-catalog-browse.md`
- Active plan:
  `docs/plans/2026-06-30-catalog-faceted-filtering-ui-implementation-plan.md`
- Next action: wire `/products` to parse/share URL-backed product filters, load
  `products(filters:)` and `productFilterMetadata(filters:)`, render
  metadata-backed filter controls, preserve filters through pagination, and
  distinguish filtered empty states.
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
- Exit condition: a user can filter `/products` by metadata-backed type, use
  case, numeric, boolean, and enum controls, share the resulting URL, paginate
  without losing filters, and clear filters back to a clean browse page.

## Just Completed

The 2026-06-30 first product filtering and in-depth comparison parallel batch
completed these two work items:

- Backend filter metadata/facets: GraphQL now exposes
  `productFilterMetadata(filters:)` with display-safe counts, ranges, selected
  state, and typed filter validation using the existing `ProductFiltersInput`.
- Frontend product comparison: `/compare` now supports URL-backed
  `specs=shared|differences|all` matrix modes with mode-preserving add/remove
  links and explicit missing values.

The 2026-06-29 usable-product batch completed these five work items:

- Frontend catalog browse: `/products` product decision cards with stable
  detail, compare, and offer actions.
- Frontend product detail: `/products/:slug` next-action block for compare,
  offer review, and browse return.
- Frontend product comparison: `/compare` selected-product tray and add-another
  affordance.
- Frontend offer discovery: `/offers` active filter context, reset actions, and
  product-selection guidance.
- Frontend saved comparisons: `/compare/saved` card summaries, scoped actions,
  and empty/no-match return links.

The 2026-06-27 cross-project parallel batch completed these ten work items:

- Frontend catalog browse: `/products` page-size controls.
- Frontend product detail: `/products/:slug` active-offer pagination.
- Frontend offer discovery: visible `/offers` filters.
- Frontend merchant discovery: `/merchants` page-size controls.
- Frontend revenue reporting: deterministic date preset links.
- Frontend saved comparisons: client-side saved-set filtering.
- Frontend product comparison: compare-selection remove controls.
- Frontend API token management: create/rotate expiration presets.
- Frontend affiliate setup: selected merchant context summaries.
- Product data scraping: provider-neutral source-health read model.

## Retained Follow-Up Work

The product filtering and in-depth comparison plan set remains the primary
product-facing candidate pool if the next pass should improve user-visible
comparison quality. Backend filter metadata/facets and compare matrix modes are
complete. The retained rows are `/products` faceted filtering UI, compare
attribute metadata, and compare offer decision helpers.

The CJ read-model and weekly operator-runbook batch remains retained as the next
Product data scraping follow-up once the usable-product queue has moved. The
retained plans are listed in `docs/plans/INDEX.md` and
`docs/work/product-data-scraping.md`.

Application submission, account-manager contact, Tier-3 scraping, credential
persistence, and CSV export remain out of scope. CJ candidate CSV score export
is rejected and should not be promoted. eBay Browse fallback remains blocked on
CJ catalog-scope evidence.

## Executor Prompts

Coordinator:

```text
Start at docs/work/index.md.

Read docs/work/operating-model.md.
Process the highest-ranked non-ready row.
Make exactly one decision or unblock exactly one blocker.
Update only the live queue plus the directly affected lane or plan docs.
End with either one ready row or a clearly named blocker.
```

Worker:

```text
Start at docs/work/index.md.

Read docs/work/operating-model.md.
Execute only the highest-ranked row whose Status is ready.
Open only that row's Work Doc, linked active plan if any, Target Paths, and immediate tests.
Update the lane work doc as the batch changes.
Do not edit coordinator-owned docs unless the ready row names them as Target Paths.
Stop if the row is blocked, stale, or needs a decision.
```

## Completed Work

Completed lane summaries remain in their lane work docs under `docs/work/*.md`.
Dated implementation plans remain under `docs/plans/`. They are historical
reference unless this queue links one as the active plan for a `ready` row.
