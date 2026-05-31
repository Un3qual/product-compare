# NOW

## Current Batches

- Parallel mode note: this file is coordinator-owned whenever frontend and backend lanes run at the same time.

### Frontend Lane

- Status: completed
- Batch: none queued
- Source of truth: `docs/work/frontend-route-mutation-error-guard.md`
- Implementation plan: `docs/plans/2026-05-30-frontend-route-mutation-error-guard-implementation-plan.md`
- Next step: no unblocked frontend batch is queued from this worktree; coordinator follow-up can choose a future frontend lane if priorities change.
- Why this batch is current:
  - Product ingestion's remaining local work is blocked on live CJ credential, quota, representative sample payload, and compliance evidence.
  - `/compare/saved` was the remaining explicit unblocked architecture gap after `/products`, `/products/:slug`, `/compare`, and browser auth moved onto Relay.
  - Task 1 moved saved-set list loading/rendering onto Relay route query descriptors.
  - Task 2 moved saved-set deletion onto Relay mutations and removed the remaining raw saved-comparison mutation helper.
  - Task 3 closed the handoff by recording `/compare/saved` as fully on Relay query/mutation APIs and the full frontend verification passed.
  - A follow-up auth-code cleanup aligned saved-route auth-state detection with the backend `UNAUTHENTICATED` contract.
  - A review-driven catalog loader cleanup aligned missing Relay router-context behavior with the other Relay-backed route loaders.
  - A review-driven auth mutation result cleanup now centralizes top-level GraphQL error and payload normalization logic across the Relay-backed browser auth mutation routes.
  - A review-driven route-loader error cleanup now centralizes abort rethrow plus recoverable preload fallback handling.
  - A review-driven route mutation error cleanup now centralizes first typed mutation error message fallback handling across `/compare` save and `/compare/saved` delete flows.
  - A review-driven route record guard cleanup now centralizes unknown-object checks used by browser auth mutation normalization and saved-comparison route data parsing.
  - A review-driven auth route cleanup now centralizes string form-value extraction for Relay-backed browser auth mutation routes.
  - A review-driven route mutation promise cleanup now centralizes promise-based Relay commit handling for the verify-email single-use token flow.
  - A review-driven compare route mutation cleanup now treats Relay top-level GraphQL errors as generic mutation failures before trusting payload IDs.
  - A review-driven auth transport cleanup now centralizes standard transport-error list construction across Relay-backed auth mutation routes.
  - A review-driven auth action cleanup now centralizes successful action result semantics across Relay-backed recovery and verification routes.
  - `docs/plans/NOW.md` had no queued frontend or backend batch, so this review-driven frontend auth cleanup was selected from the delivered browser auth baseline in `ARCHITECTURE.md`.
  - A review-driven auth token cleanup now centralizes missing-token typed mutation error construction across reset-password and verify-email routes.
  - `docs/plans/NOW.md` had no queued frontend or backend batch, so this review-driven route-loader cleanup was selected from the delivered Relay route-loader baseline in `ARCHITECTURE.md`.
  - Focused route-loader helper and compare route coverage now passes with thrown-error normalization centralized in `assets/src/routes/loader-errors.ts`.
  - A review-driven route-loader cleanup now centralizes thrown-error normalization for loaders that rethrow failed preload work.
  - `docs/plans/NOW.md` had no queued frontend or backend batch, so this review-driven route mutation cleanup was selected from the delivered Relay route baseline in `ARCHITECTURE.md`.
  - Current review found route mutation error entry validation not using the shared route record guard introduced for payload parsing.
  - Focused route helper and compare route coverage now passes with typed mutation error entry validation centralized through `isRouteRecord(...)`.
  - A review-driven route mutation cleanup now rejects array-shaped typed error entries consistently with the shared route payload guard.
  - `docs/plans/NOW.md` had no queued frontend or backend batch, so this review-driven route/auth cleanup was selected from the delivered Relay route baseline in `ARCHITECTURE.md`.
  - Current review found top-level Relay GraphQL error presence checks duplicated between route mutation helpers and auth mutation normalization.
  - Focused route, auth, and compare coverage now passes with top-level Relay GraphQL error presence checks centralized in `hasRouteGraphQLErrors(...)`.
  - A review-driven route/auth cleanup now centralizes top-level Relay GraphQL error presence checks across compare mutation helpers and auth mutation normalization.
  - `docs/plans/NOW.md` had no queued frontend or backend batch, so this review-driven route mutation cleanup was selected from the delivered Relay route baseline in `ARCHITECTURE.md`.
  - Current review found route mutation error entry validation looser than the GraphQL typed mutation error payload shape.
  - Focused route and compare mutation coverage now passes with route mutation error-message extraction limited to typed GraphQL mutation error entries.
  - A review-driven route mutation cleanup now requires string `code`, string `message`, and optional string/null `field` before surfacing typed error messages.
  - `docs/plans/NOW.md` had no queued frontend or backend batch, so this review-driven route/auth cleanup was selected from the delivered Relay route baseline in `ARCHITECTURE.md`.
  - Current review found duplicate typed GraphQL mutation error entry validation in compare route feedback and browser auth mutation normalization.
  - Focused route, auth, and compare coverage now passes with typed GraphQL mutation error entry validation shared through `isRouteMutationError(...)`.
  - A review-driven route/auth cleanup now shares typed GraphQL mutation error entry validation across compare mutation feedback and browser auth mutation normalization.
  - No next frontend implementation lane is currently queued.

