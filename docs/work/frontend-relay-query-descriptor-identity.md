# Frontend Relay Query Descriptor Identity

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after the explicit RED regression, 95 passing
  Relay preload and consumer tests, and the full frontend gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Relay Query Descriptor Identity Contract

- Status: completed on 2026-07-17.
- Result: the preload layer now exports one canonical descriptor identity over
  operation name, query text, and stable variables; both API-token and saved-
  comparison retainers consume it directly.
- Candidate evidence: before this batch, both React owners duplicated an
  operation-name plus stable-variables key while `route-preload.ts` privately
  owned the stronger identity; the baseline focused suites passed 94 tests.
- Blockers: none.

## Boundaries

- Preserve variable-order-independent identity.
- Distinguish descriptors whose operation text differs even when operation name
  and variables match.
- Leave Relay query retention, rendering, and route orchestration in React.

## Verification

- RED: the two direct identity cases failed because the canonical public
  function did not exist.
- GREEN: `cd assets && bun x vitest run test/relay/route-preload.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx test/routes/compare/saved-comparisons-route-state.test.tsx`
  passed 95 tests.
- `cd assets && bun run typecheck` passed.
- The consumer scan found direct `relayRouteQueryDescriptorIdentity` use in
  both retainers and no remaining weaker route-specific key helpers.
- `cd assets && bun run check` passed Relay validation, TypeScript, all 1,369
  frontend tests, client and SSR production builds, and the client-bundle
  contract at 596,339 raw / 182,143 gzip bytes.
- `git diff --check` passed.
