# NOW

## Current Batches

- Parallel mode note: this file is coordinator-owned whenever frontend and backend lanes run at the same time.

### Frontend Lane

- Status: ready
- Batch: Frontend Relay Route-Data Adoption, Task 3
- Source of truth: `docs/work/frontend-relay-route-data.md`
- Next step: migrate `/products/:slug` product detail and active offers to Relay-preloaded queries and remove the manual product route GraphQL wrapper.
- Why this batch is current:
  - Relay SSR hydration, bootstrap parsing, route-preload/context primitives, and the `/products` browse route migration now exist, so the next route can reuse the same pattern.
  - The frontend still ships `/products/:slug`, `/compare`, `/compare/saved`, and the auth flows on manual route-local GraphQL helpers.
  - `/compare/saved` and the compare-route shell/status follow-up now exist on top of that manual helper path, so Relay adoption remains the next unblocked slice before more compare-route polish resumes.
  - Keeping Relay route-data adoption active prevents the remaining compare/saved hardening from being split across two frontend data-layer patterns.

### Backend Lane

- Status: completed
- Batch: none queued
- Source of truth: `docs/work/graphql-relay-contract-hardening.md`
- Next step: no unblocked backend batch is queued from this worktree; coordinator follow-up can choose a future backend lane if priorities change.
- Why this batch is current:
  - The planned GraphQL Relay contract hardening tasks are complete and fully verified.
  - No next backend batch is currently queued, while the frontend Relay route-data lane remains active.
  - This keeps NOW accurate without inventing a new backend slice before it has been prioritized.

## Just Completed

- GraphQL Relay Contract Hardening, Task 3:
  - Closed `docs/work/graphql-relay-contract-hardening.md` after verifying the full planned node surface for public catalog/pricing nodes plus owner-scoped saved comparison sets and API tokens.
  - Verified `mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/api_token_auth_test.exs && mix typecheck`.
  - Marked the backend lane complete with no next backend batch queued from this worktree.

- GraphQL Relay Contract Hardening, Task 2:
  - Extended `lib/product_compare_web/resolvers/node_resolver.ex` and `lib/product_compare_web/schema.ex` so root `node(id: ID!)` now supports owner-scoped `SavedComparisonSet` and `ApiToken` nodes in addition to the public catalog/pricing types.
  - Added ownership-checked fetch helpers in `lib/product_compare/catalog.ex` and `lib/product_compare/accounts.ex`, and expanded `test/product_compare_web/graphql/node_query_test.exs` to cover owner success plus anonymous/cross-user null behavior.
  - Verified `mix test test/product_compare_web/graphql/node_query_test.exs` and `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/node_query_test.exs`.

- GraphQL Relay Contract Hardening, Task 1:
  - Added `lib/product_compare_web/resolvers/node_resolver.ex`, root `node(id: ID!)` schema support, and minimal catalog/pricing context helpers for public `Product`, `Brand`, `Merchant`, and `MerchantProduct` lookups.
  - Added `test/product_compare_web/graphql/node_query_test.exs` to cover the supported public node lookups plus malformed and unsupported ID handling.
  - Verified `mix test test/product_compare_web/graphql/node_query_test.exs` and `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/node_query_test.exs`.

- Frontend Relay Route-Data Adoption, Task 2:
  - Replaced `assets/src/routes/catalog/api.ts` with `assets/src/routes/catalog/loader.ts`, `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`, and generated `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts`.
  - Updated `assets/src/routes/catalog/browse.tsx` and `assets/src/router.tsx` so `/products` preloads and renders through Relay while preserving browse ready, empty, and unavailable states.
  - Extended `assets/src/relay/route-preload.ts` to reuse loader-created query refs and recreate them against the hydrated client Relay environment when needed.
  - Updated `assets/schema.graphql`, `assets/src/react-relay.d.ts`, and `assets/.gitignore` so the browse route compiles against Relay and its generated artifact can be tracked.
  - Verified `cd assets && bun run relay && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`, `cd assets && bun x vitest run src/relay/__tests__/route-preload.test.ts src/routes/catalog/__tests__/browse.route.test.tsx`, and `cd assets && bun run typecheck`.

- Frontend Relay Route-Data Adoption, Task 1:
  - Added `assets/src/relay/ssr.ts` to dehydrate the Relay store, render an HTML-safe non-executable `__relayRecords` bootstrap payload, and hydrate client environments from that payload.
  - Added `assets/src/relay/route-preload.ts` for route-query preload descriptors and React Router loader context access to the shared Relay environment.
  - Updated `assets/src/relay/environment.ts`, `assets/src/entry.server.tsx`, `assets/src/entry.client.tsx`, and `assets/src/router.tsx` so SSR creates a seeded request Relay environment, emits the store snapshot, and the browser reuses that snapshot.
  - Added focused coverage in `assets/src/relay/__tests__/route-preload.test.ts`, extended `assets/src/__tests__/entry.server.test.tsx`, and kept entry-server error-handling tests aligned with the new environment options.
  - Verified `cd assets && bun x vitest run src/relay/__tests__/route-preload.test.ts src/__tests__/entry.server.test.tsx src/__tests__/entry.server.error-handling.test.tsx` and `cd assets && bun run typecheck`.

