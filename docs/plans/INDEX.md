# Plan Index

Start at `docs/work/index.md` for live execution status. This file is a catalog
of active and candidate plans, not the dispatch queue.

## Active Architecture Sources

- `ARCHITECTURE.md`
- `docs/plans/2026-03-05-frontend-fullstack-design.md`
- `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- `docs/plans/2026-03-19-frontend-relay-route-data-design.md`
- `docs/superpowers/specs/2026-07-20-cross-stack-ready-work-design.md`

## Active Plan Catalog

Start at `docs/work/index.md` for live dispatch status and ownership. The
2026-06-29 usable-product batch, the product filtering and in-depth comparison
batch, the persistent compare tray follow-up, the CJ read-model plus weekly
operator-runbook batch, and the 2026-07-03 product-facing follow-up batch
completed. The 2026-07-08 product-facing curation batch and the full shopper
decision-confidence batch are also complete.

Shopper decision confidence was selected and completed on 2026-07-09. Deferred
ingestion/eBay/operator candidates remain deferred or rejected.

The 2026-07-10 feature-complete product milestone is also complete. It covered
shopper home and navigation, safe relative loaded-price comparison, saved-set
product labels, explicit revenue-preview positioning, and CJ scheduled
readiness. Email delivery, live conversion-provider ingestion, production
privacy and attribution controls, and production-readiness proof remain outside
that milestone by product decision.

The 2026-07-13 Product Trust and Discovery program is complete. It expanded the
data-product boundary with canonical specification-rich ingestion, complete
and fresh offers, durable ingestion, watches and in-app alerts, public
comparison snapshots, source-backed recommendations, provenance/corrections,
reviews and Q&A, merchant pages, and SEO/acquisition surfaces. The 2026-07-20
cross-stack correctness program over those contracts is also complete.

The user-selected 2026-07-11 bounded-filter, route-foundation, and route-
decomposition batch is complete with full frontend verification. The requested
affiliate-setup and feed-candidate presentation extractions are also complete.
Skip navigation plus the saved-comparison, catalog product-list, and revenue
presentation extractions are complete. API-token controls, compare matrix,
catalog advanced-filter presentation, and offer-discovery card presentation
are also complete. API-token item, product-detail offer-list, root destination,
and compare picker-view presentation completed as the first stack cohort.
Affiliate merchant pagination, merchant-directory view presentation, saved-
comparison pure view state, and credential-auth form presentation are complete
through their dedicated follow-up execution plan.
Product-detail decision actions, revenue-summary view data, specification-
matrix data, and decision-summary data completed on
`codex/frontend-view-contracts` in PR #97. Comparison sharing, product
community, price alerts, and API-token route-state contracts are also complete.
Affiliate setup, offer-discovery filter policy, catalog browse route data,
product-detail route data, compare-picker data, product-offer panel data, and
shared external-destination safety are complete. API-token lifecycle display,
catalog specification-highlight data, recommendation-profile route data,
saved-comparison naming data, merchant visible-page filter data, and price-watch
input data, feed-candidate review view data, and tracked-commerce click data are
also complete. Immutable route-state collection helpers are also complete.
Catalog filter-form state, feed-candidate review mutation data, and offer-
discovery card view data are also complete. Category landing view data, alerts
mutation data, recommendation result view data, and shared route-error view
data are complete. Trust-surface date presentation, product-attribute grouping,
route-metadata resolution, and saved-comparison navigation data are complete.
Product-community, affiliate-setup, and share-comparison mutation outcome data
are complete. Price-watch, tracked-commerce click mutation outcome, reset-
password request, shared-comparison view data, compare-picker visible-option
data, compare-selection tray view data, and verify-email request data are also
complete. API-token, affiliate-setup, and feed-candidate pagination data are
also complete. Merchant-directory pagination data is also complete. Catalog-
browse and offer-discovery pagination data are also complete. Alert product
navigation is also complete. Merchant-directory row data, product-offer
navigation paths, category product navigation, and revenue filter-form data are
complete on `codex/frontend-navigation-row-contracts`. Category pagination
navigation, saved-comparison sort input, offer selected-product context, and
Relay query descriptor identity are also complete. Price-watch rule-type select
input and catalog sort select input are also complete. Root viewer projection
is also complete. Affiliate coupon result display data is also complete; its
review follow-up characterized independently incomplete, blank, and nullish
coupon facts with 50 focused tests and the full 1,408-test frontend gate.
Comparison snapshot pagination cursor data, API-token status-filter navigation
data, and compare specification-mode navigation data (Tasks 64-66) are
complete. Saved Comparison Card Display and Alert Watch-Toggle Control are also
complete. Auth Global Error Visibility, Recommendation Query Input, and Offer
Discovery Scope Badge are also complete. Product Review Row Display is also
complete. API Token Status Badge and Price Watch Amount Field are also
complete. Route Metadata Tag Policy is also complete. Affiliate Merchant
Context Copy, API Token Lifecycle Action Policy, and Product Community Answer
Pagination Cursor were regrouped before execution on 2026-07-18 because they
were implementation slices rather than independently shippable batches. Those
frontend slices were curated with live backend findings and completed inside
seven domain-oriented outcomes on 2026-07-20. Strict temporal and row-scoped
action work remains recorded in the alert and comparison lane docs rather than
being promoted again.

A fresh post-completion resolver audit found five coherent backend outcomes:
bounded product evidence/SEO reads, bounded public community connections,
bounded product-offer/coupon/history connections, bounded merchant-parent
active-offer connections, and bounded owner-private community submission
reads. Product evidence, public community connections, and product-offer/coupon/history
connections are complete. Merchant-parent connections and owner-private
community submission reads are also complete.
The claim-floor audit additionally promoted bounded public Relay node alias
reads after verifying six direct per-alias public lookups and existing
request-scoped Dataloader coverage; that outcome is complete.
A second claim-floor audit promoted bounded category GraphQL reads after
verifying that aliased category lookups each repeat taxon and qualification
queries and that each nested qualified-product connection still runs per
category parent. That reviewer-sized outcome is complete.
A third claim-floor audit promoted bounded public slug GraphQL reads after
verifying that aliased product and merchant entry-point fields still repeat
direct slug lookups. Product canonical/history lookup and merchant identity
share one public-entry acceptance boundary; that outcome is complete.
A fourth claim-floor audit promoted the remaining nullable public opaque-key
entry points after verifying that source-artifact IDs, published-question IDs,
and comparison-snapshot tokens each still trigger direct per-alias reads. Their
source/preload, publication, revocation, hydration, error, and missing-result
rules stayed internal slices of one public-entry read-budget outcome; that
outcome is complete.
A fifth claim-floor audit promoted bounded comparison evidence reads after
verifying that live recommendations and immutable snapshot publication still
repeat offer, specification, and merchant evidence reads per selected product.
Those two surfaces share one two-or-three-product evidence lifecycle and remain
internal slices of one reviewer-sized outcome; that outcome is complete.
A sixth claim-floor audit promoted the remaining authorized Relay node reads
after verifying that four operator-only affiliate types and two owner-scoped
types still query per alias. Their authorization and ownership variants stay
internal slices of one non-public node acceptance boundary.
A seventh claim-floor audit promoted bounded alert evaluation market reads
after verifying that the default evaluator repeats identical product-wide or
triggering-listing offer evidence inside every applicable watch transaction.
The shared market-fact snapshot, required per-watch locks, replay safety,
cooldowns, and partial-failure behavior remain internal slices of one alert
evaluation reliability/performance outcome.
An eighth claim-floor audit promoted bounded comparison root GraphQL reads
after verifying that repeated public comparison-product and recommendation
aliases still execute their bounded slug and recommendation evidence reads
independently. Canonical product selection, recommendation projection, and
request-scoped loading remain internal slices of one public comparison entry
outcome.
A ninth claim-floor audit promoted bounded authorized management GraphQL
connections after verifying that six owner-scoped collections and two
operator-only queues still repeat direct page reads for identical aliases.
Authorization scope, collection kind, filters, connection arguments, and
growing-alias coverage remain internal slices of one non-public connection
outcome; deferred ingestion dashboard work stays closed. Specification-
correction claim-tree loading was not promoted separately because those trees
are already preloaded. The formerly optional loaded-price copy, loaded-product
picker filter, visible-page merchant filter, wildcard 404, and route metadata
work were also verified as already implemented and are not candidate work.
A tenth claim-floor audit promoted bounded catalog and offer-discovery root
GraphQL reads after verifying that `products`, `productFilterMetadata`,
`merchants`, and top-level `merchantProducts` still repeat identical public
discovery reads per alias. That outcome is complete: its independent two/four
alias budgets are products 2/4 to 1/1, filter metadata 6/12 to 3/3, merchants
2/4 to 1/1, and merchant products 2/4 to 1/1 SELECTs. Its exact focused four
suite gate passed 95 tests with 0 failures. Catalog filters and metadata,
merchant-directory pagination, offer filters, nested values, and growing-alias
budgets remained internal slices of one discovery-entry acceptance boundary.
An eleventh claim-floor audit promoted GraphQL schema type decomposition after
verifying that the only project schema module is 2,004 lines and combines root
runtime behavior with 151 type, input, enum, and interface declarations. The
existing byte-for-byte SDL snapshot makes a domain-notation extraction
immediately executable without choosing new product behavior. Root operations,
context, plugins, resolver wiring, and `assets/schema.graphql` remain fixed.
Before claiming the loader decomposition, a twelfth claim-floor audit promoted
Specs context decomposition. The 1,212-line stable facade still combines
definition upserts, typed-value normalization, claim/import workflows,
corrections/moderation, and read projections. Its path-disjoint direct Specs,
ingestion enrichment, catalog filter, and recommendation characterization gate
passed 79 tests, making the extraction executable without new product policy.
Before claiming Discussions context decomposition, a thirteenth claim-floor
audit promoted Ingestion context decomposition. The 1,291-line stable facade
still combines import-run lifecycle, merchant-feed-candidate policy, merchant
identity, and canonical normalized-listing persistence. Its direct ingestion,
enrichment, reconciliation, and merchant-feed-candidate GraphQL
characterization gate passed 60 tests. The structural extraction leaves
provider, scheduling, dashboard, operator, and product policy unchanged.
Before claiming Specs context decomposition, a fourteenth claim-floor audit
promoted Accounts context decomposition. The 721-line stable facade still
combines user provisioning/bootstrap, API-token lifecycle, and reputation
behavior alongside the existing focused `UserAuth` owner. Its direct Accounts,
seed, API-token/session GraphQL, and authorized node characterization gate
passed 112 tests. The extraction preserves the GraphQL auth contract,
cookie-backed session authority, authorization, seeds, and transport scope.
Before claiming Ingestion context decomposition, a fifteenth claim-floor audit
promoted Pricing context decomposition. The 625-line stable facade combines
merchant, offer, price-history, and current offer-truth read implementations;
its direct Pricing, merchant-detail, and GraphQL characterization gate passed
39 tests without changing `OfferTruth` policy.
The same claim-floor audit promoted SEO context decomposition. The 603-line
stable facade combines metadata, category qualification, and sitemap behavior;
its direct SEO, controller, and GraphQL characterization gate passed 13 tests.
Both outcomes are path-disjoint from Ingestion and Accounts, and neither
reopens deferred provider, dashboard, operator, or product-policy work.
Before claiming Accounts context decomposition, a sixteenth claim-floor audit
promoted Alerts context decomposition. The 543-line stable facade combines
watch-rule lifecycle, shared market-fact projection, durable evaluation/event
creation, and owner-scoped inbox behavior; its direct and GraphQL
characterization gate passed 13 tests. The extraction preserves alert policy,
price-point enqueueing, transports, resolver authorization, and frontend
behavior while remaining path-disjoint from Accounts, Pricing, and SEO.
Accounts context decomposition is complete. The 198-line stable facade retains
the public contract while `Users`, `ApiTokens`, and `Reputation` own the
remaining implementations alongside unchanged `UserAuth`. Its exact
characterization gate passes 112 tests, and full `mix ci` passes 905 backend
tests, 1,507 frontend tests, and all repository quality/build gates.
Before claiming Pricing context decomposition, a seventeenth claim-floor audit
promoted Catalog context decomposition. The 482-line stable facade still
combines product/brand lifecycle, identifier and media evidence,
saved-comparison lifecycle, and existing filtering entry points. Its direct and
GraphQL characterization gate passed 106 tests. The structural extraction
leaves catalog, ingestion, taxonomy, GraphQL, and frontend policy unchanged and
is path-disjoint from Pricing, SEO, and Alerts.
Pricing context decomposition is complete. The 161-line stable facade retains
the public contract while `Merchants`, `Offers`, `PriceHistory`, and
`TruthReads` own the four planned implementations and unchanged `OfferTruth`
retains single-offer policy. Its exact characterization gate passes 39 tests,
and full `mix ci` passes 905 backend tests, 1,507 frontend tests, and all
repository quality/build gates.
Before claiming SEO context decomposition, an eighteenth claim-floor audit
promoted Comparison Snapshots context decomposition. The 444-line stable
context still combines owner-scoped lifecycle, immutable evidence capture, and
payload hydration. Its direct and GraphQL characterization gate passed 12
tests. The extraction preserves snapshot, SEO, pricing, recommendation,
privacy, and GraphQL policy and is path-disjoint from SEO, Alerts, and Catalog.
SEO context decomposition is complete. The 71-line stable facade retains the
public contract while `Metadata`, `Categories`, and `Sitemaps` own the three
planned responsibilities. Its exact characterization gate passes 13 tests,
and full `mix ci` passes 905 backend tests at 83.56% coverage, 1,507 frontend
tests, and all repository quality/build gates.
Before claiming Alerts context decomposition, a nineteenth claim-floor audit
promoted Taxonomy context decomposition. The 396-line stable facade still
combines taxonomy registry, taxon hierarchy, use-case assignment, and
category-alias behavior. Its direct Taxonomy and ingestion enrichment
characterization gate passed 13 tests. The structural extraction preserves
taxonomy, catalog, ingestion, SEO, GraphQL, and frontend policy and is
path-disjoint from Alerts, Catalog, and Comparison Snapshots.
Alerts context decomposition is complete. The 73-line stable facade retains
the public contract while `WatchRules`, `MarketFacts`, `Evaluation`, and
`Inbox` own the four planned responsibilities. Its exact characterization
gate passes 13 tests, and full `mix ci` passes 905 backend tests at 83.53%
coverage, 1,507 frontend tests, and all repository quality/build gates.
Catalog context decomposition is complete. The 164-line stable facade retains
the public contract while `Products`, `Evidence`, and `SavedComparisons` own
the three planned responsibilities alongside unchanged `Filtering` and
`FilterMetadata`. Its exact characterization gate passes 106 tests, and full
`mix ci` passes 909 backend tests at 83.53% coverage, 1,507 frontend tests, and
all repository quality/build gates.
Before claiming Catalog context decomposition, a twentieth claim-floor audit
promoted CJ Import task decomposition. The 627-line stable Mix task combines
option and credential normalization, durable single-run imports, and reviewed-
candidate batching behind `run/1` and `run_import/1`; its dedicated
characterization gate passed 19 tests. The structural extraction preserves
provider requests, durable run state, cursor behavior, candidate policy,
credential safety, worker/resume callers, and output while remaining path-
disjoint from Catalog, Comparison Snapshots, and Taxonomy.
Before claiming Comparison Snapshots context decomposition, a twenty-first
claim-floor audit promoted CJ Runs task decomposition. The 600-line stable Mix
task combines CLI and keyword normalization, latest/history/failed reporting,
and import/discovery resume orchestration behind `run/1`, `run_report/1`, and
`run_resume/1`; its dedicated characterization gate passed 10 tests. The
structural extraction preserves queries, readiness checks, cursor behavior,
runner inputs, reports, errors, credential-safe logging, and the operator
runbook while remaining path-disjoint from Comparison Snapshots, Taxonomy, and
CJ Import.
Comparison Snapshots context decomposition is complete. The 42-line stable
facade retains the public contract while `Lifecycle`, `Capture`, and
`PayloadCodec` own lifecycle persistence, immutable evidence projection, and
payload decoding. Legacy and partial recommendation payloads now hydrate absent
optional fields to `nil`. Its exact characterization gate passes 14 tests, the
application caller scan finds no facade bypasses, and full `mix ci` passes all
repository quality, test, and build gates.
Before claiming Taxonomy context decomposition, a twenty-second claim-floor
audit promoted Catalog Resolver decomposition. The 720-line stable GraphQL
resolver combines catalog discovery, input normalization, current-attribute
projection, and saved-comparison behavior behind eight public resolver
callbacks. Its catalog, filter-metadata, saved-comparison,
specification-correction, and Dataloader characterization gate passed 100
tests. The structural extraction preserves schema wiring, loader sources and
keys, query budgets, filter validation, request-local unit caching,
authorization, mutation payloads, and frontend behavior while remaining
path-disjoint from Taxonomy, CJ Import, and CJ Runs.
Taxonomy context decomposition is complete. The 88-line stable facade retains
the public contract while `Taxonomies`, `Hierarchy`, `Assignments`, and
`Aliases` own registry and reads, hierarchy and closure maintenance, use-case
assignments, and category-alias behavior. The two existing path-scoped
`Ecto.Multi` Dialyzer baselines moved with their unchanged hierarchy calls
without adding or broadening a suppression. Its exact characterization gate
passes 13 tests, and full `mix ci` passes 909 backend tests at 83.45% coverage,
1,507 frontend tests, and all repository quality and build gates.
Before claiming CJ Runs task decomposition, a twenty-third claim-floor audit
promoted CJ Candidates task decomposition. The 430-line stable Mix task
combines CLI and keyword normalization, stale reporting, fit-gap reporting,
and application-cohort reporting behind `run/1` and `run_report/1`; its
dedicated characterization gate passed 6 tests. The structural extraction
preserves queries, filters, ordering, output, required-result gates, Global ID
projection, credential safety, the rejected CSV export, and the operator
runbook while remaining path-disjoint from CJ Runs, Catalog Resolver, and
Listing Persistence.
CJ Runs task decomposition is complete. The 33-line stable facade retains the
three public entry points while `Options`, `Reports`, and `Resume` own parsing
and normalization, operator-safe run reporting, and import/discovery resume
orchestration. Full-gate follow-up removed one private trivial forwarding
helper. Its exact characterization gate passes 10 tests, the caller scan finds
no internal-owner bypasses, and full `mix ci` passes 909 backend tests, 1,507
frontend tests, and all repository quality and build gates.
Before claiming Catalog Resolver decomposition, a twenty-fourth claim-floor
audit promoted Discussions Resolver decomposition. The 378-line stable
GraphQL resolver combines public and viewer-scoped community reads with
authenticated mutation input, action, payload, and error handling behind its
schema-facing callbacks. Its community GraphQL and Dataloader characterization
gate passed 61 tests. The structural extraction preserves schema wiring,
loader sources and keys, query budgets, public and owner visibility,
authorization, Global IDs, mutation payloads, moderation, and frontend
behavior while remaining path-disjoint from Catalog Resolver, Listing
Persistence, and CJ Candidates.
Catalog Resolver decomposition is complete. The 65-line stable facade retains
all schema- and type-facing callbacks while `Discovery`,
`InputNormalization`, `CurrentAttributes`, and `SavedComparisons` own the four
planned implementations. Full-gate follow-up consolidated redundant facade
clauses and moved one existing path-scoped Dialyzer baseline with its unchanged
`MapSet.member?/2` call. Its exact characterization gate passes 100 tests, the
caller scan finds no internal-owner bypasses, and full `mix ci` passes 909
backend tests, 1,507 frontend tests, and all repository quality and build
gates.
Commerce Attribution Internals decomposition is complete. The stable click,
conversion, revenue, and schema-facing resolver facades are 29, 16, 34, and
18 lines. Their twelve focused owners preserve all public boundaries,
transactions, attribution conflicts, revenue query and suppression behavior,
authorization, redirects, and GraphQL payloads. The exact focused gate passes
81 tests, caller scans find no facade bypasses, and full `mix ci` passes 913
backend tests at 83.50% coverage, 1,507 frontend tests, and all repository
quality and build gates.
Accounts Authentication decomposition is complete. `UserAuth`, `ApiTokens`,
and `AuthResolver` are 69-, 66-, and 87-line stable facades over nine focused
credential, user-token, API-token, and GraphQL owners. The exact focused gate
passes 87 tests, caller scans find no internal-owner or schema bypasses, and
full `mix ci` passes 913 backend tests at 83.48% coverage, 1,507 frontend
tests, and all repository quality and build gates.
Specifications Internals decomposition is complete. `Specs.Reads`,
`Specs.Claims`, and `SpecsResolver` are 75-, 32-, and 77-line stable facades
over eight focused read, claim-workflow, and GraphQL owners. The exact focused
gate passes 88 tests, caller scans find no application, internal-owner, or
schema bypasses, and full `mix ci` passes 913 backend tests at 83.59% coverage,
1,507 frontend tests, and all repository quality and build gates.
Affiliate Resolver decomposition is complete. `AffiliateResolver` is a
38-line schema-facing facade over 123-line read and 195-line mutation owners.
The exact focused gate passes 24 tests, schema scans find no owner bypasses,
and full `mix ci` passes 913 backend tests at 83.61% coverage, 1,507 frontend
tests, and all repository quality and build gates.
Pricing Resolver decomposition is complete. `PricingResolver` is a 50-line
schema-facing facade over 93-line merchant, 162-line offer, and 23-line
evidence owners. The exact focused gate passes 82 tests including existing
query budgets, schema scans find no owner bypasses, and full `mix ci` passes
913 backend tests at 83.64% coverage, 1,507 frontend tests, and all repository
quality and build gates.
Alerts Resolver decomposition is complete. `AlertsResolver` is a 31-line
schema-facing facade over 58-line read, 129-line watch-mutation, and 39-line
event-mutation owners. The exact focused gate passes 13 tests, schema scans
find no owner bypasses, and full `mix ci` passes 913 backend tests at 83.65%
coverage, 1,507 frontend tests, and all repository quality and build gates.
The aggregate Backend Decomposition completion audit is also complete. All 17
stable facades retain their exact pre-program public name-and-arity sets, all
52 extracted owners have only stable-facade or same-namespace Mix xref
callers, and tests do not bypass those boundaries. The anti-slop pass removed
three config-key-only owner dependency edges while preserving the established
application config keys; no extracted owner remains in the xref cycle report.
The fixed stop boundary remained intact.

The post-decomposition audit confirmed the fixed stop boundary and promoted
three non-filler quality successors: actionable ExDNA clone retirement,
Dialyzer suppression retirement, and work-queue plan-reference integrity.
Their design and implementation plans are source-backed by the current
six-clone report, the 11 skipped/eight unnecessary Dialyzer result, and the
file-backed queue validator's missing reference checks.

The user then claimed those three outcomes plus Reach baseline reconciliation
for serial execution. Fresh 2026-07-24 evidence promoted strict Credo
enforcement, coverage-contract hardening, and Logger-level test isolation as
the three ready reserves: strict Credo reports two otherwise-unenforced
narrator docs, full coverage is 83.74% against a 69% floor with two uncovered
first-party Mix entry points, and two ingestion tests mutate the global Logger
level while concurrent CI emits debug output.

Actionable ExDNA clone retirement is complete. Shared CJ import-run completion,
CJ Runs value formatting, and discussion moderation changesets now have focused
owners. The attempted worker abstraction was rejected because it did not remove
the complete-facade near match without macro ceremony. The enforced budget is
now 3/3, focused tests pass, and full `mix ci` passes 916 backend tests at
83.76% coverage plus 1,507 frontend tests.

Dialyzer suppression retirement is complete. Eight stale filters were removed
before the 11 reachable findings were corrected at their parser, Specs,
taxonomy, session, origin, runtime-config, and test-support boundaries. The
default ignore file is deleted; Dialyzer reports zero errors, skipped findings,
or unnecessary skips, and full `mix ci` passes 916 backend tests at 83.75%
coverage plus 1,507 frontend tests.

Implementation plan references (non-dispatch):

- `docs/superpowers/plans/2026-07-21-bounded-authorized-node-graphql-reads-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-bounded-alert-evaluation-market-reads-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-bounded-comparison-root-graphql-reads-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-bounded-authorized-management-graphql-connections-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-bounded-catalog-offer-discovery-root-graphql-reads-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-bounded-operator-reporting-root-graphql-reads-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-graphql-request-loader-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-graphql-schema-type-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-22-discussions-context-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-22-specs-context-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-22-commerce-attribution-context-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-22-ingestion-context-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-22-accounts-context-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-22-pricing-context-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-22-seo-context-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-22-alerts-context-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-22-catalog-context-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-22-comparison-snapshots-context-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-22-taxonomy-context-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-cj-import-task-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-cj-runs-task-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-catalog-resolver-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-listing-persistence-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-cj-candidates-task-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-discussions-resolver-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-backend-decomposition-completion-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-catalog-filter-metadata-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-community-submissions-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-commerce-destination-url-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-community-reads-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-accounts-authentication-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-specifications-internals-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-commerce-attribution-internals-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-affiliate-resolver-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-pricing-resolver-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-alerts-resolver-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-actionable-exdna-clone-retirement-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-dialyzer-suppression-retirement-implementation-plan.md`
- `docs/superpowers/plans/2026-07-23-work-queue-plan-reference-integrity-implementation-plan.md`
- `docs/superpowers/plans/2026-07-24-reach-baseline-reconciliation-implementation-plan.md`
- `docs/superpowers/plans/2026-07-24-strict-credo-enforcement-implementation-plan.md`
- `docs/superpowers/plans/2026-07-24-coverage-contract-hardening-implementation-plan.md`
- `docs/superpowers/plans/2026-07-24-logger-level-test-isolation-implementation-plan.md`
- `docs/superpowers/plans/2026-07-13-product-trust-and-discovery-program.md`
- `docs/superpowers/plans/2026-07-13-canonical-product-identity-implementation-plan.md`
- `docs/superpowers/plans/2026-07-13-specification-provenance-read-contract-implementation-plan.md`
- `docs/superpowers/plans/2026-07-13-offer-truth-read-contract-implementation-plan.md`
- `docs/superpowers/plans/2026-07-13-durable-ingestion-job-foundation-implementation-plan.md`
- `docs/superpowers/plans/2026-07-12-post-stack-ready-batches.md`
- `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

