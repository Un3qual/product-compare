# Production UI System Spine And Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the production visual system and ship a useful, SSR-safe homepage with search, catalog preview, comparison continuity, and truthful new, trending, and viewer-relevant deals.

**Architecture:** Keep the root viewer loader limited to session navigation and give the index route two independent Relay preloads: an essential home workspace and an optional deals query. New set-based reads remain with Catalog, SEO, Specs, Pricing, Alerts, and Commerce Attribution; a focused GraphQL home resolver composes typed results without per-product reads or a generic dashboard abstraction. The shared frontend spine owns tokens, typography, application navigation, responsive layouts, and primitives that later route cohorts consume without modifying.

**Tech Stack:** Elixir 1.19, Ecto 3.13, PostgreSQL 18, Absinthe GraphQL, React 19, React Router 7 loaders and SSR, Relay 20, StyleX, Radix, Vitest, Playwright, and axe-core.

## Global Constraints

- The homepage is a useful shopping workspace, not a marketing or campaign landing page.
- Preserve GraphQL over `/api/graphql`, Phoenix cookie sessions, Relay, React Router SSR, StyleX, Radix, and the existing route-level Suspense/error model.
- Keep unsaved comparison state in normalized repeated `slug` URL parameters; do not add local-storage authority.
- Show at most six homepage products in existing ranked catalog order; each has a displayable specification and an active in-stock offer observed within 24 hours.
- Define New at 72 hours plus a fresh 24-hour in-stock observation; define Trending at five distinct first-party identities in seven days plus a landed price below the rolling 30-day median.
- Count an authenticated user id or anonymous id as one activity identity and ignore sessions with neither; never expose counts or identities.
- Rank signed-in relevance by matching watch target, then saved/current comparison membership, then price improvement and freshness.
- The deals query is optional and fault-isolated; workspace failure retains search/category recovery and deal failure never hides the workspace.
- Use typed reason codes and facts; do not return arbitrary marketing copy or reimplement ranking policy in React.
- Bundle Instrument Sans and IBM Plex Mono locally with their license notices and retain the existing bundle budget.
- Use one compare-blue accent and freshness green; avoid dashboard-card mosaics, marketing heroes, ornamental icons, decorative gradients, and a new motion library.
- Use 120–180 ms state transitions, preserve reduced-motion parity, and keep one semantic tree at every viewport.
- User-facing copy must not expose internal vocabulary such as evidence, taxon, merchant product, source artifact, current attributes, qualification, recommendation profile, or persisted snapshot.
- Every existing feature and applicable state remains reachable; no parity-ledger row may be deferred as follow-up polish.

---

## Owned Paths

- `assets/package.json`
- `assets/pnpm-lock.yaml`
- `assets/playwright.config.ts`
- `assets/src/router.tsx`
- `assets/src/RootDestinations.tsx`
- `assets/src/routes/RootRoute.tsx`
- `assets/src/routes/root-destination-data.ts`
- `assets/src/routes/home/**`
- `assets/src/ui/components/brand/**`
- `assets/src/ui/components/compare/**`
- `assets/src/ui/components/products/**`
- `assets/src/ui/components/layout/**`
- `assets/src/ui/components/feedback/**`
- `assets/src/ui/primitives/**`
- `assets/src/ui/theme/**`
- `assets/src/fonts/**`
- `assets/src/__generated__/Home*`
- `assets/schema.graphql`
- `assets/test/routes/home/**`
- `assets/test/routes/root.route.test.tsx`
- `assets/test/routes/root-destination-data.test.ts`
- `assets/test/router.test.tsx`
- `assets/test/ui/**`
- `assets/tests/e2e/production-ui-home.spec.ts`
- `assets/tests/e2e/production-ui-home.spec.ts-snapshots/**`
- `lib/product_compare/catalog.ex`
- `lib/product_compare/catalog/home_workspace.ex`
- `lib/product_compare/seo.ex`
- `lib/product_compare/seo/categories.ex`
- `lib/product_compare/specs.ex`
- `lib/product_compare/specs/home_highlights.ex`
- `lib/product_compare/pricing.ex`
- `lib/product_compare/pricing/home_offers.ex`
- `lib/product_compare/alerts.ex`
- `lib/product_compare/alerts/home_relevance.ex`
- `lib/product_compare/commerce_attribution.ex`
- `lib/product_compare/commerce_attribution/trending_activity.ex`
- `lib/product_compare_web/resolvers/home_resolver.ex`
- `lib/product_compare_web/schema.ex`
- `lib/product_compare_web/schema/home/queries.ex`
- `lib/product_compare_web/schema/home/types.ex`
- `test/product_compare/catalog/home_workspace_test.exs`
- `test/product_compare/seo_test.exs`
- `test/product_compare/specs/home_highlights_test.exs`
- `test/product_compare/pricing/home_offers_test.exs`
- `test/product_compare/alerts/home_relevance_test.exs`
- `test/product_compare/commerce_attribution/trending_activity_test.exs`
- `test/product_compare_web/graphql/home_queries_test.exs`
- `docs/work/production-ui-system-home.md`

