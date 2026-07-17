# Frontend API-Token Status-Filter Navigation Data

## Snapshot

- Status: complete
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after the final branch-review dependency fix, 84
  passing API-token route-data and route tests, TypeScript validation, and a
  transitive dependency scan.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## API-Token Status-Filter Navigation Data Contract

- Status: complete on 2026-07-17.
- Completed: `buildApiTokenStatusFilterNavigationData` now projects the stable
  ordered filter labels, canonical destinations, and exactly one current state.
  `ApiTokenControls` consumes that projection while retaining links,
  accessibility attributes, markup, and presentation.
- Verification evidence: the original RED test failed because the projection
  was absent. A final branch-review RED transitive scan then showed that the
  route-data owner still reached router, Relay, and generated-query imports
  through `api-token-status.ts` and `loader.ts`. The status helper now accepts
  only readonly `expiresAt` and `revokedAt` facts. The remaining explicit
  closure is `api-token-route-data.ts`, `api-token-status.ts`,
  `graphql-datetime.ts`, and `route-errors.ts`, with zero prohibited imports;
  the focused suites pass 84 tests.
- Blockers: none.

## Boundaries

- Preserve All, Active, and Revoked order and labels.
- Use canonical status-aware destinations and mark exactly one filter current.
- Keep link rendering, accessibility attributes, route behavior, markup, and
  presentation in React.
- Keep the route-data owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `cd assets && bun run typecheck`
- consumer and framework/transport dependency scans of the route-data module
- `git diff --check`
