# Frontend Merchant Discovery Demo Parity

## Snapshot

- Status: ready (merchant directory view extraction)
- Priority: P1
- Source of truth: this file
- Last verified: 2026-07-12 after follow-up validation (23 merchant tests;
  93 tests across the promoted cohort)
- Implementation plan: `docs/plans/2026-06-01-frontend-merchant-discovery-demo-parity-implementation-plan.md`
- Recently completed implementation plan: `docs/plans/2026-06-27-project-merchant-directory-page-size-implementation-plan.md`
- Objective: make the existing public merchant discovery GraphQL contract demoable from the browser UI without adding REST endpoints.

## Merchant Directory View Extraction

- Status: ready on 2026-07-12.
- Plan: `docs/superpowers/plans/2026-07-12-next-stack-follow-up-batches.md`.
- Next action: extract page-size controls, visible-page filtering, list and safe
  website presentation, empty states, and pagination while preserving route-
  owned Relay reads, normalization, URL safety, and path construction.
- Owned paths:
  - `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
  - `assets/src/routes/merchants/MerchantDirectoryView.tsx`
  - `assets/test/routes/merchants/merchant-directory.route.test.tsx`
  - `docs/work/frontend-merchant-discovery-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: merchant presentation is isolated without changing query,
  filtering, link safety, empty/error, page-size, cursor, or pagination behavior.

## Completed Visible-Page Name Filter

- Status: done on 2026-07-11.
- The directory now filters merchant names case-insensitively over the current
  Relay page only and labels that scope explicitly.
- Empty local matches retain First/Next cursor navigation, and clearing the
  field restores the current page without a network request.
- RED: the focused route case failed because the visible-page search field was absent.
- GREEN:
  - `cd assets && bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx -t "filters visible-page names"` - 1 passed.
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/merchants/merchant-directory.route.test.tsx` - 124 passed.
  - `cd assets && bun run typecheck` - exited 0.

## Batch Status

- [x] Task 1: add the Relay route query and loader for `/merchants`.
- [x] Task 2: render the merchant discovery route.
- [x] Task 3: wire navigation and close the lane.

## Current Cross-Project Batch

- Status: done.
- Plan: `docs/plans/2026-06-27-project-merchant-directory-page-size-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
  - `assets/src/routes/merchants/pagination.ts`
  - `assets/test/routes/merchants/merchant-directory-loader.test.ts`
  - `assets/test/routes/merchants/merchant-directory.route.test.tsx`
  - `docs/work/frontend-merchant-discovery-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/merchants/merchant-directory-loader.test.ts test/routes/merchants/merchant-directory.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/merchants` lets users choose bounded page sizes while preserving cursor pagination.
- Merchant page-size parity task updates:
  - [x] Added loader tests for supported, blank, malformed, and oversized `first` values.
  - [x] Added route test coverage for page-size selector and pagination links preserving `first`.
  - [x] Added page-size selector form and preserved `first` in Next/First merchant links.
- Verification (this batch):
  - `cd assets && bun x vitest run test/routes/merchants/merchant-directory-loader.test.ts test/routes/merchants/merchant-directory.route.test.tsx` - 12 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Completed Product-Facing Batch

- Status: done.
- Plan:
  `docs/plans/2026-07-02-merchant-directory-website-links-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
  - `assets/test/routes/merchants/merchant-directory.route.test.tsx`
  - `docs/work/frontend-merchant-discovery-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/merchants` renders safe external website links from current
  merchant data and leaves unsafe domains as non-link text.

### Merchant Directory Website Links Evidence

- Added route coverage for domain-only website link normalization, already
  absolute HTTPS links, and non-HTTP merchant domains remaining text only.
- RED verification:
  `cd assets && bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx`
  failed as expected with 2 missing-link failures and 8 passing tests.
- GREEN verification:
  `cd assets && bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx`
  passed with 10 tests and 0 failures.
- Typecheck:
  `cd assets && bun run typecheck` completed with exit 0 in the final
  integrated batch.
- Diff hygiene: `git diff --check` passed with exit 0.

## Verification

- Plan creation verified the existing backend contract by reading `ARCHITECTURE.md`, `docs/plans/INDEX.md`, `lib/product_compare_web/schema.ex`, `lib/product_compare_web/resolvers/pricing_resolver.ex`, and the local `assets/schema.graphql` merchant types.
- Task 1 restored missing frontend dependencies with `cd assets && bun install`, then verified RED with `cd assets && bun x vitest run src/routes/merchants/__tests__/merchant-directory-loader.test.ts` failing because `../loader` did not exist.
- Task 1 found the local schema snapshot was also missing `MerchantConnection` and `MerchantEdge`; after adding those types plus `Query.merchants(first:, after:)`, `cd assets && bun run relay` passed and generated `assets/src/__generated__/MerchantDirectoryRouteQuery.graphql.ts`.
- Task 1 GREEN verification passed with `cd assets && bun x vitest run src/routes/merchants/__tests__/merchant-directory-loader.test.ts` and `cd assets && bun run typecheck`.
- Task 2 verified RED with `cd assets && bun x vitest run src/routes/merchants/__tests__/merchant-directory.route.test.tsx` failing because `../index` did not exist.
- Task 2 GREEN verification passed with `cd assets && bun x vitest run src/routes/merchants/__tests__/merchant-directory.route.test.tsx src/routes/merchants/__tests__/merchant-directory-loader.test.ts` and `cd assets && bun run typecheck`.
- Task 3 verified RED with `cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx` failing because `/merchants` route registration and `Merchants` links were absent.
- Task 3 focused frontend verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/merchants/__tests__/merchant-directory-loader.test.ts src/routes/merchants/__tests__/merchant-directory.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx`, and `cd assets && bun run typecheck`.
- Task 3 backend contract verification initially needed environment setup; after `mix deps.get` and `docker compose up -d db`, `mix test test/product_compare_web/graphql/catalog_queries_test.exs` passed.
- Task 3 final verification passed with `cd assets && bun run check`, `mix test test/product_compare_web/graphql/catalog_queries_test.exs`, and `git diff --check`.

## Blockers

- None.
