# Frontend Radix UI Polish Work Doc

## Snapshot

- Status: complete
- Priority: P1
- Source of truth: this file
- Last verified: 2026-07-11 against `assets/src/router.tsx` and the current UI layer
- Design: `docs/superpowers/specs/2026-07-11-radix-ui-polish-design.md`
- Plan: `docs/superpowers/plans/2026-07-11-radix-ui-polish.md`
- Objective: establish a Radix-backed theme and reusable UI patterns, then
  polish every registered frontend route without changing application behavior.

## Batch 1: Radix Theme And Shared UI Foundation

Status: done
Owned paths:

- `assets/package.json`
- `assets/bun.lock`
- `assets/src/ui/**`
- `assets/test/ui/**`
- `docs/work/frontend-radix-ui-polish.md`

Verification:

- `cd assets && bun x vitest run test/ui`
- `cd assets && bun run typecheck`
- `cd assets && bun run build`
- `git diff --check`

Exit condition: Radix Themes owns the interactive foundation, semantic Product
Compare tokens are available through CSS and StyleX, and shared page, feedback,
data, status, and pagination patterns have green behavior tests.

Completion evidence:

- RED: provider and primitive tests failed because the application did not
  render a Radix Theme and the shared button did not use Radix Themes.
- RED: shared-pattern coverage failed because the page, feedback, data-list,
  pagination, status, section-heading, and collapsible modules did not exist.
- GREEN: `cd assets && bun x vitest run test/ui` passed 4 files and 13 tests.
- GREEN: `cd assets && bun run typecheck` exited 0.
- GREEN: `cd assets && bun run build` completed both client and SSR builds.

## Batch 2: Shared Application Shell And Home

Status: done
Owned paths:

- `assets/src/ui/components/layout/app-shell.tsx`
- `assets/src/routes/root.tsx`
- `assets/test/ui/app-shell.test.tsx`
- `assets/test/routes/root.route.test.tsx`
- `docs/work/frontend-radix-ui-polish.md`

Verification:

- `cd assets && bun x vitest run test/ui/app-shell.test.tsx test/routes/root.route.test.tsx`
- `cd assets && bun run typecheck`
- `cd assets && bun run build`
- `git diff --check`

Exit condition: the responsive shell exposes exact active navigation and the
home route presents three clear shopper paths while preserving viewer-aware
destinations.

Completion evidence:

- RED: focused shell and root tests failed because the application wrapper,
  exact active root link, and named shopper-path list were absent.
- GREEN: the focused shell and root suites passed 2 files and 10 tests.
- GREEN: `cd assets && bun run typecheck` exited 0.
- GREEN: `cd assets && bun run build` completed both client and SSR builds.

## Batch 3: Catalog Browse And Product Detail

Status: done
Owned paths:

- `assets/src/routes/catalog/browse.tsx`
- `assets/src/routes/catalog/filter-form.tsx`
- `assets/src/routes/products/detail.tsx`
- `assets/src/routes/products/product-attribute-list.tsx`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `assets/test/routes/products/detail.route.test.tsx`
- `docs/work/frontend-radix-ui-polish.md`

Verification:

- `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx`
- `cd assets && bun run typecheck`
- `cd assets && bun run build`
- `git diff --check`

Exit condition: catalog controls, product rows, detail specifications, decision
actions, and offer context are visibly grouped and readable without changing
filter, compare-selection, or pagination behavior.

Completion evidence:

- RED: focused catalog and product-detail tests failed because the labeled page,
  product list, advanced-filter disclosure, and specification/offer regions did
  not exist.
- GREEN: the focused suites passed 2 files and 104 tests.
- GREEN: `cd assets && bun run typecheck` exited 0.
- GREEN: `cd assets && bun run build` completed both client and SSR builds.

## Batch 4: Merchant And Offer Discovery

Status: done
Owned paths:

- `assets/src/routes/merchants/index.tsx`
- `assets/src/routes/offers/index.tsx`
- `assets/src/routes/offers/filters.tsx`
- `assets/src/routes/offers/tracked-commerce-click.tsx`
- `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- `assets/test/routes/offers/offer-discovery.route.test.tsx`
- `docs/work/frontend-radix-ui-polish.md`

Verification:

- `cd assets && bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- `cd assets && bun run build`
- `git diff --check`

