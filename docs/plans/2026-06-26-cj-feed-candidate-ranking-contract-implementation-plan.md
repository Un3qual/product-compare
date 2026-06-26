# CJ Feed Candidate Ranking Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the backend return CJ feed candidates in review-friendly orders and optional review-status slices without adding application automation or scheduled discovery.

**Architecture:** Keep `merchant_feed_candidates` as the source of truth and add query options around fields that already exist: review status, product count, last seen time, and name. Expose the same contract through GraphQL so later browser work can opt into backend ordering without inventing a client-only ranking model.

**Tech Stack:** Elixir, Ecto, Absinthe GraphQL, ExUnit, Relay schema snapshot.

**Status:** ready. This plan is part of the 2026-06-26 parallel CJ candidate planning batch.

---

## Parallel Ownership

This row may run in parallel with the review-workspace and shortlist-export rows.

Owned paths:

- `lib/product_compare/ingestion.ex`
- `lib/product_compare_web/resolvers/ingestion_resolver.ex`
- `lib/product_compare_web/schema.ex`
- `test/product_compare/ingestion/ingestion_test.exs`
- `test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`
- `assets/schema.graphql`
- `docs/work/product-data-scraping.md` under the ranking-contract evidence heading only

Do not edit:

- `assets/src/routes/ingestion/feed-candidates/**`
- `lib/mix/tasks/product_compare.ingestion.cj_candidate_export.ex`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add backend query options for `review_status` and `sort`.
- Supported sort values:
  - `:name_asc`: existing default ordering by advertiser name, feed name, provider feed id, and id.
  - `:product_count_desc`: highest product count first, null product counts last, then name tiebreakers.
  - `:last_seen_desc`: most recently observed candidates first, then name tiebreakers.
- Add GraphQL enum `MerchantFeedCandidateSort` and args `reviewStatus` and `sort` to `merchantFeedCandidates`.
- Preserve the existing zero-arity `Ingestion.list_merchant_feed_candidates_query/0` behavior.
- Do not persist a score, add application states, run CJ network calls, or schedule jobs.

## Task 1: Context Query Options

**Files:**

- Modify: `lib/product_compare/ingestion.ex`
- Modify: `test/product_compare/ingestion/ingestion_test.exs`

- [ ] **Step 1: Add failing context coverage**

Add tests under `describe "merchant feed candidates"` proving:

- the zero-arity query keeps the current name/feed/provider/id ordering;
- `Ingestion.list_merchant_feed_candidates_query(review_status: "shortlisted", sort: :product_count_desc)` returns only shortlisted candidates, ordered by descending product count with nil product counts last;
- `sort: :last_seen_desc` orders by newest `last_seen_at` first with stable name/feed/provider/id tiebreakers;
- an unknown sort falls back to `:name_asc`.

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs
```

Expected: fail because the query helper does not accept options yet.

- [ ] **Step 2: Implement query options**

Change `list_merchant_feed_candidates_query/0` to delegate to `list_merchant_feed_candidates_query/1`:

```elixir
@spec list_merchant_feed_candidates_query(keyword() | map()) :: Ecto.Query.t()
def list_merchant_feed_candidates_query(opts \\ []) do
  opts = Map.new(opts)

  MerchantFeedCandidate
  |> maybe_filter_candidate_review_status(Map.get(opts, :review_status))
  |> order_merchant_feed_candidates(Map.get(opts, :sort, :name_asc))
end
```

Use private helpers that keep the tiebreakers explicit:

```elixir
defp maybe_filter_candidate_review_status(query, status) when status in ["pending", "shortlisted", "dismissed"],
  do: where(query, [candidate], candidate.review_status == ^status)

defp maybe_filter_candidate_review_status(query, _status), do: query

defp order_merchant_feed_candidates(query, :product_count_desc) do
  order_by(query, [candidate],
    desc_nulls_last: candidate.product_count,
    asc: candidate.advertiser_name,
    asc: candidate.feed_name,
    asc: candidate.provider_feed_id,
    asc: candidate.id
  )
end

defp order_merchant_feed_candidates(query, :last_seen_desc) do
  order_by(query, [candidate],
    desc: candidate.last_seen_at,
    asc: candidate.advertiser_name,
    asc: candidate.feed_name,
    asc: candidate.provider_feed_id,
    asc: candidate.id
  )
