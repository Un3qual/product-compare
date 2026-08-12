# Operator Workspaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn affiliate setup, CJ program management, and revenue reporting into dense, legible operator workspaces while preserving every lifecycle and partial-failure contract.

**Architecture:** Affiliate setup becomes a four-step workflow with existing records beside the relevant step. CJ becomes a program lifecycle ledger whose feed regions remain independently loaded and paginated. Revenue keeps one control band, a metric strip, and expandable attribution/conversion detail with independent summary and ledger recovery. Each route is reorganized by its operator capability and consumes generated Relay types directly.

**Tech Stack:** React 19, Relay 20, Base UI, TanStack Table, StyleX, Vitest, Playwright

## Global Constraints

- Preserve operator authorization, GraphQL operations, optimistic concurrency, nullable facts, row-local mutations, one-time values, pagination cursors, and independent failure/loading regions.
- Keep exact timestamps primary for financial reconciliation and operational investigation.
- Use compact product/operator language; retain useful investigation IDs and do not display slugs.
- Do not combine program feeds with unmatched feeds, or revenue summary with attribution ledger, into one failure or pagination boundary.
- Use generated Relay enum/input/payload/fragment types; remove successful-data record guards and generic mutation payload recreation.
- Route entries own operation, loader, failure boundary, and composition; subfolders represent workflows rather than `components`, `utils`, or `data` layers.
- Add no operator-tree barrel. Stable leaf barrels require multiple public siblings and consumers.

---

### Task 1: Characterize density, lifecycle, and independent failure behavior

**Files:**
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- Modify: `assets/test/routes/ingestion/cj-programs/cj-programs.route.test.tsx`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts`
- Modify: `assets/tests/e2e/production-ui-operations.spec.ts`

**Interfaces:**
- Produces: RED acceptance for four ordered affiliate steps, CJ lifecycle columns/actions, separate feed regions, one revenue control band, aligned metrics, expandable conversion detail, exact reconciliation times, three responsive widths, and partial-failure independence.

- [ ] **Step 1: Add affiliate workflow RED tests**

  Assert headings in order: Network, Program, Merchant link, Coupon. Existing records must appear beside their step, mutation errors remain step-local, and selecting/creating an earlier entity supplies typed context to later steps without exposing a slug.

- [ ] **Step 2: Add CJ lifecycle RED tests**

  Assert one row per program with network/merchant identity, lifecycle status, last change, required action, and row-local control. Expand feeds and unmatched feeds separately; a failure in one must not hide or reset the other.

- [ ] **Step 3: Add revenue RED tests**

  Assert one filter/control band, aligned revenue/click/conversion/commission metrics, row expansion for purchased/reported facts, exact timestamps, independent summary and ledger retry, and unchanged cursor behavior.

- [ ] **Step 4: Run RED and commit**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/affiliate/setup test/routes/ingestion/cj-programs test/routes/commerce/revenue
  git add assets/test assets/tests/e2e/production-ui-operations.spec.ts
  git commit -m "test: lock operator workspace behavior"
  ```

---

### Task 2: Build the guided affiliate setup workspace

