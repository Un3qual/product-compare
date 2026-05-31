# Active Work Index

Start here before opening dated plans or checkpoint logs.

## How To Use This Folder

- Read this file first.
- In single-agent mode, open only the highest-priority unblocked active lane.
- In parallel mode, assign one worker to the highest-priority unblocked frontend lane and one worker to the highest-priority unblocked backend lane.
- Each worker stays inside its lane's `Owned paths`; shared planning docs stay coordinator-owned.
- Verify the selected batch against the codebase before editing.
- Workers update only their lane work doc as they go.
- Coordinators update this file plus `docs/plans/NOW.md` and `docs/plans/INDEX.md` whenever lane status, priority, or blockers change.

## Suggested Executor Prompts

```text
Coordinator prompt:
Start at docs/work/index.md.

Run in parallel-lane mode.
Assign one worker to the highest-priority unblocked frontend lane and one worker to the highest-priority unblocked backend lane.
Keep `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` coordinator-owned.
Do not let workers edit the same files.
If a worker reports a blocker outside its owned paths, update the lane docs instead of having it cross lanes.
Integrate shared-doc updates only after reviewing both lane results.
Open or update a PR only when the coordinated slice is ready.
```

```text
Lane worker prompt:
Start at docs/work/index.md and open only the active {frontend|backend} lane assigned to you.

Execute the `Next batch` from that lane's work doc.
Before coding, verify the selected batch against the codebase and correct any drift in that lane doc.
Edit only the lane's `Owned paths` and that lane's work doc.
Do not edit `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, or `ARCHITECTURE.md` unless your prompt explicitly says you are the coordinator.
If the work requires another lane's files or a coordinator-owned doc, record a blocker in your lane doc and stop.
Commit only lane-local milestone changes.
```

## Active Work Lanes

- Frontend lane
  - Work doc: `docs/work/frontend-route-mutation-error-guard.md`
  - Status: completed
  - Priority: P2
  - Next batch: no unblocked frontend batch is queued from this worktree; coordinator follow-up can choose a future frontend lane if priorities change.
  - Owned paths: `assets/src/routes/route-errors.ts`, `assets/src/routes/auth/errors.ts`, `assets/src/routes/__tests__/route-errors.test.ts`, `assets/src/routes/auth/__tests__/errors.test.ts`, `assets/src/routes/auth/__tests__/session.route.test.tsx`, `assets/src/routes/auth/__tests__/recovery.route.test.tsx`, `assets/src/routes/compare/__tests__/compare-save-feedback.test.tsx`, `assets/src/routes/compare/__tests__/compare.route.test.tsx`, `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, `docs/work/frontend-route-mutation-error-guard.md`, `docs/plans/2026-05-30-frontend-route-mutation-error-guard-implementation-plan.md`

- Backend lane
  - Work doc: `docs/work/backend-core-attrs-keyword-helper.md`
  - Status: completed
  - Priority: P2
  - Next batch: no unblocked backend batch is queued from this worktree; coordinator follow-up can choose another review-driven backend slice if priorities change.
  - Owned paths: `lib/product_compare/attrs.ex`, `lib/product_compare/commerce_attribution.ex`, `test/product_compare/attrs_test.exs`, `test/product_compare/commerce_attribution/commerce_attribution_test.exs`, `docs/work/backend-core-attrs-keyword-helper.md`, `docs/plans/2026-05-31-backend-core-attrs-keyword-helper-implementation-plan.md`

- Commerce attribution lane
  - Work doc: `docs/work/affiliate-revenue-attribution.md`
  - Status: completed
  - Priority: P2
  - Next batch: no unblocked commerce attribution batch remains in this worktree; CJ/Awin source-field mapping is deferred pending account docs or sample payloads.
  - Owned paths: `lib/product_compare/**`, `lib/product_compare_web/**`, `priv/repo/migrations/**`, `test/product_compare/**`, `docs/work/affiliate-revenue-attribution.md`, `docs/plans/2026-03-23-affiliate-link-attribution-and-revenue-tracking-plan.md`, `docs/plans/2026-05-22-commerce-revenue-summary-graphql-implementation-plan.md`

