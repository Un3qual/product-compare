# Taxonomy Context Decomposition Design

## Goal

Keep `ProductCompare.Taxonomy` as the stable application-facing context while
moving taxonomy registry, taxon hierarchy, use-case assignment, and category
alias implementations into focused internal modules without changing taxonomy,
catalog, or ingestion behavior.

## Current Boundary

The 396-line context currently owns four distinct responsibilities:

1. Default taxonomy seeding, taxonomy upserts, membership checks, and reads.
2. Taxon creation, updates, hierarchy moves, and closure-table projections.
3. Product use-case assignment and removal.
4. Category-path normalization, alias persistence, and type-alias resolution.

Catalog, ingestion, fixtures, GraphQL tests, and direct taxonomy tests already
depend on the stable context boundary, so the extraction does not require
application caller changes.

## Architecture

- `ProductCompare.Taxonomy.Taxonomies` owns default seeding, taxonomy upserts,
  membership checks, taxonomy-scoped taxon reads, and SEO-slug lookup.
- `ProductCompare.Taxonomy.Hierarchy` owns taxon creation and updates,
  closure-row construction, subtree moves, ancestor and descendant reads, and
  cycle and parent-taxonomy validation.
- `ProductCompare.Taxonomy.Assignments` owns use-case assignment and removal,
  consuming `Taxonomies` for the existing taxonomy-membership guard.
- `ProductCompare.Taxonomy.Aliases` owns category-path normalization, alias
  reads and upserts, and type-alias resolution.
- `ProductCompare.Taxonomy` retains every existing public function, clause,
  guard, default, typespec, result, error, and explicit wrapper.

Internal owners may collaborate directly through the stated functions, but
application callers continue to depend only on the facade.

## Preserved Behavior

- Default `type` and `use_case` seeding, code-only existing-taxonomy lookup,
  changeset validation, conflict targets, timestamps, and return values.
- Parent-taxonomy validation, closure self rows and ancestor rows, subtree
  reparenting, old-path removal, new-path insertion, deterministic ancestor and
  descendant ordering, and cycle rejection.
- Taxonomy-scoped membership checks, use-case-only assignment, assignment
  upserts, source and confidence values, and idempotent removal counts.
- Category-path splitting, trimming, empty-segment removal, lowercasing,
  conflict replacement, type-taxonomy restriction, and invalid-path results.
- Existing positive-ID typespecs, struct matches, errors, and caller-visible
  values remain unchanged.

## Errors And Transactions

The extraction preserves the existing `Ecto.Multi` boundaries for taxon
creation and subtree moves, the same rollback steps and reasons, and the same
changeset and domain errors. It introduces no new transaction, rescue, retry,
callback, repository abstraction, or fallback boundary.

## Verification

The direct characterization gate is:

```bash
mix test \
  test/product_compare/taxonomy \
  test/product_compare/ingestion/enrichment_test.exs
```

It currently passes 13 tests. Completion also requires `mix typecheck`,
`mix format --check-formatted`, `mix work_queue.validate`, `mix ci`,
`git diff --check`, and a caller scan proving that application code does not
bypass the facade.

## Non-Goals

- No schema, migration, GraphQL, catalog-filter, ingestion-enrichment, SEO,
  frontend, taxonomy, or category policy changes.
- No generic repository, callback, protocol, adapter, or catch-all
  implementation layer.
- No separate queue row per internal module; all four slices share one stable
  taxonomy contract and one reviewer decision.
