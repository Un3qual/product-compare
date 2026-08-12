# Production UI Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign CJ-program lifecycle and revenue reporting as dense, legible operator workspaces while preserving every filter, mutation, independent pagination region, and partial-failure boundary.

**Architecture:** Keep both existing Relay loaders and all domain operations unchanged. Apply the stable production spine with route-owned dense ledgers, control rails, mono data labels, localized row state, and explicit partial-failure regions; do not turn operator work into marketing pages or summary-card dashboards. Treat CJ programs and revenue as one operations outcome because both require high-density filtering, factual status, independent data regions, and recovery under partial failure.

**Tech Stack:** React 19, React Router 7, Relay 20, StyleX, Radix, Vitest, Playwright, axe-core.

## Global Constraints

- Requires the completed System Spine And Home plan and must not modify shared spine owners.
- Preserve current operator authorization and every existing query/mutation variable, filter, sort, cursor, lifecycle stage, concurrency rule, date/currency rule, metric, and ledger fact.
- Provider, advertiser program, conversion, commission, and attribution terms are allowed when they are the operators' actual domain language; schema implementation language and “evidence” are not.
- CJ program updates and feed failures remain row-scoped; program and unmatched-feed pagination remain independent.
- Revenue summary remains visible while its ledger is pending or unavailable; ledger pagination failures retry locally and reset when filters change.
- Use dense layout, dividers, alignment, and mono labels before containers; do not produce KPI-card mosaics.
- Keep one semantic tree, keyboard reachability, reduced-motion parity, and no page-level overflow at supported widths.
- Do not change backend or GraphQL contracts in this cohort.

---

## Owned Paths

