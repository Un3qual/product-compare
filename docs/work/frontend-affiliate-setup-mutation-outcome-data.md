# Frontend Affiliate Setup Mutation Outcome Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 28 passing
  affiliate setup data and route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Affiliate Setup Mutation Outcome Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate structural network, program, link, and coupon completion
  outcomes in the existing framework-free setup-data module while retaining
  FormData adaptation, Relay mutation promises, in-flight and pending guards,
  selected state, feedback placement, markup, and presentation in
  `AffiliateSetupRoute`.
- Candidate evidence: current source inspection found four parallel structural
  completion branches plus shared-error interpretation in the React owner; the
  existing pure owner already builds every corresponding mutation input, and
  its pure and route suites pass 28 tests.
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