**Files:**
- Create: `assets/src/routes/affiliate/setup/network/NetworkStep.tsx`
- Create: `assets/src/routes/affiliate/setup/program/ProgramStep.tsx`
- Create: `assets/src/routes/affiliate/setup/merchant-link/MerchantLinkStep.tsx`
- Create: `assets/src/routes/affiliate/setup/coupon/CouponStep.tsx`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupOperations.ts`
- Delete/merge: `assets/src/routes/affiliate/setup/AffiliateSetupForms.tsx`
- Delete/merge: `assets/src/routes/affiliate/setup/affiliate-setup-data.ts`
- Modify: focused affiliate tests

**Interfaces:**
- Each step consumes generated operation data and returns only typed selection context needed by the next step.
- Mutation inputs come from generated `UpsertAffiliateNetworkInput`, `UpsertAffiliateProgramInput`, `UpsertAffiliateLinkInput`, and coupon input types.
- Pagination remains a substantial route capability and is not merged into form presentation.

- [ ] **Step 1: Compose the four-step page skeleton**

  Use one page heading and compact numbered sections. Keep existing records visible beside the related form, place results/errors in the same step, and preserve disabled/loading semantics.

- [ ] **Step 2: Use generated mutation types directly**

  Delete manual payload/input interfaces and record guards around completed Relay responses. Keep external URL parsing, Decimal coupon values, and GraphQL error normalization at their actual boundaries.

- [ ] **Step 3: Preserve all mutation lifecycles**

  Keep network/program/link upsert identity, coupon nullable facts, one-time result copy, page cursors, and route-level authorization. Do not infer success from absent errors when the required record is null.

- [ ] **Step 4: Run GREEN and commit**

  ```bash
  cd assets && pnpm run relay:check && pnpm run test:unit -- test/routes/affiliate/setup
  git add assets/src/routes/affiliate/setup assets/test/routes/affiliate/setup assets/src/__generated__
  git commit -m "feat: guide affiliate setup by lifecycle"
  ```

---

### Task 3: Build the CJ lifecycle ledger

**Files:**
- Create: `assets/src/routes/ingestion/cj-programs/programs/ProgramLifecycleTable.tsx`
- Create: `assets/src/routes/ingestion/cj-programs/programs/ProgramLifecycleRow.tsx`
- Create: `assets/src/routes/ingestion/cj-programs/feeds/ProgramFeeds.tsx`
- Create: `assets/src/routes/ingestion/cj-programs/feeds/UnmatchedFeeds.tsx`
- Modify: `assets/src/routes/ingestion/cj-programs/CJProgramsRoute.tsx`
- Delete/merge: `assets/src/routes/ingestion/cj-programs/CJProgramList.tsx`
- Delete/merge: `assets/src/routes/ingestion/cj-programs/CJProgramRow.tsx`
- Delete/merge: `assets/src/routes/ingestion/cj-programs/CJFeedRow.tsx`
- Rename/retain substantial lifecycle policy from: `assets/src/routes/ingestion/cj-programs/cj-program-data.ts`
- Modify: focused CJ tests

**Interfaces:**
- `ProgramLifecycleRow` owns update mutation state and optimistic-concurrency response for one program.
- `ProgramFeeds` and `UnmatchedFeeds` own separate Relay queries/cursors/failure state and remain mounted independently.
- Lifecycle labels are an exhaustive mapping over the generated CJ stage enum, including an explicit `%future added value` display policy.

- [ ] **Step 1: Implement the compact table hierarchy**

  Use TanStack Table for stable lifecycle columns and StyleX for density. Keep row controls at least 44px while allowing text cells to remain compact and wrap without page overflow.

- [ ] **Step 2: Split feed inspection by behavior**

  Give program feeds and unmatched feeds their own disclosure, query descriptor, cursor state, retry, and empty message. Opening or failing one must not dispose/reset the other.

- [ ] **Step 3: Remove duplicated enum/date validation**

  Replace `isCJProgramStage` and string-stage recreation with generated enum types. Keep exact timestamp formatting in the existing exact-date boundary and retain a fallback only for Relay's future sentinel; cross-route relative-date adoption belongs to the gated residual plan.

- [ ] **Step 4: Run GREEN and commit**

  ```bash
  cd assets && pnpm run relay:check && pnpm run test:unit -- test/routes/ingestion/cj-programs
  git add assets/src/routes/ingestion/cj-programs assets/test/routes/ingestion/cj-programs assets/src/__generated__
  git commit -m "feat: create CJ lifecycle ledger"
  ```

---

### Task 4: Refine revenue summary and attribution detail

**Files:**
- Create: `assets/src/routes/commerce/revenue/summary/RevenueControls.tsx`
- Create: `assets/src/routes/commerce/revenue/summary/RevenueMetrics.tsx`
- Create: `assets/src/routes/commerce/revenue/attribution/AttributionLedger.tsx`
- Create: `assets/src/routes/commerce/revenue/attribution/ConversionDetails.tsx`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- Delete/merge: `assets/src/routes/commerce/revenue/RevenueSummaryView.tsx`
- Delete/rename by responsibility: `assets/src/routes/commerce/revenue/revenue-summary-view-data.ts`
- Delete old: `assets/src/routes/commerce/revenue/AttributionLedger.tsx`
- Modify: focused revenue tests

**Interfaces:**
- `RevenueControls` owns exact from/to/status URL state.
- `RevenueMetrics` consumes the typed summary projection and preserves nullable/partial facts.
- `AttributionLedger` owns its connection and page cursor; `ConversionDetails` owns disclosure of purchase/report/commission facts.

- [ ] **Step 1: Compose one control band and metric strip**

  Keep date/status filters in one form with explicit Apply/reset behavior. Align metrics without card mosaics; preserve mixed/unknown currency truth and summary failure recovery.

- [ ] **Step 2: Split attribution row and conversion detail**

  Keep click identity, destination context, and exact click time visible. Move conversion purchase/report/commission facts into an accessible row disclosure; never hide investigation IDs needed by operators.

- [ ] **Step 3: Preserve independent Relay regions**

  Summary query failure must not erase a loaded ledger; ledger pagination failure must retain existing rows and summary. Keep URL-driven filters and Relay cursors unchanged.

- [ ] **Step 4: Remove successful-data guards**

  Index into generated `RevenueSummaryRouteQuery$data` and attribution fragment types. Retain Decimal/date formatting and absent nullable-value presentation; remove `unknown` record reconstruction and generic defaults.

- [ ] **Step 5: Run GREEN and commit**

  ```bash
  cd assets && pnpm run relay:check && pnpm run test:unit -- test/routes/commerce/revenue
  git add assets/src/routes/commerce/revenue assets/test/routes/commerce/revenue assets/src/__generated__
  git commit -m "feat: improve revenue operations workspace"
  ```

---

### Task 5: Audit adjacent operator overvalidation and file ownership

**Files:**
- All touched affiliate/CJ/revenue source and test files
- Relevant shared mutation, external URL, pagination, and date boundaries only
- Modify: `docs/work/operator-workspaces.md`

**Interfaces:**
- Produces: a lane inventory of every retained manual validator and the untyped boundary it protects.
- Produces: fewer generic `*-data.ts` files and no duplicated Relay enum/input/payload/selected-node type in the operator cohort.

- [ ] **Step 1: Search adjacent patterns**

  ```bash
  cd assets && rg -n 'unknown|Record<string, unknown>|Array\.isArray|interface .*Payload|type .*Input|is[A-Z].*Stage|slug' src/routes/affiliate/setup src/routes/ingestion/cj-programs src/routes/commerce/revenue
  ```

- [ ] **Step 2: Delete or justify every hit**

  Delete checks on successful Relay data. Retain FormData, external URL, custom scalar, transport error, and pagination cursor checks once at their boundaries. Record retained owners in the lane doc.

- [ ] **Step 3: Verify file and import shape**

  Confirm route entries remain comprehensible, overloaded files are split by workflow, trivial one-use helpers are merged, and no new generic folder or circular barrel exists.

- [ ] **Step 4: Run focused gates and commit**

  ```bash
  cd assets && pnpm run typecheck && pnpm run lint && pnpm run test:unit -- test/routes/affiliate/setup test/routes/ingestion/cj-programs test/routes/commerce/revenue
  git add assets/src/routes assets/test/routes docs/work/operator-workspaces.md
  git commit -m "refactor: simplify operator route ownership"
  ```

---

### Task 6: Verify and close operator workspaces

**Files:**
- Modify: `assets/tests/e2e/production-ui-operations.spec.ts`
- Update after inspection: `assets/tests/e2e/production-ui-operations.spec.ts-snapshots/**`
- Modify: `docs/work/operator-workspaces.md`

**Interfaces:**
- Produces: desktop/tablet/mobile evidence for the affiliate sequence, CJ lifecycle/feed independence, revenue control/summary/ledger independence, keyboard interactions, axe, reduced motion, and no overflow.

- [ ] **Step 1: Run deterministic browser acceptance**

  Exercise every mutation and failure region with fixtures, inspect screenshots before updates, and verify exact operator timestamps remain reachable.

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
  git add assets docs/work/operator-workspaces.md
  git commit -m "feat: complete operator workspaces"
  ```
