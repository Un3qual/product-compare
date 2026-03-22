# Plan Index

Start at `docs/work/index.md` for the active execution state. Use this file only when no current batch is queued or the active work doc instructs you to create the next plan.

## Active Architecture Source

- `ARCHITECTURE.md`
- `docs/plans/2026-03-05-frontend-fullstack-design.md`
- `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- `docs/plans/2026-03-19-frontend-relay-route-data-design.md`

## Active Queue

1. `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
   - Status: active
   - Scope: move the frontend off manual route-local GraphQL helpers and onto Relay preloaded queries, Relay mutations, and SSR store hydration.

## Next Candidate After Active Queue

1. `docs/plans/2026-03-19-frontend-compare-saved-hardening-implementation-plan.md`
   - Depends on the compare and saved-comparisons routes moving onto Relay route data first.
   - Intended scope: finish compare-scoped error boundaries and the remaining compare/saved route hardening on top of the Relay path.

## Historical Reference

- `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
  - Completed on 2026-03-19.
- Earlier dated plans in `docs/plans/` remain historical context unless `docs/work/index.md` promotes one into active execution.
