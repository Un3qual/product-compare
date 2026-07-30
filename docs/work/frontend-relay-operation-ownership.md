# Frontend Relay Operation Ownership

## Snapshot

- Status: done
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-approved-maintainability-modernization-implementation-plan.md`
- Last verified: 2026-07-30 after the full frontend verification gate.

## Target Outcome

Every authored Relay mutation used by one route, component, loader, or action
is colocated with that execution owner. Dedicated operation files remain only
for operations with multiple real consumers.

## Boundaries

- Do not create an operation registry, GraphQL wrapper, or new technical layer.
- Generated artifacts remain generated and checked in.
- Shared operations remain dedicated modules when the import graph proves
  multiple consumers.
- Preserve SSR, mutation outcomes, Relay cache behavior, route tests, and
  bundle budgets.

## Completed Outcome

- The import graph contains 51 authored operations: 30 mutations and 21
  queries.
- All 30 mutations had one execution owner. They now use owner-prefixed Relay
  names, live with that route, component, row, or action, and no longer require
  mutation-only source modules.
- The query set has no orphaned documents: 7 have one execution consumer and
  14 are shared between route rendering, preload, pagination, or loader
  boundaries. Query modules remain separate because they define those data
  contracts rather than mutation execution units.
- A focused architecture test rejects mutation-only modules with zero or one
  runtime owner while permitting genuinely shared operation modules.
- Relay regenerated all 30 renamed mutation artifacts from their colocated
  definitions.

## Verification

- operation-ownership and affected route tests: passed
- Relay validation, TypeScript, and Oxc checks: passed
- full frontend suite: 1,508 tests passed
- Vite client and SSR production builds: passed
- client bundle contract: 167,670 gzip bytes across the initial JavaScript
  closure, under the 200,000-byte budget
