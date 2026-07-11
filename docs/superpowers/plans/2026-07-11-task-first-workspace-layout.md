# Task-First Workspace Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to implement this plan task by task. Do not use
> subagents unless the user explicitly requests delegation.

**Goal:** Reshape every registered frontend screen around a task-first
information hierarchy while preserving the existing Radix theme, application
behavior, and data contracts.

**Architecture:** Add a small composition layer for responsive workspaces,
context rails, summaries, disclosures, semantic records, and action dialogs.
Apply one of three approved archetypes—workspace, detail, or guided flow—to
each route family. Use Radix primitives for interactive behavior and StyleX for
layout.

**Tech Stack:** React 19, TypeScript, React Router 7, Relay 20, Radix Themes,
Radix primitives, StyleX, Vitest, Testing Library, Bun, Vite SSR.

## Global Constraints

- Cover every route registered in `assets/src/router.tsx`.
- Keep all React component source filenames in PascalCase.
- Use Radix Themes or Radix primitives wherever an appropriate control exists.
- Keep StyleX for layout and consume the existing semantic token layer.
- Prefer one primary workspace and supporting context over flat block stacks.
- Preserve Relay, loaders, mutations, pagination, URLs, query strings,
  authorization, Phoenix session behavior, and GraphQL contracts.
- Keep behavior tests semantic and user-facing; do not assert source strings.
- Preserve loading, empty, error, pending, and success behavior.
- Run `cd assets && bun run build` as the production gate.
- Keep at least three unrelated `ready` rows in `docs/work/index.md` at stable
  dispatch boundaries.

---

## Task 1: Dispatch The Follow-Up Layout Pass

**Files:**

- Modify: `docs/work/index.md`
- Modify: `docs/work/frontend-radix-ui-polish.md`
- Modify: `docs/plans/INDEX.md`

- [ ] **Step 1: Add the follow-up plan to the plan catalog**

  Add `docs/superpowers/plans/2026-07-11-task-first-workspace-layout.md` to the
  active implementation plan catalog.

- [ ] **Step 2: Reopen the frontend lane for the approved follow-up**

  Change the lane snapshot to active and add a follow-up batch whose owned
  paths cover `assets/src/ui/**`, `assets/src/routes/**`, matching route tests,
  and the lane document. Link the approved design and this plan.

- [ ] **Step 3: Add an active queue row without consuming ready work**

  Add the task-first workspace layout pass under `Active Work`. Preserve every
  unrelated `ready` row and verify at least three remain.

- [ ] **Step 4: Validate the dispatch boundary**

  Run: `mix work_queue.validate`

  Expected: exit 0 with the layout pass active and at least three unrelated
  ready rows.

- [ ] **Step 5: Commit the dispatch milestone**

  ```bash
  git add docs/work/index.md docs/work/frontend-radix-ui-polish.md docs/plans/INDEX.md
  git commit -m "docs: dispatch task-first layout pass"
  ```

---

## Task 2: Build The Shared Workspace Composition Layer

**Files:**

- Modify: `assets/src/ui/theme/theme.css`
- Modify: `assets/src/ui/theme/tokens.stylex.ts`
- Modify: `assets/src/ui/components/layout/PageShell.tsx`
- Create: `assets/src/ui/components/layout/WorkspaceLayout.tsx`
- Create: `assets/src/ui/components/layout/ContextRail.tsx`
- Create: `assets/src/ui/components/layout/MobileContextPanel.tsx`
- Create: `assets/src/ui/components/layout/DetailTabs.tsx`
- Create: `assets/src/ui/components/data/SummaryStrip.tsx`
- Create: `assets/src/ui/components/data/RecordTable.tsx`
- Create: `assets/src/ui/components/filters/FilterBar.tsx`
- Create: `assets/src/ui/components/filters/ActiveFilterChips.tsx`
- Create: `assets/src/ui/components/feedback/DisclosureGroup.tsx`
- Create: `assets/src/ui/components/overlays/ActionDialog.tsx`
- Modify: `assets/test/ui/page-patterns.test.tsx`
- Create: `assets/test/ui/workspace-layout.test.tsx`

