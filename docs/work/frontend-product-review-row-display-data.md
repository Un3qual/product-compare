# Frontend Product Review Row Display Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 17 passing
  product-community data and panel tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Product Review Row Display Data Contract

- Status: ready on 2026-07-17.
- Next action: move title fallback, rating-star copy, and author purchase-
  verification copy into the existing framework-free product-community data
  owner.
- Candidate evidence: `ProductCommunityPanel` currently derives these three
  deterministic values inline while the data owner already owns review summary
  and mutation policy; the focused suites pass 17 tests.
- Blockers: none.

## Boundaries

- Preserve explicit titles and the rating-out-of-five fallback.
- Preserve filled and empty five-star copy for supported ratings.
- Preserve verified and purchase-not-verified author suffixes.
- Keep bodies, list markup, forms, pagination, mutations, and presentation in
  React.
- Keep the data owner transitively free of React, router, Relay, StyleX, Radix,
  and generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/products/product-community-data.test.ts test/routes/products/product-community-panel.test.tsx`
- `cd assets && bun run typecheck`
- consumer and transitive framework/transport dependency scans of the product-
  community data module
- `git diff --check`
