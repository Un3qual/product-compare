# Frontend Route Metadata Resolution Work Doc

## Snapshot

- Status: complete (route metadata resolution data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after focused and full frontend verification (9
  focused tests; 73 files and 1,007 tests in the full gate).

## Route Metadata Resolution Data Contract

- Status: complete on `codex/route-policy-data-contracts` as of 2026-07-14.
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

## Completion Evidence

- `route-metadata-data.ts` now owns deepest-valid-match traversal, loader-data
  precedence, same-match handle fallback, required title and description
  validation, optional string parsing, and explicit-true indexability.
- `RouteMetadata` retains `useMatches` plus all title, meta, canonical-link,
  social, robots, and structured-data markup.
- RED failed because the framework-free metadata module did not exist.
- GREEN passed 7 direct contract tests and 2 unchanged integration tests (9
  focused tests total).
- `cd assets && bun run typecheck` passed.
- `cd assets && bun run check` passed Relay validation, TypeScript, 73 test
  files and 1,007 tests, client and SSR production builds, and the client
  bundle budget (181,918 gzip bytes against 200,000).
- The framework-import scan and `git diff --check` passed.
- Independent review confirmed the production extraction and identified one
  missing regression: a fully invalid deepest match must not hide valid
  shallower metadata. The new direct case covers that fallback.
