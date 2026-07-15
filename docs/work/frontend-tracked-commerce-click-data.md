# Frontend Tracked-Commerce Click Data

## Snapshot

- Status: completed
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after the extracted pure contract suite (4 tests),
  51 passing offer-discovery route tests, TypeScript, required policy scans,
  and `git diff --check`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Tracked-Commerce Click Data Contract

- Status: completed on 2026-07-15 on `codex/frontend-route-data-contracts`.
- Completed action: extracted normal click qualification, encoded first-party
  tracking href construction, and exact API-origin redirect resolution into
  `tracked-commerce-click-data.ts`; `TrackedCommerceClickAction` retains its
  event handling, pending/error state, Relay mutation orchestration, browser
  navigation, and markup.
- Evidence: `cd assets && bun x vitest run
  test/routes/offers/tracked-commerce-click-data.test.ts
  test/routes/offers/offer-discovery.route.test.tsx` passed 55 tests; `bun run
  typecheck` passed; both required policy scans found no matches.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/offers/tracked-commerce-click-data.test.ts test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
