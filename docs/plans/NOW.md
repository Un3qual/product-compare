# NOW

`docs/work/index.md` is the live dispatch queue.

This file is kept only for older prompts that still open `docs/plans/NOW.md`.
Do not treat it as a second status ledger.
Tools that parsed the old per-lane ledger should read `docs/work/index.md`
instead.

## Compatibility Pointer

- Queue state lives only in `docs/work/index.md`.
- Operating model and handoff rules: `docs/work/operating-model.md`
- This file intentionally contains no queue-status snapshot.

## What To Do

- For execution, open `docs/work/index.md` and claim the highest-ranked `ready`
  row that does not conflict with active ownership.
- When fewer than three `ready` rows remain, use the coordinator rules in
  `docs/work/operating-model.md` to replenish the slate to three to five in one
  pass.
- If the slate cannot reach three, keep every valid row and record the decision,
  blocker, or shortage of validated candidates in `docs/work/index.md`.
- Update this file only if the queue entry point changes.
