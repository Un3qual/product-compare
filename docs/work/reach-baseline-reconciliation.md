# Reach Baseline Reconciliation

## Snapshot

- Status: active
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

## Active Evidence

- Unsuppressed strict Reach reports 34 findings.
- The checked-in pre-decomposition baseline suppresses 34 current findings but
  points at multiple pre-extraction owners and line locations.
- Focused behavior suites cover every actionable owner.

## Boundaries

- Preserve CLI text, runtime results, and failure containment.
- Do not create speculative structs or narrow deliberate catch-all boundaries.

## Verification

- `mix reach.check --smells --strict --baseline .reach-baseline.json`
- Focused suites named in the implementation plan.
- `mix ci`
