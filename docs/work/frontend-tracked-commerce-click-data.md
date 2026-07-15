# Frontend Tracked-Commerce Click Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after current source inspection and 51 passing
  offer-discovery route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Tracked-Commerce Click Data Contract

- Status: ready on 2026-07-15.
- Next action: isolate normal click qualification, encoded first-party tracking
  href construction, and API-origin redirect resolution in a framework-free
  data module while retaining event handling, pending/error state, Relay
  mutation orchestration, browser navigation, and markup in
  `TrackedCommerceClickAction`.
- Candidate evidence: current source inspection found the deterministic click
  and redirect policy embedded in the React owner, and
  `cd assets && bun x vitest run test/routes/offers/offer-discovery.route.test.tsx`
  passed 51 tests.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/offers/tracked-commerce-click-data.test.ts test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
