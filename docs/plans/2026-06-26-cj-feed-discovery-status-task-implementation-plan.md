# CJ Feed Discovery Status Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the operator a non-secret command for checking the latest CJ feed-discovery run and whether a recent successful run exists.

**Architecture:** Add a read-only Mix task that queries existing `ingestion_runs` and `merchant_feed_candidates` rows for provider `cj` and surface `shoppingProductFeeds`. The task prints aggregate status/freshness information only; it does not contact CJ, mutate candidates, schedule work, or expose raw metadata.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-26 scheduled CJ discovery parallel batch.

---

## Parallel Ownership

This row may run in parallel with the scheduled-discovery-runtime and feed-candidate-controls rows.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_discovery_status.ex`
- `test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`
- `docs/work/product-data-scraping.md` under the discovery-status evidence heading only

Do not edit:

- `lib/product_compare/ingestion/cj_feed_discovery.ex`
- `lib/product_compare/ingestion/cj_feed_discovery_scheduler.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`
- `lib/product_compare/application.ex`
- `config/runtime.exs`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_discovery_status`.
- Report the latest CJ `shoppingProductFeeds` `ingestion_runs` row.
- Report the latest successful CJ `shoppingProductFeeds` run and whether it is within `--max-age-hours`.
- Report total persisted CJ feed candidates.
- Support `--require-success` so automation can fail fast when no successful run exists or the latest success is stale.
- Print only non-secret aggregate fields: status, timestamps, page counts, record counts, error summary, and candidate count.
- Do not render `raw_metadata`, provider credentials, account ids, tokens, tracking parameters, or live provider payloads.

## Task 1: Status Contract Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`

- [ ] **Step 1: Add failing tests**

Use `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Cover:

- with no `shoppingProductFeeds` runs, `--require-success` raises with `no successful CJ feed discovery run found`;
- with a failed latest run and an older successful run, the output shows both `latest_status=failed` and `latest_success_status=succeeded`;
- `--max-age-hours 24 --require-success` raises when the latest successful run finished more than 24 hours ago;
- a fresh successful run prints `fresh=true`, `pages_fetched`, `records_fetched`, `records_persisted`, `records_failed`, and `candidate_count`;
- output does not include a raw metadata marker inserted into a candidate.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs
```

Expected: fail because the Mix task does not exist yet.

## Task 2: Read-Only Status Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_discovery_status.ex`

- [ ] **Step 1: Add the task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjDiscoveryStatus` with:

- `use Mix.Task`;
- `import Ecto.Query`;
- aliases for `ProductCompare.Repo`, `ProductCompareSchemas.Ingestion.ImportRun`, and `ProductCompareSchemas.Ingestion.MerchantFeedCandidate`;
- `@shortdoc "Reports CJ feed discovery status"`.

- [ ] **Step 2: Parse options**

Support:

- `--max-age-hours`, integer, default `48`;
- `--require-success`, boolean, default false.

Invalid or non-positive `--max-age-hours` should fall back to the default rather than crashing.

- [ ] **Step 3: Query latest status**

Implement private queries directly in the task:

- latest run where `provider == "cj"` and `surface == "shoppingProductFeeds"`, ordered by newest `started_at`;
- latest successful run with the same provider/surface filters and `status == "succeeded"`;
- candidate count where `MerchantFeedCandidate.provider == "cj"`.

Do not add shared context helpers in this row.

- [ ] **Step 4: Render and enforce freshness**

Render a compact line-oriented report with keys:

- `latest_status`;
- `latest_started_at`;
- `latest_finished_at`;
- `latest_pages_fetched`;
- `latest_records_fetched`;
- `latest_records_persisted`;
- `latest_records_failed`;
- `latest_error_summary`;
- `latest_success_status`;
- `latest_success_finished_at`;
- `fresh`;
- `candidate_count`.

If `--require-success` is present and no successful run exists, call `Mix.raise("no successful CJ feed discovery run found")`.

If `--require-success` is present and the latest success is older than `--max-age-hours`, call `Mix.raise("latest successful CJ feed discovery run is stale")`.

- [ ] **Step 5: Verify the status slice**

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs
mix typecheck
git diff --check
```

Expected: all pass.

- [ ] **Step 6: Commit the status slice**

```bash
git add lib/mix/tasks/product_compare.ingestion.cj_discovery_status.ex test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs docs/work/product-data-scraping.md
git commit -m "feat: report CJ feed discovery status"
```

## Exit Condition

This row is complete when the status task tests, `mix typecheck`, and `git diff --check` pass, and the discovery-status evidence heading in `docs/work/product-data-scraping.md` records the exact commands.
