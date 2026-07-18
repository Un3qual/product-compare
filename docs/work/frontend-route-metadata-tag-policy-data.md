# Frontend Route Metadata Tag Policy Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 9 passing
  route-metadata data and component tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Route Metadata Tag Policy Data Contract

- Status: ready on 2026-07-17.
- Next action: project robots and Twitter-card values from normalized route
  metadata in the existing framework-free route-metadata data owner.
- Candidate evidence: `RouteMetadata` currently derives both values inline,
  while the data owner already normalizes indexability and image facts; the
  focused suites pass 9 tests.
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

- `cd assets && bun x vitest run test/routes/route-metadata-data.test.ts test/routes/route-metadata.test.tsx`
- `cd assets && bun run typecheck`
- consumer and transitive framework/transport dependency scans of the route-
  metadata data module
- `git diff --check`
