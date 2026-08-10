# Production UI Discover And Evaluate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the stable production UI to browsing, category, product, offer, and merchant routes without losing any discovery or evaluation behavior.

**Architecture:** Keep each route's existing Relay loader, URL authority, view-data helpers, mutations, and localized failure boundaries. Compose the shared system-spine layouts, product identity, freshness, comparison, and control primitives inside route-owned components; do not add route-kind flags or a parallel component framework. Treat the six routes as one shopper-evaluation outcome because they share product, offer, merchant, freshness, and comparison invariants.

**Tech Stack:** React 19, React Router 7, Relay 20, StyleX, Radix, Vitest, Playwright, axe-core.

## Global Constraints

- Requires the completed System Spine And Home plan and must not modify its shared owners.
- Preserve every route, loader, query, filter, sort, cursor, tracked redirect, comparison action, price watch, review/Q&A operation, canonical redirect, metadata result, authorization rule, and localized failure state named in the approved design.
- Preserve the URL as authority for catalog filters, offer filters, pagination, detail tabs, and comparison slugs.
- Use product and buying language; never render evidence, taxon, merchant product, source artifact, current attributes, qualification, recommendation profile, or persisted snapshot.
- Use width for product identity, meaningful specifications, current offer, price signal, freshness, and actions; remove or disclose secondary columns before stacking.
- Keep one semantic tree at every viewport; ordinary ledgers cannot cause page-level horizontal overflow.
- Preserve safe same-origin tracked redirects and leave unsafe merchant domains as non-links.
- Do not change backend or GraphQL contracts in this cohort.

---

## Owned Paths

