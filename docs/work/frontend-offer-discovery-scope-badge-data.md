# Frontend Offer Discovery Scope Badge Data

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after Task 71 implementation: 75 passing offer
  filter-data and route tests plus TypeScript and dependency-boundary checks.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Offer Discovery Scope Badge Data Contract

- Status: completed on 2026-07-17.
- Delivered: `getOfferDiscoveryFilterData` now projects a deterministic
  `scopeBadge` with the active/all label and tone, and `OfferDiscoveryList`
  passes that data to the existing `StatusBadge` markup.
- Evidence: behavior tests cover both scope states and frozen input;
  `bun x vitest run test/routes/offers/offer-discovery-filter-data.test.ts
  test/routes/offers/offer-discovery.route.test.tsx` passed 75 tests and
  `bun run typecheck` passed.
- Blockers: none.

## Boundaries

- Active-only filters retain the Active offers label and positive tone.
- All-offer filters retain the All offers label and neutral tone.
- Keep filtering, offer ordering, StatusBadge markup, and presentation in
  React.
- Keep the filter-data owner transitively free of React, router, Relay, StyleX,
  Radix, and generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/offers/offer-discovery-filter-data.test.ts test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- consumer and transitive framework/transport dependency scans of the offer
  filter-data module
- `git diff --check`

## Completion Evidence

- The pure owner has no relative imports, so its recursive relative-import
  closure is the owner itself; the checked closure contains no React, router,
  Relay, StyleX, Radix, generated-query, or transport dependencies.
- Consumer scan confirms `OfferDiscoveryList` consumes the pure owner while
  retaining filtering, ordering, and `StatusBadge` presentation.
- `git diff --check` passed.