- Product data ingestion lane
  - Work doc: `docs/work/product-data-scraping.md`
  - Status: blocked
  - Priority: P2
  - Next batch: no unblocked local ingestion batch is queued from this worktree; live CJ validation and source onboarding compliance signoff must unblock before live provider polling or Tier-3 scraping work begins.
  - Owned paths: `lib/product_compare/ingestion/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_schemas/ingestion/**`, `lib/product_compare_schemas/specs/**`, `lib/product_compare_schemas/pricing/**`, `priv/repo/migrations/**`, `test/product_compare/ingestion/**`, `test/support/fixtures/cj/**`, `docs/work/product-data-scraping.md`, `docs/plans/2026-05-23-product-data-ingestion-foundation-implementation-plan.md`, `docs/decisions/2026-05-23-ingestion-execution-boundary.md`

## Blocked / Needs Decision

- Live product-provider validation
  - Status: blocked
  - Priority: P2
  - Reason: live CJ credential path, quota behavior, and account-scoped sample payloads are not yet recorded.
  - Next batch after unblock: validate the live CJ product catalog scope; fall back to eBay Browse only if CJ scope is insufficient.

## Recently Completed

### Backend Core Attrs Keyword Helper

- Status: completed on 2026-05-31
- Source of truth: `docs/work/backend-core-attrs-keyword-helper.md`
- Outcome:
  - Added keyword-list support to `ProductCompare.Attrs.fetch/3`, `has_key?/2`, and derived `present?/2` behavior.
  - Routed Commerce Attribution revenue summary keyword/map filter lookup through the shared core helper.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend Core Attrs Presence Helper

- Status: completed on 2026-05-31
- Source of truth: `docs/work/backend-core-attrs-presence-helper.md`
- Outcome:
  - Added `ProductCompare.Attrs.has_key?/2` and `present?/2` for reusable atom/string attr presence checks.
  - Routed Commerce Attribution click-session lookup, default attribution confidence, and upsert-field detection through the shared core helper.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend Core Attrs Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-core-attrs-helper.md`
- Outcome:
  - Added `ProductCompare.Attrs` for core atom/string attr lookup, non-map normalization, and nil-skipping insertion.
  - Routed API-token attr handling in `ProductCompare.Accounts` through the shared core helper.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Route Mutation Error Guard

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-route-mutation-error-guard.md`
- Outcome:
  - Exported `RouteMutationError` and `isRouteMutationError(...)` for shared typed GraphQL mutation error entry validation.
  - Routed browser auth mutation payload error normalization through the shared route guard.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Route Mutation Error Shape

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-route-mutation-error-shape.md`
- Outcome:
  - Tightened `routeMutationErrorMessage(...)` typed error entry validation to require the GraphQL mutation error payload shape.
  - Added regression coverage for message-only entries and malformed `field` values.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Route GraphQL Error Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-route-graphql-error-helper.md`
- Outcome:
  - Added `hasRouteGraphQLErrors(...)` for top-level Relay GraphQL error presence checks.
  - Routed compare mutation and browser auth mutation normalization through the shared helper.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Route Mutation Record Guard

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-route-mutation-record-guard.md`
- Outcome:
  - Routed `routeMutationErrorMessage(...)` typed error entry validation through shared `isRouteRecord(...)`.
  - Added regression coverage for array-shaped mutation error entries with a string `message` property.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Input Put-Present Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-input-put-present-helper.md`
- Outcome:
  - Added `Input.put_present/3` for nil-skipping GraphQL input map insertion.
  - Replaced Catalog resolver-local `maybe_put/3` with the shared input helper for normalized filter insertion.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Boolean Input Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-boolean-input-helper.md`
- Outcome:
  - Added `Input.normalize_boolean_value/1` for GraphQL boolean value normalization.
  - Replaced Catalog resolver-local `includeTypeDescendants` boolean coercion with the shared input helper.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Numeric Input Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-numeric-input-helper.md`
- Outcome:
  - Added `Input.normalize_decimal_value/1` for GraphQL numeric filter value parsing.
  - Replaced Catalog resolver-local decimal parsing with the shared input helper.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Route Loader Thrown Error Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-route-loader-thrown-error-helper.md`
- Outcome:
  - Added `normalizeRouteLoaderThrownError(...)` for route loaders that rethrow failed preload work.
  - Replaced compare route loader-local non-`Error` rejection wrapping with the shared route-loader helper.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Node ID Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-node-id-helper.md`
