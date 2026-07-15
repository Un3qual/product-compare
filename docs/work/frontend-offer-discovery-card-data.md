# Frontend Offer-Discovery Card View Data

## Snapshot

- Status: active
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after current source inspection and 52 passing
  offer-discovery route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Offer-Discovery Card View-Data Contract

- Status: active on 2026-07-15 on `codex/frontend-route-data-contracts`.
- Next action: isolate product/status/merchant/domain/latest-price labels,
  nullable connection fallbacks, and ordered valid price-history rows in a
  framework-free view-data module while retaining safe/tracked merchant
  actions, observation and coupon rendering, markup, and styling in
  `OfferDiscoveryCard`.
- Candidate evidence: current source inspection found the deterministic card
  view policy embedded in the React owner, and
  `cd assets && bun x vitest run test/routes/offers/offer-discovery.route.test.tsx`
  passed 52 tests.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/offers/offer-discovery-card-data.test.ts test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure view-data module
- `git diff --check`
