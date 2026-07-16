# Frontend Merchant Detail View Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and the passing
  two-test merchant-detail characterization.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Merchant Detail View-Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate merchant coverage summaries, freshness copy, offer-row
  projection, product-detail paths, and next-page policy in a framework-free
  module while retaining Relay reads, safe website resolution, semantic
  markup, empty and error states, and styling in `MerchantDetailRoute`.
- Candidate evidence: current source inspection found fixed summary rows,
  observation fallback copy, source-ordered offer projection, price, shipping,
  and stock labels, product paths, and encoded conditional pagination embedded
  in the React owner. The current merchant-detail suite passes two tests.
- Non-overlap: the completed trust-date and external-destination contracts keep
  their existing formatter and URL-safety ownership; this row owns the
  remaining merchant-detail presentation and path policy only.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/merchants/merchant-detail-view-data.test.ts test/routes/merchants/merchant-detail.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure view-data module
- `git diff --check`
