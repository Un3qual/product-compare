# Frontend API-Token Mutation Outcome Data

## Snapshot

- Status: completed
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after the mutation-outcome extraction, 76 passing
  API-token route-data and route characterization tests, and TypeScript.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## API-Token Mutation Outcome Data Contract

- Status: completed on 2026-07-16 on
  `codex/category-alert-recommendation-contracts`.
- Completed: isolated exact revoke variables plus structural create/rotate
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

- RED: `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts`
  failed 12 new contract tests because `buildRevokeApiTokenVariables`,
  `resolveApiTokenCredentialMutationOutcome`, and
  `resolveRevokeApiTokenMutationOutcome` were not implemented.
- GREEN: `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`
  passed 76 tests across 2 files.
- `cd assets && bun run typecheck` passed (`tsc --noEmit`).
- `cd assets && if rg -n -i "react|relay|react-router|stylex|radix" src/routes/account/api-tokens/api-token-route-data.ts; then exit 1; fi`
  passed with no framework or transport dependency matches.
- `git diff --check` passed.
- Independent task review found no Critical, Important, or Minor issues and
  approved the task for completion.
