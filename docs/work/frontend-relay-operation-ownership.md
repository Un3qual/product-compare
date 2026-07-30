# Frontend Relay Operation Ownership

## Snapshot

- Status: active
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-approved-maintainability-modernization-implementation-plan.md`
- Last verified: 2026-07-30 after the pnpm/Vite 8 toolchain milestone.

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

## Active Batch

Build the authored-operation import graph and add the failing boundary test for
single-consumer mutation-only modules.

## Verification

- focused operation-ownership and affected route tests
- Relay validation and TypeScript
- full frontend unit suite and client/SSR builds
- bundle contract
- `mix work_queue.validate`
- `git diff --check`