This reference list intentionally retains plans across ready and completed
states. It is not a candidate pool and must never be used to infer status or
redispatch work. Read `docs/work/index.md` for the only live status and the
linked lane document for completion evidence. Three is the live queue floor,
not a catalog cap; internal slices, per-route steps, and milestone commits do
not count as separate candidates or ready rows. Batch coherence takes priority
over requested counts and replenishment depth.

The 2026-06-27 cross-project batch of ten work-item plans completed and moved to
the completed plan archive below.

Rejected: CJ candidate CSV score export was explicitly removed from the scoring
batch and should not be recreated or promoted.

## Candidate Pool

| Status | Candidate | Create Or Promote When | Notes |
| --- | --- | --- | --- |
| deferred | eBay Browse fallback connector | Product decision reverses the 2026-07-08 deferral and CJ validation records that the approved CJ account lacks usable product catalog scope. | Do not create or promote while eBay is deferred. If reopened, create the fallback plan from CJ decision evidence rather than guessing before the blocker resolves. |
| deferred | Ingestion dashboard and operator surfaces | Product decision reverses the 2026-07-08 dashboard deferral and chooses one concrete non-secret read-only contract. | Do not promote CJ read-model dashboard contracts, source-health dashboard slices, or ingestion operator dashboard surfaces while deferred. |

