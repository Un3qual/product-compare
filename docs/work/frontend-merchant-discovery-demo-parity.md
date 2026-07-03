# Frontend Merchant Discovery Demo Parity

## Snapshot

- Status: done
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-27, merchant page-size control parity
- Implementation plan: `docs/plans/2026-06-01-frontend-merchant-discovery-demo-parity-implementation-plan.md`
- Recently completed implementation plan: `docs/plans/2026-06-27-project-merchant-directory-page-size-implementation-plan.md`
- Objective: make the existing public merchant discovery GraphQL contract demoable from the browser UI without adding REST endpoints.

## Batch Status

- [x] Task 1: add the Relay route query and loader for `/merchants`.
- [x] Task 2: render the merchant discovery route.
- [x] Task 3: wire navigation and close the lane.

## Current Cross-Project Batch

- Status: done.
- Plan: `docs/plans/2026-06-27-project-merchant-directory-page-size-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/merchants/index.tsx`
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
  - `assets/src/routes/merchants/index.tsx`
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
