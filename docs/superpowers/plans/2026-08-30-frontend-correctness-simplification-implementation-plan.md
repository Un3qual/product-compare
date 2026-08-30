# Frontend Correctness And Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Narrow unsafe partial recovery and replace manual Relay pagination, lifted mutation machinery, unused select generics, and serialized operation text with owner-local generated contracts.

**Architecture:** Relay pagination fragments own connection accumulation, step components own the mutations they submit, and loader descriptors carry only stable generated request identity plus variables. Existing URL, transport, mutation outcome, fragment-masking, and rendering boundaries remain explicit.

**Tech Stack:** TypeScript 5.9, React 19, Relay 21, React Router 7, Base UI, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`

## Global Constraints

- Never hand-edit generated Relay artifacts; regenerate them with `pnpm run relay`.
- Keep Relay fragment masking, generated operation types, loader discriminated unions, URL/storage/transport validation, and mutation error contracts.
- Preserve visible ordering, page sizes, loading/error behavior, route URLs, SSR hydration, and query-ref lease disposal.
- Do not create a generic pagination hook or generic mutation-state wrapper.
- All current shared `Select` consumers remain single-select; no speculative multiple-mode API remains.
- Frontend E2E TypeScript project inclusion belongs to the tooling outcome, not this row.

---

### Task 1: Restrict product-detail partial GraphQL recovery

**Files:**

- Modify: `assets/src/routes/products/ProductDetailRoute.tsx`
- Modify: `assets/test/routes/products/detail.route.test.tsx`

**Interfaces:**

- `partialProductData/1` returns recoverable data only when every GraphQL error path begins with `product`, `merchantProducts` and the product includes the minimum identity/SEO projection the successful route dereferences.
- Unrelated nested errors, absent SEO, malformed product values, or missing paths produce `{status: "error"}` through the existing loader fallback.

- [ ] **Step 1: Add accepted and rejected partial-response RED cases**

  Keep the existing merchant-offer partial case. Add errors under SEO, specifications, and community plus product objects with absent/malformed SEO and prove none are cached as ready route data.

- [ ] **Step 2: Run RED**

  ```bash
  cd assets && pnpm exec vitest run test/routes/products/detail.route.test.tsx
  ```

- [ ] **Step 3: Implement one narrow recovery predicate**

  Derive the product shape from `ProductDetailRouteQuery["response"]`; do not introduce a parallel broad response interface or cast an arbitrary object into the generated type.

- [ ] **Step 4: Run GREEN**

  ```bash
  cd assets && pnpm exec vitest run test/routes/products/detail.route.test.tsx
  ```

---

### Task 2: Move product community pagination into Relay fragments

**Files:**

- Modify: `assets/src/routes/products/community/ProductCommunityOperations.ts`
- Modify: `assets/src/routes/products/community/ProductCommunityPanel.tsx`
- Modify: `assets/src/routes/products/community/CommunityQuestionAnswers.tsx`
- Modify only if generated projections become unnecessary: `assets/src/routes/products/community/product-community-data.ts`
- Modify: `assets/test/routes/products/community/product-community-panel.test.tsx`
- Modify: `assets/test/routes/products/community/product-community-relay-update.test.tsx`
- Modify if data helpers change: `assets/test/routes/products/community/product-community-data.test.ts`
- Regenerate: matching `assets/src/__generated__/*ProductCommunity*` and `*CommunityQuestionAnswers*` artifacts

**Interfaces:**

- Reviews and questions are separate `@refetchable`/`@connection` fragments owned by their rendering sections.
- Question answers are a `@refetchable`/`@connection` fragment owned by `CommunityQuestionAnswers`.
- `usePaginationFragment` owns `hasNext`, `isLoadingNext`, and `loadNext`; local arrays, `after` state, append effects, and duplicate suppression disappear.

- [ ] **Step 1: Characterize current independent paging behavior**

  Assert reviews, questions, and one question's answers advance independently, preserve existing rows, prevent repeated clicks while loading, and isolate a failed next page to its region.

- [ ] **Step 2: Add pagination fragments and run Relay validation RED**

  ```bash
  cd assets && pnpm run relay
  ```

  The component tests should fail until the new fragment refs replace query-driven cursor state.

- [ ] **Step 3: Adopt `usePaginationFragment` in each owner**

  Split only the connection-owning sections needed to avoid one component holding two pagination fragments. Keep submission and owner-content behavior outside this refactor.

- [ ] **Step 4: Run focused GREEN**

  ```bash
  cd assets && pnpm exec vitest run \
    test/routes/products/community/product-community-panel.test.tsx \
    test/routes/products/community/product-community-relay-update.test.tsx \
    test/routes/products/community/product-community-data.test.ts
  ```

---

### Task 3: Move compare picker and snapshot pagination into Relay fragments

**Files:**

- Modify: `assets/src/routes/compare/picker/CompareProductPickerBoundary.tsx`
- Modify: `assets/src/routes/compare/picker/CompareProductPickerView.tsx` only if its loading contract needs a named prop
- Modify: `assets/src/routes/compare/sharing/ComparisonSharingOperations.ts`
- Modify: `assets/src/routes/compare/sharing/ShareComparisonControl.tsx`
- Modify only if cursor helpers become unused: `assets/src/routes/compare/picker/compare-picker.ts`
- Modify only if cursor helpers become unused: `assets/src/routes/compare/sharing/share-comparison.ts`
- Modify: `assets/test/routes/compare/compare-relay-migration.test.tsx`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `assets/test/routes/compare/comparison-snapshots.test.tsx`
- Modify: `assets/test/routes/compare/compare-picker-data.test.ts`
- Modify: `assets/test/routes/compare/share-comparison-data.test.ts`
- Regenerate: matching compare picker and comparison sharing Relay artifacts

**Interfaces:**

- The picker query/fragment and viewer snapshot fragment each own one Relay connection through `usePaginationFragment`.
- Selection, filtering, publish/revoke mutation state, dialog state, and pending/error maps retain their current owners.
- `SnapshotControlView` is inlined only if it remains a pure pass-through after pagination moves; no component deletion is required to satisfy the task.

- [ ] **Step 1: Add focused pagination characterization**

  Prove picker and snapshot lists retain prior nodes, suppress duplicate loads while pending, stop at `hasNext === false`, and preserve mutation state across pagination.

- [ ] **Step 2: Define generated connection ownership and regenerate**

  ```bash
  cd assets && pnpm run relay
  ```

- [ ] **Step 3: Replace cursor/append effects with pagination fragments**

  Remove only helpers made unreachable by Relay ownership. Keep URL selection and snapshot projection helpers that still represent real boundaries.

- [ ] **Step 4: Run focused GREEN**

  ```bash
  cd assets && pnpm exec vitest run \
    test/routes/compare/compare-relay-migration.test.tsx \
    test/routes/compare/compare.route.test.tsx \
    test/routes/compare/comparison-snapshots.test.tsx \
    test/routes/compare/compare-picker-data.test.ts \
    test/routes/compare/share-comparison-data.test.ts
  ```

---

### Task 4: Colocate affiliate mutations with their workflow steps

**Files:**

- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Modify: `assets/src/routes/affiliate/setup/network/NetworkStep.tsx`
- Modify: `assets/src/routes/affiliate/setup/program/ProgramStep.tsx`
- Modify: `assets/src/routes/affiliate/setup/merchant-link/MerchantLinkStep.tsx`
- Modify: `assets/src/routes/affiliate/setup/coupon/CouponStep.tsx`
- Modify only for exported operation/outcome ownership: `assets/src/routes/affiliate/setup/AffiliateSetupOperations.ts`
- Modify only for form input ownership: `assets/src/routes/affiliate/setup/affiliate-form-values.ts`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`

**Interfaces:**

- Each step owns its `useMutation`, in-flight ref, pending flag, error, result, and submit handler.
- `AffiliateSetupPanel` owns only merchant query data, selected merchant id, selected/created network id, and callbacks that advance shared workflow identity.
- Mutation variables, result rendering, duplicate-submit suppression, and generic fallback copy remain unchanged.

- [ ] **Step 1: Add ownership-level characterization**

  Assert each step can fail/succeed independently, a network success updates the shared network id, merchant selection still feeds link/coupon context, and one step's pending/error state does not clear another's result.

- [ ] **Step 2: Move one mutation at a time into its existing step**

  After each move, run the focused route suite. Do not create a hook that parameterizes all four mutations.

- [ ] **Step 3: Remove parent state/refs/imports proven unused**

  `AffiliateSetupPanel` should no longer import `useMutation`, `useRef`, mutation operation types, or mutation outcome helpers solely for child actions.

- [ ] **Step 4: Run focused GREEN**

  ```bash
  cd assets && pnpm exec vitest run \
    test/routes/affiliate/setup/affiliate-setup-loader.test.ts \
    test/routes/affiliate/setup/affiliate-setup.route.test.tsx
  ```

---

### Task 5: Specialize Select and compact route preload descriptors

**Files:**

- Modify: `assets/src/ui/primitives/Select.tsx`
- Modify: `assets/src/relay/route-preload.ts`
- Modify: `assets/test/relay/route-preload.test.ts`
- Modify any focused select primitive test if present under `assets/test/ui/**`
- Modify only descriptor-shaped fixtures identified by TypeScript under `assets/test/**`

**Interfaces:**

- `Select<Value>` accepts `SelectRootProps<Value, false>` and preserves controlled, uncontrolled, reset, ref, and accessibility behavior without a multiple branch.
- `RelayRouteQueryDescriptor` contains `{cacheID, operationName, variables}`.
- Descriptor identity is `[cacheID, stableJsonValue(variables)]`; operation name is diagnostic only.
- `createRouteQueryDescriptor` throws a focused development/test error when a generated request lacks `params.cacheID`.

- [ ] **Step 1: Add descriptor serialization and identity RED cases**

  Assert descriptor JSON omits query text, variable key order is irrelevant, different cache IDs differ, operation names alone do not define identity, and missing cache ID fails explicitly.

- [ ] **Step 2: Characterize single-select reset behavior**

  Use existing primitive/form coverage if present; otherwise add one focused test proving controlled and uncontrolled reset behavior before simplifying the generic.

- [ ] **Step 3: Implement both YAGNI reductions**

  Remove `Multiple`, `multiple`, array reset/trigger formatting, operation `text`, and text-based identity. Do not change query fetch, store commit, lease, or eviction flows.

- [ ] **Step 4: Run complete frontend verification**

  ```bash
  cd assets && pnpm run relay:check
  cd assets && pnpm run typecheck
  cd assets && pnpm run lint
  cd assets && pnpm run format:check
  cd assets && pnpm run test:unit
  cd assets && pnpm run build
  git diff --check
  ```

- [ ] **Step 5: Run targeted browser flows**

  ```bash
  cd assets && PLAYWRIGHT_PORT=4193 pnpm run test:e2e -- \
    tests/e2e/product-experience-foundations.spec.ts
  ```

- [ ] **Step 6: Commit the reviewed outcome**

  ```bash
  git add assets/src assets/test docs/work/frontend-correctness-simplification.md docs/work/index.md
  git commit -m "refactor: simplify frontend data ownership"
  ```

