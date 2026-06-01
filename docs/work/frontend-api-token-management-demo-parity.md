# Frontend API Token Management Demo Parity

## Snapshot

- Status: in progress
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01 during Task 2 implementation.
- Implementation plan: `docs/plans/2026-05-31-frontend-api-token-management-demo-parity-implementation-plan.md`
- Objective: make the existing GraphQL API-token lifecycle demoable from the browser UI without adding REST endpoints.

## Batch Status

- [x] Task 1: add the Relay route query and loader for `/account/api-tokens`.
- [x] Task 2: render the API-token management route.
- [ ] Task 3: add the create-token flow with one-time token display.
- [ ] Task 4: add the revoke-token flow.
- [ ] Task 5: add the rotate-token flow.
- [ ] Task 6: wire navigation and close the lane.

## Current Batch

- Task: Task 3, add the create-token flow with one-time token display.
- Status: ready.
- Owned paths:
  - `assets/schema.graphql`
  - `assets/src/routes/account/api-tokens/**`
  - `assets/src/__generated__/**`
  - `docs/work/frontend-api-token-management-demo-parity.md`
  - `docs/plans/2026-05-31-frontend-api-token-management-demo-parity-implementation-plan.md`
- Immediate prerequisite: Task 2 registered `/account/api-tokens` and renders unauthorized, empty, ready, and status-filter states from `apiTokensLoader`; Task 3 should add the create-token mutation flow without adding REST endpoints.

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

## Blockers

- None for Task 3.
