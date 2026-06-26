# CJ Feed Discovery Credential Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dry credential preflight to CJ feed discovery so operators can verify scheduled-discovery readiness before any CJ feed network call runs.

**Architecture:** Extend the existing `mix product_compare.ingestion.cj_feeds` task with `--check-credentials` and `--require-ready`. Keep this isolated to the feed-discovery task and tests so it can be implemented in parallel with the product-import preflight and standalone credential status task.

**Tech Stack:** Elixir, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-26 CJ provider credential readiness parallel batch.

---

## Parallel Ownership

This row may run in parallel with the provider-credential-status task and product-import credential preflight rows.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`
- `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`
- `docs/work/product-data-scraping.md` under the feed-discovery-credential-preflight evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_credentials.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- `lib/product_compare/ingestion/sources/cj/client.ex`
- `lib/product_compare/ingestion/cj_feed_discovery.ex`
- `lib/product_compare/ingestion/cj_feed_discovery_scheduler.ex`
- `.env.example`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `--check-credentials` to `mix product_compare.ingestion.cj_feeds`.
- Add `--require-ready` for automation-friendly failure when required credentials are absent.
- Check only `CJ_API_TOKEN` and `CJ_ACCOUNT_ID`; keep `CJ_PROPERTY_ID` out of feed-discovery readiness because `shoppingProductFeeds` uses `companyId`.
- Treat blank env values and blank injected opts as missing.
- Print only `provider`, `surface`, `ready`, and missing env var names.
- Ensure credential preflight does not call the configured discovery runner, CJ transport, `SourceResolver.fetch_source/0`, candidate persistence, or `ImportRun` persistence.
- Preserve existing feed-discovery behavior when `--check-credentials` is absent.
- Do not load `.env.local`, add shared credential modules, persist credentials, print secret values, contact CJ, change scheduler behavior, add UI, or add CSV export.

## Task 1: Feed Discovery Preflight Tests

**Files:**

- Modify: `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`

- [ ] **Step 1: Add env-isolated preflight tests**

Extend the existing setup to preserve and restore `CJ_API_TOKEN` and `CJ_ACCOUNT_ID`.

Cover:

- `CjFeeds.run_discovery(check_credentials: true, runner: flunking_runner)` returns `{:ok, report}` with `ready: false` and `missing_required: ["CJ_API_TOKEN", "CJ_ACCOUNT_ID"]` when env and injected opts are missing;
- the same call with `api_token: "secret-token"` and `company_id: "1234567"` returns `ready: true`;
- the configured `:cj_feed_discovery_runner` is never called during `CjFeeds.run(["--check-credentials"])`;
- no `ImportRun` or `MerchantFeedCandidate` rows are created during preflight;
- CLI output includes `surface=shoppingProductFeeds`;
- preflight output never includes `secret-token` or `1234567`;
- `CjFeeds.run(["--check-credentials", "--require-ready"])` raises `Mix.Error` with `missing CJ credentials: CJ_API_TOKEN,CJ_ACCOUNT_ID` when required values are absent.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs
```

Expected: fail because `--check-credentials` is not implemented yet.

## Task 2: Feed Discovery Task Preflight

**Files:**

- Modify: `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`

- [ ] **Step 1: Parse the new flags**

Add `check_credentials: :boolean` and `require_ready: :boolean` to `OptionParser.parse/2`.

Ensure `parse_argv/1` puts `:check_credentials` and `:require_ready` into the opts with default `false`.

- [ ] **Step 2: Branch before runner work**

At the top of `run_discovery/1`, before `CJFeedDiscovery.run/1`, the configured runner, source resolution, or persistence can run, branch when `Keyword.get(opts, :check_credentials, false)` is true.

Return `{:ok, report}` for a non-required check. Use this map shape:

```elixir
%{
  provider: "cj",
  surface: "shoppingProductFeeds",
  ready: boolean(),
  missing_required: [String.t()]
}
```

- [ ] **Step 3: Print and enforce CLI behavior**

For CLI `run/1`, when `--check-credentials` is used, print:

```text
provider=cj surface=shoppingProductFeeds ready=false missing_required=CJ_API_TOKEN,CJ_ACCOUNT_ID
```

When `--require-ready` is present and credentials are missing, call `Mix.raise/1` after printing or before printing, but keep the error message limited to missing env var names.

- [ ] **Step 4: Preserve normal feed discovery**

Re-run existing feed discovery task tests and keep current behavior unchanged for:

- CLI option parsing;
- success report printing;
- missing-env errors from the real runner path;
- row failure report printing.

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs
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
git add lib/mix/tasks/product_compare.ingestion.cj_feeds.ex test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs docs/work/product-data-scraping.md
git commit -m "feat: preflight CJ feed credentials"
```

## Exit Condition

This row is complete when the CJ feeds task tests, `mix typecheck`, and `git diff --check` pass, and the feed-discovery-credential-preflight evidence heading in `docs/work/product-data-scraping.md` confirms the preflight avoids network calls, persistence, and secret output.
