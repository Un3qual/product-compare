# Revenue Preview Positioning Implementation Plan

**Status:** ready

**Goal:** Make the authenticated revenue route explicit about its preview
status without adding or implying live conversion-provider ingestion.

**Architecture:** Keep the existing loader, Relay query, filters, suppression,
and error states unchanged. Add static route copy and align the authenticated
navigation label through the separately serialized viewer-aware navigation
row.

## Global Constraints

- Do not add Impact, CJ, Awin, webhook, callback, or report-pull behavior.
- Do not add credentials, raw payload persistence, or provider network calls.
- Preserve the current authenticated route and revenue query contract.

## Owned Paths

- `assets/src/routes/commerce/revenue/index.tsx`
- `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- `docs/work/affiliate-revenue-attribution.md`

## Batches

- [ ] Add RED route-copy coverage for the preview heading, recorded-data
  description, and no-live-provider disclosure.
- [ ] Add static preview positioning without changing route data behavior.
- [ ] Run the focused route suite, TypeScript, and diff checks; record evidence
  in the lane doc.
- [ ] Commit code, tests, and lane evidence together.

## Verification

- `cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

## Exit Condition

The authenticated revenue route is visibly a preview backed only by recorded
attribution data, does not claim a live conversion provider, and retains all
existing query and filter behavior with green focused tests.

