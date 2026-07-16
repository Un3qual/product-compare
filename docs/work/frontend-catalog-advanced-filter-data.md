# Frontend Catalog Advanced-Filter View Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and the passing
  catalog characterization in the 82-test successor cohort.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Catalog Advanced-Filter View-Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate effective use-case, numeric, boolean, and enum
  selections, stable field identities, and selected-option disabled policy in
  a framework-free module while retaining semantic form controls,
  accessibility, uncontrolled input behavior, and presentation in
  `CatalogAdvancedFilters`.
- Candidate evidence: current source inspection found the deterministic
  selection and field-identity policy embedded in the React owner; the catalog
  characterization passed in the three-suite, 82-test successor validation
  run.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/catalog/catalog-advanced-filter-data.test.ts test/routes/catalog/browse.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure view-data module
- `git diff --check`
