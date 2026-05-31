# Plan Index

Start at `docs/work/index.md` for the active execution state. Use this file only when no current batch is queued or the active work doc instructs you to create the next plan.

## Active Architecture Source

- `ARCHITECTURE.md`
- `docs/plans/2026-03-05-frontend-fullstack-design.md`
- `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- `docs/plans/2026-03-19-frontend-relay-route-data-design.md`

## Active Queue

1. Product data ingestion lane: `docs/plans/2026-05-23-product-data-ingestion-foundation-implementation-plan.md`
   - Status: blocked
   - Source context: `docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
   - Completed: CJ fixture-backed source selection, ingestion execution ADR, source-agnostic ingestion boundary, merchant source identity persistence, and fixture-backed normalized listing persistence into catalog/pricing/spec targets.
   - Next scope: no unblocked local ingestion batch remains before live provider validation.
   - Deferred: live CJ credential validation, quota behavior, account-scoped sample payloads, source onboarding compliance signoff, and any Tier-3 scraping activation.

## Next Candidate After Active Queue

1. Backend lane follow-up
   - Depends on a new product/backend priority decision.
   - Intended scope: decide whether to extend generic node lookup to `SourceArtifact` after a public GraphQL object contract exists, or move the backend lane to the next GraphQL contract slice.

## Recently Completed

- Backend core attrs keyword helper: `docs/plans/2026-05-31-backend-core-attrs-keyword-helper-implementation-plan.md`
  - Status: completed on 2026-05-31
  - Source context: `ARCHITECTURE.md`, `ProductCompare.Attrs`, and Commerce Attribution revenue filter normalization.
  - Scope: added keyword-list lookup and presence support to `ProductCompare.Attrs`.
  - Result: Commerce Attribution revenue summary keyword/map filter lookup now delegates to `ProductCompare.Attrs`.

- Backend core attrs presence helper: `docs/plans/2026-05-31-backend-core-attrs-presence-helper-implementation-plan.md`
  - Status: completed on 2026-05-31
  - Source context: `ARCHITECTURE.md`, `ProductCompare.Attrs`, and Commerce Attribution conversion upsert attr handling.
  - Scope: added reusable attr key-presence and non-nil presence checks to `ProductCompare.Attrs`.
  - Result: Commerce Attribution click-session lookup, default attribution confidence, and conversion upsert-field detection now delegate core attr presence handling to `ProductCompare.Attrs`.

- Backend core attrs helper: `docs/plans/2026-05-30-backend-core-attrs-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompare.Accounts`, and API-token attr handling.
  - Scope: moved reusable atom/string attr lookup and nil-skipping map insertion into `ProductCompare.Attrs`.
  - Result: API-token creation, rotation defaults, and status filtering now delegate core attr handling to `ProductCompare.Attrs`.

- Frontend route mutation error guard: `docs/plans/2026-05-30-frontend-route-mutation-error-guard-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `assets/src/routes/route-errors.ts`, and `assets/src/routes/auth/errors.ts`.
  - Scope: shared typed GraphQL mutation error entry validation across route mutation feedback and browser auth mutation normalization.
  - Result: browser auth mutation payload normalization now filters errors through `isRouteMutationError(...)`.

- Frontend route mutation error shape: `docs/plans/2026-05-30-frontend-route-mutation-error-shape-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md` and `assets/src/routes/route-errors.ts`.
  - Scope: required typed GraphQL mutation error entries before surfacing route mutation error messages.
  - Result: `routeMutationErrorMessage(...)` now requires string `code`, string `message`, and optional string/null `field` before using an entry's message.

- Frontend route GraphQL error helper: `docs/plans/2026-05-30-frontend-route-graphql-error-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `assets/src/routes/route-errors.ts`, and `assets/src/routes/auth/errors.ts`.
  - Scope: centralized top-level Relay GraphQL error presence checks across route mutation and auth mutation normalization helpers.
  - Result: browser auth mutation result normalization now uses `hasRouteGraphQLErrors(...)` from the shared route error helper.