## Planned Follow-Up Groups

- Current backend read-budget program: product evidence/SEO, public community
  connections, product-offer/coupon/history connections, and merchant-parent
  active-offer connections are complete. Owner-private community submission
  reads, public Relay node aliases, and category lookup/qualified-product
  connections are complete. Public product/merchant slug and opaque-key
  lookups, comparison evidence reads, and authorized Relay node reads are also
  complete. Bounded alert evaluation market reads is also complete: one
  immutable product/listing fact snapshot now feeds the independent watch
  transactions. Bounded comparison root GraphQL reads is complete. Bounded
  authorized management GraphQL connections is complete, with six owner and
  two operator connection aliases sharing authorization-keyed request reads.
  Bounded catalog and offer-discovery root GraphQL reads is complete: products
  2/4 to 1/1, filter metadata 6/12 to 3/3, merchants 2/4 to 1/1, and merchant
  products 2/4 to 1/1 SELECT budgets, with 95 focused tests passing. Bounded
  operator reporting root GraphQL reads is complete: top-level active-coupon
  and revenue-summary aliases now share one authorization-keyed request source.
  GraphQL request loader decomposition is complete: the facade and source keys
  remain stable while association, parent-collection, and root-request source
  ownership now lives across focused modules for two Ecto and thirteen KV
  domains, including discovery and operator-reporting roots. Its exact focused
  gate passed 222 tests and full `mix ci` passed 902 backend tests, 1,507
  frontend tests, ExDNA at 6/6, and Dialyzer. These are
  reviewer-sized domain outcomes; their set-based context, Dataloader, shared-
  fact, and query-budget steps remain internal slices rather than separate
  queue rows.
