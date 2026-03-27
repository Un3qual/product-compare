# Plan Index

Start at `docs/work/index.md` for the active execution state. Use this file only when no current batch is queued or the active work doc instructs you to create the next plan.

## Active Architecture Source

- `ARCHITECTURE.md`
- `docs/plans/2026-03-05-frontend-fullstack-design.md`
- `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- `docs/plans/2026-03-19-frontend-relay-route-data-design.md`

## Active Queue

1. Frontend lane: `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
   - Status: active
   - Scope: move the frontend off manual route-local GraphQL helpers and onto Relay preloaded queries, Relay mutations, and SSR store hydration.

2. Backend lane: `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
   - Status: active
   - Scope: add the missing root Relay `node(id: ID!)` lookup for the existing global-ID-backed catalog/pricing surfaces without touching the frontend lane.

## Next Candidate After Active Queue

1. Frontend lane: `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
   - Depends on the compare route Relay migration landing first.
   - Intended scope: add the `/compare/saved` route plus reopen/delete UI on top of the new Relay compare pattern.

2. Frontend quality hardening follow-up
   - Depends on the Relay migration and saved-comparisons UI landing first.
   - Intended scope: route-level error-boundary, accessibility, and responsive hardening for compare and saved-set routes.

3. Backend lane follow-up
   - Depends on the initial `node(id: ID!)` slice landing first.
   - Intended scope: decide whether to extend generic node lookup to the remaining auth/affiliate entities or move the backend lane to the next GraphQL contract slice.

## Historical Reference

- Earlier dated plans in `docs/plans/` remain historical context unless `docs/work/index.md` promotes one into active execution.
