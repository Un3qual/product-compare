# Frontend Relay Route-Data Work Doc

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-05-30 after route-loader context invariant cleanup
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-19-frontend-relay-route-data-design.md`
  - `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
  - `docs/work/frontend-saved-comparisons-ui.md`
  - `docs/work/frontend-compare-saved-hardening.md`
- Definition of done:
  - `/products`, `/products/:slug`, `/compare`, `/compare/saved`, and the browser auth flows use Relay query or mutation APIs instead of route-local GraphQL strings and payload parsers.
  - React Router loaders only own URL parsing, local guards, redirects, and Relay preloading.
  - SSR and hydration share a serialized Relay store snapshot so route data fetched on the server is reused on first client paint.
  - The confusing route-local `api.ts` modules are deleted or replaced by explicit `loader.ts`, `queries/`, `fragments/`, or `mutations/` files.
  - `fetchGraphQL` stays a transport-only Relay network helper; route-level GraphQL error handling lives at the Relay environment boundary.

## Verified Current State

- `assets/src/relay/environment.ts`, `assets/src/relay/ssr.ts`, `assets/src/entry.client.tsx`, and `assets/src/entry.server.tsx` now seed/dehydrate Relay records through the SSR bootstrap while preserving the existing Relay provider.
- `assets/src/relay/load-query.ts` and `assets/src/relay/route-preload.ts` provide route-preload primitives for serializable descriptors plus in-memory query-ref reuse.
- `/products` now uses `assets/src/routes/catalog/loader.ts`, `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`, and `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts` instead of `assets/src/routes/catalog/api.ts`.
- `/products/:slug` now uses `assets/src/routes/products/loader.ts`, `assets/src/routes/products/queries/ProductDetailRouteQuery.ts`, `assets/src/routes/products/queries/ProductOffersRouteQuery.ts`, and generated Relay artifacts instead of `assets/src/routes/products/api.ts`.
- `/compare` now uses `assets/src/routes/compare/loader.ts`, reuses the generated `ProductDetailRouteQuery` artifact through Relay route preloading, renders selected products from Relay preloaded queries, and saves ready selections through `CreateSavedComparisonSetMutation`.
- `/compare/saved` now uses `SavedComparisonsRouteQuery` route-preload descriptors for saved-set pages and `DeleteSavedComparisonSetMutation` for deletion while preserving local status, unauthorized, reopen, and pending-delete behavior.
- `assets/src/routes/compare/api.ts` and `assets/src/routes/compare/product-detail.ts` have been removed. `assets/src/routes/compare/saved-data.ts` now only owns saved-route loader orchestration, pagination guards, unauthorized detection, and Relay page summarization.
- Browser auth routes now commit `LoginMutation`, `RegisterMutation`, `ForgotPasswordMutation`, `ResetPasswordMutation`, and `VerifyEmailMutation` through Relay `useMutation`, with shared payload/error normalization in `assets/src/routes/auth/errors.ts`.
- `assets/src/routes/compare/saved-data.ts` no longer owns raw saved-comparison GraphQL strings, direct `fetchGraphQL(...)` calls, or mutation payload normalization.
- `assets/src/router.tsx` wires `/products`, `/products/:slug`, `/compare`, and `/compare/saved` through Relay preload loaders.
- Relay-backed route loaders now fail fast when the request-scoped Relay environment is missing from router context; recoverable preload failures still render route-local unavailable states.
- `assets/src/entry.server.tsx` creates a request-scoped Relay environment, exposes it through React Router loader context, and serializes the populated store back into a non-executable client bootstrap script.
- `assets/src/relay/fetch-graphql.ts` now only owns endpoint resolution, HTTP request shape, browser credentials, SSR cookie/origin forwarding, abort signals, HTTP failure wrapping, and JSON response return.
- `assets/src/relay/environment.ts` preserves route-loader GraphQL error rejection without passing route-specific parsing flags through `fetchGraphQL`.
- `assets/relay.config.json` exists, `assets/package.json` already includes Relay compiler/runtime dependencies, and browse now has a tracked generated Relay artifact.
- The saved-comparisons UI now ships for authenticated users on the unified Relay data path.

