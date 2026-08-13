# PR 125 Review Follow-Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve every current actionable PR #125 review thread with behavior-level regression coverage.

**Architecture:** Keep chart shaping in the existing product price-trend projection, carry tooltip identity as chart datum content, enrich current-offer truth once at its query boundary, and reconcile browser-restored filters against current Relay product attributes before rendering. Preserve existing GraphQL and component ownership rather than adding parallel adapter layers.

**Tech Stack:** Elixir, Ecto, Absinthe GraphQL, Relay, React 19, TypeScript, Vitest, Testing Library

## Global Constraints

- Validate each external review finding against the current branch before changing code.
- Write and observe a failing behavior test before each production fix.
- Use generated Relay types and regenerate artifacts after changing the GraphQL query.
- Do not reply to or resolve GitHub threads without explicit authorization.

---

### Task 1: Preserve chart gaps and tooltip identity

**Files:**

- Modify: `assets/src/routes/products/offers/product-price-trend.ts`
- Modify: `assets/src/ui/components/data/PriceHistoryChart.tsx`
- Test: `assets/test/routes/products/offers/ProductPriceTrend.test.tsx`

**Interfaces:**

- Consumes: `ProductPriceTrendCurrency` points and merchant metadata.
- Produces: `productPriceChartSeries(...)` output split at missing UTC days, with a tooltip label on every plotted datum.

- [ ] **Step 1: Write failing tests for aggregate gaps and merchant tooltip labels**

Add price-trend projection assertions showing that lowest and average modes create separate chart series across a missing UTC date, lowest-price rows name the winning merchant, and merchant rows name their series merchant.

- [ ] **Step 2: Run the focused test and verify the expected failures**

Run: `pnpm --dir assets test -- ProductPriceTrend.test.tsx`

Expected: FAIL because aggregate rows remain in one series and chart datum tooltip labels are absent.

- [ ] **Step 3: Implement the smallest chart projection and tooltip changes**

