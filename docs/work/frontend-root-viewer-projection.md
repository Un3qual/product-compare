# Frontend Root Viewer Projection

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 16 passing root
  route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Root Viewer Projection Contract

- Status: ready on 2026-07-17.
- Next action: move duplicated query/cache viewer validation and projection into
  one framework-free root viewer-data owner.
- Candidate evidence: `RootRoute` and the loader separately project ID, email,
  and operator state, while only the loader copy validates unknown values; the
  root route suite passes 16 tests.
- Blockers: none.

## Boundaries

- Return no viewer for nullish, primitive, and incomplete values.
- Preserve exact ID, email, and operator values for valid viewer objects.
- Keep fetching, cache reads, degraded fallbacks, abort handling, Relay reads,
  outlet context, navigation, home actions, and presentation unchanged.
- Keep the viewer-data owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/root-viewer-data.test.ts test/routes/root.route.test.tsx`
- `cd assets && bun run typecheck`
- consumer and framework/transport dependency scans of the viewer-data module
- `git diff --check`
