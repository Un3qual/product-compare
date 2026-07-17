# Frontend Affiliate Setup Mutation Outcome Data

## Snapshot

- Status: completed
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after the extracted pure contract and route suites
  passed 37 tests, TypeScript passed, and the dependency and diff scans were
  clean.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Affiliate Setup Mutation Outcome Data Contract

- Status: completed on 2026-07-16 on
  `codex/frontend-mutation-outcome-contracts`.
- Completed action: isolated structural network, program, link, and coupon
  completion outcomes in the existing framework-free setup-data module while
  retaining FormData adaptation, Relay mutation promises, in-flight and pending
  guards, selected state, feedback placement, markup, and presentation in
  `AffiliateSetupRoute`.
- Evidence: the pure resolver returns each original complete fact without
  cloning, gives top-level GraphQL errors precedence, preserves success when a
  complete fact coexists with payload errors, and delegates incomplete facts to
  the shared route-error policy without mutating inputs. The focused pure and
  route suites pass 37 tests.
- Full repository evidence: `mix ci` passed with 771 backend tests, 1,257
  frontend tests across 94 files, Relay validation, TypeScript, client and SSR
  builds, and the 182,148-byte gzip initial-bundle contract under its 200,000-
  byte budget. The existing six-clone budget remained unchanged.
- Blockers: none.

## Boundaries

- Reuse `hasRouteGraphQLErrors` and `routeMutationErrorMessage`; do not create a
  parallel error policy.
- Preserve top-level GraphQL-error precedence over a complete fact.
- Preserve successful complete facts when payload errors coexist without top-
  level GraphQL errors.
- Return the original complete fact without cloning or structural
  revalidation.
- Leave FormData adaptation, Relay promise orchestration, in-flight and pending
  guards, selected state, feedback placement, markup, and presentation in
  `AffiliateSetupRoute`.

## Verification

- `cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup-data.test.ts test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure setup-data module
- `git diff --check`
