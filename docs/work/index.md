# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- At least three complete `ready` implementation rows must exist at every stable
  dispatch boundary.
- Three is the replenishment floor, not a target or maximum. Promote every
  useful, currently validated candidate whose ownership and prerequisites make
  it executable.
- Before a claim would leave fewer than three other ready rows, the coordinator
  validates and promotes more work in the same dispatch update.
- Before removing completed or blocked work, preserve truthful lane evidence
  and ensure the committed queue still satisfies the floor.
- `needs_decision` rows are coordinator work: resolve the decision, then promote
  every useful source-backed candidate made executable by it.
- `blocked` rows need external evidence or a product decision. Do not code around
  them.
- Workers claim the highest-ranked compatible `ready` row only when three other
  ready rows will remain.
- Dependent, deferred, rejected, blocked, speculative, stale, and unverified
  work cannot be used as queue-depth filler.
- `active` rows are already owned by a named worker or branch. Do not start a
  second worker on them unless the coordinator reassigns the row.
- Completed lanes do not stay in this queue. Their history remains in the lane
  work doc and dated plan archive.

## Current Queue

Updated: 2026-07-11

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

The product-facing follow-up batch is complete. It used existing frontend
routes and GraphQL contracts, avoided CJ ingestion surfaces, and kept
backend/schema work out of scope.

The explicitly requested revenue readiness, shopper UX polish, and backend
quality parallel batch is complete. It added first-party tracked commerce
clicks, `/offers` visible merchant quick filters, and deterministic invalid
Relay connection page-size errors without reopening deferred eBay, ingestion
dashboard/operator, live provider, credential, application submission, Tier-3
scraping, or CSV export work.

The product-facing curation direction was selected on 2026-07-08. The next
batch stays on shopper-facing catalog and offer-discovery surfaces, avoids
deferred ingestion/eBay/operator work, and uses current app contracts as the
source of truth.

That product-facing curation batch is complete. Catalog search and sorting plus
offer-discovery product label context have green completion evidence in their
lane work docs dated 2026-07-09.

Shopper decision confidence was selected and completed on 2026-07-09. Catalog
result guidance, offer observation and coupon validity, product-detail price
observation, and the visible-page offer snapshot all have green completion
evidence in their lane docs.

On 2026-07-10, the user-reported GraphQL request-waterfall batch completed.
Comparison, product detail, and catalog now use one initial route-data request,
while saved comparisons and API tokens use explicit one-page-at-a-time cursor
navigation.

On 2026-07-10, the feature-complete product milestone finished the current
shopper journey: shopper-focused home content, viewer-aware navigation, a safe
relative loaded-price signal, ordered saved-comparison product labels, honest
revenue-preview positioning, and secret-safe CJ scheduled-readiness checks.
Email delivery, live conversion-provider ingestion, production privacy and
attribution controls, and production-readiness proof are explicitly outside
this milestone by product decision.

The 2026-07-11 bounded local-filter batch is complete. Compare now explains
that relative loaded price uses already-loaded offers, the compare picker can
filter already-loaded product names, and the merchant directory can filter the
visible Relay page without changing cursor behavior.

The 2026-07-11 route-foundation batch is complete. Unknown application paths
now render the shared not-found experience with an SSR 404 response, and every
registered route provides static title and description metadata for SSR and
client navigation.

## Ready Work

### 1. API Token Route Component Extraction

Status: ready
Lane: Frontend API token management demo parity
Plan: `docs/superpowers/plans/2026-07-11-next-frontend-batches.md`
Next action: Extract the API-token list and lifecycle presentation from the route owner without changing Relay or mutation behavior.
Owned paths:

- `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- `assets/src/routes/account/api-tokens/ApiTokenList.tsx`
- `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `docs/work/frontend-api-token-management-demo-parity.md`

Prerequisites:

- Existing API-token route behavior suite remains the characterization contract.

Verification:

- `cd assets && bun x vitest run test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: The route owner is smaller and the full API-token behavior suite remains green.

### 2. Offer Discovery Route Component Extraction

Status: ready
Lane: Frontend offer discovery demo parity
Plan: `docs/superpowers/plans/2026-07-11-next-frontend-batches.md`
Next action: Extract offer result cards, summaries, and pagination from the route owner without changing query, URL, or tracked-click behavior.
Owned paths:

- `assets/src/routes/offers/OfferDiscoveryRoute.tsx`
- `assets/src/routes/offers/OfferDiscoveryList.tsx`
- `assets/test/routes/offers/offer-discovery.route.test.tsx`
- `docs/work/frontend-offer-discovery-demo-parity.md`

Prerequisites:

- Existing offer-discovery route behavior suite remains the characterization contract.

Verification:

- `cd assets && bun x vitest run test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: The route owner is smaller and the full offer-discovery behavior suite remains green.

### 3. Product Detail Route Component Extraction

