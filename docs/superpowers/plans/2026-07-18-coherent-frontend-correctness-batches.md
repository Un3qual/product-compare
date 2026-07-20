# Coherent Frontend Correctness Batches Implementation Plan

> **Dispatch note (2026-07-20):** Superseded by the approved cross-stack design
> and seven 2026-07-20 implementation plans. This file remains historical
> grouping evidence; workers must use `docs/work/index.md` for live dispatch.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver four independently reviewable frontend correctness outcomes
without promoting each route, helper, or test cycle as a separate queue batch.

**Architecture:** Existing framework-free route-data owners remain the policy
boundaries. A shared Relay cursor helper owns the cross-surface advancing-cursor
invariant; strict GraphQL DateTime helpers own temporal validation; React
continues to own Relay, local state, effects, mutations, markup, and styling.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript 5.8, Vitest, Bun,
StyleX.

## Global Constraints

- Preserve GraphQL operations, Relay request timing, URL parameter order,
  cursor encoding, normal-path copy, markup, and accessibility unless an
  explicit correctness requirement below changes them.
- Use behavioral tests and verify RED before production changes.
- Keep pure data modules transitively free of React, Relay, router, StyleX,
  Radix, and generated-query imports.
- Treat each numbered task as one queue batch. Lettered slices are internal
  test and commit milestones, not separate queue rows.
- Update only the batch lane doc during execution; the coordinator updates the
  live queue at dispatch boundaries.

---

### Task 1: Account And Setup Presentation Contracts

**Files:**

- Modify: `assets/src/routes/affiliate/setup/affiliate-setup-data.ts`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupForms.tsx`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup-data.test.ts`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- Modify: `assets/src/routes/account/api-tokens/api-token-route-data.ts`
- Modify: `assets/src/routes/account/api-tokens/ApiTokenItem.tsx`
- Modify: `assets/test/routes/account/api-tokens/api-token-route-data.test.ts`
- Modify: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Modify: `docs/work/frontend-account-setup-presentation-contracts.md`

**Interfaces:**

- The affiliate data owner produces nullable selected- and current-merchant
  copy from the canonical merchant choice and `getMerchantSummary` result.
- The API-token data owner produces rotate/revoke visibility, disabled state,
  and exact pending copy from lifecycle facts and row-scoped pending facts.

- [ ] **Slice A: Affiliate merchant-context copy** — add failing pure and route
  cases for all three selected-merchant forms, current-merchant context, and a
  missing selection; then move exact copy construction into
  `affiliate-setup-data.ts` without moving markup or selection state.
- [ ] **Slice A verification** — run
  `cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup-data.test.ts test/routes/affiliate/setup/affiliate-setup.route.test.tsx`,
  `cd assets && bun run typecheck`, the pure-module dependency scan, and
  `git diff --check`; commit code, tests, and lane evidence together.
- [ ] **Slice B: API-token lifecycle actions** — add failing pure and route
  cases for revoked, expired, active, rotate-pending, and revoke-pending rows;
  then move action visibility, mutual exclusion, and exact button copy into
  `api-token-route-data.ts` while React retains forms, refs, and callbacks.
- [ ] **Slice B verification** — run
  `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`,
  `cd assets && bun run typecheck`, the pure-module dependency scan, and
  `git diff --check`; commit code, tests, and lane evidence together.
- [ ] **Batch gate** — run `cd assets && bun run check` and `git diff --check`.

---

### Task 2: Frontend Cursor Forward-Progress Hardening

**Files:**

