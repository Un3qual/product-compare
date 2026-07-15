# Frontend Shared Route-Error View Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after current source inspection and passing compare
  plus router characterization in the 138-test successor cohort.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Shared Route-Error View-Data Contract

- Status: ready on 2026-07-15.
- Next action: isolate response-status and network/unexpected classification,
  resource capitalization, and exact error/retry copy in a framework-free
  module while retaining React Router error detection, boundary registration,
  markup, and presentation in `RouteErrorBoundary`.
- Candidate evidence: current source inspection found shared deterministic
  presentation policy embedded in the boundary and distinct from mutation-
  error normalization; compare and router characterization passed in the five-
  suite, 138-test successor validation run.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/compare/route-error-view-data.test.ts test/routes/compare/compare.route.test.tsx test/router.test.tsx`
- `cd assets && bun run typecheck`
- framework/router dependency scan of the pure view-data module
- `git diff --check`
