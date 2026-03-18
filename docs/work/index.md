# Active Work Index

Start here before opening dated plans or checkpoint logs.

## How To Use This Folder

- Read this file first.
- Open only the highest-priority item marked `Status: active` unless it is blocked.
- Verify the selected batch against the codebase before editing.
- Update this file and the referenced `docs/work/*.md` file whenever status, priority, or blockers change.

## Suggested Executor Prompt

```text
Start at docs/work/index.md and follow only the ACTIVE item(s) it lists.

Execute the `Next batch` from the highest-priority active work doc.
Before coding, verify the selected batch against the codebase and correct any drift in the work doc.
Update the work doc as you go.
Commit only at milestone boundaries defined by the active work doc.
If there is no unblocked active batch, create or update the next work doc instead of scanning the whole docs tree.
Open or update a PR only when the active work item is complete.
```

## Active Work

### 1. Frontend Product Offers Baseline

- Status: active
- Priority: P1
- Source of truth: `docs/work/frontend-product-offers.md`
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-18-frontend-product-offers-baseline-implementation-plan.md`
- Last verified: 2026-03-18 at `ca3197b` + working tree
- Next batch: execute Task 1 from `docs/plans/2026-03-18-frontend-product-offers-baseline-implementation-plan.md`.
- Why this is next:
  - `/products/:slug` now has product detail success and fallback states, but it still omits the pricing data that makes the route useful beyond navigation.
  - The backend already exposes `merchantProducts(input:)` with `latestPrice`, so the next narrow slice can stay frontend-only and add active-offer rendering without widening the backend contract.
  - The older fullstack detail milestone still includes price history and coupons, but the immediate unblocked follow-on is a terse active-offers baseline.

## Blocked / Needs Decision

- No blocked active work currently needs execution.

## Recently Completed

### Frontend Product Detail Baseline

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-product-detail.md`
- Outcome:
  - `/products/:slug` now SSR-renders basic product details from GraphQL.
  - The route now distinguishes product ready, not-found, and unavailable states with focused route regression coverage.
  - Browse product names now navigate into the detail route from `/products`.

### GraphQL Auth Migration Follow-up

- Status: completed on 2026-03-17
- Source of truth: `docs/work/graphql-auth-migration.md`
- Outcome:
  - Added `docs/decisions/2026-03-17-auth-token-delivery-deferral.md` to make the remaining transport gap explicit.
  - Closed the auth migration follow-up doc without reopening browser-auth implementation scope.

### Frontend Auth Browser Coverage

- Status: completed on 2026-03-17
- Source of truth: `docs/work/frontend-auth-browser-coverage.md`
- Outcome:
  - Added Playwright coverage for the existing frontend session, recovery, and verification routes.

### Frontend Catalog Browse

- Status: completed on 2026-03-17
- Source of truth: `docs/work/frontend-catalog-browse.md`
- Outcome:
  - `/products` now SSR-renders the first catalog page from GraphQL.
  - The route now handles empty and unavailable catalog states with focused route regression coverage.
  - Frontend verification passed with `cd assets && bun run typecheck` and `cd assets && bun run test:unit`.

## Historical Plan Notes

### Frontend Fullstack Plan

- Status: rebaselined on 2026-03-17
- Source: `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
- Reason:
  - The older umbrella plan remains historical context only.
  - The next concrete slice has now been rebaselined into `docs/work/frontend-product-detail.md`.

## Historical / Reference Only

- `docs/implementation-checklist.md` is a checkpoint log, not the active work queue.
- Dated files in `docs/plans/` are design and implementation baselines unless this index links them as active work.
