# Frontend Saved Comparison Naming Work Doc

## Snapshot

- Status: ready (saved-comparison naming data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after current source inspection and 109 passing
  compare route tests.

## Saved Comparison Naming Data Contract

- Status: ready on 2026-07-15.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Next action: move deterministic saved-comparison naming out of
  `CompareRoute` into a framework-free owner while preserving save mutation
  orchestration and route presentation.
- Owned paths:
  - `assets/src/routes/compare/saved-comparison-name-data.ts`
  - `assets/src/routes/compare/CompareRoute.tsx`
  - `assets/test/routes/compare/saved-comparison-name-data.test.ts`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `docs/work/frontend-saved-comparison-naming.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/saved-comparison-name-data.test.ts test/routes/compare/compare.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: the framework-free owner trims names, omits empty names,
  preserves product order, returns the current zero-, one-, and multi-product
  copy, and leaves the input unchanged; React retains mutation variables,
  in-flight protection, feedback, and markup.
- Candidate evidence: current source inspection found this policy embedded in
  `CompareRoute.tsx`; its existing route suite passed 109 tests.
