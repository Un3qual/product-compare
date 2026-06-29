# CJ Failed Run Report Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only operator command that reports recent failed CJ ingestion runs across product import and feed discovery surfaces.

**Architecture:** Add a standalone Mix task that queries failed `ingestion_runs` for provider `cj` and renders sanitized, aggregate failure rows. It gives operators one failure view without exposing raw error text or contacting CJ.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 ten-plan CJ operator loop parallel batch.

---

## Parallel Ownership

This row owns a new failed-run report task and can run in parallel with product/feed history tasks because it touches separate files.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_failed_runs.ex`
- `test/mix/tasks/product_compare_ingestion_cj_failed_runs_test.exs`
- `docs/work/product-data-scraping.md` under the failed-run-report evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_import_status.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_discovery_status.ex`
- `lib/product_compare/ingestion.ex`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_failed_runs`.
- Query CJ `ingestion_runs` with `status == "failed"`.
- Support `--surface shoppingProducts|shoppingProductFeeds|all`, default `all`.
- Support `--limit`, default `10`, maximum `50`.
- Support `--require-clean`; raise when any failed runs are found.
- Print only non-secret fields: run id, surface, started/finished timestamps, page and record counts, and `error_summary=redacted` for non-empty summaries.
- Do not contact CJ, start schedulers, mutate rows, print raw query payloads, print raw error text, print credentials, or export CSV.

## Task 1: Failed Run Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_failed_runs_test.exs`

- [ ] **Step 1: Add failing tests**

Use `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Seed:

- failed CJ product import run;
- failed CJ feed discovery run;
- succeeded CJ run;
- failed non-CJ run.

Cover:

- default output includes both failed CJ runs and excludes succeeded or non-CJ runs;
- `--surface shoppingProducts` includes only the product import failure;
- `--limit 1` prints one `run_id=` line;
- `--require-clean` raises `failed CJ ingestion runs found` when failed rows exist;
- no failures prints `failed_count=0`;
- raw error summaries render as `redacted` and never include seeded provider body, token, account id, or tracking markers.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_failed_runs_test.exs
```

Expected: fail because the task does not exist yet.

## Task 2: Failed Run Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_failed_runs.ex`

- [ ] **Step 1: Add task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjFailedRuns` with:

- `use Mix.Task`;
- `import Ecto.Query`;
- aliases for `ProductCompare.MixTasks.RepoOnlyStartup`, `ProductCompare.Repo`, and `ProductCompareSchemas.Ingestion.ImportRun`;
- `@shortdoc "Reports failed CJ ingestion runs"`.

- [ ] **Step 2: Parse filters**

Normalize:

- `surface`: `shoppingProducts`, `shoppingProductFeeds`, or `all`, default `all`;
- `limit`: positive integer, default `10`, clamp to `50`;
- `require_clean`: boolean.

- [ ] **Step 3: Query failed runs**

Query failed CJ runs ordered by newest `started_at`, then `id` descending. Apply surface filter only when it is not `all`.

- [ ] **Step 4: Render safe output**

Print:

```text
provider=cj failed_count=2 surface=all
run_id=1 surface=shoppingProducts started_at=2026-06-27T12:00:00Z finished_at=2026-06-27T12:01:00Z pages_fetched=1 records_fetched=10 records_persisted=8 records_failed=2 error_summary=redacted
```

When `--require-clean` and failures exist, print the report then raise `Mix.Error` with `failed CJ ingestion runs found`.

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_failed_runs_test.exs
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
git add lib/mix/tasks/product_compare.ingestion.cj_failed_runs.ex test/mix/tasks/product_compare_ingestion_cj_failed_runs_test.exs docs/work/product-data-scraping.md
git commit -m "feat: report failed CJ ingestion runs"
```

## Exit Condition

This row is complete when the failed-run tests, `mix typecheck`, and `git diff --check` pass, and the lane doc records that the task is read-only, scheduler-safe, and secret-safe.
