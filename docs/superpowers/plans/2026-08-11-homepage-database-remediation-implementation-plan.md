# Homepage Database Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make homepage and anonymous-attribution reads bounded, snapshot-consistent, and candidate-scoped without adding performance gates or a second read-model authority.

**Architecture:** Preserve the existing domain contexts and GraphQL connection shapes. Rewrite reads from their presentation-sized candidate pages outward, hydrate only selected offer facts inside the owning transaction, and create the final anonymous-visitor schema directly in the original commerce-attribution migration because the application is unreleased.

**Tech Stack:** Elixir 1.19, Ecto 3.13, PostgreSQL 18, Absinthe, ExUnit, Postgrex, and Oban's existing repository configuration.

## Global Constraints

- Preserve `config/dev.exs` exactly; it is a user-owned unstaged change.
- Do not add `EXPLAIN`, planner-node, timing, buffer, temporary-file, or production-cardinality gates.
- Do not add rolling-median summary tables, materialized homepage read models, or a visitor-retention policy.
- Ordinary behavior, concurrency, migration-contract, and owning-query-shape tests are required and must follow RED/GREEN TDD.
- Keep GraphQL over `/api/graphql`, real Relay connections, the existing Product node identity, and current plain-language response shapes.
- Homepage traversal is capped at 1,000 rows before any SQL executes; full browsing belongs to catalog routes.
- All offer facts selected for one rail must come from the same repeatable-read snapshot as its landed price.
- Do not add per-edge SQL, a generic dashboard module, or a new generic Dataloader source.
- Database constraints remain authoritative. Application preflight reads may optimize writes but never replace uniqueness or foreign keys.
- Preserve unrelated working-tree changes and commit only task-owned files at milestone boundaries.

---

### Task 1: Finalize Anonymous Visitor Schema And Keep Repeat Reads Write-Free

**Files:**

- Modify: `priv/repo/migrations/20260521160000_create_commerce_attribution_core.exs`
- Modify: `lib/product_compare/commerce_attribution/visitors.ex`
- Create: `test/product_compare/repo/migrations/create_commerce_attribution_core_test.exs`
- Modify: `test/product_compare/commerce_attribution/anonymous_visitors_test.exs`
- Modify: `test/support/database_test_helpers.ex`

**Interfaces:**

- Consumes: the original commerce-attribution migration and
  `Visitors.get_or_create/1` callers.
- Produces: the final pre-release schema with `anonymous_visitors`,
  `commerce_click_sessions.anonymous_visitor_id`, owning indexes, foreign key,
  and same-row constraint, plus the unchanged `get_or_create/1` result contract.

- [ ] **Step 1: Add RED fresh-schema migration coverage**

  Apply the original commerce-attribution migration in an empty isolated prefix
  and assert the final contract:

  ```elixir
  assert column_exists?(prefix, "commerce_click_sessions", "anonymous_visitor_id")
  refute column_exists?(prefix, "commerce_click_sessions", "anonymous_id")
  assert constraint_exists?(prefix, "commerce_click_sessions_single_actor")
  assert index_definition(prefix, "commerce_click_sessions_anonymous_visitor_idx") =~
           "(anonymous_visitor_id)"
  ```

  Insert a visitor and click, then prove the foreign key and the single-actor
  check reject invalid direct writes.

- [ ] **Step 2: Run the migration test and confirm RED**

  Run:

  ```bash
  mix test test/product_compare/repo/migrations/create_commerce_attribution_core_test.exs --seed 0
  ```

  Expected: failures show that the original migration still creates
  `anonymous_id` and does not create the final visitor schema directly.

- [ ] **Step 3: Add RED repeat-click query coverage**

  Add a generic `capture_queries/1` helper alongside `capture_select_queries/1`. In `anonymous_visitors_test.exs`, create the visitor once, then capture a second lookup and assert:

  ```elixir
  assert {{:ok, same}, queries} = capture_queries(fn -> Visitors.get_or_create(entropy_id) end)
  assert same.id == first.id
  assert Enum.count(queries, &String.starts_with?(String.trim_leading(&1), "SELECT")) == 1
  refute Enum.any?(queries, &String.starts_with?(String.trim_leading(&1), "INSERT"))
  ```

  Keep the existing concurrent-first-click test unchanged.