### Backend Lane

- Status: completed
- Batch: none queued
- Source of truth: `docs/work/backend-core-attrs-keyword-helper.md`
- Implementation plan: `docs/plans/2026-05-31-backend-core-attrs-keyword-helper-implementation-plan.md`
- Next step: no unblocked backend batch is queued from this worktree; coordinator follow-up can choose another review-driven backend slice if priorities change.
- Why this batch is current:
  - The planned GraphQL Relay contract hardening tasks are complete and fully verified.
  - The follow-up to extend generic node lookup to authenticated affiliate entities is complete.
  - The follow-up to extend generic node lookup to public `PricePoint` entities is complete.
  - Missing-session typed mutation payloads now use `UNAUTHENTICATED`, matching top-level auth-required GraphQL errors.
  - A review-driven GraphQL test helper cleanup now centralizes Relay global ID construction through ConnCase.
  - A review-driven GraphQL decode helper cleanup now centralizes resolver integer and UUID global-ID parsing.
  - A review-driven GraphQL encode helper cleanup now centralizes integer global-ID local-value conversion.
  - A review-driven typed mutation error cleanup now centralizes resolver-local unauthenticated mutation error construction.
  - A review-driven generic mutation error cleanup now centralizes resolver-local mutation error maps and changeset error shaping.
  - A review-driven Catalog input helper cleanup now centralizes list-value lookup, integer ID list decoding, and UUID ID decoding for catalog filters and saved-comparison mutation inputs.
  - A review-driven connection cleanup now centralizes pagination argument lookup through the shared GraphQL input helper.
  - A review-driven field resolver cleanup now centralizes Absinthe global ID resolver wrappers in `ProductCompareWeb.GraphQL.GlobalId`.
  - A review-driven Affiliate resolver cleanup now centralizes optional Relay integer-ID field normalization in `ProductCompareWeb.GraphQL.Input`.
  - A review-driven mutation error cleanup now centralizes first changeset error extraction in `ProductCompareWeb.GraphQL.Errors`.
  - A review-driven Commerce attribution cleanup now centralizes revenue summary optional ID decode/encode wrappers in shared GraphQL helpers.
  - A review-driven Affiliate resolver cleanup now centralizes camelCase GraphQL mutation field-name normalization in `ProductCompareWeb.GraphQL.Errors`.
  - A review-driven Auth resolver cleanup now centralizes `my_api_tokens/3` status lookup and status arg removal through shared atom/string GraphQL input helpers.
  - A review-driven Auth resolver cleanup now centralizes API-token create/rotate optional attr extraction through shared atom/string GraphQL input helpers.
  - A review-driven GraphQL input cleanup now centralizes string-key optional Relay ID field normalization in `Input.decode_optional_integer_id_field/4`.
  - A review-driven GraphQL connection cleanup now centralizes resolver pagination arg extraction through `Input.connection_args/1`.
  - `docs/plans/NOW.md` had no queued frontend or backend batch, so this review-driven Affiliate resolver cleanup was selected from the delivered backend GraphQL baseline in `ARCHITECTURE.md`.
  - A review-driven Affiliate resolver cleanup now centralizes `activeCoupons` timestamp input lookup through `Input.fetch_value/3`.
  - A review-driven Affiliate resolver cleanup now centralizes affiliate-network mutation attr extraction through `Input.take_present/2` and removes stale unsupported `homepage_url` selection.
  - A review-driven Affiliate resolver cleanup now normalizes program, link, and coupon mutation attrs after Relay ID decoding and before Ecto changeset calls.
  - A review-driven GraphQL connection cleanup now centralizes resolver-facing connection query result mapping through `Connection.from_query_result/3`.
  - `docs/plans/NOW.md` had no queued frontend or backend batch, so this review-driven root-node ID cleanup was selected from the delivered backend GraphQL baseline in `ARCHITECTURE.md`.
  - Focused coverage now passes for `GlobalId.decode_typed_local_id/3` and request-level root-node behavior.
  - A review-driven GraphQL node cleanup now centralizes root-node Relay ID local-value kind dispatch in `ProductCompareWeb.GraphQL.GlobalId`.
  - `docs/plans/NOW.md` had no queued frontend or backend batch, so this review-driven Catalog numeric input cleanup was selected from the delivered backend GraphQL baseline in `ARCHITECTURE.md`.
  - Focused shared-input and catalog query coverage now passes with numeric filter value parsing centralized in `ProductCompareWeb.GraphQL.Input`.
  - A review-driven Catalog input cleanup now centralizes GraphQL numeric filter value normalization in `ProductCompareWeb.GraphQL.Input`.
  - `docs/plans/NOW.md` had no queued frontend or backend batch, so this review-driven Catalog boolean input cleanup was selected from the delivered backend GraphQL baseline in `ARCHITECTURE.md`.
  - Focused shared-input and catalog query coverage now passes with boolean value normalization centralized in `ProductCompareWeb.GraphQL.Input`.
  - A review-driven Catalog input cleanup now centralizes GraphQL boolean value normalization in `ProductCompareWeb.GraphQL.Input`.
  - `docs/plans/NOW.md` had no queued frontend or backend batch, so this review-driven Catalog input cleanup was selected from the delivered backend GraphQL baseline in `ARCHITECTURE.md`.
  - Current review found Catalog resolver-local nil-skipping normalized filter insertion that belongs with adjacent shared GraphQL input helpers.
  - Focused shared-input and catalog query coverage now passes with nil-skipping normalized filter insertion centralized in `ProductCompareWeb.GraphQL.Input`.
  - A review-driven Catalog input cleanup now centralizes nil-skipping GraphQL input map insertion in `ProductCompareWeb.GraphQL.Input`.
  - `docs/plans/NOW.md` had no queued frontend or backend batch, so this review-driven Accounts cleanup was selected from the delivered backend baseline in `ARCHITECTURE.md`.
  - Current review found reusable core attr normalization still private to `ProductCompare.Accounts`.
  - Focused core attrs and API-token coverage now passes with API-token attr handling delegated to `ProductCompare.Attrs`.
  - A review-driven Accounts cleanup now centralizes core atom/string attr lookup and nil-skipping insertion.
  - Per the latest coordinator instruction, this is the last improvement in the current review pass.
  - The persistent code-review goal resumed after that instruction, so this review-driven Commerce Attribution cleanup was selected from the delivered backend baseline in `ARCHITECTURE.md`.
  - Current review found reusable attr key-presence and non-nil presence checks still private to `ProductCompare.CommerceAttribution`.
  - Focused core attrs and Commerce Attribution coverage now passes with attr presence checks delegated to `ProductCompare.Attrs`.
  - A review-driven Commerce Attribution cleanup now centralizes core atom/string attr key-presence and non-nil presence checks.
  - No next backend implementation lane is currently queued.
  - Current review found keyword-or-map revenue filter lookup still private to `ProductCompare.CommerceAttribution`.
  - Focused core attrs and Commerce Attribution coverage now passes with keyword revenue filter lookup delegated to `ProductCompare.Attrs`.
  - A review-driven Commerce Attribution cleanup now centralizes keyword-or-map revenue filter lookup in the core attr helper.
  - No next backend implementation lane is currently queued.