- Queue rebaseline for Relay adoption:
  - Added `docs/plans/2026-03-19-frontend-relay-route-data-design.md`, `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`, and `docs/work/frontend-relay-route-data.md` to make full frontend Relay adoption the active queue item.
  - Updated `docs/work/index.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` so the source-of-truth queue now puts Relay route-data adoption ahead of the remaining compare/saved follow-up work.
  - Rebased the compare-route follow-up docs behind the Relay work item so the remaining compare/saved hardening can land on the long-term data path instead of extending the current manual helper layer.

- Frontend Compare And Saved Routes Hardening, Task 1:
  - Added `assets/src/routes/compare/compare-shell.tsx` and migrated `assets/src/routes/compare/index.tsx` plus `assets/src/routes/compare/saved.tsx` onto the shared shell.
  - Added polite compare-save and saved-set status messaging, then hardened the saved-set delete flow with latest-state updates, per-row pending tracking, and loader-state sync.
  - Extended `assets/src/routes/compare/__tests__/compare.route.test.tsx` to cover the named saved-set list, compare save status messaging, and overlapping delete regressions.
  - Verified `cd assets && /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run src/routes/compare/__tests__/compare.route.test.tsx` and `cd assets && /opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`.

- Frontend Saved Comparisons UI, Task 2:
  - Added `assets/src/routes/compare/saved.tsx` plus `savedComparisonsLoader(...)` and `deleteSavedComparisonSet(...)` in `assets/src/routes/compare/api.ts` to load, reopen, and delete private saved sets against the existing GraphQL contract.
  - Updated `assets/src/router.tsx` and `assets/src/routes/root.tsx` to register `/compare/saved` and expose `Saved comparisons` navigation from the root layout and home actions.
  - Extended `assets/src/routes/compare/__tests__/compare.route.test.tsx` and `assets/src/routes/__tests__/root.route.test.tsx` to cover the saved-set loader, reopen link, delete flow, unauthorized prompt, and root navigation wiring.
  - Verified `cd assets && /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run src/routes/compare/__tests__/compare.route.test.tsx src/routes/__tests__/root.route.test.tsx` and `cd assets && /opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`.

- Frontend Saved Comparisons UI, Task 1:
  - Updated `assets/src/routes/compare/api.ts` with a route-local `createSavedComparisonSet(...)` helper that calls the GraphQL mutation and normalizes typed/save-failure errors.
  - Updated `assets/src/routes/compare/index.tsx` to render a ready-state `Save comparison` action, derive a saved-set name from the current products, and show local success/error feedback.
  - Extended `assets/src/routes/compare/__tests__/compare.route.test.tsx` to assert the compare route submits the current product relay IDs through `CreateSavedComparisonSet`.
  - Verified `cd assets && /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run src/routes/compare/__tests__/compare.route.test.tsx` and `cd assets && /opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`.

- Saved Comparisons Backend:
  - Added `priv/repo/migrations/20260318120000_create_saved_comparison_sets.exs` plus the new saved comparison schema modules under `lib/product_compare_schemas/catalog/`.
  - Extended `lib/product_compare/catalog.ex`, `lib/product_compare_web/resolvers/catalog_resolver.ex`, `lib/product_compare_web/schema.ex`, and `lib/product_compare_web/graphql/global_id.ex` with owner-scoped saved comparison persistence and GraphQL query/mutation support.
  - Added focused coverage in `test/product_compare/catalog/saved_comparison_set_test.exs` and `test/product_compare_web/graphql/saved_comparisons_test.exs`.
  - Verified `mix test test/product_compare/catalog/saved_comparison_set_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs` and `mix typecheck`.

- GraphQL Dataloader Adoption Task 3:
  - Added `test/product_compare_web/graphql/dataloader_batching_test.exs` to exercise aliased `product` selections and `merchantProducts` in one request while capturing only the relevant SQL tables.
  - Locked the bounded request shape at three `products` selects plus one each for `brands`, `merchant_products`, `merchants`, and `price_points`, so regressions back to per-node batching fan-out fail in one focused test.
  - Updated `docs/work/graphql-dataloader-adoption.md` and `docs/work/index.md` to close the work item and record that no next unblocked batch is queued.
  - Verified `mix test test/product_compare_web/graphql/dataloader_batching_test.exs`, `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`, and `mix test test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`.