- Frontend route mutation record guard: `docs/plans/2026-05-30-frontend-route-mutation-record-guard-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `assets/src/routes/route-errors.ts`, and `assets/src/routes/route-records.ts`.
  - Scope: route mutation error-message normalization rejects array-shaped entries through the shared route record guard.
  - Result: `routeMutationErrorMessage(...)` now uses `isRouteRecord(...)` for typed error entry validation.

- Backend GraphQL input put-present helper: `docs/plans/2026-05-30-backend-graphql-input-put-present-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, and `ProductCompareWeb.Resolvers.CatalogResolver`.
  - Scope: centralized nil-skipping normalized filter map insertion in `ProductCompareWeb.GraphQL.Input`.
  - Result: Catalog filter normalization now uses `Input.put_present/3` instead of resolver-local `maybe_put/3`.

- Backend GraphQL boolean input helper: `docs/plans/2026-05-30-backend-graphql-boolean-input-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, and `ProductCompareWeb.Resolvers.CatalogResolver`.
  - Scope: centralized GraphQL boolean value normalization in `ProductCompareWeb.GraphQL.Input`.
  - Result: Catalog `includeTypeDescendants` parsing now uses `Input.normalize_boolean_value/1` instead of resolver-local boolean coercion.

- Backend GraphQL numeric input helper: `docs/plans/2026-05-30-backend-graphql-numeric-input-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, and `ProductCompareWeb.Resolvers.CatalogResolver`.
  - Scope: centralized GraphQL numeric filter value normalization in `ProductCompareWeb.GraphQL.Input`.
  - Result: Catalog numeric filter `min`/`max` parsing now uses `Input.normalize_decimal_value/1` instead of resolver-local decimal parsing.

- Frontend route loader thrown error helper: `docs/plans/2026-05-30-frontend-route-loader-thrown-error-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `docs/work/frontend-relay-route-data.md`, `assets/src/routes/loader-errors.ts`, and `assets/src/routes/compare/loader.ts`.
  - Scope: centralized route-loader thrown-error normalization for non-`Error` rejection reasons.
  - Result: `compareLoader` now uses `normalizeRouteLoaderThrownError(...)` from the shared route-loader helper module while preserving abort and `Error` rethrow behavior.

- Backend GraphQL node ID helper: `docs/plans/2026-05-30-backend-graphql-node-id-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `docs/work/graphql-relay-contract-hardening.md`, `ProductCompareWeb.GraphQL.GlobalId`, and `ProductCompareWeb.Resolvers.NodeResolver`.
  - Scope: centralized root-node Relay ID local-value kind dispatch in `ProductCompareWeb.GraphQL.GlobalId`.
  - Result: `NodeResolver` now delegates node ID integer/UUID parsing to `GlobalId.decode_typed_local_id/3` while preserving invalid and unsupported ID outcomes.

- Backend GraphQL connection result helper: `docs/plans/2026-05-30-backend-graphql-connection-result-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Connection`, and backend connection resolvers.
  - Scope: centralized resolver-facing connection query result/error mapping.
  - Result: Auth, Catalog, Affiliate, and Pricing resolvers now use `Connection.from_query_result/3` for shared invalid-cursor mapping.

- Backend GraphQL affiliate mutation attrs helper: `docs/plans/2026-05-30-backend-graphql-affiliate-mutation-attrs-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, and Affiliate mutation resolvers.
  - Scope: normalized Affiliate mutation attrs through shared GraphQL input semantics after Relay ID decoding.
  - Result: program, link, and coupon mutations now project known attrs into atom-key maps before Ecto changeset calls.

- Backend GraphQL affiliate network input helper: `docs/plans/2026-05-30-backend-graphql-affiliate-network-input-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, and `AffiliateResolver.upsert_affiliate_network/3`.
  - Scope: routed affiliate-network mutation attribute extraction through shared GraphQL input semantics and removed unsupported attribute selection.
  - Result: `upsertAffiliateNetwork` now uses `Input.take_present/2` for `name` extraction instead of resolver-local `Map.take/2`.

