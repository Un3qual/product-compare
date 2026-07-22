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
discovery reads per alias. Catalog filters and metadata, merchant-directory
pagination, offer filters, nested values, and growing-alias budgets remain
internal slices of one discovery-entry acceptance boundary. Their three
focused suites pass 51 tests.
An eleventh claim-floor audit promoted GraphQL schema type decomposition after
verifying that the only project schema module is 2,004 lines and combines root
runtime behavior with 151 type, input, enum, and interface declarations. The
existing byte-for-byte SDL snapshot makes a domain-notation extraction
immediately executable without choosing new product behavior. Root operations,
context, plugins, resolver wiring, and `assets/schema.graphql` remain fixed.

Implementation plan references (non-dispatch):

- `docs/superpowers/plans/2026-07-21-bounded-authorized-node-graphql-reads-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-bounded-alert-evaluation-market-reads-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-bounded-comparison-root-graphql-reads-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-bounded-authorized-management-graphql-connections-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-bounded-catalog-offer-discovery-root-graphql-reads-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-bounded-operator-reporting-root-graphql-reads-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-graphql-request-loader-decomposition-implementation-plan.md`
- `docs/superpowers/plans/2026-07-21-graphql-schema-type-decomposition-implementation-plan.md`
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
  Bounded catalog and offer-
  discovery root GraphQL reads groups the remaining public catalog, filter-
  metadata, merchant-directory, and offer-discovery root aliases. Bounded
  operator reporting root GraphQL reads groups the remaining top-level active-
  coupon and revenue-summary aliases behind one authorization-keyed request
  source. GraphQL request loader decomposition then preserves the facade and
  source keys while separating association, parent-collection, and root-request
  source ownership. These are
  reviewer-sized domain outcomes; their set-based context, Dataloader, shared-
  fact, and query-budget steps remain internal slices rather than separate
  queue rows.
- GraphQL schema type decomposition is the path-disjoint structural successor:
  the root facade stays stable while shared/account, commerce, catalog, and
  trust/community declarations move to five domain notation modules under the
  exact checked-in SDL snapshot.
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
