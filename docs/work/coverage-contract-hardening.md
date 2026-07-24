# Coverage Contract Hardening

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-24-coverage-contract-hardening-implementation-plan.md`
- Last verified: 2026-07-24 against the full baseline coverage report.

## Target Outcome

The backend coverage gate enforces an 82% floor and directly exercises the two
currently uncovered first-party Mix entry points.

## Ready Evidence

- Full baseline coverage is 83.74% while the configured floor is 69%.
- `Mix.Tasks.WorkQueue.Validate` and
  `Mix.Tasks.ProductAttributeClaims.ValidateBackfill` report 0% direct
  coverage despite tested underlying workflows.

## Verification

- New direct Mix-task suites.
- `mix test --cover`
- `mix ci`