- GraphQL schema type decomposition is the path-disjoint structural successor:
  the root facade stays stable while shared/account, commerce, catalog, and
  trust/community declarations move to five domain notation modules under the
  exact checked-in SDL snapshot.
- Discussions context decomposition is a path-disjoint structural successor:
  the stable `ProductCompare.Discussions` facade remains caller-facing while
  read/query, legacy CRUD, authenticated submission/owner policy, and operator
  moderation implementations move into focused internal modules. Its direct
  discussion, SEO, community GraphQL, and Dataloader characterization gate
  passes 104 tests.
- Specs context decomposition is a path-disjoint structural successor: the
  stable `ProductCompare.Specs` facade remains caller-facing while definition,
  typed-value, claim/import, correction/moderation, and read implementations
  move into focused internal modules. Its direct consumer characterization
  gate passes 79 tests.
- Commerce Attribution context decomposition is a path-disjoint structural
  successor and is complete: the stable `ProductCompare.CommerceAttribution`
  facade remains caller-facing while `Clicks`, `Conversions`, and `Revenue`
  own the focused implementations. Its exact characterization gate passes 81
  tests.
- Ingestion context decomposition is complete: the stable
  `ProductCompare.Ingestion` facade remains caller-facing while import-run,
  merchant-feed-candidate, merchant-identity, and canonical listing persistence
  implementations live in four focused internal modules. Its current direct
  and GraphQL characterization gate passes 57 tests; deferred provider,
  dashboard, operator, scheduling, and application-submission scope stays
  closed.
