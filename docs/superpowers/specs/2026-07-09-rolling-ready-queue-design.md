# Rolling Ready Queue Design

## Goal

Keep a useful slate of executable work in `docs/work/index.md` so coordinators
do not have to promote one row after every completion.

## Problem

The current queue format can hold multiple `ready` rows, but its coordinator
rules and prompt still default to promoting exactly one row. When that row is
completed, the queue drains and requires another curation pass before a worker
can continue.

## Queue Depth Policy

- The target queue depth is three to five `ready` rows.
- A coordinator replenishes the slate in one curation pass whenever fewer than
  three `ready` rows remain at a dispatch boundary.
- A replenishment pass promotes as many source-backed rows as needed to restore
  the target range; it does not stop after the first valid row.
- More than five `ready` rows requires an explicitly requested larger execution
  batch.
- Fewer than three `ready` rows is valid only when the live queue explicitly
  names the decision, blocker, or shortage of validated candidates preventing
  replenishment.
- Coordinators must not create filler work merely to meet the target.

`ready` queue depth counts only rows whose status is `ready`. Rows marked
`active`, `blocked`, or `needs_decision` do not count toward the target.

## Dispatch Semantics

- Queue order remains priority order.
- A worker claims the highest-ranked `ready` row that does not conflict with an
  active row.
- Claiming one row changes only that row to `active`; the remaining executable
  rows stay `ready` for later or parallel workers.
- A dependent row is not `ready` until all of its prerequisites are complete.
- Rows may execute in parallel only when their owned paths and lane work docs do
  not overlap.
- If every remaining `ready` row conflicts with active ownership, workers wait
  rather than widening paths or duplicating work.

## Coordinator Behavior

At each promotion, completion, blocking, or reassignment boundary, the
coordinator checks the number of `ready` rows. If it is below three, the
coordinator should curate the complete next slate in the same pass. A valid
curation outcome is either:

1. three to five concrete `ready` rows with complete dispatch contracts; or
2. every currently valid row plus an explicit explanation for why the slate is
   smaller than three.

This replaces instructions that require exactly one decision, exactly one
promoted row, or an ending state of exactly one ready row.

## Documentation Changes

The implementation updates these sources together:

- `AGENTS.md`: add the rolling-depth rule to repository-level dispatch
  guidance.
- `docs/work/index.md`: revise queue rules and coordinator prompt to replenish a
  three-to-five-row slate.
- `docs/work/operating-model.md`: define queue-depth, replenishment, ordering,
  dependency, and active-row compatibility rules.
- `docs/plans/NOW.md`: keep the compatibility pointer aligned with multi-row
  dispatch behavior.

The policy change does not select or promote new Product Compare work. Queue
curation is a separate follow-up after the policy is in place.

## Non-Goals

- Do not turn `docs/plans/INDEX.md` into a second queue.
- Do not promote deferred, rejected, blocked, or unverified candidates.
- Do not loosen per-row owned-path, verification, or exit-condition
  requirements.
- Do not permit workers to edit coordinator-owned files unless their row names
  those files.
- Do not change product code or product priorities in this documentation batch.

## Verification

- Search the affected documentation for stale one-row-only instructions such as
  `exactly one`, `one ready row`, and `one concrete batch`.
- Confirm all affected docs consistently state the three-to-five target, the
  below-three replenishment trigger, and the explicit-exception rule.
- Run `git diff --check`.
