# Frontend Merchant Discovery Demo Parity

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, Task 3 navigation and lane closure
- Implementation plan: `docs/plans/2026-06-01-frontend-merchant-discovery-demo-parity-implementation-plan.md`
- Objective: make the existing public merchant discovery GraphQL contract demoable from the browser UI without adding REST endpoints.

## Batch Status

- [x] Task 1: add the Relay route query and loader for `/merchants`.
- [x] Task 2: render the merchant discovery route.
- [x] Task 3: wire navigation and close the lane.

## Current Batch

- Task: none queued.
- Status: completed.
- Owned paths:
  - `assets/src/router.tsx`
  - `assets/src/routes/root.tsx`
  - `assets/src/routes/__tests__/root.route.test.tsx`
  - `assets/src/__tests__/router.test.tsx`
  - `assets/src/routes/merchants/**`
  - `docs/work/frontend-merchant-discovery-demo-parity.md`
  - `docs/work/index.md`
  - `docs/plans/2026-06-01-frontend-merchant-discovery-demo-parity-implementation-plan.md`
  - `docs/plans/NOW.md`
  - `docs/plans/INDEX.md`
  - `ARCHITECTURE.md`
- Next step: no unblocked merchant discovery demo parity batch remains in this lane; coordinator follow-up can choose the next demo-parity candidate from `docs/plans/INDEX.md` if priorities continue toward affiliate/admin setup.

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
