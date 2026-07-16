# Frontend Shared Route-Error View Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with the 13-test pure contract suite plus the
  125-test compare and router regression suites passing (138 total), clean
  TypeScript, framework/router dependency-boundary, and diff checks.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Shared Route-Error View-Data Contract

- Status: done on 2026-07-16.
- Delivered `getRouteErrorViewData`, a framework-free contract for resource
  capitalization plus default, response-status, network, and unexpected-error
  copy. `RouteErrorBoundary` retains React Router detection, boundary
  registration, markup, and presentation, then passes normalized response,
  ordinary-error, or unknown context to the pure owner.
- Evidence: the pure contract suite first failed as expected because
  `route-error-view-data.ts` did not exist. After the minimal extraction,
  `cd assets && bun x vitest run test/routes/compare/route-error-view-data.test.ts test/routes/compare/compare.route.test.tsx test/router.test.tsx`
  passed 138 tests; `cd assets && bun run typecheck` passed; the forbidden
  framework/router import scan returned no matches; and `git diff --check`
  passed.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/compare/route-error-view-data.test.ts test/routes/compare/compare.route.test.tsx test/router.test.tsx`
- `cd assets && bun run typecheck`
- framework/router dependency scan of the pure view-data module
- `git diff --check`
