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
- A queue row is one independently shippable and reviewable outcome. Per-file,
  per-route, path-disjoint, or test-sized implementation steps belong under
  internal slices in the linked plan and lane doc.
- Group candidates that enforce the same invariant and share one acceptance
  boundary. Parallel safety alone does not justify separate queue rows.
- Numeric batch requests and the ready-row floor never justify micro-batches or
  filler. Return fewer coherent batches and record the missing decision when
  the repository does not support the requested count.
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

Updated: 2026-07-23

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
actionable issue, and the three other validated rows remain ready. Before
claiming Trust-Surface Date Presentation, the coordinator validated saved-
comparison navigation as a fourth non-overlapping successor: ordered reopen
links and first/next cursor paths remain embedded in the Relay route owner,
whose current route-state suite passes 31 tests. Trust-Surface Date
Presentation then completed: one framework-free formatter now owns UTC date-
only and date-time labels, offset normalization, and exact malformed-source
fallbacks while merchant and snapshot markup retain their source `dateTime`
values. Its direct and consumer suites pass 15 tests; review follow-up routes
all string inputs through the existing strict GraphQL DateTime validator so
impossible calendar dates and timestamps without offsets fail closed. The full
frontend gate passes 71 files and 995 tests. Independent re-review found no
remaining actionable issue. The three other validated rows remain ready.
Before claiming Product Attribute Grouping, the coordinator validated API-
token lifecycle display data as a fourth non-overlapping successor: UTC display
labels, optional-date fallbacks, and status copy remain embedded in the React
item owner, while its existing route-data and route suites pass 55 tests.
Product Attribute Grouping then completed: one framework-free owner now trims
and case-folds group labels, retains the first display label, and preserves
first-seen group, grouped-attribute, and ungrouped-tail ordering while React
retains all markup and styling. Its pure and consumer suites pass 169 tests,
and the full frontend gate passes 72 files and 1,000 tests. Independent review
found no actionable behavior, mutation, compatibility, performance, test, or
queue issue. The three other validated rows remain ready.
Before claiming Route Metadata Resolution, the coordinator validated catalog
specification-highlight selection as a fourth non-overlapping successor:
bounded ordering by explicit sort order, unspecified-order placement, and
stable source ordering remain embedded in the StyleX product-list owner, while
its existing catalog route suite passes 62 tests.
Route Metadata Resolution then completed: one framework-free owner now selects
the deepest valid match, prefers loader data over the same match's handle,
falls back from invalid loader metadata, and parses required, optional, and
indexability fields while React retains router access and all head markup. Its
direct and integration suites pass 9 tests. Independent review confirmed the
production extraction and identified missing regression coverage for skipping
a fully invalid deepest match; that case is now covered, and the refreshed full
frontend gate passes 73 files and 1,007 tests. Independent re-review found no
remaining actionable issue. The three other validated rows remain ready.
Before claiming Saved Comparison Navigation, the coordinator validated
recommendation-profile route data as a fourth non-overlapping successor:
profile parsing, profile-link construction, and profile-only loader
revalidation remain split between the compare loader and React panel, while
the current recommendation and snapshot suites pass 11 tests. Snapshot publish
input and its GraphQL profile mapping remain owned by the completed snapshot
data contract and are outside this successor.
Saved Comparison Navigation then completed: one framework-free owner now
builds ordered encoded reopen paths and first/next pagination paths while the
route retains Relay query retention, deletion, local state, boundaries, links,
and presentation. Task review caught that the extracted contract relied on the
loader to reject non-advancing cursors; the contract now enforces that invariant
directly. Its pure and route-state suites pass 43 tests, the full frontend gate
passes 74 files and 1,019 tests, and task re-review is approved. Final review
added direct coverage for `hasNextPage: false`. The three other validated rows
remain ready. Final whole-batch re-review confirmed the narrowed recommendation
successor is executable within its owned paths and found no remaining issue.

After PR #99 merged on 2026-07-15, the coordinator validated saved-comparison
naming as a fourth non-overlapping successor. Deterministic default, single-
product, and ordered multi-product naming remains embedded in `CompareRoute`,
while its existing route suite passes 109 tests. API-token lifecycle display
then completed: the framework-free route-data owner now returns stable labels,
strict offset-aware UTC lifecycle dates, exact invalid-string fallbacks, and
revoked/active/expired status copy while React retains semantic markup, tone,
presets, errors, and lifecycle actions. Its focused suites pass 63 tests. The
three other validated rows remain ready.

Before claiming Catalog Specification Highlights, the coordinator validated
two useful non-overlapping successors. Merchant visible-page filter
normalization, selection, and heading copy remain embedded in its React owner,
whose route suite passes 27 tests. Price-watch amount-rule selection and input
normalization remain embedded in `PriceWatchControl`; its focused suite passes
6 tests while the product-detail host route suite passes 55 tests. Both have
complete owned paths and no blockers, so all useful validated candidates were
promoted before the claim.

Catalog Specification Highlights then completed: one framework-free selector
now returns at most three rows by ascending finite sort order, places nullish
and unusable orders last, preserves source order for ties, and leaves the Relay
input unchanged while React retains all card markup, actions, omission, and
StyleX presentation. Task review strengthened regression coverage for finite
numeric extremes, non-finite orders, and deep input immutability; re-review
found no remaining code or test-quality issue. Its focused suites pass 69
tests. Four other validated rows remain ready.

Recommendation Profile Route Data then completed: one framework-free owner now
parses the exact best-value profile, builds ordered encoded profile paths with
specification-mode and default-query handling, and suppresses core comparison
reloads only for a raw recommendation-parameter-only change. React retains
location access, Relay reads and variables, reset/error/Suspense boundaries,
snapshot behavior, and markup; `share-comparison-data.ts` remains the owner of
snapshot publish input and GraphQL profile mapping. Task review strengthened
unrelated-change coverage to prove both router-default values propagate;
re-review found no remaining issue. Its focused suites pass 34 tests. Three
other validated rows remain ready.

Before claiming Saved Comparison Naming, the coordinator validated a fourth
non-overlapping successor. Candidate scoring, reasons, review status/count
labels, reviewed-time formatting, and filter-preserving pagination paths remain
embedded in the 409-line `FeedCandidateReviewList`, whose route suite passes 17
tests. The successor has complete owned paths, no blockers, and does not overlap
saved comparisons, merchant filtering, or price-watch input.

Saved Comparison Naming then completed: one zero-import framework-free owner
now trims product names, omits blanks, preserves caller order and duplicates,
and returns the existing fallback, singular, and multi-product copy without
mutating its input. `CompareRoute` retains the ready-state and in-flight guards,
save request identity, ordered product IDs, mutation callbacks and errors,
feedback, Relay data, and markup. Its pure and route suites pass 117 tests, and
independent task review found no actionable issue. Three other validated rows
remain ready.

Before claiming Merchant Directory Visible-Page Filter Data, the coordinator
validated a fourth non-overlapping successor. Normal click activation,
first-party tracking href construction, and same-origin redirect resolution
remain embedded in `TrackedCommerceClickAction`; its offer-discovery route
suite passes 51 tests. The successor has complete owned paths, no blockers, and
does not overlap merchant filtering, price-watch input, or feed-candidate review
data.

Merchant Directory Visible-Page Filter Data then completed: one framework-free
owner now returns normalized filter text, case-insensitively selected merchants
in source order, and the existing filtered or unfiltered heading without
mutating its input. `MerchantDirectoryView` retains local state, page
boundaries, empty/no-match presentation, merchant markup and safe links, and
cursor pagination. Its pure and route suites pass 31 tests, and independent
task review found no actionable issue. Three other validated rows remain ready.

Before claiming Price-Watch Input Data, the coordinator validated a fourth
non-overlapping successor. API-token and saved-comparison route owners duplicate
the same immutable set add/remove policy, while the token owner also embeds
map upsert/remove policy; their route suites pass 45 and 31 tests. The successor
has complete owned paths, no blockers, and does not overlap price watches,
feed-candidate review, or tracked-commerce clicks.

Price-Watch Input Data then completed: one framework-free owner now identifies
the amount-bearing rules and builds the existing create-watch input from
trimmed amounts and uppercased trimmed currency while omitting amount fields for
availability rules. `PriceWatchControl` retains product-keyed reset, FormData
and event handling, local state, validation, Relay mutation behavior, feedback,
and markup. Its pure and route suites pass 16 tests; task review found no
Critical or Important issue, and the lane-status closeout resolves its sole
Minor note. Three other validated rows remain ready.

Before claiming Feed-Candidate Review View Data, the coordinator validated a
fourth non-overlapping successor. Catalog type-filter initialization and
transitions plus advanced-filter disclosure policy remain embedded in
`CatalogFilterForm`; its browse route suite passes 62 tests. The successor has
complete owned paths, no blockers, and does not overlap feed-candidate review,
tracked-commerce clicks, or immutable route-state collections.

Feed-Candidate Review View Data then completed: one framework-free owner now
provides candidate names, product-count copy, fit scores and ordered reasons,
review status labels, tones and current-page counts, valid-only reviewed times,
and filter-preserving first/next paths. React and Relay owners retain query and
mutation orchestration, draft notes, callbacks, controls, markup, and styling.
Its pure and route suites pass 24 tests. Three other validated rows remain
ready.

Before claiming Tracked-Commerce Click Data, the coordinator validated a
fourth non-overlapping successor. Feed-candidate review mutation-input and
draft-removal policy remain embedded in `FeedCandidatesRoute`; its existing
route suite passes 17 tests. The successor has complete owned paths, no
blockers, and does not overlap tracked-commerce clicks, immutable route-state
collections, or catalog filter-form state.

Tracked-Commerce Click Data then completed: one framework-free owner now
qualifies normal unmodified primary clicks, builds the encoded first-party
merchant-product href, and rejects redirects outside the exact GraphQL API
origin. `TrackedCommerceClickAction` retains React event handling, pending and
error state, Relay mutation orchestration, browser navigation, accessibility,
markup, and styling. The React owner now passes its resolved API endpoint into
the dependency-free contract explicitly. Its pure and route suites pass 57
tests; independent review approved the exact scheme, host, and port boundary
after focused coverage and dependency-boundary follow-up. Final branch review
then exposed the asynchronous rejection path: the route now turns redirect
resolution or navigation failures into existing default error feedback, and
the combined suites pass 58 tests. Three other validated rows remain ready.

Before claiming Immutable Route-State Collection, the coordinator validated a
fourth non-overlapping successor. Product, status, merchant/domain, latest-
price, nullable connection, and ordered price-history view policy remain
embedded in `OfferDiscoveryCard`; the existing offer-discovery route suite
passes 51 tests. The successor has complete owned paths, no blockers, and does
not overlap immutable route state, catalog filter-form state, or feed-candidate
review mutation data.

Immutable Route-State Collection then completed: one framework-free owner now
provides copy-on-write map upsert/remove and set add/remove behavior with exact
identity and iteration-order semantics. API-token and saved-comparison routes
retain their React state transitions, functional setters, Relay orchestration,
errors, feedback, and presentation. The pure and route suites pass 84 tests,
TypeScript and dependency-boundary checks pass, and independent task review
found no actionable issue. Three other validated rows remain ready.

Before claiming the three remaining ready contracts, the coordinator validated
four non-overlapping successors from current source and behavior. Category
landing composition, alert mutation inputs/outcomes, recommendation result
presentation, and shared route-error classification remain embedded in their
React owners without an existing pure contract. Their five characterization
suites pass 138 tests. All four successors have complete, mutually disjoint
owned paths and do not overlap catalog filter-form state, feed-candidate review
mutation data, or offer-discovery card view data.

The three claimed contracts then completed in parallel. Catalog filter-form
state now has one framework-free owner for initialization, type transitions,
and initial advanced disclosure. Feed-candidate review mutation data now owns
own-property draft selection, trimmed mutation input, and immutable successful-
draft removal. Offer-discovery card data now owns its deterministic labels,
nullable connection fallbacks, and ordered valid price-history rows while the
React owner retains safe/tracked actions and presentation. Their pure and route
suites pass 172 tests; TypeScript and all dependency/sensitive-field scans pass.
Independent task reviews approved feed and offer data directly, and approved
catalog state after explicit runtime-null coverage was added. Four validated
rows remain ready.

Category landing completed on
`codex/category-alert-recommendation-contracts`. Before alerts was claimed, the
coordinator validated and promoted comparison-snapshot mutation data, catalog
advanced-filter view data, and root destination policy as three mutually
disjoint successors. Their existing snapshot, catalog, and root suites pass 82
tests. Alerts mutation and recommendation result then completed serially on the
same branch. Framework-free owners now provide category copy, rows, and paths,
exact alert mutation variables and outcome policy, and recommendation winner,
reason, and evidence projection. Their focused suites pass 8, 16, and 13 tests;
all three independent task reviews found no actionable issues. The shared
route-error contract then completed on the same branch. One framework-free
owner now preserves response-status, network, unexpected-error, and default
copy while React Router retains raw error detection and presentation. Its pure,
compare, and router suites pass 138 tests. The three promoted successors remain
ready.

Before claiming Shared Comparison Mutation Data, the coordinator validated a
fourth non-overlapping successor. Exact create-saved-set variables and
structural completion policy remain embedded in `CompareRoute`, while the
existing naming policy stays independently owned and the save-feedback plus
compare route suites pass 116 tests. The successor has complete owned paths,
no blockers, and does not overlap snapshot sharing, catalog advanced filters,
or root destinations.

Shared Comparison Mutation Data then completed: the existing framework-free
sharing owner now builds publish/revoke variables, projects mutation payloads
and source nodes, and returns immutable publish/revoke state with exact success
copy. React retains forms, Relay lifecycle, pagination, errors, callbacks,
markup, and styling. Focused verification is recorded in the lane work doc;
the three other validated rows remain ready.

Before claiming Catalog Advanced-Filter View Data, the coordinator validated a
fourth non-overlapping successor. Credential success interpretation is
duplicated across API-token creation and rotation, with adjacent revoke outcome
policy still embedded in `ApiTokensRoute`. The existing framework-free owner
already projects mutation tokens and builds create/rotate variables, and its
focused suites pass 64 tests. The successor has complete owned paths, no
blockers, and does not overlap catalog filters, root destinations, or compare
saved-set mutation data.

Catalog Advanced-Filter View Data then completed: one framework-free owner now
returns source-ordered use-case, numeric, boolean, and enum rows with exact
selection precedence, metadata fallbacks, stable field identities, and
selected-disabled behavior. React retains semantic fieldsets, labels, native
controls, `TextField`, accessibility, uncontrolled defaults, and presentation.
Its pure and browse suites pass 67 tests; the three other validated rows remain
ready.

Root Destination Policy Data then completed: one framework-free owner now
returns exact ordered public, shopper, authenticated, operator, secondary-
public, and auth groups for guest, member, and operator viewers. React retains
active-path matching, NavLink/Button composition, semantic navigation,
accessibility, variants, and StyleX. Its pure and root suites pass 20 tests
after the `48771a58` auth-link presentation follow-up, and the three validated
successor rows remain ready.

