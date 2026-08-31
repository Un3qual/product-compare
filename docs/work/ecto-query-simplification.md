# Ecto Query Simplification

## Snapshot

- Status: complete
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-30-ecto-query-simplification-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`

## Target Outcome

Ecto owns ordinary filtering, typing, coalescing, existence checks, ordering,
aggregation, update targeting, and enum handling. PostgreSQL-specific
capabilities remain in narrow fragments or one focused native boundary, with
all concurrency, ordering, query-budget, and public result contracts preserved.

## Owned Paths

- Application query modules named in the linked plan
- Existing focused tests named in the linked plan
- `lib/product_compare/database_locks.ex`
- This lane document

## Internal Slices

1. Direct Ecto built-in substitutions.
2. Aggregate report classification and enum ownership.
3. Atomic observation conflict simplification.
4. Search-document updates and advisory-lock boundary.
5. Full repository verification and lane evidence.

## Blocker Rule

Retain a focused fragment when Ecto does not model the PostgreSQL capability,
or when eliminating it would split one atomic invariant, add an unbounded read,
increase query count on a hot path without evidence, or make the query less
legible. Record that rationale instead of disguising native SQL behind a
generic abstraction.

## Completion Evidence

- Ordinary query semantics now use Ecto expressions for typed nulls,
  `coalesce`, null-aware ordering, date casts, existence checks, enum values,
  arithmetic median bounds, case-insensitive matching, filtered aggregates,
  correlated subqueries, and conflict predicates. The implementation milestones
  are `d7ac1230`, `f8428024`, `36936e94`, `b1461eaa`, `9d1f0974`, `f40534ad`,
  `d9d82520`, and `fb413cdc`.
- Report freshness and stage classification no longer live in large SQL
  fragments. Queries return schema-aware aggregate facts, and small Elixir
  functions own the resulting business classification. Shared CJ stage
  normalization also removed the duplication introduced during that rewrite.
- Media-observation conflict updates now use direct Ecto assignments and a
  conflict `where` predicate. The remaining category-candidate `EXCLUDED`
  expressions are intentional: observation count always advances while newer
  facts update conditionally in the same atomic statement.
- Search-document updates use a schemaless Ecto `update_all`; advisory locking
  is centralized in `ProductCompare.DatabaseLocks`. Application-native SQL is
  limited to repeatable-read transaction setup/introspection, that named
  advisory lock, and the specification-correction table lock. The maintenance
  validation task remains a direct read-only database boundary over a
  validated table name.
- Retained fragments represent capabilities Ecto does not model directly or
  expressions that are clearer and safer as one database operation: PostgreSQL
  full-text/trigram search, selected string and aggregate functions,
  conditional ordering, the search-vector function, and the atomic
  category-candidate conflict rule. No retained fragment is an avoidable typed
  null, date cast, coalesce, existence check, median bound, or report
  classification.
- Focused verification passed the ingestion report (9), enrichment (8), native
  database/search-document (55), pricing/search/attribution (150), SEO/sitemap
  (21), ingestion normalization (33), and shared stage-report (25) test groups
  with zero failures. The Ecto median-query detector was made SQL-shape
  independent in `8aadfebc`; its GraphQL file passed 27 tests.
- Final isolated `mix ci` passed queue validation, formatting, Credo with zero
  issues, ExDNA at its 3/3 budget, Reach with no issues, Dialyzer, 1,577 backend
  tests with zero failures and 87.01% coverage, and every frontend gate.
- `mix hex.audit`, `pnpm audit --prod`, the frozen pnpm install, and the complete
  38-test Playwright suite passed. `git diff --check` was clean at the code
  checkpoint.
