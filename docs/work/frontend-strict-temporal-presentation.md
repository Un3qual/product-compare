# Frontend Strict Temporal Presentation

## Snapshot

- Status: grouped into alert lifecycle reliability and comparison interaction
  correctness
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plans:
  - `docs/superpowers/plans/2026-07-20-alert-lifecycle-reliability-implementation-plan.md`
  - `docs/superpowers/plans/2026-07-20-comparison-interaction-correctness-implementation-plan.md`
- Last verified: 2026-07-18 from current alert and comparison observation
  formatting and recency-selection source.

## Batch Outcome

Alert and comparison observation dates use the existing strict GraphQL
DateTime contract. Impossible calendar dates, missing offsets, and malformed
timestamps cannot be normalized into a different factual label or selected as
the most recent observation.

## Internal Slices

1. Price-alert observation labels with exact invalid-source fallback.
2. Comparison recency labels and most-recent observation selection.

These remain lane evidence. They are dispatched through their domain batches,
not as a separate live queue row.

## Boundaries

- Reuse `graphQLDateTimeLabel` and `parseGraphQLDateTime`.
- Preserve valid timestamp labels and original source values in semantic time
  attributes.
- Preserve comparison ordering and copy for valid observations.
- Keep date policy framework-free and covered behaviorally.

## Verification

- Focused alerts view-data and route suites.
- Focused comparison decision-summary and route suites.
- `cd assets && bun run typecheck`
- `cd assets && bun run check`
- `git diff --check`