- [ ] **Step 4: Run the visitor test and confirm RED**

  Run:

  ```bash
  mix test test/product_compare/commerce_attribution/anonymous_visitors_test.exs --seed 0
  ```

  Expected: the repeat lookup still emits `INSERT ... ON CONFLICT DO NOTHING` before its SELECT.

- [ ] **Step 5: Implement the final pre-release schema**

  Create `anonymous_visitors` before `commerce_click_sessions` in the original
  commerce-attribution migration. Give the click-session table only the final
  `anonymous_visitor_id` foreign key, its lookup index, and the named
  single-actor constraint. Do not keep a later anonymous-visitor migration,
  legacy text column, transition mapping or trigger, backfill, dual-write
  window, or rollback reconstruction. Development databases may be reset.

- [ ] **Step 6: Implement the visitor read fast path**

  Make `Visitors.get_or_create/1`:

  ```elixir
  case Repo.get_by(AnonymousVisitor, entropy_id: entropy_id) do
    %AnonymousVisitor{} = visitor -> {:ok, visitor}
    nil -> insert_or_get(changeset)
  end
  ```

  `insert_or_get/1` keeps `on_conflict: :nothing` and performs the authoritative reread after either insert success or conflict. Invalid UUID changesets still return `{:error, changeset}` without SQL.

- [ ] **Step 7: Run focused GREEN verification**

  Run:

  ```bash
  mix test test/product_compare/repo/migrations/create_commerce_attribution_core_test.exs test/product_compare/commerce_attribution/anonymous_visitors_test.exs test/product_compare_web/plugs/put_anonymous_visitor_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs test/product_compare_web/graphql/commerce_click_test.exs --seed 0
  mix format --check-formatted priv/repo/migrations/20260521160000_create_commerce_attribution_core.exs lib/product_compare/commerce_attribution/visitors.ex test/product_compare/repo/migrations/create_commerce_attribution_core_test.exs test/product_compare/commerce_attribution/anonymous_visitors_test.exs test/support/database_test_helpers.ex
  ```

  Expected: the original migration creates only the final schema; repeat reads
  perform one SELECT; concurrent creation still converges.

- [ ] **Step 8: Commit the visitor milestone**

  ```bash
  git add priv/repo/migrations/20260521160000_create_commerce_attribution_core.exs lib/product_compare/commerce_attribution/visitors.ex test/product_compare/repo/migrations/create_commerce_attribution_core_test.exs test/product_compare/commerce_attribution/anonymous_visitors_test.exs test/support/database_test_helpers.ex
  git commit -m "fix: finalize anonymous visitor schema"
  ```

### Task 2: Make Catalog, SEO, Trending, And Highlight Reads Candidate-Scoped

**Files:**

- Create: `priv/repo/migrations/20260811120000_optimize_homepage_price_reads.exs`
- Modify: `lib/product_compare/catalog/home_workspace.ex`
- Modify: `lib/product_compare/seo/categories.ex`
- Modify: `lib/product_compare/commerce_attribution/trending_activity.ex`
- Modify: `lib/product_compare/specs/reads/current_attributes.ex`
- Modify: `test/product_compare/catalog/home_workspace_test.exs`
- Modify: `test/product_compare/seo_test.exs`
- Modify: `test/product_compare/commerce_attribution/trending_activity_test.exs`
- Modify: `test/product_compare/specs/home_highlights_test.exs`
- Create: `test/product_compare/repo/migrations/optimize_homepage_price_reads_test.exs`

**Interfaces:**

- Consumes: existing public Catalog/SEO/CommerceAttribution/Specs functions.
- Produces: identical result shapes with Product-first workspace eligibility, one offer scope per SEO query, one-row-per-product unordered activity, formatting-only highlight preloads, and a deterministic covering latest-price index.

- [ ] **Step 1: Write focused RED query-contract tests**

  Add tests that assert real behavior plus the owning SQL contract:

  ```elixir
  test "workspace expresses page eligibility as bounded product semi-joins" do
    {_rows, [query]} = capture_select_queries(fn ->
      Catalog.home_workspace_product_candidates(now: @now, limit: 1)
    end)

    assert query =~ ~s(FROM "products")
    assert query =~ "EXISTS"
    refute query =~ ~s(JOIN (SELECT DISTINCT ON)
  end

  test "future click identities do not enter the observed activity window" do
    product = offer_product("future-activity")
    Enum.each(1..5, &click(product, anonymous_actor("future-#{&1}"), 1))
    assert trending_product_ids(now: @now) == []
  end
  ```

  For SEO, capture the homepage shortcut statement and assert only one latest-price `DISTINCT ON` pipeline and no correlated `count(*) >=` specification expression. For highlights, assert the limited homepage read does not SELECT `product_attribute_evidence_links`, `source_artifacts`, or `sources`, while formatted unit and enum values remain correct.

