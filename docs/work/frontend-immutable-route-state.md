# Frontend Immutable Route State

## Snapshot

- Status: completed
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after Task 20 implementation: 8 pure collection-
  state plus 45 API-token and 31 saved-comparison route-state tests passed.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Immutable Route-State Collection Contract

- Status: completed on 2026-07-15 on `codex/frontend-route-data-contracts`.
- Completed action: consolidated duplicated copy-on-write map and set helpers
  into `assets/src/routes/immutable-collection-state.ts`; both route owners
  retain their existing React state transitions, Relay orchestration, errors,
  feedback, and presentation.
- Verification evidence: the focused suite passed 84 tests (8 pure collection-
  state, 45 API-token route, and 31 saved-comparison route-state); `bun run
  typecheck` passed; the framework-import scan returned no matches; and `git
  diff --check` passed.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/immutable-collection-state.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx test/routes/compare/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run typecheck`
- framework-import scan of the pure state module
- `git diff --check`