- Accounts context decomposition is complete: the stable
  `ProductCompare.Accounts` facade remains caller-facing while `Users`,
  `ApiTokens`, and `Reputation` own the focused implementations alongside the
  unchanged `UserAuth` owner. Its direct and GraphQL characterization gate
  passes 112 tests; browser auth, authorization, seeds, and email transport
  policy stay unchanged.
- Pricing context decomposition is complete: the stable
  `ProductCompare.Pricing` facade remains caller-facing while `Merchants`,
  `Offers`, `PriceHistory`, and `TruthReads` own the focused implementations.
  Its direct and GraphQL characterization gate passes 39 tests; `OfferTruth`,
  pricing, alert, and ingestion policy stay unchanged.
- SEO context decomposition is complete: the
  stable `ProductCompare.Seo` facade remains caller-facing while metadata,
  category qualification, and sitemap behavior move into focused internal
  modules. Its direct, controller, and GraphQL characterization gate passes 13
  tests; qualification, route, and frontend metadata policy stay unchanged.
- Alerts context decomposition is complete: the
  stable `ProductCompare.Alerts` facade remains caller-facing while watch-rule,
  market-fact, evaluation, and inbox implementations move into focused internal
  modules. Its direct and GraphQL characterization gate passes 13 tests; alert
  policy, pricing enqueueing, transports, and frontend behavior stay unchanged.
- Catalog context decomposition is complete: the stable
  `ProductCompare.Catalog` facade remains caller-facing while `Products`,
  `Evidence`, and `SavedComparisons` own product/brand lifecycle,
  identifier/media evidence, and saved-comparison implementations alongside
  the existing `Filtering` and `FilterMetadata` owners. Its direct and GraphQL
  characterization gate passes 106 tests; catalog, ingestion, taxonomy,
  GraphQL, and frontend policy stay unchanged.
- Comparison Snapshots context decomposition is complete: the stable
  `ProductCompare.ComparisonSnapshots` facade remains caller-facing while
  `Lifecycle`, `Capture`, and `PayloadCodec` own snapshot lifecycle, immutable
  evidence capture, and payload hydration. Its direct and GraphQL
  characterization gate passes 14 tests; absent optional recommendation fields
  hydrate to `nil`, while snapshot, SEO, pricing, recommendation, privacy, and
  frontend policy stay unchanged.
- Taxonomy context decomposition is complete: the stable
  `ProductCompare.Taxonomy` facade remains caller-facing while `Taxonomies`,
  `Hierarchy`, `Assignments`, and `Aliases` own the four focused
  implementations. Its direct Taxonomy and ingestion enrichment
  characterization gate passes 13 tests; taxonomy, catalog, ingestion, SEO,
  GraphQL, and frontend policy stay unchanged.