- [ ] **Step 2: Run the domain tests and confirm RED**

  Run:

  ```bash
  mix test test/product_compare/catalog/home_workspace_test.exs test/product_compare/seo_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs test/product_compare/specs/home_highlights_test.exs --seed 0
  ```

  Expected: query-contract and future-click assertions fail on current global DISTINCT/correlated-count/evidence-preload behavior.

- [ ] **Step 3: Write RED migration coverage for the price index**

  Create an isolated-prefix migration test asserting `pg_indexes.indexdef` contains:

  ```text
  (merchant_product_id, observed_at DESC, id DESC) INCLUDE (price, shipping, in_stock)
  ```

  and that `price_points_mp_time_idx` no longer exists after `up/0` but is restored by `down/0`.

- [ ] **Step 4: Run the index migration test and confirm RED**

  Run:

  ```bash
  mix test test/product_compare/repo/migrations/optimize_homepage_price_reads_test.exs --seed 0
  ```

  Expected: compilation fails because the migration does not exist.

- [ ] **Step 5: Implement the physical index migration**

  Disable the migration transaction/lock. Create
  `price_points_home_latest_idx` concurrently with the exact key/include list,
  then drop the superseded index concurrently. `down/0` recreates the old index
  before removing the new one, so a rollback never leaves the access path absent.

- [ ] **Step 6: Rewrite workspace and SEO ownership queries**

  In `HomeWorkspace`, scan Products in existing ID order and use correlated
  `EXISTS` queries for current specifications and an active USD offer whose
  deterministic latest price is in stock, has shipping, and is fresh. The
  latest-price probe orders by `observed_at DESC, id DESC` and limits to one.

  In `Categories`, extract `content_qualified_products_query/1` containing only
  description/media and the bounded second-specification existence predicate.
  Compose canonical reads with the general offer scope once and homepage reads
  with the USD scope once. Replace category `count(DISTINCT product.id)` with
  `count(product.id)` only where the closure/product uniqueness proof applies.

- [ ] **Step 7: Rewrite Trending and limited highlight reads**

  Add the upper `click.inserted_at <= now` bound. Replace the two distinct actor
  aggregates with one filtered composite-row distinct expression and remove
  ordering from `candidates_query/1`; final deal ranking owns ordering. Remove
  the extra candidate DISTINCT in Pricing in Task 3.

  In the limited branch of `CurrentAttributes.current_attributes_query/2`,
  preload only `claim: [:unit, :enum_option]`; leave the unlimited/full-product
  branch unchanged.

- [ ] **Step 8: Run focused GREEN verification**

  Run the Task 2 domain and migration tests together, then:

  ```bash
  mix format --check-formatted priv/repo/migrations/20260811120000_optimize_homepage_price_reads.exs lib/product_compare/catalog/home_workspace.ex lib/product_compare/seo/categories.ex lib/product_compare/commerce_attribution/trending_activity.ex lib/product_compare/specs/reads/current_attributes.ex test/product_compare/catalog/home_workspace_test.exs test/product_compare/seo_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs test/product_compare/specs/home_highlights_test.exs test/product_compare/repo/migrations/optimize_homepage_price_reads_test.exs
  ```

- [ ] **Step 9: Commit the domain-read milestone**

  ```bash
  git add priv/repo/migrations/20260811120000_optimize_homepage_price_reads.exs lib/product_compare/catalog/home_workspace.ex lib/product_compare/seo/categories.ex lib/product_compare/commerce_attribution/trending_activity.ex lib/product_compare/specs/reads/current_attributes.ex test/product_compare/catalog/home_workspace_test.exs test/product_compare/seo_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs test/product_compare/specs/home_highlights_test.exs test/product_compare/repo/migrations/optimize_homepage_price_reads_test.exs
  git commit -m "fix: scope homepage qualification reads"
  ```

### Task 3: Make Offer Ranking Candidate-First And Watch Matching Truthful

**Files:**