### Commerce Attribution Lane

- Status: completed
- Batch: none queued
- Source of truth: `docs/work/affiliate-revenue-attribution.md`
- Next step: no unblocked commerce attribution batch remains in this worktree; keep CJ/Awin source-field mapping deferred until account docs or sample payloads are available.
- Why this batch is current:
  - Commerce attribution Tasks 1, 2, and 3 are complete and verified.
  - `ARCHITECTURE.md` now records the read-only revenue summary GraphQL surface as delivered.
  - Product data ingestion is the only remaining listed lane and is blocked pending live-provider evidence.
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

- Backend Core Attrs Keyword Helper:
  - Added keyword-list support to `ProductCompare.Attrs.fetch/3`, `has_key?/2`, and derived `present?/2` behavior.
  - Routed Commerce Attribution revenue summary keyword/map filter lookup through the shared core helper.
  - Verified `mix test test/product_compare/attrs_test.exs`, `mix test test/product_compare/attrs_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend Core Attrs Presence Helper:
  - Added `ProductCompare.Attrs.has_key?/2` and `present?/2` for reusable atom/string attr presence checks.
  - Routed Commerce Attribution click-session lookup, default attribution confidence, and upsert-field detection through the shared core helper.
  - Verified `mix test test/product_compare/attrs_test.exs`, `mix test test/product_compare/attrs_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend Core Attrs Helper:
  - Added `ProductCompare.Attrs.fetch/3`, `ensure_map/1`, and `put_present/3` for core atom/string attr lookup, non-map normalization, and nil-skipping insertion.
  - Routed API-token creation, rotation default merging, and status filtering in `ProductCompare.Accounts` through the core helper.
  - Verified `mix test test/product_compare/attrs_test.exs`, `mix test test/product_compare/attrs_test.exs test/product_compare/accounts/api_token_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Route Mutation Error Guard:
  - Exported `RouteMutationError` and `isRouteMutationError(...)` for shared typed GraphQL mutation error entry validation.
  - Routed browser auth mutation payload error filtering through the shared route guard and removed the duplicate private auth guard.
  - Verified `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`, `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Route Mutation Error Shape:
  - Tightened `routeMutationErrorMessage(...)` typed error entry validation to require string `code`, string `message`, and optional string/null `field`.
  - Added regression coverage for message-only entries and malformed `field` values while preserving compare save and saved-comparison delete feedback behavior.
  - Verified `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`, `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Route GraphQL Error Helper:
  - Added `hasRouteGraphQLErrors(...)` for shared top-level Relay GraphQL error presence checks.
  - Routed compare mutation helper compatibility and browser auth mutation normalization through the shared helper.
  - Verified `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`, `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Route Mutation Record Guard:
  - Routed `routeMutationErrorMessage(...)` typed error entry validation through shared `isRouteRecord(...)`.
  - Added regression coverage for array-shaped mutation error entries with a string `message` property while preserving compare and saved-comparison route mutation fallback behavior.
  - Verified `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`, `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/__tests__/route-records.test.ts src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Input Put-Present Helper:
  - Added `Input.put_present/3` for nil-skipping GraphQL input map insertion.
  - Replaced Catalog resolver-local `maybe_put/3` with the shared input helper while preserving optional `primary_type_taxon_id`, numeric `min`, and numeric `max` filter insertion behavior.
  - Verified `mix test test/product_compare_web/graphql/input_test.exs`, `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Boolean Input Helper:
  - Added `Input.normalize_boolean_value/1` for GraphQL boolean value normalization.
  - Replaced Catalog resolver-local `includeTypeDescendants` boolean coercion with the shared input helper while preserving `true`, `false`, and non-boolean fallback behavior.
  - Verified `mix test test/product_compare_web/graphql/input_test.exs`, `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Numeric Input Helper:
  - Added `Input.normalize_decimal_value/1` for GraphQL numeric filter value parsing.
  - Replaced Catalog resolver-local decimal parsing with the shared input helper while preserving nil, Decimal, integer, float, decimal-string, and invalid-value behavior.
  - Verified `mix test test/product_compare_web/graphql/input_test.exs`, `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Route Loader Thrown Error Helper:
  - Added `normalizeRouteLoaderThrownError(...)` for route loaders that rethrow failed preload work.
  - Replaced compare route loader-local non-`Error` rejection wrapping with the shared route-loader helper while preserving abort and `Error` rethrow behavior.
  - Verified `cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts`, `cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts src/routes/compare/__tests__/compare.route.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Node ID Helper:
  - Added `GlobalId.decode_typed_local_id/3` for root-node Relay ID local-value kind dispatch.
  - Replaced `NodeResolver.decode_node_id/1` resolver-local integer/UUID dispatch with the shared helper while preserving invalid and unsupported ID outcomes.
  - Verified `mix test test/product_compare_web/graphql/global_id_test.exs`, `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/node_query_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Connection Result Helper:
  - Added `Connection.from_query_result/3` for resolver-facing connection query result/error mapping.
  - Replaced resolver-local `Connection.from_query/3` invalid-cursor mapping in Auth, Catalog, Affiliate, and Pricing resolvers.
  - Verified `mix test test/product_compare_web/graphql/connection_test.exs`, `mix test test/product_compare_web/graphql/connection_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Affiliate Mutation Attrs Helper:
  - Added resolver-level coverage for string-key `upsertAffiliateProgram` attrs after Relay ID normalization.
  - Routed program, link, and coupon mutation attrs through normalized attr projection before Ecto changeset calls.
  - Verified `mix test test/product_compare_web/graphql/affiliate_workflows_test.exs`, `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Affiliate Network Input Helper:
  - Added resolver-level coverage for string-key affiliate-network `name` input.
  - Replaced `Map.take(input, [:name, :homepage_url])` with `Input.take_present(input, [:name])`.
  - Verified `mix test test/product_compare_web/graphql/affiliate_workflows_test.exs`, `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Affiliate At Input Helper:
  - Added resolver-level coverage for string-key `activeCoupons` timestamp input after Relay merchant ID normalization.
  - Replaced the resolver-local `Map.get(attrs, :at)` lookup with `Input.fetch_value(attrs, :at)`.
  - Verified `mix test test/product_compare_web/graphql/affiliate_workflows_test.exs`, `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Auth Token Error Helper:
  - Added `invalidTokenMutationError(message)` for shared browser auth missing-token typed mutation error construction.
  - Replaced reset-password and verify-email route-local missing-token literals while preserving route-specific messages, token guards, and verify-email request-cache behavior.
  - Verified `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts`, `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/recovery.route.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Auth Action Success Helper:
  - Added `isSuccessfulActionResult(result)` for shared auth action mutation success semantics.
  - Replaced repeated action-success predicates in forgot-password, reset-password, and verify-email routes.
  - Verified `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts`, `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/recovery.route.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Auth Transport Error Helper:
  - Added `transportMutationErrors(error)` for shared auth route transport-error list construction.
  - Replaced repeated `[transportMutationError(error)]` construction across Relay-backed auth mutation routes.
  - Verified `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts`, `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Connection Args Helper:
  - Added `ProductCompareWeb.GraphQL.Input.connection_args/1` for shared pagination arg extraction through atom/string GraphQL input semantics.
  - Routed catalog, pricing, auth-token, and active-coupon connection resolvers through the shared helper.
  - Verified `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`, `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Optional ID Field Helper:
  - Added focused coverage for string-key optional Relay ID field normalization in `ProductCompareWeb.GraphQL.Input`.
  - Updated `Input.decode_optional_integer_id_field/4` to use shared atom/string lookup and emit normalized atom-key attrs.
  - Verified `mix test test/product_compare_web/graphql/input_test.exs`, `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Input Take-Present Helper:
  - Added `ProductCompareWeb.GraphQL.Input.take_present/2` for optional non-nil attr extraction through shared atom/string lookup semantics.
  - Routed API-token create/rotate optional attrs through the shared helper.
  - Verified `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Input Drop-Key Helper:
  - Added `ProductCompareWeb.GraphQL.Input.drop_key/2` for atom/string key removal from GraphQL input maps.
  - Routed `AuthResolver.my_api_tokens/3` status lookup and pagination argument forwarding through shared input helpers.
  - Verified `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Route Mutation GraphQL Errors:
  - Extended shared route mutation error handling to treat Relay top-level GraphQL errors as generic failures.
  - Updated `/compare` save and `/compare/saved` delete completions to block success paths when top-level GraphQL errors are present.
  - Verified `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Route Mutation Promise Helper:
  - Added `commitRouteMutationPromise(...)` for promise-based Relay route mutation completion handling.
  - Replaced verify-email route-local promise plumbing with the shared helper while preserving single-use token request caching and retry eviction behavior.
  - Verified `cd assets && bun x vitest run src/routes/__tests__/relay-mutations.test.ts`, `cd assets && bun x vitest run src/routes/__tests__/relay-mutations.test.ts src/routes/auth/__tests__/recovery.route.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Route Form Data Helper:
  - Added `routeFormValue(formData, name)` for string route form-value extraction.
  - Replaced repeated auth route submit-handler `FormData` string coercion in login, register, forgot-password, and reset-password routes.
  - Verified `cd assets && bun x vitest run src/routes/__tests__/form-data.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Camelized Field Error Helper:
  - Added `ProductCompareWeb.GraphQL.Errors.camelized_mutation_error/3` for typed mutation errors that expose GraphQL camelCase input field names.
  - Replaced Affiliate resolver-local field-name camelization with the shared error helper.
  - Verified `mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Commerce ID Helper:
  - Added `ProductCompareWeb.GraphQL.GlobalId.encode_optional_value/2` for raw optional Relay ID value encoding in nested GraphQL response maps.
  - Replaced Commerce attribution resolver-local optional global ID decode and encode wrappers with shared `Input` and `GlobalId` helper calls.
  - Verified `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Changeset Error Helper:
  - Added `ProductCompareWeb.GraphQL.Errors.changeset_first_error/1` and `changeset_first_message/1`.
  - Replaced Auth and Affiliate resolver-local first changeset error helpers with shared helper calls.
  - Verified `mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Affiliate Input Helper:
  - Added `ProductCompareWeb.GraphQL.Input.decode_optional_integer_id_field/4` for optional integer-backed Relay ID map-field normalization.
  - Replaced Affiliate resolver-local global ID casting with shared helper calls for affiliate network, merchant, merchant product, and artifact inputs.
  - Verified `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Global ID Field Helper:
  - Added `ProductCompareWeb.GraphQL.GlobalId.encode_required/2` and `encode_optional/2` for Absinthe field resolver ID wrappers.
  - Replaced schema-local global ID wrapper helpers with shared `GlobalId` helper calls.
  - Verified `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Connection Input Helper:
  - Added focused connection coverage for string-key pagination args, atom-key precedence, cursor continuation, and invalid cursor rejection.
  - Replaced `ProductCompareWeb.GraphQL.Connection`'s duplicate pagination argument lookup helper with `ProductCompareWeb.GraphQL.Input.fetch_value/3`.
  - Verified `mix test test/product_compare_web/graphql/connection_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Catalog Input Helper:
  - Extended `ProductCompareWeb.GraphQL.Input` with list-value lookup, integer ID list decoding, and required UUID-backed global ID decoding.
  - Replaced Catalog resolver-local input helper duplication with shared helper calls for catalog filters and saved-comparison mutation inputs.
  - Added focused helper coverage for list fallback semantics, ordered ID-list decoding, non-list errors, and UUID ID decoding.
  - Verified `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Input Helper:
  - Added `ProductCompareWeb.GraphQL.Input` for shared GraphQL resolver input lookup and integer global ID decoding.
  - Replaced pricing and commerce attribution resolver-local input lookup and integer global ID decode wrappers with calls to the shared helper.
  - Added focused helper coverage for lookup precedence, default fallback, ID decode success, invalid ID rejection, and optional nil handling.
  - Verified `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Route Record Guards:
  - Added `isRouteRecord(...)` for shared route-level unknown-object guards.
  - Replaced duplicated local `isRecord(...)` helpers in browser auth mutation normalization and saved-comparison route data parsing.
  - Added focused helper coverage for route payload record acceptance and non-record rejection cases.
  - Verified `cd assets && bun x vitest run src/routes/__tests__/route-records.test.ts src/routes/auth/__tests__/errors.test.ts src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Route Mutation Error Helper:
  - Added `routeMutationErrorMessage(...)` beside the shared default route fallback message.
  - Replaced duplicated first typed mutation error message fallback handling in `/compare` save and `/compare/saved` delete flows.
  - Added focused helper coverage for typed mutation messages and malformed fallback cases.
  - Verified `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Route Loader Error Helper:
  - Added `recoverRouteLoaderError(...)` to centralize recoverable route-loader fallback behavior.
  - Replaced catalog browse and product detail/offers loader-local abort/log/fallback handling with the shared helper.
  - Added focused helper coverage for recoverable logging and abort rethrow behavior.
  - Verified `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Mutation Error Helper:
  - Added shared GraphQL helpers for generic typed mutation error maps and Ecto changeset mutation errors.
  - Replaced auth, catalog, and affiliate resolver-local generic mutation error helpers with calls to `ProductCompareWeb.GraphQL.Errors`.
  - Added focused helper coverage for field normalization and changeset interpolation.
  - Verified `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Unauthenticated Mutation Error Helper:
  - Added `ProductCompareWeb.GraphQL.Errors.unauthenticated_mutation_error/0` for resolver-local typed mutation payloads.
  - Routed API token, saved-comparison, and affiliate unauthenticated typed mutation payloads through the shared helper.
  - Added focused helper coverage for the typed mutation error shape.
  - Verified `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Auth Mutation Result Helper:
  - Added shared auth mutation result helpers that compose top-level Relay GraphQL error handling with existing session/action payload normalization.
  - Routed login, register, forgot-password, reset-password, and verify-email mutation completions through the shared helpers.
  - Added focused auth error-helper coverage.
  - Verified `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Backend GraphQL Global ID Encode Helper:
  - Added integer local-ID support to `GlobalId.encode/2`.
  - Removed caller-side global ID integer string conversions from schema, commerce attribution, ConnCase, and commerce revenue summary tests.
  - Added focused `GlobalId.encode/2` coverage for integer local IDs.
  - Verified `mix format --check-formatted`, `mix test`, `mix compile --warnings-as-errors`, `mix typecheck`, `cd assets && bun run check`, and `git diff --check`.

