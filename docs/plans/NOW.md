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

- For execution, open `docs/work/index.md` and claim the highest-ranked
  compatible `ready` row only when three other ready rows will remain.
- When a proposed boundary would leave fewer than three ready rows, use the
  coordinator rules in `docs/work/operating-model.md` to validate and promote
  more implementation work first.
- Three is a floor, not a cap. Keep every additional useful validated row.
- An empty or shortage-only `Ready Work` section is invalid; run
  `mix work_queue.validate` before committing a dispatch update.
- Update this file only if the queue entry point changes.
