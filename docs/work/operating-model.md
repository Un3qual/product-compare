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

## Prompt Rules

Use the coordinator prompt when deciding priorities, unblocking external
dependencies, or promoting a new row.

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
Next action:
Owned paths:
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

- Promote `needs_decision` to `ready` only after choosing one concrete batch.
- Promote `blocked` to `ready` only after the missing evidence is recorded.
- Close a lane only after focused verification passes and the queue has either a
  next row or an explicit "no ready work" state.
- If a selected row requires files outside its owned paths, stop and record a
  blocker instead of widening scope silently.