- Backend GraphQL affiliate at input helper: `docs/plans/2026-05-30-backend-graphql-affiliate-at-input-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, and `AffiliateResolver.active_coupons/3`.
  - Scope: routed optional active-coupon timestamp lookup through shared GraphQL input semantics.
  - Result: `activeCoupons` now reads `at` through `Input.fetch_value/3`, matching adjacent ID and pagination helper semantics.

- Frontend auth token error helper: `docs/plans/2026-05-30-frontend-auth-token-error-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, Relay-backed browser auth token routes, and `assets/src/routes/auth/errors.ts`.
  - Scope: centralized missing auth token typed mutation error construction while preserving route-specific token-link messages and request behavior.
  - Result: reset-password and verify-email now share `invalidTokenMutationError(message)` for missing-token typed mutation errors.

- Frontend auth action success helper: `docs/plans/2026-05-30-frontend-auth-action-success-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, Relay-backed browser auth action routes, and `assets/src/routes/auth/errors.ts`.
  - Scope: centralized auth action result success semantics while preserving route-local success messages, request guards, and verify-email cache behavior.
  - Result: Relay-backed recovery and verification routes now share the same successful action result predicate.

- Frontend auth transport error helper: `docs/plans/2026-05-30-frontend-auth-transport-error-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, Relay-backed browser auth mutation routes, and `assets/src/routes/auth/errors.ts`.
  - Scope: centralized auth route transport-error array construction while preserving route-local form, navigation, and request-version behavior.
  - Result: Relay-backed auth mutation routes now share the same transport-error list helper.

- Backend GraphQL connection args helper: `docs/plans/2026-05-30-backend-graphql-connection-args-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, `ProductCompareWeb.GraphQL.Connection`, and backend connection resolvers.
  - Scope: centralized `first`/`after` extraction through shared atom/string GraphQL input lookup semantics and routed remaining resolver-local pagination extraction through it.
  - Result: catalog, pricing, auth-token, and active-coupon connection resolvers now share the same pagination arg extraction path.

- Backend GraphQL optional ID field helper: `docs/plans/2026-05-30-backend-graphql-optional-id-field-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, and optional Relay integer-ID field normalization.
  - Scope: made `Input.decode_optional_integer_id_field/4` honor shared atom/string GraphQL input lookup semantics and normalize string-key ID fields into atom-key attrs.
  - Result: optional Relay integer-ID field normalization now behaves consistently with the rest of the shared GraphQL input helper module.

- Backend GraphQL input take-present helper: `docs/plans/2026-05-30-backend-graphql-input-take-present-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, and API-token mutation resolver attr handling.
  - Scope: added shared optional non-nil attr extraction for GraphQL input maps and routed API-token create/rotate attrs through it.
  - Result: API-token mutation optional attrs now use shared atom/string GraphQL input helper semantics instead of duplicated resolver-local `Map.take(...)` pipelines.

- Backend GraphQL input drop-key helper: `docs/plans/2026-05-30-backend-graphql-input-drop-key-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, and API-token listing resolver input handling.
  - Scope: added shared atom/string key removal for GraphQL input maps and routed `myApiTokens` status argument handling through it.
  - Result: API-token listing resolver input handling now uses shared GraphQL input helpers for status lookup and pagination arg forwarding.

- Frontend route mutation GraphQL errors: `docs/plans/2026-05-30-frontend-route-mutation-graphql-errors-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, Relay-backed compare route mutations, and shared route error helpers.
  - Scope: treated Relay top-level GraphQL errors as generic route mutation failures before trusting compare/save payload IDs.
  - Result: `/compare` save and `/compare/saved` delete no longer announce success or remove rows when Relay reports top-level GraphQL errors.

- Frontend route mutation promise helper: `docs/plans/2026-05-30-frontend-route-mutation-promise-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, Relay-backed browser auth mutation routes, and shared route helpers.
  - Scope: centralized promise-based Relay route mutation completion handling and refactored verify-email onto the shared helper.
  - Result: verify-email no longer owns reusable Relay commit-to-promise plumbing while preserving single-use token request caching and retry eviction behavior.

