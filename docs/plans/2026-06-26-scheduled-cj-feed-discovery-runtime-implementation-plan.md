# Scheduled CJ Feed Discovery Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run bounded CJ `shoppingProductFeeds` discovery on a disabled-by-default schedule without adding provider credential storage or merchant application automation.

**Architecture:** Extract the current manual feed-discovery body into a reusable `ProductCompare.Ingestion.CJFeedDiscovery` runner, keep the existing Mix task as a CLI wrapper, and add a small OTP scheduler that calls the runner only when runtime env explicitly enables it. CJ credentials remain read by the existing CJ client through `System.get_env/1`; runtime schedule config stores only non-secret cadence and query bounds.

**Tech Stack:** Elixir, OTP `GenServer`, Phoenix application supervision, Ecto, ExUnit, Mix tasks.

**Status:** ready. This plan is part of the 2026-06-26 scheduled CJ discovery parallel batch.

---

## Parallel Ownership

This row may run in parallel with the discovery-status and feed-candidate-controls rows.

Owned paths:

- `lib/product_compare/ingestion/cj_feed_discovery.ex`
- `lib/product_compare/ingestion/cj_feed_discovery_scheduler.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`
- `lib/product_compare/application.ex`
- `config/runtime.exs`
- `test/product_compare/ingestion/cj_feed_discovery_test.exs`
- `test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`
- `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`
- `docs/work/product-data-scraping.md` under the scheduled-discovery runtime evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_discovery_status.ex`
- `test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`
- `assets/src/routes/ingestion/feed-candidates/**`
- `assets/test/routes/ingestion/feed-candidates/**`
- `assets/src/__generated__/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Schedule only CJ `shoppingProductFeeds` discovery.
- Keep the schedule disabled unless `CJ_FEED_DISCOVERY_SCHEDULE_ENABLED` is truthy.
- Bound every run with `limit`, `pages`, `advertiser_country`, and interval options.
- Preserve the existing manual `mix product_compare.ingestion.cj_feeds` behavior and output.
- Use the existing CJ client env lookup for credentials; do not add credential config, credential persistence, account ids in docs, or raw provider metadata exposure.
- Do not add Oban, broad polling, merchant application submission, account-manager automation, product import scheduling, or Tier-3 scraping.

## Task 1: Reusable Discovery Runner

**Files:**

- Create: `lib/product_compare/ingestion/cj_feed_discovery.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`
- Create: `test/product_compare/ingestion/cj_feed_discovery_test.exs`
- Modify: `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`

- [ ] **Step 1: Move task-level discovery tests to the runner**

Create `ProductCompare.Ingestion.CJFeedDiscoveryTest` by moving the existing `run_discovery/1` behavior coverage from `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`.

Keep coverage for:

- fetching one page and persisting one `MerchantFeedCandidate`;
- recording a succeeded `ImportRun`;
- recording partial counts when a later page fails;
- clamping invalid `pages` to one page;
- reusing the existing CJ `Source`;
- returning `{:error, {:row_failures, report}}` when fetched feeds fail candidate persistence.

Run:

```bash
mix test test/product_compare/ingestion/cj_feed_discovery_test.exs
```

Expected: fail because `ProductCompare.Ingestion.CJFeedDiscovery` does not exist yet.

- [ ] **Step 2: Extract the runner**

Move the current private discovery flow from `Mix.Tasks.ProductCompare.Ingestion.CjFeeds` into `ProductCompare.Ingestion.CJFeedDiscovery.run/1`.

The runner should:

- accept the existing injected `:fetcher`, `:advertiser_country`, `:limit`, `:pages`, and `:cursor` options;
- call `ProductCompare.Ingestion.Sources.CJ.SourceResolver.fetch_source/0`;
- start and complete `ingestion_runs` rows with `surface: "shoppingProductFeeds"`;
- upsert feed candidates through `ProductCompare.Ingestion.upsert_merchant_feed_candidate/2`;
- return the existing report map without printing.

- [ ] **Step 3: Keep the Mix task as a wrapper**

Update `Mix.Tasks.ProductCompare.Ingestion.CjFeeds` so `run/1` still:

- starts the app;
- parses `--advertiser-country`, `--limit`, `--offset`, and `--pages`;
- calls `ProductCompare.Ingestion.CJFeedDiscovery.run/1`;
- prints `feeds_fetched=... candidates_persisted=... pages_fetched=... failed=...`;
- raises on `{:error, reason}` with the existing failure wording.

Leave focused wrapper coverage in `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs` proving CLI parsing, stdout, and failure raising still work.

- [ ] **Step 4: Verify the extraction**

Run:

```bash
mix test test/product_compare/ingestion/cj_feed_discovery_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs
```

Expected: pass.

## Task 2: Disabled-By-Default Scheduler

**Files:**

- Create: `lib/product_compare/ingestion/cj_feed_discovery_scheduler.ex`
- Modify: `lib/product_compare/application.ex`
- Modify: `config/runtime.exs`
- Create: `test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`

- [ ] **Step 1: Add failing scheduler tests**

Create tests that start the scheduler directly with an injected runner function.

Cover:

- a scheduler started with `initial_delay_ms: 0` calls the runner once with normalized discovery options;
- after a successful run, it schedules the next run using `interval_ms`;
- after a failed run, it still schedules the next run;
- the runner options include only non-secret fields: `advertiser_country`, `limit`, `pages`, and `cursor`.

Run:

```bash
mix test test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs
```

Expected: fail because the scheduler module does not exist yet.

- [ ] **Step 2: Implement the scheduler**

Create `ProductCompare.Ingestion.CJFeedDiscoveryScheduler` as a `GenServer`.

Behavior:

- `start_link/1` accepts `:name`, `:runner`, `:initial_delay_ms`, `:interval_ms`, `:advertiser_country`, `:limit`, `:pages`, and `:cursor`;
- default `:runner` is `&ProductCompare.Ingestion.CJFeedDiscovery.run/1`;
- `init/1` sends itself `:run_discovery` after `initial_delay_ms`;
- `handle_info(:run_discovery, state)` calls the runner, logs aggregate success or failure without secrets, schedules the next run after `interval_ms`, and returns `{:noreply, state}`;
- the scheduler does not persist credentials, store raw provider records, or print account ids.

- [ ] **Step 3: Wire runtime config and supervision**

In `config/runtime.exs`, add non-secret schedule config from env:

- `CJ_FEED_DISCOVERY_SCHEDULE_ENABLED`, default false;
- `CJ_FEED_DISCOVERY_INTERVAL_MINUTES`, default `1440`;
- `CJ_FEED_DISCOVERY_INITIAL_DELAY_MS`, default `60000`;
- `CJ_FEED_DISCOVERY_ADVERTISER_COUNTRY`, default `US`;
- `CJ_FEED_DISCOVERY_LIMIT`, default `25`;
- `CJ_FEED_DISCOVERY_PAGES`, default `1`.

In `ProductCompare.Application`, append the scheduler child only when the runtime config has `enabled: true`. Convert minutes to milliseconds in application or scheduler setup, and keep the child absent by default in dev, test, and prod unless the env var opts in.

- [ ] **Step 4: Verify the runtime slice**

Run:

```bash
mix test test/product_compare/ingestion/cj_feed_discovery_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs
mix typecheck
git diff --check
```

Expected: all pass.

- [ ] **Step 5: Commit the runtime slice**

```bash
git add lib/product_compare/ingestion/cj_feed_discovery.ex lib/product_compare/ingestion/cj_feed_discovery_scheduler.ex lib/mix/tasks/product_compare.ingestion.cj_feeds.ex lib/product_compare/application.ex config/runtime.exs test/product_compare/ingestion/cj_feed_discovery_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs docs/work/product-data-scraping.md
git commit -m "feat: schedule CJ feed discovery"
```

## Exit Condition

This row is complete when the runner tests, scheduler tests, existing CJ feeds Mix task tests, `mix typecheck`, and `git diff --check` pass, and the scheduled-discovery runtime evidence heading in `docs/work/product-data-scraping.md` records the exact commands.
