# Bounded Public Slug GraphQL Reads Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep public product and merchant slug lookups fixed as one GraphQL
request grows from one aliased entry-point read to many.

**Architecture:** Catalog and Pricing expose set-based slug lookup APIs keyed
by every requested normalized slug. A request-scoped KV Dataloader batches
product and merchant entry-point reads separately, while the product batch
preserves canonical-slug precedence over historical aliases and both resolvers
return the existing entity or `nil` shapes.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve canonical product-slug precedence over historical aliases.
- Preserve merchant canonical-slug identity.
- Preserve blank, missing, duplicate, and invalid slug behavior.
- Preserve product cache clearing and all nested Dataloader behavior.
- Keep the public GraphQL schema unchanged.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Set-Based Product Slug Lookup

**Files:**

- Modify: `lib/product_compare/catalog.ex`
- Create: `test/product_compare/catalog/product_lookup_test.exs`

**Interfaces:**

- Add `Catalog.get_products_by_slugs/1`, accepting a list of slug terms and
  returning every requested valid unique slug mapped to its canonical product,
  historical-alias product, or `nil`.
- Make `Catalog.get_product_by_slug/1` delegate through the batch API so
  canonical and historical lookup behavior cannot drift.

- [ ] Add failing parity tests for empty input, duplicate, blank, missing,
  canonical, and historical slugs plus canonical precedence.
- [ ] Run the focused lookup test and confirm the batch API is absent.
- [ ] Implement bounded canonical and historical-alias reads with canonical
  precedence and no query for empty input.
- [ ] Compare every result with the existing single-slug contract and prove the
  SELECT count is independent of requested slug count.
- [ ] Commit with message `perf: batch public product slug reads`.

### Task 2: Set-Based Merchant Slug Lookup

**Files:**

- Modify: `lib/product_compare/pricing.ex`
- Modify: `test/product_compare/pricing/pricing_test.exs`

**Interfaces:**

- Add `Pricing.get_merchants_by_slugs/1`, accepting a list of slug terms and
  returning every requested valid unique slug mapped to its merchant or `nil`.
- Make `Pricing.get_merchant_by_slug/1` delegate through the batch API.

- [ ] Add failing parity tests for empty input, duplicate, blank, missing, and
  canonical merchant slugs.
- [ ] Run the focused Pricing tests and confirm the batch API is absent.
- [ ] Implement one bounded merchant query and fill every requested slug.
- [ ] Compare every result with the existing single-slug contract and prove the
  SELECT count is independent of requested slug count.
- [ ] Commit with message `perf: batch public merchant slug reads`.

### Task 3: Request-Scoped Public Slug Dataloader

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Modify: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Modify: `test/product_compare_web/graphql/merchant_detail_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:**

- Register one public slug KV source with separate product and merchant batch
  keys and use each normalized slug string as the Dataloader item.
- Resolve `product(slug:)` and `merchant(slug:)` through that source while
  preserving `nil` results and the product resolver's request-local cache
  reset.

- [ ] Add a failing GraphQL query that grows from two product and merchant
  aliases to four of each and captures product, alias, merchant, and nested
  association SELECTs.
- [ ] Assert exact IDs, slugs, canonical/history behavior, nested fields, and
  missing results before asserting the query budget.
- [ ] Prove product and merchant lookup budgets stay identical as aliases grow.
- [ ] Register the source and delegate both resolvers through `on_load/2`.
- [ ] Re-run catalog, merchant-detail, and Dataloader suites.
- [ ] Commit with message `perf: bound public slug graphql reads`.

### Task 4: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-public-slug-graphql-reads.md`

- [ ] Record before/after query counts and semantic parity coverage.
- [ ] Run `mix test test/product_compare/catalog/product_lookup_test.exs
  test/product_compare/pricing/pricing_test.exs
  test/product_compare_web/graphql/catalog_queries_test.exs
  test/product_compare_web/graphql/merchant_detail_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.
