# Work-Queue Plan Reference Integrity

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-work-queue-plan-reference-integrity-implementation-plan.md`
- Last verified: 2026-07-23 against the current validator and its seven direct
  tests.

## Target Outcome

File-backed queue validation proves every ready row points to an existing,
repository-contained, structurally executable implementation plan.

## Ready Evidence

- `Validator.validate/1` checks row depth and field shape.
- `Validator.validate_file/1` currently reads the queue and delegates to the
  pure validator without inspecting plan references.
- Missing or escaping plan paths can therefore pass the live gate.

## Boundaries

- Keep pure Markdown validation filesystem-free.
- Do not require planned owned paths to exist before implementation.

## Verification

- `mix test test/product_compare/work_queue/validator_test.exs`
- `mix work_queue.validate`
- `mix ci`
