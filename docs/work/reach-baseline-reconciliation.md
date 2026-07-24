# Reach Baseline Reconciliation

## Snapshot

- Status: complete
- Priority: P1
- Owner: current detached worktree
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-24-reach-baseline-reconciliation-implementation-plan.md`
- Last verified: 2026-07-24 against an unsuppressed strict Reach run.

## Target Outcome

Actionable eager, redundant, string-building, and private-forwarder findings
are removed, while the regenerated baseline documents only intentional stable
map shapes and broad failure-containment boundaries.

## Completion Evidence

- The fresh unsuppressed strict run started at 34 findings. Mechanical
  expression cleanup removed 9, one-pass CLI rendering removed 12, and direct
  owner calls removed 2 private forwarders.
- The regenerated baseline contains exactly 11 intentional findings: 4 stable
  boundary maps and 7 broad rescue boundaries.
- The retained maps are fixed external or persistence projections. The retained
  rescues contain scheduled, operator, or ingestion failures at explicit
  reporting boundaries; narrowing them would change the failure contract.
- Focused behavior gates passed 106 tests for mechanical changes, 38 tests for
  CLI rendering, and 31 tests for direct owner calls.
- Strict baseline-backed Reach passes with 11 suppressions. Full `mix ci`
  passes 921 backend tests at 83.73% coverage and 1,507 frontend tests, with
  ExDNA at 3/3 and Dialyzer reporting zero errors, skipped findings, or
  unnecessary skips.

## Boundaries

- Preserve CLI text, runtime results, and failure containment.
- Do not create speculative structs or narrow deliberate catch-all boundaries.

## Verification

- `mix reach.check --smells --strict --baseline .reach-baseline.json`
- Focused suites named in the implementation plan.
- `mix ci`
