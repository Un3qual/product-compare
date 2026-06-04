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
| ready | `docs/plans/2026-06-01-live-cj-provider-validation-and-source-onboarding-implementation-plan.md` | Product ingestion should execute the CJ Product Search validation batch now that owner approval and expected account access are available. | After Task 1 records Product Search scope, quota behavior, env-var-only secret handling, and a representative redacted sample, promote the first manual CJ connector batch or the eBay Browse fallback plan. |

## Candidate Pool

| Status | Candidate | Create Or Promote When | Notes |
| --- | --- | --- | --- |
| candidate | Next demo-parity/frontend candidate | The catalog browse pagination lane closes and product/backend priority chooses another specific browser-demo gap. | Create one dated plan and one `ready` queue row. Do not create several speculative plans. |
| blocked | eBay Browse fallback connector | CJ validation records that the approved CJ account lacks usable product catalog scope. | Create the fallback plan from the CJ decision evidence rather than guessing before the blocker resolves. |

## Completed Plan Archive

Completed implementation plans stay in `docs/plans/` as dated reference files.
Use the corresponding `docs/work/*.md` lane doc for completion evidence.

Recent completed plan groups:

- Frontend catalog browse pagination demo parity:
  `docs/plans/2026-06-04-frontend-catalog-browse-pagination-demo-parity-implementation-plan.md`.
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
