# Next Frontend Batches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` or `superpowers:executing-plans` to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Complete user-selected batches 1, 2, 3, 5, 6, 7, 8, and 9 while
preserving the live queue floor.

**Architecture:** Keep new filters local to already-present Relay records, use
React Router data responses plus React 19 metadata resources for route
foundations, and extract presentation-only boundaries from oversized route
owners without changing data or mutation contracts.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript, StyleX, Vitest,
Bun SSR.

## Global Constraints

- Browser data remains GraphQL/Relay based.
- Do not add eager cursor traversal or server search for local filters.
- Preserve SSR and hydration behavior.
- Use direct imports instead of new barrel files.
- Keep deferred ingestion, eBay, privacy, attribution-control, and
  production-readiness scope closed.

---

### Task 1: Compare loaded-price scope copy

**Files:**
- Modify: `assets/src/routes/compare/DecisionSummary.tsx`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `docs/work/frontend-product-comparison-demo-parity.md`

**Interface:** `DecisionSummary` renders one concise disclosure stating that
relative loaded price compares only offers already loaded for selected products.

- [ ] Add a focused assertion for the disclosure and verify RED.
- [ ] Render the disclosure without changing price arithmetic.
- [ ] Run the focused compare test and TypeScript.

### Task 2: Compare picker loaded-name filter

**Files:**
- Modify: `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `docs/work/frontend-product-comparison-demo-parity.md`

**Interface:** local `filterText` derives visible options from loaded,
unselected products; `Show more products` remains independent.

- [ ] Add cases for case-insensitive filtering, clearing, no match, and retained pagination; verify RED.
- [ ] Add an explicitly loaded-product-scoped text field and derived results.
- [ ] Run the full compare route suite and TypeScript.

### Task 3: Merchant visible-page name filter

**Files:**
- Modify: `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
- Test: `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- Modify: `docs/work/frontend-merchant-discovery-demo-parity.md`

**Interface:** local `filterText` narrows `connection.edges` only; page-size and
cursor links remain unchanged.

- [ ] Add cases for case-insensitive filtering, clearing, no match, and retained pagination; verify RED.
- [ ] Add the visible-page-scoped text field and result count.
- [ ] Run the merchant route suite and TypeScript.

### Task 4: Application wildcard 404

**Files:**
- Create: `assets/src/routes/NotFoundRoute.tsx`
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/entry.server.tsx`
- Test: `assets/test/router.test.tsx`
- Test: `assets/test/entry.server.test.tsx`
- Test: `assets/test/entry.server.error-handling.test.tsx`
- Modify: `docs/work/frontend-route-foundations.md`

**Interfaces:** `notFoundLoader(): never` throws a 404 `Response`; SSR returns
rendered non-200 route contexts as `Response` objects with preserved status.

- [ ] Add wildcard registration and SSR status tests; verify RED.
- [ ] Add the wildcard route and preserve static-handler status/headers.
- [ ] Run router, SSR, and TypeScript verification.

### Task 5: Route document metadata

**Files:**
- Create: `assets/src/routes/RouteMetadata.tsx`
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/RootRoute.tsx`
- Test: `assets/test/router.test.tsx`
- Test: `assets/test/routes/root.route.test.tsx`
- Test: `assets/test/entry.server.test.tsx`
- Modify: `docs/work/frontend-route-foundations.md`

**Interfaces:** `RouteMetadataHandle` contains `title` and `description`;
`RouteMetadata` resolves the deepest matched handle and renders React 19
`<title>` and description `<meta>` resources.

- [ ] Add client-navigation and SSR metadata expectations; verify RED.
- [ ] Declare handles for every registered route and render the shared metadata component.
- [ ] Run root, router, SSR, TypeScript, and build verification.

### Task 6: API-token route decomposition

**Files:**
- Create: `assets/src/routes/account/api-tokens/ApiTokenList.tsx`
- Modify: `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- Test: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Modify: `docs/work/frontend-api-token-management-demo-parity.md`

**Interface:** `ApiTokenList` owns list rendering and per-token revoke/rotate
presentation while the route keeps Relay pagination, mutation commits, and
one-time secret state.

- [ ] Run the route characterization suite before extraction.
- [ ] Extract the list boundary with explicit typed props and direct imports.
- [ ] Rerun the route suite and TypeScript with identical behavior.

### Task 7: Offer-discovery route decomposition

**Files:**
- Create: `assets/src/routes/offers/OfferDiscoveryList.tsx`
- Modify: `assets/src/routes/offers/OfferDiscoveryRoute.tsx`
- Test: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Modify: `docs/work/frontend-offer-discovery-demo-parity.md`

**Interface:** `OfferDiscoveryList` owns visible offer cards, summaries, and
pagination; the route keeps query ownership, filter state, and tracked-click
mutation orchestration.

- [ ] Run the route characterization suite before extraction.
- [ ] Extract the results boundary without changing query or URL contracts.
- [ ] Rerun the route suite and TypeScript with identical behavior.

### Task 8: Product-detail route decomposition

**Files:**
- Create: `assets/src/routes/products/ProductOfferPanel.tsx`
- Modify: `assets/src/routes/products/ProductDetailRoute.tsx`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `docs/work/frontend-product-detail.md`

**Interface:** `ProductOfferPanel` owns active offer, coupon, and price-history
presentation; the route keeps loader state, tab selection, product identity,
and tracked-click orchestration.

- [ ] Run the detail characterization suite before extraction.
- [ ] Extract the offer panel through explicit typed props.
- [ ] Rerun the detail suite and TypeScript with identical behavior.

### Task 9: Queue reconciliation and final gates

**Files:**
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: affected lane work docs

- [ ] Leave skip navigation, affiliate-setup form decomposition, and feed-candidate review decomposition as three complete ready rows.
- [ ] Run `bun run relay`, `bun run check`, `bun run build`, `mix work_queue.validate`, and `git diff --check`.
- [ ] Commit each milestone with its code, tests, and lane evidence.