- Outcome:
  - Added `GlobalId.decode_typed_local_id/3` for root-node Relay ID local-value kind dispatch.
  - Replaced `NodeResolver.decode_node_id/1` resolver-local integer/UUID dispatch with the shared helper.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Connection Result Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-connection-result-helper.md`
- Outcome:
  - Added `Connection.from_query_result/3` for resolver-facing connection query result/error mapping.
  - Replaced repeated invalid-cursor mapping in Auth, Catalog, Affiliate, and Pricing resolvers.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Affiliate Mutation Attrs Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-affiliate-mutation-attrs-helper.md`
- Outcome:
  - Added resolver-level coverage for string-key `upsertAffiliateProgram` attrs after Relay ID normalization.
  - Routed program, link, and coupon mutation attrs through normalized attr projection before Ecto changeset calls.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Affiliate Network Input Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-affiliate-network-input-helper.md`
- Outcome:
  - Added resolver-level coverage for string-key affiliate-network `name` input.
  - Routed affiliate-network mutation attr extraction through `Input.take_present/2`.
  - Removed stale unsupported `homepage_url` selection from the resolver path.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Affiliate At Input Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-affiliate-at-input-helper.md`
- Outcome:
  - Added resolver-level coverage for string-key `activeCoupons` timestamp input after Relay merchant ID normalization.
  - Routed optional timestamp lookup through `Input.fetch_value/3` to match shared GraphQL input semantics.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Auth Token Error Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-auth-token-error-helper.md`
- Outcome:
  - Added `invalidTokenMutationError(message)` for shared browser auth missing-token typed mutation error construction.
  - Replaced reset-password and verify-email route-local missing-token literals while preserving route-specific messages and token behavior.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Auth Action Success Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-auth-action-success.md`
- Outcome:
  - Added `isSuccessfulActionResult(result)` for shared auth action mutation success semantics.
  - Replaced repeated action-success predicates in forgot-password, reset-password, and verify-email routes.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Auth Transport Error Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-auth-transport-errors.md`
- Outcome:
  - Added `transportMutationErrors(error)` for shared auth route transport-error list construction.
  - Replaced repeated `[transportMutationError(error)]` construction across Relay-backed auth mutation routes.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Connection Args Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-connection-args-helper.md`
- Outcome:
  - Added `ProductCompareWeb.GraphQL.Input.connection_args/1` for shared pagination arg extraction through atom/string GraphQL input semantics.
  - Routed catalog, pricing, auth-token, and active-coupon connection resolvers through the shared helper.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Optional ID Field Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-optional-id-field-helper.md`
- Outcome:
  - Added focused coverage for string-key optional Relay ID field normalization in `ProductCompareWeb.GraphQL.Input`.
  - Updated `Input.decode_optional_integer_id_field/4` to use shared atom/string lookup and emit normalized atom-key attrs.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Input Take-Present Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-input-take-present-helper.md`
- Outcome:
  - Added `ProductCompareWeb.GraphQL.Input.take_present/2` for optional non-nil attr extraction through shared atom/string lookup semantics.
  - Routed API-token create/rotate optional attrs through the shared helper.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Input Drop-Key Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-input-drop-key-helper.md`
- Outcome:
  - Added `ProductCompareWeb.GraphQL.Input.drop_key/2` for atom/string key removal from GraphQL input maps.
  - Routed `AuthResolver.my_api_tokens/3` status lookup and pagination argument forwarding through shared input helpers.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Route Mutation GraphQL Errors

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-route-mutation-graphql-errors.md`
- Outcome:
  - Extended shared route mutation error handling to treat Relay top-level GraphQL errors as generic failures.
  - Updated `/compare` save and `/compare/saved` delete completions to block success paths when top-level GraphQL errors are present.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Route Mutation Promise Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-route-mutation-promise-helper.md`
- Outcome:
  - Added `commitRouteMutationPromise(...)` for promise-based Relay route mutation completion handling.
  - Replaced verify-email route-local promise plumbing with the shared helper while preserving single-use token request caching and retry eviction behavior.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Route Form Data Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-route-form-data-helper.md`
