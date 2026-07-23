# Taxonomy Context Decomposition

## Snapshot

- Status: active
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-taxonomy-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against the direct Taxonomy and ingestion
  enrichment characterization paths.

## Target Outcome

`ProductCompare.Taxonomy` remains the stable application-facing context while
taxonomy registry, taxon hierarchy, use-case assignment, and category-alias
implementations move into focused internal modules with unchanged public APIs,
transactions, closure behavior, queries, errors, catalog guards, and ingestion
mapping.

## Ready Evidence

- `lib/product_compare/taxonomy.ex` is 396 lines and owns four distinct
  implementation responsibilities.
- Catalog, ingestion, fixtures, GraphQL tests, and direct taxonomy tests use
  the stable facade, so implementation ownership can move without application
  caller changes.
- The selected direct Taxonomy and ingestion enrichment gate passed 13 tests
  on 2026-07-22.
- Registry, hierarchy, assignments, and aliases share one stable taxonomy
  acceptance boundary and remain internal slices rather than micro-batches.
- The implementation paths are disjoint from Alerts, Catalog, and Comparison
  Snapshots decomposition.

## Internal Slices

1. Taxonomy seeding, upserts, membership checks, and reads.
2. Taxon creation, updates, moves, closure maintenance, and hierarchy reads.
3. Product use-case assignment and removal.
4. Category-path normalization, alias persistence, and type-alias resolution.

## Boundaries

- Preserve every public function, clause, guard, default, typespec, value,
  query, transaction, and error.
- Preserve validation, closure rows, ordering, conflict targets, assignment
  policy, normalization, alias resolution, and catalog and ingestion behavior.
- Keep callers dependent only on `ProductCompare.Taxonomy`.
- Do not change schemas, migrations, GraphQL SDL, catalog filtering, ingestion
  enrichment, SEO, frontend contracts, or taxonomy policy.

## Verification

- `mix test test/product_compare/taxonomy test/product_compare/ingestion/enrichment_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
