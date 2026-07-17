# Frontend Merchant Detail View Data

## Snapshot

- Status: completed
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with the focused view-data and route suites (8
  tests), `assets` TypeScript, the pure-module dependency scan, and
  `git diff --check`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Merchant Detail View-Data Contract

- Status: completed on 2026-07-16 on
  `codex/category-alert-recommendation-contracts`.
- Delivered: `merchant-detail-view-data.ts` now owns fixed coverage summary
  rows, observed and unobserved freshness copy, source-ordered offer rows with
  price/shipping/stock fallbacks, encoded product paths, and conditional
  encoded next-page paths. `MerchantDetailRoute` continues to own Relay,
  external destination safety, date formatting and semantic markup, feedback
  states, and StyleX.
- Evidence: the pure suite covers exact copy and order, product availability,
  null and undefined Relay field fallbacks, all price fallbacks, pagination
  presence/absence, encoding, and immutability; the route suite confirms its
  rendered projected next link.
- Non-overlap: the completed trust-date and external-destination contracts keep
  their existing formatter and URL-safety ownership; this row owns the
  remaining merchant-detail presentation and path policy only.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/merchants/merchant-detail-view-data.test.ts test/routes/merchants/merchant-detail.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure view-data module
- `git diff --check`