- Outcome:
  - Added `routeFormValue(formData, name)` for string route form-value extraction.
  - Replaced repeated auth route submit-handler `FormData` string coercion in login, register, forgot-password, and reset-password routes.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Camelized Field Error Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-camelized-field-error-helper.md`
- Outcome:
  - Added `ProductCompareWeb.GraphQL.Errors.camelized_mutation_error/3` for typed mutation errors that expose GraphQL camelCase input field names.
  - Replaced Affiliate resolver-local field-name camelization with the shared error helper.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Commerce ID Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-commerce-id-helper.md`
- Outcome:
  - Added `ProductCompareWeb.GraphQL.GlobalId.encode_optional_value/2` for raw optional Relay ID value encoding in nested GraphQL response maps.
  - Replaced Commerce attribution resolver-local optional global ID decode and encode wrappers with shared `Input` and `GlobalId` helper calls.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Changeset Error Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-changeset-error-helper.md`
- Outcome:
  - Added `ProductCompareWeb.GraphQL.Errors.changeset_first_error/1` and `changeset_first_message/1`.
  - Replaced Auth and Affiliate resolver-local first changeset error helpers with shared helper calls.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Affiliate Input Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-affiliate-input-helper.md`
- Outcome:
  - Added `ProductCompareWeb.GraphQL.Input.decode_optional_integer_id_field/4` for optional integer-backed Relay ID map-field normalization.
  - Replaced Affiliate resolver-local global ID casting with shared helper calls for affiliate network, merchant, merchant product, and artifact inputs.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Global ID Field Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-global-id-field-helper.md`
- Outcome:
  - Added `ProductCompareWeb.GraphQL.GlobalId.encode_required/2` and `encode_optional/2` for Absinthe field resolver ID wrappers.
  - Replaced schema-local global ID wrapper helpers with shared `GlobalId` helper calls.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Connection Input Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-connection-input-helper.md`
- Outcome:
  - Added focused connection coverage for string-key pagination args, atom-key precedence, cursor continuation, and invalid cursor rejection.
  - Replaced `ProductCompareWeb.GraphQL.Connection`'s duplicate pagination argument lookup helper with `ProductCompareWeb.GraphQL.Input.fetch_value/3`.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Catalog Input Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-catalog-input-helper.md`
- Outcome:
  - Extended `ProductCompareWeb.GraphQL.Input` with list-value lookup, integer ID list decoding, and required UUID-backed global ID decoding.
  - Replaced Catalog resolver-local input helper duplication with shared helper calls for catalog filters and saved-comparison mutation inputs.
  - Added focused helper coverage for list fallback semantics, ordered ID-list decoding, non-list errors, and UUID ID decoding.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Input Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-input-helper.md`
- Outcome:
  - Added `ProductCompareWeb.GraphQL.Input` for shared GraphQL resolver input lookup and integer global ID decoding.
  - Replaced pricing and commerce attribution resolver-local input lookup and integer global ID decode wrappers with calls to the shared helper.
  - Added focused helper coverage for lookup precedence, default fallback, ID decode success, invalid ID rejection, and optional nil handling.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Route Record Guards

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-route-record-guards.md`
- Outcome:
  - Added `isRouteRecord(...)` for shared route-level unknown-object guards.
  - Replaced duplicated local `isRecord(...)` helpers in browser auth mutation normalization and saved-comparison route data parsing.
  - Added focused helper coverage for route payload record acceptance and non-record rejection cases.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Route Mutation Error Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-route-mutation-error-helper.md`
- Outcome:
  - Added `routeMutationErrorMessage(...)` beside the shared default route fallback message.
  - Replaced duplicated first typed mutation error message fallback handling in `/compare` save and `/compare/saved` delete flows.
  - Added focused helper coverage for typed mutation messages and malformed fallback cases.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Route Loader Error Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-route-loader-error-helper.md`
