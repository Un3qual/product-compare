# Frontend Category Pagination Navigation

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 8 passing
  category view-data and route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Category Pagination Navigation Contract

- Status: ready on 2026-07-17.
- Next action: encode the category slug path segment in the existing
  framework-free next-page path projection.
- Candidate evidence: the current cursor is encoded but the category slug is
  interpolated raw; the existing suites pass 8 tests but cover only an
  ordinary category slug.
- Blockers: none.

## Boundaries

- Preserve next-page and non-empty-cursor eligibility.
- Encode the category slug as one path segment and the cursor as one query
  value.
- Leave Relay loading, pagination markup, labels, and presentation in React.

## Verification

- `cd assets && bun x vitest run test/routes/categories/category-view-data.test.ts test/routes/categories/category.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the category view-data module
- `git diff --check`
