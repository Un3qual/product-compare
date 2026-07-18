# Frontend Route Metadata Tag Policy Data

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after 12 passing route-metadata data and component
  tests, TypeScript, consumer and transitive dependency scans, and `git diff
  --check`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Route Metadata Tag Policy Data Contract

- Status: completed on 2026-07-17 on
  `codex/frontend-navigation-row-contracts`.
- Delivered: the framework-free route-metadata data owner projects exact robots
  and Twitter-card values from normalized indexability and image facts;
  `RouteMetadata` derives that simple policy during render.
- Evidence: pure tests cover explicit, default, and false indexability;
  non-empty, missing, null, and empty image URLs; and frozen-input immutability.
  Component coverage preserves both rendered card values alongside canonical,
  Open Graph, image, structured-data, and router behavior. The focused suites
  pass 12 tests.
- Blockers: none.

## Boundaries

- Preserve `index,follow` only for explicitly indexable metadata and
  `noindex,follow` otherwise.
- Preserve `summary_large_image` only for non-empty image URLs and `summary`
  otherwise.
- Keep route-match access, canonical, Open Graph, image, structured-data,
  markup, and router behavior in React.
- Keep the data owner transitively free of React, router, Relay, StyleX, Radix,
  and generated-query dependencies.

## Verification

- `cd assets && bun run test -- test/routes/route-metadata-data.test.ts test/routes/route-metadata.test.tsx`
- `cd assets && bun run typecheck`
- consumer and transitive framework/transport dependency scans of the route-
  metadata data module
- `git diff --check`
