# Frontend Relay Operation Ownership

## Snapshot

- Status: done
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-approved-maintainability-modernization-implementation-plan.md`
- Last verified: 2026-07-31 against the six workflow operation modules, their
  consumers, generated artifacts, and affected route behavior.

## Target Outcome

Each workflow module owns its primary query and related Relay mutations.
Independent or paginated follow-up queries remain dedicated data-contract
modules where their consumers require separate ownership.

## Boundaries

- Do not create an operation registry, GraphQL wrapper, or new technical layer.
- Generated artifacts remain generated and checked in.
- Shared operations remain dedicated modules when the import graph proves
  multiple consumers.
- Preserve SSR, mutation outcomes, Relay cache behavior, route tests, and
  bundle budgets.

## Completed Outcome

- Six PascalCase workflow modules own 28 family documents:
  `AlertOperations`, `ApiTokenOperations`, `AffiliateSetupOperations`,
  `SavedComparisonOperations`, `ComparisonSharingOperations`, and
  `ProductCommunityOperations`. Each contains its primary query and related
  mutations.
- Consumers, request mocks, and behavioral tests import those workflow
  documents directly. The unreleased operation names use the workflow-module
  prefixes required by Relay, and all 28 matching artifacts were regenerated.
- Source-regex ownership policy was removed. Ordinary route, submission,
  mutation-variable, cache-update, and unknown-document behavior now provides
  the acceptance boundary.
- Independent and paginated follow-up queries remain separate when their route,
  preload, or loader ownership makes that separation real.

## Verification

- Final focused workflow review: 11 files and 261 tests passed.
- Relay validation compiled 52 reader, 51 normalization, and 51 operation
  documents after the approved family-prefix rename.
- The complete frontend check passed with TypeScript, authored-source Oxc,
  104 Vitest files / 1,516 tests, client/SSR builds, and the combined
  JavaScript/CSS bundle contract.
