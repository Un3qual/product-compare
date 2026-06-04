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

- For execution, open `docs/work/index.md` and follow the highest-ranked `ready`
  row.
- If no `ready` row exists, process the highest-ranked `needs_decision` or
  `blocked` row as coordinator work.
- Update this file only if the queue entry point changes.
