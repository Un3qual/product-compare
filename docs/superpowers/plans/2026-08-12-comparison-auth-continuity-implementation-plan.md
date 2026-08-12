# Comparison And Authentication Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make comparison readable at full width and preserve guest price-watch and comparison-save drafts through a modal GraphQL authentication flow.

**Architecture:** Comparison controls move to a horizontal toolbar above a mode-tabbed specification matrix, while each product receives a curated decision summary rather than a property dump. A shared auth-continuity boundary detects guest intent before mutation, validates and stores a minimal versioned draft in session storage, and routes login/register through a same-origin relative return path. Returning users see their restored draft for review and explicitly submit it.

**Tech Stack:** React 19, React Router 7, Relay 20, Base UI Dialog, StyleX, Phoenix session GraphQL, Vitest, Playwright

## Global Constraints

- The auth prompt is a modal with Sign in, Create account, and Cancel; cancellation restores focus and leaves the form untouched.
- Initial pending intent kinds are price watch and save comparison only.
- Store only product/ordered comparison identity, watch rule/amount/currency, version, expiry, and validated relative return path; never store credentials, secrets, arbitrary form data, or operator mutations.
- Login and registration remain GraphQL mutations and Phoenix session-cookie flows.
- After auth, restore the draft for review; never silently submit a mutation.
- Server authorization remains authoritative when the modal is bypassed or viewer state changes.
- Replace the comparison side rail with a wide toolbar; place Shared/Differences/All tabs immediately above the specification matrix.
- Preserve Decimal/mixed-currency truth, captured-versus-live semantics, ordered products, owner privacy, pagination, and row-local errors.
- Relay-generated types own GraphQL inputs/payloads. Validate browser storage and URL state once; do not revalidate typed Relay data.

---

### Task 1: Characterize comparison layout and guest intent continuity

**Files:**
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `assets/test/routes/compare/compare-save-feedback.test.tsx`
- Create: `assets/test/routes/products/price-watch-auth-continuity.test.tsx`
- Modify: `assets/test/routes/auth/session.route.test.tsx`
- Create: `assets/test/routes/auth/continuity/pending-intent.test.ts`
- Create: `assets/test/routes/auth/continuity/AuthRequiredDialog.test.tsx`
- Modify: `assets/tests/e2e/auth.spec.ts`

**Interfaces:**
- Produces: RED tests for wide toolbar, mode-tab placement, curated product summaries, no displayed slugs, modal focus/cancel, signed-in direct action, guest draft storage, safe return paths, expiry, login/register restoration, and no automatic submit.

- [ ] **Step 1: Add comparison hierarchy RED assertions**

  Assert controls precede comparison content without a narrow `complementary` rail; mode tabs are adjacent to the specification table; each product summary contains identity, price scope, freshness, and a small spec set but not `slug`, internal IDs, or a generic property list.

- [ ] **Step 2: Add guest action RED assertions**

  From price watch and Save comparison, assert no mutation is committed for a guest. Assert the modal's context copy and three actions, unchanged entered values behind it, Escape/cancel focus restoration, and successful direct submission for a signed-in viewer.

- [ ] **Step 3: Add storage/return RED assertions**

  Cover valid versions for both intent kinds, corrupt JSON, wrong version, expired draft, absolute/protocol-relative/cross-origin return rejection, and a valid relative path with query/hash. After auth, assert the originating route restores controls but mutation mock count remains zero.

