# Continuously Replenished Ready Queue Design

## Goal

Keep a durable runway of implementation-ready work in `docs/work/index.md` so
workers do not drain the queue and force a separate curation pass before
execution can continue.

## Problem

The current rolling-queue policy targets three to five `ready` rows, but it
permits a stable below-target state when the queue names a decision, blocker, or
shortage of validated candidates. That exception allowed the final ready row to
close while `Ready Work`, `Active Work`, `Needs Decision Work`, and `Blocked
Work` all became empty.

The policy also treats five rows as a default ceiling. That encourages a
coordinator to stop curating after restoring a small fixed slate even when more
useful, source-backed implementation work is already validated.

## Ready-Work Invariant

- The live queue has at least three `ready` implementation rows at every stable
  dispatch boundary.
- Three is the replenishment floor, not a target size or maximum.
- A coordinator promotes every useful, currently validated candidate whose
  prerequisites and ownership boundaries make it executable. There is no fixed
  upper limit.
- A `ready` row is concrete implementation work. It names its lane, next action,
  owned paths, prerequisites, verification, and exit condition.
- `active`, `blocked`, `needs_decision`, deferred, rejected, dependent,
  speculative, and unverified work does not count toward the ready-work floor.
- `None`, "no validated candidate," and candidate-shortage explanations are not
  valid stable states under `Ready Work`.

Temporary below-floor state may exist only while one coordinator-owned dispatch
update is actively replacing or closing rows. The committed queue at the end of
that update must satisfy the invariant.

## Replenishment And Curation

At every claim, promotion, completion, blocking, or reassignment boundary, the
coordinator counts the rows that will remain `ready` after the proposed update.
If fewer than three would remain, the coordinator replenishes before committing
the boundary.

Replenishment follows this order:

1. Promote all useful validated candidates already recorded in
   `docs/plans/INDEX.md` and the directly affected lane docs.
2. If the floor is still unmet, inspect current product behavior, code gaps,
   tests, architecture gaps, and lane evidence to identify additional concrete
   implementation candidates.
3. Validate each candidate against the current codebase so completed, stale,
   overlapping, or already-supported work is not promoted.
4. Write the implementation plan and complete dispatch contract needed to make
   each selected candidate genuinely executable.
5. Promote enough validated work to restore at least three ready rows, plus any
   additional useful validated candidates found during the same pass.

The coordinator does not promote work merely to increase the count. Every row
must improve the product, reliability, security, maintainability, or verified
delivery posture and must satisfy the normal ready-row contract.

## Dispatch And Completion Semantics

- Queue order remains priority order.
- A worker claims the highest-ranked compatible `ready` row only when at least
  three other `ready` rows will remain after the claim.
- Claiming one row changes only that row to `active`; other executable rows stay
  `ready`.
- Rows may execute in parallel only when their owned paths and lane work docs do
  not overlap.
- A worker completing or blocking a row records lane evidence, but the row is
  not removed from the live queue until a coordinator-owned dispatch update can
  preserve the ready-work floor.
- Completion evidence and queue replenishment belong to the same milestone
  commit when the worker owns the relevant queue paths. Otherwise the worker
  leaves a handoff for the coordinator, which performs the boundary update.
- A dependent row becomes `ready` only after its prerequisites are complete and
  its implementation contract has been revalidated.

## Insufficient Candidate Handling

An apparent lack of candidates triggers deeper curation; it does not authorize
an empty queue or a permanent shortage exception. The coordinator must inspect
current product and code boundaries and produce validated implementation plans
before more rows are claimed or closed.

If no honest implementation candidate can be validated after that inspection,
the coordinator stops new claims rather than falsifying queue state. Existing
ready rows remain recorded but unclaimed. Any already-active row may finish and
close with truthful completion evidence, because the claim guard reserved the
minimum ready runway before that row started. The coordinator then asks the user
whether the product has reached a terminal state that supersedes this
continuous-work invariant. The workflow does not represent completed work as
unfinished, and it does not invent filler.

## Documentation Changes

The implementation updates these sources together:

- `AGENTS.md`: replace the optional three-to-five slate with the minimum-three,
  uncapped invariant and the claim/closure guard.
- `docs/work/index.md`: replace empty ready state, revise queue rules and
  coordinator/worker prompts, and promote a source-backed runway of concrete
  implementation work.
- `docs/work/operating-model.md`: define stable dispatch boundaries,
  replenishment order, candidate validation, claim/closure guards, and the
  no-shortage rule.
- `docs/plans/INDEX.md`: replace the empty candidate pool with validated current
  implementation plans and clarify that useful validated candidates are not
  capped.
- `docs/plans/NOW.md`: align the compatibility pointer with the minimum floor
  and uncapped promotion behavior.
- A repository-local documentation validator: fail when the committed live
  queue contains fewer than three complete `ready` implementation rows or
  retains an empty-queue shortage state.

## Non-Goals

- Do not turn `docs/plans/INDEX.md` into a second dispatch queue.
- Do not promote deferred, rejected, blocked, dependent, speculative, stale, or
  unverified work.
- Do not weaken per-row owned-path, prerequisite, verification, or exit-condition
  requirements.
- Do not permit workers to edit coordinator-owned files unless their row names
  those files.
- Do not cap the number of useful validated ready rows.
- Do not preserve an empty queue merely because the current catalog is
  exhausted.

## Verification

- Run the documentation validator and confirm that it reports at least three
  complete `ready` implementation rows.
- Search the affected docs for stale ceiling and empty-state language, including
  `three to five`, `more than five`, `shortage of validated candidates`,
  `no ready rows`, and `Ready Work` followed by `None`.
- Confirm every promoted row maps to current code and has owned paths,
  prerequisites, verification, and an exit condition.
- Confirm the plan catalog and live queue agree on promoted versus candidate
  status without duplicating dispatch ownership.
- Run `git diff --check`.
