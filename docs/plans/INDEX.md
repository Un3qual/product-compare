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
completed. The live queue has no ready rows.

Active implementation plans:

- None.

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

- No planned follow-up groups are currently listed outside the deferred
  candidate pool. Start at `docs/work/index.md` for live dispatch status.

## Completed Plan Archive

Completed implementation plans stay in `docs/plans/` as dated reference files.
Use the corresponding `docs/work/*.md` lane doc for completion evidence.

Recent completed plan groups:

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
