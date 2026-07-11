# Fast Execution Operating Model

This repo uses docs to dispatch work, not to preserve every detail on the active
surface. The goal is that a worker can find the next executable batch in one
screen, verify only the immediate prerequisites, and start.

## Document Roles

- `docs/work/index.md` is the only live dispatch queue.
- `docs/work/<lane>.md` stores lane-specific context, current blocker details,
  recent verification, and completion evidence.
- `docs/plans/INDEX.md` is the plan catalog and candidate pool. It does not
  duplicate the live queue.
- `docs/plans/NOW.md` is a compatibility pointer for older prompts. It points
  back to `docs/work/index.md` instead of acting as a second ledger.
- Dated files in `docs/plans/` are reference plans. Do not track live checkbox
  state in them after execution has moved to `docs/work/index.md`.
- `ARCHITECTURE.md` records durable system facts and active gaps, not per-batch
  progress.

## Status Values

- `ready`: executable now, with concrete target paths and verification.
- `active`: currently being executed by a named worker or branch.
- `blocked`: cannot proceed until named evidence, credentials, approval, or
  external state exists.
- `needs_decision`: coordinator must choose one path before implementation.
- `done`: lane-local terminal state. Done work is removed from the live queue.

## Dispatch Row Contract

Every live queue row must answer these questions:

- What is the next action?
- Which lane owns it?
- Which files may be touched?
- What verification proves the batch is complete?
- What exit condition promotes the next row, records a blocker, or closes the
  lane?

If any answer is missing, the row is not `ready`.

## Continuously Replenished Ready Work

- A stable dispatch boundary is the committed queue state after a claim,
  promotion, completion, blocking, or reassignment update.
- At least three complete `ready` implementation rows must exist at every stable
  dispatch boundary.
- Three is the replenishment floor, not a target or maximum. Promote every
  useful validated candidate found in the same curation pass.
- Count only `ready` implementation rows; `active`, `blocked`,
  `needs_decision`, deferred, rejected, dependent, speculative, stale, and
  unverified work does not count toward the floor.
- Before a claim, count the rows that will remain `ready`. A worker may claim a
  row only when three other ready rows will remain.
- Completion evidence stays truthful. Remove completed or blocked queue rows
  only in a coordinator boundary update that preserves the ready-work floor.
- If the catalog cannot restore the floor, inspect current product behavior,
  code gaps, tests, architecture gaps, and lane evidence; write executable
  plans; and validate them before dispatch resumes.
- Do not create filler work or promote deferred, rejected, blocked, dependent,
  speculative, stale, or unverified candidates.
- Rows may execute in parallel only when their owned paths and lane work docs do
  not overlap.

## Prompt Rules

Use the coordinator prompt when deciding priorities, unblocking external
dependencies, or replenishing ready work. During replenishment,
coordinators may consult `docs/plans/INDEX.md` and the directly relevant lane
docs to validate source-backed candidates.

Use the worker prompt only for `ready` rows. A worker should not browse old
plans or architecture docs looking for possible work unless the row explicitly
names those docs as target paths.

Workers should read:

1. `docs/work/index.md`
2. `docs/work/operating-model.md`
3. The selected row's work doc
4. The linked active plan only if the selected row names one
5. The target paths and immediate tests

Workers should not read broad historical docs by default.

## Plan Style

Plans should be short execution contracts, not full transcripts.

A useful plan includes:

- goal
- constraints and non-goals
- owned paths
- 1 to 5 batches
- verification commands
- blocker and fallback rules

A plan should not include:

- completed-work narratives
- repeated source code that an implementer should derive from the codebase
- checkbox status that must be kept in sync with the live queue
- broad "scan everything" instructions
- coordinator-owned docs as worker-owned files unless the row is explicitly a
  coordinator row

## Handoff Formats

Ready row handoff:

```text
Status: ready
Lane:
Plan:
Next action:
Owned paths:
Prerequisites:
Verification:
Exit condition:
```

Blocker handoff:

```text
Status: blocked
Lane:
Blocked on:
Owner:
Evidence needed:
Fallback if not resolved:
Docs updated:
```

Completion handoff:

```text
Status: done
Lane:
What changed:
Verification run:
Remaining work:
Next row promoted:
```

## Update Rules

- Update the lane work doc during execution.
- Update `docs/work/index.md` only at dispatch boundaries: promote, block, mark
  active, or close.
- Update `docs/plans/INDEX.md` only when adding, removing, or reprioritizing a
  candidate plan.
- Update `docs/plans/NOW.md` only as a short pointer back to the queue.
- Do not keep completed lanes in `docs/work/index.md`.
- Do not make a docs-only status commit for normal feature work. Bundle status
  updates with the code and verification they describe.
- A docs-only commit is appropriate only when the workflow or plan system itself
  is the deliverable.

## Promotion Rules

- Resolve a `needs_decision` row by promoting every useful source-backed
  candidate made executable by that decision.
- Promote `blocked` work only after its missing evidence is recorded, then
  continue replenishing if fewer than three ready successors would remain.
- Close a lane only after focused verification passes and the coordinator can
  preserve at least three complete `ready` implementation rows.
- When the catalog cannot preserve the floor, validate new candidates from
  current product and code evidence before another worker claims work.
- If a selected row requires files outside its owned paths, stop and record a
  blocker instead of widening scope silently.
