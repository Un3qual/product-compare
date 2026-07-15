# Frontend Catalog Specification Highlights Work Doc

## Snapshot

- Status: completed (catalog specification highlights data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after TDD and focused validation (68 catalog tests).

## Catalog Specification Highlights Data Contract

- Status: completed on 2026-07-15 on `codex/frontend-route-data-contracts`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Delivered: extracted deterministic specification-highlight selection into a
  framework-free data module while preserving the existing product-card markup,
  actions, omission behavior, and StyleX presentation.
- Owned paths:
  - `assets/src/routes/catalog/browse-product-list-data.ts`
  - `assets/src/routes/catalog/BrowseProductList.tsx`
  - `assets/test/routes/catalog/browse-product-list-data.test.ts`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `docs/work/frontend-catalog-specification-highlights.md`
- Verification:
  - RED: `cd assets && bun x vitest run test/routes/catalog/browse-product-list-data.test.ts`
    failed because `browse-product-list-data` did not exist.
  - `cd assets && bun x vitest run test/routes/catalog/browse-product-list-data.test.ts test/routes/catalog/browse.route.test.tsx`
    passed (68 tests).
  - `cd assets && bun run typecheck`
    passed.
  - Framework-import scan of `assets/src/routes/catalog/browse-product-list-data.ts`
    found no imports or React, Relay, router, or StyleX references.
  - `git diff --check`
- Exit condition: one framework-free owner selects at most three highlights by
  ascending explicit sort order, places unspecified orders last, preserves
  source order for ties, and does not mutate the Relay input.
- Candidate evidence: current source inspection found the deterministic sort
  and bound embedded in `BrowseProductList.tsx`. Its existing catalog route
  suite passed 62 tests.