- [ ] **Step 1: Write failing semantic layout tests**

  Cover a labeled main workspace, optional complementary context region,
  meaningful collapse order, compact summary definition list, semantic record
  table, keyboard-operable tabs and disclosure, active-filter removal, and
  dialog focus restoration. Assert roles and accessible names rather than CSS
  class names.

- [ ] **Step 2: Run the shared UI tests to verify RED**

  Run:

  ```bash
  cd assets
  bun x vitest run test/ui/page-patterns.test.tsx test/ui/workspace-layout.test.tsx
  ```

  Expected: fail because the new composition modules do not exist.

- [ ] **Step 3: Extend semantic layout tokens**

  Add workspace gap, context rail width, sticky offset, compact section gap,
  route heading scale, and table cell spacing to `theme.css`, then expose them
  through `tokens.stylex.ts`. Keep all values semantic and brand-neutral.

- [ ] **Step 4: Implement the non-interactive layout compositions**

  Build `WorkspaceLayout`, `ContextRail`, `SummaryStrip`, `FilterBar`, and
  `RecordTable` with semantic regions and responsive StyleX layouts. Make the
  rail sticky only when width allows it. Reduce `PageShell` heading dominance
  while preserving its public API.

- [ ] **Step 5: Implement Radix-backed interactive compositions**

  Build `MobileContextPanel` on Radix Collapsible or Dialog as appropriate,
  `DetailTabs` on Radix Tabs, `DisclosureGroup` on Radix Accordion, and
  `ActionDialog` on Radix Dialog. Keep wrappers thin and expose `asChild` or
  composition slots only when route consumers need them.

- [ ] **Step 6: Make the focused tests green**

  Run:

  ```bash
  cd assets
  bun x vitest run test/ui
  bun run typecheck
  bun run build
  ```

- [ ] **Step 7: Commit the shared layout milestone**

  ```bash
  git add assets/src/ui assets/test/ui docs/work/frontend-radix-ui-polish.md
  git commit -m "feat: add task-first workspace layouts"
  ```

---

## Task 3: Reshape Home, Catalog, Merchants, And Offers

**Files:**

- Modify: `assets/src/routes/RootRoute.tsx`
- Modify: `assets/src/routes/catalog/BrowseRoute.tsx`
- Modify: `assets/src/routes/catalog/CatalogFilterForm.tsx`
- Modify: `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
- Modify: `assets/src/routes/offers/OfferDiscoveryRoute.tsx`
- Modify: `assets/src/routes/offers/OfferDiscoveryFilterForm.tsx`
- Modify: `assets/src/routes/offers/TrackedCommerceClickAction.tsx`
- Modify: `assets/test/routes/root.route.test.tsx`
- Modify: `assets/test/routes/catalog/browse.route.test.tsx`
- Modify: `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- Modify: `assets/test/routes/offers/offer-discovery.route.test.tsx`

- [ ] **Step 1: Write failing hierarchy tests**

  Assert that home exposes the three shopper goals before secondary actions;
  catalog, merchants, and offers expose labeled main workspaces and contextual
  controls; advanced filters are disclosed through Radix behavior; active
  filter state remains visible; and summary metrics describe the associated
  results.

- [ ] **Step 2: Verify RED with focused route suites**

  ```bash
  cd assets
  bun x vitest run test/routes/root.route.test.tsx \
    test/routes/catalog/browse.route.test.tsx \
    test/routes/merchants/merchant-directory.route.test.tsx \
    test/routes/offers/offer-discovery.route.test.tsx
  ```

- [ ] **Step 3: Reshape home and catalog**

  Make shopper goals the primary home content. Move catalog results into the
  main workspace and essential filters into the context rail. Keep advanced
  filters progressively disclosed and active filters removable and visible.
  Keep compare selection and pagination adjacent to the results they affect.

