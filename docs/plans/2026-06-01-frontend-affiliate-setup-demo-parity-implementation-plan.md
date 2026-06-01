# Frontend Affiliate Setup Demo Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing authenticated affiliate setup GraphQL contract demoable from the browser UI.

**Architecture:** Add a Relay-backed `/affiliate/setup` route that preloads public merchant choices and commits the existing affiliate setup mutations through Relay. Keep this slice focused on setup workflows that already exist in GraphQL: network upsert, merchant program upsert, merchant-product affiliate link upsert, and coupon creation. Do not add REST endpoints or broaden browser auth beyond the existing Phoenix session cookie plus GraphQL contract.

**Tech Stack:** Phoenix Absinthe GraphQL, React Router loaders, React Relay, Bun, Vitest, Testing Library, StyleX primitives.

---

## Existing Contract

- Backend mutations:
  - `upsertAffiliateNetwork(input:)`
  - `upsertAffiliateProgram(input:)`
  - `upsertAffiliateLink(input:)`
  - `createCoupon(input:)`
- Backend query prerequisite:
  - `merchants(first:, after:)` supplies global merchant IDs for program and coupon setup.
- Auth behavior:
  - Affiliate mutations require `current_user` and return typed mutation errors with `UNAUTHENTICATED` on missing sessions.
  - Browser auth remains GraphQL-only through `/api/graphql`.
- Current frontend gap:
  - `assets/schema.graphql` does not yet include the affiliate mutation types, so Relay artifacts for this route must refresh the local schema snapshot before generation.

## File Structure

- Create `assets/src/routes/affiliate/setup/queries/AffiliateSetupRouteQuery.ts` for merchant choices.
- Create `assets/src/routes/affiliate/setup/loader.ts` for merchant pagination normalization and Relay preloading.
- Create `assets/src/routes/affiliate/setup/index.tsx` for the setup UI and mutation result rendering.
- Create `assets/src/routes/affiliate/setup/mutations/*.ts` for the four affiliate setup mutations.
- Create focused tests under `assets/src/routes/affiliate/setup/__tests__/**`.
- Modify `assets/schema.graphql` and generated Relay artifacts under `assets/src/__generated__/**`.
- Modify `assets/src/router.tsx`, `assets/src/routes/root.tsx`, `assets/src/routes/__tests__/root.route.test.tsx`, and `assets/src/__tests__/router.test.tsx` when registering the route.
- Update `docs/work/frontend-affiliate-setup-demo-parity.md`, `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` at milestone boundaries.

---

### Task 1: Add The Affiliate Setup Route Query And Loader

**Files:**
- Create: `assets/src/routes/affiliate/setup/queries/AffiliateSetupRouteQuery.ts`
- Create: `assets/src/routes/affiliate/setup/loader.ts`
- Create: `assets/src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts`
- Modify generated: `assets/src/__generated__/AffiliateSetupRouteQuery.graphql.ts`
- Modify after verification: `docs/work/frontend-affiliate-setup-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [x] **Step 1: Write failing loader tests**

Create loader coverage for default merchant pagination, supported `first`/`after` params, invalid page-size normalization, and recoverable preload errors.

- [x] **Step 2: Run the loader tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts
```

Expected: FAIL because `../loader` does not exist.

- [x] **Step 3: Add the route query**

Create `AffiliateSetupRouteQuery` using the existing `merchants(first:, after:)` connection with merchant `id`, `name`, `domain`, cursors, and page info.

- [x] **Step 4: Add the loader**

Create `affiliateSetupLoader` with default merchant page size `20`, maximum page size `50`, cursor normalization, Relay route preloading, and recoverable error state through `recoverRouteLoaderError`.

- [x] **Step 5: Generate Relay artifacts**

Run:

```bash
cd assets && bun run relay
```

Expected: PASS and create `assets/src/__generated__/AffiliateSetupRouteQuery.graphql.ts`.

- [x] **Step 6: Run focused verification**

Run:

```bash
cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts
cd assets && bun run typecheck
```

Expected: PASS.

- [x] **Step 7: Update queue docs and commit**

Mark Task 1 complete, record verification, advance the current batch to Task 2, then commit the code/test/doc slice.

---

### Task 2: Render Network And Program Setup