- Backend GraphQL Global ID Decode Helper:
  - Added `GlobalId.decode_integer/2` and `GlobalId.decode_uuid/2` with expected-type, positive integer, PostgreSQL bigint, and UUID validation.
  - Replaced resolver-local global-ID parsing in auth, catalog, pricing, affiliate, commerce attribution, and node resolvers.
  - Added focused `GlobalId` coverage for integer-backed and UUID-backed IDs.
  - Verified `mix format --check-formatted`, `mix test`, `mix compile --warnings-as-errors`, `mix typecheck`, `cd assets && bun run check`, and `git diff --check`.

- Backend GraphQL Test Global ID Helper:
  - Added a ConnCase `relay_id/2` helper that delegates to `ProductCompareWeb.GraphQL.GlobalId`.
  - Added focused ConnCase coverage for integer-backed and entropy-backed GraphQL global IDs.
  - Migrated request-level GraphQL tests off duplicated local Base64 Relay ID helpers.
  - Verified `mix format --check-formatted`, `mix test`, `mix compile --warnings-as-errors`, `mix typecheck`, `cd assets && bun run check`, and `git diff --check`.

- Frontend Route Loader Context Invariants:
  - Made `browseLoader` fail fast for missing Relay router context instead of masking the wiring invariant as a catalog unavailable state.
  - Added regression coverage proving missing context rejects before `preloadRouteQuery(...)` and does not log a recoverable preload failure.
  - Verified `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- Frontend Saved Comparisons Auth-Code Cleanup:
  - Tightened `/compare/saved` loader auth-state detection to structured `UNAUTHENTICATED` and `FORBIDDEN` GraphQL errors.
  - Added a regression proving legacy `UNAUTHORIZED` extension codes are ignored instead of being treated as the route's signed-out state.
  - Verified `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

