# Frontend Reset-Password Request Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 20 passing auth
  error and recovery-route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Reset-Password Request Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate deterministic token normalization, missing-token state,
  mutation-variable construction, exact success copy, and stale-response
  eligibility in a framework-free reset-password data owner.
- Candidate evidence: current source inspection found those policies embedded
  in `ResetPasswordRoute`, while the existing auth error owner already
  normalizes action outcomes. The auth-error and recovery-route suites pass 20
  tests, and the candidate owns no paths from the comparison sharing, price-
  watch, or tracked-commerce mutation rows.
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