## Next Batch

- Status: completed
- Batch: none queued in this lane
- Why this batch:
  - Task 6 completed the queued transport-helper cleanup after `/products`, `/products/:slug`, `/compare`, and browser auth moved onto Relay.
  - The remaining `/compare/saved` manual helper gap was closed by `docs/work/frontend-saved-comparisons-relay-migration.md`.
  - Coordinator handoff can now choose the next product slice from `docs/work/index.md` and `docs/plans/INDEX.md`.

## Completed Batches

### Task 6: Manual Fetch Plumbing Cleanup And Handoff

- Completed: 2026-05-21
- Outcome:
  - Trimmed `assets/src/relay/fetch-graphql.ts` so it no longer owns route-loader GraphQL error parsing flags and remains focused on the GraphQL HTTP request/response transport.
  - Moved route-loader top-level GraphQL error rejection to `assets/src/relay/environment.ts`, where route-loader cache metadata and abort signals are available.
  - Updated the transport and environment tests to lock the thinner helper boundary while preserving route-loader failure behavior.
  - Left `/compare/saved` on the explicit `assets/src/routes/compare/saved-data.ts` manual helper as visible future cleanup scope; that follow-up is now closed by `docs/work/frontend-saved-comparisons-relay-migration.md`.
- Verification:
  - `cd assets && bun x vitest run src/relay/__tests__/fetch-graphql.test.ts src/relay/__tests__/environment.test.ts`
  - `cd assets && bun run relay`
  - `cd assets && bun run typecheck`
  - `cd assets && bun run test:unit`
  - `cd assets && bun x vitest run src/__tests__/entry.server.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx src/routes/products/__tests__/detail.route.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`

### Task 5: Auth Mutation Relay Migration

- Completed: 2026-05-02
- Outcome:
  - Replaced `assets/src/routes/auth/actions.ts` with Relay mutation documents for `login`, `register`, `forgotPassword`, `resetPassword`, and `verifyEmail`, plus generated Relay artifacts for each operation.
  - Moved shared auth mutation error normalization into `assets/src/routes/auth/errors.ts` and updated the session, recovery, reset, and verification routes to commit through `useMutation` while preserving existing form copy, redirects, generic transport errors, stale reset-token guards, and single-use verification token behavior.
  - Updated auth route coverage so the routes assert Relay mutation variables and callback handling instead of route-local `fetchGraphQL(...)` calls.
- Verification:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`
  - `cd assets && bun run typecheck`

### Task 4: Compare Route And Save Mutation Relay Migration

- Completed: 2026-04-30
- Outcome:
  - Replaced `assets/src/routes/compare/api.ts` compare loader usage with `assets/src/routes/compare/loader.ts`, which parses selected slugs, preserves empty/limit/not-found behavior, and preloads one `ProductDetailRouteQuery` per selected slug through Relay.
  - Updated `assets/src/routes/compare/index.tsx` so ready-state product cards render from Relay preloaded product queries and the save action uses `useMutation(CreateSavedComparisonSetMutation)` instead of a route-local `fetchGraphQL(...)` helper.
  - Removed the temporary `assets/src/routes/compare/product-detail.ts` helper and generated `assets/src/__generated__/CreateSavedComparisonSetMutation.graphql.ts`.
  - Moved the then-manual saved-comparisons query/delete helpers into explicit `assets/src/routes/compare/saved-data.ts` so `/compare/saved` stayed working while its Relay migration remained visible.
  - Extended compare coverage for Relay preloading, Relay mutation save behavior, existing compare states, and saved-comparison route regressions.
- Verification:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts`
  - `cd assets && bun run typecheck`

### Task 3: Product Detail And Offers Route Relay Migration

