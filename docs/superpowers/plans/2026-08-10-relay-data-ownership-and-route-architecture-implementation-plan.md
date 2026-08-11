# Relay Data Ownership And Route Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace anonymous string identifiers with persisted visitor identities, make homepage collections Relay-native, and align frontend data, route, and import ownership with the approved architecture.

**Architecture:** Commerce clicks reference either a user or an `anonymous_visitors` row, with the browser carrying only a signed entropy UUID. Homepage collections become forward Relay connections whose nodes are real products or category projections and whose presentation facts live on edges. Frontend routes own their loaders and top-level operations, reusable GraphQL-data components own masked fragments, and cross-boundary imports use four stable source aliases.

**Tech Stack:** Elixir 1.18, Phoenix, Ecto/PostgreSQL, Absinthe Relay, React 19, TypeScript, Relay, React Router, Vite, Vitest, Playwright, pnpm

## Global Constraints

- Preserve the unrelated user change in `config/dev.exs`; never stage or commit it.
- Browser auth remains GraphQL over `/api/graphql` with Phoenix as the cookie-backed session authority.
- `commerce_click_sessions` may reference a user or anonymous visitor, never both; the named PostgreSQL check must have equivalent changeset validation, `check_constraint/3`, changeset coverage, and direct database coverage.
- The anonymous visitor cookie contains a signed entropy UUID, never the internal bigint primary key; it is HTTP-only, `SameSite=Lax`, long-lived, and secure in production.
- Ordinary page views do not create visitor rows. Only the first tracked guest click resolves or inserts a visitor.
- Homepage growing collections are forward Relay connections; selected products, specification highlights, and reason codes remain bounded lists.
- Homepage product/deal connection nodes are the existing Relay `Product` node. Homepage-only values live on edges.
- The six-item homepage page size is a named frontend presentation constant, not a hidden backend cap.
- Every reusable component that directly consumes a GraphQL entity or meaningful projection owns a colocated masked fragment. Pure components consuming intentional derived values do not.
- Keep URL-driven pagination URL-driven. Do not introduce `usePaginationFragment` without an existing component-owned load-more interaction.
- Remove query-only `routes/**/queries/` source files and all `loader.ts` files; do not replace them with a generic loader factory or universal UI barrel.
- Configure `$ui/*`, `$routes/*`, `$relay/*`, and `$generated/*` consistently in TypeScript and Vite. Use aliases across source boundaries and `./` within a feature directory.
- Preserve current route metadata, canonical redirects, 404/authorization behavior, cancellation, SSR hydration, private-data isolation, partial failures, accepted visuals, and bundle budget.
- Never hand-edit files under `assets/src/__generated__`; regenerate them with Relay.

---

### Task 1: Persist anonymous visitors and enforce typed click identity

**Files:**
- Create: `priv/repo/migrations/20260810140000_create_anonymous_visitors.exs`
- Create: `lib/product_compare_schemas/commerce_attribution/anonymous_visitor.ex`
- Create: `lib/product_compare/commerce_attribution/visitors.ex`
- Create: `lib/product_compare_web/plugs/put_anonymous_visitor.ex`
- Create: `test/product_compare/repo/migrations/create_anonymous_visitors_test.exs`
- Create: `test/product_compare/commerce_attribution/anonymous_visitors_test.exs`
- Create: `test/product_compare_web/plugs/put_anonymous_visitor_test.exs`
- Modify: `lib/product_compare_schemas/commerce_attribution/commerce_click_session.ex`
- Modify: `lib/product_compare/commerce_attribution.ex`
- Modify: `lib/product_compare/commerce_attribution/clicks/sessions.ex`
- Modify: `lib/product_compare/commerce_attribution/trending_activity.ex`
- Modify: `lib/product_compare_web/router.ex`
- Modify: `lib/product_compare_web/plugs/put_absinthe_context.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution/mutations.ex`
- Modify: `lib/product_compare_web/controllers/commerce_redirect_controller.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution/reads.ex`
- Modify: `lib/product_compare_web/schema/commerce_attribution/types.ex`
- Modify: `priv/repo/seeds.exs`
- Modify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Modify: `test/product_compare/commerce_attribution/trending_activity_test.exs`
- Modify: `test/product_compare_web/graphql/commerce_click_test.exs`
- Modify: `test/product_compare_web/controllers/commerce_redirect_controller_test.exs`
- Modify: `test/product_compare_web/graphql/commerce_attribution_ledger_test.exs`
- Modify: `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `assets/src/routes/commerce/revenue/AttributionLedger.tsx`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts`

