# Frontend Row-Scoped Asynchronous Action State

## Snapshot

- Status: grouped into alert lifecycle reliability and comparison interaction
  correctness
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plans:
  - `docs/superpowers/plans/2026-07-20-alert-lifecycle-reliability-implementation-plan.md`
  - `docs/superpowers/plans/2026-07-20-comparison-interaction-correctness-implementation-plan.md`
- Last verified: 2026-07-18 from current comparison-snapshot and price-alert
  mutation state source.

## Batch Outcome

List mutations expose pending and failure feedback only on the affected row.
Revoking one comparison snapshot does not disable or relabel every snapshot,
and a failed alert/watch mutation is associated with the row that failed.

## Internal Slices

1. Row-scoped comparison-snapshot revocation pending state and duplicate guard.
2. Row-scoped alert and price-watch mutation error feedback.

These remain lane evidence. They are dispatched through their domain batches,
not as a separate live queue row.

## Boundaries

- Preserve successful mutation payload handling and revalidation.
- Preserve row-level mutual exclusion while an action is in flight.
- Allow independent rows to remain actionable.
- Keep GraphQL operations, accessibility labels, markup, and presentation.

## Verification

- Focused share-comparison data and compare route suites.
- Focused alerts route suite.
- `cd assets && bun run typecheck`
- `cd assets && bun run check`
- `git diff --check`
