# Bounded Catalog And Offer Discovery Root GraphQL Reads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reuse identical catalog, merchant-directory, and offer-discovery root
reads within one GraphQL request while preserving their current public values,
filters, pagination, validation, and nested data.

**Architecture:** One request-scoped KV Dataloader source keys root discovery
work by field kind, normalized filters, and Relay connection arguments. Root
resolvers validate inputs before scheduling a load; the source executes the
existing query or metadata projection once for each distinct key and returns
the unchanged resolver value. Direct resolver fallbacks remain available for
contexts without a loader.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve `products`, `productFilterMetadata`, `merchants`, and top-level
  `merchantProducts` GraphQL schema behavior.
- Preserve catalog filter validation, search, sorting, metadata selected state,
  Relay ID projection, ordering, pagination, and cursor/page-size errors.
- Preserve merchant-product product/merchant/active filters and nested
  merchant, product, price, coupon, history, and source-artifact values.
- Distinct normalized filters or connection arguments remain distinct reads;
  only identical request work is reused.
- Keep direct resolver fallbacks for contexts without a loader.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Catalog Root Read Reuse

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`
- Modify: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Modify: `test/product_compare_web/graphql/catalog_filter_metadata_test.exs`

**Interfaces:** `Loader.discovery_root_source/0` exposes a KV source. Catalog
loads use `{:products, normalized_filters, connection_args}` or
`{:product_filter_metadata, normalized_filters}` as the batch key and `:root`
as the request value.

- [x] Add a growing-alias regression that repeats identical `products` and
  `productFilterMetadata` selections two and four times.
- [x] Assert exact product edges, page info, filter metadata, selected state,
  and validation behavior before comparing SELECT budgets.
- [x] Run
  `mix test test/product_compare_web/graphql/dataloader_batching_test.exs`
  and confirm RED because every alias currently executes its reads directly.
- [x] Register `Loader.discovery_root_source/0` and implement the catalog batch
  keys by applying the existing normalized filters and connection projection:

  ```elixir
  batch_key = {:products, filters, connection_args}

  loader
  |> Dataloader.load(Loader.discovery_root_source(), batch_key, :root)
  |> on_load(fn loader ->
    {:ok, Dataloader.get(loader, Loader.discovery_root_source(), batch_key, :root)}
  end)
  ```

- [x] Route loader-backed catalog roots through the source after validation and
  retain the existing direct query and metadata calls as fallback clauses.
- [x] Re-run the batching, catalog-query, and catalog-filter-metadata suites and
  confirm the catalog slice is green.
- [x] Commit with message `perf: reuse catalog discovery root reads`.

### Task 2: Merchant And Offer Root Read Reuse

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`
- Modify: `test/product_compare_web/graphql/pricing_queries_test.exs`

**Interfaces:** Merchant loads use `{:merchants, connection_args}` and offer
loads use `{:merchant_products, normalized_input, connection_args}`. The same
source returns the existing Relay connection maps.

- [x] Extend the growing-alias regression with identical `merchants` and
  top-level `merchantProducts` selections at two and four aliases.
- [x] Assert exact edges, page info, filters, nested values, and invalid
  ID/cursor/page-size errors before query-budget assertions.
- [x] Run the regression and confirm RED because both root resolvers call
  `Connection.from_query_result/3` once per alias.
- [x] Route loader-backed merchant and offer roots through the discovery source
  after the existing input normalization:

  ```elixir
  batch_key = {:merchant_products, attrs, Input.connection_args(attrs)}

  loader
  |> Dataloader.load(Loader.discovery_root_source(), batch_key, :root)
  |> on_load(fn loader ->
    {:ok, Dataloader.get(loader, Loader.discovery_root_source(), batch_key, :root)}
  end)
  ```

- [x] Preserve the direct resolver clauses and prove identical two- and
  four-alias SELECT budgets while distinct arguments stay isolated.
- [x] Run the batching and pricing-query suites and confirm the full discovery
  batch is green.
- [x] Commit with message `perf: reuse offer discovery root reads`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-catalog-offer-discovery-root-graphql-reads.md`

**Interfaces:** The lane doc records the exact before/after budgets and the
semantic coverage that proves the optimization did not change the public API.

- [x] Record exact before/after SELECT counts for all four root fields.
- [x] Run `mix test test/product_compare_web/graphql/catalog_queries_test.exs
  test/product_compare_web/graphql/catalog_filter_metadata_test.exs
  test/product_compare_web/graphql/pricing_queries_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [x] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [x] Include lane evidence in the final code/test milestone commit.
