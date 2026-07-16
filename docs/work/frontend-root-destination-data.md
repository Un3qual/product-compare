# Frontend Root Destination Policy Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after the extracted policy, focused pure and root
  suites, TypeScript, dependency scan, and whitespace validation.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Root Destination Policy Data Contract

- Status: done on 2026-07-16.
- Completed: extracted ordered public, shopper, authenticated, operator,
  secondary-public, and auth destination composition to the framework-free
  `root-destination-data.ts` contract. `RootDestinations` retains active-path
  matching, NavLink/Button composition, semantic navigation, and StyleX.
- Evidence: direct policy coverage characterizes guest, member, and operator
  group composition, exact copy, comparison exact-match metadata, source
  ordering, secondary-public exclusion, and viewer immutability. The rendered
  root-route characterization remains green.
- Blockers: none.

## Verification

- RED: `cd assets && bun x vitest run test/routes/root-destination-data.test.ts`
  failed as expected because `src/routes/root-destination-data.ts` was absent.
- `cd assets && bun x vitest run test/routes/root-destination-data.test.ts test/routes/root.route.test.tsx`
  passed: 2 files, 18 tests, 0 failures.
- `cd assets && bun run typecheck` passed.
- The framework/transport dependency scan found no React, Relay, router,
  StyleX, Radix, or generated GraphQL imports in the pure data module.
- `git diff --check` passed.
