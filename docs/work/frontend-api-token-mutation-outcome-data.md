# Frontend API-Token Mutation Outcome Data

## Snapshot

- Status: active
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 64 passing
  API-token route-data and route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## API-Token Mutation Outcome Data Contract

- Status: active on 2026-07-16 on
  `codex/category-alert-recommendation-contracts`.
- Next action: isolate exact revoke variables plus structural create/rotate
  credential and revoke completion outcomes in the existing framework-free
  route-data module while retaining FormData, Relay commits, concurrency and
  pending guards, one-time-secret lifecycle, state transitions, dialogs,
  row-scoped errors, callbacks, markup, and styling in `ApiTokensRoute`.
- Candidate evidence: current source inspection found the same credential
  success checks duplicated across create and rotate plus adjacent revoke
  completion policy embedded in `ApiTokensRoute`; the existing route-data
  owner already projects mutation tokens and builds create/rotate variables,
  and its focused suites pass 64 tests.
- Blockers: none.

## Boundaries

- Reuse `summarizeMutationApiToken`, `hasRouteGraphQLErrors`, and
  `routeMutationErrorMessage`; do not create a parallel mutation abstraction.
- Preserve truthy one-time plaintext semantics and top-level GraphQL-error
  precedence without structurally revalidating generated token fields.
- Preserve current successful-payload behavior when payload errors coexist
  with complete facts and no top-level GraphQL errors.
- Leave all mutation callbacks, pending maps and sets, one-time-secret state,
  optimistic collection updates, dialogs, feedback placement, and presentation
  in `ApiTokensRoute`.

## Verification

- `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure route-data module
- `git diff --check`