**Interfaces:**
- Produces: `ProductCompareSchemas.CommerceAttribution.AnonymousVisitor` with `id :: integer`, `entropy_id :: Ecto.UUID.t()`, and microsecond timestamps.
- Produces: `ProductCompare.CommerceAttribution.Visitors.get_or_create/1 :: {:ok, AnonymousVisitor.t()} | {:error, Ecto.Changeset.t()}`. It uses one conflict-safe insert against `anonymous_visitors_entropy_id_index`, then reads the row; it never performs a read-before-insert sequence.
- Produces: `ProductCompareWeb.Plugs.PutAnonymousVisitor` assigning `conn.assigns.anonymous_visitor_entropy_id` and a signed cookie named `_product_compare_visitor`.
- Changes: `CommerceClickSession` accepts `anonymous_visitor_id`, belongs to `AnonymousVisitor` with `on_replace: :nilify`, rejects simultaneous `user_id` and `anonymous_visitor_id`, and maps `commerce_click_sessions_single_actor` with `check_constraint/3`.
- Changes: tracked-click functions accept trusted `anonymous_visitor_entropy_id` request context, not a browser GraphQL argument. Authenticated calls resolve only `user_id`; guest calls lazily call `Visitors.get_or_create/1`.
- Changes: attribution ledger GraphQL exposes `anonymousVisitor: Boolean!` rather than an opaque ID. The UI renders `Anonymous visitor` or `Unidentified click` and never renders entropy/internal IDs.

- [ ] **Step 1: Add red schema, migration, cookie, race, and aggregation tests**

Write tests that assert:

```elixir
assert {:error, changeset} =
         CommerceAttribution.track_click(valid_attrs(%{
           user_id: user.id,
           anonymous_visitor_id: visitor.id
         }))

assert %{anonymous_visitor_id: {"cannot be set with user_id", _}} =
         errors_on(changeset)

assert_raise Postgrex.Error, ~r/commerce_click_sessions_single_actor/, fn ->
  Repo.insert_all("commerce_click_sessions", [both_identity_row])
end
```

The migration test must seed repeated, distinct, blank, nil, and authenticated legacy `anonymous_id` values before `up/0`, then assert repeated guest strings map to one visitor, distinct strings map to distinct visitors, authenticated rows have a null visitor, and `down/0` restores equal entropy UUID strings. Plug tests must cover valid-cookie reuse, missing-cookie generation, forged-cookie replacement, HTTP-only/SameSite/secure attributes, and no database row creation. Concurrent `Visitors.get_or_create/1` calls for one entropy UUID must return the same row and leave `Repo.aggregate(AnonymousVisitor, :count) == 1`.

Update trending tests so two clicks from one visitor count once, a numeric-looking visitor entropy cannot collide with a user ID, unidentified clicks do not count, and the existing seven-day/five-identity/active-offer/query-budget behavior stays intact.

- [ ] **Step 2: Run the focused tests and verify the intended RED state**

Run:

```bash
mix test \
  test/product_compare/repo/migrations/create_anonymous_visitors_test.exs \
  test/product_compare/commerce_attribution/anonymous_visitors_test.exs \
  test/product_compare/commerce_attribution/trending_activity_test.exs \
  test/product_compare_web/plugs/put_anonymous_visitor_test.exs \
  test/product_compare_web/graphql/commerce_click_test.exs \
  test/product_compare_web/controllers/commerce_redirect_controller_test.exs \
  test/product_compare_web/graphql/commerce_attribution_ledger_test.exs
```

Expected: failures name the missing table/schema/plug, the old `anonymous_id` contract, the unhandled single-actor constraint, or the old tagged-string aggregation.

- [ ] **Step 3: Implement the relational migration and Ecto contracts**

Create `anonymous_visitors` with repository-standard bigint identity and `uuidv7()` entropy default. In the migration, use a temporary legacy mapping table inside the migration transaction:

```elixir
create table(:anonymous_visitors) do
  add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
  timestamps(type: :utc_datetime_usec)
end

create unique_index(:anonymous_visitors, [:entropy_id])

alter table(:commerce_click_sessions) do
  add :anonymous_visitor_id,
      references(:anonymous_visitors, on_delete: :nilify_all),
      null: true
end

create index(:commerce_click_sessions, [:anonymous_visitor_id])
create constraint(:commerce_click_sessions, :commerce_click_sessions_single_actor,
  check: "NOT (user_id IS NOT NULL AND anonymous_visitor_id IS NOT NULL)"
)
```

Use explicit SQL to populate the temporary mapping and backfill. `down/0` adds a text column, restores `anonymous_id = anonymous_visitors.entropy_id::text`, then removes the new constraint/FK/table in dependency order.

In `CommerceClickSession.changeset/2`, validate the mutual exclusion before the database write and add the named `check_constraint/3`. Keep neither identity valid.

- [ ] **Step 4: Implement the signed-cookie and lazy visitor lifecycle**

`PutAnonymousVisitor` must call `fetch_cookies(conn, signed: [@cookie_name])`, accept only values for which `Ecto.UUID.cast/1` succeeds, and generate `Ecto.UUID.generate/0` otherwise. Set the signed response cookie with:

```elixir
put_resp_cookie(conn, @cookie_name, entropy_id,
  sign: true,
  http_only: true,
  same_site: "Lax",
  max_age: 60 * 60 * 24 * 365,
  secure: secure_cookie?(conn)
)
```

Add the plug to both browser click paths before the resolver/controller reads request context. Put the entropy ID in Absinthe context. Do not expose it as a mutation argument.

Implement `Visitors.get_or_create/1` with `Repo.insert(..., on_conflict: :nothing, conflict_target: :entropy_id)` followed by `Repo.get_by!/2` inside a transaction/multi result that tolerates the unique-conflict race. In click tracking, skip that function when `user_id` is present and set only `anonymous_visitor_id` for a guest click.

- [ ] **Step 5: Replace tagged aggregation and opaque GraphQL identity**

Replace the tagged `CASE` expression with two aggregates:

```elixir
count(click.user_id, :distinct) + count(click.anonymous_visitor_id, :distinct)
```

Project `anonymous_visitor: not is_nil(click.anonymous_visitor_id)` from attribution reads. Replace the GraphQL `anonymous_id` field with non-null `anonymous_visitor` and update the React ledger copy without exposing the cookie UUID or database ID. Update seeds and fixtures to create visitor rows explicitly.

- [ ] **Step 6: Run focused backend/frontend verification**

Run:

```bash
mix test \
  test/product_compare/repo/migrations/create_anonymous_visitors_test.exs \
  test/product_compare/commerce_attribution/anonymous_visitors_test.exs \
  test/product_compare/commerce_attribution/commerce_attribution_test.exs \
  test/product_compare/commerce_attribution/trending_activity_test.exs \
  test/product_compare_web/plugs/put_anonymous_visitor_test.exs \
  test/product_compare_web/graphql/commerce_click_test.exs \
  test/product_compare_web/controllers/commerce_redirect_controller_test.exs \
  test/product_compare_web/graphql/commerce_attribution_ledger_test.exs \
  test/product_compare_web/graphql/commerce_revenue_summary_test.exs \
  test/product_compare/repo/seeds_test.exs
cd assets && pnpm exec vitest run src/routes/commerce/revenue
```

Expected: all focused tests pass, and `rg -n 'anonymous_id|\x27u:\x27|\x27a:\x27' lib assets/src --glob '!assets/src/__generated__/**'` returns no old production contract.

- [ ] **Step 7: Commit the identity milestone**

Stage only the files listed in this task, verify `config/dev.exs` is not staged, and commit:

```bash
git commit -m "refactor: persist anonymous visitor identities"
```

---

### Task 2: Convert homepage collections to Relay connections and Product nodes

**Files:**
- Modify: `lib/product_compare_web/schema/home/types.ex`
- Modify: `lib/product_compare_web/schema/home/queries.ex`
- Modify: `lib/product_compare_web/resolvers/home_resolver.ex`
- Modify: `lib/product_compare_web/graphql/connection.ex` only if a narrowly named edge-mapping helper is reused by all five fields
- Modify: `lib/product_compare/catalog.ex`
- Modify: `lib/product_compare/catalog/home_workspace.ex`
- Modify: `lib/product_compare/pricing.ex`
- Modify: `lib/product_compare/pricing/home_offers.ex`
- Modify: `lib/product_compare/seo.ex`
- Modify: `lib/product_compare/seo/categories.ex`
- Modify: `test/product_compare/catalog/home_workspace_test.exs`
- Modify: `test/product_compare/pricing/home_offers_test.exs`
- Modify: `test/product_compare/seo_test.exs`
- Modify: `test/product_compare_web/graphql/home_queries_test.exs`

**Interfaces:**
- Produces: `HomeWorkspace.products(first:, after:)` as `HomeWorkspaceProductConnection`; each edge has `node: Product!`, `highlights: [HomeSpecificationHighlight!]!`, and `offer: HomeOfferSummary`.
- Produces: `HomeWorkspace.categories(first:, after:)` as a forward connection with `HomeCategoryShortcut` nodes.
- Produces: `HomeDeals.new`, `.trending`, and `.forYou` as `HomeDealConnection`; each edge has `node: Product!`, `offer: HomeOfferSummary!`, and `reasons: [HomeDealReason!]!`.
- Removes: GraphQL object types `HomeWorkspaceProduct` and `HomeDeal`.
- Produces domain window contract: `%{offset: non_neg_integer(), fetch_limit: pos_integer()}` where `fetch_limit == requested_first + 1` and callers return at most `requested_first` edges with truthful `hasNextPage`.
- Preserves: selected-product maximum of three, fixed highlight/reason lists, stable ordering, viewer fallback/deduplication, privacy, and constant query count.

- [ ] **Step 1: Rewrite GraphQL/domain tests for the connection contract**

Update `home_queries_test.exs` operations to request `edges { cursor node { id slug ... } highlights { ... } offer { ... } } pageInfo { hasNextPage endCursor }`. Add tests for:

```elixir
assert %{
  "edges" => [%{"node" => %{"id" => product_global_id}} | _],
  "pageInfo" => %{"hasNextPage" => true, "endCursor" => cursor}
} = products

assert next_products = query_home(first: 2, after: cursor)
refute MapSet.disjoint?(first_ids, next_ids) == false
```

Cover `first: 0`, invalid cursor, maximum accepted page size, stable subsequent pages, canonical Product global IDs, edge highlights/offers/reasons, viewer fallback, and no private alert/saved work for guests. Introspection must return `nil` for `HomeWorkspaceProduct` and `HomeDeal`.

Change domain tests to create at least eight qualifying rows and prove `offset: 0, fetch_limit: 7` can return seven rows, removing the hidden six cap. Query-budget tests compare small and maximum windows.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
mix test \
  test/product_compare/catalog/home_workspace_test.exs \
  test/product_compare/pricing/home_offers_test.exs \
  test/product_compare/seo_test.exs \
  test/product_compare_web/graphql/home_queries_test.exs