- Create: `assets/src/routes/relay-pagination.ts`
- Create: `assets/test/routes/relay-pagination.test.ts`
- Modify: `assets/src/routes/products/product-community-data.ts`
- Modify: `assets/src/routes/products/ProductCommunityPanel.tsx`
- Modify: `assets/test/routes/products/product-community-data.test.ts`
- Modify: `assets/test/routes/products/product-community-panel.test.tsx`
- Modify: `assets/src/routes/compare/compare-picker-data.ts`
- Modify: `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
- Modify: `assets/test/routes/compare/compare-picker-data.test.ts`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `assets/src/routes/products/product-offer-panel-data.ts`
- Modify: `assets/src/routes/products/ProductOfferPanel.tsx`
- Modify: `assets/test/routes/products/product-offer-panel-data.test.ts`
- Modify: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `assets/src/routes/catalog/paths.ts`
- Modify: `assets/test/routes/catalog/browse.route.test.tsx`
- Modify: `assets/src/routes/offers/offer-discovery-filter-data.ts`
- Modify: `assets/test/routes/offers/offer-discovery-filter-data.test.ts`
- Modify: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Modify: `assets/src/routes/categories/category-view-data.ts`
- Modify: `assets/src/routes/categories/CategoryRoute.tsx`
- Modify: `assets/src/routes/categories/loader.ts`
- Modify: `assets/test/routes/categories/category-view-data.test.ts`
- Modify: `assets/test/routes/categories/category.route.test.tsx`
- Modify: `assets/src/routes/merchants/pagination.ts`
- Modify: `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
- Modify: `assets/test/routes/merchants/merchant-directory-view-data.test.ts`
- Modify: `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- Modify: `assets/src/routes/merchants/detail/merchant-detail-view-data.ts`
- Modify: `assets/src/routes/merchants/detail/MerchantDetailRoute.tsx`
- Modify: `assets/src/routes/merchants/detail/loader.ts`
- Modify: `assets/test/routes/merchants/merchant-detail-view-data.test.ts`
- Modify: `assets/test/routes/merchants/merchant-detail.route.test.tsx`
- Modify: `assets/src/routes/account/api-tokens/api-token-route-data.ts`
- Modify: `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- Modify: `assets/test/routes/account/api-tokens/api-token-route-data.test.ts`
- Modify: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Modify: `assets/src/routes/affiliate/setup/pagination.ts`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- Modify: `docs/work/frontend-cursor-forward-progress.md`

**Interface:**

```ts
export type RelayPageInfo = {
  readonly endCursor?: string | null;
  readonly hasNextPage?: boolean | null;
};

export function nextRelayPageCursor(
  pageInfo: RelayPageInfo | null | undefined,
  currentAfter?: string | null
): string | null;
```

The helper returns the original cursor only when `hasNextPage === true`, the
cursor is a nonblank string, and it differs from `currentAfter`.

- [ ] **Slice A: Shared invariant and community pagination** — verify RED for
  blank and repeated cursors, implement `nextRelayPageCursor`, and route initial
  and advancing answer/review/question pagination through it.
- [ ] **Slice A verification** — run
  `cd assets && bun x vitest run test/routes/relay-pagination.test.ts test/routes/products/product-community-data.test.ts test/routes/products/product-community-panel.test.tsx`,
  `cd assets && bun run typecheck`, the shared-helper dependency scan, and
  `git diff --check`; commit code, tests, and lane evidence together.
- [ ] **Slice B: Stateful compare and product-offer pagination** — pass the
  current cursor into compare-picker and product-offer pagination and suppress
  repeated callbacks or links.
- [ ] **Slice B verification** — run
  `cd assets && bun x vitest run test/routes/compare/compare-picker-data.test.ts test/routes/compare/compare.route.test.tsx test/routes/products/product-offer-panel-data.test.ts test/routes/products/detail.route.test.tsx`,
  `cd assets && bun run typecheck`, and `git diff --check`; commit code, tests,
  and lane evidence together.
- [ ] **Slice C: Public URL pagination** — apply the helper to catalog browse,
  offer discovery, categories, merchant directory, and merchant detail while
  preserving first-page paths and encoded URL state.
- [ ] **Slice C verification** — run
  `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx test/routes/offers/offer-discovery-filter-data.test.ts test/routes/offers/offer-discovery.route.test.tsx test/routes/categories/category-view-data.test.ts test/routes/categories/category.route.test.tsx test/routes/merchants/merchant-directory-view-data.test.ts test/routes/merchants/merchant-directory.route.test.tsx test/routes/merchants/merchant-detail-view-data.test.ts test/routes/merchants/merchant-detail.route.test.tsx`,
  `cd assets && bun run typecheck`, and `git diff --check`; commit code, tests,
  and lane evidence together.