- GraphQL Dataloader Adoption Task 2:
  - Updated `lib/product_compare_web/schema.ex` to resolve `product.brand`, `merchant_product.merchant`, and `merchant_product.product` through Dataloader while keeping the GraphQL field contract unchanged.
  - Updated `lib/product_compare_web/resolvers/pricing_resolver.ex` and `lib/product_compare_web/graphql/loader.ex` so `merchant_product.latest_price` now uses a bounded request-scoped batch instead of one `Pricing.latest_price/1` query per parent node.
  - Removed GraphQL-only eager preloads from `lib/product_compare/catalog.ex`, `lib/product_compare_web/resolvers/catalog_resolver.ex`, and the GraphQL query path in `lib/product_compare/pricing.ex`, while keeping the shared pricing read helper preload contract intact, and added `Pricing.latest_prices_query/2` to support the custom latest-price batch.
  - Extended `test/product_compare_web/graphql/catalog_queries_test.exs` and `test/product_compare_web/graphql/pricing_queries_test.exs` with multi-node payload and query-count regressions, and verified `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`.

- GraphQL Dataloader Adoption Task 1:
  - Added `{:dataloader, "~> 2.0"}` to `mix.exs`, resolved `dataloader 2.0.2` into `mix.lock`, and created `lib/product_compare_web/graphql/loader.ex` for request-scoped catalog/pricing sources.
  - Updated `lib/product_compare_web/plugs/put_absinthe_context.ex` to inject `:loader` while preserving `current_user`, `api_token`, `session_user_token`, and `trusted_request_origin?`.
  - Updated `lib/product_compare_web/schema.ex` to preserve the loader in `context/1` and prepend `Absinthe.Middleware.Dataloader` in `plugins/0`.
  - Added `test/product_compare_web/plugs/put_absinthe_context_test.exs` to lock the request context shape and verified `mix test test/product_compare_web/plugs/put_absinthe_context_test.exs`.

- Frontend Radix Primitives:
  - Added `@radix-ui/react-label`, `@radix-ui/react-separator`, and `@radix-ui/react-slot` plus a shared wrapper layer in `assets/src/ui/primitives/`.
  - Migrated `assets/src/ui/components/layout/app-shell.tsx`, `assets/src/routes/root.tsx`, and `assets/src/routes/auth/form-shell.tsx` onto the new wrapper layer without changing route behavior or GraphQL auth flows.
  - Added focused primitive/auth-shell coverage in `assets/src/ui/__tests__/primitives.test.tsx` and `assets/src/routes/auth/__tests__/form-shell.test.tsx`, and updated the existing shell/root/session/recovery tests to prove the shared primitives are in use.
  - Verified `cd assets && bun x vitest run src/ui/__tests__/primitives.test.tsx src/ui/__tests__/app-providers.test.tsx src/ui/__tests__/app-shell.test.tsx src/routes/__tests__/root.route.test.tsx src/routes/auth/__tests__/form-shell.test.tsx src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx` and `cd assets && bun run check`.

- Queue planning refresh:
  - Added `docs/plans/2026-03-18-frontend-radix-primitives-adoption-implementation-plan.md` and `docs/work/frontend-radix-primitives.md` to make Radix-backed frontend primitives the next P1 slice.
  - Added `docs/plans/2026-03-18-graphql-dataloader-adoption-implementation-plan.md` and `docs/work/graphql-dataloader-adoption.md` to make request-scoped GraphQL batching the queued P2 slice.

- Frontend compare baseline Task 3:
  - Updated `assets/src/routes/compare/api.ts` to return route-local `not_found` and `error` states when any selected product is missing or its product-detail request fails.
  - Updated `assets/src/routes/compare/index.tsx` to render `One or more selected products were not found.` and `Comparison unavailable.` inside the compare shell.
  - Extended `assets/src/routes/compare/__tests__/compare.route.test.tsx` to cover missing-product and unavailable compare states alongside the existing empty, over-limit, and ready cases.
  - Verified `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`, `cd assets && bun run typecheck`, and `cd assets && bun run test:unit`.

- Frontend compare baseline Task 2:
  - Updated `assets/src/routes/compare/api.ts` to reuse `loadProductDetail/2` for up to three selected slugs and return ready-state products in URL order.
  - Updated `assets/src/routes/compare/index.tsx` to render basic comparison cards with product name, brand, slug, and description.
  - Extended `assets/src/routes/compare/__tests__/compare.route.test.tsx` to cover ready-state loading order and compare-card rendering.
  - Verified `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx` and `cd assets && bun run typecheck`.

