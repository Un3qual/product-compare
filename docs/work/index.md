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

Updated: 2026-07-17

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

## Active Work

None.

## Ready Work

### 1. Feed-Candidate Pagination Data Contract

Status: ready
Lane: Frontend feed-candidate pagination data
Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`
Next action: move first-page and next-page link visibility and path projection
out of `FeedCandidateReviewList` into its existing framework-free review-data
owner while preserving the existing first/next path builders and keeping
pagination markup and labels in React.
Owned paths:

- `assets/src/routes/ingestion/feed-candidates/feed-candidate-review-data.ts`
- `assets/src/routes/ingestion/feed-candidates/FeedCandidateReviewList.tsx`
- `assets/test/routes/ingestion/feed-candidates/feed-candidate-review-data.test.ts`
- `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `docs/work/frontend-feed-candidate-pagination-data.md`

Prerequisites:

- Existing page-size, review-status, sort, and cursor encoding remain
  unchanged.
- Link visibility remains bounded to Relay previous/next-page state and the
  corresponding current or end cursor.
- Existing feed-candidate review-data and route characterization remains green.

Verification:

- `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidate-review-data.test.ts test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the feed-candidate review-data module
- `git diff --check`

Exit condition: the existing framework-free review-data owner returns exact
first- and next-page hrefs without mutating inputs; React retains `Pagination`
markup, labels, and presentation.

### 2. Merchant Directory Pagination Data Contract

Status: ready
Lane: Frontend merchant-directory pagination data
Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`
Next action: move first-page and next-page link visibility and path projection
out of `MerchantDirectoryRoute` into its existing framework-free pagination
owner while preserving `merchantDirectoryPagePath` as the canonical path
builder and keeping pagination markup and labels in React.
Owned paths:

- `assets/src/routes/merchants/pagination.ts`
- `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
- `assets/test/routes/merchants/merchant-directory-loader.test.ts`
- `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- `docs/work/frontend-merchant-directory-pagination-data.md`

Prerequisites:

- Existing page-size and cursor encoding remain unchanged.
- First-page visibility remains bounded to previous-page state plus a current
  cursor; next-page visibility remains bounded to next-page state plus a non-
  empty end cursor.
- Existing merchant-directory loader and route characterization remains green.

Verification:

- `cd assets && bun x vitest run test/routes/merchants/merchant-directory-loader.test.ts test/routes/merchants/merchant-directory.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the merchant-directory pagination
  module
- `git diff --check`

Exit condition: the existing framework-free pagination owner returns exact
first- and next-page hrefs without mutating inputs; React retains `Pagination`
markup, labels, and presentation.

### 3. Catalog Browse Pagination Data Contract

Status: ready
Lane: Frontend catalog-browse pagination data
Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`
Next action: move first-page and next-page link visibility and path projection
out of `BrowseRoute` into its existing framework-free path owner while
preserving the canonical browse path builders and keeping pagination markup and
labels in React.
Owned paths:

- `assets/src/routes/catalog/paths.ts`
- `assets/src/routes/catalog/BrowseRoute.tsx`
- `assets/test/routes/catalog/paths.test.ts`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `docs/work/frontend-catalog-browse-pagination-data.md`

Prerequisites:

- Existing filter, page-size, cursor, and ordered compare-slug encoding remain
  unchanged.
- First-page visibility remains bounded to a current cursor; next-page
  visibility remains bounded to next-page state plus a non-empty end cursor.
- Existing catalog browse route characterization remains green.

Verification:

- `cd assets && bun x vitest run test/routes/catalog/paths.test.ts test/routes/catalog/browse.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the catalog path module
- `git diff --check`

Exit condition: the existing framework-free path owner returns exact first-
and next-page hrefs without mutating filters or ordered compare slugs; React
retains `Pagination` markup, labels, empty-page recovery behavior, and
presentation.

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