- Outcome:
  - Added `recoverRouteLoaderError(...)` to centralize recoverable route-loader fallback behavior.
  - Replaced catalog browse and product detail/offers loader-local abort/log/fallback handling with the shared helper.
  - Added focused helper coverage for recoverable logging and abort rethrow behavior.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Mutation Error Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-mutation-error-helper.md`
- Outcome:
  - Added shared GraphQL helpers for generic typed mutation error maps and Ecto changeset mutation errors.
  - Replaced auth, catalog, and affiliate resolver-local generic mutation error helpers with calls to `ProductCompareWeb.GraphQL.Errors`.
  - Added focused helper coverage for field normalization and changeset interpolation.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Unauthenticated Mutation Error Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-unauthenticated-mutation-error-helper.md`
- Outcome:
  - Added `ProductCompareWeb.GraphQL.Errors.unauthenticated_mutation_error/0` for resolver-local typed mutation payloads.
  - Routed API token, saved-comparison, and affiliate unauthenticated typed mutation payloads through the shared helper.
  - Added focused helper coverage for the typed mutation error shape.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Frontend Auth Mutation Result Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-auth-mutation-results.md`
- Outcome:
  - Added shared auth mutation result helpers that compose top-level Relay GraphQL error handling with existing session/action payload normalization.
  - Routed login, register, forgot-password, reset-password, and verify-email mutation completions through the shared helpers.
  - Added focused auth error-helper coverage.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Global ID Encode Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-global-id-encode-helper.md`
- Outcome:
  - Added integer local-ID support to `GlobalId.encode/2`.
  - Removed caller-side global ID integer string conversions from schema, commerce attribution, ConnCase, and commerce revenue summary tests.
  - Added focused `GlobalId.encode/2` coverage for integer local IDs.
  - Verification passed with `mix format --check-formatted`, `mix test`, `mix compile --warnings-as-errors`, `mix typecheck`, `cd assets && bun run check`, and `git diff --check`.

### Backend GraphQL Global ID Decode Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-global-id-decode-helper.md`
- Outcome:
  - Added `GlobalId.decode_integer/2` and `GlobalId.decode_uuid/2` with expected-type, positive integer, PostgreSQL bigint, and UUID validation.
  - Replaced resolver-local global-ID parsing in auth, catalog, pricing, affiliate, commerce attribution, and node resolvers.
  - Added focused `GlobalId` coverage for integer-backed and UUID-backed IDs.
  - Verification passed with `mix format --check-formatted`, `mix test`, `mix compile --warnings-as-errors`, `mix typecheck`, `cd assets && bun run check`, and `git diff --check`.

### Frontend Route Loader Context Invariants

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-route-loader-invariants.md`
- Outcome:
  - Made `browseLoader` fail fast for missing Relay router context, matching the other Relay-backed route loaders.
  - Added regression coverage that the missing-context invariant rejects before `preloadRouteQuery(...)` and is not logged as a recoverable catalog outage.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Backend GraphQL Test Global ID Helper

- Status: completed on 2026-05-30
- Source of truth: `docs/work/backend-graphql-test-global-id-helper.md`
- Outcome:
  - Added a ConnCase `relay_id/2` helper that delegates to `ProductCompareWeb.GraphQL.GlobalId`.
  - Added focused ConnCase coverage for integer-backed and entropy-backed GraphQL global IDs.
  - Migrated request-level GraphQL tests off duplicated local Base64 Relay ID helpers.
  - Verification passed with `mix format --check-formatted`, `mix test`, `mix compile --warnings-as-errors`, `mix typecheck`, `cd assets && bun run check`, and `git diff --check`.

### Frontend Saved Comparisons Auth-Code Cleanup

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-saved-comparisons-relay-migration.md`
- Outcome:
  - Tightened `/compare/saved` loader auth-state detection to the current structured GraphQL contract: `UNAUTHENTICATED` and `FORBIDDEN`.
  - Added regression coverage proving the legacy `UNAUTHORIZED` extension code is ignored instead of being treated as saved-route auth state.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### GraphQL Unauthenticated Mutation Errors

- Status: completed on 2026-05-30
- Source of truth: `docs/work/graphql-auth-migration.md`
- Outcome:
  - Centralized the unauthenticated GraphQL error code in `ProductCompareWeb.GraphQL.Errors`.
  - Updated API token, saved-comparison, and affiliate mutation payloads to return `UNAUTHENTICATED` for missing-session failures.
  - Kept top-level auth-required query errors on the same code path.
  - Verification passed with `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`.

