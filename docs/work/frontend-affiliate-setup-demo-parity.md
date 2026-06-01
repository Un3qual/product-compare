# Frontend Affiliate Setup Demo Parity

## Snapshot

- Status: in progress
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, Task 2 network and program setup
- Implementation plan: `docs/plans/2026-06-01-frontend-affiliate-setup-demo-parity-implementation-plan.md`
- Objective: make the existing authenticated affiliate setup GraphQL contract demoable from the browser UI without adding REST endpoints.

## Batch Status

- [x] Task 1: add the Relay route query and loader for `/affiliate/setup`.
- [x] Task 2: render affiliate network and program setup.
- [ ] Task 3: add affiliate link and coupon setup.
- [ ] Task 4: wire navigation, verify the backend contract, and close the lane.

## Current Batch

- Task: Task 3, add affiliate link and coupon setup.
- Status: pending.
- Owned paths:
  - `assets/src/router.tsx`
  - `assets/src/routes/root.tsx`
  - `assets/src/routes/__tests__/root.route.test.tsx`
  - `assets/src/__tests__/router.test.tsx`
  - `assets/src/routes/affiliate/setup/**`
  - `assets/schema.graphql`
  - `assets/src/__generated__/**`
  - `docs/work/frontend-affiliate-setup-demo-parity.md`
  - `docs/work/index.md`
  - `docs/plans/2026-06-01-frontend-affiliate-setup-demo-parity-implementation-plan.md`
  - `docs/plans/NOW.md`
  - `docs/plans/INDEX.md`
  - `ARCHITECTURE.md`
- Next step: refresh the local schema snapshot for the affiliate link and coupon mutation fields, verify RED for the expanded route tests, then add link and coupon setup forms.

## Verification

- Plan creation verified the existing backend contract by reading `ARCHITECTURE.md`, `docs/plans/INDEX.md`, `lib/product_compare_web/schema.ex`, `lib/product_compare_web/resolvers/affiliate_resolver.ex`, `lib/product_compare/affiliate.ex`, `test/product_compare_web/graphql/affiliate_workflows_test.exs`, and the local `assets/schema.graphql` snapshot.
- The local frontend schema snapshot currently has no affiliate mutation fields; Task 2 and Task 3 will refresh only the snapshot fields required by the new Relay mutation documents.
- Task 1 scope was corrected from admin wording to authenticated affiliate setup after subagent review found no backend admin role model in the current contract.
- Task 1 verified RED with `cd assets && bun x vitest run src/routes/admin/affiliate/__tests__/affiliate-admin-loader.test.ts` failing because `../loader` did not exist before the route path was corrected to `/affiliate/setup`.
- Task 1 corrected-route RED verified with `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts` failing because `AffiliateSetupRouteQuery.graphql.ts` had not been generated yet.
- Task 1 spec-review correction switched merchant choice pagination to the plan's `first` and `after` search params and verified `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts`.
- Task 1 GREEN verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts`, and `cd assets && bun run typecheck`.
- Task 2 verified RED with `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx` failing because `../index` did not exist.
- Task 2 refreshed `assets/schema.graphql` with the existing affiliate network/program mutation contract and generated `UpsertAffiliateNetworkMutation.graphql.ts` plus `UpsertAffiliateProgramMutation.graphql.ts`.
- Task 2 GREEN verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/affiliate/setup/__tests__/affiliate-setup.route.test.tsx src/routes/affiliate/setup/__tests__/affiliate-setup-loader.test.ts`, and `cd assets && bun run typecheck`.

## Blockers

- None.
