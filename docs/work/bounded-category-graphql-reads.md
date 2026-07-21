# Bounded Category GraphQL Reads

## Snapshot

- Status: complete on `codex/bounded-graphql-read-budgets`
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-category-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-21 against the public category resolver, SEO category
  qualification query, category GraphQL suite, and Dataloader coverage.

## Batch Outcome

Aliased public `category(slug:)` reads and their nested qualified-product
connections keep fixed SELECT budgets as category parent count grows, without
changing category qualification, shared-time, ordering, Relay, SEO, or
missing-category behavior.

## Initial Evidence

- `SeoResolver.category/3` calls `Seo.get_category/1` once per aliased category,
  and that context function performs one taxon lookup plus one qualified-product
  aggregate for every slug.
- `SeoResolver.category_products/3` executes one qualified-product connection
  query for every returned category parent.
- Existing coverage proves one category's qualification, metadata, and product
  connection semantics but does not prove a growing alias query budget.

## Internal Slices

1. Set-based indexable-category lookup and qualification counts at one shared
   timestamp.
2. Parent-partitioned qualified-product Relay pages.
3. Request-scoped Dataloader integration with semantic and fixed-budget
   coverage.

## Boundaries

- Preserve `seo_indexable` gating and the three-qualified-product threshold.
- Preserve product qualification, name/ID ordering, and one shared category
  observation time per request batch.
- Preserve Relay validation, edges, `pageInfo`, metadata, and missing-category
  behavior.
- Do not change the public GraphQL schema.

## Verification

- SEO context parity tests.
- SEO surface and growing-alias Dataloader tests.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

## Completion Evidence

- Before batching, two category aliases plus one valid missing-category lookup
  issued `%{taxons: 3, products: 4}` SELECTs; four aliases plus the same
  missing lookup issued `%{taxons: 5, products: 8}`.
- After batching, both request sizes issue exactly `%{taxons: 1, products: 2}`:
  one set-based indexable-taxon lookup, one grouped qualification-count read,
  and one parent-partitioned qualified-product page read. The two product
  queries remain fixed as aliases grow.
- SEO context coverage proves empty, duplicate, missing, blank, non-indexable,
  below-threshold, and qualified category parity. The set-based lookup remains
  at two SELECTs for both two and four requested category slugs.
- Parent-partitioned page coverage preserves descendant inclusion,
  qualification filtering, name/ID order, missing-parent empty pages,
  one-row lookahead, and first plus advanced Relay cursor parity with the
  existing single-category query, all in one SELECT per window.
- GraphQL coverage asserts category identity and values, qualification counts,
  metadata and structured data, product edges and order, cursors, `pageInfo`,
  and missing-category `nil` behavior. One request-scoped observation timestamp
  flows from the lookup batch into every nested page batch key.
- Focused verification passed 20 tests across `seo_test.exs`,
  `seo_surfaces_test.exs`, and `dataloader_batching_test.exs`; typecheck,
  formatting, queue validation with three ready rows, and diff hygiene passed.
- `mix ci` passed 836 backend tests with 83.64% coverage, Credo with no issues,
  the 6/6 ExDNA clone budget, cross-function smell detection, Dialyzer, Relay
  validation, TypeScript, 1,507 frontend tests across 105 files, client and SSR
  builds, and the 182,164-byte gzip client-bundle budget.

## Remaining Work

None. Public slug, public opaque-key, and comparison-evidence read-budget
outcomes remain ready in the live queue.
