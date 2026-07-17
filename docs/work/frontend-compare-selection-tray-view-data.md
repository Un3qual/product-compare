# Frontend Compare-Selection Tray View Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with 121 passing focused tests and the full
  repository gate passing 771 backend and 1,304 frontend tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Compare-Selection Tray View Data Contract

- Status: done on 2026-07-16 on
  `codex/frontend-mutation-outcome-contracts`.
- Outcome: one framework-free data owner now returns exact selection-count
  copy, ordered selected rows with exact-slug labels and fallbacks, caller-
  owned removal paths, and open-action visibility. Empty selections reuse one
  stable row identity. `CompareSelectionTray` retains generated IDs, semantic
  markup, links, buttons, StyleX presentation, and event behavior.
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

- RED: the new pure suite failed because the framework-free tray data module
  did not exist.
- `cd assets && bun x vitest run test/routes/compare/compare-selection-tray-data.test.ts test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx`
  passed 121 tests.
- `cd assets && bun run typecheck` passed.
- The framework/transport dependency scan found no React, router, Relay,
  StyleX, transport, or browser-global dependency in the pure tray data module.
- `mix ci` passed 771 backend and 1,304 frontend tests, Relay validation,
  TypeScript, client and SSR builds, the 6/6 clone budget, and the 182,135-byte
  initial gzip bundle against the 200,000-byte budget.
- `git diff --check` passed.
