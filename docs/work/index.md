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

The user claimed all four trust-surface rows on 2026-07-14 for serial execution
on `codex/trust-surface-data-contracts`. Share-comparison snapshot, product-
community, price-alert, and API-token route policy are complete with 11, 8,
15, and 55 focused tests. The coordinator replenished the ready floor with
three source-verified, non-overlapping route-policy data contracts backed by
22 affiliate, 51 offer-discovery, and 62 catalog tests.

After PR #98 merged on 2026-07-14, the coordinator validated product-detail
route policy as a fourth non-overlapping successor backed by 55 existing route
tests. Affiliate setup then completed on
`codex/route-policy-data-contracts`: merchant choice, summaries, and all four
mutation-variable shapes now live in a framework-free contract with 28 focused
tests. Before claiming the next row, the coordinator freshly validated the
compare picker as a fourth non-overlapping route-policy successor: its
deterministic pagination, accumulation, option, empty-state, and compare-path
policy is characterized by 109 passing route tests. Offer discovery then
completed on `codex/route-policy-data-contracts`: one framework-free owner now
provides filter types, defaults, ordered sort options, normalization, form
identity, summaries, and paths without changing route behavior. Its pure,
route, and loader suites passed 70 tests. Before claiming catalog browse, the
coordinator validated product-offer panel data as a substantive fourth
successor: its offer normalization, coupon and price-history rows, snapshot
inputs, and pagination policy remain embedded in the React panel, and the
existing product-detail suite passes 55 tests. Catalog browse then completed:
one framework-free contract now owns canonical browse paths, encoded product-
detail links, normalized compare selection, add/selected/full actions, and
ordered removal paths. Its pure and route suites passed 68 tests. Product
detail then completed: one framework-free contract now owns the canonical
detail tab, overview summaries, encoded paths, compare action, and ordered
selection removal while the route retains Relay, navigation, boundaries, and
presentation. Review follow-up removed a falsely configurable compare maximum
and reused the canonical shared limit; 67 focused tests pass. Compare picker,
product-offer panel data, and a newly validated external-destination safety
contract remain ready. The latter is a shared product-critical boundary used
by offers and merchant pages; its existing consumer suites pass 80 tests, but
the 410-line framework-free policy has no direct contract suite for public
HTTP(S), credential, hostname, port, or reserved-address behavior. Before
claiming Compare Picker, the coordinator also validated a non-overlapping
trust-surface date-presentation contract: merchant detail and public comparison
snapshots duplicate UTC date parsing and formatting around the existing shared
product formatter, and their two focused suites pass 8 tests. Compare Picker
then completed: one transport-neutral contract now owns reset identity, stable
page accumulation, selected-product exclusion, option/path construction,
cursor behavior, and empty copy while Relay timing, state/effects, boundaries,
and presentation remain in React. Its pure and route suites pass 116 tests,
and independent task review found no actionable issues. Before claiming Product
Offer Panel, the coordinator validated a fourth non-overlapping successor in
the shared product-attribute list: deterministic label normalization, case-
insensitive grouping, and stable group and attribute ordering are still
embedded in the StyleX presentation owner, while its product-detail and compare
consumers pass 164 tests. Product Offer Panel then completed: one transport-
neutral contract now owns visible offer normalization, coupon and price-history
rows, snapshot display values, and first/next pagination paths while React
retains error, empty, snapshot, list, pagination, accessibility, and tracked-
commerce presentation. Its pure and product-detail suites pass 59 tests, and
independent task review found no actionable issues. Before claiming External
Destination Safety, the coordinator validated a fourth non-overlapping
successor in the route metadata renderer:
deepest-match selection, loader-versus-handle precedence, and malformed-value
parsing remain embedded in the React head owner, whose integration suite passes
2 tests. External Destination Safety then completed with 140 direct cases and
139 unchanged consumer cases passing. Review follow-up closed raw/WHATWG
authority disagreement and replaced textual IPv6 checks with a dated numeric
registry policy whose longest-prefix rules preserve globally reachable
exceptions inside non-global parents. Independent re-review found no remaining
actionable issue, and the three other validated rows remain ready.

## Ready Work

### 1. Trust-Surface Date Presentation Contract

Status: ready
Lane: Frontend trust-surface date presentation
Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`
Next action: centralize UTC date-only and date-time text formatting for merchant
detail and public comparison snapshots in the framework-free product formatter
while preserving semantic `dateTime` values and malformed-value fallbacks.
Owned paths:

- `assets/src/routes/product-formatting.ts`
- `assets/src/routes/merchants/detail/MerchantDetailRoute.tsx`
- `assets/src/routes/compare/shared/SharedComparisonRoute.tsx`
- `assets/test/routes/product-formatting.test.ts`
- `assets/test/routes/merchants/merchant-detail.route.test.tsx`
- `assets/test/routes/compare/comparison-snapshots.test.tsx`
- `docs/work/frontend-trust-date-presentation.md`

Prerequisites:

- Existing merchant-detail and comparison-snapshot suites remain green.

Verification:

- `cd assets && bun x vitest run test/routes/product-formatting.test.ts test/routes/merchants/merchant-detail.route.test.tsx test/routes/compare/comparison-snapshots.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: one framework-free formatter owns stable UTC date-only and
date-time labels, offset normalization, and exact malformed-string fallback;
merchant and snapshot markup retain their original semantic `dateTime` values.

### 2. Product Attribute Grouping Data Contract

Status: ready
Lane: Frontend product attribute grouping
Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`
Next action: move deterministic product-attribute grouping out of the StyleX
list component into a framework-free data contract while preserving list and
section markup for product-detail and comparison consumers.
Owned paths:

- `assets/src/routes/products/product-attribute-list-data.ts`
- `assets/src/routes/products/ProductAttributeList.tsx`
- `assets/test/routes/products/product-attribute-list-data.test.ts`
- `docs/work/frontend-product-attribute-grouping.md`

Prerequisites:

- Existing product-detail and compare route characterizations remain green.

Verification:

- `cd assets && bun x vitest run test/routes/products/product-attribute-list-data.test.ts test/routes/products/detail.route.test.tsx test/routes/compare/compare.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: one framework-free owner preserves trimmed group labels,
case-insensitive first-label grouping, first-seen group order, stable attribute
order within groups, and original ungrouped order.

### 3. Route Metadata Resolution Data Contract

Status: ready
Lane: Frontend route metadata resolution
Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`
Next action: move deterministic route-match metadata selection and parsing out
of the React head renderer into a framework-free contract while preserving the
existing document-head markup.
Owned paths:

- `assets/src/routes/route-metadata-data.ts`
- `assets/src/routes/RouteMetadata.tsx`
- `assets/test/routes/route-metadata-data.test.ts`
- `docs/work/frontend-route-metadata-resolution.md`

Prerequisites:

- Existing Route Metadata integration characterization remains green.

Verification:

- `cd assets && bun x vitest run test/routes/route-metadata-data.test.ts test/routes/route-metadata.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: one framework-free owner preserves deepest-match precedence,
loader-data precedence over the same match's handle, handle fallback for
invalid loader metadata, required title and description strings, optional
string fields, and explicit-true indexability.

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
