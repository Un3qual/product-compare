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
2026-06-29 usable-product batch completed. No implementation plan is currently
active in the live queue.

Active implementation plans:

- None.

The 2026-06-27 cross-project batch of ten work-item plans completed and moved to
the completed plan archive below.

Rejected: CJ candidate CSV score export was explicitly removed from the scoring
batch and should not be recreated or promoted.

## Candidate Pool

| Status | Candidate | Create Or Promote When | Notes |
| --- | --- | --- | --- |
| retained | CJ read-model and weekly operator runbook batch | Promote after the 2026-06-29 usable-product queue has moved or when ingestion operator readiness becomes the highest product need again. | The ten CJ plans created on 2026-06-27 remain planned follow-up work and are tracked in `docs/work/product-data-scraping.md`; they are not currently live queue rows. |
| blocked | eBay Browse fallback connector | CJ validation records that the approved CJ account lacks usable product catalog scope. | Create the fallback plan from the CJ decision evidence rather than guessing before the blocker resolves. |

## Completed Plan Archive

Completed implementation plans stay in `docs/plans/` as dated reference files.
Use the corresponding `docs/work/*.md` lane doc for completion evidence.

Recent completed plan groups:

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
