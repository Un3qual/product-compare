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

Updated: 2026-07-14

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

The 2026-07-11 API-token route decomposition is complete. Relay token-page
rendering and token lifecycle presentation now live in a focused component,
while the route owner retains loader and mutation orchestration.

The 2026-07-11 offer-discovery route decomposition is complete. Page-local
ordering, offer cards and summaries, merchant quick filters, tracked actions,
and pagination now live in a focused result component; the route owner retains
loader-state and Relay query orchestration.

The 2026-07-11 product-detail route decomposition is complete. Active-offer
normalization, snapshots, tracked actions, coupon and price-history summaries,
and pagination now live in a focused panel; the route owner retains Relay,
compare selection, and tab orchestration.

The 2026-07-11 follow-up batch is complete. The shared shell now supports skip
navigation, and saved-comparison, catalog-product-list, and revenue-summary
presentation live in focused sibling components while their route owners retain
data, mutation, URL, suspense, and error orchestration.

The requested eight-PR stack is complete. Its plan checklists and lane work
docs hold implementation and verification evidence; this index stays focused
on dispatchable work.

On 2026-07-13, the user selected the Product Trust and Discovery program:
canonical specification-rich ingestion, complete and fresh offer truth,
durable ingestion, price watches and alerts, public comparison snapshots,
source-backed recommendations, provenance and corrections, reviews and Q&A,
merchant detail pages, and SEO/acquisition surfaces. The dependency-ordered
program design is committed. Canonical GTIN identity is claimed first; three
independent foundation contracts are ready behind it, and the existing
validated presentation reserve remains available after those product-critical
rows.

Canonical GTIN identity completed on 2026-07-13. Validated GTIN-8, UPC-A,
EAN-13, and GTIN-14 values now resolve listings across sources and merchants to
one product, while invalid identifiers, conflicting updates to an attached
source listing, and replay fail closed. Specification provenance is the active
successor.

Specification provenance completed on 2026-07-13. Current attributes now carry
their accepted claim identity, status, source type, confidence, bounded
evidence excerpts, and the existing safe source-artifact view through batched
preloads. Complete offer truth is the active successor.

Complete offer truth completed on 2026-07-13. Price observations now expose
shipping, stock, and safe source provenance. Product-level truth considers
every active database offer, groups currencies independently, classifies
freshness, and selects a best offer only from complete in-stock landed prices.
Durable ingestion jobs completed on 2026-07-13. CJ feed discovery and product
imports now run as unique, database-backed Oban jobs with bounded retries,
redacted terminal/transient failure categories, enqueue-only timer schedulers,
and a safe operational-health read model. Complete-run offer reconciliation is
the next coordinator planning target.

