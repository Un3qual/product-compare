# Frontend Category Landing View Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with the 6-test pure contract suite and the 2-test
  category route suite passing (8 total), plus clean TypeScript,
  dependency-boundary, and diff checks.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Category Landing View-Data Contract

- Status: done on 2026-07-16 on `codex/category-alert-recommendation-contracts`.
- Delivered `getCategoryViewData`, a framework-free contract for exact category
  title and qualification copy, encoded browse and conditional next-page
  paths, source-ordered product rows, nullish brand fallback, and the first
  three source-ordered specification highlights. `CategoryRoute` retains
  Relay reads, route fallbacks, empty-state rendering, markup, links, and
  StyleX presentation.
- Evidence: the pure contract suite first failed as expected because
  `category-view-data.ts` did not exist. After the minimal extraction,
  `cd assets && bun x vitest run test/routes/categories/category-view-data.test.ts test/routes/categories/category.route.test.tsx`
  passed 8 tests; `cd assets && bun run typecheck` passed; the forbidden
  framework/transport import scan returned no matches; and `git diff --check`
  passed.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/categories/category-view-data.test.ts test/routes/categories/category.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure view-data module
- `git diff --check`
