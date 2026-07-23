# Catalog Context Decomposition Design

## Goal

Keep `ProductCompare.Catalog` as the stable application-facing context while
moving product/brand lifecycle, product evidence, and saved-comparison
implementations into focused internal modules without changing product
behavior or public contracts.

## Current Boundary

The 482-line facade currently owns four distinct responsibilities:

1. Product and brand persistence, product lookup, canonical slug history, and
   primary-type validation.
2. Validated product-identifier reads and product-media persistence and reads.
3. Owner-scoped saved-comparison creation, lookup, ordering, and deletion.
4. Catalog list and filter entry points over the existing focused `Filtering`
   and `FilterMetadata` owners.

The context facade remains the only public entry point used by ingestion,
taxonomy, recommendations, SEO, GraphQL loaders/resolvers, fixtures, and tests.

## Architecture

- `ProductCompare.Catalog.Products` owns brand persistence, product
  persistence, primary-type validation, ID and slug reads, canonical slug
  history, and ordered product listing.
- `ProductCompare.Catalog.Evidence` owns product identifiers and product media,
  including validation, conflict behavior, source-artifact preloads, and
  deterministic ordering.
- `ProductCompare.Catalog.SavedComparisons` owns owner-scoped saved-set
  creation, item persistence, queries, entropy-ID lookup, preloads, ordering,
  validation, and deletion.
- Existing `ProductCompare.Catalog.Filtering` and
  `ProductCompare.Catalog.FilterMetadata` remain the focused filter owners.
- `ProductCompare.Catalog` retains every existing public function, guard,
  typespec, result, error, and explicit wrapper.

Internal modules may collaborate directly where the current implementation
already crosses these responsibilities, but application callers must continue
to depend only on the facade.

## Preserved Behavior

- Brand create/upsert changesets, name conflict target, returned values, and
  timestamp behavior.
- Product create/update validation, type-taxon guardrails, slug reservation,
  historical-slug lookup, transaction behavior, invalid-ID handling, and
  batched lookup ordering.
- Identifier validation status filtering, identifier ordering, media conflict
  target, accepted/rejected counts, media ordering, and source preloads.
- Saved-comparison product-count and uniqueness rules, transaction atomicity,
  item position, owner scope, entropy-ID validation, query ordering, preloads,
  deletion behavior, and error values.
- Existing catalog filters, metadata, schemas, migrations, GraphQL SDL,
  ingestion behavior, taxonomy policy, and frontend contracts.

## Errors And Transactions

The extraction preserves the existing `Repo.transaction` around product slug
updates and the existing `Ecto.Multi` transaction around saved-comparison
creation. Changeset errors, domain atoms, exceptions, invalid-input function
clauses, stale-delete handling, and missing-result behavior remain unchanged.
No new fallback, callback dispatch, rescue boundary, or public module is
introduced.

## Verification

The characterization gate is:

```bash
mix test \
  test/product_compare/catalog \
  test/product_compare_web/graphql/catalog_queries_test.exs \
  test/product_compare_web/graphql/catalog_filter_metadata_test.exs \
  test/product_compare_web/graphql/saved_comparisons_test.exs \
  test/product_compare_web/graphql/node_query_test.exs
```

It currently passes 106 tests. Completion also requires `mix typecheck`,
`mix format --check-formatted`, `mix work_queue.validate`, `mix ci`,
`git diff --check`, and a caller scan proving the three new internal owners are
not used outside the facade and their own implementation files.

## Non-Goals

- No query-budget redesign, schema or migration changes, GraphQL changes,
  frontend changes, catalog-policy changes, new ingestion behavior, or
  taxonomy work.
- No rewrite of the already-focused `Filtering` or `FilterMetadata` modules.
- No generic repository, callback, adapter, or catch-all implementation layer.
- No separate queue row per internal module; the slices share one stable
  Catalog contract and one reviewer decision.