- Modify: `lib/product_compare/alerts/home_relevance.ex`
- Modify: `lib/product_compare/pricing.ex`
- Modify: `lib/product_compare/pricing/home_offers.ex`
- Modify: `test/product_compare/alerts/home_relevance_test.exs`
- Modify: `test/product_compare/pricing/home_offers_test.exs`
- Modify: `test/product_compare/commerce_attribution/trending_activity_test.exs`

**Interfaces:**

- Consumes: one-row-per-product activity queries from Task 2 and existing Pricing facade calls.
- Produces: candidate pages without global output-only aggregates plus `Pricing.home_offer_page_facts/3`, which accepts returned offer maps, a `MapSet` of `:active_offer_count | :price_signal`, and `now:` options and returns facts keyed by merchant-product ID.

- [ ] **Step 1: Add RED New/history and page-fact tests**

  Add old offers with many historical price points before one genuinely New offer. Capture the candidate SQL and assert the merchant-product insertion cutoff occurs in the candidate scope before the first-seen aggregate. Add eight New products, request a two-row page, then assert `home_offer_page_facts/3` returns facts only for those two merchant-product IDs.

  Mutation-check the test by temporarily removing the pushed insertion predicate; the focused test must fail before restoring the source.

- [ ] **Step 2: Add RED multiple-watch behavior**

  Seed product-wide targets of 80 and 100 with a current landed price of 90. Assert the For You candidate remains present with `watch_target == 100`. Add listing-specific targets on two merchant products and assert ranking chooses the tightest satisfied target on the matching listing, not the minimum unmatched rule.

- [ ] **Step 3: Run RED tests**

  Run:

  ```bash
  mix test test/product_compare/alerts/home_relevance_test.exs test/product_compare/pricing/home_offers_test.exs --seed 0
  ```

  Expected: the lower grouped watch target suppresses the valid match and New still aggregates history before the cutoff.

- [ ] **Step 4: Preserve watch rows until offer satisfaction**

  Remove `group_by/min(target_amount)` from `HomeRelevance`. Emit one candidate per enabled USD target-price rule. In `viewer_deal_candidates/2`, apply listing/product and landed-price predicates first; its existing product window then orders satisfied rows by target and selects one reason per product. Saved/current candidate precedence remains unchanged.

- [ ] **Step 5: Refactor HomeOffers around candidate and page facts**

  Push the 72-hour `merchant_products.inserted_at` predicate before first-seen
  work. Scope first/latest probes to surviving merchant products. Remove
  `active_counts_query/1` from `winners_query/4`; it is output data, not ranking
  input.

  Add:

  ```elixir
  @spec page_facts([map()], MapSet.t(atom()), keyword()) :: %{optional(pos_integer()) => map()}
  def page_facts(offers, requested_fields, opts)
  ```

  It performs at most one active-count query for page product IDs and one
  price-signal query for page merchant-product IDs, skips unrequested fields,
  and never queries for an empty page. Trending/viewer rows already carrying a
  median derive `price_signal` without a second median query.

  Materialize reused activity/relevance candidates once with named Ecto CTEs.
  Remove `candidate_product_ids_query/1` DISTINCT because Task 2 guarantees one
  grouped row per product. Join Product in each final limited candidate query
  and select it under the `:product` key so the resolver does not issue a later
  hydration statement or cross snapshots. Keep final ranking and tie-break
  order unchanged.

  `summaries/2` selects winners without output-only aggregates, then calls
  `page_facts/3` for its explicit requested field set. Its existing default
  still returns both active count and price signal to direct callers; Task 4
  passes the GraphQL projection explicitly.

- [ ] **Step 6: Expose the page-fact facade**

  Add `Pricing.home_offer_page_facts/3` delegating to
  `HomeOffers.page_facts/3`. Preserve existing public function defaults for
  non-GraphQL callers, but the resolver in Task 4 passes explicit requested
  fields.

- [ ] **Step 7: Run focused GREEN verification**

  Run:

  ```bash
  mix test test/product_compare/alerts/home_relevance_test.exs test/product_compare/pricing/home_offers_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs test/product_compare_web/graphql/home_queries_test.exs --seed 0
  mix format --check-formatted lib/product_compare/alerts/home_relevance.ex lib/product_compare/pricing.ex lib/product_compare/pricing/home_offers.ex test/product_compare/alerts/home_relevance_test.exs test/product_compare/pricing/home_offers_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs
  ```

