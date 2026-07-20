# Comparison Interaction Correctness

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Design: `docs/superpowers/specs/2026-07-20-cross-stack-ready-work-design.md`
- Plan: `docs/superpowers/plans/2026-07-20-comparison-interaction-correctness-implementation-plan.md`
- Last verified: 2026-07-20 against comparison timestamp selection, snapshot
  revocation state, and focused route-data/component tests.

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

- Comparison decision-summary and route suites.
- Share-comparison data and route suites.
- `cd assets && bun run check`
- `mix work_queue.validate`
- `git diff --check`
