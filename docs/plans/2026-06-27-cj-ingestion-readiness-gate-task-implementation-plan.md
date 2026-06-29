# CJ Ingestion Readiness Gate Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only gate command that checks CJ credentials, recent discovery/import success, and minimum candidate counts before operators run the next ingestion loop.

**Architecture:** Add a standalone Mix task that starts only the repo, reads environment variable presence without printing values, queries persisted status, and exits with safe failure messages when `--require-ready` is set. It centralizes the operator readiness check without scheduling work or contacting CJ.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 ten-plan CJ operator loop parallel batch.

---

## Parallel Ownership

This row owns a new readiness gate task and can run in parallel with history and report rows because it does not modify existing status tasks.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_readiness_gate.ex`
- `test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs`
- `docs/work/product-data-scraping.md` under the readiness-gate evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_credentials.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_import_status.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_discovery_status.ex`
- `lib/product_compare/application.ex`
- `config/runtime.exs`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_readiness_gate`.
- Check presence of required `CJ_API_TOKEN` and `CJ_ACCOUNT_ID`; blank strings count as missing.
- Check latest successful `shoppingProductFeeds` and `shoppingProducts` runs against configurable freshness windows.
- Check total candidate count and shortlisted candidate count.
- Support `--max-discovery-age-hours`, default `48`; `--max-import-age-hours`, default `48`; `--min-candidates`, default `1`; `--min-shortlisted`, default `0`; and `--require-ready`.
- Print only readiness booleans, missing env var names, counts, and freshness booleans.
- Do not print credential values, raw query payloads, raw errors, raw metadata, account IDs, tracking parameters, or provider payloads.
- Do not contact CJ, start scheduler children, persist credentials, mutate rows, add GraphQL, add UI, or export CSV.

## Task 1: Gate Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs`

- [ ] **Step 1: Add failing tests**

Use `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Cover:

- missing env vars produce `credentials_ready=false missing_required=CJ_API_TOKEN,CJ_ACCOUNT_ID`;
- whitespace env var values count as missing;
- present env vars produce `credentials_ready=true` without printing the values;
- fresh successful discovery/import runs plus candidate counts produce `ready=true`;
- stale discovery or import runs produce `ready=false`;
- `--min-shortlisted 2` fails readiness when only one candidate is shortlisted;
- `--require-ready` raises `CJ ingestion is not ready` when any gate fails;
- the task does not start `ProductCompare.Supervisor`, `CJProductImportScheduler`, or `CJFeedDiscoveryScheduler`.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs
```

Expected: fail because the task does not exist yet.

## Task 2: Readiness Gate Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_readiness_gate.ex`

- [ ] **Step 1: Add task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjReadinessGate` with:

- `use Mix.Task`;
- `import Ecto.Query`;
- aliases for `ProductCompare.MixTasks.RepoOnlyStartup`, `ProductCompare.Repo`, `ProductCompareSchemas.Ingestion.ImportRun`, and `ProductCompareSchemas.Ingestion.MerchantFeedCandidate`;
- `@shortdoc "Checks CJ ingestion readiness"`.

- [ ] **Step 2: Parse thresholds**

Normalize positive integer options for max ages and minimum counts, applying documented defaults. Parse `--require-ready` as a boolean.

- [ ] **Step 3: Build readiness report**

Compute:

- credential readiness and missing required env var names;
- latest successful discovery freshness;
- latest successful product import freshness;
- total CJ candidate count;
- shortlisted CJ candidate count;
- final `ready` boolean requiring all checks.

- [ ] **Step 4: Render safe output**

Print:

```text
provider=cj ready=true credentials_ready=true missing_required= discovery_fresh=true import_fresh=true candidate_count=12 min_candidates=1 shortlisted_count=3 min_shortlisted=0
```

When `--require-ready` and not ready, raise `Mix.Error` with `CJ ingestion is not ready` after printing the report.

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs
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
git add lib/mix/tasks/product_compare.ingestion.cj_readiness_gate.ex test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs docs/work/product-data-scraping.md
git commit -m "feat: gate CJ ingestion readiness"
```

## Exit Condition

This row is complete when the readiness gate tests, `mix typecheck`, and `git diff --check` pass, and the lane doc records that the gate is read-only, scheduler-safe, and secret-safe.
