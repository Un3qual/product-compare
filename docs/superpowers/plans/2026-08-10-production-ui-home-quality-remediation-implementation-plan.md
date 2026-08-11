# Production UI Home Quality Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the validated correctness, performance, accessibility, and maintenance defects from the production homepage branch without widening its product scope.

**Architecture:** Preserve the existing useful homepage composition while repairing contracts at their owning boundaries: GraphQL owns stable identity, Alerts and Pricing own truthful watch matching and bounded offer selection, route loaders own serializable SSR data, and rendered controls own comparison continuity and accessibility. Remove only dead or test-only layers that have no production consumer.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Absinthe, Relay, React 19, React Router, StyleX, Vitest, Playwright.

## Global Constraints

- Use GraphQL over `/api/graphql`; add no browser REST endpoint.
- Keep Phoenix session ownership and current viewer privacy unchanged.
- Keep homepage offer ranking USD-only while shared SEO qualification remains any-currency.
- Preserve the six-row homepage bounds and three-product comparison bound.
- Use plain user-facing language and exact Decimal presentation.
- Add behavior-first RED coverage before each production change.
- Do not edit the four ready successor lane contracts or the coordinator queue.

---

### Task 1: Stable GraphQL identity and truthful viewer relevance

**Files:**
- Modify: `lib/product_compare_web/schema/home/types.ex`
- Modify: `lib/product_compare/alerts/home_relevance.ex`
- Modify: `lib/product_compare/pricing/home_offers.ex`
- Modify: `lib/product_compare_web/resolvers/home_resolver.ex`
- Modify: `assets/src/routes/home/queries/HomeWorkspaceRouteQuery.ts`
- Modify: `assets/src/routes/home/queries/HomeDealsRouteQuery.ts`
- Test: `test/product_compare_web/graphql/home_queries_test.exs`
- Test: `test/product_compare/alerts/home_relevance_test.exs`
- Test: `test/product_compare/pricing/home_offers_test.exs`

**Interfaces:**
- `homeWorkspace.products` exposes a wrapper with `product: Product!`, highlights, and offer.
- `selectedProducts` and deal products expose the canonical `Product` type.
- Viewer relevance retains watch merchant scope and admits `WATCH_TARGET` only when the returned eligible offer satisfies the exact target.

- [ ] Add GraphQL regression coverage proving one product can appear in selected, workspace, and deal positions with one stable Relay identity.
- [ ] Add target-watch regressions for above-target offers, listing-scoped watches, and saved/current fallback.
- [ ] Run the focused tests and confirm the new assertions fail for the audited reasons.
- [ ] Implement canonical product identity and exact watch matching.
- [ ] Regenerate Relay artifacts and run focused backend/frontend tests to GREEN.
- [ ] Commit the stable identity and truthful relevance milestone.

### Task 2: Serializable SSR and canonical comparison continuity

**Files:**
- Modify: `assets/src/routes/home/loader.ts`
- Modify: `assets/src/routes/home/HomeRoute.tsx`
- Modify: `assets/src/routes/home/HomeDeals.tsx`
- Modify: `assets/src/routes/home/HomeProductLedger.tsx`
- Modify: `assets/src/routes/RootDestinations.tsx`
- Test: `assets/test/entry.server.test.tsx`
- Test: `assets/test/routes/home/home.route.test.tsx`
- Test: `assets/test/routes/root.route.test.tsx`

**Interfaces:**
- Home loader data is fully JSON-serializable.
- Optional deals start after hydration with Relay query-loader disposal and local retry.
- Once workspace data resolves, every homepage and global-navigation destination uses canonical selected product slugs.
- Navigation disclosures are mutually exclusive and close on navigation.

- [ ] Add SSR serialization-to-hydration coverage that catches the native-promise failure.
- [ ] Add missing/duplicate/over-limit slug behavior tests and navigation continuity/dismissal tests.
- [ ] Run focused Vitest and confirm RED.
- [ ] Move optional deal loading to a hydrated client query and canonicalize all selection consumers.
- [ ] Preserve comparison slugs in public global destinations and control disclosure state.
- [ ] Run focused Vitest to GREEN and commit the routing milestone.

### Task 3: Bounded homepage reads and non-null workspace assembly

