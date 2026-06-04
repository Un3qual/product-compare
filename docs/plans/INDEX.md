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
| ready | `docs/plans/2026-06-04-cj-feed-candidate-review-implementation-plan.md` | Execute the promoted row in `docs/work/index.md` to expose captured CJ merchant feed candidates through GraphQL and a read-only Relay route. | Close the row after focused backend/frontend verification, or promote the next ingestion decision if candidate scoring, approval UX, or scheduled discovery becomes the chosen follow-up. |

## Candidate Pool

| Status | Candidate | Create Or Promote When | Notes |
| --- | --- | --- | --- |
| candidate | Candidate scoring or approval UX | The CJ feed-candidate review route lands and product priority chooses an actionable review workflow beyond read-only inspection. | Create one dated plan and one `ready` queue row. Keep application automation and scheduled polling out unless explicitly selected. |
| blocked | eBay Browse fallback connector | CJ validation records that the approved CJ account lacks usable product catalog scope. | Create the fallback plan from the CJ decision evidence rather than guessing before the blocker resolves. |

## Completed Plan Archive

Completed implementation plans stay in `docs/plans/` as dated reference files.
Use the corresponding `docs/work/*.md` lane doc for completion evidence.

Recent completed plan groups:

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
