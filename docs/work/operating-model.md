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
`mix work_queue.validate` enforces the complete handoff, including a non-empty
`Batch outcome` and at least one `Internal slices` item.

## Batch And Slice Granularity

A queue row is the smallest independently shippable outcome that deserves its
own reviewer decision. It is not the smallest edit an agent can make.

- Group changes when they enforce the same invariant, share one acceptance
  boundary, and would normally be approved or rejected together.
- Frontend and backend are implementation layers, not separate queues. Group
  cross-stack slices when they close one lifecycle invariant—for example,
  fault-isolated alert evaluation plus truthful alert presentation—but keep
  unrelated backend ingestion and frontend account policy as separate rows.
- Put per-surface, per-file, or path-disjoint work under `Internal slices` in
  the batch plan and lane doc. Use focused test cycles and milestone commits
  for those slices without promoting each slice as a separate queue row.
- Parallel-safe ownership makes internal slices eligible for concurrent
  execution; it does not by itself make them separate product or engineering
  batches.
- Split a candidate only when its parts have materially different outcomes,
  prerequisites, failure modes, rollback boundaries, or reviewer decisions.
- Do not distinguish queue rows only by helper, component, route, file, or test
  suite when one cross-surface invariant explains all of them.
- When a user requests a numeric batch count, return fewer batches if only a
  smaller coherent set is source-backed. Never manufacture micro-batches to
  satisfy the number.
- The ready-work floor never overrides batch coherence. If the catalog cannot
  supply three coherent batches, record the coordinator or product decision
  needed to replenish it instead of subdividing implementation steps.

Before promotion, the coordinator should be able to answer both questions:

1. What independently shippable outcome does this row deliver?
2. Could a reviewer reasonably approve this row while rejecting its nearest
   candidate? If not, group them.

The same test applies across lanes. A frontend-only queue is valid only when a
live source/contract audit finds no ready backend outcome; lane labels alone are
never evidence that the backend has no work.

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
- Do not count internal plan slices, per-file steps, or milestone commits as
  separate ready rows.
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
- internal slices for focused test cycles, ownership, and milestone commits
- verification commands
- blocker and fallback rules

A plan should not include:

- completed-work narratives
- repeated source code that an implementer should derive from the codebase
- checkbox status that must be kept in sync with the live queue
- broad "scan everything" instructions
- one nominal batch per helper, component, route, file, or test suite when the
  work shares one invariant and acceptance boundary
- coordinator-owned docs as worker-owned files unless the row is explicitly a
  coordinator row

A `ready` lane work doc labels its prospective contract `Target Outcome` and
writes it in prospective language. Rename that section to `Batch Outcome` only
after implementation and verification are complete, when it describes observed
behavior rather than planned behavior.

## Handoff Formats

Ready row handoff:

```text
Status: ready
Lane:
Plan:
Batch outcome:
Next action:
Owned paths:
Internal slices:
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
- Apply the batch-and-slice test before promotion. A replenishment update that
  turns one shared invariant into several route- or file-sized rows is invalid
  curation even if every row is otherwise executable.
- If a selected row requires files outside its owned paths, stop and record a
  blocker instead of widening scope silently.
