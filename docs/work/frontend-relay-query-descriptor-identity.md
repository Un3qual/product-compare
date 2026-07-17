# Frontend Relay Query Descriptor Identity

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 94 passing
  Relay preload, API-token route, and saved-comparison route-state tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Relay Query Descriptor Identity Contract

- Status: ready on 2026-07-17.
- Next action: export the preload layer's canonical descriptor identity and use
  it for retained API-token and saved-comparison query keys.
- Candidate evidence: both React owners duplicate an operation-name plus
  stable-variables key, while `route-preload.ts` already owns the stronger identity
  over operation name, query text, and stable variables.
- Blockers: none.

## Boundaries

- Preserve variable-order-independent identity.
- Distinguish descriptors whose operation text differs even when operation name
  and variables match.
- Leave Relay query retention, rendering, and route orchestration in React.

## Verification

- `cd assets && bun x vitest run test/relay/route-preload.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx test/routes/compare/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run typecheck`
- consumer scan proving both retainers use the shared descriptor identity
- `git diff --check`