Compare Saved-Set Mutation Data then completed: one framework-free owner now
composes the existing naming policy into exact ordered create input and
classifies structural completion with the existing shared route-error policy.
React retains every Relay, ready and in-flight, request identity, stale-
completion, callback, feedback, query-read, markup, and presentation
responsibility. Its pure, save-feedback, and compare route suites pass 124
tests; the three validated successor rows remain ready.

Before claiming API-Token Mutation Outcome Data, the coordinator validated a
fourth non-overlapping successor. Review, question, and answer completion copy
and shared-error interpretation remain embedded in `ProductCommunityPanel`,
while its existing framework-free owner already owns the corresponding input
policy. The pure and panel suites pass eight tests; the successor has complete
owned paths, no blockers, and does not overlap API tokens, merchant detail, or
saved-comparison deletion.

API-Token Mutation Outcome Data then completed: the existing framework-free
route-data owner now builds exact revoke variables and classifies structural
create, rotate, and revoke completion with existing token projection and
shared route-error policy. React retains FormData, Relay, pending and
concurrency guards, one-time-secret state, optimistic updates, dialogs,
callbacks, markup, and styling. Its pure and route suites pass 76 tests;
independent task review found no issues, and the three validated successor rows
remain ready.

Before claiming Merchant Detail View-Data, the coordinator validated a fourth
non-overlapping successor. Network, program, link, and coupon structural
completion policy remains embedded in `AffiliateSetupRoute`, while the existing
framework-free setup-data owner already builds all four mutation inputs. Its
pure and route suites pass 28 tests; the successor has complete owned paths, no
blockers, and does not overlap merchant detail, saved-comparison deletion, or
product community mutations.

Merchant Detail View-Data then completed: one framework-free owner now returns
the exact ordered coverage summary, observation and freshness copy, source-
ordered offer rows, complete price/shipping/stock fallbacks, encoded product
paths, and conditional pagination paths. React retains Relay, safe external
website resolution, date formatting, semantic links and time markup, feedback
states, and StyleX. Its pure and route suites pass eight tests; task re-review
found no issues after explicit generated-Relay `undefined` coverage, and the
three validated successor rows remain ready.

Before claiming Saved-Comparison Delete Mutation Data, the coordinator
validated a fourth non-overlapping successor. Publish and revoke structural
completion and shared-error interpretation remain embedded in
`ShareComparisonControl`, while the existing framework-free owner already
builds inputs and variables, projects snapshots, and owns immutable snapshot
state. Its pure and control suites pass 17 tests; the successor has complete
owned paths, no blockers, and does not overlap saved-comparison deletion,
product community mutations, or affiliate setup mutations.

Saved-Comparison Delete Mutation Data then completed: one framework-free owner
now builds the exact delete variables and returns the structurally deleted ID
or existing shared route error. React retains row-scoped in-flight protection,
Relay commits and callbacks, pending and deleted state, cleanup, feedback,
query retention, markup, and styling. Its pure and route-state suites pass 41
tests; task re-review found no issues after explicit omitted, empty, and null-ID
generated-payload coverage, and the three validated successor rows remain
ready.

Before claiming Product Community Mutation Outcome Data, the coordinator
validated a fourth non-overlapping successor. Price-watch structural completion
and shared-error interpretation remain embedded in `PriceWatchControl`, while
the existing framework-free owner already identifies amount-bearing rules and
builds the create input. Its pure and alerts-route suites pass 16 tests; the
successor has complete owned paths, no blockers, and does not overlap product
community, affiliate setup, or comparison sharing mutations.

Product Community Mutation Outcome Data then completed: the existing
framework-free owner now returns exact review, question, and answer moderation
success copy or the shared route error while preserving fact-first completion
semantics. React retains FormData, Relay mutation promises, pending state,
authored-text adaptation, feedback placement, pagination, markup, and styling.
Its pure and panel suites pass 14 tests; the three validated successor rows
remain ready.

Before claiming Affiliate Setup Mutation Outcome Data, the coordinator
validated a fourth non-overlapping successor. Tracked-commerce click completion
still combines structural redirect success, payload and top-level error checks,
same-origin resolution, browser navigation, and feedback inside
`TrackedCommerceClickAction`, while its existing framework-free owner already
owns click qualification and redirect URL policy. Its pure and offer-discovery
suites pass 58 tests; the successor has complete owned paths, no blockers, and
does not overlap affiliate setup, comparison sharing, or price-watch mutations.

Affiliate Setup Mutation Outcome Data then completed: the existing
framework-free owner now returns each original complete network, program, link,
or coupon fact or the shared route error without mutating inputs. Top-level
GraphQL errors retain precedence, while payload errors may coexist with a
complete fact as before. React retains FormData adaptation, Relay mutation
promises, in-flight and pending guards, selected state, feedback placement,
markup, and presentation. Its pure and route suites pass 37 tests; the three
validated successor rows remain ready.

Before claiming Share-Comparison Mutation Outcome Data, the coordinator
validated a fourth non-overlapping successor. Reset-password token
normalization, missing-token state, mutation-variable construction, exact
success copy, and stale-response eligibility remain embedded in
`ResetPasswordRoute`, while the existing auth error owner already normalizes
mutation outcomes. Its auth-error and recovery-route suites pass 20 tests; the
successor has complete owned paths, no blockers, does not reopen deferred email
delivery, and does not overlap comparison sharing, price-watch, or tracked-
commerce mutations.

Share-Comparison Mutation Outcome Data then completed: the existing
framework-free owner now returns a projected complete published snapshot or the
original revoked snapshot, otherwise the shared route error, without mutating
inputs. Complete facts retain precedence when payload or top-level GraphQL
errors coexist. React retains FormData and location adaptation, Relay mutation
promises, hooks, state and callbacks, snapshot paging, markup, and styling. Its
pure and snapshot-control suites pass 30 tests; the three validated successor
rows remain ready.

Before claiming Price-Watch Mutation Outcome Data, the coordinator validated a
fourth non-overlapping successor. Captured recommendation selection, fallback
copy, product and offer fact projection, and the ordered live-comparison path
remain embedded in `SharedComparisonRoute`; its existing snapshot route suite
passes 6 tests. The successor has complete owned paths, no blockers, and does
not overlap price-watch, tracked-commerce, or reset-password request data.

Price-Watch Mutation Outcome Data then completed: the existing framework-free
owner now returns the exact create-watch success or shared-error copy without
mutating payload or GraphQL error inputs. A complete watch retains precedence
when payload or top-level errors coexist. React retains FormData, Relay
mutation promises, product-keyed reset, rule and pending state, feedback,
markup, and presentation. Its pure and alerts-route suites pass 22 tests; the
three validated successor rows remain ready.

Before claiming Tracked-Commerce Click Mutation Outcome Data, the coordinator
validated a fourth non-overlapping successor. Compare-picker filter
normalization, case-insensitive visible-option selection, source ordering, and
exact no-match copy remain embedded in `CompareProductPickerView`; its existing
framework-free picker owner and compare-route suites pass 116 tests. The
successor has complete owned paths, no blockers, and does not overlap tracked-
commerce, reset-password, or shared-comparison view data.

Tracked-Commerce Click Mutation Outcome Data then completed: the existing
framework-free owner now returns a resolved same-origin redirect URL or the
shared route error without mutating payload or GraphQL error inputs. Success
requires an explicit empty payload-error list and no top-level GraphQL errors;
unsafe and incomplete redirects fail closed. React retains event handling,
Relay mutation orchestration, browser navigation, state, feedback, markup, and
presentation. Its pure and offer-discovery suites pass 68 tests. Full-gate
investigation also aligned one missed scheduler startup assertion with the
repository's established 250 ms contention tolerance; the three validated
successor rows remain ready.

Before claiming Reset-Password Request Data, the coordinator validated a
fourth non-overlapping successor. Exact selection-count copy, exact-slug label
resolution with fallback, ordered removal-path projection, and open-action
visibility remain embedded in `CompareSelectionTray`; its catalog-browse and
product-detail consumer suites pass 117 tests. The successor has complete
owned paths, no blockers, and avoids the compare-route test path owned by the
higher-ranked visible-option candidate.

Reset-Password Request Data then completed. The framework-free owner now owns
trimmed token data, the exact missing-token state, mutation variables, exact
success copy, and current-response eligibility. React retains URL and FormData
adaptation, request-version mutation, Relay, state, hooks, markup, and
presentation. Its pure and unchanged recovery-route suites pass 19 tests; the
full repository gate passes 771 backend and 1,293 frontend tests. The three
validated successor rows remain ready.

Before claiming Shared Comparison View Data, the coordinator validated a
fourth non-overlapping successor. Verify-email token normalization, missing-
token identity, mutation variables, exact status copy, and failed-outcome
retry eligibility remain embedded in `VerifyEmailRoute`; its recovery-route
suite passes 14 tests. The successor has complete owned paths, no blockers,
and does not overlap the three comparison rows.

Shared Comparison View Data then completed. One framework-free owner now
projects captured title and metadata, winner-or-unsupported recommendation
state, ordered product, accepted-claim, and offer facts with honest fallbacks,
and the live path through the existing compare-path policy. React retains
Relay, route state, date formatting, semantic markup, and StyleX. Its pure and
unchanged snapshot-route suites pass 10 tests; the full repository gate passes
771 backend and 1,297 frontend tests. The three validated successor rows
remain ready.

Before claiming Compare Picker Visible-Option Data, the coordinator validated
a fourth non-overlapping successor. First-page visibility and path plus next-
page visibility and path remain embedded in `ApiTokensRoute`, while its
framework-free route-data owner already owns canonical status-preserving token
page paths. Its pure and route suites pass 75 tests. The successor has complete
owned paths, no blockers, and does not overlap the comparison or verify-email
rows.

Compare Picker Visible-Option Data then completed. The existing framework-free
picker owner now returns normalized filter state, source-ordered visible
options, and exact empty-state copy while preserving the caller's option-array
identity for blank filters. React retains local state, generated IDs, input
events, actions, markup, and presentation. Its pure and unchanged compare-
route suites pass 119 tests; the full repository gate passes 771 backend and
1,300 frontend tests. The three validated successor rows remain ready.

Before claiming Compare-Selection Tray View Data, the coordinator validated a
fourth non-overlapping successor. Merchant first-page and next-page visibility
and path projection remain embedded in `AffiliateSetupRoute`, while its
framework-free pagination owner already provides canonical page-size- and
cursor-preserving paths. Its loader and route suites pass 27 tests. The
successor has complete owned paths, no blockers, and does not overlap the
comparison tray, verify-email, or API-token rows.

Compare-Selection Tray View Data then completed. One framework-free owner now
returns exact selection-count copy, ordered selected rows with exact-slug
labels and fallbacks, caller-owned removal paths, and open-action visibility.
Empty selections reuse one stable row identity. React retains generated IDs,
semantic markup, links, buttons, StyleX presentation, and events. Its pure and
unchanged catalog-browse and product-detail suites pass 121 tests; the full
repository gate passes 771 backend and 1,304 frontend tests. The three
validated successor rows remain ready.

Before claiming Verify-Email Request Data, the coordinator validated a fourth
non-overlapping successor. Feed-candidate first-page and next-page visibility
remain embedded in `FeedCandidateReviewList`, while its framework-free review-
data owner already provides canonical page-size-, filter-, sort-, and cursor-
preserving paths. Its pure and route suites pass 30 tests. The successor has
complete owned paths, no blockers, and does not overlap the verify-email, API-
token, or affiliate-setup rows.

Verify-Email Request Data then completed. One framework-free owner now returns
normalized request data, the exact shared missing-token error identity,
mutation variables, exact success and status copy, and success-only cache
eligibility. React retains the promise cache, single-use request deduplication,
Relay lifecycle, cancellation, hooks, state, markup, and presentation. Its
pure and unchanged recovery-route suites pass 22 tests; the full repository
gate passes 771 backend and 1,312 frontend tests. The three validated successor
rows remain ready.

Before claiming API Token Pagination Data, the coordinator validated a fourth
non-overlapping successor. Merchant-directory first-page and next-page
visibility and path projection remain embedded in `MerchantDirectoryRoute`,
while its framework-free pagination owner already provides canonical page-
size- and cursor-preserving paths. Its loader and route suites pass 33 tests.
The successor has complete owned paths, no blockers, and does not overlap the
API-token, affiliate-setup, or feed-candidate rows.

API Token Pagination Data then completed. The existing framework-free route-
data owner now returns status-preserving first-page and next-page hrefs through
the canonical path builder while enforcing current-cursor and complete Relay
next-page bounds. React retains shared pagination markup, labels, and
presentation. Its pure and unchanged route suites pass 80 tests; the full
repository gate passes 771 backend and 1,317 frontend tests. The three
validated successor rows remain ready.

Before claiming Affiliate Setup Pagination Data, the coordinator validated a
fourth non-overlapping successor. Catalog first-page and next-page visibility
and path projection remain embedded in `BrowseRoute`, while its framework-free
path owner already preserves filters, page size, ordered compare slugs, and
encoded cursors. The current browse route suite passes 62 tests. The successor
has complete owned paths, no blockers, and does not overlap the affiliate-
setup, feed-candidate, or merchant-directory rows.

Affiliate Setup Pagination Data then completed. The existing framework-free
pagination owner now returns page-size-preserving first-page and next-page
hrefs through the canonical path builder while enforcing previous-page,
current-cursor, next-page, and non-empty end-cursor bounds. React normalizes
Relay's optional cursor identity and retains shared pagination markup, labels,
and presentation. Its loader and unchanged route suites pass 33 tests; the full
repository gate passes 771 backend and 1,323 frontend tests. The three
validated successor rows remain ready.

Before claiming Feed-Candidate Pagination Data, the coordinator validated a
fourth non-overlapping successor. Offer-discovery first-page and next-page
visibility and path projection remain embedded in `OfferDiscoveryList`, while
its framework-free filter-data owner already preserves product, merchant,
active-only, page-size, sort, and cursor policy. Its pure and route suites pass
60 tests. The successor has complete owned paths, no blockers, and does not
overlap the feed-candidate, merchant-directory, or catalog-browse rows.

Feed-Candidate Pagination Data then completed. The existing framework-free
review-data owner now returns filter- and sort-preserving first-page and next-
page hrefs through the canonical path builders while enforcing previous-page,
current-cursor, next-page, and non-empty end-cursor bounds. React normalizes
Relay's optional cursor identity, preserves the empty-list early return, and
retains shared pagination markup, labels, and presentation. Its pure and
unchanged route suites pass 36 tests; the full repository gate passes 771
backend and 1,329 frontend tests. The three validated successor rows remain
ready.

Before claiming Merchant Directory Pagination Data, the coordinator validated
a fourth non-overlapping successor. `AlertsRoute` still constructs alert-event
and watch product-detail links independently even though the canonical encoded
path builder already exists in the product-detail data owner. The alert view-
data and route suites pass 15 tests. The successor has complete owned paths, no
blockers, and does not overlap the merchant-directory, catalog-browse, or
offer-discovery rows.

