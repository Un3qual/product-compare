# Frontend API Token Lifecycle Display Work Doc

## Snapshot

- Status: ready (API-token lifecycle display data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after current source and focused-suite validation
  (55 API-token route-data and route tests).

## API Token Lifecycle Display Data Contract

- Status: ready on 2026-07-14.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Next action: move deterministic token labels, strict UTC lifecycle-date
  formatting, optional-date fallbacks, and status copy from `ApiTokenItem`
  into the existing framework-free API-token route-data owner while preserving
  item markup and lifecycle actions.
- Owned paths:
  - `assets/src/routes/account/api-tokens/api-token-route-data.ts`
  - `assets/src/routes/account/api-tokens/ApiTokenItem.tsx`
  - `assets/test/routes/account/api-tokens/api-token-route-data.test.ts`
  - `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
  - `docs/work/frontend-api-token-lifecycle-display.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: the framework-free route-data owner returns stable display
  labels for labeled and unlabeled tokens, valid offset-aware UTC timestamps,
  exact invalid-string fallbacks, optional empty labels, and revoked/active/
  expired status copy; React retains semantic details and lifecycle controls.
- Candidate evidence: current source inspection found deterministic label,
  UTC lifecycle-date, optional fallback, and status-copy policy embedded in
  `ApiTokenItem.tsx`. The existing route-data and route suites pass 55 tests.
