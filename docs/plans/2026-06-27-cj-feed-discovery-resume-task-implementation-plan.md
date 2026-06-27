# CJ Feed Discovery Resume Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an operator command that resumes bounded CJ `shoppingProductFeeds` discovery from the latest successful discovery cursor.

**Architecture:** Add a wrapper Mix task around the existing feed discovery runner. The wrapper reads persisted discovery run metadata, derives non-secret query bounds, and uses an injected runner in tests so the task never requires live CJ access during verification.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 ten-plan CJ operator loop parallel batch.

---

## Parallel Ownership

This row may run in parallel with the product-import-resume row because it owns a separate task/test pair and only reads `shoppingProductFeeds` run metadata.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_feeds_resume.ex`
- `test/mix/tasks/product_compare_ingestion_cj_feeds_resume_test.exs`
- `docs/work/product-data-scraping.md` under the feed-discovery-resume evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`
- `lib/product_compare/ingestion/cj_feed_discovery.ex`
- `lib/product_compare/ingestion/cj_feed_discovery_scheduler.ex`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_feeds_resume`.
- Find the latest succeeded CJ `shoppingProductFeeds` `ingestion_runs` row.
- Resume from `cursor_end` and reuse the latest run's `query["advertiserCountry"]`.
- Support `--pages`, `--limit`, and `--require-cursor`.
- Print only aggregate resume fields: `provider`, `surface`, `cursor_start`, `pages_requested`, `limit`, `feeds_fetched`, `candidates_persisted`, `failed`, and `next_cursor`.
- Do not print raw provider payloads, credentials, account IDs, tracking parameters, or raw error text.
- Do not add scheduling, GraphQL, UI, credential persistence, merchant applications, account-manager automation, CSV output, or live CJ calls in tests.

## Task 1: Resume Contract Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_feeds_resume_test.exs`

- [ ] **Step 1: Add failing tests**

Use `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Seed a CJ source and completed `ImportRun` rows for `shoppingProductFeeds`.

Cover:

- `CjFeedsResume.run_resume(runner: runner, pages: 3)` calls the injected runner with `cursor: 80`, `advertiser_country: "US"`, `limit: 25`, and `pages: 3`;
- command output includes `provider=cj surface=shoppingProductFeeds cursor_start=80 pages_requested=3 limit=25 feeds_fetched=4 candidates_persisted=4 failed=0 next_cursor=84`;
- the task ignores product-import rows, failed discovery rows, and older successful discovery rows;
- `--require-cursor` raises `Mix.Error` with `latest successful CJ feed discovery has no cursor to resume` when the latest success has `cursor_end: nil`;
- with no successful discovery run, the task raises `no successful CJ feed discovery run found`;
- output never includes seeded token, account id, tracking, raw metadata, or raw provider payload markers.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_feeds_resume_test.exs
```

Expected: fail because `Mix.Tasks.ProductCompare.Ingestion.CjFeedsResume` does not exist yet.

## Task 2: Resume Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_feeds_resume.ex`

- [ ] **Step 1: Add the task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjFeedsResume` with:

- `use Mix.Task`;
- aliases for `ProductCompare.Ingestion.CJFeedDiscovery`, `ProductCompare.MixTasks.RepoOnlyStartup`, `ProductCompare.Repo`, and `ProductCompareSchemas.Ingestion.ImportRun`;
- `import Ecto.Query`;
- `@shortdoc "Resumes the latest CJ feed discovery cursor"`.

- [ ] **Step 2: Parse options**

Parse:

- `--pages`, integer, default `1`, positive values only;
- `--limit`, integer, optional positive override;
- `--require-cursor`, boolean, default false.

Expose `run_resume/1` for tests with an injected `:runner`, defaulting to `&CJFeedDiscovery.run/1`.

- [ ] **Step 3: Query latest discovery success**

Find the latest successful CJ feed discovery run with provider `cj`, surface `shoppingProductFeeds`, and status `succeeded`, ordered by `finished_at`, `started_at`, and `id` descending.

Raise `Mix.Error` with `no successful CJ feed discovery run found` when absent.

- [ ] **Step 4: Build runner options**

Derive:

- `cursor: latest_run.cursor_end`;
- `advertiser_country: latest_run.query["advertiserCountry"] || "US"`;
- `limit: opts[:limit] || latest_run.page_size || 25`;
- `pages: opts[:pages]`.

If `cursor_end` is `nil` and `require_cursor` is true, raise `Mix.Error` with `latest successful CJ feed discovery has no cursor to resume`. If `cursor_end` is `nil` and `require_cursor` is false, print `resumable=false` and return without calling the runner.

- [ ] **Step 5: Render sanitized output**

For successful runner results, print:

```text
provider=cj surface=shoppingProductFeeds cursor_start=80 pages_requested=3 limit=25 feeds_fetched=4 candidates_persisted=4 failed=0 next_cursor=84
```

For runner failures, raise `Mix.Error` with `CJ feed discovery resume failed` and do not interpolate raw reasons.

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_feeds_resume_test.exs
```

Expected: pass.

- [ ] **Step 2: Run typecheck and diff check**

```bash
mix typecheck
git diff --check
```

Expected: both pass.

- [ ] **Step 3: Commit the slice**

```bash
git add lib/mix/tasks/product_compare.ingestion.cj_feeds_resume.ex test/mix/tasks/product_compare_ingestion_cj_feeds_resume_test.exs docs/work/product-data-scraping.md
git commit -m "feat: resume CJ feed discovery"
```

## Exit Condition

This row is complete when the resume task tests, `mix typecheck`, and `git diff --check` pass, and the lane doc records that the task resumes from persisted non-secret discovery metadata without printing secrets or raw provider errors.