- Frontend route form data helper: `docs/plans/2026-05-30-frontend-route-form-data-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, Relay-backed browser auth mutation routes, and shared route helpers.
  - Scope: centralized repeated auth route string form-value extraction and added focused helper coverage.
  - Result: login, register, forgot-password, and reset-password submit handlers now share route form-value extraction.

- Backend GraphQL camelized field error helper: `docs/plans/2026-05-30-backend-graphql-camelized-field-error-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Errors`, and Affiliate resolver typed mutation payload fields.
  - Scope: moved GraphQL mutation error camelCase field-name normalization into the shared GraphQL error helper and added focused coverage.
  - Result: Affiliate resolver typed mutation payloads now share field-name normalization with GraphQL error construction.

- Backend GraphQL commerce ID helper: `docs/plans/2026-05-30-backend-graphql-commerce-id-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, `ProductCompareWeb.GraphQL.GlobalId`, and Commerce attribution revenue summary filters.
  - Scope: moved Commerce attribution optional ID decode/encode wrappers onto shared GraphQL helpers and added focused helper coverage.
  - Result: Revenue summary merchant/product filter ID handling now shares the same optional ID normalization and encoding paths as the rest of the GraphQL layer.

- Backend GraphQL changeset error helper: `docs/plans/2026-05-30-backend-graphql-changeset-error-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Errors`, and Auth/Affiliate resolver changeset error payloads.
  - Scope: centralized resolver-local first changeset error extraction in the shared GraphQL error helper and added focused helper coverage.
  - Result: Auth and Affiliate resolver mutation payloads now share first changeset field/message extraction with the GraphQL error helper.

- Backend GraphQL affiliate input helper: `docs/plans/2026-05-30-backend-graphql-affiliate-input-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, and Affiliate resolver ID input normalization.
  - Scope: moved Affiliate resolver optional Relay integer-ID field normalization onto the shared GraphQL input helper and added focused helper coverage.
  - Result: Affiliate resolver ID input handling now shares the same optional integer-backed Relay ID normalization path as the rest of the GraphQL layer.

- Backend GraphQL global ID field helper: `docs/plans/2026-05-30-backend-graphql-global-id-field-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.GlobalId`, and GraphQL schema field resolver ID encoding.
  - Scope: moved schema field resolver global ID wrappers onto shared `GlobalId` helpers and added focused helper coverage.
  - Result: GraphQL global ID encoding and Absinthe field resolver return wrapping are centralized in `GlobalId`.

- Backend GraphQL connection input helper: `docs/plans/2026-05-30-backend-graphql-connection-input-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, and GraphQL connection pagination argument lookup.
  - Scope: moved `ProductCompareWeb.GraphQL.Connection` pagination argument lookup onto the shared GraphQL input helper and added focused connection coverage.
  - Result: GraphQL connection utilities now share atom/string input lookup behavior with resolver input normalization.

- Backend GraphQL catalog input helper: `docs/plans/2026-05-30-backend-graphql-catalog-input-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.Input`, and Catalog resolver input normalization.
  - Scope: moved Catalog resolver list-value lookup, integer ID list decoding, and UUID ID decoding onto the shared GraphQL input helper.
  - Result: Catalog resolver now delegates common input helper behavior instead of carrying resolver-local copies.

- Backend GraphQL input helper: `docs/plans/2026-05-30-backend-graphql-input-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `ProductCompareWeb.GraphQL.GlobalId`, pricing resolver input normalization, and commerce attribution resolver input normalization.
  - Scope: centralized atom/string key lookup and required/optional Relay integer ID decoding helpers in `ProductCompareWeb.GraphQL.Input`.
  - Result: pricing and commerce attribution resolvers now delegate common input helper behavior instead of carrying resolver-local copies.

- Frontend route record guards: `docs/plans/2026-05-30-frontend-route-record-guards-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, Relay-backed route payload parsing, browser auth mutation normalization, and saved-comparison route data parsing.
  - Scope: centralized duplicated unknown-object route payload guards in `assets/src/routes/route-records.ts`.
  - Result: auth mutation normalization and saved-comparison route data parsing now share the same route payload record guard.

