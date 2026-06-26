# Scheduled CJ Product Import Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run bounded CJ `shoppingProducts` imports on a disabled-by-default runtime schedule after credential readiness is in place.

**Architecture:** Add a small OTP scheduler that calls the existing manual CJ import runner with normalized non-secret options. Keep scheduling disabled unless runtime env opts in, and test scheduler behavior with an injected runner so local verification never contacts CJ.

**Tech Stack:** Elixir, OTP `GenServer`, Phoenix application supervision, runtime config, ExUnit.

**Status:** deferred. Do not promote until the current CJ provider credential readiness row is complete and the coordinator chooses product import scheduling.

---

## Parallel Ownership

This plan should run after the credential preflight batch. It can run in parallel with the CJ product import status task after promotion because it owns scheduler/runtime files and does not edit the status task.

Owned paths:

- `lib/product_compare/ingestion/cj_product_import_scheduler.ex`
- `test/product_compare/ingestion/cj_product_import_scheduler_test.exs`
- `lib/product_compare/application.ex`
- `config/runtime.exs`
- `docs/work/product-data-scraping.md` under a future scheduled-product-import evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_import_status.ex`
- `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`
- `test/mix/tasks/product_compare_ingestion_cj_import_status_test.exs`
- `lib/product_compare/ingestion/sources/cj/client.ex`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Schedule only CJ `shoppingProducts` imports.
- Keep the scheduler absent from supervision unless `CJ_PRODUCT_IMPORT_SCHEDULE_ENABLED` is truthy.
- Bound every run with keywords, currency, serviceable area, page limit, page size, and interval options.
- Use existing manual import behavior through `Mix.Tasks.ProductCompare.Ingestion.CjImport.run_import/1` or an injected runner.
- Pass only non-secret options to the runner.
- Log aggregate success/failure without raw provider errors, credentials, account ids, tokens, tracking parameters, or payload bodies.
- Do not add Oban, direct live calls in tests, merchant applications, account-manager automation, UI, GraphQL, credential persistence, or CSV output.

## Task 1: Scheduler Tests

**Files:**

- Create: `test/product_compare/ingestion/cj_product_import_scheduler_test.exs`

- [ ] **Step 1: Add failing scheduler tests**

Use `ExUnit.Case, async: true` and `ExUnit.CaptureLog`.

Cover:

- a scheduler started with `initial_delay_ms: 0` calls the injected runner once with normalized options;
- after a successful run, it schedules the next run using `interval_ms`;
- after a failed run, it still schedules the next run;
- runner opts include only `:currency`, `:keywords`, `:limit`, `:pages`, `:serviceable_areas`, and `:cursor`;
- invalid string/list options normalize to safe defaults.

Run:

```bash
mix test test/product_compare/ingestion/cj_product_import_scheduler_test.exs
```

Expected: fail because `ProductCompare.Ingestion.CJProductImportScheduler` does not exist yet.

## Task 2: Scheduler Module

**Files:**

- Create: `lib/product_compare/ingestion/cj_product_import_scheduler.ex`

- [ ] **Step 1: Add the GenServer**

Create `ProductCompare.Ingestion.CJProductImportScheduler` with:

- `use GenServer`;
- `require Logger`;
- default runner `&Mix.Tasks.ProductCompare.Ingestion.CjImport.run_import/1`;
- `start_link/1` accepting optional `:name`;
- `init/1` normalizing options and scheduling `:run_import`;
- `handle_info(:run_import, state)` calling the runner, logging aggregate outcome, and scheduling the next run.

- [ ] **Step 2: Normalize scheduler options**

Support:

- `:initial_delay_ms`, default `60_000`, non-negative integer;
- `:interval_ms`, default `86_400_000`, positive integer;
- `:keywords`, default `["shoe"]`, accepts comma-delimited string or non-empty string list;
- `:currency`, default `"USD"`, uppercase string;
- `:serviceable_areas`, default `"US"`, uppercase string or non-empty string list;
- `:limit`, default `25`, positive integer;
- `:pages`, default `1`, positive integer;
- `:cursor`, optional integer or nil.

Runner opts must not contain credentials or raw payloads.

- [ ] **Step 3: Secret-safe logging**

On success, log only:

```text
CJ product import succeeded keywords=<count> currency=USD serviceable_areas=US limit=25 pages=1 cursor=nil fetched=1 normalized=1 persisted=1 failed=0 pages_fetched=1
```

On failure, log only normalized query bounds and a generic failure label. Do not log `inspect(reason)`.

## Task 3: Runtime Config and Supervision

**Files:**

- Modify: `config/runtime.exs`
- Modify: `lib/product_compare/application.ex`

- [ ] **Step 1: Add runtime config**

In `config/runtime.exs`, add:

- `CJ_PRODUCT_IMPORT_SCHEDULE_ENABLED`, default false;
- `CJ_PRODUCT_IMPORT_INTERVAL_MINUTES`, default `1440`;
- `CJ_PRODUCT_IMPORT_INITIAL_DELAY_MS`, default `60_000`;
- `CJ_PRODUCT_IMPORT_KEYWORDS`, default `shoe`;
- `CJ_PRODUCT_IMPORT_CURRENCY`, default `USD`;
- `CJ_PRODUCT_IMPORT_SERVICEABLE_AREAS`, default `US`;
- `CJ_PRODUCT_IMPORT_LIMIT`, default `25`;
- `CJ_PRODUCT_IMPORT_PAGES`, default `1`.

Use the existing runtime env helper style already present for feed discovery.

- [ ] **Step 2: Wire application supervision**

In `ProductCompare.Application`, append the scheduler child only when `Application.get_env(:product_compare, :cj_product_import_scheduler)[:enabled]` is true.

Convert interval minutes to milliseconds before passing scheduler opts. Keep the child absent by default in dev, test, and prod unless the env var opts in.

## Task 4: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/product_compare/ingestion/cj_product_import_scheduler_test.exs
```

Expected: pass.

- [ ] **Step 2: Run adjacent scheduler tests**

```bash
mix test test/product_compare/ingestion/cj_product_import_scheduler_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs
```

Expected: pass.

- [ ] **Step 3: Run typecheck and diff check**

```bash
mix typecheck
git diff --check
```

Expected: both pass.

- [ ] **Step 4: Commit the slice**

```bash
git add lib/product_compare/ingestion/cj_product_import_scheduler.ex test/product_compare/ingestion/cj_product_import_scheduler_test.exs lib/product_compare/application.ex config/runtime.exs docs/work/product-data-scraping.md
git commit -m "feat: schedule CJ product imports"
```

## Exit Condition

This row is complete when scheduler tests, adjacent feed-discovery scheduler tests, `mix typecheck`, and `git diff --check` pass, and the lane doc records that product import scheduling is disabled by default and secret-safe.
