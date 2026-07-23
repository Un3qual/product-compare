# SEO Context Decomposition Design

## Goal

Keep `ProductCompare.Seo` as the stable application-facing context while moving
metadata, category qualification, and sitemap implementations into focused
internal modules without changing qualification policy or public contracts.

## Current Boundary

The 603-line facade currently owns three distinct responsibilities:

1. Product, merchant, category, and comparison-snapshot metadata plus factual
   structured-data projection.
2. Curated category lookup and qualified descendant-product queries/pages.
3. Bounded product, merchant, category, and public-comparison sitemap entries.

Controllers, resolvers, GraphQL loaders, comparison snapshots, and tests use
`ProductCompare.Seo` as the public boundary and continue to do so after the
extraction.

## Architecture

- `ProductCompare.Seo.Metadata` owns product, merchant, category, and snapshot
  metadata, shared metadata construction, structured data, copy fallbacks,
  image selection, offer/rating projection, and snapshot qualification.
- `ProductCompare.Seo.Categories` owns category lookup, batched lookup,
  descendant-product qualification, counts, deterministic ordering, and
  parent-scoped connection pages.
- `ProductCompare.Seo.Sitemaps` owns bounded sitemap entry dispatch and the
  product, merchant, category, and comparison qualification queries.
- `ProductCompare.Seo` retains every public function, default argument,
  typespec, result, map shape, and explicit wrapper.

Internal modules may reuse one another through explicit functions where the
current behavior already shares qualification facts. Application callers must
continue to depend only on the facade.

## Preserved Behavior

- Exact titles, descriptions, canonical paths, image selection, indexability,
  and structured-data values.
- Accepted-specification, adequate-copy, fresh-offer, merchant-coverage,
  category, public-snapshot, and revocation qualification policy.
- Category descendant inclusion, qualification time, counts, ordering, Relay
  pagination, missing-category results, and batched query budgets.
- Sitemap kinds, bounds, partition order, paths, last-modified values, and
  omission of thin, stale, private, or revoked surfaces.
- Existing schemas, migrations, GraphQL SDL, controller behavior, frontend
  metadata contracts, and product policy.

## Errors And Data Flow

The extraction does not add transactions or rescues. Existing function clauses,
nil results, invalid-kind behavior, query construction, and map fallbacks remain
unchanged. Metadata continues to obtain offer truth and review evidence through
the current public contexts.

## Verification

The characterization gate is:

```bash
mix test \
  test/product_compare/seo_test.exs \
  test/product_compare_web/controllers/seo_controller_test.exs \
  test/product_compare_web/graphql/seo_surfaces_test.exs
```

It currently passes 13 tests. Completion also requires `mix typecheck`,
`mix format --check-formatted`, `mix work_queue.validate`, `mix ci`,
`git diff --check`, and a caller scan proving the three internal owners are not
used outside the facade and their own implementation files.

## Non-Goals

- No new SEO surface, metadata copy, qualification threshold, sitemap kind,
  schema, migration, GraphQL field, controller route, or frontend behavior.
- No generic policy callback or renamed catch-all implementation module.
- No separate queue row per internal module; metadata, categories, and
  sitemaps are internal slices of one SEO contract.
