# SEO Context Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Seo` as the stable public context while moving
metadata, category qualification, and sitemap implementations into focused
internal modules.

**Architecture:** `ProductCompare.Seo` remains the only caller-facing facade
and preserves every public function, default, typespec, result, and map shape.
Three focused internal modules receive the existing implementations by
responsibility without changing qualification policy or data flow.

**Tech Stack:** Elixir, Ecto, PostgreSQL, ExUnit, Absinthe, Phoenix.

## Global Constraints

- Preserve every existing `ProductCompare.Seo` public function, default,
  typespec, result, map shape, and error.
- Preserve metadata copy, canonical paths, structured data, qualification,
  query ordering, Relay windows, sitemap bounds, and omission policy.
- Keep controllers, resolvers, loaders, snapshots, and other contexts
  dependent only on the facade.
- Do not change schemas, migrations, GraphQL SDL, controller routes, frontend
  metadata contracts, or product policy.
- Do not add a generic callback, adapter, policy, or catch-all owner.

---

### Task 1: Metadata Ownership

**Files:**

- Create: `lib/product_compare/seo/metadata.ex`
- Modify: `lib/product_compare/seo.ex`
- Test: `test/product_compare/seo_test.exs`
- Test: `test/product_compare_web/controllers/seo_controller_test.exs`
- Test: `test/product_compare_web/graphql/seo_surfaces_test.exs`

**Interfaces:** `ProductCompare.Seo.Metadata` owns product, merchant, category,
and comparison-snapshot metadata, factual structured data, qualification of
snapshot metadata, and shared copy/image/offer/rating helpers. The facade keeps
every existing metadata entry point.

- [ ] Run the three named suites as the green characterization baseline.
- [ ] Move metadata construction, canonical paths, image selection, copy
  fallbacks, structured data, offer/review projection, and snapshot
  qualification into `Metadata`.
- [ ] Replace facade implementations with explicit wrappers preserving
  defaults, nil handling, map keys, values, and indexability.
- [ ] Re-run all three suites and confirm exact titles, descriptions, paths,
  structured data, qualification, controller output, and GraphQL values.
- [ ] Commit with message `refactor: isolate seo metadata ownership`.

### Task 2: Category Ownership

**Files:**

- Create: `lib/product_compare/seo/categories.ex`
- Modify: `lib/product_compare/seo.ex`
- Test: `test/product_compare/seo_test.exs`
- Test: `test/product_compare_web/graphql/seo_surfaces_test.exs`

**Interfaces:** `ProductCompare.Seo.Categories` owns single and batched category
reads, descendant-product qualification, counts, deterministic order, and
parent-scoped qualified-product pages. The facade retains every category entry
point and return shape.

- [ ] Run the two named suites as the green characterization baseline.
- [ ] Move category lookup, batched loading, qualification-time query
  construction, descendant inclusion, counts, ordering, and page construction
  into `Categories`.
- [ ] Add explicit facade wrappers preserving accepted inputs, defaults,
  missing-category results, and Relay page shapes.
- [ ] Re-run both suites and confirm qualification thresholds, descendants,
  ordering, query budgets, pagination, and missing values remain unchanged.
- [ ] Commit with message `refactor: isolate seo category ownership`.

### Task 3: Sitemap Ownership

**Files:**

- Create: `lib/product_compare/seo/sitemaps.ex`
- Modify: `lib/product_compare/seo.ex`
- Test: `test/product_compare/seo_test.exs`
- Test: `test/product_compare_web/controllers/seo_controller_test.exs`

**Interfaces:** `ProductCompare.Seo.Sitemaps` owns sitemap kind dispatch and
bounded product, merchant, category, and public-comparison entry queries. The
facade retains the current sitemap function and default limit.

- [ ] Run the two named suites as the green characterization baseline.
- [ ] Move kind dispatch, bounds, qualification queries, ordering, canonical
  paths, last-modified values, and thin/private/revoked omission into
  `Sitemaps`.
- [ ] Replace the facade implementation with an explicit wrapper preserving
  defaults, invalid-kind behavior, entry order, and map shapes.
- [ ] Re-run both suites and confirm all sitemap kinds, bounds, paths,
  timestamps, omissions, and controller responses remain unchanged.
- [ ] Commit with message `refactor: isolate seo sitemap ownership`.

### Task 4: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/seo-context-decomposition.md`

- [ ] Run the exact 13-test characterization command recorded in the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no application caller references `Seo.Metadata`,
  `Seo.Categories`, or `Seo.Sitemaps` directly.
- [ ] Record final ownership, facade size, exact test count, and gate results
  in the lane doc and include it in the final code/test milestone commit.
