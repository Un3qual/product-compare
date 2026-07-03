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

Updated: 2026-07-02

The 2026-06-29 usable-product batch is complete. It moved the shopper decision
loop forward across product browse cards, product detail actions, compare
selection, offer filter context, and saved-comparison return paths.

The first explicitly requested parallel batch from the product filtering and
in-depth comparison plan set is complete. Backend filter metadata/facets and
frontend compare matrix modes landed in separate commits with focused
verification.

The full product filtering and in-depth comparison plan set is complete.
Persistent Compare Tray work is complete through
`871fecb docs: record persistent compare tray verification`, and the compare,
catalog, and detail lane docs record the completed evidence.

The CJ read-model and weekly operator-runbook batch is complete. The merchant
identity quality read model, application readiness read model, and weekly
operator runbook landed on the current stack and have completion evidence in
`docs/work/product-data-scraping.md`.

The live queue is now a product-facing follow-up batch. These rows are
unblocked by existing frontend routes and GraphQL contracts, avoid CJ ingestion
surfaces, and keep backend/schema work out of scope unless a row explicitly
names it.

## Ready Work

### Parallel Batch: Product-Facing Follow-Up Rows

Batch rules:

- Workers start from `docs/work/index.md`, `docs/work/operating-model.md`,
  their row's lane work doc, and their row's active plan.
- Parallel workers may edit only their row's owned paths and the named evidence
  heading in the row's lane work doc.
- Do not implement another row's route, tests, generated artifacts, or evidence
  heading from the same worker branch.
- Do not add CJ ingestion behavior, scheduler behavior, browser auth REST
  endpoints, credential persistence, account-manager automation, Tier-3
  scraping, application submission, or CSV export paths.

#### Catalog Product Card Spec Teasers

Status: ready
Lane: Frontend catalog browse (`docs/work/frontend-catalog-browse.md`)
Active plan: `docs/plans/2026-07-02-catalog-product-card-spec-teasers-implementation-plan.md`
Next action: Add bounded current-specification teaser rows to `/products` cards using the existing `Product.currentAttributes` contract while preserving filter, pagination, and compare-selection URLs.
Owned paths:

- `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`
- `assets/src/routes/catalog/browse.tsx`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts`
- `docs/work/frontend-catalog-browse.md` under `### Catalog Product Card Spec Teasers Evidence` only
Verification:

- `cd assets && bun run relay`
- `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
Exit condition: `/products` cards show bounded current-spec teasers, empty-spec cards stay clean, and completion evidence is recorded only under `### Catalog Product Card Spec Teasers Evidence`.

#### Product Detail Offer Summary

Status: ready
Lane: Frontend product detail (`docs/work/frontend-product-detail.md`)
Active plan: `docs/plans/2026-07-02-product-detail-offer-summary-implementation-plan.md`
Next action: Add a compact active-offer summary to `/products/:slug` from fields already loaded by `ProductOffersRouteQuery` without changing backend schema, pricing resolvers, or offer pagination.
Owned paths:

- `assets/src/routes/products/detail.tsx`
- `assets/test/routes/products/detail.route.test.tsx`
- `docs/work/frontend-product-detail.md` under `### Product Detail Offer Summary Evidence` only
Verification:

- `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
Exit condition: `/products/:slug` summarizes the visible active-offer page without changing empty, unavailable, paginated, coupon, price-history, or compare-selection behavior.

#### Offer Discovery Sort And Highlights

Status: ready
Lane: Frontend offer discovery (`docs/work/frontend-offer-discovery-demo-parity.md`)
Active plan: `docs/plans/2026-07-02-offer-discovery-sort-and-highlights-implementation-plan.md`
Next action: Add route-local sort controls and page-local best-price highlighting to `/offers` without changing backend ordering, cursor semantics, or `merchantProducts(input:)`.
Owned paths:

- `assets/src/routes/offers/loader.ts`
- `assets/src/routes/offers/paths.ts`
- `assets/src/routes/offers/filters.tsx`
- `assets/src/routes/offers/index.tsx`
- `assets/test/routes/offers/offer-discovery-loader.test.ts`
- `assets/test/routes/offers/offer-discovery.route.test.tsx`
- `docs/work/frontend-offer-discovery-demo-parity.md` under `### Offer Discovery Sort And Highlights Evidence` only
Verification:

- `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
Exit condition: `/offers` preserves all existing filters and pagination while allowing loaded-page sort by default order, price, or merchant name, with completion evidence recorded under `### Offer Discovery Sort And Highlights Evidence`.

#### Saved Comparisons Sort Controls

Status: ready
Lane: Frontend saved comparisons (`docs/work/frontend-saved-comparisons-ui.md`)
Active plan: `docs/plans/2026-07-02-saved-comparisons-sort-controls-implementation-plan.md`
Next action: Add client-side sort controls for loaded `/compare/saved` rows while preserving filtering, reopen links, delete behavior, auth state, and empty/no-match return paths.
Owned paths:

- `assets/src/routes/compare/saved.tsx`
- `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- `assets/test/routes/compare/saved-comparisons-test-helpers.ts`
- `docs/work/frontend-saved-comparisons-ui.md` under `### Saved Comparisons Sort Controls Evidence` only
Verification:

- `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
Exit condition: `/compare/saved` can sort loaded saved sets by current order, name, and product count without changing backend saved-comparison contracts.

#### Merchant Directory Website Links

Status: ready
Lane: Frontend merchant discovery (`docs/work/frontend-merchant-discovery-demo-parity.md`)
Active plan: `docs/plans/2026-07-02-merchant-directory-website-links-implementation-plan.md`
Next action: Turn safe merchant domains on `/merchants` into explicit website links without adding merchant-only offer browsing, backend filters, GraphQL schema changes, or affiliate mutations.
Owned paths:

- `assets/src/routes/merchants/index.tsx`
- `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- `docs/work/frontend-merchant-discovery-demo-parity.md` under `### Merchant Directory Website Links Evidence` only
Verification:

- `cd assets && bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
Exit condition: `/merchants` renders safe external website links from current merchant data and leaves unsafe domains as non-link text.

## Just Completed

The CJ read-model and weekly operator-runbook batch is complete and no longer
live queue work. The lane evidence records final gates for:

- CJ candidate cohort.
- CJ candidate market coverage.
- CJ candidate freshness.
- CJ run health.
- CJ run throughput.
- CJ import artifact quality.
- CJ import price quality.
- CJ merchant identity quality.
- CJ application readiness.
- CJ weekly operator runbook.

The 2026-06-30 first product filtering and in-depth comparison parallel batch
and dependent catalog UI follow-up completed these work items:

- Backend filter metadata/facets: GraphQL now exposes
  `productFilterMetadata(filters:)` with display-safe counts, ranges, selected
  state, and typed filter validation using the existing `ProductFiltersInput`.
- Frontend product comparison: `/compare` now supports URL-backed
  `specs=shared|differences|all` matrix modes with mode-preserving add/remove
  links and explicit missing values.
- Frontend catalog browse: `/products` now renders metadata-backed faceted
  filters, preserves active filter URLs through pagination, and clears back to
  the unfiltered browse page.
- Compare attribute metadata: `Product.currentAttributes` now includes typed,
  ordered, groupable metadata used by product detail and compare rendering while
  preserving the `valueText` fallback contract.
- Compare offer decision helpers: `/compare` now renders a bounded, resilient
  decision summary for current price and offer quality using the existing
  `merchantProducts(input:)` pricing contract.

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
