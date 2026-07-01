# CJ Candidate Market Coverage Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Elixir read model that reports CJ feed-candidate market coverage by country, currency, language, and feed type.

**Architecture:** Build a standalone query module over persisted `merchant_feed_candidates` rows. The read model returns aggregate-only CJ coverage data for later operator or dashboard decisions without adding execution, mutation, GraphQL, or browser surfaces.

**Tech Stack:** Elixir, Ecto, Postgres, ExUnit.

**Status:** retained follow-up. This plan is not a live dispatch row unless `docs/work/index.md` promotes it.

---

## Parallel Ownership

Owned paths:

- Create: `lib/product_compare/ingestion/cj_candidate_market_coverage.ex`
- Create: `test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`
- Modify: `docs/work/product-data-scraping.md` under `### Candidate Market Coverage Evidence` only

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Current Starting Point

- `ProductCompareSchemas.Ingestion.MerchantFeedCandidate` persists `provider`, `provider_feed_id`, `advertiser_country`, `currency`, `language`, `source_feed_type`, `product_count`, `raw_metadata`, `review_status`, and timestamps.
- Valid review statuses are exactly `"pending"`, `"shortlisted"`, and `"dismissed"`.
- `ProductCompare.Ingestion.list_merchant_feed_candidates_query/1` already filters only those string review statuses and ignores unsupported values.
- `ProductCompare.Ingestion.SourceHealth` is the closest read-model pattern: standalone module, aggregate queries, safe map output, focused tests, and lane-doc evidence.

## Scope And Guardrails

- Include only rows where `provider == "cj"`.
- Return total CJ candidate count and total shortlisted CJ candidate count.
- Return bucketed counts for `advertiser_country`, `currency`, `language`, and `source_feed_type`.
- Normalize bucket values by trimming whitespace, uppercasing non-blank values, and mapping nil or blank values to `"unknown"`.
- Support an optional `review_status` filter for `"pending"`, `"shortlisted"`, or `"dismissed"`.
- Ignore nil, blank, atom, or unsupported review-status filters without raising.
- Do not expose `raw_metadata`, raw provider payloads, artifact URLs, import queries, credentials, account IDs, tracking parameters, or provider error payloads.
- Do not mutate candidate rows, call CJ, add a Mix task, add scheduler behavior, add GraphQL fields, add browser routes, or write files from the read model.

## Expected API Shape

Create `ProductCompare.Ingestion.CJCandidateMarketCoverage` with:

```elixir
summary(opts \\ [])
```

Return plain maps with atom keys:

```elixir
%{
  provider: "cj",
  review_status_filter: nil,
  total_candidate_count: 4,
  shortlisted_candidate_count: 1,
  dimensions: %{
    advertiser_country: [
      %{bucket: "US", candidate_count: 2, shortlisted_candidate_count: 1},
      %{bucket: "CA", candidate_count: 1, shortlisted_candidate_count: 0},
      %{bucket: "unknown", candidate_count: 1, shortlisted_candidate_count: 0}
    ],
    currency: [],
    language: [],
    source_feed_type: []
  }
}
```

Bucket rows should include only buckets with at least one matching candidate. Sort each dimension deterministically by `candidate_count` descending, then `bucket` ascending.

When `review_status: "shortlisted"` is passed, every aggregate is computed only from shortlisted CJ rows and `review_status_filter` is `"shortlisted"`. In that case `shortlisted_candidate_count` equals `candidate_count` for every returned bucket.

## Tasks

### Task 1: Red Tests

- [ ] Add `test/product_compare/ingestion/cj_candidate_market_coverage_test.exs` with `use ProductCompare.DataCase, async: true`.
- [ ] Add local `source_fixture/1` and `merchant_feed_candidate_fixture/2` helpers matching existing ingestion tests: insert sources through `Source.changeset/2`, seed candidates through `Ingestion.upsert_merchant_feed_candidate/2`, default candidate values to CJ, and allow per-test overrides.
- [ ] Write `summary/1 returns safe CJ-only coverage buckets`:
  - Two CJ US/USD/EN/SHOPPING rows, one pending and one shortlisted.
  - One CJ CA/CAD/FR/PRODUCT row.
  - One CJ row with nil or blank market fields.
  - One non-CJ row with matching market fields that must not affect counts.
  - Assertions for `total_candidate_count: 4`, `shortlisted_candidate_count: 1`, normalized `"US"`, `"CA"`, and `"unknown"` country buckets, and no sensitive keys in returned maps.
- [ ] Write `summary/1 applies supported review status filters` with pending, shortlisted, and dismissed CJ rows. Assert `summary(review_status: "shortlisted")` returns only shortlisted rows, sets `review_status_filter: "shortlisted"`, and reports matching bucket counts.
- [ ] Write `summary/1 ignores unsupported review status filters` by comparing `summary(review_status: "needs_review")` to `summary([])`.
- [ ] Run:

```bash
mix test test/product_compare/ingestion/cj_candidate_market_coverage_test.exs
```

Expected: failure because `ProductCompare.Ingestion.CJCandidateMarketCoverage` or `summary/1` is undefined.

### Task 2: Read Model Implementation

- [ ] Create `lib/product_compare/ingestion/cj_candidate_market_coverage.ex`.
- [ ] Implement `summary/1` as read-only aggregate queries over `ProductCompareSchemas.Ingestion.MerchantFeedCandidate`, with a base query scoped to `provider == "cj"` and an optional string-only review-status filter.
- [ ] Implement bucket normalization: trim, uppercase, and convert nil or blank values to `"unknown"` for all four dimensions.
- [ ] Compute `shortlisted_candidate_count` using aggregate logic, not by exposing or returning candidate rows.
- [ ] Do not select `raw_metadata`.
- [ ] Run:

```bash
mix test test/product_compare/ingestion/cj_candidate_market_coverage_test.exs
```

Expected: all focused tests pass.

### Task 3: Evidence And Final Gates

- [ ] Update `docs/work/product-data-scraping.md` under `### Candidate Market Coverage Evidence` only.
- [ ] Record:
  - new module and test file.
  - red undefined module/function evidence.
  - green focused test evidence.
  - `mix format --check-formatted`, `mix typecheck`, and `git diff --check` evidence.
  - note that no Mix task, GraphQL/browser route, mutation, network call, raw metadata exposure, or secret exposure was added.
- [ ] Run:

```bash
mix format --check-formatted
mix typecheck
git diff --check
```

Expected: all commands exit 0.

## Commit Guidance

Make one milestone commit after code, tests, and lane-doc evidence are complete:

```bash
git add lib/product_compare/ingestion/cj_candidate_market_coverage.ex test/product_compare/ingestion/cj_candidate_market_coverage_test.exs docs/work/product-data-scraping.md
git commit -m "feat: add CJ candidate market coverage read model"
```

Do not make a standalone docs-only commit for evidence updates.

## Exit Condition

This work item is complete when focused tests prove CJ-only market coverage aggregates, safe bucket normalization, supported review-status filtering, ignored unsupported filters, and display-safe returned maps, with verification evidence recorded in the product data scraping lane doc.
