# SEO Context Decomposition

## Snapshot

- Status: active
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-seo-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the direct SEO, SEO controller, and SEO
  GraphQL characterization suites.

## Target Outcome

`ProductCompare.Seo` remains the stable application-facing context while
metadata, category qualification, and sitemap implementations move into
focused internal modules with unchanged public APIs, qualification policy,
query behavior, errors, controllers, and GraphQL values.

## Ready Evidence

- `lib/product_compare/seo.ex` is 603 lines and owns metadata/structured data,
  category qualification/pages, and bounded sitemap generation.
- Controllers, resolvers, loaders, snapshots, and tests already use the stable
  context boundary, so extraction does not require caller changes.
- The selected three-suite characterization gate passed 13 tests on 2026-07-22.
- Metadata, category qualification, and sitemap generation share one SEO
  acceptance boundary and remain internal slices rather than micro-batches.
- The row is path-disjoint from Accounts, Ingestion, and Pricing decomposition.

## Internal Slices

1. Product, merchant, category, and snapshot metadata ownership.
2. Category lookup, qualification, counts, ordering, and page ownership.
3. Bounded sitemap dispatch, query, and entry ownership.

## Boundaries

- Preserve every public function, default, typespec, value, map shape, and
  error.
- Preserve metadata copy, paths, structured data, qualification, ordering,
  Relay windows, sitemap bounds, and omission policy.
- Keep application callers dependent only on `ProductCompare.Seo`.
- Do not change schemas, migrations, GraphQL SDL, controller routes, frontend
  metadata contracts, or product policy.

## Verification

- `mix test test/product_compare/seo_test.exs test/product_compare_web/controllers/seo_controller_test.exs test/product_compare_web/graphql/seo_surfaces_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