- `assets/src/routes/catalog/BrowseRoute.tsx`
- `assets/src/routes/catalog/BrowseProductList.tsx`
- `assets/src/routes/catalog/CatalogFilterForm.tsx`
- `assets/src/routes/catalog/CatalogAdvancedFilters.tsx`
- `assets/src/routes/categories/CategoryRoute.tsx`
- `assets/src/routes/products/ProductDetailRoute.tsx`
- `assets/src/routes/products/ProductAttributeList.tsx`
- `assets/src/routes/products/ProductDecisionActions.tsx`
- `assets/src/routes/products/ProductOfferList.tsx`
- `assets/src/routes/products/ProductOfferPanel.tsx`
- `assets/src/routes/products/ProductCommunityPanel.tsx`
- `assets/src/routes/products/ProductCommunityItems.tsx`
- `assets/src/routes/products/product-community-styles.ts`
- `assets/src/routes/products/PriceWatchControl.tsx`
- `assets/src/routes/offers/OfferDiscoveryRoute.tsx`
- `assets/src/routes/offers/OfferDiscoveryFilterForm.tsx`
- `assets/src/routes/offers/OfferDiscoveryList.tsx`
- `assets/src/routes/offers/OfferDiscoveryCard.tsx`
- `assets/src/routes/offers/VisibleMerchantFilters.tsx`
- `assets/src/routes/offers/TrackedCommerceClickAction.tsx`
- `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
- `assets/src/routes/merchants/MerchantDirectoryView.tsx`
- `assets/src/routes/merchants/detail/MerchantDetailRoute.tsx`
- `assets/test/routes/catalog/**`
- `assets/test/routes/categories/**`
- `assets/test/routes/products/**`
- `assets/test/routes/offers/**`
- `assets/test/routes/merchants/**`
- `assets/tests/e2e/production-ui-discovery.spec.ts`
- `assets/tests/e2e/production-ui-discovery.spec.ts-snapshots/**`
- `docs/work/production-ui-discover-evaluate.md`

## Feature-Parity Ledger

| Surface | Behavior that must remain executable | Existing verification boundary |
| --- | --- | --- |
| `/products` | search; five sorts; category/descendant, use-case, numeric, boolean, and option filters; counts/disabled choices; reset; page size/cursors; highlights; compare tray; all data states | `assets/test/routes/catalog/**` |
| `/categories/:slug` | curated copy/count/metadata; 404; trusted order; highlights; detail/catalog paths; cursor guard | `assets/test/routes/categories/**` |
| `/products/:slug` | canonical aliases; metadata; overview/spec groups; offer/coupon/history pages; tracked clicks; compare; watches; lazy reviews/Q&A create/edit/remove/owner/moderation/pagination; partial failures | `assets/test/routes/products/**` |
| `/offers` | product scope; active/all; merchant filters; four sorts; page size/reset; price/coupon/history/freshness; mixed-currency truth; safe tracked/direct links; cursor and all failure states | `assets/test/routes/offers/**` |
| `/merchants` | page size/cursors; current-page filter; safe websites; empty/loading/error shell | `assets/test/routes/merchants/merchant-directory.route.test.tsx` |
| `/merchants/:slug` | metadata/404; all summary counts; latest product price/shipping/stock/observation; links and pagination | `assets/test/routes/merchants/merchant-detail*` |

### Task 1: Lock Plain-Language And Responsive Characterization

**Files:**

- Modify the focused tests under all five owned test directories.
- Modify: `docs/work/production-ui-discover-evaluate.md`

**Interfaces:**

- Consumes: approved feature matrix and stable shared components.
- Produces: tests that fail on internal copy, duplicated responsive DOM, lost primary actions, horizontal page overflow, or removed behavior.

- [ ] **Step 1: Add RED copy and semantic assertions**

  Add route-level assertions equivalent to:

  ```tsx
  expect(screen.queryByText(/\b(evidence|taxon|merchant product|current attributes)\b/i)).not.toBeInTheDocument();
  expect(screen.getByRole("main")).toHaveAccessibleName(/catalog|product|offers|merchant/i);
  expect(screen.getAllByRole("article")).toHaveLength(expectedRows);
  ```

  Pin every ledger capability above before changing markup. Assert mobile disclosures preserve identity, current offer, compare/detail action, and the same semantic row rather than a duplicated mobile tree.

- [ ] **Step 2: Run RED**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/catalog test/routes/categories test/routes/products test/routes/offers test/routes/merchants
  ```

  Expected: new hierarchy/plain-language/responsive assertions fail while existing parity assertions continue to pass.

- [ ] **Step 3: Record the baseline**

  Put exact failing assertions and current passing feature counts in the lane ledger. Do not weaken a legacy assertion to accommodate the redesign.

- [ ] **Step 4: Commit characterization**

  ```bash
  git add assets/test/routes docs/work/production-ui-discover-evaluate.md
  git commit -m "test: lock discovery UI parity"
  ```

### Task 2: Redesign Catalog And Category Discovery

**Files:**

- Modify the four catalog and one category source files listed under Owned Paths.
- Modify their focused tests.

**Interfaces:**

- Consumes: shared `WorkspaceLayout`, `ContextRail`, `ActiveFilterChips`, `ProductLedger`, and comparison continuity APIs.
- Produces: filter workspace and product rows with stable identity/offer-independent highlights and responsive disclosure.

- [ ] **Step 1: Add RED interaction tests**

  Assert filter labels use Category/Use case/Specifications, active choices remain removable, counts and disabled choices remain visible, Apply/reset preserve canonical URLs, comparison numbering survives pagination, and category rows expose one primary detail action.

- [ ] **Step 2: Implement catalog/category composition**

  Use a narrow control rail beside the ledger on desktop, stack it after primary orientation on small widths, use dividers rather than per-filter cards, and keep filter form semantics unchanged. Render rows through the shared ledger only where its exact contract fits; keep category-specific copy route-owned.

- [ ] **Step 3: Run GREEN**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/catalog test/routes/categories
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/src/routes/catalog assets/src/routes/categories assets/test/routes/catalog assets/test/routes/categories docs/work/production-ui-discover-evaluate.md
  git commit -m "feat: redesign catalog discovery"
  ```

### Task 3: Redesign Product Detail And Community Evaluation

**Files:**

- Modify all owned product source files and product tests.

**Interfaces:**

- Consumes: stable numbered comparison, feedback, tabs, disclosure, button, and data-label primitives.
- Produces: a product-first decision workspace with unchanged offer, watch, and community operations.

- [ ] **Step 1: Add RED hierarchy and lifecycle tests**

  Assert brand/product/spec identity comes first; compare/watch/offer actions stay together; offer rows retain price, merchant, coupon, history, observation, pagination, and click behavior; and Reviews & Q&A still loads lazily with independent create disclosures, owner edit, confirmed removal, accepted-answer label, pagination, moderation state, and row failures.

- [ ] **Step 2: Implement the detail workspace**

  Compose overview, decision actions, grouped specifications, offers, and community as deliberate sections with only interactive objects boxed. Keep nested offer/community failures local. Replace internal public copy contextually rather than by string substitution.

- [ ] **Step 3: Run GREEN**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/products
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/src/routes/products assets/test/routes/products docs/work/production-ui-discover-evaluate.md
  git commit -m "feat: redesign product evaluation"
  ```

### Task 4: Redesign Offer And Merchant Workspaces

**Files:**

- Modify all owned offer and merchant source files and tests.

**Interfaces:**

- Consumes: stable workspace, freshness, filter, pagination, feedback, and tracked-action presentation.
- Produces: compact price/merchant ledgers whose actions and truth labels remain row-scoped.

- [ ] **Step 1: Add RED route-state tests**

  Pin missing-product, non-product, empty, loading, unavailable, mixed-currency, inactive offer, unsafe domain, no-match merchant, detail 404, and repeated-cursor states. Assert every timestamp says Last checked or Observed, never Evidence.

- [ ] **Step 2: Implement offer and merchant composition**

  Prioritize product/merchant identity, price, availability, freshness, and action. Keep safe-link policy and mutation logic untouched. Use mono labels for prices/timestamps and the shared freshness rail only when the row has an actual observation.

- [ ] **Step 3: Run GREEN**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/offers test/routes/merchants
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/src/routes/offers assets/src/routes/merchants assets/test/routes/offers assets/test/routes/merchants docs/work/production-ui-discover-evaluate.md
  git commit -m "feat: redesign offer and merchant evaluation"
  ```

### Task 5: Verify And Close Discover And Evaluate

**Files:**

- Create the owned Playwright spec and snapshots.
- Modify the lane doc.

- [ ] **Step 1: Add deterministic browser coverage**

  Cover catalog search/filter/compare, category entry, product offer/watch/community disclosure, tracked offer error, merchant filter/detail, keyboard paths, axe scans, reduced motion, and no-overflow at 1440×1000, 900×1100, and 390×844.

- [ ] **Step 2: Generate, inspect, and rerun snapshots**

  ```bash
  cd assets && pnpm exec playwright test tests/e2e/production-ui-discovery.spec.ts --update-snapshots
  cd assets && pnpm exec playwright test tests/e2e/production-ui-discovery.spec.ts
  ```

- [ ] **Step 3: Run complete gates**

  ```bash
  cd assets && pnpm run check
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 4: Complete every ledger row and commit**

  ```bash
  git add assets/tests/e2e docs/work/production-ui-discover-evaluate.md
  git commit -m "test: verify discovery production UI"
  ```

## Blocker And Fallback Rules

- Stop if a parity test requires a backend/GraphQL change; record the contract gap instead of widening this frontend-owned cohort.
- Stop if a shared system-spine file must change; record the exact missing shared capability for coordinator ownership.
- Do not collapse Reviews & Q&A, price watches, inactive offers, unsafe-link handling, or partial failures to make the visual work smaller.
- Do not duplicate desktop/mobile markup or turn each product/offer/filter into a generic card.
