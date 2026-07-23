# SEO Context Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-seo-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the direct SEO, SEO controller, and SEO
  GraphQL characterization suites.

## Batch Outcome

`ProductCompare.Seo` remains the stable application-facing context while
metadata, category qualification, and sitemap implementations now live in
focused internal modules with unchanged public APIs, qualification policy,
query behavior, errors, controllers, and GraphQL values.

## Completion Evidence

- `lib/product_compare/seo.ex` is a 71-line facade retaining the original
  caller-facing functions, defaults, guards, typespecs, values, and errors.
- `ProductCompare.Seo.Metadata` owns product, merchant, category, and snapshot
  metadata, structured data, shared copy rules, and snapshot qualification.
- `ProductCompare.Seo.Categories` owns category reads, descendant-product
  qualification, counts, ordering, and bounded parent-scoped pages.
- `ProductCompare.Seo.Sitemaps` owns bounded product, merchant, category, and
  public-comparison sitemap dispatch and queries.
- A source scan found no application caller referencing the three internal
  owners; controllers, resolvers, loaders, and snapshots still use the facade.
- The first full CI run exposed one new ExDNA clone in the repeated public and
  internal page-validation heads. Keeping validation at the facade and passing
  normalized page values internally restored the unchanged 6/6 clone budget.

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

- Exact characterization gate: 13 tests, 0 failures.
- `mix typecheck`: passed.
- `mix format --check-formatted`: passed.
- `mix work_queue.validate`: passed with 3 ready rows.
- `mix ci`: passed Credo with 0 issues, Reach with no new findings, ExDNA at
  6/6, Dialyzer, 905 backend tests at 83.56% coverage, 1,507 frontend tests,
  Relay validation, TypeScript, client and SSR builds, and the bundle contract.
- `git diff --check`: passed.

## Remaining Work

None in this lane. Catalog, Comparison Snapshots, and Taxonomy Context
Decomposition remain ready in the live queue.