Merchant Directory Pagination Data then completed. The existing framework-free
pagination owner now returns page-size-preserving first-page and next-page
hrefs through the canonical path builder while enforcing previous-page,
current-cursor, next-page, and non-empty end-cursor bounds. React normalizes
Relay's optional cursor identity and retains shared pagination markup, labels,
and presentation. Its loader and unchanged route suites pass 39 tests; the full
repository gate passes 771 backend and 1,335 frontend tests. The three
validated successor rows remain ready.

Before claiming Catalog Browse Pagination Data, the coordinator validated a
fourth non-overlapping successor. Merchant result-node projection, detail-path
construction, and safe website-destination resolution remain embedded in
`MerchantDirectoryRoute`, while its framework-free view-data owner currently
owns only visible-page filtering. The view-data and route suites pass 31
tests. The successor has complete owned paths, no blockers, and does not
overlap the catalog-browse, offer-discovery, or alert-navigation rows.

Catalog Browse Pagination Data then completed. The framework-free catalog path
owner now returns filter-, page-size-, and compare-selection-preserving first-
page and next-page hrefs through the canonical path builders while enforcing
current-cursor, next-page, and non-empty end-cursor bounds. React normalizes
optional Relay cursor identity and retains empty-page recovery, shared
pagination markup, labels, and presentation. Its pure path and unchanged route
suites pass 69 tests; the full repository gate passes 771 backend and 1,342
frontend tests. The three validated successor rows remain ready.

Before claiming Offer Discovery Pagination Data, the coordinator validated a
fourth non-overlapping successor. Product-scoped offer links are still built
independently in browse, product-detail, and comparison presentation even
though they share the same encoded route contract. The three route suites pass
226 tests. The successor has complete owned paths, no blockers, and does not
overlap the offer-discovery pagination, alert-navigation, or merchant-row rows.

Offer Discovery Pagination Data then completed. The existing framework-free
filter-data owner now returns filter- and page-size-preserving first-page and
next-page hrefs through the canonical offer-discovery path builder while
enforcing previous-page, current-cursor, next-page, and non-empty end-cursor
bounds. React normalizes Relay's optional cursor identity and retains shared
pagination markup, labels, and presentation. Its pure filter-data and unchanged
route suites pass 68 tests; the full repository gate passes 771 backend and
1,350 frontend tests. The three validated successor rows remain ready.

Before claiming Alert Product Navigation, the coordinator validated a fourth
non-overlapping successor. Category product links still interpolate raw slugs
in `CategoryRoute` even though the canonical encoded product-detail path
builder already exists. The category view-data and route suites pass eight
tests. The successor has complete owned paths, no blockers, and does not
overlap the alert-navigation, merchant-row, or product-offer navigation rows.

Alert Product Navigation then completed. Alert-event and watch links now use
the canonical product-detail path builder while React retains link markup,
labels, ordering, grouping, mutation ownership, and presentation. Route
characterization covers ordinary and reserved-character slugs. Its view-data
and route suites pass 16 tests; the standalone full backend suite passes 771
tests, and the frontend suite passes 1,351 tests with green client and SSR
production builds. The three validated successor rows remain ready.

Before claiming Merchant Directory Row Data, the coordinator validated three
non-overlapping successors from current source and tests. Revenue filter-form
reset identity remains in React and can collide on delimiter-containing
values; its focused suites pass 23 tests. Category pagination encodes the
cursor but not the category slug; its focused suites pass eight tests. Saved-
comparison select-value normalization remains in React; its focused suites
pass 48 tests. All three successors have complete owned paths and no blockers.

Merchant Directory Row Data then completed. The existing framework-free owner
now projects source-ordered Relay result nodes into exact merchant rows with
encoded detail paths and website destinations resolved through the shared
external-link safety policy. React retains Relay reads, pagination, filtering,
markup, labels, and presentation. Its pure and route suites pass 33 tests.

Product Offer Navigation Path then completed. One framework-free
`productOffersPath` now owns the exact encoded product-scoped offer destination
used by catalog browse, product detail, and comparison decision summary. React
retains link markup, labels, and presentation. Its direct path and unchanged
consumer suites pass 230 tests.

Category Product Navigation then completed. Category product links now use the
canonical product-detail path builder, so reserved characters remain inside
one encoded slug segment instead of changing the route path or query. React
retains link markup, labels, list order, and presentation. Its view-data and
route suites pass eight tests.

Before claiming Revenue Summary Filter-Form Data, the coordinator validated a
fourth non-overlapping successor. Selected-product typename qualification and
brand, ID, name, and slug projection remain embedded in
`OfferDiscoveryRoute`, while its existing framework-free filter-data owner
already consumes that context. The filter-data and route suites pass 68 tests.
The successor has complete owned paths and no blockers.

Revenue Summary Filter-Form Data then completed. The existing framework-free
owner now returns exact uncontrolled-form values and a collision-free JSON
reset identity. Distinct delimiter-containing filters can no longer reuse a
stale form instance. React retains fields, labels, submission, links, markup,
and presentation. Its pure and unchanged route suites pass 26 tests.

Before claiming Category Pagination Navigation, the coordinator validated a
fourth non-overlapping successor. API-token and saved-comparison React
retainers duplicate an operation-name plus stable-variables key, while the
Relay preload layer already owns the canonical descriptor identity over
operation name, query text, and stable variables. Its preload, API-token, and
saved-comparison characterization suites pass 94 tests. The successor has
complete owned paths, no blockers, and does not overlap category pagination,
saved-comparison sort input, or offer selected-product context.

Category Pagination Navigation then completed. The existing framework-free
owner now encodes the category slug as one path segment as well as encoding the
cursor query value, preventing reserved slug characters from changing route
structure. Pagination eligibility and React presentation remain unchanged. Its
pure and route suites pass 8 tests.

Before claiming Saved-Comparison Sort Input, the coordinator validated a
fourth non-overlapping successor. `PriceWatchControl` still trusts the raw rule-
type select value through a TypeScript assertion, while the existing framework-
free price-watch owner defines the four supported rule types and all downstream
amount policy. Its pure and product-detail characterization suites pass 71
tests. The successor has complete owned paths, no blockers, and does not
overlap saved-comparison sort input, offer selected-product context, or Relay
query descriptor identity.

Saved-Comparison Sort Input then completed. The existing framework-free view-
state owner now normalizes all raw select values to the four supported modes,
with blank, unknown, and future values falling back to current order. Sorting,
filtering, React events, markup, and presentation remain unchanged. Its pure
and route-state suites pass 55 tests.

Before claiming Offer-Discovery Selected-Product Context, the coordinator
validated a fourth non-overlapping successor. `CatalogFilterForm` still trusts
the raw sort select value through a TypeScript assertion, while the existing
framework-free catalog filters owner defines all four supported sorts and the
URL normalization policy. The catalog route characterization suite passes 62
tests. The successor has complete owned paths, no blockers, and does not
overlap offer selected-product context, Relay query descriptor identity, or
price-watch rule-type input.

Offer-Discovery Selected-Product Context then completed. The existing
framework-free filter-data owner now qualifies nullable selected-product nodes
by typename and projects exact brand, ID, name, and slug context while
preserving brand identity. Relay reads, route fallbacks, summaries, markup, and
presentation remain unchanged. Its pure and route suites pass 73 tests.

Before claiming Relay Query Descriptor Identity, the coordinator validated a
fourth non-overlapping successor. Root viewer projection is duplicated between
`RootRoute` and the root loader, while the loader's private copy already
validates unknown cache/query values before projecting exact ID, email, and
operator state. The root route characterization suite passes 16 tests. The
successor has complete owned paths, no blockers, and does not overlap Relay
query descriptor identity, price-watch rule-type input, or catalog sort input.

Relay Query Descriptor Identity then completed. The preload layer now exports
one canonical operation-name, query-text, and stable-variable identity, and
both API-token and saved-comparison retainers consume it directly. Variable-
order stability remains unchanged, descriptors with different query text stay
distinct, and Relay lifecycle and rendering remain unchanged. Its preload and
consumer suites pass 95 tests.

Before claiming the price-watch rule-type row, current source inspection
confirmed that affiliate coupon result copy still interprets discount type,
value, and currency inside `AffiliateSetupForms`, while the existing
framework-free affiliate setup data owner already owns the surrounding input
and outcome policy. Its data and route characterization suites pass 37 tests.
The successor is path-disjoint from price-watch input, catalog sort input, and
root viewer projection.

Price-Watch Rule-Type Select Input then completed. The framework-free owner
now accepts every supported select value and safely falls back to target price
for blank, unknown, or future values. Form state, amount-field visibility,
mutation inputs, events, markup, and presentation remain unchanged. Its pure
and product-detail route suites pass 78 tests.

Catalog Sort Select Input then completed. The framework-free filters owner now
normalizes all four supported raw sort values and falls back to catalog order
for blank, unknown, or future values. Form state, submitted-field omission,
events, options, markup, and presentation remain unchanged. Its pure and
catalog route suites pass 69 tests.

Before claiming the catalog sort row, current source inspection confirmed that
comparison snapshot pagination still selects the next Relay cursor inside
`ShareComparisonControl`, while the existing framework-free share-comparison
data owner already owns snapshot page merging and state policy. Its pure and
snapshot route suites pass 31 tests. The successor is path-disjoint from
catalog sort input, root viewer projection, and affiliate coupon result data.

Before claiming the root viewer row, current source inspection confirmed that
API-token status-filter order, labels, current-state policy, and destinations
remain embedded in `ApiTokenControls`, while the existing route-data owner
already owns the canonical status type and status-aware page paths. Its pure
and route suites pass 80 tests. The successor is path-disjoint from root viewer
projection, affiliate coupon result data, and snapshot pagination.

Before claiming the affiliate coupon row, current source inspection confirmed
that compare specification-mode order, labels, current-state policy, and
mode-preserving paths remain embedded in `CompareRoute`, while the existing
compare path owner already defines canonical slug and specification-mode URL
behavior. The compare route suite passes 109 tests. The successor is path-
disjoint from affiliate coupon result data, snapshot pagination, and API-token
status-filter navigation.

Before claiming the comparison snapshot pagination row, current source
inspection confirmed that saved-comparison card product-count and ordered
product-name copy remain embedded in `SavedComparisonSetList`, while the
existing framework-free saved view-state owner already owns deterministic
saved-set presentation policy. Its pure and route-state suites pass 54 tests.
The successor is path-disjoint from snapshot pagination, API-token status-
filter navigation, and compare specification-mode navigation.

Before claiming the API-token status-filter navigation row, current source
inspection confirmed that watch-toggle mutation state and Pause/Resume copy
remain duplicated in `AlertsRoute`, while the existing framework-free alerts
view-data owner already owns deterministic watch presentation policy. Its pure
and route suites pass 16 tests. The successor is path-disjoint from API-token
status-filter navigation, compare specification-mode navigation, and saved-
comparison card display data.

Before claiming the compare specification-mode navigation row, current source
inspection confirmed that auth global-error visibility policy remains embedded
in `AuthFormShell`, while the existing framework-free auth errors owner already
owns mutation-error lookup and normalization. Its pure and form-shell suites
pass 8 tests. The successor is path-disjoint from compare specification-mode
navigation, saved-comparison card display data, and alert watch-toggle control
data.

Before claiming the saved-comparison card display row, current source
inspection confirmed that recommendation query variables and error-boundary
reset identity remain embedded in `RecommendationPanel`, while the existing
framework-free recommendation route-data owner already owns profile and path
policy. Its pure and panel suites pass 28 tests. The current joined reset token
also aliases distinct slug lists containing `|`, so the successor has a
source-backed correctness case and is path-disjoint from all three ready rows.

Before claiming the alert watch-toggle control row, current source inspection
confirmed that active/all offer scope label and badge tone remain embedded in
`OfferDiscoveryList`, while the existing framework-free filter-data owner
already owns the same active-only status semantics. Its pure and route suites
pass 73 tests. The successor is path-disjoint from alert toggle, auth error
visibility, and recommendation query input.

Before claiming the auth global-error visibility row, current source
inspection confirmed that review title fallback, rating stars, and purchase-
verification author copy remain embedded in `ProductCommunityPanel`, while the
existing framework-free product-community data owner already owns review
summary and mutation policy. Its pure and panel suites pass 17 tests. The
successor is path-disjoint from auth error visibility, recommendation query
input, and offer discovery scope badge data.

Before claiming the recommendation query-input row, current source inspection
confirmed that API-token status labels come from `buildApiTokenDisplayData`
while `ApiTokenItem` still independently derives the matching positive or
neutral badge tone. The framework-free API-token route-data owner already owns
the lifecycle status policy, and its pure and route suites pass 84 tests. The
successor is path-disjoint from recommendation query input, offer discovery
scope badge data, and product review row display data.

Before claiming the offer discovery scope-badge row, current source inspection
confirmed that amount-field visibility and the target-versus-percentage label
remain split between `needsPriceWatchAmount` and `PriceWatchControl`. The
framework-free price-watch data owner already owns rule-type policy, and its
pure and alert-route suites pass 30 tests. The successor is path-disjoint from
offer discovery scope badge data, product review row display data, and API-
token status badge data.

Before claiming the product review row-display row, current source inspection
confirmed that robots and Twitter-card values remain derived inline in
`RouteMetadata`, while the framework-free route-metadata data owner already
normalizes indexability and image facts. Its pure and component suites pass 9
tests. The successor is path-disjoint from product review row display data,
API-token status badge data, and price-watch amount field data.

Before claiming the API-token status-badge row, current source inspection
confirmed that selected-merchant copy remains repeated across three affiliate
forms and current-merchant copy remains inline in `AffiliateSetupRoute`, while
the framework-free affiliate setup data owner already projects the canonical
merchant summary. Its pure and route suites pass 50 tests. The successor is
path-disjoint from API-token status badge data, price-watch amount field data,
and route metadata tag policy data.

Before claiming the route-metadata tag-policy row, current source inspection
confirmed that initial and additional product-answer pagination still derive
cursor policy independently in `ProductCommunityPanel`, bypassing the existing
framework-free community cursor owner. Additional pages can accept the current
cursor again instead of requiring forward progress. The pure and panel suites
pass 23 tests. The successor is path-disjoint from route metadata tag policy,
affiliate merchant context copy, and API-token lifecycle action policy data.

On 2026-07-18, coordinator review found that the rolling reserve had confused
parallel-safe implementation slices with independently shippable batches. The
three unclaimed micro-rows and their validated follow-up evidence were regrouped
into four reviewer-sized outcomes: account/setup presentation contracts,
cross-surface cursor forward-progress hardening, strict temporal presentation,
and row-scoped asynchronous action state. The former rows remain lane evidence
only. `AGENTS.md`, the operating model, plan guidance, and coordinator prompt
now require internal slices to stay inside their parent batch and prohibit
subdivision merely to satisfy a numeric request or the ready-row floor. The
queue validator enforces the batch outcome and internal-slice fields.

