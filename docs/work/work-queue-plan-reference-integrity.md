# Work-Queue Plan Reference Integrity

## Snapshot

- Status: complete
- Owner: current detached worktree
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-work-queue-plan-reference-integrity-implementation-plan.md`
- Last verified: 2026-07-24 against the file-backed validator, its 12 direct
  tests, and the live queue.

## Target Outcome

File-backed queue validation proves every ready row points to an existing,
repository-contained, structurally executable implementation plan.

## Completion Evidence

- `Validator.validate/1` remains filesystem-free while requiring one
  backticked, repository-relative `docs/**/*.md` plan path per ready row and
  rejecting ambiguous, absolute, or traversing values.
- `Validator.validate_file/1` resolves plan paths from the repository root,
  checks containment and existence, and requires the implementation-plan H1,
  goal, global constraints, and Task markers.
- The 12-test focused suite covers valid, missing, escaping, ambiguous, and
  structurally incomplete references with deterministic row-indexed errors.
- The live gate validates all three reserve rows and their plans.
- Full `mix ci` passes 921 backend tests at 83.80% coverage and 1,507 frontend
  tests, with ExDNA at 3/3 and unsuppressed Dialyzer at zero warnings.

## Boundaries

- Keep pure Markdown validation filesystem-free.
- Do not require planned owned paths to exist before implementation.

## Verification

- `mix test test/product_compare/work_queue/validator_test.exs`
- `mix work_queue.validate`
- `mix ci`
