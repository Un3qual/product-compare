# Bounded Category GraphQL Reads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep public category lookup, qualification, and nested product reads
fixed as one GraphQL request grows from one category alias to many.

**Architecture:** SEO exposes set-based indexable-category lookups with
qualified-product counts plus parent-partitioned qualified-product pages. A
request-scoped KV Dataloader shares one observation timestamp across category
lookups and groups equal Relay arguments across category parents while
returning the existing public category and connection shapes.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve `seo_indexable` gating and the three-qualified-product threshold.
- Preserve the current product qualification policy and name/ID ordering.
- Preserve one shared observation timestamp for category qualification and
  product-page reads within the request batch.
- Preserve Relay cursor validation, page-size limits, edges, and `pageInfo`.
- Preserve SEO metadata and missing-category `nil` behavior.
- Keep the public GraphQL schema unchanged.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Set-Based Category Qualification

**Files:**

- Modify: `lib/product_compare/seo.ex`
- Modify: `test/product_compare/seo_test.exs`

**Interfaces:**

- Add a set-based SEO API that accepts unique category slugs plus one `now` and
  returns indexable category maps keyed by slug, including zero qualification
  counts and the existing threshold-derived `indexable` value.
- Return missing, blank, duplicate, and non-indexable slugs without extra
  queries or accidental category exposure.

- [ ] Add failing parity tests for empty input, duplicate and missing slugs,
  non-indexable taxons, below-threshold categories, and qualified categories.
- [ ] Run the focused SEO tests and confirm the batch API is absent.
- [ ] Implement bounded taxon and grouped qualification-count queries using one
  supplied timestamp.
- [ ] Compare every returned category map with `Seo.get_category/2` at the same
  timestamp and prove the SELECT count is independent of slug count.
- [ ] Commit with message `perf: batch category qualification reads`.

### Task 2: Parent-Partitioned Category Product Pages

**Files:**

- Modify: `lib/product_compare/seo.ex`
- Modify: `test/product_compare/seo_test.exs`

**Interfaces:**

- Add a set-based SEO page API keyed by requested category taxon ID that accepts
  one shared `now` plus the normalized forward Relay window.
- Preserve descendant inclusion, product qualification, ascending product
  name/ID order, independent parent windows, one-row lookahead, and empty pages.

- [ ] Add failing parity tests for empty input, missing IDs, ancestor/descendant
  categories, qualification filtering, first-page truncation, and advancing
  cursors.
- [ ] Run the focused SEO tests and confirm the page API is absent.
- [ ] Implement one windowed query partitioned by category taxon ID.
- [ ] Compare each page with the existing single-category product query.
- [ ] Commit with message `perf: batch category product connection reads`.

### Task 3: Request-Scoped Category Dataloader

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/seo_resolver.ex`
- Modify: `test/product_compare_web/graphql/seo_surfaces_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:**

- Register one category KV source with lookup and product-page batch keys.
- Resolve `category(slug:)` and `Category.products` through that source while
  retaining the shared category timestamp in the nested page batch key.

- [ ] Add a failing GraphQL query that grows from two category aliases to four
  and captures taxon plus qualified-product SELECTs.
- [ ] Assert category values, qualification counts, metadata, product edges,
  order, cursors, `pageInfo`, and missing-category behavior before the budget.
- [ ] Prove lookup/count/product-page budgets stay identical as aliases grow.
- [ ] Register the source and delegate both resolvers through `on_load/2`.
- [ ] Re-run SEO surface and Dataloader suites.
- [ ] Commit with message `perf: bound category graphql reads`.

### Task 4: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-category-graphql-reads.md`

- [ ] Record before/after query counts and semantic parity coverage.
- [ ] Run `mix test test/product_compare/seo_test.exs
  test/product_compare_web/graphql/seo_surfaces_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.
