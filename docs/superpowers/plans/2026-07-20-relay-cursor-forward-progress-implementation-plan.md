# Relay Cursor Forward Progress Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent blank or repeated Relay cursors from creating self-links or
repeated stateful fetches across every in-scope frontend surface.

**Architecture:** One framework-free helper owns the advancing-cursor
invariant. Route-data owners call it with page info and the cursor that produced
the current page; React retains navigation, Relay state, effects, markup, and
presentation.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript, Vitest, Bun.

## Global Constraints

- Preserve cursor values exactly; whitespace is only a validity check.
- Preserve first-page paths, URL parameter order, accumulation,
  deduplication, query timing, markup, and accessibility.
- Saved-comparison and snapshot-history cursor contracts remain reference
  behavior, not migration targets.
- Deferred feed-candidate operator surfaces remain out of scope.
- Use behavior tests and verify RED before production changes.

---

### Task 1: Shared Invariant And Community Pagination

**Files:**

- Create: `assets/src/routes/relay-pagination.ts`
- Create: `assets/test/routes/relay-pagination.test.ts`
- Modify: `assets/src/routes/products/product-community-data.ts`
- Modify: `assets/src/routes/products/ProductCommunityPanel.tsx`
- Modify: `assets/test/routes/products/product-community-data.test.ts`
- Modify: `assets/test/routes/products/product-community-panel.test.tsx`

**Interfaces:**

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
cursor is nonblank, and it differs from `currentAfter`.

- [ ] Add failing helper and community cases for blank and repeated review,
  question, initial-answer, and subsequent-answer cursors.
- [ ] Run the three focused test files and confirm current community logic
  accepts at least one non-advancing cursor.
- [ ] Implement the pure helper and route every community page transition
  through it while preserving item accumulation and deduplication.
- [ ] Re-run focused tests, TypeScript, and a recursive dependency scan proving
  the helper imports no React, Relay, router, StyleX, or generated operations.
- [ ] Commit with message `fix: require advancing community cursors`.

### Task 2: Stateful Product And Compare Pagination

**Files:**

- Modify: `assets/src/routes/compare/compare-picker-data.ts`
- Modify: `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
- Modify: `assets/test/routes/compare/compare-picker-data.test.ts`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `assets/src/routes/products/product-offer-panel-data.ts`
- Modify: `assets/src/routes/products/ProductOfferPanel.tsx`
- Modify: `assets/test/routes/products/product-offer-panel-data.test.ts`
- Modify: `assets/test/routes/products/detail.route.test.tsx`

- [ ] Add failing cases where compare-picker and product-offer page info repeats
  the current cursor; assert no callback or control is offered.
- [ ] Run the four focused test files and confirm the current transition logic
  permits a repeated cursor.
- [ ] Pass current cursor state into `nextRelayPageCursor` at both surfaces.
- [ ] Re-run focused tests and `cd assets && bun run typecheck`.
- [ ] Commit with message `fix: stop repeated stateful pagination`.

### Task 3: Public URL Pagination

**Files:**

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

- [ ] Add failing blank/repeated-cursor cases for catalog, offers, category,
  merchant directory, and merchant detail next-page URLs.
- [ ] Run the named pure/route suites and confirm at least one self-link remains.
- [ ] Apply the shared helper while preserving first-page paths, encoded
  filters, page sizes, sort state, and merchant/product context.
- [ ] Re-run all named suites and TypeScript.
- [ ] Commit with message `fix: prevent public pagination self-links`.

### Task 4: Account And Setup URL Pagination

**Files:**

- Modify: `assets/src/routes/account/api-tokens/api-token-route-data.ts`
- Modify: `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- Modify: `assets/test/routes/account/api-tokens/api-token-route-data.test.ts`
- Modify: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Modify: `assets/src/routes/affiliate/setup/pagination.ts`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`

- [ ] Add failing blank/repeated-cursor cases while preserving API-token status
  and affiliate merchant selection/page-size state.
- [ ] Run the three focused suites and confirm current URL construction accepts
  a non-advancing cursor.
- [ ] Route both surfaces through the shared helper and preserve current query
  parameter ordering.
- [ ] Re-run focused tests and TypeScript.
- [ ] Commit with message `fix: require advancing account cursors`.

### Task 5: Batch Gate

**Files:**

- Modify: `docs/work/frontend-cursor-forward-progress.md`

- [ ] Record slice RED/GREEN evidence without changing the live queue.
- [ ] Run every focused suite named above, `cd assets && bun run check`, the
  pure-helper dependency scan, `mix work_queue.validate`, and
  `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.