**Files:**
- Modify: `lib/product_compare/pricing/home_offers.ex`
- Modify: `lib/product_compare/specs.ex`
- Modify: `lib/product_compare/specs/reads.ex`
- Modify: `lib/product_compare/specs/reads/current_attributes.ex`
- Delete: `lib/product_compare/specs/home_highlights.ex`
- Modify: `lib/product_compare_web/resolvers/home_resolver.ex`
- Test: `test/product_compare/pricing/home_offers_test.exs`
- Test: `test/product_compare/specs/home_highlights_test.exs`
- Test: `test/product_compare_web/graphql/home_queries_test.exs`

**Interfaces:**
- Trending and viewer medians/latest-price work is scoped to candidate products before aggregation.
- New-offer selection does not build an unused median query.
- Home highlights are limited to three rows per product in SQL before nested metadata preloads.
- Products whose offer disappears between reads are omitted instead of violating GraphQL non-nullability.

- [ ] Add SQL-shape/row-bound regressions and a workspace assembly regression.
- [ ] Run focused backend tests and confirm RED.
- [ ] Refactor offer query construction around candidate-scoped eligible offers.
- [ ] Move the per-product highlight bound into the canonical current-attribute reader and remove the pass-through module.
- [ ] Filter incomplete workspace rows before GraphQL assembly.
- [ ] Run focused backend tests to GREEN and commit the bounded-read milestone.

### Task 4: Exact presentation and accessible primary links

**Files:**
- Modify: `assets/src/routes/home/home-view-data.ts`
- Modify: `assets/src/routes/home/HomeRoute.tsx`
- Modify: `assets/src/routes/home/HomeDeals.tsx`
- Modify: `assets/src/routes/home/HomeSearch.tsx`
- Modify: `assets/src/routes/home/queries/HomeWorkspaceRouteQuery.ts`
- Test: `assets/test/routes/home/home-view-data.test.ts`
- Test: `assets/test/routes/home/home.route.test.tsx`
- Test: `assets/tests/e2e/production-ui-home.spec.ts`

**Interfaces:**
- View-model input types derive from generated Relay responses.
- Decimal strings format without JavaScript `Number` conversion.
- Category and deal anchors have at least 44px rendered targets.
- Search copy names only supported product, brand, and model-number behavior.

- [ ] Add exact large-Decimal, generated-contract, search-copy, and touch-target regressions.
- [ ] Run focused unit/browser tests and confirm RED.
- [ ] Implement exact formatting and remove unused/impossible fields and fallbacks.
- [ ] Style primary links as full interactive targets and correct search copy.
- [ ] Run focused tests to GREEN and commit the presentation milestone.

### Task 5: Remove dead surfaces and brittle change-detector tests

**Files:**
- Modify: `assets/src/routes/RootDestinations.tsx`
- Modify: `assets/src/routes/root-destination-data.ts`
- Modify: `assets/test/routes/root-destination-data.test.ts`
- Modify: `assets/test/routes/root.route.test.tsx`
- Modify: `assets/test/ui/production-spine.test.tsx`
- Modify: `assets/tests/e2e/production-ui-home.spec.ts`
- Modify: `lib/product_compare/alerts.ex`
- Modify: `lib/product_compare/alerts/home_relevance.ex`
- Modify: `lib/product_compare/pricing.ex`
- Modify: `lib/product_compare/pricing/home_offers.ex`
- Modify: `lib/product_compare/commerce_attribution.ex`
- Modify: `lib/product_compare/commerce_attribution/trending_activity.ex`
- Modify focused tests for those APIs.
- Modify: `docs/work/production-ui-system-home.md`

**Interfaces:**
- Only production-consumed homepage APIs and root destination data remain public.
- UI tests assert rendered behavior, computed accessibility contracts, and stable visual outcomes rather than source strings or exact private track widths.

- [ ] Delete the retired home-destination tree and test-only read materializers.
- [ ] Replace source-string and exact private-pixel assertions with behavior contracts.
- [ ] Run all focused frontend/backend suites and `git diff --check`.
- [ ] Update the home lane with remediation evidence.
- [ ] Run full repository verification and commit the cleanup/closeout milestone.

## Verification

- `cd assets && pnpm run relay`
- Focused Vitest for home, root, SSR, and production spine.
- Focused Mix tests for Alerts, Pricing, Specs, Commerce Attribution, and home GraphQL.
- `PLAYWRIGHT_PORT=4174 pnpm exec playwright test tests/e2e/production-ui-home.spec.ts`
- `cd assets && pnpm run check`
- `mix test`
- `mix quality`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
