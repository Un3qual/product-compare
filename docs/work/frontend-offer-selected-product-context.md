# Frontend Offer Selected-Product Context

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after the explicit RED regression, 73 passing
  offer-discovery tests, and the full frontend gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Offer-Discovery Selected-Product Context Contract

- Status: completed on 2026-07-17.
- Result: the framework-free filter-data owner now qualifies nullable selected-
  product nodes by typename and projects exact brand, ID, name, and slug
  context while preserving the source brand object.
- Candidate evidence: before this batch, the route projected brand, ID, name,
  and slug after a `Product` typename check; the baseline focused suites passed
  68 tests.
- Blockers: none.

## Boundaries

- Return no context for nullish or non-product nodes.
- Preserve exact brand, ID, name, and slug values for product nodes.
- Leave Relay reads, suspense and error boundaries, offer rendering, summaries,
  markup, and presentation unchanged.
- Keep the filter-data owner free of React, Relay, router, StyleX, Radix, and
  generated-query dependencies.

## Verification

- RED: five qualification and projection cases failed because the framework-
  free function did not exist.
- GREEN: `cd assets && bun x vitest run test/routes/offers/offer-discovery-filter-data.test.ts test/routes/offers/offer-discovery.route.test.tsx`
  passed 73 tests.
- `cd assets && bun run typecheck` passed.
- The framework/transport dependency scan found no React, Relay, router,
  StyleX, Radix, or generated-query imports in the filter-data module.
- `cd assets && bun run check` passed Relay validation, TypeScript, all 1,368
  frontend tests, client and SSR production builds, and the client-bundle
  contract at 596,339 raw / 182,150 gzip bytes.
- `git diff --check` passed.
