# Plan Index

Start at `docs/work/index.md` for live execution status. This file is a catalog
of active and candidate plans, not the dispatch queue.

## Active Architecture Sources

- `ARCHITECTURE.md`
- `docs/plans/2026-03-05-frontend-fullstack-design.md`
- `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- `docs/plans/2026-03-19-frontend-relay-route-data-design.md`

## Active Plan Catalog

| Status | Plan | Use When | Promotion Rule |
| --- | --- | --- | --- |
| ready | `docs/plans/2026-06-26-cj-feed-candidate-ranking-contract-implementation-plan.md` | Backend worker owns CJ candidate review-status filtering and deterministic ranking args. | Close after focused backend/GraphQL verification and ranking evidence is recorded in `docs/work/product-data-scraping.md`. |
| ready | `docs/plans/2026-06-26-cj-feed-candidate-review-workspace-implementation-plan.md` | Frontend worker owns current-page review counts, note capture, and reviewed metadata on `/ingestion/feed-candidates`. | Close after route test, typecheck, and review-workspace evidence are recorded in `docs/work/product-data-scraping.md`. |
| ready | `docs/plans/2026-06-26-cj-shortlist-cohort-export-implementation-plan.md` | Backend tooling worker owns a read-only CSV export for manual merchant application planning. | Close after export task test, typecheck, and shortlist-export evidence are recorded in `docs/work/product-data-scraping.md`. |

## Candidate Pool

| Status | Candidate | Create Or Promote When | Notes |
| --- | --- | --- | --- |
| candidate | Scheduled CJ discovery | The manual ranking, review-workspace, and shortlist-export rows land and the operator chooses automated refresh as the next ingestion step. | Create one dated plan and one `ready` queue row. Keep provider credential config and broad polling out unless explicitly selected. |
| blocked | eBay Browse fallback connector | CJ validation records that the approved CJ account lacks usable product catalog scope. | Create the fallback plan from the CJ decision evidence rather than guessing before the blocker resolves. |

## Completed Plan Archive

Completed implementation plans stay in `docs/plans/` as dated reference files.
Use the corresponding `docs/work/*.md` lane doc for completion evidence.

Recent completed plan groups:

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
