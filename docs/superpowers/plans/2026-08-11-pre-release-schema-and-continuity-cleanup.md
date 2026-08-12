# Pre-release schema and comparison-continuity cleanup implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace unreleased compatibility machinery with the final anonymous-visitor schema, add the missing New-deals access path, preserve comparison URL state through Offers, and remove the unused price-signal API.

**Architecture:** Historical migrations are rewritten because no production database requires an upgrade path. Comparison slugs remain normalized URL state and are threaded through existing route-data functions rather than a new store. Homepage fact hydration retains one public page-scoped API.

**Tech Stack:** Elixir, Ecto migrations, PostgreSQL, ExUnit, TypeScript, React Router, Vitest.

## Global Constraints

- Existing development databases may be reset; do not retain legacy columns, triggers, backfills, or dual-write behavior.
- Preserve `config/dev.exs` unchanged and unstaged.
- Use behavior and database-contract tests, not source-string-only assertions.
- Preserve the canonical three-product comparison limit.
- Commit only coherent code, test, and design milestones.

---

### Task 1: Put anonymous visitors directly in the original schema

**Files:**

- Modify: `priv/repo/migrations/20260521160000_create_commerce_attribution_core.exs`
- Delete: `priv/repo/migrations/20260810140000_create_anonymous_visitors.exs`
- Delete: `test/product_compare/repo/migrations/create_anonymous_visitors_test.exs`
- Create: `test/product_compare/repo/migrations/create_commerce_attribution_core_test.exs`
- Test: `test/product_compare/commerce_attribution/anonymous_visitors_test.exs`

**Interfaces:**

- Produces: final `anonymous_visitors` table and `commerce_click_sessions.anonymous_visitor_id` foreign key.
- Preserves: `Visitors.get_or_create/1` and `CommerceClickSession.changeset/2` runtime contracts.

- [ ] **Step 1: Write the failing fresh-schema migration test**

Load the original migration in an isolated prefix and assert the final schema directly:

```elixir
assert column_exists?(prefix, "commerce_click_sessions", "anonymous_visitor_id")
refute column_exists?(prefix, "commerce_click_sessions", "anonymous_id")
assert constraint_exists?(prefix, "commerce_click_sessions_single_actor")
assert index_definition(prefix, "commerce_click_sessions_anonymous_visitor_idx") =~
         "(anonymous_visitor_id)"
```

Insert a visitor and click, then prove the FK and the user/visitor exclusion constraint reject invalid direct writes.

- [ ] **Step 2: Run the migration test to verify RED**

Run:

```bash
mix test test/product_compare/repo/migrations/create_commerce_attribution_core_test.exs --seed 0
```

Expected: FAIL because the original migration still creates `anonymous_id` and does not create `anonymous_visitors`.

- [ ] **Step 3: Implement the final schema and delete rollout machinery**

Create `anonymous_visitors` before click sessions in the original migration:

```elixir
create table(:anonymous_visitors) do
  add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
  timestamps(type: :timestamptz, precision: 6, size: 6)
end

create unique_index(:anonymous_visitors, [:entropy_id])
```

Replace `anonymous_id` with the final FK, add its index, and create the named single-actor constraint. Delete the later migration and rollout-specific test instead of retaining an empty compatibility shell.

- [ ] **Step 4: Run final-schema and runtime tests to verify GREEN**

Run:

```bash
mix test test/product_compare/repo/migrations/create_commerce_attribution_core_test.exs test/product_compare/commerce_attribution/anonymous_visitors_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs test/product_compare_web/graphql/commerce_click_test.exs --seed 0
```

Expected: all tests pass and no executable `legacy_anonymous_id`, transition trigger, or backfill reference remains.

### Task 2: Add the New-deal merchant-product index and remove the dead API

**Files:**

- Modify: `priv/repo/migrations/20260303222611_create_pricing_affiliate_discussions.exs`
- Create: `test/product_compare/repo/migrations/create_pricing_affiliate_discussions_test.exs`
- Modify: `lib/product_compare/pricing.ex`
- Modify: `lib/product_compare/pricing/home_offers.ex`
- Test: `test/product_compare/pricing/home_offers_test.exs`

**Interfaces:**

- Produces: `merchant_products_home_new_idx` on `(currency_id, inserted_at, id)` for active rows.
- Removes: `Pricing.home_offer_price_signals/2` and `HomeOffers.price_signals/2`.
- Preserves: `Pricing.home_offer_page_facts/3` as the sole page-scoped hydration API.

- [ ] **Step 1: Write RED index and public-surface tests**

Assert the fresh pricing migration creates:

```elixir
assert index_definition(prefix, "merchant_products_home_new_idx") =~
         "(currency_id, inserted_at, id) WHERE (is_active = true)"
```

Add a public-surface assertion that `function_exported?(Pricing, :home_offer_price_signals, 2)` is false while existing page-fact behavior remains green.

- [ ] **Step 2: Run focused tests to verify RED**

Run:

```bash
mix test test/product_compare/repo/migrations/create_pricing_affiliate_discussions_test.exs test/product_compare/pricing/home_offers_test.exs --seed 0
```

Expected: FAIL because the index is absent and the unused function remains exported.

- [ ] **Step 3: Add the index and delete the duplicate query path**

Add the partial index to the original pricing migration:

```elixir
create index(:merchant_products, [:currency_id, :inserted_at, :id],
         name: :merchant_products_home_new_idx,
         where: "is_active = true"
       )
```