- Completed: 2026-04-26
- Outcome:
  - Replaced `assets/src/routes/products/api.ts` with `assets/src/routes/products/loader.ts`, product detail/offers Relay route query sources, and generated Relay artifacts.
  - Updated `assets/src/routes/products/detail.tsx` to render product detail and active offers from Relay preloaded queries while preserving not-found, product-unavailable, empty-offers, offer-unavailable, no-latest-price, and unsafe-offer-url behavior.
  - Added `fetchRouteQuery(...)` in `assets/src/relay/route-preload.ts` so loaders can keep a fetched query in the route-ref cache while also using the returned data to preload dependent queries.
  - Moved the remaining manual product-detail helper under `assets/src/routes/compare/product-detail.ts` so `/compare` can keep working until Task 4 migrates that route.
- Verification:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run src/relay/__tests__/route-preload.test.ts src/routes/products/__tests__/detail.route.test.tsx src/routes/compare/__tests__/compare.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `cd assets && bun x vitest run src/__tests__/entry.server.test.tsx`

### Task 2: Browse Route Relay Migration

- Completed: 2026-04-24
- Outcome:
  - Replaced `assets/src/routes/catalog/api.ts` with `assets/src/routes/catalog/loader.ts`, a Relay route query source, and the generated `BrowseProductsRouteQuery` artifact.
  - Updated `assets/src/routes/catalog/browse.tsx` to render from `usePreloadedQuery` via the route-preload descriptor while preserving ready, empty, and unavailable UI states.
  - Extended `assets/src/relay/route-preload.ts` so loader-created query refs can be reused during route render and recreated against a hydrated Relay environment on the client.
  - Updated `assets/schema.graphql` and `assets/.gitignore` so the browse query compiles and generated `.graphql.ts` artifacts can be tracked.
- Verification:
  - `cd assets && bun run relay && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`
  - `cd assets && bun x vitest run src/relay/__tests__/route-preload.test.ts src/routes/catalog/__tests__/browse.route.test.tsx`
  - `cd assets && bun run typecheck`

### Task 1: Relay SSR Hydration And Route-Preload Primitives

- Completed: 2026-04-24
- Outcome:
  - Added `assets/src/relay/ssr.ts` for Relay store dehydration, HTML-safe bootstrap serialization, and client bootstrap parsing.
  - Added `assets/src/relay/route-preload.ts` for route query preloading descriptors and shared React Router loader context access to the Relay environment.
  - Updated `assets/src/relay/environment.ts`, `assets/src/entry.server.tsx`, `assets/src/entry.client.tsx`, and `assets/src/router.tsx` so SSR and hydration share seeded Relay records and loaders can use the request/client Relay environment.
  - Added focused coverage in `assets/src/relay/__tests__/route-preload.test.ts`, extended `assets/src/__tests__/entry.server.test.tsx`, and kept the entry-server error-handling tests aligned with the new environment options.
- Verification:
  - `cd assets && bun x vitest run src/relay/__tests__/route-preload.test.ts src/__tests__/entry.server.test.tsx src/__tests__/entry.server.error-handling.test.tsx`
  - `cd assets && bun run typecheck`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/**`, this file, `docs/work/frontend-saved-comparisons-ui.md`, and `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`
- Stop and record a blocker here if this batch requires `lib/**`, `priv/**`, backend GraphQL tests, or another lane's owned paths.

## Planned Follow-Up

- No compare/saved Relay follow-up remains queued from this completed lane.
- Track any additional compare/saved UI polish as a new active work item with its own scope and verification commands.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-relay-route-data.md`
- `sed -n '1,260p' docs/plans/2026-03-19-frontend-relay-route-data-design.md`
- `sed -n '1,320p' docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
- `sed -n '1,220p' assets/src/router.tsx`
- `sed -n '1,220p' assets/src/entry.server.tsx`
- `sed -n '1,220p' assets/src/entry.client.tsx`
- `rg -n 'fetchGraphQL|usePreloadedQuery|useMutation|graphql' assets/src`
