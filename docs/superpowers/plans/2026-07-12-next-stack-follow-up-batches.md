# Next Stack Follow-Up Batches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` or `superpowers:executing-plans` to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Complete one missing pagination path and three focused frontend
responsibility extractions as the second half of the eight-PR stack.

**Architecture:** Route owners keep Relay, mutation, URL, loader, and session
orchestration. New presentation siblings receive explicit typed contracts, and
the saved-comparison extraction is a pure state module with no framework
dependencies.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript, StyleX, Radix UI,
Vitest.

## Global Constraints

- Preserve GraphQL, Phoenix session, mutation, URL, cursor, filter, sort, and
  accessible behavior exactly except for the explicitly added affiliate
  merchant pagination links.
- Do not move Relay hooks, mutation commits, viewer-cache updates, navigation,
  URL construction, or loader ownership into presentation components.
- Do not add barrels, generic form frameworks, render-prop APIs, memoization for
  simple values, or wrapper-only components.
- Keep tests semantic and accessible; pure state tests should use production
  types and exact returned values rather than source-string assertions.

---

### Task 1: Affiliate Setup Merchant Pagination

**Files:**

- Create: `assets/src/routes/affiliate/setup/pagination.ts`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Test: `assets/test/routes/affiliate/setup/affiliate-setup-loader.test.ts`
- Test: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- Modify: `docs/work/frontend-affiliate-setup-demo-parity.md`

**Interface:** `affiliateSetupPagePath(pagination)` serializes normalized
`AffiliateSetupMerchantPagination` to `/affiliate/setup`. The route passes
loader-owned pagination into the Relay panel, derives first and next hrefs from
the loaded merchant connection, and renders the shared `Pagination`. Relay
reads, merchant selection, and all four mutation lifecycles remain unchanged.

- [ ] Add route assertions for next and first merchant-choice links, retained
  `first`, encoded `after`, and absence when `pageInfo` has no destination;
  verify RED because the navigation is missing.
- [ ] Add the local path helper and thread normalized pagination through the
  existing route and panel.
- [ ] Render pagination only from truthful `pageInfo` and cursor state without
  changing merchant choice or mutation behavior.
- [ ] Run both focused affiliate suites, TypeScript, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

---

### Task 2: Merchant Directory View Extraction

**Files:**

- Create: `assets/src/routes/merchants/MerchantDirectoryView.tsx`
- Modify: `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
- Test: `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- Modify: `docs/work/frontend-merchant-discovery-demo-parity.md`

**Interface:** `MerchantDirectoryView` receives typed merchant view models,
normalized pagination values, and prebuilt first/next hrefs. It owns page-size
controls, visible-page filter state, result guidance, safe website actions,
empty/no-match states, and pagination. The route retains loader/query reads,
suspense/error boundaries, connection normalization, safe external URL
resolution, and route path construction.

- [ ] Add direct view assertions for page-size controls, case-insensitive local
  filtering, no match, safe links, empty data, and pagination; verify RED.
- [ ] Build typed view models and hrefs in the route, then move only
  presentation and local filter state to the sibling.
- [ ] Keep Relay, fallback, normalization, URL safety, and path construction in
  the route.
- [ ] Run the focused merchant suite, TypeScript, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

---

### Task 3: Saved Comparison View-State Extraction

**Files:**

- Create: `assets/src/routes/compare/saved-view-state.ts`
- Modify: `assets/src/routes/compare/SavedComparisonsRoute.tsx`
- Create: `assets/test/routes/compare/saved-comparisons-view-state.test.ts`
- Test: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Modify: `docs/work/frontend-compare-saved-hardening.md`

**Interface:** `buildSavedComparisonsViewState(loaderData,
deletedSavedSetIds, filterText, sortMode)` returns the visible ordered saved
sets and exact status message. The pure module owns deleted-id hiding,
case-insensitive name/product filtering, current/name/product-count sorting,
and status precedence. The route retains React state, Relay query retainers,
mutation commits, pagination, and comparison URL construction.

- [ ] Add pure tests for unauthorized, local deletion, no-match, empty,
  name/product/slug filtering, and every sort mode; verify RED against the
  missing module.
- [ ] Move the pure state functions and only the required production types into
  `saved-view-state.ts` without React, Relay, or router imports.
- [ ] Import the state builder into the route and remove the duplicate local
  implementation.
- [ ] Run both focused saved-comparison suites, TypeScript, and
  `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

---

### Task 4: Credential Auth Form Presentation Extraction

**Files:**

- Create: `assets/src/routes/auth/CredentialAuthForm.tsx`
- Modify: `assets/src/routes/auth/LoginRoute.tsx`
- Modify: `assets/src/routes/auth/RegisterRoute.tsx`
- Test: `assets/test/routes/auth/session.route.test.tsx`
- Modify: `docs/work/frontend-auth-state-hardening.md`

**Interface:** `CredentialAuthForm` receives title, description, submit label,
password autocomplete, footer links, current mutation errors, pending state,
and `onSubmit`. It owns the shared `AuthFormShell`, email/password fields, and
submit button. Login and registration retain form-value extraction, Relay
mutations, GraphQL error resolution, viewer-cache updates, and navigation.

- [ ] Add direct form assertions for login and registration copy, field
  autocomplete, field errors, footer links, pending state, and submit callback;
  verify RED against the missing component.
- [ ] Create the explicit typed presentation component using the existing auth
  primitives; do not introduce a configurable field schema.
- [ ] Replace only duplicated markup in both routes while keeping session and
  mutation orchestration route-local.
- [ ] Run the focused session suite, TypeScript, and `git diff --check`.
- [ ] Confirm the GraphQL auth migration scope is unchanged, record lane
  evidence, and commit the milestone.

## Validation Evidence

- Fresh candidate discovery inspected current source, tests, queue state, and
  completed-plan exclusions.
- The five existing characterization files passed 93 tests together on
  2026-07-12 before promotion.
- The four tasks have non-overlapping owned source, test, and lane-doc paths.