- [ ] **Step 4: Run RED and commit**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/compare test/routes/products/detail.route.test.tsx test/routes/auth
  git add assets/test assets/tests/e2e/auth.spec.ts
  git commit -m "test: lock comparison and auth continuity"
  ```

---

### Task 2: Implement the minimal pending-intent and modal boundary

**Files:**
- Create: `assets/src/routes/auth/continuity/pending-intent.ts`
- Create: `assets/src/routes/auth/continuity/AuthRequiredDialog.tsx`
- Create: `assets/src/routes/auth/continuity/useAuthenticatedIntent.ts`
- Create: `assets/src/routes/auth/continuity/index.ts`
- Modify: `assets/src/routes/products/PriceWatchControl.tsx`
- Modify: `assets/src/routes/compare/CompareRoute.tsx`
- Modify: `assets/test/routes/auth/continuity/**`

**Interfaces:**
- Produces: `PendingIntent = PriceWatchIntent | SaveComparisonIntent`, discriminated by `kind` and `version: 1` with `expiresAt`.
- Produces: `writePendingIntent`, `readPendingIntent`, `consumePendingIntent`, and `safeRelativeReturnPath`; only this module reads untyped session storage.
- Produces: `useAuthenticatedIntent({ viewer, intent, onAuthenticated })` returning `{ request, dialog }`; `request()` opens the modal for guests and calls `onAuthenticated()` for members.

- [ ] **Step 1: Implement strict storage parsing**

  Accept only the two exact schemas and a short expiry. Normalize ordered comparison products without reordering. Validate return paths with `new URL(value, window.location.origin)` plus same-origin and leading-single-slash checks; reject `//`, backslashes, control characters, auth-loop targets, and external origins.

- [ ] **Step 2: Implement the Base UI dialog**

  Render benefit-specific copy, Link actions with `returnTo` and intent marker query parameters, and Cancel. Keep the originating form mounted, use dialog focus trapping, restore the trigger on close, and do not serialize on Cancel.

- [ ] **Step 3: Integrate both shopper actions before commit**

  Build watch intent from typed form state and comparison intent from ordered Relay products. Write only when Sign in/Create account is chosen. Keep all mutation authorization/error handling for authenticated calls.

- [ ] **Step 4: Run GREEN and commit**

  ```bash
  cd assets && pnpm run typecheck && pnpm run test:unit -- test/routes/auth/continuity test/routes/products/price-watch-auth-continuity.test.tsx test/routes/compare/compare-save-feedback.test.tsx
  git add assets/src/routes/auth assets/src/routes/products/PriceWatchControl.tsx assets/src/routes/compare/CompareRoute.tsx assets/test
  git commit -m "feat: prompt guests before protected shopper actions"
  ```

---

### Task 3: Restore drafts after GraphQL login and registration

**Files:**
- Modify: `assets/src/routes/auth/LoginRoute.tsx`
- Modify: `assets/src/routes/auth/RegisterRoute.tsx`
- Modify: `assets/src/routes/auth/CredentialAuthForm.tsx`
- Modify: `assets/src/routes/products/PriceWatchControl.tsx`
- Modify: `assets/src/routes/compare/CompareRoute.tsx`
- Modify: `assets/test/routes/auth/session.route.test.tsx`
- Modify: `assets/test/routes/products/price-watch-auth-continuity.test.tsx`
- Modify: `assets/test/routes/compare/compare-save-feedback.test.tsx`

**Interfaces:**
- Produces: successful auth navigation to `safeRelativeReturnPath(searchParams.get("returnTo")) ?? "/"`.
- Produces: route-owned restoration notices with explicit `Create watch` or `Save comparison` submit buttons; restoration consumes the stored intent only after the route successfully adopts it.

- [ ] **Step 1: Preserve the return target through both forms**

  Keep GraphQL mutation variables unchanged. On successful viewer update, navigate to the validated relative target. Preserve the target between Sign in and Create account links without putting the pending draft itself in the URL.

- [ ] **Step 2: Restore a watch for review**

  Match product identity, populate typed rule/amount/currency controls, announce that the draft was restored, and wait for an explicit user submit. If identity no longer matches, discard the intent and show the normal empty form.

- [ ] **Step 3: Restore comparison save for review**

  Match ordered products to the current comparison URL, restore any safe editable name, announce restoration, and leave Save comparison enabled but uncommitted. Discard mismatched/expired drafts.

- [ ] **Step 4: Run GREEN and commit**

  ```bash
  cd assets && pnpm run relay:check && pnpm run test:unit -- test/routes/auth test/routes/products/detail.route.test.tsx test/routes/compare
  git add assets/src/routes/auth assets/src/routes/products/PriceWatchControl.tsx assets/src/routes/compare assets/test/routes
  git commit -m "feat: restore shopper drafts after authentication"
  ```

---

### Task 4: Replace the comparison rail and parameter dump

**Files:**
- Create: `assets/src/routes/compare/live/ComparisonToolbar.tsx`
- Create: `assets/src/routes/compare/live/ComparisonModeTabs.tsx`
- Create: `assets/src/routes/compare/live/ProductDecisionSummaries.tsx`
- Create: `assets/src/routes/compare/live/SpecificationMatrix.tsx`
- Create: `assets/src/routes/compare/live/specification-matrix.ts`
- Modify: `assets/src/routes/compare/CompareRoute.tsx`
- Modify: `assets/src/routes/compare/CompareProductList.tsx`
- Delete: `assets/src/routes/compare/CompareSpecificationMatrix.tsx`
- Delete/merge: `assets/src/routes/compare/compare-spec-mode-data.ts`
- Delete/merge: `assets/src/routes/compare/decision-summary-data.ts`
- Modify: focused comparison tests

**Interfaces:**
- `ComparisonToolbar` owns save/share/remove/add controls and wraps responsively without squeezing labels.
- `ComparisonModeTabs` owns URL navigation for `shared | differences | all` and renders immediately above `SpecificationMatrix`.
- `ProductDecisionSummaries` consumes the existing typed comparison product projection and renders curated identity, comparable price context, freshness, and key specs only.

- [ ] **Step 1: Compose the full-width toolbar**

  Remove `WorkspaceLayout` context rail usage for comparison. Place actions above content in a wrapping flex/grid band; at 390px keep readable labels and 44px controls without horizontal page overflow.

- [ ] **Step 2: Place tabs at the matrix boundary**

  Move tabs out of the page-level wrapper and directly before the table heading. Preserve URL authority, modified-click navigation, current-page semantics, empty modes, and table accessibility.

- [ ] **Step 3: Curate product summaries**

  Replace the individual-product details dump with one compact summary per product. Never use object-entry iteration or render every field. Preserve captured-versus-live labels on shared comparison routes.

- [ ] **Step 4: Run GREEN and commit**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/compare
  git add assets/src/routes/compare assets/test/routes/compare
  git commit -m "feat: improve comparison workspace layout"
  ```

---

### Task 5: Reorganize compare/account/auth code and use generated Relay types

**Files:**
- Organize under: `assets/src/routes/compare/live`, `picker`, `sharing`, `saved`, and `shared`
- Organize API tokens under: `assets/src/routes/account/api-tokens/create`, `rows`, `rotation`, and `revocation`
- Organize alerts under: `assets/src/routes/account/alerts/watches` and `alert-rows`
- Merge tiny auth reset/verify helpers into their routes unless reused
- Delete/merge trivial compare/account `*-data.ts` files and corresponding file-shaped tests
- Modify generated-type consumers throughout these capabilities

**Interfaces:**
- Retains substantial specification matrix comparison, saved-view state, URL serialization, and pagination algorithms under responsibility names.
- Removes manual saved-comparison, sharing, alert, and API-token mutation payload/input types; uses indexed generated operation types.
- Removes `priceWatchRuleTypeFromValue` and the manual price-watch enum/input/payload types in favor of the generated create-watch mutation exports.
- Removes record guards around successful typed Relay response data; retains transport/GraphQL error normalization and browser-storage validation.

- [ ] **Step 1: Inventory provenance before moves**

  For each exported type/helper, record generated/library/domain/local ownership and consumers. Delete one-use copy, prop mapping, fallback, and mutation-result files by merging into their owning capability.

- [ ] **Step 2: Move capabilities with tests after behavior**

  Keep route entry files responsible for operation/loader/page composition. Avoid `components`, `utils`, or generic `data` folders. Add no route-level barrel; leaf barrels require multiple sibling imports by multiple consumers.

- [ ] **Step 3: Replace recreated GraphQL shapes**

  Use generated `CreateSavedComparisonSetInput`, sharing mutation payloads, alert mutation enums/inputs, and API-token payload fields. Do not turn custom scalar dates into `unknown`; narrow only at the GraphQL scalar formatting boundary when Relay emits `any`.

- [ ] **Step 4: Run focused structural verification**

  ```bash
  cd assets && pnpm run relay:check && pnpm run typecheck && pnpm run lint && pnpm run test:unit -- test/routes/compare test/routes/account test/routes/auth
  rg -n 'readonly .*: unknown|interface .*Payload|type .*Input' src/routes/compare src/routes/account src/routes/auth
  ```

  Review every remaining hit and name its non-Relay boundary in the lane record.

- [ ] **Step 5: Commit**

  ```bash
  git add assets/src/routes/compare assets/src/routes/account assets/src/routes/auth assets/test/routes
  git commit -m "refactor: organize comparison and account lifecycles"
  ```

---

### Task 6: Verify and close comparison and auth continuity

**Files:**
- Modify: `assets/tests/e2e/production-ui-compare-return.spec.ts`
- Modify: `assets/tests/e2e/auth.spec.ts`
- Update after inspection: corresponding snapshots
- Modify: `docs/work/comparison-auth-continuity.md`

**Interfaces:**
- Produces: deterministic guest watch and save flows through both login and registration, cancellation/focus evidence, responsive comparison toolbar/matrix evidence, accessibility, and no automatic mutation.

- [ ] **Step 1: Run browser flows at three widths**

  Cover price-watch cancel, watch login return, comparison registration return, expired intent, mismatched product discard, mode tabs, add/remove products, save/share, keyboard-only dialog use, axe, reduced motion, and no overflow.

- [ ] **Step 2: Run complete gates**

  ```bash
  cd assets && pnpm run check
  mix format --check-formatted
  mix typecheck
  mix quality
  mix test
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 3: Commit closure**

  ```bash
  git add assets docs/work/comparison-auth-continuity.md
  git commit -m "feat: complete comparison and auth continuity"
  ```
