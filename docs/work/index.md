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

### 1. GraphQL Auth Migration Follow-up

- Status: active
- Priority: P1
- Source of truth: `docs/work/graphql-auth-migration.md`
- Historical context:
  - `docs/plans/2026-03-16-graphql-auth-migration-design.md`
  - `docs/plans/2026-03-16-graphql-auth-migration-implementation-plan.md`
- Last verified: 2026-03-17 at `fd29b13`
- Next batch: rebaseline the remaining frontend auth work into a current execution doc, and keep delivery transport as a separate blocked track until a concrete transport decision exists.
- Why this is next:
  - Backend GraphQL auth recovery and verification mutations already exist.
  - The remaining frontend auth work is not yet tracked in a current execution doc.
  - Production token delivery is still hook-only and lacks a chosen mailer or notification transport.

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
