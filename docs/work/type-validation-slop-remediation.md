# Type Validation And Slop Remediation

## Snapshot

- Status: ready
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-12-type-validation-and-slop-remediation-implementation-plan.md`
- Inventory refreshed: 2026-08-15 from the checked worktree after the five
  completed product cohorts.

## Target Outcome

One reviewable cross-stack simplification keeps generated Relay types at their
real boundaries, retains the required local declaration for the untyped Babel
plugin, folds one-use route projections into their owning routes, and removes
only bigint checks that repeat a preceding trusted-ID boundary. It preserves
URL, storage, SSR bootstrap, transport, cached-record, global-ID, cursor,
authorization, changeset, constraint, and transaction owners.

## Inventory Method

The Task 1 searches were run exactly as specified against authored frontend
sources (excluding Relay artifacts) and backend context/web sources. Each match
was read with its direct imports/callers and focused tests before classification.
`*-data.ts`, `*-view-data.ts`, declaration, and barrel candidates were also
counted and inspected for line count, direct consumers, substantial behavior,
and a responsibility-bearing path/name. `action` means the planned owner:
`generated` replaces recreated GraphQL shapes with generated operation/fragment
types; `library` removes a locally recreated installed declaration; `merge`
folds a one-use projection or a downstream guard into its real owner; `retain`
is a distinct boundary and is outside the implementation edit set; `delete`
records a stale, already-absent target.

### Stale targets already removed

| symbol/file | current owner | real boundary | consumers | action |
| --- | --- | --- | --- | --- |
| `assets/src/react-relay.d.ts` | absent (earlier cohort) | official `react-relay` declarations | none | delete |
| `assets/src/routes/route-params.ts` | absent (earlier cohort) | route loader parameter owner | none | delete |
| `assets/src/routes/route-errors.ts` | absent (earlier cohort) | route error boundary | none | delete |
| `assets/src/routes/relay-pagination.ts` | absent (earlier cohort) | Relay connection owner | none | delete |
| `assets/src/routes/form-data.ts` | absent (earlier cohort) | route-local `FormData` normalization | none | delete |

### Frontend declarations, reconstructed Relay shapes, and one-use projections

| symbol/file | current owner | real boundary | consumers | action |
| --- | --- | --- | --- | --- |
| `assets/src/babel-plugin-relay.d.ts` (6 lines) | local declaration shim | untyped `babel-plugin-relay` import | `assets/stylex-plugin.ts`; frontend typecheck/build | retain |
| `assets/src/vite-env.d.ts` (1 line) | Vite client reference | compiler-provided Vite globals | frontend compilation | retain |
| `assets/src/routes/auth/continuity/pending-intent.ts` (238 lines) | authentication-continuity owner | session-storage JSON, expiry, exact-key narrowing, and safe relative return URL | login/register routes, auth dialog/hook, compare route, price-watch control; `pending-intent.test.ts`, compare save feedback | retain |
| `assets/src/relay/ssr.ts` (59 lines) | Relay SSR bootstrap owner | escaped server record serialization and untrusted DOM JSON record-map narrowing | client/server entry points; route-preload and server error-handling tests | retain |
| `assets/src/relay/fetch-graphql.ts` (209 lines) | Relay transport owner | endpoint/origin selection, request serialization, and untrusted response-envelope validation | Relay environment and route loaders; `fetch-graphql.test.ts`, `environment.test.ts` | retain |
| `assets/src/routes/root/viewer.ts` (17 lines) | root-route cache projection | untrusted cached Relay record narrowing to the generated root viewer shape | `RootRoute`; `root-viewer-data.test.ts` | retain |
| `assets/src/routes/compare/saved/saved-view-state.ts` (152 lines) | saved-comparison list presentation owner | post-fragment summarized data, local deletion/filter/sort state, and visible status copy | `SavedComparisonSetList`; `saved-comparisons-view-state.test.ts` | retain |
| `category-view-data.ts` (44 lines) | category route projection | `CategoryRouteQuery` generated response and category loader | `CategoryRoute`, focused data test | generated |
| `recommendation-view-data.ts` (92 lines) | comparison recommendation presentation | generated comparison/recommendation data; copy is route presentation | `RecommendationPanel`, shared snapshot projection, focused test | generated |
| `shared-comparison-view-data.ts` (122 lines) | immutable shared-comparison projection | `SharedComparisonRouteQuery` generated response | `SharedComparisonRoute`, focused test | generated |
| `program-dashboard-data.ts` (57 lines) | CJ lifecycle row projection | generated CJ program fragment/enums and lifecycle policy | `ProgramLifecycleTable`, focused test | generated |
| `merchant-detail-view-data.ts` (86 lines) | merchant route projection | `MerchantDetailRouteQuery` generated response and Relay cursor | `MerchantDetailRoute`, focused test | generated |
| `merchant-directory-view-data.ts` (35 lines) | merchant-directory row projection | generated directory fragment plus external-link boundary | `MerchantDirectoryView`, focused test | generated |
| `browse-product-list-data.ts` (33 lines) | catalog-result leaf | stable ordered selection of generated attributes | `BrowseProductList`, focused test | merge |
| `attribution-ledger-data.ts` (27 lines) | revenue attribution presentation | attribution route's latest-conversion/outcome display | `AttributionLedger`, `RecentConversion`, revenue focused test | merge |
| `route-error-view-data.ts` (84 lines) | generic comparison route-error helper | its sole `RouteErrorBoundary` | `RouteErrorBoundary`, focused test | merge |
| `home-view-data.ts` (193 lines) | home route projection | generated home data plus home-specific formatting; ordinary observation recency is a shared date leaf | `HomeRoute`, `HomeDeals`, `HomeProductLedger`, focused test | merge |

The remaining `*-data.ts`/`*-view-data.ts` files are retained: they are
substantial, responsibility-named route/domain owners rather than generic
indirection: `browse-route-data.ts` (78 lines),
`catalog-advanced-filter-data.ts` (180), `revenue-summary-data.ts` (259),
`compare-route-data.ts` (254), `recommendation-route-data.ts` (68),
`offer-discovery-data.ts` (266), `offer-discovery-filter-data.ts` (227),
`product-community-data.ts` (248), `product-offer-panel-data.ts` (268), and
`product-detail-route-data.ts` (125). Their existing generated-type aliases,
URL/form/cursor/external-link, sorting, or multi-consumer domain behavior is
the boundary; no manual GraphQL API recreation was found beyond the six rows
above. The small `index.ts` files are retained only where they expose a
multi-consumer leaf boundary; the 1--3 line route-local barrels are candidates
for deletion only if their import graph remains route-local during the same
implementation review, not separate queue rows.

### Backend bigint and validation provenance

| symbol/file | current owner | real boundary | consumers | action |
| --- | --- | --- | --- | --- |
| `ProductCompareWeb.GraphQL.GlobalId.decode_integer/2` in `lib/product_compare_web/graphql/global_id.ex` | public opaque-ID decoder | decoded public GraphQL ID to positive PostgreSQL bigint | GraphQL input/resolvers/controllers | retain |
| `ProductCompareWeb.GraphQL.Connection` in `lib/product_compare_web/graphql/connection.ex` | Relay connection decoder | decoded cursor offset and overflow-safe arithmetic | every Relay connection | retain |
| `parse_local_node_id/2` in `lib/product_compare_web/resolvers/node_resolver.ex` | node resolver | decoded local node ID from Absinthe's node interface before fetch/authorization | public/operator/owner node fetches | retain |
| `ProductCompare.Input` in `lib/product_compare/input.ex` and GraphQL resolver input normalizers | URL/FormData/typed GraphQL input owner | untrusted integer/list/filter normalization | catalog, snapshots, corrections, alerts | retain |
| `lib/product_compare/catalog.ex`, `lib/product_compare/catalog/products.ex` | catalog facade and products owner | duplicate positive-bigint guards after public ID decoding | node loader/resolvers, catalog tests | merge |
| `lib/product_compare/pricing.ex`, `lib/product_compare/pricing/{price_history,current_offers,offers,merchants}.ex` | pricing facade and query owners | duplicate positive-bigint guards/list filters after global-ID or loader boundary | pricing resolvers/node fetches, pricing tests | merge |
| `lib/product_compare/alerts.ex`, `lib/product_compare/alerts/{inbox,watch_rules,evaluation}.ex` | alert context owners | repeated trusted product/merchant/price-point checks; authorization and watch-state validation remain | alert GraphQL mutations/evaluator, alert and concurrency tests | merge |
| `lib/product_compare/specs.ex`, `lib/product_compare/specs/definitions.ex`, `lib/product_compare/specs/reads/{artifacts,current_attributes,reference_data}.ex` | specifications facade/read owners | repeated trusted ID filtering after GraphQL/global-ID or loader input | specs resolvers/loaders, read-helper and GraphQL tests | merge |
| changeset `validate_*` and `check_constraint/3` mappings reachable from these contexts | schema changesets/database | application feedback plus database-authoritative same-row constraints | context writes and database tests | retain |
| `Repo.exists?/1` in `pricing/home_offers.ex`, `specs/reads/reference_data.ex`, `taxonomy/hierarchy.ex`, `discussions/submissions/reports.ex`, and `ingestion/reconciliation.ex` | query/concurrency owner | availability, reference-data, cycle, dedupe, and reconciliation facts | corresponding read/write workflows | retain |

The selected backend `merge` groups are not blanket guard removal: each needs
public- and direct-context characterization first. `GlobalId`, cursor arithmetic,
node local-ID parsing, authorization, changeset/constraint feedback, row locks,
atomic statements, and the listed `Repo.exists?/1` queries are independent
owners and are explicitly retained.

## Classification Summary

- 5 stale paths: `delete` (already absent; excluded from owned paths).
- 0 installed declaration deletions: `babel-plugin-relay` 21.0.1 ships no
  declarations, so the local six-line declaration is retained for
  `assets/stylex-plugin.ts`.
- 6 frontend generated-type projections: `generated`.
- 4 frontend one-use/date projections: `merge`.
- 4 backend facade/read clusters comprising 16 exact source files: `merge`.
- The two required declaration files, 10 substantial domain data files,
  `saved-view-state.ts`, all real storage/return-URL/SSR-bootstrap/transport/
  cached-record/global-ID/cursor/authorization/changeset/concurrency owners,
  and 5 `Repo.exists?/1` query owners: `retain`.

## Owned Paths For The Promoted Batch

- `assets/src/routes/catalog/results/browse-product-list-data.ts`
- `assets/src/routes/catalog/results/BrowseProductList.tsx`
- `assets/src/routes/categories/category-view-data.ts`
- `assets/src/routes/commerce/revenue/attribution/attribution-ledger-data.ts`
- `assets/src/routes/commerce/revenue/attribution/AttributionLedger.tsx`
- `assets/src/routes/commerce/revenue/attribution/RecentConversion.tsx`
- `assets/src/routes/compare/recommendation-view-data.ts`
- `assets/src/routes/compare/route-error-view-data.ts`
- `assets/src/routes/compare/RouteErrorBoundary.tsx`
- `assets/src/routes/compare/shared/shared-comparison-view-data.ts`
- `assets/src/routes/home/home-view-data.ts`
- `assets/src/routes/home/HomeRoute.tsx`
- `assets/src/routes/home/HomeDeals.tsx`
- `assets/src/routes/home/HomeProductLedger.tsx`
- `assets/src/routes/ingestion/cj-programs/programs/program-dashboard-data.ts`
- `assets/src/routes/merchants/detail/merchant-detail-view-data.ts`
- `assets/src/routes/merchants/merchant-directory-view-data.ts`
- `lib/product_compare/catalog.ex`
- `lib/product_compare/catalog/products.ex`
- `lib/product_compare/pricing.ex`
- `lib/product_compare/pricing/current_offers.ex`
- `lib/product_compare/pricing/merchants.ex`
- `lib/product_compare/pricing/offers.ex`
- `lib/product_compare/pricing/price_history.ex`
- `lib/product_compare/alerts.ex`
- `lib/product_compare/alerts/evaluation.ex`
- `lib/product_compare/alerts/inbox.ex`
- `lib/product_compare/alerts/watch_rules.ex`
- `lib/product_compare/specs.ex`
- `lib/product_compare/specs/definitions.ex`
- `lib/product_compare/specs/reads/artifacts.ex`
- `lib/product_compare/specs/reads/current_attributes.ex`
- `lib/product_compare/specs/reads/reference_data.ex`
- `assets/test/routes/catalog/results/browse-product-list-data.test.ts`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `assets/test/routes/categories/category-view-data.test.ts`
- `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts`
- `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- `assets/test/routes/compare/recommendation-view-data.test.ts`
- `assets/test/routes/compare/route-error-view-data.test.ts`
- `assets/test/routes/compare/compare.route.test.tsx`
- `assets/test/routes/compare/shared-comparison-view-data.test.ts`
- `assets/test/routes/home/home-view-data.test.ts`
- `assets/test/routes/home/home.route.test.tsx`
- `assets/test/routes/ingestion/cj-programs/cj-program-data.test.ts`
- `assets/test/routes/merchants/merchant-detail-view-data.test.ts`
- `assets/test/routes/merchants/merchant-directory-view-data.test.ts`
- `test/product_compare/alerts/alerts_test.exs`
- `test/product_compare/alerts/concurrency_test.exs`
- `test/product_compare/catalog/product_lookup_test.exs`
- `test/product_compare/pricing/merchant_detail_test.exs`
- `test/product_compare/pricing/pricing_test.exs`
- `test/product_compare/specs/read_helpers_test.exs`
- `test/product_compare_web/graphql/catalog_queries_test.exs`
- `test/product_compare_web/graphql/node_query_test.exs`
- `test/product_compare_web/graphql/price_watches_and_alerts_test.exs`
- `test/product_compare_web/graphql/pricing_queries_test.exs`
- `docs/work/type-validation-slop-remediation.md`

## Internal Slices

1. Retain the required untyped-Babel-plugin declaration and replace only the
   listed recreated Relay projections with generated ownership.
2. Fold exactly the four frontend `action: merge` rows into their direct owners;
   transfer each helper test's meaningful assertions to its named owning route
   suite, and move only HomeProductLedger's ordinary price-observation recency
   to the shared leaf while preserving exact-primary dates. Backend merge rows
   remain Task 4, and the five already-absent delete rows remain records only.
3. Characterize public and direct context calls, then retire only duplicate
   downstream bigint guards in the listed facade/read clusters.
4. Run focused frontend/backend contracts, source searches, full gates, and a
   final replacement-slop review.

## Blocker Rule

Stop rather than widen this row if a proposed guard is reached by untrusted
input without `GlobalId`, cursor, URL/FormData, transport, or equivalent named
normalization; if a same-row constraint lacks its changeset/database contract;
or if a change requires a migration, public API decision, or concurrency design.
