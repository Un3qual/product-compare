# Frontend Shared-Comparison View Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 6 passing
  shared comparison snapshot characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Shared Comparison View Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate captured recommendation selection, fallback copy,
  product and offer fact projection, and ordered live-comparison path
  construction in a framework-free view-data module while retaining route
  state, Relay reads, semantic markup, StyleX presentation, and date formatting
  in `SharedComparisonRoute`.
- Candidate evidence: current source inspection found these deterministic view
  policies in the React route owner; its existing snapshot loader and route
  suite passes 6 tests.
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
