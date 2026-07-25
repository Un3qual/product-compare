# Coverage Contract Hardening

## Snapshot

- Status: complete
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-24-coverage-contract-hardening-implementation-plan.md`
- Last verified: 2026-07-24 after ratcheting the coverage gate and running the
  full verification suite.

## Target Outcome

The backend coverage gate enforces an 82% floor and directly exercises the two
currently uncovered first-party Mix entry points.

## Ready Evidence

- Fresh baseline and post-ratchet coverage are both 84.05%; the configured
  floor is now 82%.
- `Mix.Tasks.WorkQueue.Validate` and
  `Mix.Tasks.ProductAttributeClaims.ValidateBackfill` now report 75.00% and
  90.91% direct coverage, respectively.

## Verification

- `mix test --cover` — 931 tests, 0 failures; 84.05% total coverage.
- `mix ci` — backend static analysis, Dialyzer, coverage, Relay/type/unit,
  client/SSR builds, and bundle contract passed. No standalone catalog
  EXPLAIN-plan failure occurred.
- `git diff --check`