## Feature-Parity Ledger

| Capability | Authority and state | Required verification |
| --- | --- | --- |
| Guest/member/operator shell | Root viewer query, degraded guest fallback, auth-route revalidation | root loader, destination, shell, router, SSR tests |
| Search and category entry | Index-owned URL form and canonical catalog/category paths | home path/view tests and browser keyboard journey |
| Product ledger | Essential workspace query; 0–6 eligible rows; local error/retry | backend boundary/query-budget tests and home route tests |
| Comparison continuity | Normalized URL slugs, ordered 1–3, omitted when empty | home path, loader, SSR, responsive tests |
| New and Trending deals | Optional public query, exact temporal/activity/median boundaries | domain, GraphQL privacy, and route degraded-state tests |
| For you | Viewer-only watches/saved/current selection, safe public fallback | owner-isolation and guest/signed-in GraphQL tests |
| Shared presentation system | Tokens, navigation, layouts, controls, feedback, focus, motion | component, axe, reduced-motion, visual, and overflow tests |
| Metadata and fallback routes | Every router entry, plain-language metadata, wildcard 404 | router metadata and lazy/error recovery tests |

### Task 1: Add Set-Based Home Workspace And Deal Domain Reads

**Files:**

- Create the five domain implementation and five focused test files listed under Owned Paths.
- Modify the five public context facades listed under Owned Paths.

**Interfaces:**

- Consumes: existing ranked catalog filtering, current specification projections, `Pricing.current_offer_truths/2`, owned watches, saved comparison items, and commerce click-session identities.
- Produces:

  ```elixir
  Catalog.home_workspace_candidates(selected_slugs, now: now, limit: 6)
  Seo.home_category_shortcuts(now: now, limit: 6)
  Specs.home_specification_highlights(product_ids, limit: 3)
  Pricing.home_offer_summaries(product_ids, now: now)
  Pricing.home_deal_candidates(now: now)
  Alerts.home_relevance(user_id)
  CommerceAttribution.trending_product_ids(now: now, days: 7, minimum_identities: 5)
  ```

- [ ] **Step 1: Write exact RED boundary tests**

  Seed controls on both sides of 24-hour, 72-hour, seven-day, five-identity, and 30-day-median boundaries. Assert catalog order, six-row truncation, a required display specification, active/in-stock/latest-observation eligibility, authenticated-versus-anonymous identity de-duplication, omission of identity-less clicks, watch targets, saved product order, and deterministic tie-breaks.

- [ ] **Step 2: Run the focused RED suite**

  ```bash
  mix test test/product_compare/catalog/home_workspace_test.exs test/product_compare/seo_test.exs test/product_compare/specs/home_highlights_test.exs test/product_compare/pricing/home_offers_test.exs test/product_compare/alerts/home_relevance_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs
  ```

  Expected: compilation failures for the seven missing public functions.

