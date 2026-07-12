# Merchant Visible-Page Name Filter Implementation Plan

**Status:** ready

**Goal:** Help shoppers narrow the currently visible merchant page by merchant
name without implying server-wide directory search.

**Architecture:** Add client-local filter state to the existing rendered Relay
page. Keep the route loader, cursor contract, page-size form, safe website-link
handling, and First/Next pagination unchanged.

## Global Constraints

- Do not add backend search, schema changes, or eager cursor traversal.
- Label the filter as applying to the visible page only.
- Preserve pagination controls even when the local filter has no match.

## Owned Paths

- `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
- `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- `docs/work/frontend-merchant-discovery-demo-parity.md`

## Batches

- [ ] Add RED coverage for case-insensitive visible-page filtering, clearing,
  no-match copy, and preserved cursor links.
- [ ] Add the local name filter and visible-page scope label.
- [ ] Run focused merchant route tests, TypeScript, and diff checks; record
  evidence.
- [ ] Commit code, tests, and lane evidence together.

## Verification

- `cd assets && bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

## Exit Condition

The merchant directory can filter names on the current visible page while
retaining existing page-size, pagination, and safe-link behavior.
