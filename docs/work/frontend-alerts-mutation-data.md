# Frontend Alerts Mutation Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with 10 pure mutation-data tests and 6 alerts route
  tests passing (16 total), plus clean TypeScript, dependency-boundary, and
  diff checks.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Alerts Mutation Data Contract

- Status: done on 2026-07-16 on
  `codex/category-alert-recommendation-contracts`.
- Delivered `alerts-mutation-data.ts`, a framework-free owner for exact
  toggle/delete/mark-read variables and operation-specific success/error
  resolution. `AlertsRoute` retains pending state, Relay commits,
  revalidation, failure catching, feedback, and presentation.
- Evidence: the pure contract suite first failed as expected because
  `alerts-mutation-data.ts` did not exist. After the minimal extraction,
  `cd assets && bun x vitest run test/routes/account/alerts/alerts-mutation-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
  passed 16 tests; `cd assets && bun run typecheck` passed; the forbidden
  framework/transport dependency scan returned no matches; and `git diff
  --check` passed.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/account/alerts/alerts-mutation-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure mutation-data module
- `git diff --check`
