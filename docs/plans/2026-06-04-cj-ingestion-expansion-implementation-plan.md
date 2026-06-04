# CJ Ingestion Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the verified manual CJ connector with durable import observability, feed discovery, and bounded multi-page manual imports.

**Architecture:** Keep the connector manual and env-var-backed. Add one source-scoped `ingestion_runs` table for import/discovery run metadata, extend the CJ client with `shoppingProductFeeds`, and update Mix tasks to record run counts without storing credentials or raw live payloads outside existing source artifacts.

**Tech Stack:** Elixir, Ecto migrations/schemas, Mix tasks, CJ GraphQL via the existing `ProductCompare.Ingestion.Sources.CJ.Client`, ExUnit, existing source-agnostic persistence APIs.

---

## Scope

- Add durable import/discovery run metadata.
- Add manual `shoppingProductFeeds` discovery.
- Add bounded manual pagination to the existing CJ import task.
- Keep scheduled polling, Oban jobs, background workers, account automation, and Tier-3 direct scraping out of scope.

## Task 1: Import Run Observability

**Files:**
- Create: `priv/repo/migrations/20260604191000_create_ingestion_runs.exs`
- Create: `lib/product_compare_schemas/ingestion/import_run.ex`
- Modify: `lib/product_compare/ingestion.ex`
- Modify: `test/product_compare/ingestion/ingestion_test.exs`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- Modify: `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`

- [x] **Step 1: Write failing run lifecycle tests**

Add tests for `Ingestion.start_import_run/1` and `Ingestion.complete_import_run/2` that create a `Source`, start a `shoppingProducts` run with non-secret query metadata, then complete it with status/count/cursor fields.

Run: `mix test test/product_compare/ingestion/ingestion_test.exs`

Expected: fail because the schema/table/context functions do not exist.

- [x] **Step 2: Add migration, schema, and context helpers**

Create `ingestion_runs` with `source_id`, `provider`, `surface`, `query`, `status`, `started_at`, `finished_at`, cursor/page fields, record count fields, and `error_summary`. Add `ProductCompareSchemas.Ingestion.ImportRun` and context helpers.

Run: `mix test test/product_compare/ingestion/ingestion_test.exs`

Expected: pass.

- [x] **Step 3: Record runs in the CJ import task**

Update `CjImport.run_import/1` to create one run before fetching and complete it after persistence with fetched/normalized/persisted/failed counts.

Run: `mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs`

Expected: pass and assert one completed `ingestion_runs` row.

## Task 2: CJ Feed Discovery

**Files:**
- Modify: `lib/product_compare/ingestion/sources/cj/client.ex`
- Modify: `test/product_compare/ingestion/sources/cj/client_test.exs`
- Create: `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`
- Create: `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`

- [x] **Step 1: Write failing feed client tests**

Add tests for `Client.fetch_feeds/2` that assert a `shoppingProductFeeds` GraphQL request and response decoding with injected transport.

Run: `mix test test/product_compare/ingestion/sources/cj/client_test.exs`

Expected: fail because `fetch_feeds/2` does not exist.

- [x] **Step 2: Implement feed discovery client support**

Add `fetch_feeds/2` to the CJ client using `shoppingProductFeeds(companyId, limit, offset, advertiserCountry)`.

Run: `mix test test/product_compare/ingestion/sources/cj/client_test.exs`

Expected: pass.

- [x] **Step 3: Add manual feed discovery task**

Create `mix product_compare.ingestion.cj_feeds` with `--limit`, `--offset`, `--pages`, and `--advertiser-country`. It should fetch bounded feed pages, record an `ingestion_runs` row with surface `shoppingProductFeeds`, and print count totals only.

Run: `mix test test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`

Expected: pass.

## Task 3: Bounded Manual Pagination

**Files:**
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- Modify: `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`
- Modify: `docs/work/product-data-scraping.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `docs/plans/2026-06-04-cj-ingestion-expansion-implementation-plan.md`

- [x] **Step 1: Write failing pagination task test**

Add a task test where the injected fetcher returns page 1 with `next_cursor = 1`, page 2 with `next_cursor = nil`, and `run_import(pages: 2)` persists both records while recording `pages_fetched = 2`.

Run: `mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs`

Expected: fail while the task fetches only one page.

- [x] **Step 2: Implement bounded pagination**

Add `--pages` parsing and loop while both `next_cursor` exists and the requested page limit has not been reached.

Run: `mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs`

Expected: pass.

- [x] **Step 3: Verify and close**

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/client_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs
mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs
mix typecheck
git diff --check
```

Expected: all commands pass. Then run one live feed discovery and one bounded live import with `.env.local` loaded, record non-secret counts in the lane doc, and close the queue if successful.