- GraphQL Unauthenticated Mutation Errors:
  - Centralized the GraphQL unauthenticated code in `ProductCompareWeb.GraphQL.Errors`.
  - Updated API token, saved-comparison, and affiliate mutation payloads to return `UNAUTHENTICATED` for missing-session failures.
  - Verified `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`.

- GraphQL Price Point Node Contract:
  - Extended root `node(id:)` lookup to public `PricePoint` records that are already exposed through `latestPrice` and `priceHistory`.
  - Added `ProductCompare.Pricing.get_price_point/1`, `NodeResolver` dispatch, and schema `:node` interface support for `PricePoint`.
  - Kept `SourceArtifact` as the unsupported-node regression because it still lacks a public GraphQL object contract.
  - Verified `mix test test/product_compare_web/graphql/node_query_test.exs`.

- GraphQL Affiliate Node Contract:
  - Extended root `node(id:)` lookup to authenticated `AffiliateNetwork`, `AffiliateProgram`, `AffiliateLink`, and `Coupon` records that already expose Relay global IDs.
  - Kept anonymous affiliate node lookups private by returning `node: null` without GraphQL errors.
  - Added small `ProductCompare.Affiliate` read helpers for node dispatch and schema `:node` interface support for affiliate object types.
  - Verified `mix test test/product_compare_web/graphql/node_query_test.exs`.

