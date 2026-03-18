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

### 1. Frontend Catalog Browse

- Status: active
- Priority: P1
- Source of truth: `docs/work/frontend-catalog-browse.md`
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- Last verified: 2026-03-17 at `7fdb580`
- Next batch: execute Task 1 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`.
- Why this is next:
  - Auth migration follow-up is now closed by an explicit transport deferral decision.
  - The frontend has SSR, GraphQL transport, and auth foundations but still lacks a product-discovery route.
  - The backend already exposes the paginated `products` GraphQL surface needed for a narrow first browse slice.

## Blocked / Needs Decision

- No blocked active work currently needs execution.

## Recently Completed

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

## Historical Plan Notes

### Frontend Fullstack Plan

- Status: rebaselined on 2026-03-17
- Source: `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
- Reason:
  - The older umbrella plan remains historical context only.
  - The next concrete slice has now been rebaselined into `docs/work/frontend-catalog-browse.md`.

## Historical / Reference Only

- `docs/implementation-checklist.md` is a checkpoint log, not the active work queue.
- Dated files in `docs/plans/` are design and implementation baselines unless this index links them as active work.
