# Frontend Product Community Answer Pagination Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 23 passing
  product-community data and panel tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Product Community Answer Pagination Cursor Data Contract

- Status: ready on 2026-07-17.
- Next action: project initial and advancing answer-page cursors from page
  information and the cursor that produced the current page.
- Candidate evidence: `ProductCommunityPanel` derives answer cursors in two
  places instead of using the existing pure cursor owner throughout, and the
  additional-page path does not reject a repeated non-advancing cursor.
- Blockers: none.

## Boundaries

- Preserve a non-empty initial cursor only when another page exists.
- Require additional-page cursors to differ from the current request cursor.
- Keep answer accumulation, deduplication, accepted-answer labels, suspense,
  errors, queries, mutations, markup, and presentation in React.
- Keep the data owner transitively free of React, router, Relay, StyleX, Radix,
  and generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/products/product-community-data.test.ts test/routes/products/product-community-panel.test.tsx`
- `cd assets && bun run typecheck`
- consumer and transitive framework/transport dependency scans of the product-
  community data module
- `git diff --check`
