# Frontend API-Token Status-Filter Navigation Data

## Snapshot

- Status: complete
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after 81 passing API-token route-data and route
  tests, TypeScript validation, dependency scans, and diff validation.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## API-Token Status-Filter Navigation Data Contract

- Status: complete on 2026-07-17.
- Completed: `buildApiTokenStatusFilterNavigationData` now projects the stable
  ordered filter labels, canonical destinations, and exactly one current state.
  `ApiTokenControls` consumes that projection while retaining links,
  accessibility attributes, markup, and presentation.
- Verification evidence: the RED test failed because the projection was absent;
  after implementation, the focused route-data and route suites pass 81 tests,
  `bun run typecheck` passes, the route-data module has no framework or
  transport imports, and `git diff --check` passes.
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
