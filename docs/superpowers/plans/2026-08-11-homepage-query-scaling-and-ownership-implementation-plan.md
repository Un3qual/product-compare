# Homepage Query Scaling And Ownership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve every homepage result and GraphQL contract while reducing repeated PostgreSQL history work and refocusing the existing pricing modules around exact temporal history, current offer availability, and homepage ranking.

**Architecture:** Rename the existing `TruthReads` module to `CurrentOffers`, move reusable exact temporal relations into the existing `PriceHistory`, and leave homepage-specific winner and rail ranking in the existing `HomeOffers`. Keep raw history authoritative, use explicit time bounds, retain per-rail repeatable-read snapshots, and add no range-specific state or new pricing module.

**Tech Stack:** Elixir, Ecto, PostgreSQL 18, Absinthe GraphQL, Relay connections, ExUnit, concurrent Ecto migrations.

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-11-homepage-query-scaling-and-ownership-design.md` exactly.
- Add no summary, rollup, cache, materialized-view, or other read-model table.
- Keep all price and activity statistics exact and parameterized by explicit time bounds.
- Add zero net-new pricing modules: rename `TruthReads` to `CurrentOffers`, expand `PriceHistory`, and refocus `HomeOffers`.
- Preserve every public `ProductCompare.Pricing` function currently consumed outside the pricing context.
- Preserve GraphQL types, fields, nullability, Relay nodes, cursors, ordering, reasons, projection, privacy, and the 1,000-row traversal cap.
- Preserve USD-only homepage offers, 24-hour freshness, 72-hour New, exact seven-day/five-person Trending, exact 30-day median, watch/saved/current priority, and New/Trending fallback priority.
- Preserve deterministic `observed_at DESC, id DESC` latest-price and landed-price/merchant-product winner tie-breaks.
- Preserve per-rail repeatable-read consistency and existing concurrent-write behavior.
- Do not add latency, estimated-cost, buffer-count, timing, or representative-cardinality planner gates. Preserve the existing Trending EXPLAIN regression unless the changed query shape requires an equivalent expectation.
- Do not edit or stage the user-owned `config/dev.exs` change.

---

### Task 1: Centralize Exact Price History And Current Offer Availability

**Files:**

- Rename: `lib/product_compare/pricing/truth_reads.ex` to `lib/product_compare/pricing/current_offers.ex`
- Modify: `lib/product_compare/pricing/price_history.ex`
- Modify: `lib/product_compare/pricing/home_offers.ex`
- Modify: `lib/product_compare/pricing.ex`
- Modify: `lib/product_compare/catalog/home_workspace.ex`
- Modify: `lib/product_compare/seo/categories.ex`
- Modify: `test/product_compare/pricing/pricing_test.exs`
- Modify: `test/product_compare/pricing/home_offers_test.exs`
- Modify: `test/product_compare/catalog/home_workspace_test.exs`
- Modify: `test/product_compare/seo_test.exs`

**Interfaces:**

- Preserve `Pricing.current_offer_truths/2` and `Pricing.current_offer_truth/2`; only their internal owner changes from `TruthReads` to `CurrentOffers`.
- Add internal `PriceHistory.latest_observation_for_offer_query/1`, returning an Ecto relation correlated to the parent `:offer` binding and bounded by the supplied `DateTime`.
- Add internal `PriceHistory.first_observation_for_offer_query/1`, returning the deterministic earliest observation at or before the supplied `DateTime`.
- Add internal `PriceHistory.landed_price_medians_query/2`, consuming a list or Ecto product-ID scope plus required `from`, `to`, and `currency` options and returning `%{product_id, currency, median}` rows.
- Add internal `CurrentOffers.eligible_query/2`, consuming `:all`, product IDs, or a product-ID query plus required `now`, `currency`, and `fresh_after` options and returning current eligible listing facts without first-seen or median fields.
- Add internal `CurrentOffers.with_first_observation/2` and `CurrentOffers.with_median/3`; callers opt into those relations explicitly.
- Keep every existing homepage function exposed through `ProductCompare.Pricing` with its current signature and return shape.

- [ ] **Step 1: Write characterization REDs for the new boundaries**

  Add focused cases that prove current-offer public results are unchanged; latest and first observations exclude future rows and use ID tie-breaks; median bounds are inclusive and reject `from > to`; empty scopes issue no price-history SELECT; workspace, Trending, and viewer relations do not contain first-seen aggregation; and New does not calculate a catalog-wide median.

- [ ] **Step 2: Run the Task 1 RED suite**

  Run:

  ```bash
  mix test test/product_compare/pricing/pricing_test.exs test/product_compare/pricing/home_offers_test.exs test/product_compare/catalog/home_workspace_test.exs test/product_compare/seo_test.exs --seed 0
  ```

  Expected: the newly added relation ownership, arbitrary-bound validation, and unused-history assertions fail against the current `HomeOffers` implementation while all prior behavior cases remain green.

- [ ] **Step 3: Rename `TruthReads` without leaving a delegation shell**

  Move its existing current-offer public behavior into `CurrentOffers`, update only the `Pricing` alias/delegation, and prove repository search has no remaining `TruthReads` reference or compatibility wrapper.

- [ ] **Step 4: Implement explicit temporal relations in `PriceHistory`**

  Use lateral latest/earliest probes against the existing `(merchant_product_id, observed_at DESC, id DESC)` covering index. Keep exact median computation over raw price points and explicit inclusive bounds; do not add a generalized statistics framework or speculative facade API.

- [ ] **Step 5: Implement centralized current availability in `CurrentOffers`**

  Compose the candidate listing relation once, apply explicit currency/freshness/active/stock/shipping rules, and expose opt-in first-observation and median joins. Keep `OfferTruth` as the existing pure value-level policy module.

- [ ] **Step 6: Rewire homepage, Catalog, and SEO consumers**

  Make `HomeOffers`, workspace eligibility, and SEO offer qualification consume the centralized current-offer relation. Preserve the workspace's product-first correlated `EXISTS`, SEO's distinct canonical/homepage count meanings, and every existing result order.

- [ ] **Step 7: Run Task 1 GREEN and quality checks**

  Run the RED command again, then:

  ```bash
  mix format --check-formatted lib/product_compare/pricing.ex lib/product_compare/pricing/current_offers.ex lib/product_compare/pricing/price_history.ex lib/product_compare/pricing/home_offers.ex lib/product_compare/catalog/home_workspace.ex lib/product_compare/seo/categories.ex test/product_compare/pricing/pricing_test.exs test/product_compare/pricing/home_offers_test.exs test/product_compare/catalog/home_workspace_test.exs test/product_compare/seo_test.exs
  mix typecheck
  git diff --check
  ```

- [ ] **Step 8: Review and commit the temporal/current-offer milestone**

  Reject boolean option proliferation, query-only wrapper modules, duplicated eligibility predicates, unbounded `:all` median work, and formatter churn. Commit the owned Task 1 paths with subject `refactor: centralize current offer reads`.

### Task 2: Remove Unused Rail Work And Duplicate For You Ranking

**Files:**

- Modify: `lib/product_compare/pricing/home_offers.ex`
- Modify: `lib/product_compare/pricing.ex`
- Modify: `lib/product_compare_web/resolvers/home_resolver.ex`
- Modify: `test/product_compare/pricing/home_offers_test.exs`
- Modify: `test/product_compare_web/graphql/home_queries_test.exs`
- Modify: `test/product_compare_web/graphql/home_deal_consistency_test.exs`
- Modify: `test/product_compare_web/graphql/home_workspace_consistency_test.exs`

**Interfaces:**

- Preserve `Pricing.home_offer_summaries/2`, `home_new_deal_candidates/1`, `home_trending_deal_candidates/2`, `home_fallback_deal_candidates/2`, `home_viewer_deal_candidates/2`, and `home_offer_page_facts/3`.
- Add `Pricing.home_viewer_deal_exists?/2`, consuming the same relevance query and `now` policy as viewer ranking and returning a boolean without Product hydration, median calculation, output ranking, or page facts.
- Preserve the resolver's `viewer_deals/3` GraphQL return and error contract.

- [ ] **Step 1: Add rail-specific RED coverage**

  Add tests proving workspace, Trending, and For You omit first-observation history; only New/fallback New request it; median work appears only for page-selected signals or median-dependent qualification/ranking; a non-empty first For You page executes one viewer ranking query; first-page no-match still falls back; and an empty later page distinguishes exhausted personalized results from a true fallback.

- [ ] **Step 2: Run the Task 2 RED suite**

  Run:

  ```bash
  mix test test/product_compare/pricing/home_offers_test.exs test/product_compare_web/graphql/home_queries_test.exs test/product_compare_web/graphql/home_deal_consistency_test.exs test/product_compare_web/graphql/home_workspace_consistency_test.exs --seed 0
  ```

  Expected: the existing full viewer preflight violates the one-ranking-query assertion and rails still expose unused first-observation work.

- [ ] **Step 3: Make every rail request only required relations**

  Keep the existing winner and rail ordering while composing base availability, first observation, and median explicitly according to the approved surface matrix. Preserve page-only hydration for the real page and leave the Relay lookahead row unhydrated.

- [ ] **Step 4: Implement page-first viewer selection**

  Query the requested personalized page first. Return it directly when non-empty; use fallback for an empty first page; and call `home_viewer_deal_exists?/2` only for an empty later page before deciding between an exhausted empty connection and fallback. Keep classification, page selection, and facts inside the existing repeatable-read transaction.

- [ ] **Step 5: Preserve concurrency and mutation evidence**

  Keep deterministic barriers proving that offer deactivation, Product deletion, and watch deactivation after candidate selection cannot mix snapshots. Temporarily restore the former preflight path and prove the new first-page query-budget test fails, then restore page-first logic.

- [ ] **Step 6: Run Task 2 GREEN and affected regression suites**

  Run the RED command again, then:

  ```bash
  mix test test/product_compare/alerts/home_relevance_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs test/product_compare/catalog/home_workspace_test.exs test/product_compare/seo_test.exs test/product_compare_web/graphql/home_queries_test.exs test/product_compare_web/graphql/home_deal_consistency_test.exs test/product_compare_web/graphql/home_workspace_consistency_test.exs --seed 0
  mix format --check-formatted lib/product_compare/pricing/home_offers.ex lib/product_compare/pricing.ex lib/product_compare_web/resolvers/home_resolver.ex test/product_compare/pricing/home_offers_test.exs test/product_compare_web/graphql/home_queries_test.exs test/product_compare_web/graphql/home_deal_consistency_test.exs test/product_compare_web/graphql/home_workspace_consistency_test.exs
  mix typecheck
  git diff --check
  ```

- [ ] **Step 7: Review and commit the rail milestone**

  Reject response-shape changes, ranking drift, a second home-deal module, raw SQL parsing, and query-count assertions that weaken behavior coverage. Commit the Task 2 paths with subject `perf: bound homepage rail history work`.

### Task 3: Cover Exact Arbitrary-Range Trending Reads

**Files:**

- Create: `priv/repo/migrations/20260811130000_cover_homepage_activity_reads.exs`
- Create: `test/product_compare/repo/migrations/cover_homepage_activity_reads_test.exs`
- Modify: `lib/product_compare/commerce_attribution/trending_activity.ex`
- Modify: `test/product_compare/commerce_attribution/trending_activity_test.exs`
- Modify: `test/product_compare/repo/migrations/add_commerce_revenue_filter_indexes_test.exs`

**Interfaces:**

- Preserve `CommerceAttribution.trending_product_candidates_query/1` and its existing `now`, `days`, and `minimum_identities` options.
- Add optional explicit `from` and `to` bounds. When absent, `to` is `now` and `from` is `to - days`; explicit bounds are inclusive and invalid reversed bounds raise `ArgumentError`.
- Install `commerce_click_sessions_home_activity_idx` on `(inserted_at, merchant_product_id) INCLUDE (user_id, anonymous_visitor_id)` and supersede `commerce_click_sessions_inserted_at_idx` only after the new index is valid.

- [ ] **Step 1: Write migration and arbitrary-range REDs**

  Add behavior tests for an exact non-seven-day range, both inclusive boundaries, user/visitor identity collision, repeat clicks, actorless clicks, and future exclusion. Add isolated-prefix migration tests for definition, up/down retry, valid-index OID stability, invalid/wrong same-name repair, and continuous presence of either the old or new time-window access path.

- [ ] **Step 2: Run the Task 3 RED suite**

  Run:

  ```bash
  mix test test/product_compare/commerce_attribution/trending_activity_test.exs test/product_compare/repo/migrations/cover_homepage_activity_reads_test.exs test/product_compare/repo/migrations/add_commerce_revenue_filter_indexes_test.exs --seed 0
  ```

  Expected: explicit-range cases fail and the new migration module/index do not exist.

- [ ] **Step 3: Implement exact explicit activity bounds**

  Normalize the existing `now`/`days` contract into explicit inclusive bounds, retain exact composite identity counting and the actor filter, and leave final deal ordering in `HomeOffers`.

- [ ] **Step 4: Implement the concurrent covering-index migration**

  Use prefix-aware catalog checks. Repair invalid or wrong same-named indexes, preserve valid intended OIDs on retries, create the replacement before dropping the old index, and implement the reverse order on rollback. Do not encode a particular range or threshold in the index.

- [ ] **Step 5: Run Task 3 GREEN and migration checks**

  Run the RED command again, then:

  ```bash
  mix format --check-formatted priv/repo/migrations/20260811130000_cover_homepage_activity_reads.exs lib/product_compare/commerce_attribution/trending_activity.ex test/product_compare/repo/migrations/cover_homepage_activity_reads_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs test/product_compare/repo/migrations/add_commerce_revenue_filter_indexes_test.exs
  mix credo --strict lib/product_compare/commerce_attribution/trending_activity.ex priv/repo/migrations/20260811130000_cover_homepage_activity_reads.exs test/product_compare/commerce_attribution/trending_activity_test.exs test/product_compare/repo/migrations/cover_homepage_activity_reads_test.exs
  git diff --check
  ```

- [ ] **Step 6: Review and commit the activity milestone**

  Preserve the existing exact-count and EXPLAIN regression, avoid a shared migration framework unless clone enforcement requires an existing repository abstraction, and commit the Task 3 paths with subject `perf: cover exact homepage activity reads`.

### Task 4: Integrated Verification And Lane Closeout

**Files:**

- Modify: `docs/work/homepage-query-scaling-and-ownership.md`
- Test only: every source and test path changed in Tasks 1–3

**Interfaces:**

- Consumes all prior task commits without adding another production abstraction.
- Produces fresh focused/full verification evidence and truthful lane completion status.

- [ ] **Step 1: Run the complete focused suite**

  ```bash
  mix test test/product_compare/pricing/pricing_test.exs test/product_compare/pricing/home_offers_test.exs test/product_compare/catalog/home_workspace_test.exs test/product_compare/seo_test.exs test/product_compare/alerts/home_relevance_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs test/product_compare/repo/migrations/optimize_homepage_price_reads_test.exs test/product_compare/repo/migrations/cover_homepage_activity_reads_test.exs test/product_compare/repo/migrations/add_commerce_revenue_filter_indexes_test.exs test/product_compare_web/graphql/home_queries_test.exs test/product_compare_web/graphql/home_deal_consistency_test.exs test/product_compare_web/graphql/home_workspace_consistency_test.exs --seed 0
  ```

- [ ] **Step 2: Run repository gates**

  ```bash
  mix test
  mix quality
  mix typecheck
  mix format --check-formatted
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 3: Perform the final anti-slop review**

  Confirm zero `TruthReads` references, zero new pricing module, no range-specific persisted state, no duplicated availability policy, no unused first-seen or median relation, unchanged GraphQL schema/Relay artifacts, no user-owned file in the diff, and no unexplained query-helper delegation layer.

- [ ] **Step 4: Record evidence and commit**

  Update only the lane doc with observed tests, exact query-scope evidence, migration evidence, and any residual concern. Commit it with the final production/test corrections under subject `test: verify homepage query scaling`.
