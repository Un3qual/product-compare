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

- No unblocked active work is ready for execution.
- The remaining auth-migration follow-up is blocked on a concrete production token-delivery decision.

## Blocked / Needs Decision

### 1. GraphQL Auth Migration Follow-up

- Status: blocked pending transport decision
- Priority: P1
- Source of truth: `docs/work/graphql-auth-migration.md`
- Historical context:
  - `docs/plans/2026-03-16-graphql-auth-migration-design.md`
  - `docs/plans/2026-03-16-graphql-auth-migration-implementation-plan.md`
- Last verified: 2026-03-17 at `4f42fcc`
- Next batch: create or update the transport decision/status doc so the remaining auth delivery work is explicitly implemented or deferred.
- Why this is next:
  - Browser auth GraphQL routes and browser-level coverage are now in place.
  - Production token delivery is still hook-only and lacks a chosen mailer or notification transport.

## Recently Completed

### Frontend Auth Browser Coverage

- Status: completed on 2026-03-17
- Source of truth: `docs/work/frontend-auth-browser-coverage.md`
- Outcome:
  - Added Playwright coverage for the existing frontend session, recovery, and verification routes.

## Needs Rebaseline Before Execution

### Frontend Fullstack Plan

- Status: needs rebaseline
- Source: `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
- Reason:
  - The dated task list predates the auth-migration follow-up and does not maintain current progress.
  - The current frontend route surface is much smaller than the original plan assumes.
  - Pull the next concrete batch into a `docs/work/*.md` file before using it as an execution queue.

## Historical / Reference Only

- `docs/implementation-checklist.md` is a checkpoint log, not the active work queue.
- Dated files in `docs/plans/` are design and implementation baselines unless this index links them as active work.