On 2026-07-20, a live source/contract audit found three immediately executable
backend correctness outcomes and one policy-gated community lifecycle outcome.
The community policy was approved, and all backend plus existing frontend work
was regrouped into seven domain-oriented rows. Those seven outcomes are now
complete. A fresh resolver/query audit replenished the shared queue with three
backend read-budget outcomes: product evidence/SEO, public community
connections, and product-offer/coupon/history connections. Already-implemented
frontend polish and preloaded specification corrections were not re-promoted.
Before product evidence was claimed, the coordinator verified and promoted two
additional, independently reviewable read-budget outcomes: merchant-parent
active-offer connections and owner-private community submission lists. They are
serial with overlapping resolver/context rows but have distinct contracts and
acceptance boundaries. Product evidence completed on
`codex/bounded-product-evidence-reads`; its growing-parent regression now holds
the tracked evidence query budget fixed at three and six product parents.
Bounded community GraphQL connections completed on
`codex/bounded-community-connections`; reviews, questions, and nested answers
now each hold at one SELECT as their parent graph grows. Bounded product-offer
connections completed on `codex/bounded-product-offer-connections`: product
offers, active coupons, and price history now hold at `{1, 1, 2}` SELECTs at
both three and six product parents while preserving filters, order, validity,
ranges, Relay pagination, latest prices, and invalid-input errors. The three
successor rows remain ready. Before claiming the merchant-offer successor on
2026-07-21, the coordinator verified a fourth coherent read-budget outcome:
aliased public category lookups and their nested qualified-product connections
still execute per category. Bounded category GraphQL reads was promoted so the
claim leaves three independently shippable ready rows. Bounded merchant-offer
connections then completed on `codex/bounded-merchant-offer-connections`:
merchant-product and latest-price SELECT counts now hold at `{1, 1}` for both
three and six merchant parents while active-only filtering, ordering, Relay,
association, and invalid-input behavior remain unchanged.
Before claiming the viewer-community successor, a third claim-floor audit
verified that aliased public `product(slug:)` and `merchant(slug:)` entry-point
fields still perform direct per-alias lookups. Bounded public slug GraphQL
reads was promoted as one coherent lookup outcome, leaving three independently
shippable ready rows after the claim. Bounded viewer-community submission reads
then completed on `codex/bounded-graphql-read-budgets`: review, question, and
answer SELECT counts now hold at `{1, 1, 1}` for both three and six product
parents while owner privacy, moderation states, per-kind limits, order,
hidden-parent answer manageability, and anonymous zero-query behavior remain
unchanged.
Before claiming the public-node successor, a fourth claim-floor audit verified
that the remaining nullable public opaque-key entry points—source artifacts,
published product questions, and comparison snapshots—still perform direct
per-alias reads. Those visibility and preload variants were grouped as one
public-entry read-budget outcome, leaving three independently shippable ready
rows after the claim.
Bounded public-node GraphQL reads then completed on
`codex/bounded-graphql-read-budgets`: Product, Brand, Merchant,
MerchantProduct, PricePoint, SourceArtifact, and source-preload SELECT counts
now each hold at one for both three and six same-schema aliases while public
values, valid-missing `nil`, invalid IDs, operator authorization, owner scope,
and source metadata remain unchanged.
Before claiming the category successor, a fifth claim-floor audit verified
that live recommendations and immutable comparison snapshots still repeat
offer, specification, and merchant evidence reads per selected product. Those
surfaces share one two-or-three-product decision-evidence lifecycle, so they
were promoted together as Bounded Comparison Evidence Reads, leaving three
independently shippable ready rows after the claim.
Bounded category GraphQL reads then completed on
`codex/bounded-graphql-read-budgets`: two and four category aliases now both
hold at `%{taxons: 1, products: 2}` SELECTs while category qualification,
shared-time semantics, metadata, descendant product order, Relay pagination,
and missing-category behavior remain unchanged.
Before claiming the public-slug successor, a sixth claim-floor audit verified
that the remaining operator-only and owner-scoped Relay node types still read
once per authorized alias. Affiliate network/program/link/coupon nodes and
owner-filtered saved-set/API-token nodes share one authorization-aware Relay
lookup boundary, so they were promoted together as Bounded Authorized Node
GraphQL Reads, leaving three independently shippable ready rows after the
claim.
Bounded public slug GraphQL reads then completed on
`codex/bounded-graphql-read-budgets`: two and four product/merchant alias sets
now both hold at two product lookups, one historical-alias join, and one
merchant lookup while canonical precedence, historical redirects, nested
Dataloader values, request-local cache clearing, and missing results remain
unchanged.
Before claiming the public opaque-key successor, a seventh claim-floor audit
verified that one alert evaluation still repeats identical product-wide or
triggering-listing market-fact reads inside every applicable watch transaction.
Bounded Alert Evaluation Market Reads was promoted as one coherent backend
reliability/performance outcome. It preserves the required per-watch row lock,
update, replay, cooldown, and fault-isolation boundaries while bounding only
the shared offer-evidence reads, leaving three independently shippable ready
rows after the claim.
Bounded public opaque-key GraphQL reads then completed on
`codex/bounded-public-opaque-graphql-reads`: source-artifact, published-question,
and active-snapshot entry points now each hold at one entity SELECT for both two
and four aliases, with one bounded source or accepted-answer preload where
applicable. Safe values, hydration, publication and revocation gates, invalid
IDs, nullable missing results, and public privacy remain unchanged.
Before claiming the comparison-evidence successor, an eighth claim-floor audit
verified that repeated public `comparisonProducts` and
`comparisonRecommendation` aliases still execute their bounded slug and
recommendation evidence reads independently. Bounded Comparison Root GraphQL
Reads was promoted as one public comparison-selection outcome. Its product-list
and recommendation variants remain internal slices, and it executes serially
with other Recommendations/Loader work, leaving three independently shippable
ready rows after the claim.
Bounded comparison evidence reads then completed on
`codex/bounded-public-opaque-graphql-reads`: recommendation product, current-
claim, merchant-product, and price-point SELECTs now hold at one each for both
two and three products. Snapshot publication now holds its product,
specification, offer, merchant, and hydration reads fixed at the same selection
sizes while preserving ordered captured facts, exact evidence IDs, shared-time
semantics, qualification, privacy, tokens, and revocation behavior.

Before claiming the authorized-node successor, a ninth claim-floor audit
verified that the remaining non-public Relay connections still execute one
direct page query for every identical alias. Six owner-scoped management
collections and two operator-only queues share one authorization-aware
connection acceptance boundary, so they were promoted together as Bounded
Authorized Management GraphQL Connections. The existing focused suites pass
45 tests; deferred ingestion dashboard work remains closed because this batch
only bounds the already-shipped merchant-feed review query. Three independently
shippable ready rows remain after the claim.

Bounded authorized node GraphQL reads then completed on
`codex/bounded-public-opaque-graphql-reads`: Affiliate, SavedComparisonSet, and
ApiToken context lookups now accept set requests, and the six non-public Relay
node types use one authorization-aware request source. Two and four authorized
aliases now both hold at one entity SELECT per type; lazy saved-set items and
products remain fixed at one, anonymous aliases issue zero tracked reads, and
operator gates, ownership, missing/malformed behavior, nested values, and Relay
identity remain unchanged. Shared UUID validation/projection prevents owner-
context policy drift and keeps the clone budget unchanged. The focused gate
passes 68 tests, its shared-input suite passes 20, and final PR CI passes 852
backend plus 1,507 frontend tests.

Before claiming the alert-evaluation successor, a tenth claim-floor audit
verified that `products`, `productFilterMetadata`, `merchants`, and top-level
`merchantProducts` still execute their public discovery reads once per
identical alias. Their catalog filters and metadata, merchant-directory
pagination, offer filters, nested values, and request-reuse budgets share one
catalog and offer-discovery acceptance boundary, so they were promoted
together as Bounded Catalog And Offer Discovery Root GraphQL Reads. The three
focused suites pass 51 tests, and deferred eBay and ingestion-dashboard work
remains closed. Three independently shippable ready rows remain after the
claim.

Bounded alert evaluation market reads then completed on
`codex/bounded-public-opaque-graphql-reads`: the default evaluator now computes
only the product and triggering-listing scopes present in one applicable watch
set and reuses those immutable facts across independent watch transactions.
As mixed watches grow from two to six, shared merchant-product and latest-price
SELECTs now both hold at two while required watch locks still grow from two to
six. Event facts, summaries, edge and cooldown behavior, stale/incomplete/out-
of-stock handling, owner scope, replay safety, three- and four-arity fault
injection, and later-watch progress remain unchanged. The focused suite passes
8 tests, and the type, format, queue, and diff gates are green.

Bounded comparison root GraphQL reads completed on
`codex/bounded-comparison-root-reads`. Comparison-product and recommendation
aliases now share request-scoped selection and evidence reads while preserving
order, missing positions, validation, profile, ranking, reason, and evidence-ID
semantics. As valid aliases grow from two to four, products, current-claim,
merchant-product, and price-point SELECT counts remain fixed at three, one,
one, and one respectively. The four focused suites pass 59 tests, and the type,
format, queue, and diff gates are green.

Bounded authorized management GraphQL connections then completed on the same
branch. Six owner collections and two operator-only queues now reuse identical
authorized connection reads within one request. Every collection moved from
two/four alias SELECT counts of 2/4 to fixed counts of 1/1 while preserving
principal isolation, authorization-before-load, filters, ordering, pagination,
nested values, errors, zero-query denials, direct fallbacks, and schema
behavior. Direct no-loader characterizations now cover all eight fallbacks; the
seven focused suites pass 84 tests, and three independently
shippable ready rows remain after closeout.

The exact-head quality gate then exposed four duplicate resolver lifecycle
groups. One shared `AuthorizedConnection` boundary now owns private key
construction, role derivation, validation order, loader scheduling, and result
projection. The unchanged ExDNA budget is green at 6/6, and all 84 focused
management tests remain green.

Bounded Catalog And Offer Discovery Root GraphQL Reads is complete. Identical
aliases now hold products at 2/4 to 1/1 SELECTs, product-filter metadata at
6/12 to 3/3, merchants at 2/4 to 1/1, and merchant products at 2/4 to 1/1;
the exact focused four-suite gate passed 95 tests with 0 failures. Pre-closeout
full `mix ci` exited 0 with 895 backend tests and 1,507 frontend tests, and the
ExDNA unchanged gate passed. The three ready successors remain dispatchable.

Before claiming Bounded Operator Reporting Root GraphQL Reads on 2026-07-22,
the coordinator verified a fourth independently shippable structural outcome.
The 1,285-line `ProductCompare.Discussions` context still owns read/query,
legacy CRUD, authenticated submission/owner policy, and operator moderation
implementations behind one stable public boundary. Discussions Context
Decomposition was promoted after its direct context, SEO, community GraphQL,
and Dataloader characterization gate passed 104 tests. The operator-reporting
claim therefore leaves three complete ready rows.

Bounded Operator Reporting Root GraphQL Reads then completed on the current
detached worktree. Active-coupon aliases moved from 2/4 to 1/1 coupon SELECTs,
and revenue-summary aliases moved from conversion/click budgets of 4/2 and 8/4
to a fixed 2/1. Normalized identical inputs coalesce while merchant, time,
filter, and Relay-page keys remain isolated. Direct resolver fallbacks,
authorization, validation, pagination, suppression, populated metrics, and
mixed-currency errors retain their prior behavior. The three ready successors
remain dispatchable, and the loader-decomposition row now includes the
thirteenth operator-reporting KV source.

Before claiming GraphQL Request Loader Decomposition on 2026-07-22, the
coordinator verified a fourth independently shippable structural outcome. The
1,212-line `ProductCompare.Specs` facade still owns definition upserts, typed-
value normalization, claim/import workflows, corrections/moderation, and read
projections. Specs Context Decomposition was promoted after its path-disjoint
direct consumer characterization gate passed 79 tests. The loader claim
therefore leaves three complete ready rows.

GraphQL Request Loader Decomposition then completed on the current detached
worktree. `Loader` remains the sole resolver-facing assembly facade and stable
source-key owner, while `AssociationSources`, `ParentSources`, and
`RootSources` own the two Ecto and thirteen KV source implementations. The
exact focused gate passed 222 tests, and full `mix ci` passed 902 backend tests,
1,507 frontend tests, 83.82% coverage, ExDNA at 6/6, Dialyzer, Relay, builds,
and the bundle budget. The three ready successors remain dispatchable.

Before claiming GraphQL Schema Type Decomposition on 2026-07-22, the
coordinator verified a fourth independently shippable structural outcome. The
1,041-line `ProductCompare.CommerceAttribution` context still owns tracked
click/redirect, conversion/purchase-fact, and revenue-summary implementations
behind one stable public boundary. Commerce Attribution Context Decomposition
was promoted after its direct context, destination-policy, redirect-controller,
commerce-click GraphQL, and revenue GraphQL characterization gate passed 81
tests. The schema claim therefore leaves three complete ready rows.

GraphQL Schema Type Decomposition then completed on the current detached
worktree. `ProductCompareWeb.Schema` is now a 689-line root-operation and
runtime facade, while Common, Accounts, Commerce, Catalog, and Trust notation
modules own all 151 declarations. Ordered selective imports preserve the
historical Absinthe registration order and the checked-in SDL byte for byte.
The full GraphQL gate passed 307 tests, and `mix ci` passed 902 backend tests,
1,507 frontend tests, Relay validation, TypeScript, and both production builds.
The three ready successors remain dispatchable.

Before claiming Discussions Context Decomposition on 2026-07-22, the
coordinator verified a fourth independently shippable structural outcome. The
1,291-line `ProductCompare.Ingestion` facade still owns import-run lifecycle,
merchant-feed-candidate policy, merchant identity, and canonical normalized-
listing persistence behind one stable public boundary. Ingestion Context
Decomposition was promoted after its direct ingestion, enrichment,
reconciliation, and merchant-feed-candidate GraphQL characterization gate
passed 60 tests. The Discussions claim therefore leaves three complete ready
rows without reopening deferred provider, dashboard, or operator work.

Discussions Context Decomposition then completed on the current detached
worktree. `ProductCompare.Discussions` is now a 252-line stable public facade;
`Reads`, `Crud`, `Submissions`, and `Moderation` own the four planned
responsibilities without caller bypasses. The exact focused gate passed 108
tests, and the final `mix ci` passed 902 backend tests at 83.77% coverage,
1,507 frontend tests, ExDNA at the unchanged 6/6 budget, Dialyzer, Relay,
TypeScript, both production builds, and the bundle contract. The three ready
successors remain dispatchable.

