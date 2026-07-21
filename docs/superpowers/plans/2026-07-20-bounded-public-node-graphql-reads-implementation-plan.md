# Bounded Public Node GraphQL Reads Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep public Relay `node(id:)` lookup query counts fixed per public
schema as the number of aliases in one GraphQL request grows.

**Architecture:** `NodeResolver` will keep the existing public type allowlist
and global-ID validation, but public records will resolve through the existing
request-scoped Catalog and Pricing Dataloader Ecto sources instead of direct
per-alias context lookups. Product, Brand, Merchant, MerchantProduct,
PricePoint, and SourceArtifact inputs batch independently by schema; the
existing Pricing loader query retains SourceArtifact source preloading.

**Tech Stack:** Elixir, Absinthe, Dataloader.Ecto, Ecto, ExUnit.

## Global Constraints

- Keep the public GraphQL schema and supported public node type allowlist
  unchanged.
- Preserve invalid and unsupported ID errors and valid missing-node `nil`
  behavior.
- Preserve every existing public node field value and SourceArtifact source
  preloading.
- Do not change operator or owner-scoped node authorization behavior.
- Query counts may scale with distinct public schemas requested, never with
  alias count for the same schema.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Characterize Growing Public Node Alias Budgets

**Files:**

- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`
- Verify: `test/product_compare_web/graphql/node_query_test.exs`

**Interfaces:** The budget regression issues one mixed public-node request with
Product, Brand, Merchant, MerchantProduct, PricePoint, and SourceArtifact
aliases. It compares a small alias set with a larger set and counts SELECTs for
`products`, `brands`, `merchants`, `merchant_products`, `price_points`, and
`source_artifacts` using `capture_select_queries/1`.

- [ ] Add fixtures for at least three records of every public node schema,
  including PricePoints and SourceArtifacts with safe source metadata.
- [ ] Add small and grown GraphQL documents whose aliases request the same
  identifying fields already covered by `node_query_test.exs`.
- [ ] Assert semantic parity for all six `__typename` and ID projections, valid
  missing nodes returning `nil`, and source-backed SourceArtifact fields.
- [ ] Record per-table SELECT counts for the small and grown documents.
- [ ] Run
  `mix test test/product_compare_web/graphql/dataloader_batching_test.exs`
  and confirm RED because same-schema SELECT counts grow with alias count.
- [ ] Commit only after the production task turns this regression green.

### Task 2: Route Public Node Lookups Through Request-Scoped Dataloader

**Files:**

- Modify: `lib/product_compare_web/resolvers/node_resolver.ex`
- Verify or modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:** Map public node types to existing Dataloader Ecto batch tuples:

- `:product` -> `{Catalog, {:one, Product}}`
- `:brand` -> `{Catalog, {:one, Brand}}`
- `:merchant` -> `{Pricing, {:one, Merchant}}`
- `:merchant_product` -> `{Pricing, {:one, MerchantProduct}}`
- `:price_point` -> `{Pricing, {:one, PricePoint}}`
- `:source_artifact` -> `{Pricing, {:one, SourceArtifact}}`

Each load uses `id: local_id` and resolves with `on_load/2`. The existing
`Loader.pricing_query(SourceArtifact, _params)` preload remains authoritative.

- [ ] Import `Absinthe.Resolution.Helpers.on_load/2` and alias the six schemas.
- [ ] Change only the public branch of `node/3` to return the asynchronous
  Dataloader result; retain the current operator and owner-scoped synchronous
  branches and shared error mapping.
- [ ] Load each valid public type through its mapped source/queryable pair and
  return `{:ok, record_or_nil}` from `Dataloader.get/4`.
- [ ] Re-run the growing-alias regression and confirm one SELECT per requested
  public schema at both sizes.
- [ ] Run `mix test test/product_compare_web/graphql/node_query_test.exs` and
  confirm all existing allowlist, value, missing-node, malformed-ID, operator,
  owner, and SourceArtifact behaviors pass.
- [ ] Commit with message `perf: batch public graphql node lookups`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-public-node-graphql-reads.md`

- [ ] Record exact before/after query counts and the public-node semantic cases
  covered by the focused suites.
- [ ] Run
  `mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.
