# Frontend Relay Operation Ownership

## Snapshot

- Status: done
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-approved-maintainability-modernization-implementation-plan.md`
- Last verified: 2026-07-31 against the five feature-family modules, their
  consumers, generated artifacts, and affected route behavior.

## Target Outcome

Related Relay mutations live in feature-family modules that match real route
ownership. Queries remain dedicated data-contract modules where route render,
preload, pagination, or loader consumers share them.

## Boundaries

- Do not create an operation registry, GraphQL wrapper, or new technical layer.
- Generated artifacts remain generated and checked in.
- Shared operations remain dedicated modules when the import graph proves
  multiple consumers.
- Preserve SSR, mutation outcomes, Relay cache behavior, route tests, and
  bundle budgets.

## Completed Outcome

- Five feature-family modules own 22 affected mutation documents: alerts (3),
  API tokens (3), affiliate setup (4), compare (4), and products (8).
- Consumers and behavioral tests import those family documents directly. The
  unreleased operation names use the lower-camel family prefixes required by
  Relay, and the matching generated artifacts were regenerated.
- Source-regex ownership policy was removed. Ordinary route, submission,
  mutation-variable, cache-update, and unknown-document behavior now provides
  the acceptance boundary.
- Queries remain separate data-contract modules when route rendering, preload,
  pagination, or loader ownership makes that separation real.

## Verification

- Focused primitive, auth submission, and affected route set: 8 files and 129
  tests passed.
- Relay validation compiled 52 reader, 51 normalization, and 51 operation
  documents after the approved family-prefix rename.
- The complete frontend check passed with TypeScript, authored-source Oxc,
  Vitest, client/SSR builds, and the combined JavaScript/CSS bundle contract.
