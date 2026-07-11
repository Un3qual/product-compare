# Frontend Radix UI Polish Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: this file
- Last verified: 2026-07-11 against `assets/src/router.tsx` and the current UI layer
- Design: `docs/superpowers/specs/2026-07-11-radix-ui-polish-design.md`
- Plan: `docs/superpowers/plans/2026-07-11-radix-ui-polish.md`
- Objective: establish a Radix-backed theme and reusable UI patterns, then
  polish every registered frontend route without changing application behavior.

## Active Batch 1: Radix Theme And Shared UI Foundation

Status: active
Owned paths:

- `assets/package.json`
- `assets/bun.lock`
- `assets/src/ui/**`
- `assets/test/ui/**`
- `docs/work/frontend-radix-ui-polish.md`

Verification:

- `cd assets && bun x vitest run test/ui`
- `cd assets && bun run typecheck`
- `cd assets && bun run build`
- `git diff --check`

Exit condition: Radix Themes owns the interactive foundation, semantic Product
Compare tokens are available through CSS and StyleX, and shared page, feedback,
data, status, and pagination patterns have green behavior tests.

## Dependent Batches

1. Shared application shell and home.
2. Catalog browse and product detail.
3. Merchant and offer discovery.
4. Comparison and saved comparisons.
5. Operational routes.
6. Authentication routes.

Promote only the next batch after its dependency has green completion evidence.
Keep the three unrelated ready rows in `docs/work/index.md` available throughout
execution.

## Baseline Evidence

- `cd assets && bun run test:unit` passed 45 files and 618 tests before UI
  implementation began.
