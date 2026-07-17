# Frontend Price-Watch Mutation Outcome Data

## Snapshot

- Status: completed
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after the extracted pure contract and alerts-route
  suites passed 22 tests, TypeScript passed, and dependency and diff scans were
  clean.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Price-Watch Mutation Outcome Data Contract

- Status: completed on 2026-07-16 on
  `codex/frontend-mutation-outcome-contracts`.
- Completed action: isolated exact create-watch completion interpretation in
  the existing framework-free price-watch data module while retaining FormData,
  Relay mutation promises, product-keyed reset, rule state, pending state,
  feedback placement, markup, and styling in `PriceWatchControl`.
- Evidence: a complete watch returns the exact existing success copy even when
  payload or top-level GraphQL errors coexist; missing and null facts delegate
  to the shared route-error owner; the resolver does not mutate payload or
  GraphQL error inputs. The focused pure and alerts-route suites pass 22 tests.
- Full repository evidence: `mix ci` passed with 771 backend tests, 1,278
  frontend tests across 94 files, Relay validation, TypeScript, client and SSR
  builds, and the 182,145-byte gzip initial-bundle contract under its 200,000-
  byte budget. The existing six-clone budget remained unchanged.
- Blockers: none.

## Boundaries

- Reuse `routeMutationErrorMessage`; do not create a parallel error policy.
- Preserve current fact-first success behavior when a complete watch coexists
  with payload or top-level GraphQL errors.
- Preserve the exact create-watch success copy.
- Leave `FormData`, Relay promise orchestration, product-keyed reset, rule and
  pending state, feedback placement, markup, and presentation in
  `PriceWatchControl`.

## Verification

- `cd assets && bun x vitest run test/routes/products/price-watch-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure price-watch data module
- `git diff --check`
