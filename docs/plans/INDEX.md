# Plan Index

Start at `docs/work/index.md` for the active execution state. Use this file only when no current batch is queued or the active work doc instructs you to create the next plan.

## Active Architecture Source

- `ARCHITECTURE.md`
- `docs/plans/2026-03-05-frontend-fullstack-design.md`
- `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- `docs/plans/2026-03-19-frontend-relay-route-data-design.md`

## Active Queue

1. Commerce attribution lane: `docs/plans/2026-03-23-affiliate-link-attribution-and-revenue-tracking-plan.md`
   - Status: active
   - Current implementation plan: `docs/plans/2026-05-22-commerce-revenue-summary-graphql-implementation-plan.md`
   - Scope: expose the verified revenue summary read model and dashboard JSON contract through a read-only GraphQL query. Task 1 core redirect/conversion plumbing completed on 2026-05-21; Task 2 aggregate/read-model context completed on 2026-05-22.

2. Product data ingestion lane: `docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
   - Status: blocked on first-source selection and ownership
   - Scope: choose the first connector, draft the ingestion execution ADR, and scaffold the ingestion boundary after the source/owner decision is recorded.

## Next Candidate After Active Queue

1. Backend lane follow-up
   - Depends on a new product/backend priority decision.
   - Intended scope: decide whether to extend generic node lookup to the remaining auth/affiliate entities or move the backend lane to the next GraphQL contract slice.

## Historical Reference

- `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
  - Completed on 2026-05-21.
- `docs/plans/2026-03-19-frontend-compare-saved-hardening-implementation-plan.md`
  - Completed on 2026-05-21.
- `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
  - Completed on 2026-04-30.
- `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
  - Completed on 2026-03-19.
- Earlier dated plans in `docs/plans/` remain historical context unless `docs/work/index.md` promotes one into active execution.