- Frontend compare baseline Task 1:
  - Added `assets/src/routes/compare/api.ts` and `assets/src/routes/compare/index.tsx` for the `/compare` route-local loader and shell.
  - Registered the compare route in `assets/src/router.tsx` and added `Compare products` links to `assets/src/routes/root.tsx`.
  - Added focused compare-route coverage in `assets/src/routes/compare/__tests__/compare.route.test.tsx` and expanded `assets/src/routes/__tests__/root.route.test.tsx`.
  - Verified `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx src/routes/__tests__/root.route.test.tsx` and `cd assets && bun run typecheck`.

- Frontend product offers baseline Task 2:
  - Updated `assets/src/routes/products/api.ts` to preserve product-ready state while returning local offer `ready`, `empty`, and `error` states.
  - Updated `assets/src/routes/products/detail.tsx` to render `No active offers yet.` and `Offers unavailable.` inside the product detail shell.
  - Extended `assets/src/routes/products/__tests__/detail.route.test.tsx` to cover empty and unavailable offer states without collapsing the page to `Product unavailable.`.
  - Verified `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`, `mix test test/product_compare_web/graphql/pricing_queries_test.exs`, `cd assets && bun run typecheck`, and `cd assets && bun run test:unit`.

- Frontend product offers baseline Task 1:
  - Updated `assets/src/routes/products/api.ts` to fetch `merchantProducts(input:)` after the product lookup succeeds and normalize active offer link/price data for the route.
  - Updated `assets/src/routes/products/detail.tsx` to render an `Active offers` section on `/products/:slug` when offers are present.
  - Extended `assets/src/routes/products/__tests__/detail.route.test.tsx` to cover the second GraphQL request and success-state offer rendering.
  - Verified `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`.

- Frontend product detail baseline Task 3:
  - Updated `assets/src/routes/products/api.ts` to return route-local `ready`, `not_found`, and `error` states for product detail loading.
  - Updated `assets/src/routes/products/detail.tsx` to render missing-product and unavailable fallback copy without a route error boundary.
  - Extended `assets/src/routes/products/__tests__/detail.route.test.tsx` to cover success, missing-product, and unavailable detail states.
  - Verified `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`, `mix test test/product_compare_web/graphql/catalog_queries_test.exs`, `cd assets && bun run typecheck`, and `cd assets && bun run test:unit`.
- Frontend product detail baseline Task 2:
  - Added `assets/src/routes/products/api.ts` and `assets/src/routes/products/detail.tsx` for the `/products/:slug` loader and route shell.
  - Registered the detail route in `assets/src/router.tsx` and linked browse product names to it from `assets/src/routes/catalog/browse.tsx`.
  - Added focused detail-route tests and browse-link coverage in `assets/src/routes/products/__tests__/detail.route.test.tsx` and `assets/src/routes/catalog/__tests__/browse.route.test.tsx`.
  - Verified `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx`.
- Frontend product detail baseline Task 1:
  - Added `product(slug: String!)` to `lib/product_compare_web/schema.ex`.
  - Added `ProductCompare.Catalog.get_product_by_slug/1` and `CatalogResolver.product/3`.
  - Extended `test/product_compare_web/graphql/catalog_queries_test.exs` with single-product query coverage.
  - Verified `mix test test/product_compare_web/graphql/catalog_queries_test.exs`.
- Frontend catalog browse Task 3:
  - Added route-local `"ready"` and `"error"` loader states in `assets/src/routes/catalog/api.ts`.
  - Rendered empty and unavailable copy in `assets/src/routes/catalog/browse.tsx`.
  - Extended `assets/src/routes/catalog/__tests__/browse.route.test.tsx` to cover success, empty, and unavailable states.
  - Verified `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`, `bun run typecheck`, and `bun run test:unit`.
- Frontend catalog browse Task 2:
  - Added `assets/src/routes/catalog/api.ts` to load and normalize the first catalog page from GraphQL.
  - Switched `/products` to route-loader data in `assets/src/router.tsx` and `assets/src/routes/catalog/browse.tsx`.
  - Updated `assets/src/entry.server.tsx` to SSR React Router loader data via the static handler/static router path.
  - Added focused loader, route-render, and entry-server tests plus a clean frontend typecheck.
- Frontend catalog browse Task 1:
  - Added the `/products` route shell in `assets/src/routes/catalog/browse.tsx`.
  - Registered the route in `assets/src/router.tsx` and linked to it from `assets/src/routes/root.tsx`.
  - Added focused route tests for the browse shell and root browse link.
- GraphQL auth migration follow-up:
  - Decision/status doc added at `docs/decisions/2026-03-17-auth-token-delivery-deferral.md`.
  - `docs/work/graphql-auth-migration.md` is closed.
