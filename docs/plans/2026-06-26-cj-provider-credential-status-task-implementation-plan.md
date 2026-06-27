# CJ Provider Credential Status Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only operator command that reports whether CJ provider credentials are present without printing or persisting secret values.

**Architecture:** Keep this slice isolated to a new Mix task and its tests so it can run in parallel with the CJ import and feed-discovery preflight slices. The task reads only process environment variables, prints redacted presence/freshness-style status, and exits without touching CJ, the database, GraphQL, or frontend code.

**Tech Stack:** Elixir, Mix tasks, ExUnit.

**Status:** completed. This plan was executed in the 2026-06-26 six-plan CJ ingestion readiness parallel batch.

---

## Parallel Ownership

This row may run in parallel with the product-import credential preflight and feed-discovery credential preflight rows.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_credentials.ex`
- `test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs`
- `.env.example`
- `docs/work/product-data-scraping.md` under the provider-credential-status evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`
- `lib/product_compare/ingestion/sources/cj/client.ex`
- `lib/product_compare/ingestion/cj_feed_discovery.ex`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_credentials`.
- Treat `CJ_API_TOKEN` and `CJ_ACCOUNT_ID` as required for CJ API use.
- Treat `CJ_PROPERTY_ID` as optional legacy Website/Property PID context.
- Blank or whitespace-only env values count as missing.
- Print only variable names, boolean readiness, and counts.
- Support `--require-ready`; when required credentials are missing, raise `Mix.Error` with only missing env var names.
- Update `.env.example` with blank CJ variable names and comments that values must stay local.
- Do not load `.env.local`, persist credentials, print account ids, print token lengths, contact CJ, query the database, add GraphQL fields, add UI, or add CSV export.

## Task 1: Status Task Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs`

- [ ] **Step 1: Add env-isolated tests**

Use `ExUnit.Case, async: false` and `ExUnit.CaptureIO`.

Preserve and restore `CJ_API_TOKEN`, `CJ_ACCOUNT_ID`, and `CJ_PROPERTY_ID` in `setup`.

Cover:

- with no CJ env vars, output includes `provider=cj`, `ready=false`, and `missing_required=CJ_API_TOKEN,CJ_ACCOUNT_ID`;
- with blank env vars, blanks are treated as missing;
- with required env vars set, output includes `ready=true` and `missing_required=`;
- with `CJ_PROPERTY_ID` set, output says `optional_present=CJ_PROPERTY_ID` without printing the property value;
- output never includes sample env values such as `secret-token`, `1234567`, or `property-999`;
- `--require-ready` raises `Mix.Error` with `missing CJ credentials: CJ_API_TOKEN,CJ_ACCOUNT_ID` when required values are missing;
- `--require-ready` exits normally when required values are present.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs
```

Expected: fail because the Mix task does not exist yet.

## Task 2: Read-Only Mix Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_credentials.ex`
- Modify: `.env.example`

- [ ] **Step 1: Add the task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjCredentials` with:

- `use Mix.Task`;
- `@shortdoc "Reports CJ credential readiness"`;
- required vars `~w(CJ_API_TOKEN CJ_ACCOUNT_ID)`;
- optional vars `~w(CJ_PROPERTY_ID)`;
- `run/1` option parsing for `--require-ready`.

- [ ] **Step 2: Render the redacted report**

The task should print this stable line-oriented shape:

```text
provider=cj
surfaces=shoppingProducts,shoppingProductFeeds
ready=false
required_present=0
missing_required=CJ_API_TOKEN,CJ_ACCOUNT_ID
optional_present=
```

When all required values are present, print `ready=true`, `required_present=2`, and an empty `missing_required=`.

Only env var names may appear in output.

- [ ] **Step 3: Enforce required readiness**

When `--require-ready` is passed and required values are missing, call:

```elixir
Mix.raise("missing CJ credentials: #{Enum.join(missing_required, ",")}")
```

Do not include actual env values, lengths, hashes, account ids, or token fragments.

- [ ] **Step 4: Update `.env.example`**

Append blank placeholder keys:

```dotenv
# CJ provider credentials stay local; never commit real values.
CJ_API_TOKEN=
CJ_ACCOUNT_ID=
CJ_PROPERTY_ID=
```

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs
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
git add lib/mix/tasks/product_compare.ingestion.cj_credentials.ex test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs .env.example docs/work/product-data-scraping.md
git commit -m "feat: report CJ credential readiness"
```

## Exit Condition

This row is complete when the status task tests, `mix typecheck`, and `git diff --check` pass, and the provider-credential-status evidence heading in `docs/work/product-data-scraping.md` records the exact commands and confirms no secret values are printed.