- `assets/src/routes/ingestion/cj-programs/CJProgramsRoute.tsx`
- `assets/src/routes/ingestion/cj-programs/CJProgramList.tsx`
- `assets/src/routes/ingestion/cj-programs/CJProgramRow.tsx`
- `assets/src/routes/ingestion/cj-programs/CJFeedRow.tsx`
- `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- `assets/src/routes/commerce/revenue/RevenueSummaryView.tsx`
- `assets/src/routes/commerce/revenue/AttributionLedger.tsx`
- `assets/test/routes/ingestion/cj-programs/**`
- `assets/test/routes/commerce/revenue/**`
- `assets/tests/e2e/production-ui-operations.spec.ts`
- `assets/tests/e2e/production-ui-operations.spec.ts-snapshots/**`
- `docs/work/production-ui-operations.md`

## Feature-Parity Ledger

| Surface | Behavior that must remain executable | Existing verification boundary |
| --- | --- | --- |
| CJ overview | full-dataset stage counts, stage filter, sort, program paging, empty/loading/unavailable | CJ loader/route/pagination tests |
| CJ program rows | advertiser/feed/warning/stage/note/change facts, all stages, expected-change save, stale reload, independent row state | CJ route/data tests |
| CJ feed regions | lazy first expansion, bounded facts, local retry, first/next pages, refreshed row survival | CJ route/feed query tests |
| Unmatched feeds | all feed facts and independent first/next pagination | CJ route/pagination tests |
| Revenue controls | currency/network/from/to, local-day presets, retained filters, active summary, missing currency, invalid range | revenue loader/view-data/route tests |
| Revenue output | five metrics including zero/unavailable, click/user/request/program/network/conversion details, independent load-more/retry/reset, summary survival | revenue route and ledger tests |

### Task 1: Lock Operator Presentation Parity

**Files:**

- Modify both owned test directories.
- Modify the lane doc.

- [ ] **Step 1: Add RED density, language, and semantic assertions**

  Assert one primary workspace per route, scannable headings without marketing copy, mono presentation for ids/timestamps/amounts/counts, all current controls and regions, keyboard-accessible row disclosures, and no implementation vocabulary:

  ```tsx
  expect(screen.queryByText(/\bevidence\b/i)).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: /program lifecycle|revenue summary/i })).toBeVisible();
  ```

- [ ] **Step 2: Pin every feature-ledger state**

  Add missing assertions for row concurrency, lazy feed retry, independent cursor regions, local-calendar presets, summary-versus-ledger partial failure, anonymous clicks, null/empty metrics, and ledger error reset.

- [ ] **Step 3: Run RED and record baseline**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/ingestion/cj-programs test/routes/commerce/revenue
  ```

- [ ] **Step 4: Commit characterization**

  ```bash
  git add assets/test/routes/ingestion/cj-programs assets/test/routes/commerce/revenue docs/work/production-ui-operations.md
  git commit -m "test: lock operations UI parity"
  ```

### Task 2: Redesign CJ Program Lifecycle Operations

**Files:**

- Modify all four owned CJ source files and tests.

**Interfaces:**

- Consumes: stable workspace, context rail, status, select, disclosure, pagination, feedback, and mono data-label primitives.
- Produces: a lifecycle ledger with independent program/feed/unmatched-feed state.

- [ ] **Step 1: Add RED workflow tests**

  Pin full-dataset counts, filter/sort URLs, first/next pages, every lifecycle choice, trimmed note save, in-flight isolation, payload/network feedback, stale response refresh, future unknown stage display, first-expansion fetch, feed retry/page replacement, unmatched feed facts, and empty/unavailable states.

- [ ] **Step 2: Implement dense lifecycle composition**

  Put counts and controls before the program ledger, align advertiser identity/status/change time, keep stage/note save in its row, and reveal feed details without shifting unrelated rows. Present unmatched feeds as a separate named region with its own pagination.

- [ ] **Step 3: Run GREEN**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/ingestion/cj-programs
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/src/routes/ingestion/cj-programs assets/test/routes/ingestion/cj-programs docs/work/production-ui-operations.md
  git commit -m "feat: redesign CJ program operations"
  ```

### Task 3: Redesign Revenue Summary And Attribution Details

**Files:**

- Modify all three owned revenue source files and tests.

**Interfaces:**

- Consumes: stable workspace, filter, summary strip, feedback, pagination, and mono data-label primitives.
- Produces: one revenue workspace with summary and independently recoverable click/conversion details.

- [ ] **Step 1: Add RED control and partial-failure tests**

  Pin filter field refresh, supported network/currency/date validation, local-day presets, active-filter order, five metric facts with zero/null/empty handling, click/user/anonymous/request/program/network/conversion data, equal conversion refs across networks, load-more/retry, error reset, and summary survival during pending/failed ledger.

- [ ] **Step 2: Implement dense revenue composition**

  Keep filter scope and date presets adjacent, render metrics as one aligned summary strip rather than cards, label the ledger `Attribution details`, and keep conversion details nested under their click. Use data alignment and dividers; preserve every nullable fact and do not infer unavailable values.

- [ ] **Step 3: Run GREEN**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/commerce/revenue
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/src/routes/commerce/revenue assets/test/routes/commerce/revenue docs/work/production-ui-operations.md
  git commit -m "feat: redesign revenue operations"
  ```

### Task 4: Verify And Close Operations

**Files:**

- Create the owned Playwright spec and snapshots.
- Modify the lane doc.

- [ ] **Step 1: Add deterministic browser journeys**

  Cover CJ filter/sort/stage-note save/feed expansion/retry/unmatched pagination and revenue filter/preset/metric/ledger load-more/retry. Add keyboard-only journeys, axe scans, reduced motion, dense tablet/mobile behavior, and no-overflow assertions at 1440×1000, 900×1100, and 390×844.

- [ ] **Step 2: Generate, inspect, and rerun snapshots**

  ```bash
  cd assets && pnpm exec playwright test tests/e2e/production-ui-operations.spec.ts --update-snapshots
  cd assets && pnpm exec playwright test tests/e2e/production-ui-operations.spec.ts
  ```

  Reject oversized marketing headings, KPI cards, hidden row actions, clipped filter controls, duplicated responsive markup, and any page-wide horizontal scroll.

- [ ] **Step 3: Run complete gates and close the ledger**

  ```bash
  cd assets && pnpm run check
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/tests/e2e docs/work/production-ui-operations.md
  git commit -m "test: verify operations production UI"
  ```

## Blocker And Fallback Rules

- Stop if any visual change requires a backend/GraphQL contract change or a shared spine edit; record the exact missing owner.
- Never merge program, per-program feed, and unmatched-feed pagination or error state.
- Never hide lifecycle note/save, ledger retry, nullable metrics, or conversion facts for mobile simplicity.
- Do not replace operator terms with vague consumer language, but remove implementation terms that do not help an operator act.