Delete both public/delegate clauses and the standalone `price_signals/2` query implementation. Do not change `page_facts/3`.

- [ ] **Step 4: Run Pricing and GraphQL tests to verify GREEN**

Run:

```bash
mix test test/product_compare/repo/migrations/create_pricing_affiliate_discussions_test.exs test/product_compare/pricing/home_offers_test.exs test/product_compare_web/graphql/home_queries_test.exs --seed 0
```

Expected: all tests pass with existing New-deal semantics and page-fact query budgets unchanged.

### Task 3: Preserve comparison slugs through Offers

**Files:**

- Modify: `assets/src/routes/offers/offer-discovery-filter-data.ts`
- Modify: `assets/src/routes/offers/offer-discovery-filters.ts`
- Modify: `assets/src/routes/offers/OfferDiscoveryFilterForm.tsx`
- Modify: `assets/src/routes/offers/OfferDiscoveryRoute.tsx`
- Modify: `assets/src/routes/offers/paths.ts`
- Modify: `assets/src/routes/catalog/BrowseRoute.tsx`
- Modify: `assets/src/routes/products/ProductDetailRoute.tsx`
- Modify: `assets/src/routes/compare/DecisionSummary.tsx`
- Test: `assets/test/routes/offers/offer-discovery-filter-data.test.ts`
- Test: `assets/test/routes/offers/offer-discovery-loader.test.ts`
- Test: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Test: `assets/test/routes/offers/paths.test.ts`
- Test: affected Browse, product-detail, and Compare route suites.

**Interfaces:**

- Extends: `OfferDiscoveryFilters` with `compareSlugs: string[]`.
- Extends: `productOffersPath(productId: string, compareSlugs?: readonly string[]): string`.
- Uses: `selectedCompareSlugsFromSearch/1` and the canonical maximum of three.

- [ ] **Step 1: Write failing URL round-trip tests**

Cover duplicate, blank, and fourth slugs on loader input, then assert exact normalized repeated parameters on form inputs and every generated path:

```ts
expect(filters.compareSlugs).toEqual(["alpha", "beta", "gamma"]);
expect(offerDiscoveryPath(filters, "next")).toContain(
  "slug=alpha&slug=beta&slug=gamma",
);
expect(productOffersPath("product-1", ["alpha", "beta"]))
  .toBe("/offers?productId=product-1&slug=alpha&slug=beta");
```

Render the form and assert three hidden `slug` inputs survive submission state. Assert Browse, detail, and comparison offer links retain the current selection.

- [ ] **Step 2: Run focused Vitest to verify RED**

Run:

```bash
cd assets && pnpm exec vitest run test/routes/offers test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx test/routes/compare/compare.route.test.tsx
```

Expected: failures show that filters and links currently drop slugs.

- [ ] **Step 3: Thread normalized slugs through existing route data**

Parse with `selectedCompareSlugsFromSearch(url.search)`. Append normalized slugs in `offerDiscoveryPath`, reset paths, product-detail/Browse recovery, and `productOffersPath`. Render hidden inputs:

```tsx
{filters.compareSlugs.map((slug) => (
  <input key={slug} name="slug" type="hidden" value={slug} />
))}
```

Pass current slugs from Browse and Product Detail. For comparison results, use the displayed product slugs in their existing order. Do not add storage or GraphQL variables.

- [ ] **Step 4: Run focused frontend tests to verify GREEN**

Run the Step 2 command plus root-navigation and comparison-path tests. Expected: all tests pass with exact URL preservation and no Relay artifact changes.

### Task 4: Audit unreleased compatibility and verify the branch

**Files:**

- Review: all paths changed by `git diff e6c28e34562e6cd15c5af6b576a7b120aa7d9752`
- Modify only confirmed compatibility/backfill owners and their tests.
- Modify: `docs/work/production-ui-system-home.md` only if lane evidence needs correction.

**Interfaces:**

- Removes: only branch-added compatibility for unshipped schemas/APIs.
- Preserves: real final-state migrations, exact query windows, seed data, and user-facing behavior.

- [ ] **Step 1: Inventory compatibility candidates**

Run:

```bash
git diff --name-only e6c28e34562e6cd15c5af6b576a7b120aa7d9752
rg -n "legacy|compatib|backfill|transition|dual.write|deprecated|alias" lib priv/repo/migrations assets/src test
```

For every match, identify a concrete shipped-version consumer. Delete it test-first when none exists; retain it when it serves current data semantics rather than upgrade compatibility.

- [ ] **Step 2: Run focused and complete gates**

Run backend focused tests from Tasks 1-2, frontend focused tests from Task 3, then:

```bash
mix test
mix quality
mix typecheck
mix format --check-formatted
mix work_queue.validate
cd assets && pnpm run check
git diff --check
```

Expected: all gates pass; `config/dev.exs` remains unstaged.

- [ ] **Step 3: Review and commit the coherent milestone**

Inspect the final diff for unused APIs, compatibility shells, test-only abstractions, formatter churn, and unrelated files. Stage only the approved design, plan, production files, tests, and truthful lane evidence, then commit:

```bash
git commit -m "fix: remove unreleased compatibility paths"
```

- [ ] **Step 4: Push the existing PR branch**

Push `codex/production-ui-home-quality-remediation` and verify PR #123 remains non-draft with the new commit at its head.