- Frontend route mutation error helper: `docs/plans/2026-05-30-frontend-route-mutation-error-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `docs/work/frontend-saved-comparisons-relay-migration.md`, and compare route Relay mutation feedback.
  - Scope: centralized first typed mutation error message extraction in `assets/src/routes/route-errors.ts`.
  - Result: `/compare` save and `/compare/saved` delete flows now use the shared route mutation error helper.

- Frontend route loader error helper: `docs/plans/2026-05-30-frontend-route-loader-error-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `docs/work/frontend-route-loader-invariants.md`, and Relay-backed route loaders.
  - Scope: centralized recoverable route-loader error handling in `assets/src/routes/loader-errors.ts`.
  - Result: catalog and product route loaders now use the shared abort/recoverable fallback helper.

- Backend GraphQL mutation error helper: `docs/plans/2026-05-30-backend-graphql-mutation-error-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `docs/work/graphql-auth-migration.md`, and resolver-local typed mutation payload helpers.
  - Scope: centralized generic typed mutation error maps and changeset traversal in `ProductCompareWeb.GraphQL.Errors`.
  - Result: auth, catalog, and affiliate resolvers now delegate generic typed error construction to the shared GraphQL error helper.

- Backend GraphQL unauthenticated mutation error helper: `docs/plans/2026-05-30-backend-graphql-unauthenticated-mutation-error-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `docs/work/graphql-auth-migration.md`, and resolver-local typed mutation auth payloads.
  - Scope: centralized typed mutation unauthenticated error construction in `ProductCompareWeb.GraphQL.Errors`.
  - Result: API token, saved-comparison, and affiliate unauthenticated typed mutation payloads now use the shared error helper.

- Frontend auth mutation result helper: `docs/plans/2026-05-30-frontend-auth-mutation-result-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `docs/work/frontend-auth-mutation-results.md`, and the browser auth Relay mutation routes.
  - Scope: centralized top-level Relay GraphQL error handling plus session/action payload normalization in `assets/src/routes/auth/errors.ts`.
  - Result: login, register, forgot-password, reset-password, and verify-email route completions now consume shared auth mutation result helpers.

- Backend GraphQL global ID encode helper: `docs/plans/2026-05-30-backend-graphql-global-id-encode-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ProductCompareWeb.GraphQL.GlobalId`, GraphQL schema ID field resolvers, and GraphQL request-test helpers.
  - Scope: `GlobalId.encode/2` now accepts integer local IDs, and callers no longer perform caller-side integer string conversion before encoding.
  - Result: GraphQL ID encoding and local-value normalization are centralized in `GlobalId`.

- Backend GraphQL global ID decode helper: `docs/plans/2026-05-30-backend-graphql-global-id-decode-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ProductCompareWeb.GraphQL.GlobalId`, `docs/work/graphql-relay-contract-hardening.md`, and GraphQL resolver input normalization.
  - Scope: `GlobalId` now owns integer and UUID local-ID decoding, and resolvers delegate global-ID parsing to it while preserving their error payloads.
  - Result: GraphQL ID parsing behavior is centralized and less likely to drift between resolvers.

- Backend GraphQL test global ID helper: `docs/plans/2026-05-30-backend-graphql-test-global-id-helper-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `docs/work/graphql-relay-contract-hardening.md`, `ProductCompareWeb.GraphQL.GlobalId`, and the request-level GraphQL test suites.
  - Scope: ConnCase now provides `relay_id/2`, and GraphQL request tests use it instead of duplicated local Base64 Relay ID helpers.
  - Result: GraphQL test ID construction now follows the same global ID contract as the schema.