- Frontend Saved Comparisons Relay Migration, Task 3:
  - Recorded `/compare/saved` as fully on Relay query/mutation APIs with no raw saved-comparison GraphQL strings remaining in the route helper.
  - Updated dependent route-data, saved-comparisons UI, compare/saved hardening, architecture, plan index, and NOW docs to close stale manual-helper follow-up language.
  - Kept dependent compare/saved work items closed; no new compare/saved UI polish batch is queued from this migration.
  - Verified `cd assets && bun run relay`, `cd assets && bun run typecheck`, `cd assets && bun run test:unit`, and `git diff --check`.

- Frontend Saved Comparisons Relay Migration, Task 2:
  - Added `DeleteSavedComparisonSetMutation` and generated `assets/src/__generated__/DeleteSavedComparisonSetMutation.graphql.ts`.
  - Updated `SavedComparisonsRoute` so saved-set deletes commit through Relay while preserving duplicate-click suppression, per-row pending state, typed error display, stale error clearing, local removal, and route status behavior.
  - Removed the manual `deleteSavedComparisonSet(...)` helper and raw delete mutation string from `assets/src/routes/compare/saved-data.ts`.
  - Updated focused saved-route tests to assert Relay mutation variables and callback behavior instead of direct `fetchGraphQL(...)` deletion.
  - Verified `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, and `cd assets && bun run typecheck`.

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
