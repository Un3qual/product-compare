# Production UI Compare And Return Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign live, saved, shared, and alert decision flows around stable numbered products, readable differences, trustworthy status, and safe return actions.

**Architecture:** Preserve the existing URL-authoritative compare loader, Relay recommendation/sharing operations, owner-scoped saved and alert loaders, and immutable shared snapshot contract. Apply the stable spine through route-owned comparison, saved/shared, and alert components; the real two-dimensional specification matrix remains a semantic horizontally scrollable table with sticky identity context. Treat these routes as one decision-lifecycle outcome because they share product order, saved/shared return paths, and price-change context.

**Tech Stack:** React 19, React Router 7, Relay 20, StyleX, Radix, Vitest, Playwright, axe-core.

## Global Constraints

- Requires the completed System Spine And Home plan and must not modify shared spine owners.
- Preserve ordered repeated `slug` parameters, de-duplication, three-product limit, picker pagination/filtering, add/remove actions, and all/differences URL state.
- Preserve exact Decimal comparison, mixed-currency safeguards, incomplete loaded-page disclaimers, missing cells, and partial offer-context survival.
- Preserve signed-in save naming, buying-priority recommendations, public snapshot publish/list/revoke, immutable snapshot truth, saved-set owner privacy, alert owner privacy, and row-scoped mutation state.
- Keep source-backed reasons but label them in plain buying language; never render evidence, recommendation profile, persisted snapshot, or schema terms.
- Comparison matrices may scroll horizontally; other lists must not cause page-level overflow.
- Keep one semantic tree per responsive surface and stable selection numbers everywhere.
- Do not change backend or GraphQL contracts in this cohort.

---

## Owned Paths

