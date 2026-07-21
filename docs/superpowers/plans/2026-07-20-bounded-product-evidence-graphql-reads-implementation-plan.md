# Bounded Product Evidence GraphQL Reads Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Product offer-truth, review-summary, and SEO database reads fixed
as a GraphQL request grows from one product parent to many.

**Architecture:** Pricing, Discussions, and Specs expose set-based APIs keyed by
product ID. SEO composes those APIs once for the whole product set. A request-
scoped KV Dataloader serves `Product.offerTruth`, `Product.reviewSummary`, and
`Product.seo`; single-product context functions delegate to the same batch
logic so semantics cannot drift.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve OfferTruth freshness, eligibility, currency summaries, and ordering.
- Preserve accepted current-claim selection and published review summaries.
- Preserve SEO qualification, exact metadata shape, and structured-data safety.
- Keep the public GraphQL schema unchanged.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Set-Based Product Evidence APIs

**Files:**

- Modify: `lib/product_compare/pricing.ex`
- Modify: `lib/product_compare/discussions.ex`
- Modify: `lib/product_compare/specs.ex`
- Modify: `test/product_compare/pricing/pricing_test.exs`
- Modify: `test/product_compare/discussions/community_trust_test.exs`
- Modify: `test/product_compare/seo_test.exs`

**Interfaces:**

- Add `Pricing.current_offer_truths([pos_integer()], keyword()) ::
  %{optional(pos_integer()) => map()}`. Load active merchant products for every
  product ID in one query, load latest eligible evidence for all offer IDs in
  one query, group by product ID, and call the existing `OfferTruth` summarizers.
- Make `Pricing.current_offer_truth/2` delegate through
  `current_offer_truths/2` for a valid single ID.
- Add `Discussions.review_summaries([pos_integer()]) ::
  %{optional(pos_integer()) => %{count: non_neg_integer(), average_rating:
  Decimal.t() | nil}}` using one grouped published-review aggregate. Fill
  missing product IDs with the existing zero summary.
- Make `Discussions.review_summary/1` delegate through `review_summaries/1`.
- Add `Specs.list_current_attributes_for_products([pos_integer()]) ::
  %{optional(pos_integer()) => [ProductAttributeCurrent.t()]}` using the same
  joins, preloads, and ordering as the single-product function. Fill missing
  product IDs with empty lists and delegate the single-product function.

- [x] Add failing parity tests for empty input, missing IDs, one product, and
  multiple products with mixed eligible/unobserved offers, accepted claims,
  published/hidden reviews, and zero-review products.
- [x] Run the three focused context suites and confirm the batch APIs are absent.
- [x] Implement one stable `now` for each offer-truth batch and deterministic
  output maps containing every requested valid product ID.
- [x] Delegate existing single-product APIs through the batch implementations.
- [x] Re-run the focused context suites and existing recommendation/SEO tests.
- [x] Commit with message `perf: batch product evidence reads`.

### Task 2: Set-Based SEO Metadata

**Files:**

- Modify: `lib/product_compare/seo.ex`
- Modify: `test/product_compare/seo_test.exs`

**Interfaces:** Add
`Seo.product_metadata_batch([Product.t()], keyword()) ::
%{Product.t() => Seo.metadata()}`. Preload brand/media for the product list in
set-based calls, obtain specification, offer, and review maps from Task 1, and
project metadata with a pure private builder. `Seo.product_metadata/2`
delegates through the batch for one product.

- [x] Add failing tests comparing batch and single-product metadata for
  indexable, non-indexable, missing-offer, missing-specification, zero-review,
  and structured-data cases.
- [x] Run `mix test test/product_compare/seo_test.exs` and confirm the batch API
  is absent.
- [x] Extract the current metadata projection into a query-free private builder
  and compose it from the set-based evidence maps.
- [x] Preserve one exact `now` value for the whole metadata batch.
- [x] Re-run the SEO and acquisition suites.
- [x] Commit with message `perf: batch product seo metadata`.

### Task 3: Request-Scoped Product Evidence Dataloader

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/discussions_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/seo_resolver.ex`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`
- Modify: `test/product_compare_web/graphql/seo_surfaces_test.exs`

**Interfaces:** Add a Loader source identifier such as
`{ProductCompareWeb.GraphQL.Loader, :product_evidence}` backed by
`Dataloader.KV.new/2`. It accepts `:offer_truth`, `:review_summary`, and `:seo`
batch keys, delegates the entire product set to the context APIs, and uses one
stable `DateTime.utc_now/0` value per batch. The three resolvers load their
parent Product through that source and resolve with `on_load/2`.

- [x] Add a failing GraphQL query that requests at least six products with
  `offerTruth`, `reviewSummary`, and `seo`; capture SELECTs and record the
  current per-parent growth.
- [x] Assert exact semantic values for products with and without qualifying
  evidence, not only the query count.
- [x] Prove the relevant product-media, current-claim, review, merchant-product,
  and price-point SELECT budget is identical for three and six parents.
- [x] Register the KV source and route all three resolvers through it.
- [x] Re-run Dataloader, SEO-surface, pricing, and community GraphQL suites.
- [x] Commit with message `perf: bound product evidence graphql reads`.

### Task 4: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-product-evidence-graphql-reads.md`

- [x] Record before/after query counts and semantic regression coverage.
- [x] Run all focused tests named in `docs/work/index.md`.
- [x] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [x] Include lane evidence in the final code/test milestone commit.
