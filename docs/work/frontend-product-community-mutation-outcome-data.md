# Frontend Product Community Mutation Outcome Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after 17 passing focused tests, TypeScript, the
  framework/transport dependency scan, and diff hygiene.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Product Community Mutation Outcome Data Contract

- Status: done on 2026-07-16 on
  `codex/product-community-mutation-outcomes`.
- Result: the framework-free community-data module owns exact review, question,
  and answer mutation outcomes, including top-level GraphQL error precedence,
  while `ProductCommunityPanel` retains FormData, Relay mutation promises,
  pending state, authored-text input adaptation, feedback placement,
  pagination, markup, and styling.
- Candidate evidence: source inspection found three parallel structural
  completion checks and success messages plus shared-error interpretation in
  the React owner; before implementation, the pure owner already built every
  corresponding mutation input and the pure and panel suites passed eight
  tests.
- Blockers: none.

## Completion Evidence

- RED: the expanded pure suite failed six new cases because the review,
  question, and answer completion resolvers did not exist.
- GREEN: the framework-free owner now returns exact operation-specific success
  copy for complete facts and otherwise delegates to the shared route-error
  policy. Complete facts remain successful when payload-level errors coexist,
  matching the prior React behavior, while top-level GraphQL errors take
  precedence so partial transport responses cannot report success.
- `ProductCommunityPanel` now delegates only completion interpretation. It
  retains FormData, generated Relay operations, mutation promises, pending
  state, authored-text adaptation, feedback placement, pagination, markup, and
  styling.
- The focused pure and panel suites pass 17 tests. TypeScript, dependency
  boundary, queue, and diff-hygiene checks pass.
- Full `mix ci` passes: Credo, clone and smell budgets, Dialyzer, 771 backend
  tests, Relay validation, TypeScript, 1,248 frontend tests, client and SSR
  builds, and the 182,145-byte gzip initial-bundle contract.

## Boundaries

- Reuse `routeMutationErrorMessage`; do not create a parallel error policy.
- Preserve fact-first success behavior when a complete mutation fact coexists
  with payload-level errors, but reject completion when top-level GraphQL
  errors are present.
- Preserve the exact review, question, and answer moderation-success copy.
- Leave `FormData`, Relay promise orchestration, pending state, authored-text
  input adaptation, feedback placement, pagination, markup, and presentation in
  `ProductCommunityPanel`.

## Verification

- `cd assets && bun x vitest run test/routes/products/product-community-data.test.ts test/routes/products/product-community-panel.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure community-data module
- `git diff --check`
