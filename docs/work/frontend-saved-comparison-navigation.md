# Frontend Saved Comparison Navigation Work Doc

## Snapshot

- Status: ready (saved comparison navigation data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after current source and route-state suite
  validation (31 tests).

## Saved Comparison Navigation Data Contract

- Status: ready on 2026-07-14.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Next action: move deterministic saved-set reopen and cursor-pagination paths
  out of the Relay route owner into a framework-free contract while preserving
  stored product order, query retention, mutation behavior, and route markup.
- Owned paths:
  - `assets/src/routes/compare/saved-comparisons-route-data.ts`
  - `assets/src/routes/compare/SavedComparisonsRoute.tsx`
  - `assets/test/routes/compare/saved-comparisons-route-data.test.ts`
  - `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `docs/work/frontend-saved-comparison-navigation.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-data.test.ts test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: one framework-free owner preserves ordered and encoded
  reopen links, unauthorized pagination suppression, first-page return
  visibility, and next-page links only for advancing non-empty cursors.
- Candidate evidence: current source inspection found deterministic ordered
  reopen and cursor-pagination path construction embedded in
  `SavedComparisonsRoute.tsx`. Its current route-state suite passes 31 tests.
