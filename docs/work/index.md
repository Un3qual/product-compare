# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

Completion and coordination records removed from this live surface are
preserved in `docs/plans/2026-07-31-work-index-history.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- At least three complete `ready` implementation rows must exist at every stable
  dispatch boundary unless a complete `Ready Floor Exception` records why the
  repository currently supports fewer coherent outcomes.
- Three is the replenishment floor, not a target or maximum. Promote every
  useful, currently validated candidate whose ownership and prerequisites make
  it executable.
- A queue row is one independently shippable and reviewable outcome. Per-file,
  per-route, path-disjoint, or test-sized implementation steps belong under
  internal slices in the linked plan and lane doc.
- Group candidates that enforce the same invariant and share one acceptance
  boundary. Parallel safety alone does not justify separate queue rows.
- Numeric batch requests and the ready-row floor never justify micro-batches or
  filler. Return fewer coherent batches and record the missing decision when
  the repository does not support the requested count.
- Before a claim would leave fewer than three other ready rows, the coordinator
  validates and promotes more work or commits a complete ready floor exception
  in the same dispatch update.
- Before removing completed or blocked work, preserve truthful lane evidence
  and ensure the committed queue satisfies the floor or its explicit exception.
- `needs_decision` rows are coordinator work: resolve the decision, then promote
  every useful source-backed candidate made executable by it.
- `blocked` rows need external evidence or a product decision. Do not code around
  them.
- Workers claim the highest-ranked compatible `ready` row when three other ready
  rows will remain or the ready floor exception covers the smaller truthful set.
- Dependent, deferred, rejected, blocked, speculative, stale, and unverified
  work cannot be used as queue-depth filler.
- `active` rows are already owned by a named worker or branch. Do not start a
  second worker on them unless the coordinator reassigns the row.
- Completed lanes do not stay in this queue. Their history remains in the lane
  work doc and dated plan archive.

## Active Work

### Frontend React Router Framework Mode

Status: active
Lane: Frontend architecture
Owner: `codex/react-router-8-framework-mode`
Plan:
`docs/superpowers/plans/2026-09-02-react-router-8-framework-mode-implementation-plan.md`
Target outcome: React Router 8.3.1 Framework Mode replaces the bespoke Data
Mode router, SSR, metadata, build, and route-type infrastructure while
preserving Relay, GraphQL, Phoenix session, navigation, HTTP, SEO, and error UX
contracts.
Owned paths:

- `assets/**`
- `docs/work/frontend-react-router-framework-mode.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/superpowers/specs/2026-09-02-react-router-8-framework-mode-design.md`
- `docs/superpowers/plans/2026-09-02-react-router-8-framework-mode-implementation-plan.md`

Verification: focused route and SSR checks; complete frontend Relay,
typecheck/typegen, lint, format, Vitest, Framework build, StyleX, bundle, and
Playwright gates; `mix work_queue.validate`; `git diff --check`; full `mix ci`.
Exit condition: one verified Framework Mode architecture remains, retained
custom Relay/Phoenix boundaries are justified, frontend infrastructure is
materially reduced, and the stacked non-draft PR is published.

## Ready Work

None.

## Ready Floor Exception

Reason: The user-directed React Router Framework Mode migration is the only
currently validated coherent outcome. The preceding repository-wide quality
program is complete and its final source-backed audit found no independent
successor.
Rejected split: Package alignment, route modules, SSR/document ownership,
metadata, auth/navigation plumbing, route typing, and tests share one runtime
cutover and acceptance boundary. Treating those internal slices as separate
ready rows would create incompatible half-migrations or micro-batches.
Replenishment action: Complete the active migration, then curate current
product behavior, code, tests, architecture gaps, and lane evidence before the
next dispatch; promote every new coherent source-backed candidate found.

## Needs Decision Work

None.

## Blocked Work

None.
