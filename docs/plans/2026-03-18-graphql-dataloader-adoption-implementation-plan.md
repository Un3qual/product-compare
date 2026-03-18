# GraphQL Dataloader Adoption Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace resolver-local association and price lookups in the Elixir GraphQL API with Dataloader-backed batching so the schema keeps the same contract while avoiding N+1 queries on product and pricing surfaces.

**Architecture:** Introduce a request-scoped loader in the Absinthe context, register Dataloader middleware in the schema, and move nested GraphQL field resolution onto batched sources instead of eager preloads and per-node `latest_price` calls. Keep the public GraphQL contract unchanged, keep auth/session context untouched, and limit the rewrite to the fields that fan out today: `product.brand`, `merchant_product.merchant`, `merchant_product.product`, and `merchant_product.latest_price`. Use focused GraphQL tests plus a batching regression test to prove the request shape stays bounded.

**Tech Stack:** Elixir, Phoenix, Absinthe, Dataloader, Ecto, ExUnit

---

### Task 1: Add request-scoped Dataloader plumbing

**Files:**
- Create: `lib/product_compare_web/graphql/loader.ex`
- Modify: `mix.exs`
- Modify: `mix.lock`
- Modify: `lib/product_compare_web/plugs/put_absinthe_context.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Test: `test/product_compare_web/plugs/put_absinthe_context_test.exs`

**Step 1: Write the failing test**

Write a plug test that builds a conn, runs `PutAbsintheContext.call/2`, and asserts the Absinthe options/context include a loader entry while preserving `current_user`, `api_token`, `session_user_token`, and `trusted_request_origin?`.

Run: `mix test test/product_compare_web/plugs/put_absinthe_context_test.exs`

Expected: FAIL because nothing constructs or stores a Dataloader yet.

**Step 2: Add the loader implementation**

Create a small loader module that builds a request-scoped Dataloader with Ecto-backed sources for catalog and pricing data. Keep it isolated so future resolvers can load from the same request-local loader without duplicating query code.

**Step 3: Wire the loader into Absinthe**

Update `PutAbsintheContext` to add `:loader` to the Absinthe context and register the loader middleware in `ProductCompareWeb.Schema` so fields can opt into batched loading without touching the auth/session plug chain.

**Step 4: Re-run the focused test**

Run: `mix test test/product_compare_web/plugs/put_absinthe_context_test.exs`

Expected: PASS.

**Step 5: Commit**

Run: `git add mix.exs mix.lock lib/product_compare_web/graphql/loader.ex lib/product_compare_web/plugs/put_absinthe_context.ex lib/product_compare_web/schema.ex test/product_compare_web/plugs/put_absinthe_context_test.exs`

Run: `git commit -m "feat(graphql): add dataloader request plumbing"`

### Task 2: Batch the hot GraphQL field paths

**Files:**
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Modify: `lib/product_compare/catalog.ex`
- Modify: `lib/product_compare/pricing.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Test: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Test: `test/product_compare_web/graphql/pricing_queries_test.exs`

**Step 1: Write the failing GraphQL regression tests**

Add cases that request multiple products and multiple merchant products in one GraphQL response, then assert the nested `brand`, `merchant`, `product`, and `latestPrice` fields still match the current payload shape. Add a query-count or request-bounded regression check so the test fails while those fields still resolve through eager preloads or per-node lookups.

Run: `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`

Expected: FAIL because the code still performs direct association preloads and `Pricing.latest_price/1` calls per parent.

**Step 2: Move the field resolvers onto Dataloader**

Replace the direct field-level lookups with loader-backed resolution. Keep the public field names and pagination behavior stable, but stop doing one `latest_price` query per merchant product and stop relying on resolver-local eager preloads for nested association access where batching is available.

**Step 3: Trim GraphQL-only eager loading where it is now redundant**

If a GraphQL code path no longer needs a preload because Dataloader handles the nested field, remove that preload from the GraphQL-specific query helper or resolver. Leave non-GraphQL callers intact if they rely on the eager-loaded shape directly.

**Step 4: Re-run the focused GraphQL tests**

Run: `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`

Expected: PASS.

**Step 5: Commit**

Run: `git add lib/product_compare_web/resolvers/catalog_resolver.ex lib/product_compare_web/resolvers/pricing_resolver.ex lib/product_compare/catalog.ex lib/product_compare/pricing.ex lib/product_compare_web/schema.ex test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`

Run: `git commit -m "feat(graphql): batch product pricing fields"`

### Task 3: Lock the batching behavior and verify no API regressions

**Files:**
- Create: `test/product_compare_web/graphql/dataloader_batching_test.exs`
- Modify: `docs/work/graphql-dataloader-adoption.md`

**Step 1: Write the batching regression test**

Add a request-level test that captures SQL query count for a GraphQL response with several product and merchant-product nodes. Keep the assertion strict enough to catch a regression back to per-node lookups, but narrow enough that it does not depend on unrelated query noise.

Run: `mix test test/product_compare_web/graphql/dataloader_batching_test.exs`

Expected: FAIL until the batching assertion is in place.

**Step 2: Finalize the doc state**

Update the work doc only if the implementation scope changes while you execute the plan. Keep the work doc aligned with the actual batching surface instead of broadening it to every resolver in the schema.

**Step 3: Run the final verification sweep**

Run:
- `mix test test/product_compare_web/graphql/dataloader_batching_test.exs`
- `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`
- `mix test test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`

Expected: PASS

**Step 4: Commit**

Run: `git add test/product_compare_web/graphql/dataloader_batching_test.exs docs/work/graphql-dataloader-adoption.md`

Run: `git commit -m "test(graphql): lock dataloader batching"`
