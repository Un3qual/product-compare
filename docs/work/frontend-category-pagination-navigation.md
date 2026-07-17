# Frontend Category Pagination Navigation

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after the explicit RED regression, 8 passing
  category tests, and the full frontend gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Category Pagination Navigation Contract

- Status: completed on 2026-07-17.
- Result: the existing framework-free next-page projection now encodes the
  category slug as one path segment while preserving the separately encoded
  cursor query value.
- Candidate evidence: before this batch, the cursor was encoded but the
  category slug was interpolated raw; the existing suites passed 8 tests but
  covered only an ordinary category slug.
- Blockers: none.

## Boundaries

- Preserve next-page and non-empty-cursor eligibility.
- Encode the category slug as one path segment and the cursor as one query
  value.
- Leave Relay loading, pagination markup, labels, and presentation in React.

## Verification

- RED: the reserved-character slug case failed because the raw slug introduced
  extra path and query delimiters.
- GREEN: `cd assets && bun x vitest run test/routes/categories/category-view-data.test.ts test/routes/categories/category.route.test.tsx`
  passed 8 tests.
- `cd assets && bun run typecheck` passed.
- The framework/transport dependency scan found no imports in the category
  view-data module.
- `cd assets && bun run check` passed Relay validation, TypeScript, all 1,356
  frontend tests, client and SSR production builds, and the client-bundle
  contract at 596,339 raw / 182,137 gzip bytes.
- `mix work_queue.validate` passed with 3 ready rows.
- `git diff --check` passed.