- Catalog Resolver decomposition is complete: the
  stable `ProductCompareWeb.Resolvers.CatalogResolver` remains schema-facing
  while `Discovery`, `InputNormalization`, `CurrentAttributes`, and
  `SavedComparisons` own discovery, normalization, current-attribute
  projection, and saved-comparison resolution. Its catalog,
  filter-metadata, saved-comparison, specification-correction, and Dataloader
  characterization gate passes 100 tests; schema wiring, loader keys, query
  budgets, validation, authorization, payloads, and frontend policy stay
  unchanged.
- CJ Import task decomposition is complete: the stable
  `Mix.Tasks.ProductCompare.Ingestion.CjImport` entry point remains
  caller-facing while `Options`, `Runner`, and `Candidates` own input
  normalization, durable single-run imports, and reviewed-candidate batching.
  Its dedicated characterization gate passes 21 tests; runner failures emit
  sanitized categories and stack traces, while provider requests, ingestion
  persistence, worker/resume callers, scheduling, deferred operator scope, and
  product policy stay unchanged.
- CJ Runs task decomposition is complete: the
  stable `Mix.Tasks.ProductCompare.Ingestion.CjRuns` entry point remains
  caller-facing while option normalization, run reporting, and resume
  orchestration move into focused internal modules. Its dedicated
  characterization gate passes 10 tests; CJ queries, readiness, cursor and
  runner behavior, credential safety, the operator runbook, deferred operator
  scope, and product policy stay unchanged.
- Listing Persistence decomposition is complete: the stable
  `ProductCompare.Ingestion.ListingPersistence.persist/3` boundary remains
  caller-facing while `Artifacts`, `Products`, `Enrichment`, and `Offers` own
  source and external identity, canonical product identity, enrichment, and
  offer observation persistence. Its ingestion, enrichment, and
  reconciliation characterization gate passes 44 tests; transactions, writes,
  conflict targets, freshness, identity, taxonomy, specifications, pricing,
  alerts, reconciliation, provider behavior, and product policy stay
  unchanged.
- CJ Candidates task decomposition is complete: the stable
  `Mix.Tasks.ProductCompare.Ingestion.CjCandidates` entry point remains
  caller-facing while `Options`, `StaleReport`, `FitGapReport`,
  `ApplicationCohortReport`, and `Output` own normalization, the three
  supported reports, and shared safe serialization. Its dedicated
  characterization gate passes 6 tests; queries, filters, ordering, output,
  Global IDs, credential safety, the rejected CSV export, the operator
  runbook, deferred operator scope, and product policy stay unchanged.
- Discussions Resolver decomposition is complete: the stable
  `ProductCompareWeb.Resolvers.DiscussionsResolver` remains schema-facing
  while `Reads` owns public and viewer-scoped community reads and `Mutations`
  owns authenticated input, actions, payloads, and error translation. Its
  community GraphQL and Dataloader characterization gate passes 61 tests;
  schema wiring, loader keys, query budgets, visibility, authorization, Global
  IDs, moderation, payloads, and frontend policy stay unchanged.
- Catalog Filter Metadata decomposition is complete: the stable
  `ProductCompare.Catalog.FilterMetadata.metadata/1`
  boundary remains catalog-facing while filtered-product queries, taxonomy
  facets, selected attribute filters, and attribute aggregation move into
  focused internal modules. Its direct characterization gate passes 10 tests;
  query behavior, counts, ordering, units, selection, catalog policy, GraphQL,
  Relay, and frontend behavior stay unchanged.
- Community Submissions decomposition is complete: the stable
  `ProductCompare.Discussions.Submissions` boundary remains
  discussion-context-facing while creation and idempotency, owner lifecycle,
  reporting, and write-limit persistence move into focused internal modules.
  Its direct community-trust characterization gate passes 25 tests;
  transactions, ownership, moderation, idempotency, limits, GraphQL, Relay, and
  frontend behavior stay unchanged.
- Community Reads decomposition is complete: the stable
  `ProductCompare.Discussions.Reads` facade remains Discussions-internal while
  `Legacy`, `PublicContent`, `ViewerSubmissions`, and `Connections` own the
  four planned read responsibilities. Its direct, GraphQL, and Dataloader
  characterization gate passes 98 tests; visibility, pagination, ordering,
  preloads, query budgets, moderation, Relay, and frontend behavior stay
  unchanged.
- Commerce Destination URL decomposition is complete: the stable
  `ProductCompare.CommerceAttribution.DestinationUrl.valid?/1` predicate
  remains caller-facing while URI and authority parsing, hostname
  canonicalization, public-address policy, and RFC 3492 encoding move into
  focused internal modules. Its direct destination and commerce-attribution
  characterization gate passes 57 tests; accepted destinations, rejected
  destinations, schemas, commerce policy, controllers, GraphQL, and frontend
  behavior stay unchanged.
- Completed cross-stack program: the seven domain-oriented outcomes completed
  through the 2026-07-20 design and their lane docs. The 2026-07-18 coherent
  frontend plan is retained as superseded grouping evidence, not an active
  dispatch source. Affiliate merchant-copy, API-token lifecycle-action, strict
  temporal, row-scoped action, and community answer-cursor docs remain slice
  evidence and must not be promoted again as standalone rows.
- Completed optional shopper polish: loaded-price scope copy, the loaded-product
  compare-picker filter, and the visible-page merchant-name filter are present
  in current source and tests. Their dated plans are complete, not candidates.
- Completed route foundations: wildcard 404 and shared route document metadata
  are present and must not be promoted again without fresh scope.
- Completed reserve: API-token item presentation, product-detail offer-list
  presentation, root destinations, and the compare picker view are complete
  through `docs/superpowers/plans/2026-07-12-next-presentation-boundaries.md`;
  do not promote them again without fresh scope.
- Completed reserve: affiliate merchant pagination, merchant-directory view
  presentation, saved-comparison pure view state, and credential-auth form
  presentation completed through
  `docs/superpowers/plans/2026-07-12-next-stack-follow-up-batches.md`.
- Completed reserve: product-detail decision actions, revenue-summary view
  data, specification-matrix data, and decision-summary data completed through
  `docs/superpowers/plans/2026-07-12-post-stack-ready-batches.md`; do not
  promote them again without fresh scope.
- Completed reserve: comparison snapshot data, product-community data, price-alert
  view data, and API-token route data execute through
  `docs/superpowers/plans/2026-07-14-trust-surface-view-data-contracts.md`;
  all four contracts are complete on `codex/trust-surface-data-contracts`.
