# Frontend Compare Specification-Mode Navigation Data

## Snapshot

- Status: complete
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 111 passing focused compare navigation and
  route tests plus a clean TypeScript check.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Compare Specification-Mode Navigation Data Contract

- Status: complete on 2026-07-17.
- Completion evidence: `compare-spec-mode-data.ts` now projects the stable
  ordered labels, canonical destinations, and exactly one current state while
  `CompareRoute` retains Radix tabs, links, panels, children, markup, and
  presentation.
- Verification: the focused mode-data and compare route suites passed 111
  tests; `bun run typecheck`, consumer/framework dependency scans, and
  `git diff --check` passed.
- Blockers: none.

## Boundaries

- Preserve Shared specs, Differences, and All specs order and labels.
- Preserve selected-slug order, omit `specs` for shared mode, and mark exactly
  one mode current.
- Keep Radix tabs, links, panels, children, markup, and presentation in React.
- Keep the mode-data owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/compare/compare-spec-mode-data.test.ts test/routes/compare/compare.route.test.tsx`
- `cd assets && bun run typecheck`
- consumer and framework/transport dependency scans of the mode-data module
- `git diff --check`
