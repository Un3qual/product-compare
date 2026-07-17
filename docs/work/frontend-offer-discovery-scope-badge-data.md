# Frontend Offer Discovery Scope Badge Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 73 passing
  offer filter-data and route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Offer Discovery Scope Badge Data Contract

- Status: ready on 2026-07-17.
- Next action: move active/all scope label and badge-tone policy into the
  existing framework-free offer filter-data owner.
- Candidate evidence: `OfferDiscoveryList` currently derives label and tone
  directly from `activeOnly`, while the filter-data owner already owns the
  same status semantics; the focused suites pass 73 tests.
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