Split aggregate rows on nonconsecutive UTC days, populate tooltip labels from merchant metadata, and add the label to the TanStack chart tooltip definition.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm --dir assets test -- ProductPriceTrend.test.tsx`

Expected: PASS.

### Task 2: Show current-offer merchant and cross-currency freshness

**Files:**

- Modify: `lib/product_compare/pricing/current_offers.ex`
- Modify: `lib/product_compare_web/schema/pricing/types.ex`
- Modify: `test/product_compare_web/graphql/pricing_queries_test.exs`
- Modify: `assets/src/routes/products/ProductDetailRoute.tsx`
- Modify: `assets/src/routes/products/ProductDecisionHeader.tsx`
- Modify: `assets/test/routes/products/detail.route.test.tsx`
- Regenerate: `assets/schema.graphql`
- Regenerate: `assets/src/__generated__/ProductDetailRouteQuery.graphql.ts`

**Interfaces:**

- Consumes: current-offer merchant associations and all `currencySummaries[].bestOffer` values.
- Produces: `CurrentOffer.merchantName`, merchant-attributed best-price copy, and the freshest observed offer across currencies.

- [ ] **Step 1: Write failing GraphQL and route-rendering tests**

Assert that the best offer exposes its merchant name, the decision price renders that merchant, and multi-currency freshness selects the latest valid `observedAt` instead of showing unavailable.

- [ ] **Step 2: Run the focused tests and verify the expected failures**

Run: `mix test test/product_compare_web/graphql/pricing_queries_test.exs`

Run: `pnpm --dir assets test -- detail.route.test.tsx`

Expected: FAIL because `merchantName` is absent and multi-currency `currentOffer` returns `null`.

- [ ] **Step 3: Implement the current-offer projection and decision-header behavior**

Load merchant data in the existing current-offer query, add the merchant name to summarized offers and GraphQL, request the generated field in the product detail query, render it in the price label, and choose the freshest valid best offer across currencies.

- [ ] **Step 4: Regenerate schema and Relay artifacts**

Run: `mix absinthe.schema.json --schema ProductCompareWeb.Schema --json-codec Jason assets/schema.json`

Run: `pnpm --dir assets relay`

- [ ] **Step 5: Run focused backend and frontend tests and verify they pass**

Run: `mix test test/product_compare_web/graphql/pricing_queries_test.exs`

Run: `pnpm --dir assets test -- detail.route.test.tsx`

Expected: PASS.

### Task 3: Reconcile restored spec filters

**Files:**

- Modify: `assets/src/routes/products/specifications/spec-filter-selection.ts`
- Modify: `assets/src/routes/products/specifications/ProductSpecifications.tsx`
- Test: `assets/test/routes/products/specifications/spec-filter-selection.test.ts`
- Test: `assets/test/routes/products/specifications/ProductSpecifications.test.tsx`

**Interfaces:**

- Consumes: structurally valid stored selections and current filterable product selections.
- Produces: `reconcileSpecFilterSelections(...)`, retaining only selections whose current attribute kind and value still match while refreshing display metadata.

- [ ] **Step 1: Write failing reconciliation tests**

Assert that removed attributes and changed enum options are discarded, surviving numeric modes remain intact, and the component does not expose stale restored filters.

- [ ] **Step 2: Run the focused tests and verify the expected failures**

Run: `pnpm --dir assets test -- spec-filter-selection.test.ts ProductSpecifications.test.tsx`

Expected: FAIL because restored selections are installed unchanged.

- [ ] **Step 3: Implement and apply reconciliation**

Match drafts against selections derived from current attributes, preserve only a valid numeric matching mode, refresh current metadata, and persist the reconciled draft.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `pnpm --dir assets test -- spec-filter-selection.test.ts ProductSpecifications.test.tsx`

Expected: PASS.

### Task 4: Verify and publish the review fixes

**Files:**

- Verify all files changed by Tasks 1-3.

**Interfaces:**

- Consumes: the completed review fixes.
- Produces: a clean commit pushed to the existing PR branch and a refreshed thread-aware review snapshot.

- [ ] **Step 1: Run repository verification**

Run: `mix ci`

Expected: all backend, frontend, generated-artifact, lint, formatting, build, and queue checks pass.

- [ ] **Step 2: Inspect the final diff**

Run: `git diff --check`

Run: `git status --short`

Expected: no whitespace errors and only intended review-fix files changed.

- [ ] **Step 3: Commit and push**

Run:

```bash
git add assets/schema.graphql \
  assets/src/__generated__/ProductDetailRouteQuery.graphql.ts \
  assets/src/relay/mutations.ts \
  assets/src/routes/products/ProductDecisionHeader.tsx \
  assets/src/routes/products/ProductDetailRoute.tsx \
  assets/src/routes/products/offers/ProductPriceTrend.tsx \
  assets/src/routes/products/offers/product-price-trend.ts \
  assets/src/routes/products/specifications/ProductSpecifications.tsx \
  assets/src/routes/products/specifications/spec-filter-selection.ts \
  assets/src/ui/components/data/PriceHistoryChart.tsx \
  assets/src/ui/components/data/RelativeDateTime.tsx \
  assets/test/routes/products/detail.route.test.tsx \
  assets/test/routes/products/offers/ProductPriceTrend.test.tsx \
  assets/test/routes/products/specifications/ProductSpecifications.test.tsx \
  assets/test/routes/products/specifications/spec-filter-selection.test.ts \
  assets/test/ui/components/data/RelativeDateTime.test.tsx \
  docs/superpowers/plans/2026-08-12-comparison-auth-continuity-implementation-plan.md \
  docs/superpowers/plans/2026-08-12-frontend-seo-foundations-implementation-plan.md \
  docs/superpowers/plans/2026-08-12-pr-125-review-follow-up-implementation-plan.md \
  lib/product_compare/pricing/current_offers.ex \
  lib/product_compare_web/schema/pricing/types.ex \
  test/product_compare_web/graphql/pricing_queries_test.exs
```

Run: `git commit -m "fix remaining product review findings"`

Run: `git push`

- [ ] **Step 4: Refresh review threads**

Run the bundled thread-aware GitHub review fetcher and verify whether any new current actionable thread appeared after the push.