- [ ] **Step 3: Implement focused set-based modules**

  Return immutable maps keyed by product id and preserve Decimal/DateTime values:

  ```elixir
  %{
    product_id => %{
      merchant_product_id: merchant_product_id,
      merchant_name: merchant_name,
      currency: currency,
      landed_price: landed_price,
      observed_at: observed_at,
      first_seen_at: first_seen_at,
      median_30d: median_30d,
      active_offer_count: active_offer_count
    }
  }
  ```

  Use set-based joins/window aggregates and deterministic id tie-breakers. Keep orchestration out of the facades and do not create a `Dashboard` module.
  Derive activity identity exactly as a tagged value so numeric user and
  anonymous ids cannot collide:

  ```sql
  CASE
    WHEN user_id IS NOT NULL THEN 'u:' || user_id::text
    WHEN anonymous_id IS NOT NULL THEN 'a:' || anonymous_id::text
    ELSE NULL
  END
  ```

  Define a new offer's start as `least(merchant_products.inserted_at,
  min(price_points.observed_at))`; do not substitute `last_seen_at`.

- [ ] **Step 4: Run GREEN and query-count controls**

  Run the Task 1 suite again and assert per-table SELECT counts are identical for one and six eligible products and for five versus twenty activity rows.

- [ ] **Step 5: Commit the domain milestone**

  ```bash
  git add lib/product_compare test/product_compare docs/work/production-ui-system-home.md
  git commit -m "feat: add bounded homepage reads"
  ```

### Task 2: Expose Typed Home GraphQL Operations

**Files:**

- Create: `lib/product_compare_web/resolvers/home_resolver.ex`
- Create: `lib/product_compare_web/schema/home/queries.ex`
- Create: `lib/product_compare_web/schema/home/types.ex`
- Create: `test/product_compare_web/graphql/home_queries_test.exs`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `assets/schema.graphql`
- Modify: `docs/work/production-ui-system-home.md`

**Interfaces:**

- Consumes: Task 1 domain functions and `context.current_user`.
- Produces:

  ```graphql
  homeWorkspace(selectedSlugs: [String!]!): HomeWorkspace!
  homeDeals(selectedSlugs: [String!]!): HomeDeals!

  enum HomeDealReasonCode {
    NEW_OFFER
    TRENDING_BELOW_MEDIAN
    WATCH_TARGET
    SAVED_COMPARISON
    CURRENT_COMPARISON
  }

  enum HomePriceSignalCode {
    BELOW_30_DAY_MEDIAN
    AT_OR_ABOVE_30_DAY_MEDIAN
    NO_30_DAY_BASELINE
  }
  ```

- [ ] **Step 1: Write RED semantic, privacy, and budget tests**

  Assert exact product/category/offer/highlight output, ordered selected summaries, typed reason codes/facts, no personalized rows for guests, strict viewer ownership, global fallback for a viewer without matches, and fixed query counts for small/max payloads. Assert the payload has no arbitrary reason string or activity-count field.

- [ ] **Step 2: Run the GraphQL RED test**

  ```bash
  mix test test/product_compare_web/graphql/home_queries_test.exs
  ```

  Expected: schema validation fails because the home fields and types do not exist.

- [ ] **Step 3: Implement schema types and resolver composition**

  Return two independent payloads. `homeWorkspace` must be non-null and
  essential and includes product identity, three highlights, best current
  landed price/merchant, active-offer count, typed 30-day price signal, latest
  observation time, and normalized selected products. `homeDeals` returns
  `new`, `trending`, and viewer-only `forYou` lists. Encode ids through
  `GlobalId`, preserve reason facts as typed nullable fields, and never
  authorize from caller-supplied user ids.

- [ ] **Step 4: Generate and verify schema**

  ```bash
  mix test test/product_compare_web/graphql/home_queries_test.exs
  mix absinthe.schema.sdl --schema ProductCompareWeb.Schema assets/schema.graphql
  cd assets && pnpm run relay
  ```

  Expected: semantic/privacy/budget tests pass, the checked-in SDL matches the
  live schema, and Relay generation succeeds without hand-edited artifacts.

- [ ] **Step 5: Commit the GraphQL milestone**

  ```bash
  git add lib/product_compare_web assets/schema.graphql assets/src/__generated__ test/product_compare_web/graphql/home_queries_test.exs docs/work/production-ui-system-home.md
  git commit -m "feat: expose homepage workspace and deals"
  ```

### Task 3: Establish The Shared Production UI Spine

**Files:**

- Modify the package, theme, shared layout, feedback, primitive, navigation, root destination, router, and UI test paths listed under Owned Paths.
- Create: `assets/src/ui/components/brand/CompareMark.tsx`
- Create: `assets/src/ui/components/compare/ComparisonContinuity.tsx`
- Create: `assets/src/ui/components/products/ProductLedger.tsx`
- Create: `assets/src/fonts/README.md`

**Interfaces:**

- Consumes: existing local primitive APIs and normalized compare path helpers.
- Produces:

  ```tsx
  <CompareMark label="Product Compare" />
  <ComparisonContinuity products={products} destination={comparePath} />
  <ProductLedger rows={rows} secondaryDisclosureLabel="More details" />
  ```

- [ ] **Step 1: Add RED component and token assertions**

  Assert the warm mineral/paper semantic tokens, compare blue, freshness green, sans/mono font variables, 44px touch minimum, visible focus, skip-link behavior, guest/member/operator menus, mobile search/compare access, one semantic product list, numbered selection labels, reduced-motion overrides, and no plain-language violations in router metadata.

- [ ] **Step 2: Install local font and accessibility assets**

  ```bash
  cd assets && pnpm add @fontsource-variable/instrument-sans @fontsource/ibm-plex-mono && pnpm add -D @axe-core/playwright
  ```

  Import the Instrument Sans variable weight file and only the IBM Plex Mono
  weights actually used by data labels. Retain the packages' OFL-1.1 notices
  through `assets/src/fonts/README.md`; do not load a third-party font URL.

- [ ] **Step 3: Implement the stable spine**

  Replace the current cool-neutral theme with the approved semantic palette, keep compatibility aliases during migration, add mono data tokens, make navigation responsive without a horizontal link strip, and add only reusable owners justified by the approved cross-route contracts. Apply 120–180 ms Radix/state transitions and a `prefers-reduced-motion` override.

- [ ] **Step 4: Run UI foundation GREEN**

  ```bash
  cd assets && pnpm run test:unit -- test/ui test/routes/root-destination-data.test.ts test/router.test.tsx
  cd assets && pnpm run typecheck && pnpm run lint && pnpm run format:check
  ```

  Expected: all shared presentation, navigation, metadata, focus, and type gates pass.

- [ ] **Step 5: Commit the spine milestone**

  ```bash
  git add assets/package.json assets/pnpm-lock.yaml assets/src/ui assets/src/fonts assets/src/RootDestinations.tsx assets/src/routes/root-destination-data.ts assets/src/router.tsx assets/test/ui assets/test/routes/root-destination-data.test.ts assets/test/router.test.tsx docs/work/production-ui-system-home.md
  git commit -m "feat: establish production UI spine"
  ```

### Task 4: Build The Useful Home Route With Fault Isolation

**Files:**

- Create: `assets/src/routes/home/HomeRoute.tsx`
- Create: `assets/src/routes/home/loader.ts`
- Create: `assets/src/routes/home/queries/HomeWorkspaceRouteQuery.ts`
- Create: `assets/src/routes/home/queries/HomeDealsRouteQuery.ts`
- Create: `assets/src/routes/home/home-view-data.ts`
- Create: `assets/src/routes/home/home-paths.ts`
- Create: `assets/src/routes/home/HomeSearch.tsx`
- Create: `assets/src/routes/home/HomeProductLedger.tsx`
- Create: `assets/src/routes/home/HomeDeals.tsx`
- Create: `assets/test/routes/home/home.route.test.tsx`
- Create: `assets/test/routes/home/home-view-data.test.ts`
- Create: `assets/test/routes/home/home-paths.test.ts`
- Modify: `assets/src/routes/RootRoute.tsx`
- Modify: `assets/src/router.tsx`

**Interfaces:**

- Consumes: Task 2 queries, Task 3 shared components, root outlet viewer, and canonical catalog/compare path helpers.
- Produces an index loader result with independent descriptors:

  ```ts
  type HomeLoaderData = {
    workspace: RelayRouteQueryDescriptor<HomeWorkspaceRouteQuery["variables"]>;
    deals: Promise<RelayRouteQueryDescriptor<HomeDealsRouteQuery["variables"]> | null>;
    selectedSlugs: string[];
  };
  ```

- [ ] **Step 1: Write RED path, loader, view, and route tests**

  Cover query trimming/100-character catalog limit, category/model search routing, normalized ordered comparison slugs, essential workspace failure, optional deal failure, abort propagation, SSR descriptor retention, six-column desktop headings, mobile disclosure semantics, guest tabs, conditional For you, typed reason copy, missing values, empty states, and plain language.

- [ ] **Step 2: Run the home RED suite**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/home test/routes/root.route.test.tsx test/router.test.tsx
  ```

  Expected: failures for missing home route modules and index loader.

