# CJ Product Import History Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only operator command that lists recent CJ `shoppingProducts` import runs with sanitized status fields.

**Architecture:** Add a standalone Mix task that starts only the repo, queries persisted `ingestion_runs`, and renders line-oriented run history. The task does not call CJ, start schedulers, or expose raw provider error text.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 ten-plan CJ operator loop parallel batch.

---

## Parallel Ownership

This row owns a new read-only history task and can run in parallel with resume, gate, and candidate-report rows.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_import_history.ex`
- `test/mix/tasks/product_compare_ingestion_cj_import_history_test.exs`
- `docs/work/product-data-scraping.md` under the product-import-history evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_import_status.ex`
- `lib/product_compare/ingestion.ex`
- `lib/product_compare/ingestion/cj_product_import_scheduler.ex`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_import_history`.
- Query only CJ `shoppingProducts` `ingestion_runs`.
- Support `--limit`, default `10`, minimum `1`, maximum `50`.
- Render one line per run with non-secret fields: `run_id`, `status`, `started_at`, `finished_at`, `cursor_start`, `cursor_end`, `pages_requested`, `pages_fetched`, `records_fetched`, `records_normalized`, `records_persisted`, `records_failed`, and `error_summary`.
- Render `error_summary=redacted` whenever the persisted field is non-empty.
- Do not contact CJ, start scheduler children, mutate rows, print raw query payloads, print credentials, or export CSV.

## Task 1: History Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_import_history_test.exs`

- [ ] **Step 1: Add failing tests**

Use `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Seed:

- two CJ `shoppingProducts` runs with different `started_at` values;
- one CJ `shoppingProductFeeds` run;
- one non-CJ product import run.

Cover:

- default output includes only the CJ product import runs, newest first;
- `--limit 1` prints exactly one `run_id=` line;
- invalid or excessive limits normalize to the documented bounds;
- non-empty `error_summary` renders as `redacted` and does not include the seeded raw error body;
- the task does not start `ProductCompare.Supervisor`, `CJProductImportScheduler`, or `CJFeedDiscoveryScheduler`.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_import_history_test.exs
```

Expected: fail because the task does not exist yet.

## Task 2: History Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_import_history.ex`

- [ ] **Step 1: Add task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjImportHistory` with:

- `use Mix.Task`;
- `import Ecto.Query`;
- aliases for `ProductCompare.MixTasks.RepoOnlyStartup`, `ProductCompare.Repo`, and `ProductCompareSchemas.Ingestion.ImportRun`;
- `@shortdoc "Reports recent CJ product import runs"`.

- [ ] **Step 2: Query recent product import runs**

Call `RepoOnlyStartup.start!/0`, parse the bounded limit, and query:

```elixir
ImportRun
|> where([run], run.provider == "cj")
|> where([run], run.surface == "shoppingProducts")
|> order_by([run], desc: run.started_at, desc: run.id)
|> limit(^limit)
|> Repo.all()
```

- [ ] **Step 3: Render safe output**

Each line should look like:

```text
run_id=1 status=succeeded started_at=2026-06-27T12:00:00Z finished_at=2026-06-27T12:01:00Z cursor_start=0 cursor_end=25 pages_requested=1 pages_fetched=1 records_fetched=25 records_normalized=25 records_persisted=25 records_failed=0 error_summary=
```

Use `DateTime.to_iso8601/1` for timestamps. Use an empty value for nil fields.

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_import_history_test.exs
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
git add lib/mix/tasks/product_compare.ingestion.cj_import_history.ex test/mix/tasks/product_compare_ingestion_cj_import_history_test.exs docs/work/product-data-scraping.md
git commit -m "feat: report CJ product import history"
```

## Exit Condition

This row is complete when the history task tests, `mix typecheck`, and `git diff --check` pass, and the lane doc records that the task is read-only, scheduler-safe, and secret-safe.
