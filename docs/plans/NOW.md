# NOW

## Current Batches

- Parallel mode note: this file is coordinator-owned whenever frontend and backend lanes run at the same time.

### Frontend Lane

- Status: in_progress
- Batch: Frontend Saved Comparisons Relay Migration, Task 2: Saved-Set Delete Mutation Relay Migration
- Source of truth: `docs/work/frontend-saved-comparisons-relay-migration.md`
- Implementation plan: `docs/plans/2026-05-29-frontend-saved-comparisons-relay-migration-implementation-plan.md`
- Next step: move `/compare/saved` deletion from the manual `deleteSavedComparisonSet(...)` helper to a Relay mutation while preserving existing local delete UX.
- Why this batch is current:
  - Product ingestion's remaining local work is blocked on live CJ credential, quota, representative sample payload, and compliance evidence.
  - `/compare/saved` is the remaining explicit unblocked architecture gap after `/products`, `/products/:slug`, `/compare`, and browser auth moved onto Relay.
  - Task 1 moved saved-set list loading/rendering onto Relay route query descriptors.
  - Task 2 is the next unblocked batch because `assets/src/routes/compare/saved-data.ts` still owns the raw delete mutation helper.

### Backend Lane

- Status: completed
- Batch: none queued
- Source of truth: `docs/work/graphql-relay-contract-hardening.md`
- Next step: no unblocked backend batch is queued from this worktree; coordinator follow-up can choose a future backend lane if priorities change.
- Why this batch is current:
  - The planned GraphQL Relay contract hardening tasks are complete and fully verified.
  - No next backend Relay-contract batch is currently queued.
  - Commerce attribution is the next unblocked implementation lane.

### Commerce Attribution Lane

- Status: completed
- Batch: none queued
- Source of truth: `docs/work/affiliate-revenue-attribution.md`
- Next step: no unblocked commerce attribution batch remains in this worktree; keep CJ/Awin source-field mapping deferred until account docs or sample payloads are available.
- Why this batch is current:
  - Commerce attribution Tasks 1, 2, and 3 are complete and verified.
  - `ARCHITECTURE.md` now records the read-only revenue summary GraphQL surface as delivered.
  - `docs/work/product-data-scraping.md` is now the next selected lane after the completed commerce attribution work.
  - CJ/Awin source-field mapping is deferred pending account docs or sample payloads.

### Product Data Ingestion Lane

- Status: blocked
- Batch: none queued
- Source of truth: `docs/work/product-data-scraping.md`
- Implementation plan: `docs/plans/2026-05-23-product-data-ingestion-foundation-implementation-plan.md`
- Next step: record live CJ credential access, quota behavior, representative account-scoped sample payloads, and source onboarding compliance signoff before live provider polling or Tier-3 scraping work begins.
- Why this batch is current:
  - Product Data Ingestion Foundation Task 1 selected CJ, recorded the sync-pilot ADR, added `merchant_source_identities`, and scaffolded fixture-backed parser coverage.
  - Product Data Ingestion Persistence Task 2 now persists fixture-backed normalized listings into the existing catalog/pricing/spec persistence path with replay idempotency and stale-observation guards.
  - No unblocked local ingestion batch remains before live provider validation.
  - Live CJ credential validation, quota behavior, account-scoped samples, account-manager automation, and Tier-3 scraping remain blocked.

## Just Completed