- [ ] **Step 3: Implement the index-owned workbench**

  Keep `RootLayout` and its viewer query unchanged. Replace the index element with the lazy Home route/loader, retain search and category navigation when data fails, use an error boundary around deals only, and render product rows as one semantic article list with CSS grid columns that progressively disclose on tablet/mobile.

- [ ] **Step 4: Run GREEN and Relay checks**

  ```bash
  cd assets && pnpm run relay:check && pnpm run typecheck
  cd assets && pnpm run test:unit -- test/routes/home test/routes/root.route.test.tsx test/router.test.tsx
  ```

- [ ] **Step 5: Commit the homepage milestone**

  ```bash
  git add assets/src/routes/home assets/src/routes/RootRoute.tsx assets/src/router.tsx assets/src/__generated__ assets/test/routes/home assets/test/routes/root.route.test.tsx assets/test/router.test.tsx docs/work/production-ui-system-home.md
  git commit -m "feat: ship useful production homepage"
  ```

### Task 5: Prove Production Quality And Promote Successors

**Files:**

- Create: `assets/tests/e2e/production-ui-home.spec.ts`
- Create: deterministic snapshots under `assets/tests/e2e/production-ui-home.spec.ts-snapshots/`
- Modify: `docs/work/production-ui-system-home.md`
- Coordinator closeout only: `docs/work/index.md`, `docs/plans/INDEX.md`, and the four successor lane docs.

