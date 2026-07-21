# Bounded Category GraphQL Reads

## Snapshot

- Status: ready
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

## Ready Evidence

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