- Frontend Saved Comparisons Relay Migration, Task 1:
  - Added `SavedComparisonsRouteQuery` and generated `assets/src/__generated__/SavedComparisonsRouteQuery.graphql.ts`.
  - Updated `savedComparisonsLoader` to page through `fetchRouteQuery`, return Relay route query descriptors plus fallback summaries, and preserve unauthorized, page-cap, cursor, empty, and abort behavior.
  - Updated `SavedComparisonsRoute` to render ready-state rows from Relay preloaded saved-set query records with loader summaries as the error-boundary fallback.
  - Verified `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, and `cd assets && bun run typecheck`.

- Product Data Ingestion Persistence, Task 2:
  - Added `ProductCompare.Ingestion.persist_normalized_listing/2` to persist normalized listings into `SourceArtifact`, `ExternalProduct`, generated catalog product shells, `MerchantProduct`, and `PricePoint`.
  - Reused source-scoped merchant identities for replay-safe merchant resolution.
  - Added replay idempotency for repeated normalized listings plus stale-observation guards so older listing observations do not overwrite current merchant product or price state.
  - Added database uniqueness indexes for replay-safe source artifact and price point writes.
  - Verified `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs` and `mix typecheck`.

- Product Data Ingestion Foundation, Task 1:
  - Added `docs/decisions/2026-05-23-ingestion-execution-boundary.md` to record CJ-first source selection, eBay fallback criteria, sync pilot scope, and Oban revisit triggers.
  - Added `merchant_source_identities` persistence and `ProductCompareSchemas.Ingestion.MerchantSourceIdentity`.
  - Added `ProductCompare.Ingestion.resolve_merchant_identity/2` for deterministic source-scoped merchant identity resolution.
  - Added `ProductCompare.Ingestion.NormalizedListing`, source adapter behavior, a CJ fixture parser, and local fixture parser coverage.
  - Verified `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs`, `mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`, and `mix typecheck`.

- Commerce Attribution, Task 3:
  - Added a read-only GraphQL `revenueSummary` query backed by `ProductCompare.CommerceAttribution.dashboard_revenue_summary/1`.
  - Added GraphQL input/output types for Relay global ID merchant/product filters, network/currency/date filters, currency-scoped metrics, and server-enforced suppression metadata.
  - Added `ProductCompareWeb.Resolvers.CommerceAttributionResolver` to normalize global IDs, reject invalid filters without broadening the query, and encode returned merchant/product filters back to Relay IDs.
  - Added focused GraphQL coverage for empty, aggregate, low-volume suppression, invalid global ID, and invalid scalar-filter shapes.
  - Verified `mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`, `mix typecheck`, and `git diff --check`.

- Commerce Attribution, Task 2:
  - Added a query-backed revenue projection in `ProductCompare.CommerceAttribution` over click sessions, approved/paid conversions, and purchase-price facts.
  - Added `dashboard_revenue_summary/1`, `merchant_revenue_summary/2`, `product_revenue_summary/2`, and `network_revenue_summary/2` with a JSON-ready dashboard contract for clicks, conversions, gross order value, commission revenue, average paid price, filters, and suppression metadata.
  - Extended `test/product_compare/commerce_attribution/commerce_attribution_test.exs` to cover empty, aggregate, and low-volume suppression result shapes.
  - Verified `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs`, `mix typecheck`, and `git diff --check`.

- Commerce Attribution, Task 1:
  - Added `docs/decisions/2026-05-21-commerce-attribution-redirect-model.md` to record the owned redirect, deterministic last-click, and network-neutral conversion decisions.
  - Added `commerce_links`, `commerce_click_sessions`, `commerce_conversions`, and `purchase_price_facts` migrations/schemas with database idempotency constraints.
  - Added `ProductCompare.CommerceAttribution`, `/r/:click_id`, and `ProductCompare.CommerceAttribution.ImpactAdapter` to cover redirect resolution, conversion upserts, click matching, and price-paid fact insertion.
  - Verified `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs`.

- Frontend Relay Route-Data Adoption, Task 6:
  - Trimmed `assets/src/relay/fetch-graphql.ts` so it only owns GraphQL HTTP transport concerns: endpoint resolution, browser credentials, SSR cookie/origin forwarding, abort signals, HTTP failure wrapping, and JSON response return.
  - Moved route-loader top-level GraphQL error rejection into `assets/src/relay/environment.ts`, where route-loader cache metadata and abort signals are available.
  - Updated `assets/src/relay/__tests__/fetch-graphql.test.ts` and `assets/src/relay/__tests__/environment.test.ts` to lock the thinner transport boundary while preserving route-loader failure behavior.
  - Verified `cd assets && bun run relay`, `cd assets && bun run typecheck`, `cd assets && bun run test:unit`, and the focused SSR route suite.

- Frontend Relay Route-Data Adoption, Task 5:
  - Replaced `assets/src/routes/auth/actions.ts` with Relay mutation documents for `LoginMutation`, `RegisterMutation`, `ForgotPasswordMutation`, `ResetPasswordMutation`, and `VerifyEmailMutation`, plus generated Relay artifacts.
  - Moved shared auth payload/error normalization into `assets/src/routes/auth/errors.ts` and updated login, register, forgot-password, reset-password, and verify-email routes to commit through `useMutation` while preserving existing UX and token safety behavior.
  - Updated focused auth route tests to assert Relay mutation variables and callback handling instead of direct `fetchGraphQL(...)` calls.
  - Verified `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`, and `cd assets && bun run typecheck`.

- Frontend Relay Route-Data Adoption, Task 4:
  - Added `assets/src/routes/compare/loader.ts` so `/compare` parses URL-selected slugs and preloads one Relay `ProductDetailRouteQuery` per selected product while preserving empty, over-limit, not-found, and loader-error behavior.
  - Updated `assets/src/routes/compare/index.tsx` so ready-state product cards render from Relay preloaded product queries and the save action commits `CreateSavedComparisonSetMutation` through `useMutation`.
  - Removed `assets/src/routes/compare/api.ts` and the temporary `assets/src/routes/compare/product-detail.ts`; moved the still-manual saved-route query/delete helpers into explicit `assets/src/routes/compare/saved-data.ts`.
  - Generated `assets/src/__generated__/CreateSavedComparisonSetMutation.graphql.ts`, updated the local `react-relay` type shim for `useMutation`, and kept compare/saved regression coverage aligned with the new data path.
  - Verified `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts`, and `cd assets && bun run typecheck`.

- Frontend Relay Route-Data Adoption, Task 3:
  - Replaced `assets/src/routes/products/api.ts` with `assets/src/routes/products/loader.ts`, product detail/offers Relay route query sources, and generated Relay artifacts.
  - Updated `assets/src/routes/products/detail.tsx` so `/products/:slug` renders product detail and active offers from Relay preloaded queries while preserving not-found, product-unavailable, empty-offers, offer-unavailable, no-latest-price, and unsafe-offer-url behavior.
  - Added `fetchRouteQuery(...)` in `assets/src/relay/route-preload.ts` for dependent route preloads and moved the temporary manual product-detail helper under `assets/src/routes/compare/product-detail.ts` until the compare route migrates.
  - Verified `cd assets && bun run relay`, `cd assets && bun x vitest run src/relay/__tests__/route-preload.test.ts src/routes/products/__tests__/detail.route.test.tsx src/routes/compare/__tests__/compare.route.test.tsx`, `cd assets && bun run typecheck`, and `cd assets && bun x vitest run src/__tests__/entry.server.test.tsx`.

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