```

Expected: failures show list fields where connections are expected, wrapper node identities, missing cursors/pageInfo, and six-row truncation.

- [ ] **Step 3: Make domain reads window-aware without introducing a second pagination abstraction**

Replace `limit` normalization that clamps to six with validated `offset`/`fetch_limit` options supplied by the GraphQL resolver. Apply existing stable order, then SQL `offset(^offset)` and `limit(^fetch_limit)` at the last set-based query. For viewer fallback, deduplicate new/trending products in stable order before applying the requested window; do not slice each source to six first.

Keep the domain return rows shaped as `%{product: product, highlights: ..., offer: ...}` or `%{product: product, offer: ..., reasons: ...}`. Those are internal projections, not GraphQL object identities.

- [ ] **Step 4: Define custom Absinthe Relay connections and nested field resolvers**

Define custom connections with real node types:

```elixir
connection :home_workspace_products, node_type: :product do
  edge do
    field :highlights, non_null(list_of(non_null(:home_specification_highlight)))
    field :offer, :home_offer_summary
  end
end

connection :home_deals, node_type: :product do
  edge do
    field :offer, non_null(:home_offer_summary)
    field :reasons, non_null(list_of(non_null(:home_deal_reason)))
  end
end
```

Move growing-field reads into nested resolvers so each field receives `first`/`after`. Use `ProductCompareWeb.GraphQL.Connection.batch_window/1` to validate the cursor and derive the fetch window, then `from_prefetched_page/3`. Map each internal row edge to `%{edge | node: row.product}` and merge only its homepage edge fields. Keep this mapping private to `HomeResolver` unless all five fields need exactly the same reusable function and tests justify one helper in `Connection`.

- [ ] **Step 5: Run the focused GraphQL/domain suite**

Run the command from Step 2. Expected: all connection, identity, privacy, query-budget, and ordering tests pass.

- [ ] **Step 6: Commit the backend connection milestone**

```bash
git commit -m "refactor: expose Relay homepage connections"
```

Stage only Task 2 backend/test files and confirm `config/dev.exs` remains unstaged.

---

### Task 3: Migrate the homepage frontend and establish source aliases

**Files:**
- Modify: `assets/vite.config.ts`
- Modify: `assets/tsconfig.json`
- Modify: `assets/src/routes/home/HomeRoute.tsx`
- Modify: `assets/src/routes/home/HomeDeals.tsx`
- Modify: `assets/src/routes/home/HomeProductLedger.tsx`
- Modify: `assets/src/routes/home/home-view-data.ts`
- Modify: `assets/src/router.tsx`
- Delete: `assets/src/routes/home/loader.ts`
- Delete: `assets/src/routes/home/queries/HomeWorkspaceRouteQuery.ts`
- Delete: `assets/src/routes/home/queries/HomeDealsRouteQuery.ts`
- Modify: `assets/test/routes/home/home-view-data.test.ts`
- Modify: `assets/test/routes/home/home.route.test.tsx`
- Modify: `assets/test/router.test.tsx`
- Modify: `assets/tests/e2e/production-ui-home.spec.ts`
- Regenerate: matching files under `assets/src/__generated__/`

**Interfaces:**
- Produces aliases `$ui/*`, `$routes/*`, `$relay/*`, `$generated/*` in both Vite `resolve.alias` and TypeScript `compilerOptions.paths` with `baseUrl: "."`.
- Produces `HOME_PAGE_SIZE = 6` in `HomeRoute.tsx` or `home-view-data.ts`; route operations pass it as `first` for workspace products/categories and deals.
- Produces colocated `HomeProductLedger_product` or `HomeProductLedger_edge` fragment in `HomeProductLedger.tsx`, and a masked deal-row fragment in `HomeDeals.tsx` for direct GraphQL data consumption.
- Produces `HomeRoute.tsx` exports for both `HomeRoute` and `loader`; router lazy-loads that module once.

- [ ] **Step 1: Add red connection, masking, route-colocation, and alias tests**

Change homepage Relay fixtures from arrays to `edges/pageInfo`. Component tests must create Relay records through `createMockEnvironment`/`MockPayloadGenerator`, pass generated fragment keys, and verify edge highlights/offers/reasons render. Add a route test proving the loader operation uses `first: HOME_PAGE_SIZE` and disposal/abort/fallback behavior remains unchanged.

Update the Playwright GraphQL fixtures for connection shapes but do not update screenshots. Add a structural assertion or final `rg` command for absence of `.slice(0, 6)` and the home `queries/`/`loader.ts` files.

- [ ] **Step 2: Run the homepage frontend tests and verify RED**

Run:

```bash
cd assets
pnpm exec relay-compiler
pnpm exec vitest run test/routes/home test/router.test.tsx
```

Expected: compiler/type/test failures identify the old list shape, unmasked object props, query-only imports, and separate loader import.

- [ ] **Step 3: Configure aliases and colocate the route operations/loader**

Configure Vite with absolute source paths and TypeScript with:

```json
"baseUrl": ".",
"paths": {
  "$ui/*": ["src/ui/*"],
  "$routes/*": ["src/routes/*"],
  "$relay/*": ["src/relay/*"],
  "$generated/*": ["src/__generated__/*"]
}
```

Declare `HomeWorkspaceRouteQuery` in `HomeRoute.tsx` and export `loader` from the same module. Declare the auxiliary deals query in `HomeDeals.tsx`. Remove the three obsolete source files and change the router to one dynamic import returning `{Component: module.HomeRoute, loader: module.loader}`.

- [ ] **Step 4: Add masked homepage fragments and connection view mapping**

The ledger component must call `useFragment` at its boundary. Put product identity fields in the node portion and highlights/offer in its edge fragment. `HomeDeals` owns a connection/edge fragment with product, offer, and reasons. Keep `ProductLedger` pure if it consumes the intentional `ProductLedgerRow` view model.

Map `connection.edges` without `.slice(0, 6)`, filter only null Relay edges/nodes when the schema permits them, and use `HOME_PAGE_SIZE` solely in variables. Preserve selected-product matching through product slugs and existing tab/fallback behavior.

- [ ] **Step 5: Regenerate Relay and run focused frontend/browser checks**

Run:

```bash
cd assets
pnpm exec relay-compiler
pnpm exec tsc --noEmit
pnpm exec vitest run test/routes/home test/router.test.tsx
PLAYWRIGHT_PORT=4174 pnpm exec playwright test tests/e2e/production-ui-home.spec.ts
```

Expected: Relay compiles, unit tests pass, all nine homepage journeys pass without snapshot updates, and the current PNGs remain unchanged.

- [ ] **Step 6: Commit the homepage frontend milestone**

```bash
git commit -m "refactor: normalize homepage Relay data"
```

Stage exact Task 3 files and generated artifacts only.

---

### Task 4: Give public shopping components Relay data ownership

**Files:**
- Modify: `assets/src/routes/catalog/BrowseRoute.tsx`
- Modify: `assets/src/routes/catalog/BrowseProductList.tsx`
- Modify: `assets/src/routes/catalog/browse-route-data.ts`
- Delete: `assets/src/routes/catalog/loader.ts`
- Delete: `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`
- Modify: `assets/src/routes/categories/CategoryRoute.tsx`
- Modify: `assets/src/routes/categories/category-view-data.ts`
- Delete: `assets/src/routes/categories/loader.ts`
- Delete: `assets/src/routes/categories/queries/CategoryRouteQuery.ts`
- Modify: `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
- Modify: `assets/src/routes/merchants/MerchantDirectoryView.tsx`
- Modify: `assets/src/routes/merchants/merchant-directory-view-data.ts`
- Delete: `assets/src/routes/merchants/loader.ts`
- Delete: `assets/src/routes/merchants/queries/MerchantDirectoryRouteQuery.ts`
- Delete: `assets/src/routes/merchants/queries/MerchantListItemFragment.ts`
- Modify: `assets/src/routes/merchants/detail/MerchantDetailRoute.tsx`
- Modify: `assets/src/routes/merchants/detail/merchant-detail-view-data.ts`
- Delete: `assets/src/routes/merchants/detail/loader.ts`
- Delete: `assets/src/routes/merchants/detail/queries/MerchantDetailRouteQuery.ts`
- Modify: `assets/src/routes/offers/OfferDiscoveryRoute.tsx`
- Modify: `assets/src/routes/offers/OfferDiscoveryCard.tsx`
- Create: `assets/src/routes/offers/offer-discovery-filters.ts`
- Delete: `assets/src/routes/offers/loader.ts`
- Delete: `assets/src/routes/offers/queries/OfferDiscoveryRouteQuery.ts`
- Modify: `assets/src/routes/products/ProductDetailRoute.tsx`
- Modify: `assets/src/routes/products/ProductOfferPanel.tsx`
- Modify: `assets/src/routes/products/ProductCommunityPanel.tsx`
- Modify: `assets/src/routes/products/product-detail-route-data.ts`
- Delete: `assets/src/routes/products/loader.ts`
- Delete: `assets/src/routes/products/queries/ProductDetailRouteQuery.ts`
- Delete: `assets/src/routes/products/queries/ProductQuestionAnswersQuery.ts`
- Modify: `assets/src/router.tsx`
- Modify: `assets/test/routes/catalog/browse.route.test.tsx`
- Modify: `assets/test/routes/categories/category.route.test.tsx`
- Modify: `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- Modify: `assets/test/routes/merchants/merchant-directory-loader.test.ts`
- Modify: `assets/test/routes/merchants/merchant-detail.route.test.tsx`
- Modify: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Modify: `assets/test/routes/offers/offer-discovery-loader.test.ts`
- Modify: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `assets/test/routes/products/product-community-panel.test.tsx`
- Modify: `assets/test/routes/products/product-community-relay-update.test.tsx`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- Modify: `assets/test/router.test.tsx`
- Regenerate: matching operation and fragment artifacts under `assets/src/__generated__/`

**Interfaces:**
- Each route module exports its top-level query, React component, and `loader`.
- `BrowseProductList`, the merchant row rendered by `MerchantDirectoryView`, `OfferDiscoveryCard`, `ProductOfferPanel`, and `ProductCommunityPanel` accept generated fragment keys and call `useFragment` internally.
- Category/merchant-detail one-off headings remain route-owned unless an existing reusable subcomponent directly consumes their GraphQL projection.
- `offer-discovery-filters.ts` owns the URL sort/filter parser and its TypeScript types; it has no Relay environment or preload side effects.

- [ ] **Step 1: Add red fragment-boundary and route-behavior tests for the public routes**

For every listed reusable data component, change tests to pass a real fragment key from a mock Relay environment. Assert the rendered product/merchant/offer/community facts are selected by that component's fragment. Preserve existing tests for canonical redirects, invalid filters, URL cursors, metadata, 404s, partial products, abort propagation, and query disposal.

Add an affiliate-setup compiler test that composes `...MerchantListItemFragment` without `@relay(mask: false)`; this existing external consumer must still compile with a fragment key.

- [ ] **Step 2: Run the public-route tests and verify RED**

Run:

```bash
cd assets
pnpm exec relay-compiler
pnpm exec vitest run \
  src/routes/catalog \
  src/routes/categories \
  src/routes/merchants \
  src/routes/offers \
  src/routes/products \
  src/routes/affiliate/setup
```

Expected: failures identify raw response-object props, mask suppression, old query imports, or loader imports.

- [ ] **Step 3: Colocate fragments and operations, preserving derived view models**

Put one masked fragment beside each reusable consumer and call `useFragment`. Route operations spread those fragments. A parent may separately select a minimal scalar used for list ordering, URL construction, or aggregate comparison, but it must stop selecting the child's rendering fields centrally.

Keep `browse-route-data.ts`, `category-view-data.ts`, `merchant-directory-view-data.ts`, `merchant-detail-view-data.ts`, and `product-detail-route-data.ts` only for substantial pure parsing/projection. Do not move GraphQL tagged nodes into them. Keep presentational ledgers/tables on intentional view models rather than giving them ceremonial fragments.

- [ ] **Step 4: Colocate route loaders and remove query/loader shells**

Move each loader body into its route module, import the existing `$relay/route-preload` boundary, and export any public loader data type from the route or a responsibility-named route-data module. Move offer URL parsing into `offer-discovery-filters.ts`. Delete the listed query-only and loader-only files. Update the router so each route performs one dynamic module import.

- [ ] **Step 5: Regenerate and verify the public-route cohort**

Run:

```bash
cd assets
pnpm exec relay-compiler
pnpm exec tsc --noEmit
pnpm exec vitest run \
  src/routes/catalog \
  src/routes/categories \
  src/routes/merchants \
  src/routes/offers \
  src/routes/products \
  src/routes/affiliate/setup \
  test/router.test.tsx
```

Expected: all tests pass and `rg -n '@relay\(mask: false\)' src/routes` returns no result.

- [ ] **Step 6: Commit the public-route ownership milestone**

```bash
git commit -m "refactor: colocate public route Relay data"
```

---

### Task 5: Give account, comparison, and operator components Relay data ownership

**Files:**
- Modify: `assets/src/routes/account/alerts/AlertsRoute.tsx`
- Modify: alert/watch row components in `assets/src/routes/account/alerts/`
- Modify: `assets/src/routes/account/alerts/alerts-view-data.ts`
- Delete: `assets/src/routes/account/alerts/loader.ts`
- Modify: `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- Modify: `assets/src/routes/account/api-tokens/ApiTokenItem.tsx`
- Modify: `assets/src/routes/account/api-tokens/api-token-route-data.ts`
- Delete: `assets/src/routes/account/api-tokens/loader.ts`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Delete: `assets/src/routes/affiliate/setup/loader.ts`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- Modify: `assets/src/routes/commerce/revenue/AttributionLedger.tsx`
- Modify: `assets/src/routes/commerce/revenue/revenue-summary-view-data.ts`
- Delete: `assets/src/routes/commerce/revenue/loader.ts`
- Delete: `assets/src/routes/commerce/revenue/queries/AttributionLedgerRouteQuery.ts`
- Delete: `assets/src/routes/commerce/revenue/queries/RevenueSummaryRouteQuery.ts`
- Modify: `assets/src/routes/compare/CompareRoute.tsx`
- Modify: `assets/src/routes/compare/CompareProductList.tsx`
- Modify: `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
- Modify: `assets/src/routes/compare/RecommendationPanel.tsx`
- Modify: `assets/src/routes/compare/SavedComparisonsRoute.tsx`
- Modify: saved-comparison row components under `assets/src/routes/compare/`
- Create: `assets/src/routes/compare/compare-route-data.ts`
- Delete: `assets/src/routes/compare/loader.ts`
- Delete: `assets/src/routes/compare/queries/CompareProductPickerQuery.ts`
- Delete: `assets/src/routes/compare/queries/CompareRecommendationQuery.ts`
- Delete: `assets/src/routes/compare/queries/CompareRouteQuery.ts`
- Modify: `assets/src/routes/compare/shared/SharedComparisonRoute.tsx`
- Delete: `assets/src/routes/compare/shared/loader.ts`
- Delete: `assets/src/routes/compare/shared/queries/SharedComparisonRouteQuery.ts`
- Modify: `assets/src/routes/ingestion/cj-programs/CJProgramsRoute.tsx`
- Modify: `assets/src/routes/ingestion/cj-programs/CJProgramRow.tsx`
- Delete: `assets/src/routes/ingestion/cj-programs/loader.ts`
- Delete: `assets/src/routes/ingestion/cj-programs/queries/CJProgramFeedsQuery.ts`
- Delete: `assets/src/routes/ingestion/cj-programs/queries/CJProgramsRouteQuery.ts`
- Modify: `assets/src/routes/RootRoute.tsx`
- Modify: `assets/src/routes/root/viewer-data.ts`
- Delete: `assets/src/routes/root/loader.ts`
- Delete: `assets/src/routes/root/queries/RootViewerRouteQuery.ts`
- Modify: `assets/src/router.tsx`
- Modify: `assets/test/routes/account/alerts/alerts.route.test.tsx`
- Modify: `assets/test/routes/account/api-tokens/api-tokens-loader.test.ts`
- Modify: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup-loader.test.ts`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary-loader.test.ts`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Modify: `assets/test/routes/compare/compare-relay-migration.test.tsx`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `assets/test/routes/compare/recommendation-panel.test.tsx`
- Modify: `assets/test/routes/compare/saved-comparisons-loader-auth.test.ts`
- Modify: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Modify: `assets/test/routes/ingestion/cj-programs/cj-programs-loader.test.ts`
- Modify: `assets/test/routes/ingestion/cj-programs/cj-programs.route.test.tsx`
- Modify: `assets/test/routes/root.route.test.tsx`
- Modify: `assets/test/router.test.tsx`
- Regenerate: matching operation and fragment artifacts under `assets/src/__generated__/`

**Interfaces:**
- `Alert`/watch rows, `ApiTokenItem`, `AttributionLedger` row/connection, product rows rendered by `CompareProductList`, saved-comparison rows, and `CJProgramRow` own masked fragments when they directly consume server projections.
- `CompareProductPickerBoundary` owns its auxiliary picker query; `RecommendationPanel` owns its auxiliary recommendation query; `CJProgramRow` owns its feed query; `AttributionLedger` owns its ledger query/fragment.
- `compare-route-data.ts` owns URL slug parsing, three-product normalization, partial-product projection, and loader result types; it has no Relay environment or route-preload mechanics.
- Cohesive mutation modules (`AlertOperations.ts`, `ApiTokenOperations.ts`, `AffiliateSetupOperations.ts`, `ComparisonSharingOperations.ts`, `SavedComparisonOperations.ts`) remain when they own real mutation behavior, but their query selections compose masked consumer fragments.

- [ ] **Step 1: Add red fragment, auxiliary-query, and route-loader tests**

Use mock Relay environments to prove each reusable data row renders from its own fragment key. Preserve account authorization redirects, operator authorization, cursor URL state, compare partial-product behavior, shared-comparison 404/metadata behavior, root viewer/auth state, abort propagation, and resource disposal.

For auxiliary operations, assert retries/refetches execute the operation declared in the consuming component rather than importing a query wrapper. Keep mutation-only controls on explicit caller-owned IDs/labels where they do not render a GraphQL entity.

- [ ] **Step 2: Run the cohort tests and verify RED**

Run:

```bash
cd assets
pnpm exec relay-compiler
pnpm exec vitest run \
  src/routes/account \
  src/routes/affiliate/setup \
  src/routes/commerce/revenue \
  src/routes/compare \
  src/routes/ingestion/cj-programs \
  src/routes/root \
  test/router.test.tsx
```

Expected: failures identify old loader/query imports, unmasked raw objects, or missing component-owned fragments.

- [ ] **Step 3: Implement the meaningful-fragment audit for this cohort**

For each reusable GraphQL-data component, colocate a masked fragment and change its prop to the generated `$key`. Spread it from the nearest route or parent fragment. Leave derived comparison matrices, formatted revenue summaries, and mutation-only controls as pure view-model components. Record each deliberate pure boundary in the component prop type name or a short code comment only when the reason is not evident from the type.

- [ ] **Step 4: Move auxiliary queries to consumers and route queries/loaders to routes**

Move picker, recommendation, feed, and attribution queries to their actual consumers. Move each top-level operation and loader into its route module. Extract compare parsing/projection to `compare-route-data.ts`, reuse `root/viewer-data.ts`, and retain other existing responsibility-named modules only when they contain substantial pure logic. Delete all listed query-only and loader-only files and update router imports to one module per lazy route.

- [ ] **Step 5: Regenerate Relay and run the focused cohort**

Run the command from Step 2 followed by `pnpm exec tsc --noEmit`. Expected: compiler, types, router tests, account/privacy tests, comparison behavior, and operator screens pass.

- [ ] **Step 6: Commit the account/comparison/operator milestone**

```bash
git commit -m "refactor: colocate application Relay data"
```

---

### Task 6: Complete the structural sweep and import migration

**Files:**
- Modify: `assets/src/**/*.ts` and `assets/src/**/*.tsx` files identified by Step 1's exact cross-boundary import query
- Modify: frontend tests importing application code across source boundaries
- Modify: `assets/src/router.tsx`
- Delete: every file returned by `find assets/src/routes -type f \( -name 'loader.ts' -o -path '*/queries/*.ts' \)` after Tasks 3-5; the expected result before this task is empty
- Modify: `docs/superpowers/specs/2026-08-10-relay-data-ownership-and-route-architecture-design.md` only if implementation discovered a contract correction; do not use it as a progress ledger

**Interfaces:**
- Cross-boundary imports use `$ui`, `$routes`, `$relay`, or `$generated`; same-directory/feature imports use `./` or `../` only within that feature tree.
- No source `routes/**/queries/` directory, `loader.ts`, `@relay(mask: false)`, universal UI barrel, generic route-loader factory, or hidden homepage six-cap remains.

- [ ] **Step 1: Run the structural inventory and classify every remaining hit**

Run:

```bash
cd assets
rg -n 'from ["\x27](\.\./){2,}(ui|routes|relay|__generated__)/' src
rg -n '@relay\(mask: false\)|\.slice\(0, 6\)' src --glob '!src/__generated__/**'
find src/routes -type f \( -name 'loader.ts' -o -path '*/queries/*.ts' \) -print
rg -n 'HOME_PAGE_SIZE|@deal_limit|limit: 6' ../lib src/routes/home --glob '!src/__generated__/**'
```

Each deep relative import must become the matching alias. A remaining same-feature relative import is valid. The other commands must end with no obsolete architecture hits except the named frontend `HOME_PAGE_SIZE = 6`.

- [ ] **Step 2: Migrate remaining imports without adding barrels**

Change imports such as:

```ts
import { Button } from "$ui/primitives/Button";
import { preloadRouteQuery } from "$relay/route-preload";
import type { BrowseRouteQuery } from "$generated/BrowseRouteQuery.graphql";
```

Keep `./Component` within a route feature. Do not create `$ui/components/index.ts` or re-export unrelated modules to shorten import statements.

- [ ] **Step 3: Remove remaining shells and resolve all router imports**

The file inventory after Tasks 3-5 must already be empty. If the command returns a file, treat that as an incomplete earlier task: move React Router lifecycle behavior into that route module, move substantial pure logic into its named route-data/filter module, move a top-level query to its route or an auxiliary query to its sole consumer, then delete the shell and empty directory. Verify every lazy router entry loads exactly one route module.

- [ ] **Step 4: Run compiler, structural, and full frontend unit gates**

Run:

```bash
cd assets
pnpm exec relay-compiler
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm exec eslint .
pnpm exec oxfmt --check .
```

Repeat Step 1's inventory. Expected: all commands pass and only intentional same-feature relative imports remain.

- [ ] **Step 5: Commit the structural cleanup**

```bash
git commit -m "refactor: simplify frontend route boundaries"
```

Stage exact frontend source/test/generated files only.

---

### Task 7: Run full production gates and anti-slop review

**Files:**
- Modify: only files required by a reproduced failing gate or a concrete anti-slop finding
- Modify: `docs/work/production-ui-system-home.md` with final evidence if this remains the active lane and is within the current owned scope

**Interfaces:**
- Produces no new architecture. This task proves the prior six tasks satisfy the approved spec and removes only demonstrated duplication, dead compatibility, or regression.

- [ ] **Step 1: Review the complete diff for unnecessary abstraction and contract drift**

Inspect `git diff` from `e74c9b86` to `HEAD` and reject:

- delegation modules with no domain responsibility;
- generic loader/connection/fragment factories;
- compatibility fields for old homepage list or anonymous-ID contracts;
- fragments on pure badges/layout/view-model components;
- route components bloated with parsing logic that belongs in an existing purpose-named module;
- new guards/fallbacks without reachable invalid input;
- browser-supplied visitor IDs, ordinary-page visitor insertion, or entropy/internal visitor IDs exposed through GraphQL; and
- import barrels that hide ownership or create cycles.

Use `mix xref graph --label compile-connected` and frontend cycle/type failures only to investigate concrete coupling; do not add abstractions merely to reduce line count.

- [ ] **Step 2: Run complete backend gates on the final source tree**

Run:

```bash
mix test
mix quality
mix typecheck
mix format --check-formatted
mix work_queue.validate
```

Expected: complete unpartitioned tests pass with zero failures; Credo/ExDNA/Reach/Dialyzer, typecheck, format, and queue validation pass.

- [ ] **Step 3: Run the complete frontend production gate**

Run:

```bash
cd assets
pnpm run check
PLAYWRIGHT_PORT=4174 pnpm exec playwright test tests/e2e/production-ui-home.spec.ts
```

Expected: Relay generation/validation, typecheck, lint, format, all Vitest files, client build, SSR build, and the bundle budget pass; all nine browser journeys pass without updating snapshots.

- [ ] **Step 4: Inspect the accepted homepage PNGs if any pixels changed**

If Playwright reports a visual difference, do not accept it automatically. Regenerate only after proving the intended UI is unchanged or intentionally corrected, inspect desktop/tablet/mobile PNGs at original resolution, and verify no marketing hero, clipped controls, overflow, duplicated facts, weak focus state, or font fallback. If no snapshot changed, record that the existing accepted baselines remain byte-identical.

- [ ] **Step 5: Run final hygiene checks and commit reproduced fixes**

Run:

```bash
git diff --check
git status --short
git diff --cached --name-only
```

Confirm `config/dev.exs` is the only preserved unrelated modification and is not staged. If Task 7 required source/test corrections, commit them together with evidence-bearing lane documentation:

```bash
git commit -m "fix: close Relay architecture regressions"
```

If no corrections were needed, do not create an empty verification commit.

- [ ] **Step 6: Report final evidence**

Report milestone commit hashes, exact backend/frontend/browser counts, bundle gzip size/headroom, snapshot disposition, structural inventory results, and any nonblocking environment warnings. Do not claim completion from partial or stale runs.