Status: ready
Lane: Frontend product detail
Plan: `docs/superpowers/plans/2026-07-11-next-frontend-batches.md`
Next action: Extract active-offer, coupon, and price-history presentation from the route owner without changing loader, tab, or tracked-click behavior.
Owned paths:

- `assets/src/routes/products/ProductDetailRoute.tsx`
- `assets/src/routes/products/ProductOfferPanel.tsx`
- `assets/test/routes/products/detail.route.test.tsx`
- `docs/work/frontend-product-detail.md`

Prerequisites:

- Existing product-detail route behavior suite remains the characterization contract.

Verification:

- `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: The route owner is smaller and the full product-detail behavior suite remains green.

### 4. Skip Navigation

Status: ready
Lane: Frontend Radix UI polish
Plan: `docs/superpowers/plans/2026-07-11-next-frontend-batches.md`
Next action: Add a keyboard-visible skip link and stable main-content target to the shared application shell.
Owned paths:

- `assets/src/ui/components/layout/AppShell.tsx`
- `assets/test/ui/app-shell.test.tsx`
- `docs/work/frontend-radix-ui-polish.md`

Prerequisites:

- No code prerequisite.

Verification:

- `cd assets && bun x vitest run test/ui/app-shell.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: Keyboard users can bypass primary navigation and focus the main content landmark.

### 5. Affiliate Setup Form Component Extraction

Status: ready
Lane: Frontend affiliate setup demo parity
Plan: `docs/superpowers/plans/2026-07-11-next-frontend-batches.md`
Next action: Extract the four affiliate setup form presentations from the route owner while preserving route-owned mutation orchestration.
Owned paths:

- `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- `assets/src/routes/affiliate/setup/AffiliateSetupForms.tsx`
- `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- `docs/work/frontend-affiliate-setup-demo-parity.md`

Prerequisites:

- Existing affiliate setup behavior suite remains the characterization contract.

Verification:

- `cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: Affiliate form rendering is isolated and all existing mutation behavior remains green.

### 6. Feed Candidate Review Component Extraction

Status: ready
Lane: Product data scraping
Plan: `docs/superpowers/plans/2026-07-11-next-frontend-batches.md`
Next action: Extract feed-candidate list and review presentation from the existing route without adding dashboard or ingestion behavior.
Owned paths:

- `assets/src/routes/ingestion/feed-candidates/FeedCandidatesRoute.tsx`
- `assets/src/routes/ingestion/feed-candidates/FeedCandidateReviewList.tsx`
- `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `docs/work/product-data-scraping.md`

Prerequisites:

- Existing feed-candidate route behavior and secret-safe field policy remain unchanged.

Verification:

