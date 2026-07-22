# GraphQL Schema Type Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep one stable GraphQL schema facade while moving its 151 type,
input, enum, and interface definitions into focused Absinthe notation modules
without changing the generated SDL or runtime behavior.

**Architecture:** `ProductCompareWeb.Schema` retains root query/mutation
operations, context construction, plugins, and imports. Five
`ProductCompareWeb.Schema.Types.*` notation modules own shared/account,
commerce, catalog, and trust/community declarations by domain. The exact SDL
snapshot is the primary compatibility oracle; focused and full GraphQL suites
prove resolver, Dataloader, authorization, and value parity.

**Tech Stack:** Elixir, Absinthe, Dataloader, ExUnit.

## Global Constraints

- Preserve `assets/schema.graphql` byte for byte; do not regenerate or edit it.
- Preserve every GraphQL type name, field name, description, argument,
  nullability marker, interface implementation, enum value, resolver callback,
  and Dataloader source.
- Keep `query`, `mutation`, `context/1`, and `plugins/0` in
  `ProductCompareWeb.Schema`.
- New files use `Absinthe.Schema.Notation` and own declarations by domain, not
  by arbitrary line count.
- Do not change resolver, domain, database, authorization, or frontend code.

---

### Task 1: Atomic Domain Type Extraction

**Files:**

- Create: `lib/product_compare_web/schema/types/common.ex`
- Create: `lib/product_compare_web/schema/types/accounts.ex`
- Create: `lib/product_compare_web/schema/types/commerce.ex`
- Create: `lib/product_compare_web/schema/types/catalog.ex`
- Create: `lib/product_compare_web/schema/types/trust.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `test/product_compare_web/graphql/schema_snapshot_test.exs`

**Interfaces:** Each new module uses `Absinthe.Schema.Notation` and defines each
owned declaration exactly once. `Common` owns Relay and cross-domain metadata;
`Accounts` owns user, API-token, and browser-auth declarations; `Commerce` owns
affiliate, revenue, merchant, offer, price, coupon, and ingestion-review
declarations; `Catalog` owns product, filter, recommendation, saved-comparison,
and comparison-snapshot declarations; and `Trust` owns source-artifact,
correction, watch, alert, review, Q&A, report, and moderation declarations.

This extraction is atomic. Absinthe accumulates notation-module imports before
facade-local notation, while the historical schema interleaves the five
domains. Ordered, non-overlapping selective imports across all five modules are
therefore required to preserve the byte-for-byte SDL.

- [ ] Add a module-boundary characterization asserting all five notation
  modules load while the full generated SDL still equals
  `assets/schema.graphql`; run it before creating the modules and confirm RED.

  ```elixir
  for module <- [
        ProductCompareWeb.Schema.Types.Common,
        ProductCompareWeb.Schema.Types.Accounts,
        ProductCompareWeb.Schema.Types.Commerce,
        ProductCompareWeb.Schema.Types.Catalog,
        ProductCompareWeb.Schema.Types.Trust
      ] do
    assert Code.ensure_loaded?(module)
  end

  assert File.read!(schema_path) == Absinthe.Schema.to_sdl(ProductCompareWeb.Schema)
  ```

- [ ] Create the five notation modules with only the aliases and `dataloader/2`
  import required by the declarations they own:

  ```elixir
  defmodule ProductCompareWeb.Schema.Types.Common do
    use Absinthe.Schema.Notation
  end
  ```

- [ ] Move all 151 owned declarations intact and delete only their originals.
- [ ] Add ordered, non-overlapping selective imports that cover every moved
  declaration once and preserve the exact generated SDL.
- [ ] Assert `ProductCompareWeb.Schema` retains root query/mutation operations,
  `context/1`, and `plugins/0`, while the complete SDL snapshot remains exact.
- [ ] Run the combined focused gate: `mix test
  test/product_compare_web/graphql/schema_snapshot_test.exs
  test/product_compare_web/graphql/api_token_auth_test.exs
  test/product_compare_web/graphql/affiliate_workflows_test.exs
  test/product_compare_web/graphql/commerce_revenue_summary_test.exs
  test/product_compare_web/graphql/pricing_queries_test.exs
  test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
  test/product_compare_web/graphql/catalog_queries_test.exs
  test/product_compare_web/graphql/catalog_filter_metadata_test.exs
  test/product_compare_web/graphql/recommendations_test.exs
  test/product_compare_web/graphql/saved_comparisons_test.exs
  test/product_compare_web/graphql/comparison_snapshots_test.exs
  test/product_compare_web/graphql/source_artifact_query_test.exs
  test/product_compare_web/graphql/specification_corrections_test.exs
  test/product_compare_web/graphql/price_watches_and_alerts_test.exs
  test/product_compare_web/graphql/community_content_test.exs` and confirm
  the boundary plus SDL and behavior are green.
- [ ] Commit with message `refactor: extract graphql schema types`.

### Task 2: Schema Decomposition Batch Gate

**Files:**

- Modify: `docs/work/graphql-schema-type-decomposition.md`

**Interfaces:** The lane doc records the final schema-facade line count, module
ownership, unchanged SDL checksum, and exact verification results.

- [ ] Run `mix test test/product_compare_web/graphql`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Record exact module boundaries, SDL evidence, and test counts in the lane
  doc, bundled into the final code/test milestone commit.
