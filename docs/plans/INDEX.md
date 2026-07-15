# Plan Index

Start at `docs/work/index.md` for live execution status. This file is a catalog
of active and candidate plans, not the dispatch queue.

## Active Architecture Sources

- `ARCHITECTURE.md`
- `docs/plans/2026-03-05-frontend-fullstack-design.md`
- `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- `docs/plans/2026-03-19-frontend-relay-route-data-design.md`

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
reviews and Q&A, merchant pages, and SEO/acquisition surfaces. The live queue
now carries bounded frontend maintainability follow-ups over those completed
truth contracts.

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
shared external-destination safety are complete. Three source-verified, non-
overlapping successors keep the ready floor intact across trust-surface date
presentation, product-attribute grouping data, and route-metadata resolution
data.

Active implementation plans:

- `docs/superpowers/plans/2026-07-13-product-trust-and-discovery-program.md`
- `docs/superpowers/plans/2026-07-13-canonical-product-identity-implementation-plan.md`
- `docs/superpowers/plans/2026-07-13-specification-provenance-read-contract-implementation-plan.md`
- `docs/superpowers/plans/2026-07-13-offer-truth-read-contract-implementation-plan.md`
- `docs/superpowers/plans/2026-07-13-durable-ingestion-job-foundation-implementation-plan.md`
- `docs/superpowers/plans/2026-07-12-post-stack-ready-batches.md`
- `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

These plans are dispatched only from `docs/work/index.md`. Three is the live
queue floor, not a catalog cap; the catalog may retain every additional useful
validated candidate.

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

- Product comparison: disclose that relative price uses already-loaded offers,
  then add a local name filter over already-loaded picker products. These plans
  share test and lane paths and execute serially.
- Merchant discovery: add a local merchant-name filter explicitly scoped to the
  visible Relay page.
- Route foundations: add a real wildcard 404 and shared route document metadata.
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
- Ready reserve: trust-surface date presentation, product-attribute grouping
  data, and route-metadata resolution data execute through that same plan.
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
