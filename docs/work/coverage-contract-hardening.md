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

- The later authoritative full coverage command, `mix test --cover`, ran 931
  tests with 0 failures and reported 84.05% total coverage. It is separate
  from the earlier 928-test standalone command recorded in
  `docs/work/logger-level-test-isolation.md`.
- The pre-waiver `mix ci` run passed backend static analysis, Dialyzer,
  coverage, Relay/type/unit, client/SSR builds, and the bundle contract. No
  standalone catalog EXPLAIN-plan failure occurred. That run preceded final
  reserve-floor waiver reconciliation.
- `git diff --check`
