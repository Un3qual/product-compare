# Comparison Interaction Correctness

## Snapshot

- Status: complete
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Design: `docs/superpowers/specs/2026-07-20-cross-stack-ready-work-design.md`
- Plan: `docs/superpowers/plans/2026-07-20-comparison-interaction-correctness-implementation-plan.md`
- Last verified: 2026-07-20 against the implemented strict timestamp selection,
  row-scoped snapshot revocation state, and full frontend gate.

## Batch Outcome

Comparison observations use strict temporal truth and snapshot revocation
pending/failure state applies only to the affected snapshot row.

## Ready Evidence

- Comparison recency labels and most-recent selection still accept invalid
  GraphQL DateTime shapes through permissive JavaScript date parsing.
- Snapshot revocation uses global pending state, so one in-flight row can
  disable or relabel unrelated snapshots.
- Both defects share the comparison route acceptance boundary and focused
  regression suite.

## Internal Slices

1. Strict comparison timestamp labels and recency selection.
2. Row-scoped snapshot revocation pending, duplicate guard, and error state.

## Boundaries

- Preserve valid labels, ordering, selected product order, and semantic time
  values.
- Preserve successful mutation payload handling, accessibility, markup, and
  presentation.
- Independent snapshot rows remain actionable.

## Verification

- RED: two invalid recency labels and one invalid most-recent winner failed under
  permissive JavaScript parsing.
- GREEN: decision-summary and compare-route suites passed (119 tests),
  including impossible dates, missing offsets, malformed values, and
  chronological comparison across explicit offsets.
- RED: the two-row snapshot suite showed the selected row stayed enabled while
  its revoke mutation was in flight, and the pure row policy was absent.
- GREEN: share-comparison data and comparison-snapshot suites passed (41
  tests); pending copy, duplicate suppression, and failure feedback are keyed
  by snapshot ID while independent rows stay enabled.
- The combined comparison cohort passed (4 files, 160 tests).
- `cd assets && bun run check` passed (104 files, 1505 tests, Relay,
  TypeScript, client/SSR builds, and 182,154-byte gzip initial bundle).
- `mix work_queue.validate` passed with 7 ready rows.
- `git diff --check` passed.