- [ ] **Step 4: Reshape merchants and offers**

  Move merchant and offer records into their primary workspaces. Align identity,
  status, price, coupon, freshness, and actions into stable row regions. Use a
  `SummaryStrip` for offer metrics and context-rail controls for scope and sort.

- [ ] **Step 5: Verify the route family**

  Run the four focused suites, `bun run typecheck`, `bun run build`, and
  `git diff --check`.

- [ ] **Step 6: Commit the shopper workspace milestone**

  ```bash
  git add assets/src/routes/RootRoute.tsx assets/src/routes/catalog \
    assets/src/routes/merchants assets/src/routes/offers assets/test/routes
  git commit -m "feat: reshape shopper discovery workspaces"
  ```

---

## Task 4: Reshape Product Detail And Comparison

**Files:**

- Modify: `assets/src/routes/products/ProductDetailRoute.tsx`
- Modify: `assets/src/routes/products/ProductAttributeList.tsx`
- Modify: `assets/src/routes/compare/CompareShell.tsx`
- Modify: `assets/src/routes/compare/CompareRoute.tsx`
- Modify: `assets/src/routes/compare/CompareProductList.tsx`
- Modify: `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
- Modify: `assets/src/routes/compare/CompareSelectionTray.tsx`
- Modify: `assets/src/routes/compare/DecisionSummary.tsx`
- Modify: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `assets/test/routes/compare/compare-relay-migration.test.tsx`
- Modify: `assets/test/routes/compare/compare-save-feedback.test.tsx`

- [ ] **Step 1: Write failing decision-first detail tests**

  Assert that product identity, decision signals, and primary actions precede
  tabs; overview, specifications, and offers have accessible tab semantics;
  specification groups have meaningful disclosure names; comparison product
  headers remain associated with data columns; and the decision summary is
  reachable before exhaustive comparison rows.

- [ ] **Step 2: Verify RED with focused detail suites**

  Run the product-detail and comparison route suites.

- [ ] **Step 3: Implement product detail hierarchy**

  Add a concise overview and action region, then use `DetailTabs` for overview,
  specifications, and offers. Group dense specifications with
  `DisclosureGroup`. Preserve offer pagination and compare-selection URLs.

- [ ] **Step 4: Implement comparison hierarchy**

  Preserve product columns and the labeled horizontal matrix. Make product
  anchors and the decision summary sticky only where doing so does not obscure
  focus or content. Keep existing URL-aware specification modes on Radix Tabs.

- [ ] **Step 5: Verify the route family**

  Run all product and comparison suites, `bun run typecheck`, `bun run build`,
  and `git diff --check`.

- [ ] **Step 6: Commit the decision workspace milestone**

  ```bash
  git add assets/src/routes/products assets/src/routes/compare \
    assets/test/routes/products assets/test/routes/compare
  git commit -m "feat: prioritize product decisions and comparison"
  ```

---

## Task 5: Reshape Records And Operational Workflows

**Files:**

- Modify: `assets/src/routes/compare/SavedComparisonsRoute.tsx`
- Modify: `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- Modify: `assets/src/routes/ingestion/feed-candidates/FeedCandidatesRoute.tsx`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Modify: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Modify: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Modify: `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`

- [ ] **Step 1: Write failing records-first tests**

  Assert that saved sets and tokens are primary records, creation opens an
  accessible Radix Dialog, dialog close restores focus, one-time tokens remain
  prominent, revenue summaries describe their records, feed review actions
  precede diagnostics, and affiliate setup exposes a meaningful ordered flow.

- [ ] **Step 2: Verify RED with focused operational suites**

  Run the five route suites listed above.

- [ ] **Step 3: Move creation into action dialogs**

  Move saved-comparison naming and token creation into `ActionDialog` without
  changing mutation payloads, pending states, errors, or one-time disclosure.

- [ ] **Step 4: Implement records-first operational layouts**

  Use `WorkspaceLayout`, `SummaryStrip`, and `RecordTable` where the data is
  relational. Put feed review status and next actions before source diagnostics.
  Put revenue scope and summary before breakdown records.