- Frontend route loader context invariants: `docs/plans/2026-05-30-frontend-route-loader-context-invariants-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `docs/work/frontend-relay-route-data.md`, and the review pass over completed Relay-backed route loaders.
  - Scope: catalog browse route loading now fails fast when the Relay router context is missing instead of hiding that wiring invariant behind the catalog unavailable fallback.
  - Result: frontend Relay route loaders now share the same missing-context boundary while preserving route-local handling for recoverable preload failures.

- Frontend saved comparisons auth-code cleanup: `docs/plans/2026-05-30-frontend-saved-comparisons-auth-code-cleanup-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `docs/work/frontend-saved-comparisons-relay-migration.md` and the completed GraphQL unauthenticated mutation error cleanup.
  - Scope: `/compare/saved` loader auth-state detection now accepts `UNAUTHENTICATED` and `FORBIDDEN` while ignoring the legacy `UNAUTHORIZED` extension code.
  - Result: saved-route frontend auth handling matches the current structured GraphQL contract.

- GraphQL unauthenticated mutation errors: `docs/plans/2026-05-30-graphql-unauthenticated-mutation-errors-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `docs/work/graphql-auth-migration.md`, and the backend GraphQL contract cleanup pass.
  - Scope: missing-session typed mutation payloads for API token, saved-comparison, and affiliate mutations now use `UNAUTHENTICATED`, matching top-level auth-required GraphQL errors.
  - Result: auth-required GraphQL error codes are consistent across top-level errors and resolver-local typed payloads.

- GraphQL price point node contract: `docs/plans/2026-05-30-graphql-price-point-node-contract-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `docs/work/graphql-relay-contract-hardening.md`, and the remaining backend lane follow-up noted in this index.
  - Scope: root `node(id:)` now supports public `PricePoint` records that are already exposed through `latestPrice` and `priceHistory`.
  - Result: `PricePoint` has parity with the other public pricing node types; `SourceArtifact` remains unsupported pending a public GraphQL object contract.

- GraphQL affiliate node contract: `docs/plans/2026-05-30-graphql-affiliate-node-contract-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `docs/work/graphql-relay-contract-hardening.md`, and the backend lane follow-up noted in this index.
  - Scope: authenticated root `node(id:)` lookup now supports `AffiliateNetwork`, `AffiliateProgram`, `AffiliateLink`, and `Coupon` records that already expose Relay global IDs, while anonymous lookups return `null`.
  - Result: the auth/affiliate node follow-up is closed; `PricePoint` was handled by the later price-point node plan and `SourceArtifact` remains intentionally unsupported pending a future backend priority decision.

- Frontend saved comparisons Relay migration: `docs/plans/2026-05-29-frontend-saved-comparisons-relay-migration-implementation-plan.md`
  - Status: completed on 2026-05-30
  - Source context: `ARCHITECTURE.md`, `docs/work/frontend-saved-comparisons-relay-migration.md`, and the completed frontend Relay route-data lane.
  - Scope: `/compare/saved` now loads saved-set pages through Relay route query descriptors, renders from Relay preloaded data with loader summaries as fallback, and deletes sets through `DeleteSavedComparisonSetMutation`.
  - Result: no additional compare/saved polish is queued from this migration; future UI polish needs a new active work item.

- Commerce attribution lane: `docs/plans/2026-03-23-affiliate-link-attribution-and-revenue-tracking-plan.md`
  - Status: completed on 2026-05-23
  - Final implementation plan: `docs/plans/2026-05-22-commerce-revenue-summary-graphql-implementation-plan.md`
  - Scope: first-party redirect/click plumbing, conversion and purchase-price facts, the revenue summary read model, and read-only GraphQL `revenueSummary` exposure are complete. CJ/Awin source-field mapping remains deferred pending account docs or sample payloads.

## Historical Reference

- `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
  - Completed on 2026-05-21.
- `docs/plans/2026-03-19-frontend-compare-saved-hardening-implementation-plan.md`
  - Completed on 2026-05-21.
- `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
  - Completed on 2026-04-30.
- `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
  - Completed on 2026-03-19.
- Earlier dated plans in `docs/plans/` remain historical context unless `docs/work/index.md` promotes one into active execution.
