# CJ Feed Candidate Fit Score Sort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let backend and GraphQL callers rank captured CJ feed candidates by a deterministic, non-secret fit score.

**Architecture:** Keep the fit score derived from existing `merchant_feed_candidates` fields and do not persist it. Add one backend sort option that orders by the documented score expression, then by stable existing tiebreakers, and expose that sort through the existing `merchantFeedCandidates` GraphQL field.

**Tech Stack:** Elixir, Ecto, Absinthe GraphQL, ExUnit, Relay schema snapshot.

**Status:** ready. This plan is part of the 2026-06-26 broader CJ candidate scoring parallel batch.

---

## Parallel Ownership

This row may run in parallel with the score-export and frontend-score-badges rows.

Owned paths:

- `lib/product_compare/ingestion.ex`
- `lib/product_compare_web/resolvers/ingestion_resolver.ex`
- `lib/product_compare_web/schema.ex`
- `test/product_compare/ingestion/ingestion_test.exs`
- `test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`
- `assets/schema.graphql`
- `docs/work/product-data-scraping.md` under the fit-score-sort evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_candidate_export.ex`
- `test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs`
- `assets/src/routes/ingestion/feed-candidates/**`
- `assets/src/__generated__/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add one sort value:
  - context atom: `:fit_score_desc`;
  - GraphQL enum value: `FIT_SCORE_DESC`;
  - schema SDL enum value: `FIT_SCORE_DESC`.
- Score only from already captured, review-safe fields:
  - product count: `>= 10000` gives 50 points, `>= 1000` gives 35 points, `>= 100` gives 20 points, `> 0` gives 10 points, otherwise 0;
  - `advertiser_country == "US"` gives 20 points after uppercase normalization;
  - `currency == "USD"` gives 15 points after uppercase normalization;
  - `language == "EN"` gives 10 points after uppercase normalization;
  - any non-empty `source_feed_type` gives 5 points.
- Keep the maximum score at 100 and do not expose raw metadata.
- Tiebreakers for equal score: `last_seen_at` descending, advertiser name ascending, feed name ascending, provider feed id ascending, id ascending.
- Preserve existing `:name_asc`, `:product_count_desc`, and `:last_seen_desc` behavior.
- Do not add frontend UI, CSV output, credential config, product import scheduling, merchant application automation, live CJ calls, or Tier-3 scraping.

## Task 1: Context Fit Score Ordering

**Files:**

- Modify: `lib/product_compare/ingestion.ex`
- Modify: `test/product_compare/ingestion/ingestion_test.exs`

- [ ] **Step 1: Add failing context coverage**

Add a test under `describe "merchant feed candidates"` proving `Ingestion.list_merchant_feed_candidates_query(sort: :fit_score_desc)` returns candidates in score order.

Use fixtures shaped so the expected scores are unambiguous:

- "Trail Merchant": `product_count: 5000`, `advertiser_country: "US"`, `currency: "USD"`, `language: "EN"`, `source_feed_type: "PRODUCT"` -> 85 points.
- "Global Merchant": `product_count: 20000`, `advertiser_country: "CA"`, `currency: "CAD"`, `language: "EN"`, `source_feed_type: "PRODUCT"` -> 65 points.
- "Budget Merchant": `product_count: 500`, `advertiser_country: "US"`, `currency: "USD"`, `language: nil`, `source_feed_type: nil` -> 55 points.
- "Unknown Merchant": `product_count: nil`, `advertiser_country: "US"`, `currency: "USD"`, `language: "EN"`, `source_feed_type: nil` -> 45 points.

Also add a same-score tie pair and assert `last_seen_at` descending wins before name/provider tiebreakers.

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs
```

Expected: fail because `:fit_score_desc` falls back to name ordering.

- [ ] **Step 2: Implement score ordering**

In `ProductCompare.Ingestion`, add a private ordering branch:

```elixir
defp order_merchant_feed_candidates(query, :fit_score_desc) do
  order_by(query, [candidate],
    desc: fragment(
      """
      (CASE
        WHEN ? >= 10000 THEN 50
        WHEN ? >= 1000 THEN 35
        WHEN ? >= 100 THEN 20
        WHEN ? > 0 THEN 10
        ELSE 0
      END) +
      (CASE WHEN upper(coalesce(?, '')) = 'US' THEN 20 ELSE 0 END) +
      (CASE WHEN upper(coalesce(?, '')) = 'USD' THEN 15 ELSE 0 END) +
      (CASE WHEN upper(coalesce(?, '')) = 'EN' THEN 10 ELSE 0 END) +
      (CASE WHEN coalesce(?, '') != '' THEN 5 ELSE 0 END)
      """,
      candidate.product_count,
      candidate.product_count,
      candidate.product_count,
      candidate.product_count,
      candidate.advertiser_country,
      candidate.currency,
      candidate.language,
      candidate.source_feed_type
    ),
    desc: candidate.last_seen_at,
    asc: candidate.advertiser_name,
    asc: candidate.feed_name,
    asc: candidate.provider_feed_id,
    asc: candidate.id
  )
end
```

Keep the existing sort branches unchanged.

- [ ] **Step 3: Verify context slice**

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs
```

Expected: pass.

## Task 2: GraphQL Sort Contract

**Files:**

- Modify: `lib/product_compare_web/schema.ex`
- Modify: `test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`
- Modify: `assets/schema.graphql`

- [ ] **Step 1: Add failing GraphQL coverage**

Extend `merchant_feed_candidate_queries_test.exs` with `sort: FIT_SCORE_DESC` coverage for `merchantFeedCandidates`.

Use a query shaped like:

```graphql
query MerchantFeedCandidates($first: Int, $sort: MerchantFeedCandidateSort) {
  merchantFeedCandidates(first: $first, sort: $sort) {
    edges {
      node {
        advertiserName
        productCount
      }
    }
  }
}
```

Assert the returned names follow the same score order from Task 1.

Run:

```bash
mix test test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
```

Expected: fail because `FIT_SCORE_DESC` is not in `MerchantFeedCandidateSort`.

- [ ] **Step 2: Add the enum value**

In `lib/product_compare_web/schema.ex`, extend `enum :merchant_feed_candidate_sort` with:

```elixir
value(:fit_score_desc, as: :fit_score_desc)
```

The resolver already passes the enum atom through `Input.fetch_value(args, :sort, :name_asc)`, so no resolver change should be needed unless tests show the value is not reaching the context.

- [ ] **Step 3: Refresh the frontend schema snapshot**

Update `assets/schema.graphql` so `enum MerchantFeedCandidateSort` includes:

```graphql
FIT_SCORE_DESC
```

Do not regenerate or edit Relay operation artifacts in this row because no frontend query uses the new enum yet.

- [ ] **Step 4: Verify the backend contract**

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
cd assets && bun run relay
mix typecheck
git diff --check
```

Expected: all pass.

- [ ] **Step 5: Commit the backend score sort slice**

```bash
git add lib/product_compare/ingestion.ex lib/product_compare_web/schema.ex test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs assets/schema.graphql docs/work/product-data-scraping.md
git commit -m "feat: rank CJ feed candidates by fit score"
```

## Exit Condition

This row is complete when the context tests, GraphQL tests, Relay compiler check, `mix typecheck`, and `git diff --check` pass, and the fit-score-sort evidence heading in `docs/work/product-data-scraping.md` records the exact commands.