- `assets/src/routes/compare/CompareRoute.tsx`
- `assets/src/routes/compare/CompareShell.tsx`
- `assets/src/routes/compare/CompareProductList.tsx`
- `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
- `assets/src/routes/compare/CompareProductPickerView.tsx`
- `assets/src/routes/compare/CompareSelectionTray.tsx`
- `assets/src/routes/compare/CompareSpecificationMatrix.tsx`
- `assets/src/routes/compare/DecisionSummary.tsx`
- `assets/src/routes/compare/RecommendationPanel.tsx`
- `assets/src/routes/compare/ShareComparisonControl.tsx`
- `assets/src/routes/compare/SavedComparisonsRoute.tsx`
- `assets/src/routes/compare/SavedComparisonSetList.tsx`
- `assets/src/routes/compare/shared/SharedComparisonRoute.tsx`
- `assets/src/routes/account/alerts/AlertsRoute.tsx`
- `assets/test/routes/compare/**`
- `assets/test/routes/account/alerts/**`
- `assets/tests/e2e/production-ui-compare-return.spec.ts`
- `assets/tests/e2e/production-ui-compare-return.spec.ts-snapshots/**`
- `docs/work/production-ui-compare-return.md`

## Feature-Parity Ledger

| Surface | Behavior that must remain executable | Existing verification boundary |
| --- | --- | --- |
| `/compare` selection | empty picker, filtering/pagination, URL order, max three, add/remove/tray, not-found and error states | `compare.route.test.tsx`, picker/path/data tests |
| `/compare` decision | product cards, loaded price summary, exact Decimal/mixed currency, specs all/differences/missing, partial offers | compare loader/route/specification tests |
| Save/recommend/share | named save; two buying priorities; status/reasons/missing inputs; publish/indexability/list pagination/open/revoke and row errors | save/recommendation/snapshot tests |
| `/compare/saved` | auth/forbidden; paging; filter/sort; order/fallbacks; reopen; confirmed concurrent deletion; all empty/error states | saved comparison route/state tests |
| `/compare/shared/:token` | revoked/invalid 404; metadata; captured facts/source details/offers/recommendation/disclaimer; live path | comparison snapshot/shared view tests |
| `/account/alerts` | recent events/read state; active/paused watches; truncation; mark read, pause/resume, confirmed delete; row state/auth | alert loader/route/data/mutation tests |

### Task 1: Lock Decision-Lifecycle Presentation Parity

**Files:**

- Modify all owned compare and alert test directories.
- Modify the lane doc.

- [ ] **Step 1: Add RED hierarchy, language, and responsive assertions**

  Assert stable `Product 1`–`Product 3` labels across tray/cards/matrix, a sticky first matrix column, keyboard-operable tabs/picker/share disclosure/dialogs, plain labels `Buying priority`, `Why this choice`, `Shared comparison`, and `Source details`, and no duplicated responsive content.

- [ ] **Step 2: Pin every feature-ledger state**

  Add missing assertions without replacing current behavior checks:

  ```tsx
  expect(screen.getByRole("region", { name: "Comparison workspace" })).toBeVisible();
  expect(screen.getByRole("tab", { name: "Differences" })).toHaveAttribute("aria-selected", "true");
  expect(screen.queryByText(/\b(evidence|recommendation profile|persisted snapshot)\b/i)).not.toBeInTheDocument();
  ```

- [ ] **Step 3: Run RED and record baseline**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/compare test/routes/account/alerts
  ```

- [ ] **Step 4: Commit characterization**

  ```bash
  git add assets/test/routes/compare assets/test/routes/account/alerts docs/work/production-ui-compare-return.md
  git commit -m "test: lock compare return UI parity"
  ```

### Task 2: Redesign Live Comparison, Recommendations, And Sharing

**Files:**

- Modify the ten live compare source files listed before Saved Comparisons.
- Modify focused compare tests.

**Interfaces:**

- Consumes: stable numbered comparison, workspace, feedback, tab, disclosure, dialog, and mono data-label primitives.
- Produces: one comparison workspace with ordered identity, decision summary, buying priorities, specifications, save, and sharing.

- [ ] **Step 1: Add RED interaction tests**

  Cover selected-item movement, add/remove focus, max-selection message, all/differences tabs, mixed-currency copy, recommendation loading/error/unsupported states, save input preservation, optional share title/indexability, paginated snapshots, and isolated revoke failures.

- [ ] **Step 2: Implement route-owned composition**

  Keep identity and controls visible before the matrix, make price scope explicit, render recommendations as decision support rather than a marketing verdict, and retain source facts behind concise `Why this choice` disclosure. Use sticky matrix identity and deliberate matrix-only overflow.

- [ ] **Step 3: Run GREEN**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/compare/compare.route.test.tsx test/routes/compare/comparison-snapshots.test.tsx test/routes/compare/recommendation-route-data.test.ts test/routes/compare/recommendation-view-data.test.ts
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/src/routes/compare assets/test/routes/compare docs/work/production-ui-compare-return.md
  git commit -m "feat: redesign live comparison workspace"
  ```

### Task 3: Redesign Saved And Shared Return Paths

**Files:**

- Modify saved/shared source files and their tests.

- [ ] **Step 1: Add RED saved/shared state tests**

  Assert filter and four sort modes, pagination, preserved product order, reopen, confirmed delete, concurrent row state, sign-in recovery, forbidden/unavailable/no-match states, revoked-token 404, captured-time/disclaimer/freshness/source details, and the current comparison path.

- [ ] **Step 2: Implement return-oriented layouts**

  Make `Open comparison` the primary saved action, keep delete consequence local, distinguish captured from current values on shared pages, and use plain source/freshness language. Do not imply that a fixed shared comparison updates live.

- [ ] **Step 3: Run GREEN**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/compare/saved-comparisons-route-state.test.tsx test/routes/compare/comparison-snapshots.test.tsx test/routes/compare/shared-comparison-view-data.test.ts
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/src/routes/compare/SavedComparisonsRoute.tsx assets/src/routes/compare/SavedComparisonSetList.tsx assets/src/routes/compare/shared assets/test/routes/compare docs/work/production-ui-compare-return.md
  git commit -m "feat: redesign saved and shared comparisons"
  ```

### Task 4: Redesign Price Alerts As A Return Workspace

**Files:**

- Modify: `assets/src/routes/account/alerts/AlertsRoute.tsx`
- Modify alert tests.

- [ ] **Step 1: Add RED alert workflow tests**

  Pin unread/read rows, exact threshold/percentage/availability labels, current/baseline/observation facts, active and paused order, truncation, product links, mark-read, pause/resume, confirmed delete, independent row state, unauthorized and empty states.

- [ ] **Step 2: Implement alert composition**

  Lead with recent changes, then active watches and paused watches. Use the freshness rail only on observed events, keep each mutation beside its row, and make the sign-in recovery path descriptive.

- [ ] **Step 3: Run GREEN**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/account/alerts
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/src/routes/account/alerts/AlertsRoute.tsx assets/test/routes/account/alerts docs/work/production-ui-compare-return.md
  git commit -m "feat: redesign comparison return alerts"
  ```

### Task 5: Verify And Close Compare And Return

**Files:**

- Create the owned Playwright spec and snapshots.
- Modify the lane doc.

- [ ] **Step 1: Add deterministic journeys**

  Cover empty-to-three-product comparison, differences mode, recommendation failure, save, share/revoke, saved filter/reopen/delete, immutable shared view, alert mark/pause/delete, keyboard-only flows, axe scans, reduced motion, matrix-only overflow, and page no-overflow at the three approved widths.

- [ ] **Step 2: Generate, inspect, and rerun snapshots**

  ```bash
  cd assets && pnpm exec playwright test tests/e2e/production-ui-compare-return.spec.ts --update-snapshots
  cd assets && pnpm exec playwright test tests/e2e/production-ui-compare-return.spec.ts
  ```

- [ ] **Step 3: Run complete gates and close the ledger**

  ```bash
  cd assets && pnpm run check
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/tests/e2e docs/work/production-ui-compare-return.md
  git commit -m "test: verify compare return production UI"
  ```

## Blocker And Fallback Rules

- Stop if the stable shared spine must change or any backend/GraphQL contract appears insufficient; record the exact owner and state.
- Never replace Decimal/mixed-currency/incomplete-page truth with a visually simpler best-price claim.
- Never merge captured and live comparison values or hide snapshot revocation, saved deletion, or alert mutations on small screens.
- Never clone matrix content into a second mobile DOM tree; use sticky context and deliberate table overflow.