Before claiming Specs Context Decomposition on 2026-07-22, the coordinator
verified a fourth independently shippable structural outcome. The 721-line
`ProductCompare.Accounts` facade still owns user provisioning/bootstrap,
API-token lifecycle, and reputation behavior alongside the existing focused
`UserAuth` owner. Accounts Context Decomposition was promoted after its direct
Accounts, seed, API-token/session GraphQL, and authorized node characterization
gate passed 112 tests. The Specs claim therefore leaves three complete ready
rows without changing browser auth, authorization, seeds, or transport scope.

Specs Context Decomposition then completed on the current detached worktree.
`ProductCompare.Specs` is now a 248-line stable public facade; `Definitions`,
`TypedValues`, `Claims`, `Corrections`, and `Reads` own the five planned
responsibilities without caller bypasses. The exact focused gate passed 81
tests, including final-review regressions for invalid-changeset action parity.
The final `mix ci` passed 904 backend tests at 83.64% coverage, 1,507 frontend
tests, ExDNA at the unchanged 6/6 budget, Reach, Dialyzer, Relay, TypeScript,
both production builds, and the bundle contract. The three ready successors
remain dispatchable.

Commerce Attribution Context Decomposition then completed on the current
detached worktree. `ProductCompare.CommerceAttribution` is now a 55-line stable
public facade; `Clicks`, `Conversions`, and `Revenue` own the three planned
responsibilities without caller bypasses. The exact focused gate passed 81
tests, and the final `mix ci` passed 905 backend tests at 83.79% coverage,
1,507 frontend tests, ExDNA at the unchanged 6/6 budget, Dialyzer, Relay,
TypeScript, both production builds, and the bundle contract.

Before claiming Ingestion Context Decomposition on 2026-07-22, the coordinator
validated two independently shippable structural successors. The 625-line
`ProductCompare.Pricing` facade combines merchant, offer, price-history, and
current offer-truth reads behind one stable boundary; its direct and GraphQL
characterization gate passed 39 tests. The 603-line `ProductCompare.Seo`
facade combines metadata, category qualification, and sitemap behavior; its
direct, controller, and GraphQL characterization gate passed 13 tests. The
Ingestion claim therefore leaves Accounts, Pricing, and SEO as three complete,
path-disjoint ready rows without promoting deferred work or micro-batches.

Ingestion Context Decomposition then completed on the current detached
worktree. `ProductCompare.Ingestion` is now a 75-line stable public facade;
`Runs`, `FeedCandidates`, `MerchantIdentities`, and `ListingPersistence` own
the four planned responsibilities without caller bypasses. The live focused
gate passed 57 tests, and the final `mix ci` passed 905 backend tests at 83.79%
coverage, 1,507 frontend tests, ExDNA at the unchanged 6/6 budget, Dialyzer,
Relay, TypeScript, both production builds, and the bundle contract. Accounts,
Pricing, and SEO remain as three complete ready successors.

Before claiming Accounts Context Decomposition on 2026-07-22, the coordinator
validated a fourth independently shippable structural successor. The 543-line
`ProductCompare.Alerts` facade combines owner-scoped watch lifecycle, shared
market-fact projection, durable evaluation/event creation, and alert-inbox
behavior behind one stable boundary; its direct and GraphQL characterization
gate passed 13 tests. Alerts Context Decomposition was promoted without
changing alert policy, price-point enqueueing, transports, resolver
authorization, or frontend behavior. The Accounts claim therefore leaves
Pricing, SEO, and Alerts as three complete, path-disjoint ready rows.

Accounts Context Decomposition then completed on the current detached
worktree. `ProductCompare.Accounts` is now a 198-line stable public facade;
`Users`, `ApiTokens`, and `Reputation` own the three remaining implementation
responsibilities alongside the unchanged `UserAuth` owner, without caller
bypasses. The exact focused gate passed 112 tests, and final `mix ci` passed
905 backend tests at 83.70% coverage, 1,507 frontend tests, ExDNA at the
unchanged 6/6 budget, Dialyzer, Relay, TypeScript, both production builds, and
the bundle contract. Pricing, SEO, and Alerts remain ready.

Before claiming Pricing Context Decomposition on 2026-07-22, the coordinator
validated a fourth independently shippable structural successor. The 482-line
`ProductCompare.Catalog` facade combines product and brand lifecycle, product
identifier and media evidence, saved-comparison lifecycle, and existing
catalog-filter entry points behind one stable boundary; its direct and GraphQL
characterization gate passed 106 tests. Catalog Context Decomposition was
promoted without changing catalog, filtering, ingestion, taxonomy, GraphQL, or
frontend behavior. The Pricing claim therefore leaves SEO, Alerts, and Catalog
as three complete, path-disjoint ready rows.

Pricing Context Decomposition then completed on the current detached worktree.
`ProductCompare.Pricing` is now a 161-line stable public facade; `Merchants`,
`Offers`, `PriceHistory`, and `TruthReads` own the four planned responsibilities
while `OfferTruth` remains the unchanged single-offer policy owner. The exact
focused gate passed 39 tests, and final `mix ci` passed 905 backend tests at
83.61% coverage, 1,507 frontend tests, ExDNA at the unchanged 6/6 budget,
Reach, Dialyzer, Relay, TypeScript, both production builds, and the bundle
contract. SEO, Alerts, and Catalog remain ready.

Before claiming SEO Context Decomposition on 2026-07-22, the coordinator
validated Comparison Snapshots Context Decomposition as a fourth independently
shippable structural successor. Its 444-line stable context combines
owner-scoped lifecycle, immutable evidence capture, and payload hydration; the
direct and GraphQL characterization gate passed 12 tests. SEO was therefore
claimed while Alerts, Catalog, and Comparison Snapshots remained ready.

SEO Context Decomposition then completed on the current detached worktree.
`ProductCompare.Seo` is now a 71-line stable public facade; `Metadata`,
`Categories`, and `Sitemaps` own the three planned responsibilities without
caller bypasses or policy changes. The exact focused gate passed 13 tests, and
final `mix ci` passed 905 backend tests at 83.56% coverage, 1,507 frontend
tests, Credo, Reach, ExDNA at the unchanged 6/6 budget, Dialyzer, Relay,
TypeScript, both production builds, and the bundle contract. Alerts, Catalog,
and Comparison Snapshots remain ready.

Before claiming Alerts Context Decomposition on 2026-07-22, the coordinator
validated Taxonomy Context Decomposition as a fourth independently shippable
structural successor. Its 396-line stable facade combines taxonomy registry,
taxon hierarchy, use-case assignment, and category-alias behavior; the direct
Taxonomy and ingestion enrichment characterization gate passed 13 tests.
Alerts was therefore claimed while Catalog, Comparison Snapshots, and Taxonomy
remained ready.

Alerts Context Decomposition then completed on the current detached worktree.
`ProductCompare.Alerts` is now a 73-line stable public facade; `WatchRules`,
`MarketFacts`, `Evaluation`, and `Inbox` own the four planned responsibilities
without caller bypasses or behavior changes. The exact focused gate passed 13
tests, and final `mix ci` passed 905 backend tests at 83.53% coverage, 1,507
frontend tests, Credo, Reach, ExDNA at the unchanged 6/6 budget, Dialyzer,
Relay, TypeScript, both production builds, and the bundle contract. Catalog,
Comparison Snapshots, and Taxonomy remain ready.

Before claiming Catalog Context Decomposition on 2026-07-23, the coordinator
validated CJ Import Task Decomposition as a fourth independently shippable
structural successor. The 627-line stable Mix task combines option and
credential normalization, durable single-run imports, and reviewed-candidate
batching behind `run/1` and `run_import/1`; its dedicated characterization gate
passed 19 tests. Catalog was therefore claimed while Comparison Snapshots,
Taxonomy, and CJ Import remained ready.

Catalog Context Decomposition then completed on the current detached worktree.
`ProductCompare.Catalog` is now a 164-line stable public facade; `Products`,
`Evidence`, and `SavedComparisons` own the three planned responsibilities
alongside the unchanged `Filtering` and `FilterMetadata` owners, without caller
bypasses or behavior changes. The exact focused gate passed 106 tests, and
final `mix ci` passed 909 backend tests at 83.53% coverage, 1,507 frontend
tests, Credo, Reach, ExDNA at the unchanged 6/6 budget, Dialyzer, Relay,
TypeScript, both production builds, and the bundle contract. Comparison
Snapshots, Taxonomy, and CJ Import remain ready.

Before claiming Comparison Snapshots Context Decomposition on 2026-07-23, the
coordinator validated CJ Runs Task Decomposition as a fourth independently
shippable structural successor. The 600-line stable Mix task combines input
normalization, run reporting, and resume orchestration behind three public
entry points; its dedicated characterization gate passed 10 tests. Comparison
Snapshots was therefore claimed while Taxonomy, CJ Import, and CJ Runs remained
ready.

Comparison Snapshots Context Decomposition then completed on the current
detached worktree. `ProductCompare.ComparisonSnapshots` is now a 42-line stable
public facade; `Lifecycle`, `Capture`, and `PayloadCodec` own the three planned
responsibilities without caller bypasses. Final review removed one unused
internal hydration forwarding API, then hardened legacy and partial
recommendation payload hydration so absent optional fields decode to `nil`.
The exact focused gate passes 14 tests, and final `mix ci` passes the queue,
formatting, typecheck, quality, backend/frontend test, Relay, TypeScript,
production-build, and bundle gates.

Taxonomy Context Decomposition then completed on the current detached
worktree. `ProductCompare.Taxonomy` is now an 88-line stable public facade;
`Taxonomies`, `Hierarchy`, `Assignments`, and `Aliases` own the four planned
responsibilities without caller bypasses or behavior changes. The final
hierarchy milestone relocated the two existing path-scoped Dialyzer baselines
with their unchanged `Ecto.Multi` calls. The exact focused gate passed 13
tests, and final `mix ci` passed 909 backend tests at 83.45% coverage, 1,507
frontend tests, and all queue, quality, type, Relay, build, and bundle gates.
Before claiming CJ Import Task Decomposition on 2026-07-23, the coordinator
validated Listing Persistence Decomposition as a fourth independently
shippable structural successor. The 840-line stable persistence boundary
combines source and external identity, canonical product identity, enrichment,
and offer observation persistence; its direct ingestion, enrichment, and
reconciliation characterization gate passed 44 tests. CJ Import was therefore
claimed while CJ Runs, Catalog Resolver, and Listing Persistence decomposition
remain ready.

CJ Import Task Decomposition then completed on the current detached worktree.
`Mix.Tasks.ProductCompare.Ingestion.CjImport` is now a 108-line stable facade;
`Options`, `Runner`, and `Candidates` own normalization and credential
readiness, durable single-source imports, and reviewed-candidate batching
without caller bypasses. Post-review hardening added secret-safe runner failure
categories and sanitized stack traces while preserving public results. The
exact focused gate passes 21 tests, and final `mix ci` passes the queue,
formatting, typecheck, quality, backend/frontend test, Relay, TypeScript,
production-build, and bundle gates. CJ Runs, Catalog Resolver, and Listing
Persistence decomposition remain ready.

Before claiming CJ Runs Task Decomposition on 2026-07-23, the coordinator
validated CJ Candidates Task Decomposition as a fourth independently shippable
structural successor. The 430-line stable Mix task combines option
normalization, stale reporting, fit-gap reporting, and application-cohort
reporting; its dedicated characterization gate passed 6 tests. CJ Runs was
therefore claimed while Catalog Resolver, Listing Persistence, and CJ
Candidates decomposition remain ready.

CJ Runs Task Decomposition then completed on the current detached worktree.
`Mix.Tasks.ProductCompare.Ingestion.CjRuns` is now a 33-line stable facade;
`Options`, `Reports`, and `Resume` own normalization, operator-safe reporting,
and import/discovery resume orchestration without caller bypasses or behavior
changes. Full-gate follow-up removed one private trivial forwarding helper.
The exact focused gate passed 10 tests, and final `mix ci` passed 909 backend
tests, 1,507 frontend tests, and every queue, quality, type, Relay, build, and
bundle gate. Catalog Resolver, Listing Persistence, and CJ Candidates
decomposition remain ready.

Before claiming Catalog Resolver Decomposition on 2026-07-23, the coordinator
validated Discussions Resolver Decomposition as a fourth independently
shippable structural successor. The 378-line stable GraphQL resolver combines
public and viewer-scoped community reads with authenticated mutation input,
action, payload, and error handling; its community GraphQL and Dataloader
characterization gate passed 61 tests. Catalog Resolver was therefore claimed
while Listing Persistence, CJ Candidates, and Discussions Resolver
decomposition remain ready.

Catalog Resolver Decomposition then completed on the current detached
worktree. `ProductCompareWeb.Resolvers.CatalogResolver` is now a 65-line
stable facade; `Discovery`, `InputNormalization`, `CurrentAttributes`, and
`SavedComparisons` own the four planned responsibilities without caller
bypasses or behavior changes. Full-gate follow-up consolidated redundant
facade clauses and moved one existing path-scoped Dialyzer baseline with its
unchanged `MapSet.member?/2` call. The exact focused gate passed 100 tests, and
final `mix ci` passed 909 backend tests, 1,507 frontend tests, and every queue,
quality, type, Relay, build, and bundle gate. Listing Persistence, CJ
Candidates, and Discussions Resolver decomposition remain ready.

Listing Persistence Decomposition then completed on the current detached
worktree. `ProductCompare.Ingestion.ListingPersistence` is now a 115-line
stable facade; `Artifacts`, `Products`, `Enrichment`, and `Offers` own the four
planned responsibilities without caller bypasses or behavior changes. The
exact focused gate passed 44 tests, and final `mix ci` passed 913 backend tests
at 83.40% coverage, 1,507 frontend tests, and every queue, quality, type,
Relay, build, and bundle gate.

CJ Candidates Task Decomposition then completed on the current detached
worktree. `Mix.Tasks.ProductCompare.Ingestion.CjCandidates` is now a 36-line
stable facade; `Options`, `StaleReport`, `FitGapReport`,
`ApplicationCohortReport`, and `Output` own normalization, the three supported
reports, and shared safe serialization without caller bypasses or behavior
changes. The first full gate exposed two new exact-copy groups; the final
cleanup restored the ExDNA budget to 6/6. The exact focused gate passed 6
tests, and final `mix ci` passed 913 backend tests at 83.40% coverage, 1,507
frontend tests, and every queue, quality, type, Relay, build, and bundle gate.

Discussions Resolver Decomposition then completed on the current detached
worktree. `ProductCompareWeb.Resolvers.DiscussionsResolver` is now a 60-line
stable facade; `Reads` owns public and viewer-scoped reads, while `Mutations`
owns authenticated input, actions, payloads, and error translation without
caller bypasses or behavior changes. The exact focused gate passed 61 tests,
and final `mix ci` passed 913 backend tests at 83.42% coverage, 1,507 frontend
tests, and every queue, quality, duplication, type, Relay, build, and bundle
gate.

