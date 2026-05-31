# Frontend API Token Management Demo Parity

## Snapshot

- Status: in progress
- Priority: P1
- Source of truth: this file
- Last verified: 2026-05-31 during plan creation; implementation not started.
- Implementation plan: `docs/plans/2026-05-31-frontend-api-token-management-demo-parity-implementation-plan.md`
- Objective: make the existing GraphQL API-token lifecycle demoable from the browser UI without adding REST endpoints.

## Batch Status

- [ ] Task 1: add the Relay route query and loader for `/account/api-tokens`.
- [ ] Task 2: render the API-token management route.
- [ ] Task 3: add the create-token flow with one-time token display.
- [ ] Task 4: add the revoke-token flow.
- [ ] Task 5: add the rotate-token flow.
- [ ] Task 6: wire navigation and close the lane.

## Current Batch

- Task: Task 1, add the Relay route query and loader for `/account/api-tokens`.
- Status: ready.
- Owned paths:
  - `assets/src/routes/account/api-tokens/**`
  - `assets/src/__generated__/**`
  - `docs/work/frontend-api-token-management-demo-parity.md`
  - `docs/plans/2026-05-31-frontend-api-token-management-demo-parity-implementation-plan.md`
- Immediate prerequisite: GraphQL already exposes `myApiTokens`, `createApiToken`, `revokeApiToken`, and `rotateApiToken`; Task 1 should verify the schema/query names before adding frontend route data.

## Verification

- Plan creation verified the existing backend contract by reading `lib/product_compare_web/schema.ex` and `test/product_compare_web/graphql/api_token_auth_test.exs`.

## Blockers

- None for Task 1.