**Files:**
- Create: `assets/src/routes/affiliate/setup/index.tsx`
- Create: `assets/src/routes/affiliate/setup/mutations/UpsertAffiliateNetworkMutation.ts`
- Create: `assets/src/routes/affiliate/setup/mutations/UpsertAffiliateProgramMutation.ts`
- Create: `assets/src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx`
- Modify: `assets/schema.graphql`
- Modify generated: `assets/src/__generated__/UpsertAffiliateNetworkMutation.graphql.ts`
- Modify generated: `assets/src/__generated__/UpsertAffiliateProgramMutation.graphql.ts`
- Modify after verification: `docs/work/frontend-affiliate-setup-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [x] **Step 1: Write failing route tests**

Cover rendering merchant choices from the preloaded merchant query, loader/query unavailable fallback, successful network upsert result with returned global ID, network payload errors, successful program upsert using selected merchant and network IDs, and program payload errors.

- [x] **Step 2: Run the route tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx
```

Expected: FAIL because the route component and mutation files do not exist.

- [x] **Step 3: Refresh the local schema snapshot**

Add the affiliate mutation fields, input objects, payload objects, `AffiliateNetwork`, `AffiliateProgram`, and `MutationError` fields needed by the route.

- [x] **Step 4: Add the mutation documents and route UI**

Add Relay mutation documents and render forms that commit through `commitRouteMutationPromise`, display typed payload errors, suppress duplicate submissions, and keep returned network/program IDs visible for follow-on setup.

- [x] **Step 5: Generate Relay artifacts and verify**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts
cd assets && bun run typecheck
```

Expected: PASS.

- [x] **Step 6: Update queue docs and commit**

Mark Task 2 complete, record verification, advance the current batch to Task 3, then commit the code/test/doc slice.

---

### Task 3: Add Link And Coupon Setup

**Files:**
- Modify: `assets/src/routes/affiliate/setup/index.tsx`
- Create: `assets/src/routes/affiliate/setup/mutations/UpsertAffiliateLinkMutation.ts`
- Create: `assets/src/routes/affiliate/setup/mutations/CreateCouponMutation.ts`
- Modify: `assets/src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx`
- Modify: `assets/schema.graphql`
- Modify generated: `assets/src/__generated__/UpsertAffiliateLinkMutation.graphql.ts`
- Modify generated: `assets/src/__generated__/CreateCouponMutation.graphql.ts`
- Modify after verification: `docs/work/frontend-affiliate-setup-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [x] **Step 1: Write failing route tests**

Cover successful affiliate link upsert, link payload errors, successful coupon creation, coupon payload errors, and expected field normalization for optional network/date/currency inputs.

- [x] **Step 2: Run the route tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx
```

Expected: FAIL because link and coupon setup controls are not implemented.

- [x] **Step 3: Add schema snapshot fields and mutation documents**

Add `AffiliateLink`, `Coupon`, coupon discount enum, link/coupon input and payload types, and the two mutation documents.

- [x] **Step 4: Implement link and coupon setup controls**

Commit link and coupon mutations through Relay, reuse the route mutation error helpers, clear stale success/error state on new submissions, and render returned entity IDs plus the most important returned fields.

- [x] **Step 5: Generate Relay artifacts and verify**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts
cd assets && bun run typecheck
```

Expected: PASS.

- [x] **Step 6: Update queue docs and commit**

Mark Task 3 complete, record verification, advance the current batch to Task 4, then commit the code/test/doc slice.

---

### Task 4: Register The Route, Verify The Contract, And Close The Lane

**Files:**
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/root.tsx`
- Modify: `assets/src/routes/__tests__/root.route.test.tsx`
- Modify: `assets/src/__tests__/router.test.tsx`
- Modify: `docs/work/frontend-affiliate-setup-demo-parity.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`

- [x] **Step 1: Write failing route registration and navigation tests**

Cover `/affiliate/setup` registration with `affiliateSetupLoader`, the route error boundary, and `Affiliate setup` links in primary navigation and home actions.

- [x] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx
```

Expected: FAIL because the route and links are absent.

- [x] **Step 3: Wire the route and navigation**

Register `/affiliate/setup` under the root route and add `Affiliate setup` navigation links.

- [x] **Step 4: Run focused frontend verification**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx
cd assets && bun run typecheck
```

Expected: PASS.

- [x] **Step 5: Run backend contract verification**

Run:

```bash
mix test test/product_compare_web/graphql/affiliate_workflows_test.exs
```

Expected: PASS.

- [x] **Step 6: Run final gates**

Run:

```bash
cd assets && bun run check
git diff --check
```

Expected: PASS.

- [x] **Step 7: Close the lane and commit**

Mark the lane complete in `docs/work/frontend-affiliate-setup-demo-parity.md`, update coordinator docs, record exact verification, and commit the closure slice.
