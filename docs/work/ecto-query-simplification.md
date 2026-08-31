# Ecto Query Simplification

## Snapshot

- Status: active
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

Pending implementation. Record each focused test group, retained SQL boundary,
static-analysis gate, full isolated CI result, Playwright result, and milestone
commit here.
