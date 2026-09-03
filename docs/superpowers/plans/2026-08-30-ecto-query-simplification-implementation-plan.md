# Ecto Query Simplification Implementation Plan

## Goal

Make Ecto own ordinary application query semantics and confine unavoidable
PostgreSQL SQL to small named boundaries without changing behavior,
concurrency, or query budgets.

## Constraints

- Prefer Ecto built-ins for typing, coalescing, ordering, filtering,
  aggregation, existence checks, and updates.
- Keep bounded, set-based work in the database.
- Preserve atomic conflict decisions and read-modify-write locking.
- Do not hide native SQL behind generic wrappers or increase hot-path query
  counts without evidence.

## Implementation

1. Replace fragments that duplicate ordinary Ecto expressions.
2. Return aggregate facts from queries and classify report freshness/stages in
   small Elixir functions.
3. Express observation conflict updates through Ecto assignments and conflict
   predicates where supported.
4. Centralize transaction advisory locks and use schemaless Ecto updates for
   search-document maintenance.
5. Retain narrowly scoped fragments for PostgreSQL full-text/trigram behavior,
   unsupported aggregate/string functions, atomic EXCLUDED rules, and native
   lock or isolation commands.

## Owned Areas

- Catalog, pricing, ingestion, attribution, SEO, and specs query modules named
  by docs/work/ecto-query-simplification.md
- lib/product_compare/database_locks.ex
- Matching focused tests and the work-lane document

## Verification

Run focused query-behavior, ordering, concurrency, and query-budget tests,
followed by formatting, static analysis, isolated mix ci, advisory scans,
frontend gates, and Playwright. Completion evidence and milestone commits live
in the work-lane document.
