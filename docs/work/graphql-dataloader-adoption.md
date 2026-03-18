# GraphQL Dataloader Adoption Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-18 against the current working tree
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-18-graphql-dataloader-adoption-implementation-plan.md`
- Definition of done:
  - The Elixir GraphQL API uses a request-scoped Dataloader in the Absinthe context and schema.
  - `product.brand`, `merchant_product.merchant`, `merchant_product.product`, and `merchant_product.latest_price` are resolved through batched loads rather than per-node queries.
  - GraphQL tests cover multi-node requests and catch regressions back to eager preloads or `latest_price/1` fan-out.
  - Browser-facing GraphQL auth behavior remains unchanged; no new REST endpoints or contract changes are introduced.

## Verified Current State

- `lib/product_compare_web/schema.ex` defines the existing GraphQL fields for `product`, `products`, `merchants`, `merchant_products`, and nested `merchant_product.latest_price`.
- `lib/product_compare_web/resolvers/catalog_resolver.ex` preloads `brand` when loading a single product and preloads `brand` in the `products` query path.
- `lib/product_compare_web/resolvers/pricing_resolver.ex` resolves `merchant_products` via `Pricing.list_merchant_products_query/1` and `merchant_product.latest_price` via `Pricing.latest_price/1` per parent node.
- `lib/product_compare_web/plugs/put_absinthe_context.ex` only injects auth/session data into Absinthe context today; there is no request-scoped loader.
- `lib/product_compare_web/router.ex` forwards `/api/graphql` through `Absinthe.Plug` with the existing auth/session plugs.
- `mix.lock` already shows Absinthe’s optional `dataloader` dependency, but `mix.exs` does not yet declare Dataloader as a direct app dependency.
- `docs/work/index.md` now queues this slice as the highest-priority active work item after the frontend Radix primitives batch completed.

## Next batch

### 1. Wire request-scoped Dataloader into GraphQL

**Files:**
- `mix.exs`
- `mix.lock`
- `lib/product_compare_web/graphql/loader.ex`
- `lib/product_compare_web/plugs/put_absinthe_context.ex`
- `lib/product_compare_web/schema.ex`
- `test/product_compare_web/plugs/put_absinthe_context_test.exs`

**Outcome:**
Every GraphQL request gets a loader in context and schema fields can opt into batching without disturbing auth/session plumbing.

**Verification:**
`mix test test/product_compare_web/plugs/put_absinthe_context_test.exs`

### 2. Batch the hot field paths

**Files:**
- `lib/product_compare_web/resolvers/catalog_resolver.ex`
- `lib/product_compare_web/resolvers/pricing_resolver.ex`
- `lib/product_compare/catalog.ex`
- `lib/product_compare/pricing.ex`
- `lib/product_compare_web/schema.ex`
- `test/product_compare_web/graphql/catalog_queries_test.exs`
- `test/product_compare_web/graphql/pricing_queries_test.exs`

**Outcome:**
The product and pricing graph stops doing one lookup per parent node for the fields that currently fan out.

**Verification:**
`mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`

### 3. Lock batching with regression coverage

**Files:**
- `test/product_compare_web/graphql/dataloader_batching_test.exs`
- `docs/work/graphql-dataloader-adoption.md`

**Outcome:**
A request-level test proves the batched graph stays bounded, and the work doc stays aligned with the actual implementation scope.

**Verification:**
`mix test test/product_compare_web/graphql/dataloader_batching_test.exs`

## Verification Commands

- `sed -n '1,240p' docs/work/index.md`
- `sed -n '1,260p' lib/product_compare_web/schema.ex`
- `sed -n '1,260p' lib/product_compare_web/resolvers/catalog_resolver.ex`
- `sed -n '1,260p' lib/product_compare_web/resolvers/pricing_resolver.ex`
- `sed -n '1,220p' lib/product_compare_web/plugs/put_absinthe_context.ex`
- `sed -n '1,220p' lib/product_compare_web/router.ex`
- `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`
- `mix test test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`