- [ ] **Slice D: Account and setup URL pagination** — apply the helper to API-
  token and affiliate-setup pagination while preserving status, page-size, and
  merchant state.
- [ ] **Slice D verification** — run
  `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx test/routes/affiliate/setup/affiliate-setup.route.test.tsx`,
  `cd assets && bun run typecheck`, and `git diff --check`; commit code, tests,
  and lane evidence together.
- [ ] **Batch gate** — run `cd assets && bun run check` and `git diff --check`.

---

### Task 3: Strict Temporal Presentation

**Files:**

- Modify: `assets/src/routes/account/alerts/alerts-view-data.ts`
- Modify: `assets/test/routes/account/alerts/alerts-view-data.test.ts`
- Modify: `assets/test/routes/account/alerts/alerts.route.test.tsx`
- Modify: `assets/src/routes/compare/decision-summary-data.ts`
- Modify: `assets/src/routes/compare/loader.ts`
- Modify: `assets/test/routes/compare/decision-summary-data.test.ts`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `docs/work/frontend-strict-temporal-presentation.md`

**Interfaces:** Use `graphQLDateTimeLabel` for display labels and
`parseGraphQLDateTime` for chronological comparison. Invalid calendar dates,
timestamps without offsets, and malformed values must not be normalized into a
different factual date.

- [ ] **Slice A: Alert observation labels** — add RED coverage for impossible
  dates and missing offsets, then return the strict label or the original
  source fallback.
- [ ] **Slice B: Comparison observation truth** — add RED coverage proving
  invalid timestamps cannot win most-recent selection or produce a recency
  label, then use the shared strict parser and label helper.
- [ ] **Batch gate** — run
  `cd assets && bun x vitest run test/routes/account/alerts/alerts-view-data.test.ts test/routes/account/alerts/alerts.route.test.tsx test/routes/compare/decision-summary-data.test.ts test/routes/compare/compare.route.test.tsx`,
  `cd assets && bun run typecheck`, `cd assets && bun run check`, and
  `git diff --check`; commit code, tests, and lane evidence together.

---

### Task 4: Row-Scoped Asynchronous Action State

**Files:**

- Modify: `assets/src/routes/compare/share-comparison-data.ts`
- Modify: `assets/src/routes/compare/ShareComparisonControl.tsx`
- Modify: `assets/test/routes/compare/share-comparison-data.test.ts`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `assets/src/routes/account/alerts/AlertsRoute.tsx`
- Modify: `assets/test/routes/account/alerts/alerts.route.test.tsx`
- Modify: `docs/work/frontend-row-scoped-action-state.md`

**Interfaces:** Snapshot revocation tracks in-flight snapshot IDs instead of
using one global pending boolean. Alert and watch mutation failures are keyed by
row ID and render beside the affected row; pending operations retain row-level
mutual exclusion.

- [ ] **Slice A: Snapshot revocation** — add RED coverage with two rows, revoke
  one, and prove only that row is disabled and shows `Revoking…`; implement an
  in-flight ID guard and clear it in every completion path.
- [ ] **Slice B: Alert and watch feedback** — add RED coverage for mark-read,
  toggle, and delete failures on one of multiple rows; replace the global error
  with row-keyed feedback while preserving revalidation and pending-ID guards.
- [ ] **Batch gate** — run
  `cd assets && bun x vitest run test/routes/compare/share-comparison-data.test.ts test/routes/compare/compare.route.test.tsx test/routes/account/alerts/alerts.route.test.tsx`,
  `cd assets && bun run typecheck`, `cd assets && bun run check`, and
  `git diff --check`; commit code, tests, and lane evidence together.

## Final Program Gate

- [ ] Run `cd assets && bun run check`.
- [ ] Run `mix work_queue.validate` at every coordinator boundary.
- [ ] Run `git diff --check`.
- [ ] Confirm each queue row closed one shippable outcome and no internal slice
  was promoted as a standalone replacement row.
