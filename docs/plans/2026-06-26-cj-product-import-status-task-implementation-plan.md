# CJ Product Import Status Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only operator command for checking latest CJ `shoppingProducts` import health before scheduling product imports.

**Architecture:** Mirror the existing CJ feed-discovery status task, but target `ingestion_runs` rows where `provider == "cj"` and `surface == "shoppingProducts"`. Keep it read-only and isolated to one Mix task plus tests so it can run in parallel with application cohort reporting.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** deferred. Do not promote until the current CJ provider credential readiness row is complete and the coordinator chooses product import scheduling.

---

## Parallel Ownership

This plan can run in parallel with the CJ application cohort report because it only reads `ingestion_runs` and owns a new Mix task/test pair.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_import_status.ex`
- `test/mix/tasks/product_compare_ingestion_cj_import_status_test.exs`
- `docs/work/product-data-scraping.md` under a future product-import-status evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_discovery_status.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- `lib/product_compare/ingestion/cj_product_import_scheduler.ex`
- `lib/product_compare/application.ex`
- `config/runtime.exs`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_import_status`.
- Report the latest CJ `shoppingProducts` import run.
- Report the latest successful CJ `shoppingProducts` import and whether it is within `--max-age-hours`.
- Support `--require-success` so automation can fail fast when no successful import exists or the latest success is stale.
- Print only aggregate run fields: status, timestamps, page counts, record counts, sanitized error presence, and freshness.
- Do not contact CJ, mutate rows, run imports, schedule imports, print raw provider error bodies, print credentials, or add CSV output.

## Task 1: Status Task Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_import_status_test.exs`

- [ ] **Step 1: Add failing tests**

Use `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Seed a CJ source plus `ImportRun` rows for `surface: "shoppingProducts"`.

Cover:

- with no successful imports, `--require-success` raises `no successful CJ product import found`;
- with a failed latest run and an older successful run, output shows `latest_status=failed` and `latest_success_status=succeeded`;
- `--max-age-hours 24 --require-success` raises `latest successful CJ product import is stale` when the latest success is older than 24 hours;
- a fresh successful run prints `fresh=true`, `pages_fetched`, `records_fetched`, `records_normalized`, `records_persisted`, and `records_failed`;
- status ignores `shoppingProductFeeds` discovery runs;
- output sanitizes non-empty `error_summary` as `redacted` and never echoes raw text containing `CJ_API_TOKEN=secret`, account ids, GraphQL response bodies, or tracking parameters.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_import_status_test.exs
```

Expected: fail because the Mix task does not exist yet.

## Task 2: Read-Only Import Status Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_import_status.ex`

- [ ] **Step 1: Add the task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjImportStatus` with:

- `use Mix.Task`;
- `import Ecto.Query`;
- aliases for `ProductCompare.Repo` and `ProductCompareSchemas.Ingestion.ImportRun`;
- `@shortdoc "Reports CJ product import status"`;
- constants for provider `"cj"` and surface `"shoppingProducts"`.

- [ ] **Step 2: Parse options**

Support:

- `--max-age-hours`, integer, default `48`;
- `--require-success`, boolean, default false.

Invalid or non-positive `--max-age-hours` falls back to `48`.

- [ ] **Step 3: Query status**

Use direct task-local queries:

- latest run for provider/surface, ordered by newest `started_at`;
- latest successful run for provider/surface with `status == "succeeded"`, ordered by newest `finished_at`;
- no joins and no writes.

- [ ] **Step 4: Render and enforce freshness**

Render:

```text
latest_status=
latest_started_at=
latest_finished_at=
latest_pages_fetched=
latest_records_fetched=
latest_records_normalized=
latest_records_persisted=
latest_records_failed=
latest_error_summary=
latest_success_status=
latest_success_finished_at=
fresh=false
```

If `--require-success` is present and no success exists, call `Mix.raise("no successful CJ product import found")`.

If `--require-success` is present and the latest success is stale, call `Mix.raise("latest successful CJ product import is stale")`.

Sanitize any non-empty `error_summary` to `redacted`.

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_import_status_test.exs
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
git add lib/mix/tasks/product_compare.ingestion.cj_import_status.ex test/mix/tasks/product_compare_ingestion_cj_import_status_test.exs docs/work/product-data-scraping.md
git commit -m "feat: report CJ product import status"
```

## Exit Condition

This row is complete when the import status task tests, `mix typecheck`, and `git diff --check` pass, and the lane doc records that the task is read-only and secret-safe.
