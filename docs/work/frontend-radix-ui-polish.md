# Frontend Radix UI Polish Work Doc

## Snapshot

- Status: active
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

## Active Batch 5: Comparison And Saved Comparisons

Status: active
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

## Dependent Batches

1. Shared application shell and home.
2. Catalog browse and product detail.
3. Merchant and offer discovery.
4. Comparison and saved comparisons.
5. Operational routes.
6. Authentication routes.

Promote only the next batch after its dependency has green completion evidence.
Keep the three unrelated ready rows in `docs/work/index.md` available throughout
execution.

## Baseline Evidence

- `cd assets && bun run test:unit` passed 45 files and 618 tests before UI
  implementation began.
