# CJ Feed Candidate Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist manual CJ `shoppingProductFeeds` discovery results as source-scoped merchant/feed candidates for later merchant review and scoring.

**Architecture:** Add a small `merchant_feed_candidates` ingestion table keyed by `source_id` and provider feed id. Keep persistence source-scoped and idempotent, with no credential storage, no scheduled polling, and no account automation. The existing manual `cj_feeds` Mix task will normalize discovered feed metadata into candidate rows while continuing to record `ingestion_runs`.

**Tech Stack:** Elixir, Ecto migrations/schemas, `ProductCompare.Ingestion`, CJ GraphQL feed discovery task, ExUnit.

---

## Scope

- Capture CJ feed metadata returned by manual `shoppingProductFeeds` discovery.
- Store only non-secret feed and merchant metadata: provider, provider feed id, advertiser id/name/country, source feed type, currency, language, feed name, product count, provider last updated timestamp, and raw metadata subset.
- Keep records idempotent by source and provider feed id.
- Keep scheduled polling, review UI, merchant scoring, application automation, and credential configuration out of scope.

## Task 1: Candidate Persistence

**Files:**
- Create: `priv/repo/migrations/20260604210000_create_merchant_feed_candidates.exs`
- Create: `lib/product_compare_schemas/ingestion/merchant_feed_candidate.ex`
- Modify: `lib/product_compare/ingestion.ex`
- Modify: `test/product_compare/ingestion/ingestion_test.exs`

- [x] **Step 1: Write failing candidate persistence tests**

Add tests for `Ingestion.upsert_merchant_feed_candidate/2` and `Ingestion.list_merchant_feed_candidates/1` that create a CJ source, persist one candidate, then replay the same provider feed id with updated feed metadata.

Run: `mix test test/product_compare/ingestion/ingestion_test.exs`

Expected: fail because the schema/table/context functions do not exist.

- [x] **Step 2: Add migration, schema, and context helpers**

Create `merchant_feed_candidates` and `ProductCompareSchemas.Ingestion.MerchantFeedCandidate`. Implement idempotent upsert and source-filtered list helpers in `ProductCompare.Ingestion`.

Run: `mix test test/product_compare/ingestion/ingestion_test.exs`

Expected: pass.

## Task 2: Manual CJ Feed Task Persistence

**Files:**
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`
- Modify: `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`

- [x] **Step 1: Write failing task persistence test**

Extend the `CjFeeds.run_discovery/1` test so an injected feed result creates one `MerchantFeedCandidate` row and the task report includes `candidates_persisted`.

Run: `mix test test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`

Expected: fail because the task does not persist candidates.

- [x] **Step 2: Persist candidates in the manual task**

Map each fetched feed into `Ingestion.upsert_merchant_feed_candidate/2`, count successful writes, record the persisted count on the `ingestion_runs` row, and print only aggregate counts.

Run: `mix test test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`

Expected: pass.

## Task 3: Verify and Close

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs
mix test test/product_compare/ingestion/sources/cj/client_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs
mix typecheck
git diff --check
```

Then run one live manual feed discovery with `.env.local` loaded and record only aggregate candidate counts in `docs/work/product-data-scraping.md`.
