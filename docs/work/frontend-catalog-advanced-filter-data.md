# Frontend Catalog Advanced-Filter Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Catalog Advanced-Filter View-Data Contract

- Extracted deterministic, framework-free advanced-filter rows into
  `catalog-advanced-filter-data.ts`.
- The module structurally accepts selections and metadata, computes URL-state
  precedence with metadata fallback, preserves empty numeric values and false
  boolean values, keeps the last enum selection per attribute, applies the
  selected-disabled policy, and supplies stable form names and IDs.
- `CatalogAdvancedFilters` retains fieldset omission, labels, controls,
  `TextField`, accessibility, uncontrolled defaults, and presentation while
  rendering the supplied rows in metadata order.

## TDD and Verification Evidence

- RED: `cd assets && bun x vitest run test/routes/catalog/catalog-advanced-filter-data.test.ts`
  failed as expected because Vite could not resolve the new
  `catalog-advanced-filter-data` module.
- GREEN: the same focused pure suite passed with 5 tests after the minimal
  structural module was added.
- Focused verification:
  `cd assets && bun x vitest run test/routes/catalog/catalog-advanced-filter-data.test.ts test/routes/catalog/browse.route.test.tsx`
  passed with 67 tests.
- TypeScript: `cd assets && bun run typecheck` passed.
- Framework/transport/generated dependency scan of the pure module found no
  matches for React, Relay, GraphQL, generated artifacts, fetch, Axios, or
  HTTP transports.
- `git diff --check` passed.