- [ ] **Step 8: Commit the offer-ranking milestone**

  ```bash
  git add lib/product_compare/alerts/home_relevance.ex lib/product_compare/pricing.ex lib/product_compare/pricing/home_offers.ex test/product_compare/alerts/home_relevance_test.exs test/product_compare/pricing/home_offers_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs
  git commit -m "fix: bound homepage offer ranking"
  ```

### Task 4: Make GraphQL Rails Snapshot-Consistent And Selection-Aware

**Files:**

- Modify: `lib/product_compare/catalog/home_workspace.ex`
- Modify: `lib/product_compare_web/resolvers/home_resolver.ex`
- Modify: `test/product_compare/catalog/home_workspace_test.exs`
- Modify: `test/product_compare_web/graphql/home_queries_test.exs`
- Modify: `test/product_compare_web/graphql/home_deal_consistency_test.exs`
- Modify: `test/product_compare_web/graphql/home_workspace_consistency_test.exs`

**Interfaces:**

- Consumes: Task 3 candidate/page-fact APIs and `Catalog.get_products_by_slugs/1` alias-aware batch resolution.
- Produces: zero-query deep-cursor rejection for every rail, canonical selected products, one repeatable-read snapshot per multi-statement rail, and offer-fact hydration driven by the actual GraphQL selection.

- [ ] **Step 1: Add RED deep-cursor coverage for every public rail**

  Generalize the existing For You deep-cursor test across workspace products,
  workspace categories, New, and Trending. For each field, use the encoded
  offset whose `offset + first + 1` exceeds 1,000 and assert the GraphQL error is
  `invalid cursor` while captured SELECT count is zero.

- [ ] **Step 2: Add RED alias behavior**

  Rename a Product through the Catalog API so its previous slug becomes a
  `product_slug_alias`. Query `homeWorkspace(selectedSlugs: [oldSlug])` and
  signed-in `homeDeals`; assert selected Products use the canonical slug and
  the same Product receives `CURRENT_COMPARISON` relevance.

- [ ] **Step 3: Add RED Trending/viewer concurrency barriers**

  Extend `home_deal_consistency_test.exs` with deterministic barriers after
  candidate selection for Trending and after the viewer preflight. Commit a
  Product deletion or offer/watch deactivation from an unboxed connection,
  release the resolver, and assert the response is internally consistent,
  contains no GraphQL error, and uses fallback only according to the snapshot.

- [ ] **Step 4: Add RED exact-operation optional-fact coverage**

  Execute the checked-in production workspace and deals field selections.
  Capture SELECT SQL and assert:

  ```elixir
  refute Enum.any?(deal_queries, &any_page_fact_median_query?/1)
  refute Enum.any?(deal_queries, &String.contains?(&1, "active_offer_count"))
  refute Enum.any?(workspace_queries, &String.contains?(&1, "active_offer_count"))
  ```

  Add a second operation explicitly selecting both fields and assert their
  existing values remain truthful.

- [ ] **Step 5: Run the RED GraphQL suites**

  Run:

  ```bash
  mix test test/product_compare/catalog/home_workspace_test.exs test/product_compare_web/graphql/home_queries_test.exs test/product_compare_web/graphql/home_deal_consistency_test.exs test/product_compare_web/graphql/home_workspace_consistency_test.exs --seed 0
  ```

  Expected: uncapped rails execute SQL, historical slugs disappear, Trending/viewer cross snapshots, and production operations compute unused facts.

- [ ] **Step 6: Centralize connection validation and field projection**

  Parse `Connection.batch_window_result/1` once, reject windows beyond 1,000,
  then call the row function. Replace the For You-only validator with this
  shared path.

  Add a private recursive projection helper using `Absinthe.Resolution.project/1`
  to collect `home_offer_summary` field identifiers beneath connection edges.
  Convert only `active_offer_count` and `price_signal` into the page-fact
  `MapSet`; aliases and fragments must project correctly. Do not parse raw query
  text or inspect frontend operation names.

