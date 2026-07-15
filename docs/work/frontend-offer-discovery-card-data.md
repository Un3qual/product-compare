# Frontend Offer-Discovery Card View Data

## Snapshot

- Status: completed
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 with 6 pure card-data tests and 52 existing
  offer-discovery route tests passing (58 total), plus a clean TypeScript,
  dependency-boundary, and diff check.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Offer-Discovery Card View-Data Contract

- Status: completed on 2026-07-15 on `codex/frontend-route-data-contracts`.
- Delivered `getOfferDiscoveryCardData`, a framework-free contract for
  product/status/summary-merchant/domain/latest-price labels, nullish
  connection fallbacks, and ordered valid price-history rows. Existing
  connection objects retain identity; React retains merchant action selection,
  observations, coupon rendering, markup, accessibility, and StyleX.
- Evidence:
  `cd assets && bun x vitest run test/routes/offers/offer-discovery-card-data.test.ts test/routes/offers/offer-discovery.route.test.tsx`
  passed 58 tests (6 new pure contract tests, 52 existing route tests);
  `cd assets && bun run typecheck` passed; the forbidden dependency scan had
  no matches; and the task-path-scoped `git diff --check` passed.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/offers/offer-discovery-card-data.test.ts test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure view-data module
- `git diff --check`