Exit condition: merchant and offer discovery use compact divided rows, visible
status and price hierarchy, coherent summary metrics, and shared pagination
without changing safe-link, tracking, sorting, or filter behavior.

Completion evidence:

- RED: focused discovery tests failed on the absent labeled merchant and offer
  page regions, Radix-backed pagination action, and offer status badge.
- GREEN: the focused merchant and offer suites passed 2 files and 70 tests.
- GREEN: `cd assets && bun run typecheck` exited 0.
- GREEN: `cd assets && bun run build` completed both client and SSR builds.

## Batch 5: Comparison And Saved Comparisons

Status: done
Owned paths:

- `assets/src/routes/compare/compare-shell.tsx`
- `assets/src/routes/compare/index.tsx`
- `assets/src/routes/compare/product-list.tsx`
- `assets/src/routes/compare/product-picker.tsx`
- `assets/src/routes/compare/selection-tray.tsx`
- `assets/src/routes/compare/decision-summary.tsx`
- `assets/src/routes/compare/saved.tsx`
- `assets/src/routes/compare/error-boundary.tsx`
- `assets/test/routes/compare/compare.route.test.tsx`
- `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- `docs/work/frontend-radix-ui-polish.md`

Verification:

- `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/compare/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run typecheck`
- `cd assets && bun run build`
- `git diff --check`

Exit condition: comparison mode navigation uses accessible Radix tabs, the
comparison matrix remains a readable table in a horizontal scroll region, and
the selection tray and saved-set rows expose clear context and scoped actions.

Completion evidence:

- RED: focused comparison tests failed on absent tab semantics, the absent
  named horizontal matrix workspace, and a native saved-set action button.
- GREEN: the focused comparison and saved-set suites passed 2 files and 126
  tests.
- GREEN: `cd assets && bun run typecheck` exited 0.
- GREEN: `cd assets && bun run build` completed both client and SSR builds.

## Batch 6: Operational Routes

Status: done
Owned paths:

- `assets/src/routes/affiliate/setup/index.tsx`
- `assets/src/routes/commerce/revenue/index.tsx`
- `assets/src/routes/ingestion/feed-candidates/index.tsx`
- `assets/src/routes/account/api-tokens/index.tsx`
- `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `docs/work/frontend-radix-ui-polish.md`

Verification:

- `cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup.route.test.tsx test/routes/commerce/revenue/revenue-summary.route.test.tsx test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `cd assets && bun run typecheck`
- `cd assets && bun run build`
- `git diff --check`

Exit condition: affiliate setup, revenue, feed-candidate review, and API-token
workspaces use readable control bands, explicit status hierarchy, structured
records, and scoped Radix actions without changing operational behavior.

Completion evidence:

- RED: all four focused operational suites failed on absent labeled page
  regions while their existing behavior assertions remained green.
- GREEN: the focused operational suites passed 4 files and 84 tests.
- GREEN: `cd assets && bun run typecheck` exited 0.
- GREEN: `cd assets && bun run build` completed both client and SSR builds.

## Batch 7: Authentication Routes

Status: done
Owned paths:

- `assets/src/routes/auth/form-shell.tsx`
- `assets/src/routes/auth/login.tsx`
- `assets/src/routes/auth/logout.tsx`
- `assets/src/routes/auth/register.tsx`
- `assets/src/routes/auth/forgot-password.tsx`
- `assets/src/routes/auth/reset-password.tsx`
- `assets/src/routes/auth/verify-email.tsx`
- `assets/test/routes/auth/form-shell.test.tsx`
- `assets/test/routes/auth/session.route.test.tsx`
- `assets/test/routes/auth/recovery.route.test.tsx`
- `docs/work/frontend-radix-ui-polish.md`

Verification:

- `cd assets && bun x vitest run test/routes/auth/form-shell.test.tsx test/routes/auth/session.route.test.tsx test/routes/auth/recovery.route.test.tsx`
- `cd assets && bun run typecheck`
- `cd assets && bun run build`
- `git diff --check`

Exit condition: every authentication route uses one narrow Radix-backed form
composition with consistent fields, actions, feedback, and recovery links
while preserving all session and recovery behavior.

Completion evidence:

- RED: the shared auth-shell test failed because fields were native inputs,
  feedback was custom markup, and the shell had no labeled page region.
- GREEN: the focused auth suites passed 3 files and 30 tests.
- GREEN: `cd assets && bun run typecheck` exited 0.
- GREEN: `cd assets && bun run build` completed both client and SSR builds.

## Batch 8: Full Verification And Closeout

Status: done
Owned paths:

- `docs/work/frontend-radix-ui-polish.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