- [ ] **Step 7: Resolve aliases and wrap complete rail snapshots**

  Make workspace selection use `Catalog.get_products_by_slugs/1`, preserve
  normalized input order, omit misses, deduplicate by canonical Product ID, and
  return canonical Product records. Reuse that same resolution for viewer
  current-product IDs.

  Wrap workspace categories, Trending, and the complete signed-in viewer flow
  in `Repo.repeatable_read_transaction/2`. Candidate selection, viewer
  classification, fallback, page facts, and Product hydration all remain inside
  the transaction. Replace unsafe `Map.fetch!` assembly with omission only for a
  genuinely absent snapshot row; concurrency tests must still prove the normal
  non-null contract.

- [ ] **Step 8: Hydrate only selected page facts**

  Pass the projection-derived `MapSet` to
  `Pricing.home_offer_page_facts/3` after the lookahead row has been selected and
  before `Connection.from_prefetched_page/2` removes it. Hydrate only the real
  page (`first`, not `first + 1`) while retaining enough candidate data to
  compute `hasNextPage`. Remove unconditional New/fallback signal hydration and
  all separate Product hydration that the final candidate query now owns.

- [ ] **Step 9: Run focused GREEN verification**

  Run the Task 4 RED command again, followed by:

  ```bash
  mix test test/product_compare/pricing/home_offers_test.exs test/product_compare/alerts/home_relevance_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs test/product_compare/seo_test.exs test/product_compare/specs/home_highlights_test.exs test/product_compare_web/graphql/home_queries_test.exs test/product_compare_web/graphql/home_deal_consistency_test.exs test/product_compare_web/graphql/home_workspace_consistency_test.exs --seed 0
  mix format --check-formatted lib/product_compare/catalog/home_workspace.ex lib/product_compare_web/resolvers/home_resolver.ex test/product_compare/catalog/home_workspace_test.exs test/product_compare_web/graphql/home_queries_test.exs test/product_compare_web/graphql/home_deal_consistency_test.exs test/product_compare_web/graphql/home_workspace_consistency_test.exs
  ```

- [ ] **Step 10: Commit the resolver milestone**

  ```bash
  git add lib/product_compare/catalog/home_workspace.ex lib/product_compare_web/resolvers/home_resolver.ex test/product_compare/catalog/home_workspace_test.exs test/product_compare_web/graphql/home_queries_test.exs test/product_compare_web/graphql/home_deal_consistency_test.exs test/product_compare_web/graphql/home_workspace_consistency_test.exs
  git commit -m "fix: keep homepage rails in one snapshot"
  ```

### Task 5: Verify The Integrated Remediation

**Files:**

- Modify: `docs/work/production-ui-system-home.md`
- Test only: all files changed by Tasks 1–4

**Interfaces:**

- Consumes: all prior task commits.
- Produces: repository verification evidence and a concise lane record without new performance gates.

- [ ] **Step 1: Run the complete focused backend suite**

  ```bash
  mix test test/product_compare/repo/migrations/create_commerce_attribution_core_test.exs test/product_compare/repo/migrations/optimize_homepage_price_reads_test.exs test/product_compare/commerce_attribution/anonymous_visitors_test.exs test/product_compare/commerce_attribution/trending_activity_test.exs test/product_compare/catalog/home_workspace_test.exs test/product_compare/seo_test.exs test/product_compare/specs/home_highlights_test.exs test/product_compare/alerts/home_relevance_test.exs test/product_compare/pricing/home_offers_test.exs test/product_compare_web/graphql/home_queries_test.exs test/product_compare_web/graphql/home_deal_consistency_test.exs test/product_compare_web/graphql/home_workspace_consistency_test.exs --seed 0
  ```

- [ ] **Step 2: Run repository verification**

  ```bash
  mix test
  mix quality
  mix typecheck
  mix format --check-formatted
  mix work_queue.validate
  git diff --check
  ```

  These are ordinary repository correctness checks. Do not add or run the
  excluded representative-cardinality performance gates.

- [ ] **Step 3: Update lane evidence**

  Append one dated bullet to `docs/work/production-ui-system-home.md` naming the
  corrected invariants, exact test counts, migration behavior, and verification
  commands. Do not edit coordinator-owned queue/index files.

- [ ] **Step 4: Commit final evidence**

  ```bash
  git add docs/work/production-ui-system-home.md
  git commit -m "docs: record homepage database remediation"
  ```

- [ ] **Step 5: Request final whole-branch review**

  Review the complete plan diff for correctness, query composition,
  over-abstraction, migration safety, and absence of excluded performance
  gates. Any fix wave must rerun the exact affected focused tests before final
  completion.
