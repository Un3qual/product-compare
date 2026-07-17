# Frontend Product Community Mutation Outcome Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after 14 passing focused tests, TypeScript, the
  framework/transport dependency scan, queue validation, and diff hygiene.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Product Community Mutation Outcome Data Contract

- Status: done on 2026-07-16 on
  `codex/product-community-mutation-outcomes`.
- Next action: isolate exact review, question, and answer completion messages in
  the existing framework-free community-data module while retaining FormData,
  Relay mutation promises, pending state, authored-text input adaptation,
  feedback placement, pagination, markup, and styling in
  `ProductCommunityPanel`.
- Candidate evidence: current source inspection found three parallel structural
  completion checks and success messages plus shared-error interpretation in
  the React owner; the existing pure owner already builds every corresponding
  mutation input, and its pure and panel suites pass eight tests.
- Blockers: none.

## Completion Evidence

- RED: the expanded pure suite failed six new cases because the review,
  question, and answer completion resolvers did not exist.
- GREEN: the framework-free owner now returns exact operation-specific success
  copy for complete facts and otherwise delegates to the shared route-error
  policy. Complete facts remain successful even when payload or top-level
  errors coexist, matching the prior React behavior.
- `ProductCommunityPanel` now delegates only completion interpretation. It
  retains FormData, generated Relay operations, mutation promises, pending
  state, authored-text adaptation, feedback placement, pagination, markup, and
  styling.
- The focused pure and panel suites pass 14 tests. TypeScript, dependency
  boundary, queue, and diff-hygiene checks pass.
- Full `mix ci` passes: Credo, clone and smell budgets, Dialyzer, 771 backend
  tests, Relay validation, TypeScript, 1,248 frontend tests, client and SSR
  builds, and the 182,145-byte gzip initial-bundle contract.

## Boundaries

- Reuse `routeMutationErrorMessage`; do not create a parallel error policy.
- Preserve current fact-first success behavior when a complete mutation fact
  coexists with payload or top-level GraphQL errors.
- Preserve the exact review, question, and answer moderation-success copy.
- Leave `FormData`, Relay promise orchestration, pending state, authored-text
  input adaptation, feedback placement, pagination, markup, and presentation in
  `ProductCommunityPanel`.

## Verification

- `cd assets && bun x vitest run test/routes/products/product-community-data.test.ts test/routes/products/product-community-panel.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure community-data module
- `git diff --check`