Complete-run offer reconciliation completed on 2026-07-13. Every successfully
persisted listing now records run membership. Only an explicitly complete,
end-of-cursor, zero-failure run can deactivate historically observed offers
from the identical hashed scope; partial, failed, bounded, differently scoped,
and superseded runs fail closed. Fresh observations reactivate offers, and safe
health reads expose reconciliation status and counts without query values.
Specification-rich enrichment and media completed on 2026-07-13. The
source-neutral listing contract now accepts evidence-backed category, media,
and typed specification observations while isolating malformed optional data.
Imports fill only missing canonical copy, exact configured aliases may replace
only the generic ingestion type, unmapped paths remain review candidates, and
media and claims are replay-safe and retain artifact provenance. Authenticated
specification corrections completed on 2026-07-13. Typed user proposals are
owner-scoped and operator-moderated; acceptance atomically supersedes and
selects current truth, while duplicate pending proposals and stale-current
acceptance fail closed. Public product reads expose counts only, and private
moderation notes remain operator-only. Price watchlists and alerts completed
on 2026-07-13. Owner-scoped product and offer rules evaluate durably from
eligible same-currency landed prices, persist immutable observation facts and
transport-neutral delivery attempts, and suppress replay and premature repeat
events. Product detail now creates watches, and the authenticated inbox manages
unread events and active rules. Source-backed recommendations completed on
2026-07-13. Versioned profiles use only complete same-currency landed prices,
the best-value profile additionally requires accepted specification evidence,
and the comparison UI cites exact observations and claims or explains why it
cannot support a winner. Immutable comparison snapshots completed on
2026-07-13. Authenticated owners can publish two- or three-product captured
fact records behind 256-bit public tokens; links retain ordered product,
accepted specification, offer observation, and recommendation evidence, expose
no owner identity, and return 404 after one-way owner revocation. Reviews and
product Q&A completed on 2026-07-13. Reviews, questions, and answers require
authenticated attribution and operator publication; only published reviews
affect rating summaries, public author labels never reveal email, reporting and
accepted answers are durable, and merchant-offer association no longer claims
purchase verification. Merchant detail pages completed on 2026-07-13. Stable
canonical merchant slugs now lead to database-complete offer coverage and
freshness summaries, bounded current product listings, and safe merchant
destinations. SEO and acquisition surfaces completed on 2026-07-13. Product,
merchant, curated category, and explicitly opted-in comparison pages now share
one qualification policy, emit canonical SSR metadata and factual structured
data, and enter bounded partitioned sitemaps only when their accepted
specification, content, and current-offer evidence qualifies. Thin, stale,
parameterized, private, and revoked pages stay `noindex`; legacy product slugs
redirect permanently to their canonical page. The selected Product Trust and
Discovery program is complete.

On 2026-07-14, the four post-stack frontend contract rows completed on
`codex/frontend-view-contracts` in PR #97. Product-detail decision actions,
revenue-summary view data, specification-matrix data, and decision-summary
data now have focused boundaries and green lane evidence. The queue was
replenished in the same coordinator handoff with four source-verified,
non-overlapping trust-surface view-data contracts. Their existing snapshot,
community, alert, and API-token characterization suites passed 59 tests.

## Ready Work

### 1. Share Comparison Snapshot Data Contract

Status: ready
Lane: Frontend product comparison
Plan: `docs/superpowers/plans/2026-07-14-trust-surface-view-data-contracts.md`
Next action: extract framework-free publish-input, snapshot merge, and label
policy while preserving Relay mutations and reads, form events, local state,
paging, feedback, links, and revoke actions.
Owned paths:

- `assets/src/routes/compare/share-comparison-data.ts`
- `assets/src/routes/compare/ShareComparisonControl.tsx`
- `assets/test/routes/compare/share-comparison-data.test.ts`
- `assets/test/routes/compare/comparison-snapshots.test.tsx`
- `docs/work/frontend-product-comparison-demo-parity.md`

Prerequisites:

- Existing 6-test comparison-snapshot characterization remains green.

Verification:

- `cd assets && bun x vitest run test/routes/compare/share-comparison-data.test.ts test/routes/compare/comparison-snapshots.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: Pure snapshot policy preserves ordered product IDs, profile
mapping, title/search opt-in behavior, first-occurrence deduplication, revoked
items, labels, and pagination order.

### 2. Product Community Data Contract

Status: ready
Lane: Frontend product detail
Plan: `docs/superpowers/plans/2026-07-14-trust-surface-view-data-contracts.md`
Next action: extract framework-free review/question input, summary, accepted-
answer, cursor, and page-merge policy while preserving Relay operations,
moderation feedback, forms, paging state, suspense, and presentation.
Owned paths:

- `assets/src/routes/products/product-community-data.ts`
- `assets/src/routes/products/ProductCommunityPanel.tsx`
- `assets/test/routes/products/product-community-data.test.ts`
- `assets/test/routes/products/product-community-panel.test.tsx`
- `docs/work/frontend-product-detail.md`

Prerequisites:

- Existing 2-test product-community characterization remains green.

Verification:

- `cd assets && bun x vitest run test/routes/products/product-community-data.test.ts test/routes/products/product-community-panel.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: Pure community policy preserves trimmed inputs, rating values,
summary copy, accepted-answer labels, page cursors, and first-occurrence item
ordering.