Catalog Filter Metadata Decomposition then completed on the current detached
worktree. `ProductCompare.Catalog.FilterMetadata` is now a 34-line stable
facade; `Query`, `TaxonomyFacets`, `SelectedFilters`, and `AttributeFacets`
own filtering/counts, taxonomy facets, selected-filter normalization, and
attribute aggregation without caller bypasses or behavior changes. The exact
focused gate passed 10 tests, and final `mix ci` passed 913 backend tests at
83.45% coverage, 1,507 frontend tests, and every queue, quality, duplication,
type, Relay, build, and bundle gate.

Community Submissions Decomposition then completed on the current detached
worktree. `ProductCompare.Discussions.Submissions` is now a 47-line stable
facade; `WriteLimits`, `Creates`, `OwnerActions`, and `Reports` own
transactional rate limits, idempotent creation, retained owner lifecycle, and
duplicate-safe reports. The existing `Moderation` boundary now owns the shared
cross-content entropy lookup instead of duplicating it. The exact focused gate
passed 25 tests, and final `mix ci` passed 913 backend tests, 1,507 frontend
tests, and every queue, quality, duplication, type, Relay, build, and bundle
gate.

Community Reads Decomposition then completed on the current detached
worktree. `ProductCompare.Discussions.Reads` is now a 130-line stable facade;
`Legacy`, `PublicContent`, `ViewerSubmissions`, and `Connections` own direct
lists, published content, owner-private projections, and bounded public
connection queries without caller bypasses or behavior changes. The focused
direct, GraphQL, and Dataloader gate passed 98 tests, and final `mix ci` passed
913 backend tests at 83.47% coverage, 1,507 frontend tests, and every queue,
quality, duplication, type, Relay, build, and bundle gate.

## Active Work

None.

## Completed 2026-07-23 Backend Decomposition Work

### 1. Catalog Filter Metadata Decomposition

Status: complete
Lane: Catalog filter metadata decomposition
Plan: `docs/superpowers/plans/2026-07-23-catalog-filter-metadata-decomposition-implementation-plan.md`
Batch outcome: `ProductCompare.Catalog.FilterMetadata.metadata/1` remains the
stable catalog-facing boundary while filtered-product queries, taxonomy
facets, selected attribute-filter normalization, and attribute-facet
aggregation live in focused internal modules with unchanged queries, counts,
ordering, selection, disabled-state, units, and result shapes.
Next action: none; implementation and verification are complete.
Owned paths:

- `lib/product_compare/catalog/filter_metadata.ex`
- `lib/product_compare/catalog/filter_metadata/query.ex`
- `lib/product_compare/catalog/filter_metadata/taxonomy_facets.ex`
- `lib/product_compare/catalog/filter_metadata/selected_filters.ex`
- `lib/product_compare/catalog/filter_metadata/attribute_facets.ex`
- `test/product_compare/catalog/filter_metadata_test.exs`
- `docs/work/catalog-filter-metadata-decomposition.md`

Internal slices:

- Filtered-product query construction and result count.
- Primary-type and use-case taxonomy facet counts and presentation.
- Selected numeric, boolean, and enum filter normalization.
- Numeric ranges, boolean counts, enum counts, and facet presentation.
- Stable metadata facade and exact result parity.

Prerequisites:

- Existing `metadata/1` results, non-map fallback, ordering, selection,
  disabled-state, unit, and empty-facet behavior remain authoritative.
- Preserve omitted-group queries, accepted-current-claim selection, taxonomy
  closure semantics, distinct counts, and query budgets.
- Keep production callers dependent only on `ProductCompare.Catalog` and the
  stable metadata facade; do not change schemas, migrations, filter inputs,
  catalog, taxonomy, specification, GraphQL, Relay, or frontend policy.

Verification:

- `mix test test/product_compare/catalog/filter_metadata_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

Exit condition: the stable metadata facade retains the exact response and
query contract, each implementation responsibility has one focused owner, the
exact 10-test characterization gate and repository gates pass, and no caller
bypasses the facade.

## Completed 2026-07-23 Backend Decomposition Work (continued)

### 2. Community Submissions Decomposition

Status: complete
Lane: Community submissions decomposition
Plan: `docs/superpowers/plans/2026-07-23-community-submissions-decomposition-implementation-plan.md`
Batch outcome: `ProductCompare.Discussions.Submissions` remains the stable
discussion-context boundary while idempotent creation, owner lifecycle
actions, reporting, and shared write-limit persistence live in focused
internal modules with unchanged transactions, ownership, moderation lifecycle,
idempotency, limits, values, and errors.
Next action: none; implementation and verification are complete.
Owned paths:

- `lib/product_compare/discussions/submissions.ex`
- `lib/product_compare/discussions/submissions/write_limits.ex`
- `lib/product_compare/discussions/submissions/creates.ex`
- `lib/product_compare/discussions/submissions/owner_actions.ex`
- `lib/product_compare/discussions/submissions/reports.ex`
- `lib/product_compare/discussions/moderation.ex`
- `test/product_compare/discussions/community_trust_test.exs`
- `docs/work/community-submissions-decomposition.md`

Internal slices:

- Review, question, and answer creation plus idempotent receipts.
- Owner update and retained-removal lifecycle.
- Attributable duplicate-safe reporting.
- Transactional UTC-hour write-limit accounting.
- Stable submissions facade and exact result parity.

Prerequisites:

- Existing stable functions, arguments, results, changesets, atoms,
  transactions, locks, and rollbacks remain authoritative.
- Preserve Global UUID targets, idempotency digests and conflicts, ownership,
  moderation reset, accepted-answer cleanup, report deduplication, and
  committed-only UTC-hour counters.
- Keep `ProductCompare.Discussions` as the only production caller; do not
  change schemas, migrations, limits, authorization, moderation, GraphQL,
  Relay, or frontend policy.

Verification:

- `mix test test/product_compare/discussions/community_trust_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

Exit condition: the stable submissions facade retains the full caller-facing
contract, each implementation responsibility has one focused owner, the exact
25-test characterization gate and repository gates pass, and no caller
bypasses the facade.

## Ready Work

### 3. Commerce Destination URL Decomposition

Status: ready
Lane: Commerce destination URL decomposition
Plan: `docs/superpowers/plans/2026-07-23-commerce-destination-url-decomposition-implementation-plan.md`
Batch outcome: `ProductCompare.CommerceAttribution.DestinationUrl.valid?/1`
remains the stable
commerce-safety boundary while browser-compatible URI parsing and hostname
canonicalization, public-address policy, and RFC 3492 encoding live in focused
internal modules with unchanged accepted and rejected destinations.
Next action: extract the three implementation responsibilities behind the
stable predicate and prove destination and commerce-attribution parity.
Owned paths:

- `lib/product_compare/commerce_attribution/destination_url.ex`
- `lib/product_compare/commerce_attribution/destination_url/parser.ex`
- `lib/product_compare/commerce_attribution/destination_url/address_policy.ex`
- `lib/product_compare/commerce_attribution/destination_url/punycode.ex`
- `test/product_compare/commerce_attribution/destination_url_test.exs`
- `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- `docs/work/commerce-destination-url-decomposition.md`

Internal slices:

- Browser-compatible HTTP(S) URI and authority parsing.
- IDNA separator, percent-decoding, NFKC, and hostname canonicalization.
- IPv4, IPv6, mapped-address, localhost, and reserved-range policy.
- RFC 3492 punycode encoding.
- Stable predicate and schema compatibility parity.

Prerequisites:

- Existing `valid?/1` accepted/rejected values, backslash handling, userinfo
  rejection, port bounds, IDNA normalization, IP parsing, reserved ranges, and
  malformed-input behavior remain authoritative.
- Preserve the current non-goal: no full UTS 46 IDNA mapping layer.
- Keep schema and production callers dependent only on the stable predicate;
  do not add DNS/network resolution, dependencies, schemas, migrations,
  commerce policy, GraphQL, controllers, or frontend behavior.

Verification:

- `mix test test/product_compare/commerce_attribution/destination_url_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

Exit condition: the stable predicate retains the exact destination-safety
contract, each implementation responsibility has one focused owner, the exact
57-test characterization gate and repository gates pass, and no caller
bypasses the facade.

### 5. Accounts Authentication Decomposition

Status: ready
Lane: Accounts authentication decomposition
Plan: `docs/superpowers/plans/2026-07-23-accounts-authentication-decomposition-implementation-plan.md`
Batch outcome: the existing Accounts, `UserAuth`, `ApiTokens`, and
schema-facing `AuthResolver` contracts remain stable while credential,
persisted-token, email-token, API-token, account-action, and API-token resolver
implementations live in focused internal modules.
Next action: extract authentication internals behind the three stable facades
and prove direct Accounts and GraphQL auth parity.
Owned paths:

- `lib/product_compare/accounts/user_auth.ex`
- `lib/product_compare/accounts/user_auth/credentials.ex`
- `lib/product_compare/accounts/user_auth/sessions.ex`
- `lib/product_compare/accounts/user_auth/email_tokens.ex`
- `lib/product_compare/accounts/api_tokens.ex`
- `lib/product_compare/accounts/api_tokens/secrets.ex`
- `lib/product_compare/accounts/api_tokens/authentication.ex`
- `lib/product_compare/accounts/api_tokens/queries.ex`
- `lib/product_compare/accounts/api_tokens/lifecycle.ex`
- `lib/product_compare_web/resolvers/auth_resolver.ex`
- `lib/product_compare_web/resolvers/auth/account_actions.ex`
- `lib/product_compare_web/resolvers/auth/api_tokens.ex`
- `test/product_compare/accounts/`
- `test/product_compare_web/graphql/session_auth_test.exs`
- `test/product_compare_web/graphql/api_token_auth_test.exs`
- `docs/work/accounts-authentication-decomposition.md`

Internal slices:

- Password credential verification, persisted sessions, and email tokens.
- API-token secrets, authentication, reads, and lifecycle.
- GraphQL account and API-token actions.
- Stable facades and caller-path parity.

Prerequisites:

- Preserve every public function, default, guard, value, error, transaction,
  lock, payload, origin check, expiry, delivery hook, and owner scope.
- Keep Phoenix cookie-backed sessions authoritative and test hooks configured
  under `ProductCompare.Accounts.UserAuth`.
- Do not change schemas, migrations, GraphQL SDL, auth policy, email
  transport, Relay, or frontend behavior.

Verification:

- `mix test test/product_compare/accounts test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

Exit condition: all stable authentication facades retain exact behavior,
focused owners hold each implementation responsibility, direct and GraphQL
gates pass, and callers remain on the Accounts and resolver boundaries.

### 6. Specifications Internals Decomposition

Status: ready
Lane: Specifications internals decomposition
Plan: `docs/superpowers/plans/2026-07-23-specifications-internals-decomposition-implementation-plan.md`
Batch outcome: `Specs.Reads`, `Specs.Claims`, and `SpecsResolver` remain stable
facades while artifact, current-attribute, reference-data, claim-workflow, and
resolver implementations live in focused owners with unchanged contracts.
Next action: extract read, claim, and resolver owners and prove direct Specs,
consumer, and GraphQL correction parity.
Owned paths:

- `lib/product_compare/specs/reads.ex`
- `lib/product_compare/specs/reads/artifacts.ex`
- `lib/product_compare/specs/reads/current_attributes.ex`
- `lib/product_compare/specs/reads/reference_data.ex`
- `lib/product_compare/specs/claims.ex`
- `lib/product_compare/specs/claims/proposals.ex`
- `lib/product_compare/specs/claims/imports.ex`
- `lib/product_compare/specs/claims/moderation.ex`
- `lib/product_compare_web/resolvers/specs_resolver.ex`
- `lib/product_compare_web/resolvers/specs/reads.ex`
- `lib/product_compare_web/resolvers/specs/corrections.ex`
- `test/product_compare/specs/`
- `test/product_compare/ingestion/enrichment_test.exs`
- `test/product_compare/catalog/filter_metadata_test.exs`
- `test/product_compare/recommendations_test.exs`
- `test/product_compare_web/graphql/specification_corrections_test.exs`
- `docs/work/specifications-internals-decomposition.md`

Internal slices:

- Artifact, current-attribute, and reference-data reads.
- Proposal, import, and moderation/current-selection claim workflows.
- GraphQL reads and correction actions.
- Stable facades and caller-path parity.

Prerequisites:

- Preserve every function, default, guard, result, error, query, order,
  preload, budget, transaction, lock, typed value, fingerprint, and Global ID.
- Keep `ProductCompare.Specs` as the only application-facing context.
- Do not change schemas, migrations, GraphQL SDL, domain policy, ingestion,
  Relay, or frontend behavior.

Verification:

- `mix test test/product_compare/specs test/product_compare/ingestion/enrichment_test.exs test/product_compare/catalog/filter_metadata_test.exs test/product_compare/recommendations_test.exs test/product_compare_web/graphql/specification_corrections_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

Exit condition: the three stable facades retain exact read, claim, and
resolver behavior, focused owners hold each responsibility, and all direct
and consumer gates pass without caller bypasses.

### 7. Commerce Attribution Internals Decomposition

Status: ready
Lane: Commerce attribution internals decomposition
Plan: `docs/superpowers/plans/2026-07-23-commerce-attribution-internals-decomposition-implementation-plan.md`
Batch outcome: `Clicks`, `Conversions`, `Revenue`, and
`CommerceAttributionResolver` remain stable facades while their link,
destination, session, redirect, attribution, persistence, purchase-fact,
revenue, and resolver workflows live in focused internal modules.
Next action: after Destination URL completion, extract the commerce workflow
owners and prove direct, controller, and GraphQL parity.
Owned paths:

- `lib/product_compare/commerce_attribution/clicks.ex`
- `lib/product_compare/commerce_attribution/clicks/`
- `lib/product_compare/commerce_attribution/conversions.ex`
- `lib/product_compare/commerce_attribution/conversions/`
- `lib/product_compare/commerce_attribution/revenue.ex`
- `lib/product_compare/commerce_attribution/revenue/`
- `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`
- `lib/product_compare_web/resolvers/commerce_attribution/`
- `test/product_compare/commerce_attribution/`
- `test/product_compare_web/controllers/commerce_click_controller_test.exs`
- `test/product_compare_web/graphql/commerce_attribution_test.exs`
- `docs/work/commerce-attribution-internals-decomposition.md`

Internal slices:

- Commerce links, destinations, click sessions, and redirects.
- Conversion attribution, persistence, and purchase facts.
- Revenue filters, aggregation, and projection.
- GraphQL reads and mutations.
- Stable facades and caller-path parity.

Prerequisites:

- Complete Commerce Destination URL decomposition first.
- Preserve every public function, value, error, conflict, transaction,
  destination, redirect, attribution dimension, query, suppression rule, and
  GraphQL payload.
- Do not change schemas, migrations, providers, GraphQL SDL, controllers,
  Relay, frontend behavior, or product policy.

Verification:

