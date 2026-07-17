# Frontend Compare-Selection Tray View Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 117 passing
  catalog-browse and product-detail characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Compare-Selection Tray View Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate exact selection-count copy, ordered selected-item label
  resolution, removal-path projection, and open-action visibility in a
  framework-free data owner while retaining generated IDs, semantic markup,
  links, buttons, StyleX presentation, and caller-owned route policy in
  `CompareSelectionTray`.
- Candidate evidence: current source inspection found these deterministic
  policies in the shared React tray; its catalog-browse and product-detail
  consumer suites pass 117 tests without relying on the compare-route suite
  owned by the higher-ranked picker candidate.
- Blockers: none.

## Boundaries

- Preserve selected-slug order and exact slug identity.
- Resolve a loaded item label by exact slug and retain the slug fallback.
- Preserve caller-owned open-comparison and removal-path policy; the pure owner
  may only project the supplied paths onto selected rows.
- Leave generated IDs, semantic markup, links, buttons, StyleX presentation,
  and event behavior in `CompareSelectionTray`.

## Verification

- `cd assets && bun x vitest run test/routes/compare/compare-selection-tray-data.test.ts test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure compare-selection tray data
  module
- `git diff --check`