- `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: Review presentation is isolated with all behavior and secret-safety coverage green.

## Active Work

None.

## Needs Decision Work

None. Shopper decision confidence was selected on 2026-07-09.

## Blocked Work

None.

## Just Completed

The 2026-07-11 task-first workspace follow-up is complete. Every registered
route now uses the appropriate workspace, detail, guided-flow, or focused-form
hierarchy; shared context, disclosure, tab, table, summary, and dialog patterns
remain Radix-backed; and the three unrelated ready rows remain available.

The 2026-07-11 frontend Radix UI polish milestone is complete. It established
Radix Themes and semantic brand tokens, reusable page/feedback/data/status/
pagination patterns, a responsive application shell, and calmer information
hierarchy across home, catalog, product detail, merchants, offers, comparison,
saved comparisons, operational workspaces, and every authentication route.
Independent review follow-up completed the reusable Radix text-field adoption,
compare tab panels, responsive data-list actions, neutral route errors, and
exact active navigation. Final verification passed Relay generation, all 630
frontend tests, frontend typechecking, client and SSR production builds, diff
hygiene, and `mix work_queue.validate` with three ready rows.

The 2026-07-10 feature-complete product milestone is complete. The home route
now leads with browse, compare, and offer review; navigation separates public,
guest, and authenticated destinations; compare identifies the lowest safe
already-loaded same-currency price; saved sets render ordered product names;
revenue reporting is explicitly a recorded-data preview; and the CJ readiness
gate can optionally enforce non-secret scheduler enablement while preserving
manual readiness. Email delivery, live conversion-provider ingestion,
production privacy and attribution controls, and production-readiness proof
were intentionally excluded from this milestone. The three ready rows above
are optional polish beyond this completion boundary. Final verification passed
Relay generation, all 617 frontend tests, frontend typechecking, client and SSR
production builds, all 634 backend tests, backend typechecking and formatting,
diff hygiene, and `mix work_queue.validate` with three ready rows.

The 2026-07-10 GraphQL request-waterfall batch is complete. `/compare` now
combines selected products, initial offer context, and picker data into one
request; product detail combines product and offer data; and catalog combines
products with filter metadata. Saved comparisons and API tokens now fetch one
cursor page per navigation with explicit first/next links instead of eagerly
following every cursor. Review follow-up removed synthetic compare-card reads,
made selected-product ordering defensive, and preserves usable product detail
when only nested offers fail. Relay generation, client and SSR production
builds, all 598 frontend tests, all 624 backend tests, backend type checks,
formatting, and diff checks passed. The lane doc records the request-site audit
and focused verification evidence.

The 2026-07-09 shopper decision-confidence batch completed catalog result
guidance: `/products` now shows the complete metadata-backed result count and
scoped active-filter removal links that preserve unrelated filters, page size,
and compare selections while dropping stale cursors. Focused verification
passed 58 tests plus TypeScript and diff checks.

The same batch completed offer observation and coupon validity context:
`/offers` now shows supported offer-check, latest-price observation, and coupon
expiration dates with semantic time markup while omitting missing or malformed
date claims. Relay generation, 46 focused tests, TypeScript, and diff checks
passed.

The same batch completed product-detail price observation context:
`/products/:slug` now shows supported latest-price observation dates while
leaving prices and existing offer behavior intact for missing or malformed
timestamps. Relay generation, 45 focused tests, TypeScript, and diff checks
passed.

The same batch completed the visible offer snapshot: `/offers` now summarizes
the safe, renderable page with visible counts and a single-currency lowest-price
signal, refuses mixed-currency comparisons, and omits the summary for empty or
unsafe-only pages. Focused verification passed 49 tests plus TypeScript and diff
checks.

The 2026-07-08 product-facing curation batch completed these work items:

- Catalog browse and backend catalog: `/products` now supports bounded text
  search and deterministic sorting through URL state while preserving filters,
  pagination, and compare selections.
- Offer discovery: `/offers` now shows selected-product name, optional brand,
  and detail navigation while preserving existing filter and offer behavior.
- Both lane work docs record green focused tests, Relay generation where
  applicable, TypeScript verification, and clean diff checks dated 2026-07-09.

The 2026-07-08 parallel execution batch completed these work items:

- Revenue readiness and shopper UX: product detail and `/offers` merchant
  actions now use a first-party `trackCommerceClick(input:)` GraphQL mutation
  that accepts only `merchantProductId`, resolves destinations server-side, and
  returns relative `/r/:click_id` redirect paths.
- Offer discovery UX: `/offers` now exposes visible merchant quick filters from
  loaded offer rows, preserves route-local filters, and drops stale cursors when
  applying a merchant filter.
- Backend quality: shared Relay connection pagination now rejects invalid
  `first` values with deterministic `invalid first` GraphQL errors while
  preserving default, clamp, `first: 0`, and malformed cursor behavior.

The 2026-07-03 product-facing follow-up batch completed these five work items:

- Frontend catalog browse: `/products` cards now show bounded current-spec
  teasers from the existing `Product.currentAttributes` contract.
- Frontend product detail: `/products/:slug` now summarizes the visible
  active-offer page with loaded-offer count, lowest visible price, coupon
  availability, and missing-price count.
- Frontend offer discovery: `/offers` now preserves route-local sort controls
  through filters and pagination and applies sort-specific labels to the first
  visible numeric price result.
- Frontend saved comparisons: `/compare/saved` now sorts loaded saved sets by
  current order, name, and product count while preserving filter, reopen, and
  delete behavior.
- Frontend merchant discovery: `/merchants` now renders safe merchant website
  links while leaving unsafe domains as text.

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
is rejected and should not be promoted. eBay Browse fallback is deferred by
product decision as of 2026-07-08 and should not be promoted until that decision
is reversed. Ingestion dashboard and operator surfaces are also deferred by
product decision as of 2026-07-08.

## Executor Prompts

Coordinator:

```text
Start at docs/work/index.md.

Read docs/work/operating-model.md.
Process the highest-ranked non-ready row when a decision or blocker exists.
Otherwise curate source-backed candidates from docs/plans/INDEX.md and the directly affected lane docs.
Before a stable boundary would leave fewer than three ready rows, validate new implementation candidates from current product, code, test, architecture, and lane evidence.
Three is the floor, not a cap; promote every additional useful validated row found in the same pass.
Validate every promoted row's owned paths, verification, prerequisites, and exit condition.
Update only the live queue plus the directly affected lane or plan docs.
End with at least three complete ready implementation rows and keep every additional useful validated row.
Run mix work_queue.validate before committing the dispatch update.
```

Worker:

```text
Start at docs/work/index.md.

Read docs/work/operating-model.md.
Claim the highest-ranked compatible ready row only when three other ready rows will remain.
Leave other ready rows unchanged.
Open only that row's Work Doc, linked active plan if any, Owned paths, and immediate tests.
Update the lane work doc as the batch changes.
Do not edit coordinator-owned docs unless the ready row names them under Owned paths.
Stop if the row is blocked, stale, or needs a decision.
If the claim guard is not satisfied, stop and hand off to the coordinator for replenishment.
```

## Completed Work

Completed lane summaries remain in their lane work docs under `docs/work/*.md`.
Dated implementation plans remain under `docs/plans/`. They are historical
reference unless this queue links one as the active plan for a `ready` row.
