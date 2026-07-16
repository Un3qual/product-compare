# Frontend Product Community Mutation Outcome Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and eight passing
  product-community data and panel characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Product Community Mutation Outcome Data Contract

- Status: ready on 2026-07-16.
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
