# Frontend Recommendation Query Input Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 28 passing
  recommendation route-data and panel tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Recommendation Query Input Data Contract

- Status: ready on 2026-07-17.
- Next action: move recommendation query variables and collision-safe reset
  identity into the existing framework-free recommendation route-data owner.
- Candidate evidence: `RecommendationPanel` currently maps profile values and
  joins slugs with `|` for reset identity while the route-data owner already
  owns recommendation profile policy. Distinct delimiter-containing slug lists
  can currently alias; the focused suites otherwise pass 28 tests.
- Blockers: none.

## Boundaries

- Preserve selected-slug order and both existing GraphQL profile enums.
- Change reset identity for profile changes and every distinct slug list,
  including delimiter-containing values.
- Keep Relay, fetch policy, Suspense, error fallback, links, markup, and
  presentation in React.
- Keep the route-data owner transitively free of React, router, Relay, StyleX,
  Radix, and generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/compare/recommendation-route-data.test.ts test/routes/compare/recommendation-panel.test.tsx`
- `cd assets && bun run typecheck`
- consumer and transitive framework/transport dependency scans of the
  recommendation route-data module
- `git diff --check`
