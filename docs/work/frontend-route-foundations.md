# Frontend Route Foundations

## Snapshot

- Status: ready
- Priority: P1
- Approved design:
  `docs/superpowers/specs/2026-07-11-next-frontend-batches-design.md`
- Implementation plan:
  `docs/superpowers/plans/2026-07-11-next-frontend-batches.md`
- Objective: provide correct application-level not-found behavior and shared
  route document metadata without changing route data contracts.

## Selected Batches

1. Add a wildcard data route that renders the shared not-found experience and
   preserves a 404 SSR status.
2. Add route-handle metadata rendered through React 19 title and meta resources
   for client navigation and SSR parity.

## Constraints

- Preserve redirects and existing route error boundaries.
- Keep document metadata static and route-owned; do not fetch it separately.
- Serialize the two batches because both touch `assets/src/router.tsx` and its
  focused tests.

## Verification

- `cd assets && bun x vitest run test/router.test.tsx test/entry.server.test.tsx test/entry.server.error-handling.test.tsx test/routes/root.route.test.tsx`
- `cd assets && bun run typecheck`
- `cd assets && bun run build`
- `git diff --check`