### GraphQL Price Point Node Contract

- Status: completed on 2026-05-30
- Source of truth: `docs/work/graphql-relay-contract-hardening.md`
- Outcome:
  - Extended root `node(id:)` lookup to public `PricePoint` records already exposed by `latestPrice` and `priceHistory`.
  - Added focused GraphQL coverage for `PricePoint` node success and kept `SourceArtifact` as the unsupported-node regression.
  - Added `ProductCompare.Pricing.get_price_point/1`, `NodeResolver` dispatch, and schema `:node` interface support for `PricePoint`.
  - Verification passed with `mix test test/product_compare_web/graphql/node_query_test.exs`.

### GraphQL Affiliate Node Contract

- Status: completed on 2026-05-30
- Source of truth: `docs/work/graphql-relay-contract-hardening.md`
- Outcome:
  - Extended root `node(id:)` lookup to authenticated `AffiliateNetwork`, `AffiliateProgram`, `AffiliateLink`, and `Coupon` records that already expose Relay global IDs.
  - Kept anonymous affiliate node lookups private by returning `node: null` without GraphQL errors.
  - Added focused GraphQL coverage for authenticated affiliate node success and anonymous affiliate null behavior.
  - Verification passed with `mix test test/product_compare_web/graphql/node_query_test.exs`.

### Frontend Saved Comparisons Relay Migration Task 3

- Status: completed on 2026-05-30
- Source of truth: `docs/work/frontend-saved-comparisons-relay-migration.md`
- Outcome:
  - Recorded `/compare/saved` as fully on Relay query/mutation APIs with no raw saved-comparison GraphQL strings remaining in the route helper.
  - Updated dependent route-data, saved-comparisons UI, compare/saved hardening, architecture, plan index, and NOW docs to close stale manual-helper follow-up language.
  - Kept dependent compare/saved work items closed; no new compare/saved UI polish batch is queued from this migration.
  - Verification passed with `cd assets && bun run relay`, `cd assets && bun run typecheck`, `cd assets && bun run test:unit`, and `git diff --check`.

### Frontend Saved Comparisons Relay Migration Task 2

- Status: completed on 2026-05-29
- Source of truth: `docs/work/frontend-saved-comparisons-relay-migration.md`
- Outcome:
  - Added the Relay `DeleteSavedComparisonSetMutation` source and generated artifact.
  - Updated `/compare/saved` deletion to commit through Relay while preserving duplicate-click suppression, per-row pending state, typed error display, stale error clearing, local removal, and route status behavior.
  - Removed the manual raw delete mutation helper from `assets/src/routes/compare/saved-data.ts`.
  - Verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, and `cd assets && bun run typecheck`.

### Product Data Ingestion Persistence Task 2

- Status: completed on 2026-05-24
- Source of truth: `docs/work/product-data-scraping.md`
- Outcome:
  - Added `ProductCompare.Ingestion.persist_normalized_listing/2` to persist fixture-backed normalized listings into `SourceArtifact`, `ExternalProduct`, generated catalog product shells, `MerchantProduct`, and `PricePoint`.
  - Reused source-scoped merchant identities for merchant resolution and added replay idempotency for exact normalized listing replays.
  - Added stale-observation guards so older listing observations do not overwrite current merchant product state or add older price points.
  - Added database uniqueness indexes for replay-safe source artifact and price point writes.
  - Verification passed with `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs` and `mix typecheck`.

### Product Data Ingestion Foundation Task 1

- Status: completed on 2026-05-23
- Source of truth: `docs/work/product-data-scraping.md`
- Outcome:
  - Selected CJ as the first fixture-backed source and recorded the synchronous pilot boundary in `docs/decisions/2026-05-23-ingestion-execution-boundary.md`.
  - Added `merchant_source_identities` plus the ingestion schema/context boundary for deterministic source-scoped merchant resolution.
  - Added the normalized listing contract, adapter behavior, CJ fixture parser, and focused ingestion/parser tests.
  - Verification passed with `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs`, `mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`, and `mix typecheck`.

### Commerce Attribution Task 3