- Completed reserve: affiliate setup route data, offer-discovery filter data,
  catalog browse route data, and product-detail route data executed through
  `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Completed reserve: compare-picker data also executed through that same plan.
- Completed reserve: product-offer panel data also executed through that same
  plan.
- Completed reserve: external-destination safety also executed through that
  same plan.
- Completed reserve: trust-surface date presentation also executed through
  that same plan.
- Completed reserve: product-attribute grouping data also executed through
  that same plan.
- Completed reserve: route-metadata resolution data also executed through that
  same plan.
- Completed reserve: saved-comparison navigation data also executed through
  that same plan.
- Completed reserve: API-token lifecycle display data, catalog specification-
  highlight data, recommendation-profile route data, and saved-comparison
  naming data executed through that same plan; do not promote them again
  without fresh scope.
- Completed reserve: merchant visible-page filter data executed through that
  same plan; do not promote it again without fresh scope.
- Completed reserve: price-watch input data executed through that same plan; do
  not promote it again without fresh scope.
- Completed reserve: feed-candidate review view data executed through that same
  plan; do not promote it again without fresh scope.
- Completed reserve: tracked-commerce click data executed through that same
  plan; do not promote it again without fresh scope.
- Completed reserve: immutable route-state collection helpers executed through
  that same plan; do not promote them again without fresh scope.
- Completed reserve: catalog filter-form state, feed-candidate review mutation
  data, and offer-discovery card view data executed through that same plan; do
  not promote them again without fresh scope.
- Completed reserve: category landing view data, alerts mutation data,
  recommendation result view data, and shared route-error view data executed
  through that same plan; do not promote them again without fresh scope.
- Completed reserve: API-token controls, compare specification matrix, catalog
  advanced-filter presentation, and offer-discovery card presentation are
  complete through
  `docs/superpowers/plans/2026-07-11-next-control-and-matrix-batches.md`; do not
  promote them again without fresh scope.
- Completed reserve: skip navigation plus saved-comparison, catalog product-
  list, and revenue-summary presentation extractions are complete; do not
  promote them again without fresh scope.
- Completed reserve: affiliate-setup form and feed-candidate review presentation
  extractions are complete; do not promote them again without fresh scope.
- Deferred and rejected work remains outside the ready-work floor and cannot be
  used as queue filler. Start at `docs/work/index.md` for live dispatch status.

## Completed Plan Archive

Completed implementation plans stay in `docs/plans/` as dated reference files.
Use the corresponding `docs/work/*.md` lane doc for completion evidence.

Recent completed plan groups:

- 2026-07-20 through 2026-07-21 bounded GraphQL and comparison evidence reads:
  merchant-offer connections, owner-private community submissions, public
  Relay nodes, category qualification and product pages, public
  product/merchant slug aliases, public opaque-key entry points, live
  recommendations, immutable snapshot publication, authorized Relay nodes, and
  alert evaluation market-fact reuse. Their implementation plans are explicitly
  complete, and their lane docs retain the query-budget and semantic-parity
  evidence.

- 2026-07-20 cross-stack correctness: durable ingestion recurrence, alert
  lifecycle reliability, community content lifecycle, Relay cursor forward
  progress, bounded merchant GraphQL reads, account/setup interaction contracts,
  and comparison interaction correctness. Their implementation plans and lane
  evidence remain dated 2026-07-20 and must not be promoted again without fresh
  source validation.

- Frontend comparison-snapshot, product-community, price-alert, and API-token
  route data contracts:
  `docs/superpowers/plans/2026-07-14-trust-surface-view-data-contracts.md`.

- Frontend affiliate pagination, merchant-directory view, saved-comparison
  view state, and credential-auth form:
  `docs/superpowers/plans/2026-07-12-next-stack-follow-up-batches.md`.

- Frontend token-item, product-offer-list, root-destination, and compare-picker
  presentation:
  `docs/superpowers/plans/2026-07-12-next-presentation-boundaries.md`.

- Frontend control, matrix, advanced-filter, and offer-card presentation:
  `docs/superpowers/plans/2026-07-11-next-control-and-matrix-batches.md`.

- Bounded local-filter polish:
  `docs/plans/2026-07-10-compare-loaded-price-scope-copy-implementation-plan.md`,
  `docs/plans/2026-07-10-compare-picker-loaded-name-filter-implementation-plan.md`,
  and `docs/plans/2026-07-10-merchant-visible-page-name-filter-implementation-plan.md`.

- Frontend Radix UI polish architecture and completion evidence:
  `docs/superpowers/specs/2026-07-11-radix-ui-polish-design.md` and
  `docs/work/frontend-radix-ui-polish.md`.

- Feature-complete product milestone:
  `docs/plans/2026-07-10-shopper-home-content-implementation-plan.md`,
  `docs/plans/2026-07-10-viewer-aware-navigation-implementation-plan.md`,
  `docs/plans/2026-07-10-compare-relative-price-signal-implementation-plan.md`,
  `docs/plans/2026-07-10-saved-comparison-product-labels-implementation-plan.md`,
  `docs/plans/2026-07-10-revenue-preview-positioning-implementation-plan.md`,
  and `docs/plans/2026-07-10-cj-scheduled-readiness-implementation-plan.md`.

- Shopper decision-confidence batch:
  `docs/plans/2026-07-09-catalog-result-guidance-and-removable-filters-implementation-plan.md`,
  `docs/plans/2026-07-09-offer-observation-and-coupon-validity-implementation-plan.md`,
  `docs/plans/2026-07-09-product-detail-price-observation-implementation-plan.md`,
  and `docs/plans/2026-07-09-visible-offer-snapshot-implementation-plan.md`.

- Product-facing curation batch:
  `docs/plans/2026-07-08-catalog-search-and-sort-implementation-plan.md` and
  `docs/plans/2026-07-08-offer-discovery-product-label-context-implementation-plan.md`.

- Parallel execution batch:
  `docs/plans/2026-03-23-affiliate-link-attribution-and-revenue-tracking-plan.md`,
  `docs/plans/2026-06-01-frontend-offer-discovery-demo-parity-implementation-plan.md`,
  and `docs/work/backend-graphql-connection-contract-hardening.md` covered
  commerce offer interaction with first-party tracked outbound clicks,
  `/offers` visible merchant quick filters, and GraphQL connection contract
  hardening for invalid Relay page sizes.

- Product-facing follow-up batch:
  `docs/plans/2026-07-02-catalog-product-card-spec-teasers-implementation-plan.md`,
  `docs/plans/2026-07-02-product-detail-offer-summary-implementation-plan.md`,
  `docs/plans/2026-07-02-offer-discovery-sort-and-highlights-implementation-plan.md`,
  `docs/plans/2026-07-02-saved-comparisons-sort-controls-implementation-plan.md`,
  and
  `docs/plans/2026-07-02-merchant-directory-website-links-implementation-plan.md`.

- CJ read-model and weekly operator-runbook batch:
  `docs/plans/2026-07-01-cj-candidate-cohort-read-model-implementation-plan.md`,
  `docs/plans/2026-07-01-cj-candidate-market-coverage-read-model-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-candidate-freshness-read-model-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-run-health-read-model-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-run-throughput-read-model-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-import-artifact-quality-read-model-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-import-price-quality-read-model-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-merchant-identity-quality-read-model-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-application-readiness-read-model-implementation-plan.md`,
  and
  `docs/plans/2026-06-27-cj-weekly-operator-runbook-implementation-plan.md`.

- Product filtering, persistent compare tray, and CJ batch promotion:
  `docs/plans/2026-06-30-product-filter-metadata-and-facets-implementation-plan.md`,
  `docs/plans/2026-06-30-catalog-faceted-filtering-ui-implementation-plan.md`,
  `docs/plans/2026-06-30-compare-matrix-modes-implementation-plan.md`,
  `docs/plans/2026-06-30-compare-attribute-metadata-implementation-plan.md`,
  and
  `docs/plans/2026-06-30-compare-offer-decision-helpers-implementation-plan.md`,
  `docs/plans/2026-07-01-persistent-compare-tray-promotion-implementation-plan.md`,
  `docs/plans/2026-07-01-persistent-compare-tray-implementation-plan.md`,
  and
  `docs/plans/2026-07-01-cj-read-model-operator-batch-promotion-implementation-plan.md`.

- Usable-product frontend batch:
  `docs/plans/2026-06-29-product-catalog-decision-cards-implementation-plan.md`,
  `docs/plans/2026-06-29-product-detail-decision-actions-implementation-plan.md`,
  `docs/plans/2026-06-29-compare-selection-tray-implementation-plan.md`,
  `docs/plans/2026-06-29-offer-discovery-product-context-implementation-plan.md`,
  and
  `docs/plans/2026-06-29-saved-comparisons-return-flow-implementation-plan.md`.
- Cross-project frontend and ingestion follow-up batch:
  `docs/plans/2026-06-27-project-catalog-browse-page-size-implementation-plan.md`,
  `docs/plans/2026-06-27-project-product-detail-offer-pagination-implementation-plan.md`,
  `docs/plans/2026-06-27-project-offer-discovery-filter-controls-implementation-plan.md`,
  `docs/plans/2026-06-27-project-merchant-directory-page-size-implementation-plan.md`,
  `docs/plans/2026-06-27-project-revenue-date-presets-implementation-plan.md`,
  `docs/plans/2026-06-27-project-saved-comparisons-client-filter-implementation-plan.md`,
  `docs/plans/2026-06-27-project-compare-selection-controls-implementation-plan.md`,
  `docs/plans/2026-06-27-project-api-token-expiry-presets-implementation-plan.md`,
  `docs/plans/2026-06-27-project-affiliate-setup-merchant-context-implementation-plan.md`,
  and
  `docs/plans/2026-06-27-project-source-health-read-model-implementation-plan.md`.
- Product ingestion: ten-plan CJ operator loop batch:
  `docs/plans/2026-06-27-cj-product-import-resume-task-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-feed-discovery-resume-task-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-product-import-history-task-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-feed-discovery-history-task-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-feed-candidate-staleness-task-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-feed-candidate-batch-review-task-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-application-cohort-markdown-task-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-ingestion-readiness-gate-task-implementation-plan.md`,
  `docs/plans/2026-06-27-cj-failed-run-report-task-implementation-plan.md`,
  and
  `docs/plans/2026-06-27-cj-feed-candidate-fit-gap-report-task-implementation-plan.md`.
- Product ingestion: CJ provider credential status, product-import credential
  preflight, feed-discovery credential preflight, application cohort reporting,
  product import status, and disabled-by-default product import scheduling:
  `docs/plans/2026-06-26-cj-provider-credential-status-task-implementation-plan.md`,
  `docs/plans/2026-06-26-cj-import-credential-preflight-implementation-plan.md`,
  `docs/plans/2026-06-26-cj-feed-discovery-credential-preflight-implementation-plan.md`,
  `docs/plans/2026-06-26-cj-application-cohort-report-implementation-plan.md`,
  `docs/plans/2026-06-26-cj-product-import-status-task-implementation-plan.md`,
  and
  `docs/plans/2026-06-26-scheduled-cj-product-import-runtime-implementation-plan.md`.
- Product ingestion: CJ candidate fit-score sort and frontend score badges:
  `docs/plans/2026-06-26-cj-feed-candidate-fit-score-sort-implementation-plan.md`
  and
  `docs/plans/2026-06-26-cj-feed-candidate-score-badges-implementation-plan.md`.
- Product ingestion: scheduled CJ feed discovery runtime, read-only discovery
  status, and feed-candidate filter controls:
  `docs/plans/2026-06-26-scheduled-cj-feed-discovery-runtime-implementation-plan.md`,
  `docs/plans/2026-06-26-cj-feed-discovery-status-task-implementation-plan.md`,
  and `docs/plans/2026-06-26-cj-feed-candidate-filter-controls-implementation-plan.md`.
- Product ingestion: parallel CJ candidate ranking, review workspace, and
  rejected shortlist export record:
  `docs/plans/2026-06-26-cj-feed-candidate-ranking-contract-implementation-plan.md`,
  `docs/plans/2026-06-26-cj-feed-candidate-review-workspace-implementation-plan.md`,
  and `docs/plans/2026-06-26-cj-shortlist-cohort-export-implementation-plan.md`.
- Product ingestion/demo parity: CJ feed candidate durable review status:
  `docs/plans/2026-06-04-cj-feed-candidate-review-status-implementation-plan.md`.
- Product ingestion/demo parity: CJ feed candidate review route:
  `docs/plans/2026-06-04-cj-feed-candidate-review-implementation-plan.md`.
- Product ingestion: CJ feed candidate capture from manual feed discovery:
  `docs/plans/2026-06-04-cj-feed-candidate-capture-implementation-plan.md`.
- Product ingestion: CJ import observability, manual feed discovery, and bounded
  manual product import pagination:
  `docs/plans/2026-06-04-cj-ingestion-expansion-implementation-plan.md`.
- Frontend catalog browse pagination demo parity:
  `docs/plans/2026-06-04-frontend-catalog-browse-pagination-demo-parity-implementation-plan.md`.
- Product ingestion: live CJ provider validation and redacted sample fixture:
  `docs/plans/2026-06-01-live-cj-provider-validation-and-source-onboarding-implementation-plan.md`.
- Product ingestion: manual CJ connector and live one-page import:
  `docs/plans/2026-06-04-manual-cj-connector-implementation-plan.md`.
- Frontend demo parity: compare matrix, offer discovery, merchant discovery,
  affiliate setup, revenue reporting, API token management, product comparison,
  product-detail coupons, and product-detail price history.
- Backend GraphQL/source artifacts: public source artifact contract and generic
  source artifact node lookup.
- Auth migration: logout route baseline and frontend auth state hardening.
- Earlier foundations: Relay route data, saved comparisons, GraphQL relay
  contract hardening, dataloader adoption, catalog browse/detail, product
  offers, commerce attribution, and ingestion foundation.

Do not reopen a completed plan unless `docs/work/index.md` promotes it as a
new `ready` row with target paths and verification.