- `mix test test/product_compare/commerce_attribution test/product_compare_web/controllers/commerce_click_controller_test.exs test/product_compare_web/graphql/commerce_attribution_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

Exit condition: all four stable commerce facades retain exact behavior,
focused owners hold each responsibility, all named gates pass, and callers
remain on the public context and schema-facing resolver.

### 8. Affiliate Resolver Decomposition

Status: ready
Lane: Affiliate resolver decomposition
Plan: `docs/superpowers/plans/2026-07-23-affiliate-resolver-decomposition-implementation-plan.md`
Batch outcome: `AffiliateResolver` remains schema-facing while active-coupon
reads and operator mutations live in focused owners with unchanged callback,
authorization, payload, and error behavior.
Next action: extract read and mutation owners and prove direct Affiliate and
GraphQL workflow parity.
Owned paths:

- `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- `lib/product_compare_web/resolvers/affiliate/reads.ex`
- `lib/product_compare_web/resolvers/affiliate/mutations.ex`
- `test/product_compare/affiliate/`
- `test/product_compare_web/graphql/affiliate_workflows_test.exs`
- `docs/work/affiliate-resolver-decomposition.md`

Internal slices:

- Public, nested, and operator-scoped coupon reads.
- Network, program, link, and coupon mutations.
- Stable resolver wrappers and schema-call parity.

Prerequisites:

- Preserve every callback, clause, result, authorization decision, Global ID
  rule, connection argument, payload, and error.
- Keep schema files dependent only on `AffiliateResolver`.
- Do not change Affiliate behavior, schemas, migrations, GraphQL SDL, Relay,
  or frontend behavior.

Verification:

- `mix test test/product_compare/affiliate test/product_compare_web/graphql/affiliate_workflows_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

Exit condition: the stable resolver retains its full schema contract, read and
mutation owners are focused, all named gates pass, and schema callers do not
bypass the facade.

### 9. Pricing Resolver Decomposition

Status: ready
Lane: Pricing resolver decomposition
Plan: `docs/superpowers/plans/2026-07-23-pricing-resolver-decomposition-implementation-plan.md`
Batch outcome: `PricingResolver` remains schema-facing while merchant, offer,
and evidence reads live in focused owners with unchanged callbacks, queries,
pagination, and errors.
Next action: extract merchant, offer, and evidence owners and prove pricing
query and merchant-detail parity.
Owned paths:

- `lib/product_compare_web/resolvers/pricing_resolver.ex`
- `lib/product_compare_web/resolvers/pricing/merchants.ex`
- `lib/product_compare_web/resolvers/pricing/offers.ex`
- `lib/product_compare_web/resolvers/pricing/evidence.ex`
- `test/product_compare_web/graphql/pricing_queries_test.exs`
- `test/product_compare_web/graphql/merchant_detail_test.exs`
- `docs/work/pricing-resolver-decomposition.md`

Internal slices:

- Merchant collections, detail, summaries, and scoped offers.
- Product and merchant-product offers, price facts, truth, and history.
- Source-artifact evidence resolution.
- Stable resolver wrappers and schema-call parity.

Prerequisites:

- Preserve every callback, clause, result, order, filter, pagination rule,
  loader key, direct fallback, query budget, and invalid-ID error.
- Keep schema files dependent only on `PricingResolver`.
- Do not change Pricing or Specs behavior, schemas, migrations, GraphQL SDL,
  Relay, or frontend behavior.

Verification:

- `mix test test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/merchant_detail_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

Exit condition: the stable resolver retains exact merchant, offer, and
evidence behavior, focused owners hold each responsibility, all named gates
pass, and schema callers do not bypass the facade.

### 10. Alerts Resolver Decomposition

Status: ready
Lane: Alerts resolver decomposition
Plan: `docs/superpowers/plans/2026-07-23-alerts-resolver-decomposition-implementation-plan.md`
Batch outcome: `AlertsResolver` remains schema-facing while owner-scoped
reads, watch lifecycle actions, and event actions live in focused owners with
unchanged callbacks and payloads.
Next action: extract read, watch-mutation, and event-mutation owners and prove
direct Alerts and GraphQL alert parity.
Owned paths:

- `lib/product_compare_web/resolvers/alerts_resolver.ex`
- `lib/product_compare_web/resolvers/alerts/reads.ex`
- `lib/product_compare_web/resolvers/alerts/watch_mutations.ex`
- `lib/product_compare_web/resolvers/alerts/event_mutations.ex`
- `test/product_compare/alerts/`
- `test/product_compare_web/graphql/price_watches_and_alerts_test.exs`
- `docs/work/alerts-resolver-decomposition.md`

Internal slices:

- Owner-scoped watch and event connections.
- Price-watch create, update, and delete actions.
- Alert-event read and dismiss actions.
- Stable resolver wrappers and schema-call parity.

Prerequisites:

- Preserve every callback, clause, owner check, Global ID rule, connection
  argument, value, payload, and error.
- Keep schema files dependent only on `AlertsResolver`.
- Do not change Alerts behavior, schemas, migrations, GraphQL SDL, Relay, or
  frontend behavior.

Verification:

- `mix test test/product_compare/alerts test/product_compare_web/graphql/price_watches_and_alerts_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

Exit condition: the stable resolver retains exact read and mutation behavior,
focused owners hold all three responsibilities, all named gates pass, and
schema callers do not bypass the facade.

## Completed 2026-07-20 Cross-Stack Work

### 1. Durable Ingestion Recurrence

Status: complete
Lane: Durable ingestion recurrence
Plan: `docs/superpowers/plans/2026-07-20-durable-ingestion-recurrence-implementation-plan.md`
Batch outcome: scheduled CJ imports and feed discovery deduplicate within one
explicit schedule window while the same normalized scope remains runnable in
later windows.
Next action: none; implementation and verification are complete.
Owned paths:

- `lib/product_compare/ingestion/jobs/cj_product_import_worker.ex`
- `lib/product_compare/ingestion/jobs/cj_feed_discovery_worker.ex`
- `lib/product_compare/ingestion/scheduler_support.ex`
- `lib/product_compare/ingestion/cj_product_import_scheduler.ex`
- `lib/product_compare/ingestion/cj_feed_discovery_scheduler.ex`
- `test/product_compare/ingestion/jobs/durable_jobs_test.exs`
- `test/product_compare/ingestion/cj_product_import_scheduler_test.exs`
- `test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`
- `docs/work/durable-ingestion-recurrence.md`

Internal slices:

- Same-window conflict and later-window insertion identity for both workers.
- Stable scheduler windows with an injectable clock.
- Recurrence, cursor, retry, normalization, and redaction regression evidence.

Prerequisites:

- Existing Oban migration, ingestion queue, and normalized argument contract.
- Accepted 2026-07-13 durable-ingestion design and 2026-07-20 cross-stack design.
- Deferred ingestion dashboard/operator and eBay work remain excluded.

Verification:

- `mix test test/product_compare/ingestion/jobs/durable_jobs_test.exs test/product_compare/ingestion/cj_product_import_scheduler_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

Exit condition: same-window duplicates resolve to one Oban job, a later window
creates a distinct job for the same scope, both schedulers pass stable windows,
and focused plus repository gates pass.

### 2. Alert Lifecycle Reliability

Status: complete
Lane: Alert lifecycle reliability
Plan: `docs/superpowers/plans/2026-07-20-alert-lifecycle-reliability-implementation-plan.md`
Batch outcome: every persisted price observation evaluates every applicable
watch asynchronously, and the alert interface presents truthful timestamps plus
row-local pending and failure state.
Next action: none; implementation and verification are complete.
Owned paths:

- `lib/product_compare/alerts.ex`
- `lib/product_compare/alerts/jobs/alert_evaluation_worker.ex`
- `test/product_compare/alerts/alerts_test.exs`
- `test/product_compare_web/graphql/price_watches_and_alerts_test.exs`
- `assets/src/routes/account/alerts/alerts-view-data.ts`
- `assets/src/routes/account/alerts/AlertsRoute.tsx`
- `assets/test/routes/account/alerts/alerts-view-data.test.ts`
- `assets/test/routes/account/alerts/alerts.route.test.tsx`
- `docs/work/alert-lifecycle-reliability.md`

Internal slices:

- Full watch evaluation with deterministic failure aggregation.
- Strict alert observation labels.
- Row-scoped alert/watch mutation feedback.

Prerequisites:

- Price-point persistence and Oban enqueue remain atomic.
- Existing watch locks, event uniqueness, cooldown, and delivery-attempt models.
- Existing strict GraphQL DateTime helpers remain the sole frontend date policy.

Verification:

- `mix test test/product_compare/alerts/alerts_test.exs test/product_compare_web/graphql/price_watches_and_alerts_test.exs`
- `cd assets && bun x vitest run test/routes/account/alerts/alerts-view-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
- `cd assets && bun run check`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

Exit condition: one failed watch cannot prevent later watches from evaluating,
retries cannot duplicate successful events, invalid timestamps cannot produce
false labels, and frontend action state stays on the affected row.

### 3. Community Content Lifecycle

Status: complete
Lane: Community content lifecycle
Plan: `docs/superpowers/plans/2026-07-20-community-content-lifecycle-implementation-plan.md`
Batch outcome: authenticated reviews, questions, and answers have a complete
owner-controlled, abuse-resistant lifecycle through durable backend policy,
typed GraphQL, and accessible Relay controls.
Next action: none; implementation and verification are complete.
Owned paths:

- `priv/repo/migrations/20260720120000_add_community_write_controls.exs`
- `lib/product_compare_schemas/discussions/community_write_receipt.ex`
- `lib/product_compare_schemas/discussions/community_write_window.ex`
- `lib/product_compare_schemas/discussions/product_review.ex`
- `lib/product_compare_schemas/discussions/product_thread.ex`
- `lib/product_compare_schemas/discussions/thread_post.ex`
- `lib/product_compare/discussions.ex`
- `lib/product_compare_web/schema.ex`
- `lib/product_compare_web/resolvers/discussions_resolver.ex`
- `lib/product_compare_web/graphql/errors.ex`
- `config/config.exs`
- `config/test.exs`
- `test/product_compare/discussions/community_trust_test.exs`
- `test/product_compare/discussions/product_review_immutability_test.exs`
- `test/product_compare/discussions/thread_crud_test.exs`
- `test/product_compare/discussions/thread_post_validation_test.exs`
- `test/product_compare_web/graphql/community_content_test.exs`
- `test/product_compare_web/graphql/schema_snapshot_test.exs`
- `assets/schema.graphql`
- `assets/src/routes/products/queries/SubmitProductReviewMutation.ts`
- `assets/src/routes/products/queries/AskProductQuestionMutation.ts`
- `assets/src/routes/products/queries/AnswerProductQuestionMutation.ts`
- `assets/src/routes/products/queries/UpdateProductReviewMutation.ts`
- `assets/src/routes/products/queries/UpdateProductQuestionMutation.ts`
- `assets/src/routes/products/queries/UpdateProductAnswerMutation.ts`
- `assets/src/routes/products/queries/RemoveCommunityContentMutation.ts`
- `assets/src/routes/products/queries/ProductCommunityQuery.ts`
- `assets/src/routes/products/queries/ProductQuestionAnswersQuery.ts`
- `assets/src/routes/products/product-community-data.ts`
- `assets/src/routes/products/ProductCommunityPanel.tsx`
- `assets/test/routes/products/product-community-data.test.ts`
- `assets/test/routes/products/product-community-panel.test.tsx`
- `assets/src/__generated__/SubmitProductReviewMutation.graphql.ts`
- `assets/src/__generated__/AskProductQuestionMutation.graphql.ts`
- `assets/src/__generated__/AnswerProductQuestionMutation.graphql.ts`
- `assets/src/__generated__/UpdateProductReviewMutation.graphql.ts`
- `assets/src/__generated__/UpdateProductQuestionMutation.graphql.ts`
- `assets/src/__generated__/UpdateProductAnswerMutation.graphql.ts`
- `assets/src/__generated__/RemoveCommunityContentMutation.graphql.ts`
- `assets/src/__generated__/ProductCommunityQuery.graphql.ts`
- `assets/src/__generated__/ProductQuestionAnswersQuery.graphql.ts`
- `docs/work/community-content-lifecycle.md`

Internal slices:

- Durable write receipts, UTC-hour counters, and retained removal state.
- Owner update/remove, idempotency, limits, and accepted-answer cleanup.
- Typed GraphQL mutations, errors, viewer capabilities, and schema snapshot.
- Relay idempotency plus owner edit/remove controls.

Prerequisites:

- Approved community limits and lifecycle policy in the 2026-07-20 design.
- Existing published-only public reads and operator moderation remain intact.
- Browser community writes remain GraphQL-only over `/api/graphql`.

Verification:

- `mix test test/product_compare/discussions test/product_compare_web/graphql/community_content_test.exs test/product_compare_web/graphql/schema_snapshot_test.exs`
- `cd assets && bun run relay`
- `cd assets && bun x vitest run test/routes/products/product-community-data.test.ts test/routes/products/product-community-panel.test.tsx`
- `cd assets && bun run check`
- `mix typecheck`
- `mix format --check-formatted`
- `mix ci`
- `git diff --check`

Exit condition: owner lifecycle, audit retention, idempotent replay/conflict,
exact rate boundaries, typed errors, accepted-answer cleanup, schema/Relay
artifacts, and accessible owner controls all pass behavior coverage.

### 4. Relay Cursor Forward Progress

Status: complete
Lane: Frontend cursor forward progress
Plan: `docs/superpowers/plans/2026-07-20-relay-cursor-forward-progress-implementation-plan.md`
Batch outcome: every in-scope frontend Relay pagination surface suppresses
blank or repeated cursors, preventing self-links and repeated stateful fetches.
Next action: none; implementation and verification are complete.
Owned paths:

- `assets/src/routes/relay-pagination.ts`
- `assets/test/routes/relay-pagination.test.ts`
- `assets/src/routes/products/product-community-data.ts`
- `assets/src/routes/products/ProductCommunityPanel.tsx`
- `assets/test/routes/products/product-community-data.test.ts`
- `assets/test/routes/products/product-community-panel.test.tsx`
- `assets/src/routes/compare/compare-picker-data.ts`
- `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
- `assets/test/routes/compare/compare-picker-data.test.ts`
- `assets/test/routes/compare/compare.route.test.tsx`
- `assets/src/routes/products/product-offer-panel-data.ts`
- `assets/src/routes/products/ProductOfferPanel.tsx`
- `assets/test/routes/products/product-offer-panel-data.test.ts`
- `assets/test/routes/products/detail.route.test.tsx`
- `assets/src/routes/catalog/paths.ts`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `assets/src/routes/offers/offer-discovery-filter-data.ts`
- `assets/test/routes/offers/offer-discovery-filter-data.test.ts`
- `assets/test/routes/offers/offer-discovery.route.test.tsx`
- `assets/src/routes/categories/category-view-data.ts`
- `assets/src/routes/categories/CategoryRoute.tsx`
- `assets/src/routes/categories/loader.ts`
- `assets/test/routes/categories/category-view-data.test.ts`
- `assets/test/routes/categories/category.route.test.tsx`
- `assets/src/routes/merchants/pagination.ts`
- `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
- `assets/test/routes/merchants/merchant-directory-view-data.test.ts`
- `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- `assets/src/routes/merchants/detail/merchant-detail-view-data.ts`
- `assets/src/routes/merchants/detail/MerchantDetailRoute.tsx`
- `assets/src/routes/merchants/detail/loader.ts`
- `assets/test/routes/merchants/merchant-detail-view-data.test.ts`
- `assets/test/routes/merchants/merchant-detail.route.test.tsx`
- `assets/src/routes/account/api-tokens/api-token-route-data.ts`
- `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- `assets/test/routes/account/api-tokens/api-token-route-data.test.ts`
- `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `assets/src/routes/affiliate/setup/pagination.ts`
- `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- `docs/work/frontend-cursor-forward-progress.md`

Internal slices:

- Shared invariant plus community review/question/answer pagination.
- Stateful compare-picker and product-offer pagination.
- Public URL pagination for catalog, offers, categories, and merchants.
- Account/setup URL pagination for API tokens and affiliate merchants.

Prerequisites:

- Saved-comparison and snapshot-history cursor contracts remain reference behavior.
- Cursor values remain exact; whitespace is only a validity check.
- Deferred feed-candidate operator surfaces stay out of scope.

Verification:

- All focused suites named in the linked plan.
- `cd assets && bun run typecheck`
- shared-helper dependency scan
- `cd assets && bun run check`
- `mix work_queue.validate`
- `git diff --check`

Exit condition: every in-scope surface rejects blank and non-advancing cursors
while preserving normal pagination, URL state, Relay timing, and presentation.

### 5. Bounded Merchant GraphQL Reads

Status: complete
Lane: Bounded merchant GraphQL reads
Plan: `docs/superpowers/plans/2026-07-20-bounded-merchant-graphql-reads-implementation-plan.md`
Batch outcome: merchant detail summaries requested through a GraphQL connection
use set-based reads whose query count remains constant as merchant parent count
increases.
Next action: none; implementation and verification are complete.
Owned paths:

- `lib/product_compare/pricing.ex`
- `lib/product_compare_web/graphql/loader.ex`
- `test/product_compare/pricing/pricing_test.exs`
- `test/product_compare/pricing/merchant_detail_test.exs`
- `test/product_compare_web/graphql/dataloader_batching_test.exs`
- `test/product_compare_web/graphql/merchant_detail_test.exs`
- `docs/work/bounded-merchant-graphql-reads.md`

Internal slices:

- Set-based active-offer and latest-price merchant detail read model.
- Dataloader delegation and constant query-budget regression.

Prerequisites:

- Existing OfferTruth freshness and eligibility semantics.
- Existing Merchant `detailSummary` GraphQL shape remains unchanged.
- Active offers must be complete independent of Relay page size.

Verification:

- `mix test test/product_compare/pricing/pricing_test.exs test/product_compare/pricing/merchant_detail_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs test/product_compare_web/graphql/merchant_detail_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