- [ ] **Step 5: Implement the affiliate guided flow**

  Order current status, required next action, network, program, link, and coupon
  management into understandable stages. Use Radix Tabs only for peer views and
  Dialog for focused mutations; do not hide prerequisites in disclosure.

- [ ] **Step 6: Verify and commit the operational milestone**

  Run the focused suites, `bun run typecheck`, `bun run build`, and
  `git diff --check`, then commit:

  ```bash
  git add assets/src/routes/account assets/src/routes/affiliate \
    assets/src/routes/commerce assets/src/routes/ingestion \
    assets/src/routes/compare/SavedComparisonsRoute.tsx assets/test/routes
  git commit -m "feat: clarify records and operational workflows"
  ```

---

## Task 6: Tighten Authentication And Responsive Behavior

**Files:**

- Modify: `assets/src/routes/auth/AuthFormShell.tsx`
- Modify: `assets/src/routes/auth/LoginRoute.tsx`
- Modify: `assets/src/routes/auth/LogoutRoute.tsx`
- Modify: `assets/src/routes/auth/RegisterRoute.tsx`
- Modify: `assets/src/routes/auth/ForgotPasswordRoute.tsx`
- Modify: `assets/src/routes/auth/ResetPasswordRoute.tsx`
- Modify: `assets/src/routes/auth/VerifyEmailRoute.tsx`
- Modify: `assets/test/routes/auth/form-shell.test.tsx`
- Modify: `assets/test/routes/auth/recovery.route.test.tsx`
- Modify: `assets/test/routes/auth/session.route.test.tsx`
- Modify: relevant UI and route tests for narrow layouts

- [ ] **Step 1: Write failing guided-flow and responsive tests**

  Assert that the current auth action is the primary landmark, recovery and
  alternate links remain subordinate but reachable, context controls have a
  named narrow-screen trigger, and collapsed layouts preserve logical DOM
  order and accessible state.

- [ ] **Step 2: Implement focused auth hierarchy**

  Reduce heading scale and surrounding chrome, keep form feedback adjacent to
  the action, and preserve every GraphQL mutation and session contract.

- [ ] **Step 3: Reconcile narrow layouts across all archetypes**

  Verify workspace rails, dialogs, accordions, tables, and comparison scroll
  regions at narrow widths through semantic component tests and CSS review.
  Respect reduced motion and sticky focus visibility.

- [ ] **Step 4: Verify and commit the final route milestone**

  Run auth and shared UI suites, `bun run typecheck`, `bun run build`, and
  `git diff --check`, then commit:

  ```bash
  git add assets/src/routes/auth assets/src/ui assets/test
  git commit -m "feat: refine guided and responsive layouts"
  ```

---

## Task 7: Complete Verification, Documentation, And PR Follow-Through

**Files:**

- Modify: `docs/work/frontend-radix-ui-polish.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`

- [ ] **Step 1: Run the complete frontend verification**

  ```bash
  cd assets
  bun run relay
  git diff --exit-code -- src/__generated__
  bun x vitest run
  bun run typecheck
  bun run build
  ```

- [ ] **Step 2: Run repository completion checks**

  ```bash
  git diff --check
  mix work_queue.validate
  ```

- [ ] **Step 3: Record evidence and close the active row**

  Add exact test counts and build results to the frontend lane document. Mark
  the follow-up batch complete, move the queue row to just-completed evidence,
  preserve at least three ready rows, and reconcile the plan catalog.

- [ ] **Step 4: Commit the completion boundary**

  ```bash
  git add docs/work/index.md docs/work/frontend-radix-ui-polish.md docs/plans/INDEX.md
  git commit -m "docs: complete task-first layout pass"
  ```

- [ ] **Step 5: Push and refresh PR feedback**

  Push `codex/frontend-radix-ui-polish`, wait for current checks, fetch all new
  and unresolved bot review threads including duplicates and outside-diff
  comments, address actionable feedback, push any follow-up fixes, and reply
  with concrete verification evidence where needed.