### 3. Price Alert View-Data Contract

Status: ready
Lane: Product trust and discovery
Plan: `docs/superpowers/plans/2026-07-14-trust-surface-view-data-contracts.md`
Next action: extract framework-free active/paused watch grouping and rule,
watch, and observation labels while preserving loader reads, mutations,
revalidation, pending/error state, links, and list presentation.
Owned paths:

- `assets/src/routes/account/alerts/alerts-view-data.ts`
- `assets/src/routes/account/alerts/AlertsRoute.tsx`
- `assets/test/routes/account/alerts/alerts-view-data.test.ts`
- `assets/test/routes/account/alerts/alerts.route.test.tsx`
- `docs/work/product-trust-and-discovery.md`

Prerequisites:

- Existing 6-test alert and watch characterization remains green.

Verification:

- `cd assets && bun x vitest run test/routes/account/alerts/alerts-view-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: Pure alert view data preserves stable grouping, every known
rule label, missing-value copy, malformed-date behavior, and unknown-rule
fallbacks.

### 4. API Token Route Data Contract

Status: ready
Lane: Frontend API-token management
Plan: `docs/superpowers/plans/2026-07-14-trust-surface-view-data-contracts.md`
Next action: extract framework-free route identity, pagination, form-variable,
mutation-summary, rotation, and local/server view-state policy while retaining
Relay mutations, in-flight guards, one-time-secret lifecycle, errors,
boundaries, and presentation.
Owned paths:

- `assets/src/routes/account/api-tokens/api-token-route-data.ts`
- `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- `assets/test/routes/account/api-tokens/api-token-route-data.test.ts`
- `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `docs/work/frontend-api-token-management-demo-parity.md`

Prerequisites:

- Existing 45-test API-token route characterization remains green.

Verification:

- `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: Pure route data preserves auth/location identity, cursor paths,
expiry semantics, mutation nullability, rotation state, deduplication, and
local/server token precedence.

## Needs Decision Work

None. Shopper decision confidence was selected on 2026-07-09.

## Blocked Work

None.

## Just Completed

The 2026-07-12 control-and-matrix batch is complete. API-token controls,
comparison matrix presentation, catalog advanced filters, and per-offer
discovery cards now live behind focused typed boundaries. Review follow-up
replaced modal-hidden accessibility queries, concatenated table text
assertions, and duplicate widened offer fixtures with semantic queries and
production-owned type contracts. The four focused suites passed 251 tests;
TypeScript and diff hygiene were green.

The 2026-07-11 four-row follow-up completed skip navigation plus the saved-set,
catalog product-list, and revenue-summary presentation extractions. Focused
verification passed 2 shell tests, 29 saved-comparison tests, 58 catalog tests,
and 16 revenue tests with TypeScript and diff hygiene green at each milestone.
The finished rows were replaced by four newly validated, non-overlapping
implementation rows grounded in current API-token, comparison-matrix,
catalog-filter, and offer-card code and 245 passing characterization tests.

The 2026-07-11 feed-candidate review extraction is complete. `FeedCandidateReviewList`
now owns review presentation while the route retains Relay/revalidation and draft
orchestration; the focused suite passed 17 tests, TypeScript typechecking passed,
the secret/raw-field scan found no matches, and `git diff --check` was clean.

The 2026-07-11 affiliate setup form extraction is complete. `AffiliateNetworkForm`,
`AffiliateProgramForm`, `AffiliateLinkForm`, and `AffiliateCouponForm` now own
presentation while the route retains mutation orchestration; the focused suite
passed 19 tests, TypeScript typechecking passed, and `git diff --check` was clean.

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
