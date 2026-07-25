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
first-party Mix entry points that previously lacked direct coverage.

## Baseline Evidence

- Before hardening, full baseline coverage was 83.74% while the configured
  floor was 69%.
- `Mix.Tasks.WorkQueue.Validate` and
  `Mix.Tasks.ProductAttributeClaims.ValidateBackfill` reported 0% direct
  coverage despite tested underlying workflows.

## Verification

- `mix test --cover` — 931 tests, 0 failures; 84.05% total coverage.
- The pre-waiver `mix ci` run passed backend static analysis, Dialyzer,
  coverage, Relay/type/unit, client/SSR builds, and the bundle contract. No
  standalone catalog EXPLAIN-plan failure occurred. That run preceded final
  reserve-floor waiver reconciliation.
- `git diff --check`