end

defp order_merchant_feed_candidates(query, _sort) do
  order_by(query, [candidate],
    asc: candidate.advertiser_name,
    asc: candidate.feed_name,
    asc: candidate.provider_feed_id,
    asc: candidate.id
  )
end
```

If `desc_nulls_last` is not supported by the configured Ecto/Postgres version, use an `is_nil(candidate.product_count)` ascending expression followed by `desc: candidate.product_count`.

- [ ] **Step 3: Verify context slice**

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs
```

Expected: pass.

- [ ] **Step 4: Commit context slice**

```bash
git add lib/product_compare/ingestion.ex test/product_compare/ingestion/ingestion_test.exs
git commit -m "feat: add CJ feed candidate ranking query options"
```

## Task 2: GraphQL Query Args

**Files:**

- Modify: `lib/product_compare_web/resolvers/ingestion_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`
- Modify: `assets/schema.graphql`

- [ ] **Step 1: Add failing GraphQL coverage**

Extend `merchant_feed_candidate_queries_test.exs` with a query shaped like:

```graphql
query MerchantFeedCandidates(
  $first: Int
  $reviewStatus: MerchantFeedCandidateReviewStatus
  $sort: MerchantFeedCandidateSort
) {
  merchantFeedCandidates(first: $first, reviewStatus: $reviewStatus, sort: $sort) {
    edges {
      node {
        advertiserName
        productCount
        reviewStatus
      }
    }
  }
}
```

Assert that `reviewStatus: SHORTLISTED, sort: PRODUCT_COUNT_DESC` returns only shortlisted candidates in descending product-count order.

Run:

```bash
mix test test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
```

Expected: fail because the GraphQL args and sort enum do not exist yet.

- [ ] **Step 2: Add schema enum and args**

In `lib/product_compare_web/schema.ex`, add:

```elixir
enum :merchant_feed_candidate_sort do
  value(:name_asc, as: :name_asc)
  value(:product_count_desc, as: :product_count_desc)
  value(:last_seen_desc, as: :last_seen_desc)
end
```

Add args to `field :merchant_feed_candidates`:

```elixir
arg(:review_status, :merchant_feed_candidate_review_status)
arg(:sort, :merchant_feed_candidate_sort)
```

- [ ] **Step 3: Pass normalized args to the context**

In `ProductCompareWeb.Resolvers.IngestionResolver.merchant_feed_candidates/3`, keep connection args separate from filter/sort args:

```elixir
query_opts = [
  review_status: normalize_review_status(Input.fetch_value(args, :review_status)),
  sort: Input.fetch_value(args, :sort, :name_asc)
]

Ingestion.list_merchant_feed_candidates_query(query_opts)
|> Connection.from_query_result(Input.connection_args(args), Repo)
```

Reuse the existing `normalize_review_status/1` helper so GraphQL enum atoms become lowercase persisted status strings.

- [ ] **Step 4: Refresh Relay schema snapshot**

Update `assets/schema.graphql` to mirror the Absinthe contract:

```graphql
type Query {
  merchantFeedCandidates(
    first: Int
    after: String
    reviewStatus: MerchantFeedCandidateReviewStatus
    sort: MerchantFeedCandidateSort
  ): MerchantFeedCandidateConnection
}

enum MerchantFeedCandidateSort {
  NAME_ASC
  PRODUCT_COUNT_DESC
  LAST_SEEN_DESC
}
```

Do not add browser route changes in this plan.

- [ ] **Step 5: Verify backend and schema slice**

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
cd assets && bun run relay
mix typecheck
git diff --check
```

Expected: all pass.

- [ ] **Step 6: Commit GraphQL slice**

```bash
git add lib/product_compare_web/resolvers/ingestion_resolver.ex lib/product_compare_web/schema.ex test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs assets/schema.graphql docs/work/product-data-scraping.md
git commit -m "feat: expose CJ feed candidate ranking filters"
```

## Exit Condition

This row is complete when the context tests, GraphQL tests, Relay compiler, typecheck, and diff check pass, and the ranking-contract evidence heading in `docs/work/product-data-scraping.md` records the exact commands.
