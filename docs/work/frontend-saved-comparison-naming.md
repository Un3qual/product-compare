# Frontend Saved Comparison Naming Work Doc

## Snapshot

- Status: complete (saved-comparison naming data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 with 117 passing saved-comparison naming and
  compare route tests, TypeScript, a framework-import scan, and diff checks.

## Saved Comparison Naming Data Contract

- Status: complete on 2026-07-15 on `codex/frontend-route-data-contracts`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Completed: extracted deterministic saved-comparison naming from
  `CompareRoute` into a framework-free owner while preserving save mutation
  orchestration and route presentation.
- Owned paths:
  - `assets/src/routes/compare/saved-comparison-name-data.ts`
  - `assets/src/routes/compare/CompareRoute.tsx`
  - `assets/test/routes/compare/saved-comparison-name-data.test.ts`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `docs/work/frontend-saved-comparison-naming.md`
- Verification:
  - RED: `cd assets && bun x vitest run
    test/routes/compare/saved-comparison-name-data.test.ts` failed as expected
    before implementation because the new module was absent.
  - GREEN: `cd assets && bun x vitest run
    test/routes/compare/saved-comparison-name-data.test.ts
    test/routes/compare/compare.route.test.tsx` passed 117 tests.
  - `cd assets && bun run typecheck` passed.
  - The route-data module has no imports, so it has no direct or transitive
    React, React Router, Relay, or StyleX dependencies.
  - `git diff --check` passed.
  - Review: confirmed the route still snapshots the same product IDs in order,
    uses the extracted name only for the existing mutation input, and retains
    the in-flight guard, request identity, callbacks, feedback, Relay data,
    and markup.
- Exit condition: the framework-free owner trims names, omits empty names,
  preserves product order, returns the current zero-, one-, and multi-product
  copy, and leaves the input unchanged; React retains mutation variables,
  in-flight protection, feedback, and markup.
- Candidate evidence: current source inspection found this policy embedded in
  `CompareRoute.tsx`; its existing route suite passed 109 tests.
