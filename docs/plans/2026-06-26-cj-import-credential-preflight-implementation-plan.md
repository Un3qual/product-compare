# CJ Import Credential Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dry credential preflight to the manual CJ product import task so operators can verify readiness before any product import network call or persistence attempt.

**Architecture:** Extend the existing `mix product_compare.ingestion.cj_import` task with `--check-credentials` and `--require-ready`. Keep the env check task-local in this slice so it can be implemented in parallel without touching shared CJ client files.

**Tech Stack:** Elixir, Mix tasks, ExUnit, Ecto sandbox tests already used by the CJ import task.

**Status:** ready. This plan is part of the 2026-06-26 CJ provider credential readiness parallel batch.

---

## Parallel Ownership

This row may run in parallel with the provider-credential-status task and feed-discovery credential preflight rows.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`
- `docs/work/product-data-scraping.md` under the product-import-credential-preflight evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_credentials.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`
- `lib/product_compare/ingestion/sources/cj/client.ex`
- `lib/product_compare/ingestion/cj_feed_discovery.ex`
- `.env.example`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `--check-credentials` to `mix product_compare.ingestion.cj_import`.
- Add `--require-ready` for automation-friendly failure when required credentials are absent.
- Check only `CJ_API_TOKEN` and `CJ_ACCOUNT_ID`; keep `CJ_PROPERTY_ID` out of product import readiness because `shoppingProducts` uses `companyId`.
- Treat blank env values and blank injected opts as missing.
- Print only `provider`, `surface`, `ready`, and missing env var names.
- Ensure credential preflight does not call the injected fetcher, CJ transport, `SourceResolver.fetch_source/0`, or persistence paths.
- Preserve existing import behavior when `--check-credentials` is absent.
- Do not load `.env.local`, add shared credential modules, persist credentials, print secret values, contact CJ, schedule imports, add UI, or add CSV export.

## Task 1: Product Import Preflight Tests

**Files:**

- Modify: `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`

- [ ] **Step 1: Add env-isolated preflight tests**

Extend the existing env restoration in the test module or add one if needed for `CJ_API_TOKEN` and `CJ_ACCOUNT_ID`.

Cover:

- `CjImport.run_import(check_credentials: true, fetcher: flunking_fetcher)` returns `{:ok, report}` with `ready: false` and `missing_required: ["CJ_API_TOKEN", "CJ_ACCOUNT_ID"]` when env and injected opts are missing;
- the same call with `api_token: "secret-token"` and `company_id: "1234567"` returns `ready: true`;
- a flunking fetcher is never called during preflight;
- no `ImportRun`, `SourceArtifact`, `ExternalProduct`, `MerchantProduct`, or `PricePoint` rows are created during preflight;
- `capture_io(fn -> CjImport.run(["--check-credentials"]) end)` prints `surface=shoppingProducts`;
- preflight output never includes `secret-token` or `1234567`;
- `CjImport.run(["--check-credentials", "--require-ready"])` raises `Mix.Error` with `missing CJ credentials: CJ_API_TOKEN,CJ_ACCOUNT_ID` when required values are absent.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs
```

Expected: fail because `--check-credentials` is not implemented yet.

## Task 2: Import Task Preflight

**Files:**

- Modify: `lib/mix/tasks/product_compare.ingestion.cj_import.ex`

- [ ] **Step 1: Parse the new flags**

Add `check_credentials: :boolean` and `require_ready: :boolean` to `OptionParser.parse/2`.

Ensure `parse_argv/1` puts `:check_credentials` and `:require_ready` into the opts with default `false`.

- [ ] **Step 2: Branch before import work**

At the top of `run_import/1`, before `fetch_source/0`, `start_import_run/4`, fetcher calls, or persistence, branch when `Keyword.get(opts, :check_credentials, false)` is true.

Return `{:ok, report}` for a non-required check. Use this map shape:

```elixir
%{
  provider: "cj",
  surface: "shoppingProducts",
  ready: boolean(),
  missing_required: [String.t()]
}
```

- [ ] **Step 3: Print and enforce CLI behavior**

For CLI `run/1`, when `--check-credentials` is used, print:

```text
provider=cj surface=shoppingProducts ready=false missing_required=CJ_API_TOKEN,CJ_ACCOUNT_ID
```

When `--require-ready` is present and credentials are missing, call `Mix.raise/1` after printing or before printing, but keep the error message limited to missing env var names.

- [ ] **Step 4: Preserve normal imports**

Re-run existing import tests and keep current behavior unchanged for:

- one-page import;
- multi-page import;
- source reuse;
- row failure reporting;
- report printing for real imports.

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs
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
git add lib/mix/tasks/product_compare.ingestion.cj_import.ex test/mix/tasks/product_compare_ingestion_cj_import_test.exs docs/work/product-data-scraping.md
git commit -m "feat: preflight CJ import credentials"
```

## Exit Condition

This row is complete when the CJ import task tests, `mix typecheck`, and `git diff --check` pass, and the product-import-credential-preflight evidence heading in `docs/work/product-data-scraping.md` confirms the preflight avoids network calls, persistence, and secret output.