- Status: completed on 2026-05-23
- Source of truth: `docs/work/affiliate-revenue-attribution.md`
- Outcome:
  - Added a read-only GraphQL `revenueSummary` query over the Task 2 dashboard summary contract.
  - Added Relay global ID normalization for merchant/product filters plus explicit network, currency, and date inputs.
  - Returned GraphQL-safe filter, metric, and server-enforced suppression objects while rejecting invalid filters.
  - Verification passed with `mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`, `mix typecheck`, and `git diff --check`.

### Commerce Attribution Task 2

- Status: completed on 2026-05-22
- Source of truth: `docs/work/affiliate-revenue-attribution.md`
- Outcome:
  - Added a query-backed revenue projection over click sessions, approved/paid conversions, and purchase-price facts.
  - Added merchant, product, network, and dashboard revenue summary context functions with JSON-ready metric and suppression shapes.
  - Verification passed with `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs`, `mix typecheck`, and `git diff --check`.

### Commerce Attribution Task 1

- Status: completed on 2026-05-21
- Source of truth: `docs/work/affiliate-revenue-attribution.md`
- Outcome:
  - Added the redirect/attribution ADR plus core `commerce_links`, `commerce_click_sessions`, `commerce_conversions`, and `purchase_price_facts` persistence.
  - Added redirect resolution, idempotent conversion ingest, an Impact adapter, and focused redirect/context tests.
  - Verification passed with `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs`.

### Frontend Relay Route-Data Adoption

- Status: completed on 2026-05-21
- Source of truth: `docs/work/frontend-relay-route-data.md`
- Outcome:
  - Relay SSR hydration, route preloading, `/products`, `/products/:slug`, `/compare`, and browser auth Relay migrations are complete.
  - `fetchGraphQL` is now a thin GraphQL HTTP transport helper, with route-loader top-level GraphQL error rejection kept in the Relay environment.
  - The later saved-comparisons Relay migration moved `/compare/saved` onto Relay query/mutation APIs and closed the explicit helper cleanup.

### Frontend Compare And Saved Routes Hardening

- Status: completed on 2026-05-21
- Source of truth: `docs/work/frontend-compare-saved-hardening.md`
- Outcome:
  - Shared compare shell, route-local status semantics, and compare-scoped route error boundaries are already in place.
  - The prior queue-rebaseline blocker is closed because Relay route-data Task 6 is complete.

### Frontend Relay Auth Mutation Migration

- Status: completed on 2026-05-02
- Source of truth: `docs/work/frontend-relay-route-data.md`
- Outcome:
  - Login, register, forgot-password, reset-password, and verify-email routes now commit the existing GraphQL auth contract through Relay mutation artifacts.
  - Removed the route-local `assets/src/routes/auth/actions.ts` helper and moved shared payload/error normalization to `assets/src/routes/auth/errors.ts`.
  - Verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`, and `cd assets && bun run typecheck`.

### GraphQL Relay Contract Hardening

- Status: completed on 2026-04-30
- Source of truth: `docs/work/graphql-relay-contract-hardening.md`
- Outcome:
  - Root `node(id: ID!)` support covers public catalog/pricing nodes plus owner-scoped saved comparison sets and API tokens.
  - Verification passed with `mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/api_token_auth_test.exs && mix typecheck`.

### Frontend Saved Comparisons UI

- Status: completed on 2026-03-19
- Source of truth: `docs/work/frontend-saved-comparisons-ui.md`
- Outcome:
  - `/compare` now saves ready-state selections through `createSavedComparisonSet`.
  - `/compare/saved` now lists private saved sets, reopens them back into `/compare` with repeated `slug` params, and deletes them from the UI.
  - Frontend verification passed with `cd assets && /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run src/routes/compare/__tests__/compare.route.test.tsx src/routes/__tests__/root.route.test.tsx` and `cd assets && /opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`.

### Saved Comparisons Backend

- Status: completed on 2026-03-18
- Source of truth: `docs/work/saved-comparisons-backend.md`
- Outcome:
  - Added owner-scoped `saved_comparison_sets` and `saved_comparison_items` persistence with ordered product items.
  - Added catalog APIs and GraphQL query/mutation support for listing, creating, and deleting private saved comparison sets.
  - Verification passed with `mix test test/product_compare/catalog/saved_comparison_set_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs` and `mix typecheck`.

### GraphQL Dataloader Adoption

- Status: completed on 2026-03-18
- Source of truth: `docs/work/graphql-dataloader-adoption.md`
- Outcome:
  - Added a request-level GraphQL batching regression test at `test/product_compare_web/graphql/dataloader_batching_test.exs`.
  - Locked the relevant SQL envelope for one request spanning aliased `product` selections plus `merchantProducts`: three `products` selects and one each for `brands`, `merchant_products`, `merchants`, and `price_points`.
  - Verification passed with `mix test test/product_compare_web/graphql/dataloader_batching_test.exs`, `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`, and `mix test test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`.

### Frontend Radix Primitives

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-radix-primitives.md`
- Outcome:
  - Added a shared frontend Radix wrapper layer at `assets/src/ui/primitives/` for `Button`, `Label`, `Separator`, and `Slot`.
  - Migrated the app shell, root navigation/actions, and shared auth form shell onto that wrapper layer while keeping existing route behavior and link semantics intact.
  - Verification passed with `cd assets && bun x vitest run src/ui/__tests__/primitives.test.tsx src/ui/__tests__/app-providers.test.tsx src/ui/__tests__/app-shell.test.tsx src/routes/__tests__/root.route.test.tsx src/routes/auth/__tests__/form-shell.test.tsx src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx` and `cd assets && bun run check`.

