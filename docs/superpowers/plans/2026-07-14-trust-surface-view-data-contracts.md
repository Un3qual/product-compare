# Trust Surface View-Data Contracts Implementation Plan

**Goal:** Keep the recently completed trust and discovery frontend surfaces
maintainable by moving deterministic view-data policy behind small,
framework-free contracts without changing shopper behavior.

**Architecture:** Each task extracts only pure input normalization, label,
grouping, merge, or view-state derivation. React components retain Relay reads,
mutations, Suspense and error boundaries, local interaction state, URL
construction, and semantic presentation.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript 5.8, Vitest, Bun,
StyleX.

## Global Constraints

- Follow test-driven development and watch every new pure-contract test fail
  before creating its implementation module.
- Keep the new data modules free of React, Relay, router, StyleX, and Radix
  imports.
- Preserve exact mutation variables, paging order, deduplication, status copy,
  and unavailable/error behavior.
- Keep tests behavioral; do not add source-string assertions.
- Do not use browser tools.
- Update the owned lane doc and commit code, tests, and evidence together at
  each milestone.

---

### Task 1: Share Comparison Snapshot Data Contract

**Files:**

- Create: `assets/src/routes/compare/share-comparison-data.ts`
- Modify: `assets/src/routes/compare/ShareComparisonControl.tsx`
- Create: `assets/test/routes/compare/share-comparison-data.test.ts`
- Test: `assets/test/routes/compare/comparison-snapshots.test.tsx`
- Modify: `docs/work/frontend-product-comparison-demo-parity.md`

**Interface:** Framework-free helpers derive publish variables from ordered
product IDs, recommendation profile, title, and search opt-in; normalize
snapshot labels; and merge local, loaded, and current-page snapshots by first
occurrence. `ShareComparisonControl` retains Relay mutations and reads, form
events, open state, paging state, feedback, links, and revoke actions.

- [ ] Add pure tests for ordered product IDs, profile mapping, trimmed and
  omitted titles, search opt-in, first-occurrence deduplication, revoked-ID
  removal, and fallback labels; verify RED.
- [ ] Move only the cohesive deterministic publish and collection policy into
  the data module.
- [ ] Run the pure and existing snapshot suites, TypeScript, the framework-
  import scan, and `git diff --check`.
- [ ] Record completion evidence and commit the milestone.

---

### Task 2: Product Community Data Contract

**Files:**

- Create: `assets/src/routes/products/product-community-data.ts`
- Modify: `assets/src/routes/products/ProductCommunityPanel.tsx`
- Create: `assets/test/routes/products/product-community-data.test.ts`
- Test: `assets/test/routes/products/product-community-panel.test.tsx`
- Modify: `docs/work/frontend-product-detail.md`

**Interface:** Framework-free helpers derive review and question inputs,
published-review summary copy, accepted-answer metadata, page cursors, and
first-occurrence item merges. `ProductCommunityPanel` retains Relay reads and
mutations, paging state, moderation feedback, forms, suspense, and semantic
review/Q&A presentation.

- [ ] Add pure tests for trimmed optional fields, rating values, empty review
  summaries, singular/plural copy, accepted answers, missing cursors, and
  duplicate page items; verify RED.
- [ ] Extract only deterministic community policy without widening moderation
  or authentication behavior.
- [ ] Run the pure and existing community suites, TypeScript, the framework-
  import scan, and `git diff --check`.
- [ ] Record completion evidence and commit the milestone.

---

### Task 3: Price Alert View-Data Contract

**Files:**

- Create: `assets/src/routes/account/alerts/alerts-view-data.ts`
- Modify: `assets/src/routes/account/alerts/AlertsRoute.tsx`
- Create: `assets/test/routes/account/alerts/alerts-view-data.test.ts`
- Test: `assets/test/routes/account/alerts/alerts.route.test.tsx`
- Modify: `docs/work/product-trust-and-discovery.md`

**Interface:** Framework-free `buildAlertsViewData(alerts, watches)` returns
active and paused watch groups plus display-safe rule, watch, and observation
labels. `AlertsRoute` retains loader reads, mutation orchestration, revalidation,
pending/error state, links, and list presentation.

- [ ] Add pure tests for stable watch grouping, every rule type, missing target
  and baseline values, malformed dates, and unknown rule fallback; verify RED.
- [ ] Extract only deterministic grouping and label policy.
- [ ] Run the pure and existing alert suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [ ] Record completion evidence and commit the milestone.

---

### Task 4: API Token Route Data Contract

**Files:**

- Create: `assets/src/routes/account/api-tokens/api-token-route-data.ts`
- Modify: `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- Create: `assets/test/routes/account/api-tokens/api-token-route-data.test.ts`
- Test: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Modify: `docs/work/frontend-api-token-management-demo-parity.md`

**Interface:** Framework-free helpers derive route identity, pagination paths,
create/rotate variables, mutation token summaries, rotated predecessor state,
and local/server token view state. `ApiTokensRoute` retains Relay mutations,
in-flight guards, state ownership, one-time secret lifecycle, error routing,
boundaries, and presentation.

- [ ] Add pure tests for auth/location identity, cursor paths, blank/manual/no-
  expiry values, invalid dates, rotation labels, mutation nullability,
  deduplication, and local/server precedence; verify RED.
- [ ] Extract only deterministic route-data policy and keep lifecycle effects in
  the route owner.
- [ ] Run the pure and existing API-token suites, TypeScript, the framework-
  import scan, and `git diff --check`.
- [ ] Record completion evidence and commit the milestone.

## Validation Evidence

- The snapshot, community, and alert characterization suites passed 14 tests on
  2026-07-14.
- The API-token route characterization suite passed 45 tests on 2026-07-14.
- Current source inspection found the named deterministic policies still
  embedded in their React owners; none of the four rows overlap code, test, or
  lane-doc ownership.
