# Frontend Recommendation Query Input Data

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 33 passing recommendation route-data and
  panel tests, TypeScript, dependency-closure, consumer, and whitespace checks.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Recommendation Query Input Data Contract

- Status: completed on 2026-07-17.
- Delivered: `buildRecommendationQueryInput` now owns ordered, copied GraphQL
  query variables and a structured JSON reset identity. `RecommendationPanel`
  consumes that contract while retaining Relay invocation, fetch policy,
  Suspense, error fallback, links, markup, and presentation.
- Evidence: distinct delimiter-containing slug lists no longer share a reset
  identity; profile changes still reset the boundary; both existing GraphQL
  profile enum values and selected-slug order are preserved.
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

## Completion Evidence

- RED: `cd assets && bun x vitest run test/routes/compare/recommendation-route-data.test.ts`
  failed 5 new contract tests with `TypeError: buildRecommendationQueryInput is
  not a function` before implementation.
- GREEN: `cd assets && bun x vitest run test/routes/compare/recommendation-route-data.test.ts test/routes/compare/recommendation-panel.test.tsx`
  passed 33 tests.
- `cd assets && bun run typecheck` passed.
- Recursive relative-import closure contains only
  `recommendation-route-data.ts` and `paths.ts`; the forbidden React, router,
  Relay, StyleX, Radix, transport, and generated-query import scan was empty.
- Consumer scan confirms `RecommendationPanel` is the sole production caller
  of `buildRecommendationQueryInput`; `git diff --check` passed.
