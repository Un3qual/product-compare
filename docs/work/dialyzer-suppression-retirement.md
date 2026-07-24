# Dialyzer Suppression Retirement

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-dialyzer-suppression-retirement-implementation-plan.md`
- Last verified: 2026-07-23 against the current Dialyzer output and
  `.dialyzer_ignore.exs`.

## Target Outcome

Dialyzer runs without stale or reachable suppressions while public runtime and
type contracts remain precise.

## Ready Evidence

- The current run reports 11 skipped findings and eight unnecessary skips.
- The ignore file contains 18 path-and-message suppressions across context,
  schema, plug, resolver, runtime-config, and test-support owners.
- Direct suites exist for every affected domain.

## Boundaries

- Do not weaken types to silence analysis.
- Preserve all public behavior and domain policy.

## Verification

- `mix dialyzer`
- Affected context and web suites named in the implementation plan.
- `mix ci`
