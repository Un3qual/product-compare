# Frontend Account And Setup Presentation Contracts

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-20-account-setup-interaction-contracts-implementation-plan.md`
- Last verified: 2026-07-18 from the existing affiliate and API-token source,
  lane evidence, and focused characterization suites.

## Batch Outcome

Authenticated setup and account surfaces obtain deterministic merchant-context
copy and API-token lifecycle action policy from their existing framework-free
owners without changing forms, mutations, accessibility, or presentation.

## Internal Slices

1. Affiliate selected/current merchant-context copy.
2. API-token lifecycle action visibility, disabled state, and pending copy.

These slices use path-disjoint milestone commits but share one reviewer gate and
one queue status. They must not be promoted as separate replacement rows.

## Boundaries

- Preserve all current normal-path copy and action behavior.
- Preserve row-scoped API-token mutual exclusion.
- Keep form refs, Relay mutations, callbacks, markup, and styling in React.
- Keep pure owners transitively free of framework and transport dependencies.

## Verification

- Focused affiliate setup data and route suites.
- Focused API-token route-data and route suites.
- `cd assets && bun run typecheck`
- `cd assets && bun run check`
- pure-module dependency scans
- `git diff --check`
