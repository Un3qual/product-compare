# Frontend Route Metadata Resolution Work Doc

## Snapshot

- Status: ready (route metadata resolution data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after current source and integration-suite
  validation (2 route metadata tests).

## Route Metadata Resolution Data Contract

- Status: ready on 2026-07-14.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Next action: move deterministic route-match metadata selection and parsing
  out of the React head renderer into a framework-free contract while
  preserving existing title, meta, link, and structured-data markup.
- Owned paths:
  - `assets/src/routes/route-metadata-data.ts`
  - `assets/src/routes/RouteMetadata.tsx`
  - `assets/test/routes/route-metadata-data.test.ts`
  - `docs/work/frontend-route-metadata-resolution.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/route-metadata-data.test.ts test/routes/route-metadata.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: one framework-free owner preserves deepest-match precedence,
  loader-data precedence over the same match's handle, handle fallback for
  invalid loader metadata, required title and description strings, optional
  string fields, and explicit-true indexability.
- Candidate evidence: current source inspection found deterministic match
  selection and metadata parsing embedded in `RouteMetadata.tsx`; its current
  integration suite passed 2 tests.
