# GraphQL Dataloader Adoption Work Doc

## Snapshot

- Status: completed on 2026-03-18
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-18 after GraphQL verification
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-18-graphql-dataloader-adoption-implementation-plan.md`
- Definition of done:
  - The Elixir GraphQL API uses a request-scoped Dataloader in the Absinthe context and schema.
  - `product.brand`, `merchant_product.merchant`, `merchant_product.product`, and `merchant_product.latest_price` are resolved through batched loads rather than per-node queries.
  - GraphQL tests cover multi-node requests and catch regressions back to eager preloads or `latest_price/1` fan-out.
  - Browser-facing GraphQL auth behavior remains unchanged; no new REST endpoints or contract changes are introduced.

## Final State

- `mix.exs` now declares `:dataloader` as a direct dependency and `mix.lock` resolves `dataloader 2.0.2`.
- `lib/product_compare_web/graphql/loader.ex` now builds request-scoped Ecto sources for `ProductCompare.Catalog` and `ProductCompare.Pricing`, including a custom `latest_price` batch for `PricePoint`.
- `lib/product_compare_web/plugs/put_absinthe_context.ex` now injects `:loader` into the Absinthe context while preserving `current_user`, `api_token`, `session_user_token`, and `trusted_request_origin?`.
- `lib/product_compare_web/schema.ex` now keeps a request-local loader in `context/1`, registers `Absinthe.Middleware.Dataloader` in `plugins/0`, and resolves `product.brand`, `merchant_product.merchant`, and `merchant_product.product` through Dataloader with parent-value reuse enabled.
- `test/product_compare_web/plugs/put_absinthe_context_test.exs` locks the loader presence and the existing auth/session/origin context shape.
- `lib/product_compare/catalog.ex` no longer preloads `brand` in `get_product_by_slug/1`, and `lib/product_compare_web/resolvers/catalog_resolver.ex` no longer joins/preloads `brand` in the GraphQL `products` query path.
- `lib/product_compare/pricing.ex` no longer preloads `merchant` and `product` in `list_merchant_products_query/1` and now exposes `latest_prices_query/2` for bounded latest-price batching.
- `lib/product_compare_web/resolvers/pricing_resolver.ex` now resolves `merchant_product.latest_price` through Dataloader instead of calling `Pricing.latest_price/1` per parent.
- `test/product_compare_web/graphql/catalog_queries_test.exs` and `test/product_compare_web/graphql/pricing_queries_test.exs` now lock the multi-node payload shape and request query counts for the batched field paths.
- `test/product_compare_web/graphql/dataloader_batching_test.exs` now locks a single request that touches aliased `product` selections plus `merchantProducts`, and asserts the relevant SQL stays bounded to three `products` selects plus one each for `brands`, `merchant_products`, `merchants`, and `price_points`.
- `lib/product_compare_web/router.ex` forwards `/api/graphql` through `Absinthe.Plug` with the existing auth/session plugs.
- `docs/work/index.md` now records this slice as completed and shows that no next active batch is queued.

## Completed

- Task 1 complete: request-scoped Dataloader plumbing now lives in the Absinthe context and schema without changing the existing auth/session context contract.
- Task 2 complete: the hot GraphQL field paths now resolve through Dataloader-backed batches instead of eager preloads or per-parent `latest_price/1` lookups.
- Task 3 complete: a request-level batching regression test now proves the combined product and pricing graph stays bounded and protects against regressions back to per-node queries.

## Closure

- This work item is complete.
- No next active batch is queued under `docs/work/index.md`.
- The repo-level fallback for creating the next plan remains blocked because `docs/plans/INDEX.md` and `ARCHITECTURE.md` are absent.

## Verification Commands

- `sed -n '1,240p' docs/work/index.md`
- `sed -n '1,260p' docs/work/graphql-dataloader-adoption.md`
- `sed -n '1,260p' lib/product_compare_web/schema.ex`
- `sed -n '1,260p' lib/product_compare_web/resolvers/catalog_resolver.ex`
- `sed -n '1,260p' lib/product_compare_web/resolvers/pricing_resolver.ex`
- `sed -n '1,220p' lib/product_compare_web/plugs/put_absinthe_context.ex`
- `sed -n '1,220p' lib/product_compare_web/router.ex`
- `mix test test/product_compare_web/graphql/dataloader_batching_test.exs`
- `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`
- `mix test test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`
