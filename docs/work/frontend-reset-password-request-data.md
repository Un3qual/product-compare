# Frontend Reset-Password Request Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with 5 pure contract tests and 14 unchanged
  recovery-route tests passing, plus the complete repository gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Reset-Password Request Data Contract

- Status: done on 2026-07-16 on
  `codex/frontend-mutation-outcome-contracts`.
- Delivered `reset-password-data.ts`, a framework-free owner of token
  normalization, missing-token state and error identity, mutation variables,
  exact success copy, and current-response eligibility. `ResetPasswordRoute`
  retains URL and FormData adaptation, Relay orchestration, request-version
  mutation, hooks, state, markup, and presentation.
- Evidence: the pure test suite first failed because the owner did not exist.
  After the minimal extraction, its 5 tests and the 14 recovery-route tests
  passed. TypeScript, the framework/transport scan, and `git diff --check`
  passed. `mix ci` passed with 771 backend tests, 1,293 frontend tests across
  95 files, Relay validation, TypeScript, client and SSR builds, the unchanged
  6/6 clone budget, and a 182,142-byte gzip initial bundle under the 200,000-
  byte budget.
- Blockers: none.

## Boundaries

- Preserve the generated reset-password mutation shape and existing GraphQL
  auth contract.
- Preserve the missing-token field error and exact success copy.
- Preserve request-version ownership and stale-response suppression in React;
  the pure owner may only answer whether a response version is current.
- Preserve `resolveActionMutationResult` and `transportMutationErrors` as the
  auth outcome and error-policy owners.
- Leave URL and FormData adaptation, Relay mutation orchestration, hooks, state,
  markup, and presentation in `ResetPasswordRoute`.

## Verification

- `cd assets && bun x vitest run test/routes/auth/reset-password-data.test.ts test/routes/auth/recovery.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure reset-password data module
- `git diff --check`
