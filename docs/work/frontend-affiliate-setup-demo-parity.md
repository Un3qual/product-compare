# Frontend Affiliate Setup Demo Parity

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, Task 4 navigation and lane closure
- Implementation plan: `docs/plans/2026-06-01-frontend-affiliate-setup-demo-parity-implementation-plan.md`
- Current implementation plan: `docs/plans/2026-06-27-project-affiliate-setup-merchant-context-implementation-plan.md`
- Objective: make the existing authenticated affiliate setup GraphQL contract demoable from the browser UI without adding REST endpoints.

## Batch Status

- [x] Task 1: add the Relay route query and loader for `/affiliate/setup`.
- [x] Task 2: render affiliate network and program setup.
- [x] Task 3: add affiliate link and coupon setup.
- [x] Task 4: wire navigation, verify the backend contract, and close the lane.

## Current Cross-Project Batch

- Status: ready.
- Plan: `docs/plans/2026-06-27-project-affiliate-setup-merchant-context-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/affiliate/setup/index.tsx`
  - `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
  - `docs/work/frontend-affiliate-setup-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/affiliate/setup` keeps selected merchant context visible across program, link, and coupon forms.

## Verification

- Plan creation verified the existing backend contract by reading `ARCHITECTURE.md`, `docs/plans/INDEX.md`, `lib/product_compare_web/schema.ex`, `lib/product_compare_web/resolvers/affiliate_resolver.ex`, `lib/product_compare/affiliate.ex`, `test/product_compare_web/graphql/affiliate_workflows_test.exs`, and the local `assets/schema.graphql` snapshot.
- The local frontend schema snapshot currently has no affiliate mutation fields; Task 2 and Task 3 will refresh only the snapshot fields required by the new Relay mutation documents.
- Task 1 scope was corrected from admin wording to authenticated affiliate setup after subagent review found no backend admin role model in the current contract.
- Task 1 verified the initial loader RED before route naming was corrected, failing because `../loader` did not exist.
- Task 1 corrected-route RED verified with `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts` failing because `AffiliateSetupRouteQuery.graphql.ts` had not been generated yet.
- Task 1 spec-review correction switched merchant choice pagination to the plan's `first` and `after` search params and verified `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts`.
- Task 1 GREEN verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts`, and `cd assets && bun run typecheck`.
- Task 2 verified RED with `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx` failing because `../index` did not exist.
- Task 2 refreshed `assets/schema.graphql` with the existing affiliate network/program mutation contract and generated `UpsertAffiliateNetworkMutation.graphql.ts` plus `UpsertAffiliateProgramMutation.graphql.ts`.
- Task 2 GREEN verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts`, and `cd assets && bun run typecheck`.
- Task 3 verified RED with `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx` failing because the link and coupon controls were absent.
- Task 3 refreshed `assets/schema.graphql` with the existing affiliate link/coupon mutation contract and generated `UpsertAffiliateLinkMutation.graphql.ts` plus `CreateCouponMutation.graphql.ts`.
- Task 3 GREEN verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts`, and `cd assets && bun run typecheck`.
- Task 4 verified RED with `cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx` failing because `/affiliate/setup` route registration and `Affiliate setup` links were absent.
- Task 4 focused frontend verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx`, and `cd assets && bun run typecheck`.
- Task 4 backend contract verification passed with `mix test test/product_compare_web/graphql/affiliate_workflows_test.exs`.
- Task 4 final verification passed with `cd assets && bun run check` and `git diff --check`.

## Blockers

- None.
