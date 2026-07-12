# Frontend API Token Management Demo Parity

## Snapshot

- Status: ready (API token control presentation extraction)
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-27 after Task 7 expiry preset verification.
- Implementation plan: `docs/plans/2026-05-31-frontend-api-token-management-demo-parity-implementation-plan.md`
- Recently completed implementation plan: `docs/plans/2026-06-27-project-api-token-expiry-presets-implementation-plan.md`
- Objective: make the existing GraphQL API-token lifecycle demoable from the browser UI without adding REST endpoints.

## Ready Next Batch

- Status: ready.
- Plan: `docs/superpowers/plans/2026-07-11-next-control-and-matrix-batches.md`.
- Next action: Extract status filters, create dialog/form/presets, create-error
  presentation, and one-time secret disclosure while preserving route-owned
  mutation and token lifecycle state.
- Owned paths:
  - `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
  - `assets/src/routes/account/api-tokens/ApiTokenControls.tsx`
  - `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
  - `docs/work/frontend-api-token-management-demo-parity.md`
- Prerequisite: the existing API-token route suite is green and remains the
  characterization contract.
- Verification:
  - `cd assets && bun x vitest run test/routes/account/api-tokens/api-tokens.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: creation/control presentation is isolated while mutation,
  secret lifecycle, status filtering, rotation/revocation, and pagination stay
  green.

## Batch Status

- [x] Task 1: add the Relay route query and loader for `/account/api-tokens`.
- [x] Task 2: render the API-token management route.
- [x] Task 3: add the create-token flow with one-time token display.
- [x] Task 4: add the revoke-token flow.
- [x] Task 5: add the rotate-token flow.
- [x] Task 6: wire navigation and close the lane.
- [x] Task 7: add expiry preset controls for create and rotate token forms.

## Completed Scope

- Task 6 completed on 2026-06-01:
  - Added `API tokens` links to the primary navigation and home actions.
  - Kept the route entry point at `/account/api-tokens`.
  - Verified the route remains backed by the existing GraphQL API-token contract without adding browser REST endpoints.

## Current Cross-Project Batch

- Status: done.
- Plan: `docs/plans/2026-06-27-project-api-token-expiry-presets-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/account/api-tokens/index.tsx`
  - `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
  - `docs/work/frontend-api-token-management-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/account/api-tokens/api-tokens.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/account/api-tokens` offers create and rotate expiration presets without changing mutation contracts.
- Task 7 RED: `cd assets && bun x vitest run test/routes/account/api-tokens/api-tokens.route.test.tsx` failed while preset controls were not present.
- Task 7 GREEN:
  - `cd assets && bun x vitest run test/routes/account/api-tokens/api-tokens.route.test.tsx` - 33 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Verification

- Plan creation verified the existing backend contract by reading `lib/product_compare_web/schema.ex` and `test/product_compare_web/graphql/api_token_auth_test.exs`.
- Task 1 refreshed `assets/schema.graphql` for the `myApiTokens` query contract because Relay reads the local schema snapshot.
- Task 1 RED: `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts` failed on the missing `../loader` import after `bun install` restored local frontend dependencies.
- Task 1 GREEN:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts` - 4 tests, 0 failures.
  - `cd assets && bun run typecheck`
- Task 2 RED: `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx` failed on the missing `../index` route component import.
- Task 2 GREEN:
  - `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts` - 8 tests, 0 failures.
  - `cd assets && bun run typecheck`
- Task 3 refreshed `assets/schema.graphql` for the existing `createApiToken` mutation contract because Relay reads the local schema snapshot.
- Task 3 RED: `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx` failed on the missing create-form label.
- Task 3 GREEN:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx` - 8 tests, 0 failures.
  - `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts` - 12 tests, 0 failures.
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Task 4 refreshed `assets/schema.graphql` for the existing `revokeApiToken` mutation contract because Relay reads the local schema snapshot.
- Task 4 RED: `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx` failed on the missing revoke-token button.
- Task 4 GREEN:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx` - 12 tests, 0 failures.
  - `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts` - 16 tests, 0 failures.
  - `cd assets && bun run typecheck`
- Task 5 refreshed `assets/schema.graphql` for the existing `rotateApiToken` mutation contract because Relay reads the local schema snapshot.
- Task 5 RED: `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx` failed on missing rotate-token controls while the prior 12 tests passed.
- Task 5 GREEN:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx` - 16 tests, 0 failures.
  - `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts` - 20 tests, 0 failures.
  - `cd assets && bun run typecheck`
- Task 6 RED:
  - `cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx` failed on missing `API tokens` links in both primary navigation and home actions.
- Task 6 GREEN:
  - `cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx` - 2 tests, 0 failures.
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx src/routes/__tests__/root.route.test.tsx` - 32 tests, 0 failures.
  - `cd assets && bun run typecheck`
  - `cd assets && bun run check` - 28 files, 243 tests, 0 failures.
  - `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare/accounts/api_token_test.exs` - 26 tests, 0 failures.

## Blockers

- None for this completed lane.

## 2026-07-11 Route Decomposition

- Status: done.
- Extracted Relay page rendering, token details, lifecycle controls, and their
  presentation helpers into `ApiTokenList.tsx` while keeping loader data,
  mutation orchestration, optimistic local summaries, and dialogs in the route
  owner.
- `ApiTokensRoute.tsx` decreased from 1,144 lines to 703 lines.
- Characterization verification:
  - Before extraction: 35 API-token route tests passed.
  - After extraction: 35 API-token route tests passed.
  - `cd assets && bun run typecheck` completed with exit 0.
  - `git diff --check` completed with exit 0.