Exit condition: single- and multi-merchant summaries remain semantically equal
to the current contract and relevant SELECT counts stay fixed as parent count
grows.

### 6. Account And Setup Interaction Contracts

Status: complete
Lane: Frontend account and setup interaction contracts
Plan: `docs/superpowers/plans/2026-07-20-account-setup-interaction-contracts-implementation-plan.md`
Batch outcome: authenticated setup and account surfaces derive deterministic
merchant-context copy and API-token lifecycle actions from framework-free
owners without changing forms, mutations, accessibility, or presentation.
Next action: none; implementation and verification are complete.
Owned paths:

- `assets/src/routes/affiliate/setup/affiliate-setup-data.ts`
- `assets/src/routes/affiliate/setup/AffiliateSetupForms.tsx`
- `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- `assets/test/routes/affiliate/setup/affiliate-setup-data.test.ts`
- `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- `assets/src/routes/account/api-tokens/api-token-route-data.ts`
- `assets/src/routes/account/api-tokens/ApiTokenItem.tsx`
- `assets/test/routes/account/api-tokens/api-token-route-data.test.ts`
- `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `docs/work/frontend-account-setup-presentation-contracts.md`

Internal slices:

- Affiliate selected/current merchant-context copy.
- API-token lifecycle action visibility, disabled state, and pending copy.

Prerequisites:

- Existing affiliate and API-token characterization suites remain the baseline.
- Normal-path copy and row-scoped API-token mutual exclusion stay stable.
- React retains Relay, forms, refs, callbacks, markup, and styling.

Verification:

- `cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup-data.test.ts test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `cd assets && bun run typecheck`
- pure-module dependency scans
- `cd assets && bun run check`
- `mix work_queue.validate`
- `git diff --check`

Exit condition: both policy slices pass focused and combined frontend gates as
one independently reviewable account/setup outcome.

### 7. Comparison Interaction Correctness

Status: complete
Lane: Comparison interaction correctness
Plan: `docs/superpowers/plans/2026-07-20-comparison-interaction-correctness-implementation-plan.md`
Batch outcome: comparison observations use strict temporal truth and snapshot
revocation pending/failure state applies only to the affected snapshot row.
Next action: none; implementation and verification are complete.
Owned paths:

- `assets/src/routes/compare/decision-summary-data.ts`
- `assets/src/routes/compare/loader.ts`
- `assets/test/routes/compare/decision-summary-data.test.ts`
- `assets/src/routes/compare/share-comparison-data.ts`
- `assets/src/routes/compare/ShareComparisonControl.tsx`
- `assets/test/routes/compare/share-comparison-data.test.ts`
- `assets/test/routes/compare/compare.route.test.tsx`
- `docs/work/comparison-interaction-correctness.md`

Internal slices:

- Strict comparison recency labels and most-recent observation selection.
- Row-scoped snapshot revocation pending, duplicate, and failure state.

Prerequisites:

- Existing strict GraphQL DateTime helpers remain the sole date policy.
- Valid observation ordering and labels remain unchanged.
- Successful snapshot mutation handling and accessibility remain stable.

Verification:

- `cd assets && bun x vitest run test/routes/compare/decision-summary-data.test.ts test/routes/compare/share-comparison-data.test.ts test/routes/compare/compare.route.test.tsx`
- `cd assets && bun run typecheck`
- `cd assets && bun run check`
- `mix work_queue.validate`
- `git diff --check`

Exit condition: invalid timestamps cannot win recency selection or produce false
labels, and one snapshot action cannot disable, relabel, or leak errors to
another row.

## Needs Decision Work

None. Shopper decision confidence was selected on 2026-07-09.

## Blocked Work

None.

## Just Completed

Bounded comparison root GraphQL reads are complete. Catalog now projects
multiple slug selections from one canonical lookup, Recommendations projects
multiple profile requests from one shared evidence snapshot, and both public
root fields use one request-scoped comparison source. Two- and four-alias
responses preserve exact product positions, errors, rankings, reasons, and
evidence IDs while the tracked SELECT budget stays fixed. The focused suites
passed 59 tests; the full repository gate passes with 856 backend tests and
1,507 frontend tests, and the queue retains three ready rows.

The seven-batch 2026-07-20 cross-stack correctness program is complete. Durable
ingestion now recurs across stable schedule windows; alert evaluation is fault-
isolated with strict dates and row-local actions; community content has durable
owner lifecycle, idempotency, rate limits, and Relay controls; every in-scope
frontend pagination surface requires forward cursor progress; merchant summary
GraphQL reads are set-based; account/setup policy lives in framework-free data
owners; and comparison timestamps plus snapshot actions are row-correct. The
fresh full gate passed 790 backend tests, 1,505 frontend tests, type/format/
static-analysis checks, Relay generation, client and SSR builds, and the bundle
budget. Detailed evidence remains in the seven lane docs retained under
`Completed 2026-07-20 Cross-Stack Work` above.

Route-metadata tag policy data completed on 2026-07-17. The framework-free
route-metadata data owner now projects exact robots and Twitter-card values
from normalized indexability and image facts. React retains route-match
access, canonical, Open Graph, image, structured-data, markup, and router
behavior. Its pure and component suites passed 12 tests; TypeScript, recursive
dependency, consumer, and diff checks are recorded in
`docs/work/frontend-route-metadata-tag-policy-data.md`.

Price-watch amount-field data completed on 2026-07-17. The framework-free
price-watch data owner now projects amount-field visibility and exact label
copy for all four supported rule types. React retains input construction,
mutation orchestration, product-scoped form reset, markup, and presentation.
Its pure and alert-route suites passed 30 tests; TypeScript, recursive
dependency, consumer, and diff checks are recorded in
`docs/work/frontend-price-watch-amount-field-data.md`.

API-token status badge data completed on 2026-07-17. The framework-free API-
token route-data owner now projects the positive active tone and neutral
revoked/expired tone alongside the existing lifecycle label, preserving
revocation precedence. React retains timestamps, actions, mutations,
StatusBadge markup, and presentation. Its pure and route suites passed 87
tests; TypeScript, recursive dependency, consumer, and diff checks are
recorded in `docs/work/frontend-api-token-status-badge-data.md`.

Product review row-display data completed on 2026-07-17. The framework-free
product-community data owner now projects explicit or rating-fallback titles,
one-through-five star copy, and verified or unverified author copy from a
structural facts type. React retains review bodies, list markup, forms,
pagination, mutations, generated Relay types, and presentation. Its pure and
panel suites passed 23 tests; TypeScript, recursive dependency, consumer, and
diff checks are recorded in
`docs/work/frontend-product-review-row-display-data.md`.

Offer discovery scope-badge data completed on 2026-07-17. The framework-free
offer filter-data owner now projects the Active offers/positive and All
offers/neutral badge contract from the canonical active-only filter state.
React retains filtering, offer ordering, StatusBadge markup, and presentation.
Its pure and route suites passed 75 tests; TypeScript, recursive dependency,
consumer, and diff checks are recorded in
`docs/work/frontend-offer-discovery-scope-badge-data.md`.

Recommendation query-input data completed on 2026-07-17. The framework-free
recommendation route-data owner now projects ordered copied GraphQL variables,
both existing profile enums, and a structured reset identity that cannot alias
distinct delimiter-containing slug lists. React retains Relay, fetch policy,
Suspense, error fallback, profile links, markup, and presentation. Its pure and
panel suites passed 33 tests; TypeScript, recursive dependency, consumer, and
diff checks are recorded in
`docs/work/frontend-recommendation-query-input-data.md`.

Auth global-error visibility data completed on 2026-07-17. The framework-free
auth errors owner now selects missing, null, blank, and unknown-field errors
for the global list while excluding errors rendered by named fields and
preserving source order. React retains field rendering, error markup,
accessibility behavior, and presentation. Its canonical viewer type now comes
directly from the pure viewer-data owner instead of the route loader. Its pure
and form-shell suites passed 10 tests; TypeScript, recursive dependency,
consumer, and diff checks are recorded in
`docs/work/frontend-auth-global-error-visibility-data.md`.

Alert watch-toggle control data completed on 2026-07-17. The framework-free
alerts view-data owner now projects the next enabled state and Pause/Resume
copy. React retains generated types, mutation orchestration and shape,
grouping, pending state, markup, and presentation. Its pure and route suites
passed 19 tests; TypeScript, dependency, consumer, and diff checks are recorded
in `docs/work/frontend-alert-watch-toggle-control-data.md`.

Saved comparison card display data completed on 2026-07-17. The framework-free
saved view-state owner now projects singular, plural, and zero product-count
copy plus ordered product-name copy that preserves duplicates. React retains
links, delete actions, markup, and presentation. Its pure and route-state
suites passed 55 tests; TypeScript, dependency, consumer, and diff checks are
recorded in `docs/work/frontend-saved-comparison-card-display-data.md`.

Compare specification-mode navigation data completed on 2026-07-17. The new
framework-free mode-data owner now projects ordered Shared specs, Differences,
and All specs rows with canonical destinations and exactly one current state,
while preserving selected-slug order and omitting the shared-mode `specs`
parameter. `CompareRoute` still owns Radix tabs, links, panels, children,
markup, and presentation. Its pure and route suites passed 111 tests;
TypeScript, consumer, dependency, and diff checks are recorded in
`docs/work/frontend-compare-spec-mode-navigation-data.md`.

API-token status-filter navigation data completed on 2026-07-17. The
framework-free route-data owner now projects ordered All, Active, and Revoked
rows with canonical destinations and exactly one current state. The React
owner still controls link rendering, accessibility attributes, route behavior,
markup, and presentation. Its pure and route suites passed 81 tests;
TypeScript, consumer, dependency, and diff checks are recorded in
`docs/work/frontend-api-token-status-filter-navigation-data.md`.

Comparison snapshot pagination cursor data completed on 2026-07-17. The
framework-free share-comparison data owner now accepts only a non-empty,
advancing cursor when Relay explicitly reports a next page; missing or
incomplete page info, false flags, blank cursors, and repeated cursors produce
no action. The React owner still owns Relay variables, page accumulation,
actions, markup, and presentation. Its pure and snapshot route suites passed
39 tests; TypeScript, dependency, and diff checks are recorded in
`docs/work/frontend-comparison-snapshot-pagination-cursor-data.md`.

Affiliate coupon result display data completed on 2026-07-17. The framework-
free affiliate setup data owner now projects deterministic amount, percent,
free-shipping, other, incomplete, and unknown discount copy, while the React
form retains generated GraphQL result types, mutation orchestration, identity,
markup, and presentation. A review follow-up characterized independently
incomplete, blank, and nullish coupon facts without a production change. The
pure and route suites passed 50 tests; TypeScript, dependency scans, the full
1,408-test frontend gate, 596,262 raw / 182,104 gzip-byte bundle contract, and
queue validation are recorded in
`docs/work/frontend-affiliate-coupon-result-display-data.md`.

Root viewer projection completed on 2026-07-17. One framework-free owner now
validates and projects both query and cached viewer values; focused pure and
root-route coverage, TypeScript, dependency scans, the full 1,395-test frontend
gate, and queue validation are recorded in
`docs/work/frontend-root-viewer-projection.md`.

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
Treat a row as one independently shippable reviewer outcome. Group candidates that enforce the same invariant and share one acceptance boundary.
Keep per-surface, per-file, path-disjoint, or test-sized work as internal slices with focused milestone commits; do not count slices as ready rows.
If a numeric request or the ready floor exceeds the coherent source-backed batch set, return the smaller truthful set and record the decision needed for more work instead of creating micro-batches.
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
Treat the row's internal slices as one batch status. Use slice-level tests and milestone commits without promoting or closing slices as standalone queue rows.
Update the lane work doc as the batch changes.
Do not edit coordinator-owned docs unless the ready row names them under Owned paths.
Stop if the row is blocked, stale, or needs a decision.
If the claim guard is not satisfied, stop and hand off to the coordinator for replenishment.
```

## Completed Work

Completed lane summaries remain in their lane work docs under `docs/work/*.md`.
Dated implementation plans remain under `docs/plans/`. They are historical
reference unless this queue links one as the active plan for a `ready` row.
