# Frontend Catalog Specification Highlights Work Doc

## Snapshot

- Status: ready (catalog specification highlights data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after current source and integration-suite
  validation (62 catalog route tests).

## Catalog Specification Highlights Data Contract

- Status: ready on 2026-07-14.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Next action: move deterministic specification-highlight selection out of the
  StyleX product-list owner into a framework-free contract while preserving
  current product-card markup and actions.
- Owned paths:
  - `assets/src/routes/catalog/browse-product-list-data.ts`
  - `assets/src/routes/catalog/BrowseProductList.tsx`
  - `assets/test/routes/catalog/browse-product-list-data.test.ts`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `docs/work/frontend-catalog-specification-highlights.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/catalog/browse-product-list-data.test.ts test/routes/catalog/browse.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: one framework-free owner selects at most three highlights by
  ascending explicit sort order, places unspecified orders last, preserves
  source order for ties, and does not mutate the Relay input.
- Candidate evidence: current source inspection found the deterministic sort
  and bound embedded in `BrowseProductList.tsx`. Its existing catalog route
  suite passed 62 tests.