**Interfaces:**

- Consumes: the complete system/home implementation and seeded/stubbed GraphQL fixtures.
- Produces: desktop 1440×1000, tablet 900×1100, and mobile 390×844 visual/accessibility evidence plus a stable shared spine for successor cohorts.

- [ ] **Step 1: Add deterministic browser journeys**

  Stub GraphQL by operation name and cover guest search, category entry, add/remove/open comparison, signed-in For you fallback and match, optional deals failure/retry, keyboard-only navigation, axe scans, reduced motion, and `document.documentElement.scrollWidth === window.innerWidth` at each width.

- [ ] **Step 2: Run browser and snapshot RED/GREEN**

  ```bash
  cd assets && pnpm exec playwright test tests/e2e/production-ui-home.spec.ts --update-snapshots
  cd assets && pnpm exec playwright test tests/e2e/production-ui-home.spec.ts
  ```

  Inspect every generated image before accepting it. Reject clipped actions, duplicated mobile content, marketing-hero composition, generic card grids, weak comparison identity, and font fallback.

- [ ] **Step 3: Run full production gates**

  ```bash
  cd assets && pnpm run check
  mix test test/product_compare/catalog/home_workspace_test.exs test/product_compare/seo_test.exs test/product_compare/specs/home_highlights_test.exs test/product_compare/pricing/home_offers_test.exs test/product_compare/alerts/home_relevance_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs test/product_compare_web/graphql/home_queries_test.exs
  mix typecheck
  mix quality
  mix format --check-formatted
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 4: Complete the ledger and promote all four successors**

  Record observed behavior, test counts, screenshot paths, plain-language scan, and bundle delta in the lane doc. At the same coordinator boundary, close this row and promote Discover & Evaluate, Compare & Return, Account & Setup, and Operations together only if the shared owners are stable and their owned paths remain disjoint.

- [ ] **Step 5: Commit the closeout milestone**

  ```bash
  git add assets/tests/e2e docs/work docs/plans/INDEX.md
  git commit -m "test: verify production UI system and home"
  ```

## Blocker And Fallback Rules

- Stop if the exact deal policy cannot be expressed with set-based fixed-budget reads; do not ship a per-product query loop or weaken eligibility.
- Stop if viewer-relevant rows can leak across owners, guests receive viewer-only facts, or identity counts become client-visible.
- Stop if local fonts exceed the existing bundle budget after subsetting/import reduction; record the measured delta before changing the approved typefaces.
- Stop if a shared component needs route-kind flags or a generic display DSL; keep route composition local.
- Stop and record a coordinator blocker if later cohort paths must change before the spine is complete; do not make dependent rows prematurely ready.
