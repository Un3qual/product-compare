# Frontend Root Viewer Projection

## Snapshot

- Status: done
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after the extracted contract, focused 28-test
  suite, TypeScript, dependency, full frontend, and queue validation.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Root Viewer Projection Contract

- Status: done on 2026-07-17.
- Completed: extracted the framework-free `viewer-data.ts` contract. Both the
  root loader and `RootRoute` now call its validated projection; fetching,
  cached degraded fallback, abort handling, Relay reads, outlet context,
  navigation, and presentation remain in their original owners.
- Evidence: the contract rejects nullish, primitive, incomplete, numeric/null
  ID, numeric/null email, and non-boolean operator values; it projects exact
  valid fields and does not mutate its input. The root route characterization
  continues to cover ready Relay and degraded-cache behavior.
- Blockers: none.

## Boundaries

- Return no viewer for nullish, primitive, and incomplete values.
- Preserve exact ID, email, and operator values for valid viewer objects.
- Keep fetching, cache reads, degraded fallbacks, abort handling, Relay reads,
  outlet context, navigation, home actions, and presentation unchanged.
- Keep the viewer-data owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- RED: `cd assets && bun x vitest run test/routes/root-viewer-data.test.ts`
  failed as expected because `src/routes/root/viewer-data.ts` was absent.
- `cd assets && bun x vitest run test/routes/root-viewer-data.test.ts test/routes/root.route.test.tsx`
  passed: 2 files, 28 tests, 0 failures.
- `cd assets && bun run typecheck` passed.
- Consumer scan found only the root loader, `RootRoute`, and the direct pure
  test import. The framework/transport scan found no React, router, Relay,
  StyleX, or generated-query dependency in `viewer-data.ts`.
- `git diff --check` passed.
- `cd assets && bun run check` passed: Relay validation, TypeScript, 1,395
  tests, client and SSR builds, and the 596,262 raw / 182,114 gzip-byte bundle
  contract.
- `mix work_queue.validate` passed: 3 ready rows.
