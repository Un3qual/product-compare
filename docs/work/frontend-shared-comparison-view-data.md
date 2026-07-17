# Frontend Shared-Comparison View Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with 4 pure contract tests and 6 unchanged shared
  comparison snapshot tests passing, plus the complete repository gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Shared Comparison View Data Contract

- Status: done on 2026-07-16 on
  `codex/frontend-mutation-outcome-contracts`.
- Delivered `shared-comparison-view-data.ts`, a framework-free owner of
  captured title and metadata, winner-or-unsupported recommendation state,
  ordered product, accepted-claim, and offer fact rows, exact fallbacks, and
  the live-comparison path through the existing compare-path owner.
- Evidence: the pure test suite first failed because the owner did not exist.
  After the minimal extraction, its 4 tests and the 6 snapshot-route tests
  passed. TypeScript, the framework/transport scan, and `git diff --check`
  passed. `mix ci` passed with 771 backend tests, 1,297 frontend tests across
  96 files, Relay validation, TypeScript, client and SSR builds, the unchanged
  6/6 clone budget, and a 182,139-byte gzip initial bundle under the 200,000-
  byte budget.
- Blockers: none.

## Boundaries

- Preserve the generated shared-comparison query contract.
- Reuse the existing product date formatter and compare-path builder; do not
  duplicate their policies.
- Preserve source ordering for captured products, claims, offers, reasons, and
  missing-input explanations.
- Leave route state, Relay query reads, semantic markup, StyleX presentation,
  and date formatting in `SharedComparisonRoute`.

## Verification

- `cd assets && bun x vitest run test/routes/compare/shared-comparison-view-data.test.ts test/routes/compare/comparison-snapshots.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure shared-comparison view-data module
- `git diff --check`
