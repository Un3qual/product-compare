# CJ Product Import Resume Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an operator command that resumes a bounded CJ `shoppingProducts` import from the latest successful product-import cursor.

**Architecture:** Keep the existing manual import task as the runner and add a small wrapper task that reads only persisted `ingestion_runs` metadata. The wrapper derives non-secret query bounds from the latest successful CJ product import, refuses to resume when there is no cursor, and uses injected runner options in tests so no live CJ calls run.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 ten-plan CJ operator loop parallel batch.

---

## Parallel Ownership

This row may run in parallel with the other 2026-06-27 CJ operator tasks because it owns a new Mix task/test pair and only reads existing import-run metadata.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_import_resume.ex`
- `test/mix/tasks/product_compare_ingestion_cj_import_resume_test.exs`
- `docs/work/product-data-scraping.md` under the product-import-resume evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- `lib/product_compare/ingestion.ex`
- `lib/product_compare/ingestion/cj_product_import_scheduler.ex`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_import_resume`.
- Find the latest succeeded CJ `shoppingProducts` `ingestion_runs` row.
- Resume from `cursor_end` and reuse the latest run's `query` values for `keywords`, `currency`, and `serviceableAreas`.
- Support `--pages`, `--limit`, and `--require-cursor`.
- Print only aggregate resume fields: `provider`, `surface`, `cursor_start`, `pages_requested`, `limit`, `fetched`, `normalized`, `persisted`, `failed`, and `next_cursor`.
- Do not print raw provider payloads, credentials, account IDs, tracking parameters, or raw error text.
- Do not add scheduling, GraphQL, UI, credential persistence, merchant applications, account-manager automation, CSV output, or live CJ calls in tests.

## Task 1: Resume Contract Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_import_resume_test.exs`

- [ ] **Step 1: Add failing tests**

Use `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Seed a CJ source and a completed `ImportRun` with:

- `provider: "cj"`;
- `surface: "shoppingProducts"`;
- `status: "succeeded"`;
- `query: %{"keywords" => ["shoe"], "currency" => "USD", "serviceableAreas" => ["US"]}`;
- `cursor_end: 100`;
- `page_size: 25`;
- `pages_requested: 1`.

Cover:

- `CjImportResume.run_resume(runner: runner, pages: 2)` calls the injected runner with `cursor: 100`, `keywords: ["shoe"]`, `currency: "USD"`, `serviceable_areas: ["US"]`, `limit: 25`, `pages: 2`, and `print_report: false`;
- command output includes `provider=cj surface=shoppingProducts cursor_start=100 pages_requested=2 limit=25 fetched=3 normalized=3 persisted=3 failed=0 next_cursor=125`;
- the task ignores newer failed runs and older successful runs;
- `--require-cursor` raises `Mix.Error` with `latest successful CJ product import has no cursor to resume` when the latest success has `cursor_end: nil`;
- with no successful product import, the task raises `no successful CJ product import found`;
- output never includes a seeded token marker, account id marker, tracking marker, or raw provider payload marker.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_import_resume_test.exs
```

Expected: fail because `Mix.Tasks.ProductCompare.Ingestion.CjImportResume` does not exist yet.

## Task 2: Resume Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_import_resume.ex`

- [ ] **Step 1: Add the task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjImportResume` with:

- `use Mix.Task`;
- aliases for `Mix.Tasks.ProductCompare.Ingestion.CjImport`, `ProductCompare.MixTasks.RepoOnlyStartup`, `ProductCompare.Repo`, and `ProductCompareSchemas.Ingestion.ImportRun`;
- `import Ecto.Query`;
- `@shortdoc "Resumes the latest CJ product import cursor"`.

- [ ] **Step 2: Parse options**

Parse:

- `--pages`, integer, default `1`, positive values only;
- `--limit`, integer, optional positive override;
- `--require-cursor`, boolean, default false.

Expose a programmatic `run_resume/1` that accepts the parsed options plus an injected `:runner`.

- [ ] **Step 3: Query latest success**

Find the latest successful CJ product import:

```elixir
ImportRun
|> where([run], run.provider == "cj")
|> where([run], run.surface == "shoppingProducts")
|> where([run], run.status == "succeeded")
|> order_by([run], desc_nulls_last: run.finished_at, desc: run.started_at, desc: run.id)
|> limit(1)
|> Repo.one()
```

Raise `Mix.Error` with `no successful CJ product import found` when absent.

- [ ] **Step 4: Build non-secret runner options**

Derive runner options from the latest run:

- `cursor: latest_run.cursor_end`;
- `keywords: Map.get(query, "keywords", ["shoe"])`;
- `currency: Map.get(query, "currency", "USD")`;
- `serviceable_areas: Map.get(query, "serviceableAreas", ["US"])`;
- `limit: opts[:limit] || latest_run.page_size || 25`;
- `pages: opts[:pages]`;
- `print_report: false`.

If `cursor_end` is `nil` and `require_cursor` is true, raise `Mix.Error` with `latest successful CJ product import has no cursor to resume`. If `cursor_end` is `nil` and `require_cursor` is false, return `{:error, :no_resume_cursor}` and print `resumable=false`.

- [ ] **Step 5: Render sanitized output**

For successful runner results, print a single line:

```text
provider=cj surface=shoppingProducts cursor_start=100 pages_requested=2 limit=25 fetched=3 normalized=3 persisted=3 failed=0 next_cursor=125
```

For `{:error, reason}`, raise `Mix.Error` with `CJ product import resume failed` and do not interpolate `inspect(reason)`.

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_import_resume_test.exs
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
git add lib/mix/tasks/product_compare.ingestion.cj_import_resume.ex test/mix/tasks/product_compare_ingestion_cj_import_resume_test.exs docs/work/product-data-scraping.md
git commit -m "feat: resume CJ product imports"
```

## Exit Condition

This row is complete when the resume task tests, `mix typecheck`, and `git diff --check` pass, and the lane doc records that the task resumes from persisted non-secret run metadata without printing secrets or raw provider errors.