### Frontend Compare Baseline

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-compare-baseline.md`
- Outcome:
  - `/compare` now SSR-renders up to three product cards from repeated `slug` query params using the existing GraphQL product-detail path.
  - The route now distinguishes empty, over-limit, ready, missing-product, and unavailable states with focused compare-route coverage.
  - Frontend verification passed with `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`, `cd assets && bun run typecheck`, and `cd assets && bun run test:unit`.

### Frontend Product Offers Baseline

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-product-offers.md`
- Outcome:
  - `/products/:slug` now renders an `Active offers` section from the existing GraphQL pricing surface.
  - The detail route now distinguishes offer-ready, offer-empty, and offer-unavailable states without regressing product-ready, not-found, or unavailable handling.
  - Verification passed with `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`, `mix test test/product_compare_web/graphql/pricing_queries_test.exs`, `cd assets && bun run typecheck`, and `cd assets && bun run test:unit`.

### Frontend Product Detail Baseline

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-product-detail.md`
- Outcome:
  - `/products/:slug` now SSR-renders basic product details from GraphQL.
  - The route now distinguishes product-ready, not-found, and unavailable states with focused route regression coverage.
  - Browse product names now navigate into the detail route from `/products`.

### GraphQL Auth Migration Follow-up

- Status: completed on 2026-03-17
- Source of truth: `docs/work/graphql-auth-migration.md`
- Outcome:
  - Added `docs/decisions/2026-03-17-auth-token-delivery-deferral.md` to make the remaining transport gap explicit.
  - Closed the auth migration follow-up doc without reopening browser-auth implementation scope.

### Frontend Auth Browser Coverage

- Status: completed on 2026-03-17
- Source of truth: `docs/work/frontend-auth-browser-coverage.md`
- Outcome:
  - Added Playwright coverage for the existing frontend session, recovery, and verification routes.

### Frontend Catalog Browse

- Status: completed on 2026-03-17
- Source of truth: `docs/work/frontend-catalog-browse.md`
- Outcome:
  - `/products` now SSR-renders the first catalog page from GraphQL.
  - The route now handles empty and unavailable catalog states with focused route regression coverage.
  - Frontend verification passed with `cd assets && bun run typecheck` and `cd assets && bun run test:unit`.

## Historical Plan Notes

### Frontend Fullstack Plan

- Status: rebaselined on 2026-03-17
- Source: `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
- Reason:
  - The older umbrella plan remains historical context only.
  - Its browse, product-detail, product-offers, and compare follow-ons are complete.

## Historical / Reference Only

- `docs/implementation-checklist.md` is a checkpoint log, not the active work queue.
- Dated files in `docs/plans/` are design and implementation baselines unless this index links them as active work.