Verification:

- `cd assets && bun run test:unit`
- `cd assets && bun run relay`
- `cd assets && bun run typecheck`
- `cd assets && bun run build`
- `mix work_queue.validate`
- `git diff --check`

Exit condition: the complete frontend suite, generated contracts, types,
client/SSR builds, and work queue are green; the lane is closed with the three
unrelated ready rows preserved.

Completion evidence:

- `cd assets && bun run relay` compiled 30 reader documents, 29 normalization
  documents, and 29 operation texts with no generated diff.
- `cd assets && bun run test:unit` passed 46 files and 628 tests.
- `cd assets && bun run typecheck` exited 0.
- `cd assets && bun run build` completed client and SSR production builds; the
  existing large-chunk advisory remains non-blocking.
- `mix work_queue.validate` reported `work queue valid: 3 ready rows`.
- `git diff --check` exited 0.

## Review Follow-up

Status: done

Independent review found no critical issues and identified five important
follow-ups. The implementation now:

- routes ordinary text, search, URL, and decimal fields through one reusable
  Radix Themes `TextField` primitive while retaining native controls where
  date, number, select, checkbox, radio, hidden-input, or FormData behavior is
  materially useful;
- renders a real Radix tab panel for every compare specification tab;
- collapses shared data-list action columns below 40rem;
- uses neutral page framing for shared route errors; and
- applies exact, visibly styled active navigation so saved comparisons no
  longer also marks the compare destination active.

Review verification:

- RED: four focused suites reported the missing text-field primitive, tab
  panels, neutral error framing, responsive data-list hooks, and exact active
  navigation.
- GREEN: the same focused suites passed 4 files and 120 tests.
- GREEN: all impacted route suites passed 10 files and 236 tests.
- GREEN: `cd assets && bun run relay` compiled 30 reader documents, 29
  normalization documents, and 29 operation texts with no generated diff.
- GREEN: `cd assets && bun run test:unit` passed 46 files and 630 tests.
- GREEN: `cd assets && bun run typecheck` exited 0.
- GREEN: `cd assets && bun run build` completed client and SSR production
  builds; the existing large-chunk advisory remains non-blocking.
- GREEN: `mix work_queue.validate` reported `work queue valid: 3 ready rows`.
- GREEN: `git diff --check` exited 0.

### Automated Review Follow-up

Status: done

The PR review sweep included unresolved, duplicate, and outside-diff bot
findings. The follow-up now:

- uses named StyleX and Radix Tabs imports throughout the polished UI surface;
- keeps product attribute styles and theme imports ahead of component use;
- uses a Radix Themes horizontal `ScrollArea` for the comparison matrix instead
  of a focusable section with redundant landmark attributes;
- exposes compared-product actions as named navigation landmarks;
- preserves loader-backed URL navigation when comparison tabs are clicked;
- removes unused router imports and reduces the catalog filter JSX depth; and
- fixes all outside-diff Markdown list-spacing annotations in the implementation
  plan.

Automated review verification:

- RED: focused comparison tests exposed the missing Radix scroll viewport and
  named product-action landmarks.
- GREEN: the focused comparison tests passed 3 tests, including a regression
  test proving tab clicks update loader-backed URL state.
- GREEN: `cd assets && bun run test:unit` passed 46 files and 632 tests.
- GREEN: `cd assets && bun run relay` compiled 30 reader documents, 29
  normalization documents, and 29 operation texts with no generated diff.
- GREEN: `cd assets && bun run typecheck` exited 0.
- GREEN: `cd assets && bun run build` completed client and SSR production
  builds; the existing large-chunk advisory remains non-blocking.
- GREEN: `mix work_queue.validate` reported `work queue valid: 3 ready rows`.
- GREEN: `git diff --check` exited 0.

## Dependent Batches

1. Shared application shell and home.
2. Catalog browse and product detail.
3. Merchant and offer discovery.
4. Comparison and saved comparisons.
5. Operational routes.
6. Authentication routes.

All dependent batches completed serially with green completion evidence. The
three unrelated ready rows in `docs/work/index.md` remained available
throughout execution.

## Baseline Evidence

- `cd assets && bun run test:unit` passed 45 files and 618 tests before UI
  implementation began.
