# Manual CJ Connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual CJ GraphQL connector that fetches one page from `ads.api.cj.com/query`, normalizes the result through the existing CJ parser, and persists it through `ProductCompare.Ingestion.persist_normalized_listing/2`.

**Architecture:** Keep network access explicit and manual. A small CJ client module owns runtime env lookup, GraphQL request construction, response decoding, and error mapping; `ProductParser.fetch_batch/2` delegates to that client and continues to own record normalization. A Mix task performs one manual import into the existing source-agnostic ingestion boundary.

**Tech Stack:** Elixir, Mix tasks, `:httpc`/`:inets` for the one manual HTTPS request, Jason, ExUnit, Ecto, existing `ProductCompare.Ingestion` persistence APIs.

---

## Scope

- Build only a manual connector path.
- Use local runtime env vars only: `CJ_API_TOKEN`, `CJ_ACCOUNT_ID`, and optional `CJ_PROPERTY_ID` for documentation/backward-compatibility notes.
- Query `shoppingProducts` against `https://ads.api.cj.com/query`.
- Keep scheduled polling, Oban jobs, account-manager automation, credential config, and Tier-3 direct scraping out of scope.

## File Structure

- Create `lib/product_compare/ingestion/sources/cj/client.ex`: CJ GraphQL request builder, runtime env config, injected transport support for tests, response decoding, and error mapping.
- Modify `lib/product_compare/ingestion/sources/cj/product_parser.ex`: delegate `fetch_batch/2` to the client and keep normalization local.
- Create `lib/mix/tasks/product_compare.ingestion.cj_import.ex`: manual import task that fetches one page, normalizes records, persists successful listings, and reports counts.
- Create `test/product_compare/ingestion/sources/cj/client_test.exs`: client request, config, and response decoding tests without live network calls.
- Modify `test/product_compare/ingestion/sources/cj/product_parser_test.exs`: adapter fetch delegation coverage.
- Create `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`: task-level manual import coverage with injected fetcher/persistence behavior or a focused source/persistence integration path.
- Update `docs/work/product-data-scraping.md`, `docs/work/index.md`, and `docs/plans/INDEX.md` when the batch completes or blocks.

### Task 1: CJ GraphQL Client And Fetch Batch

**Files:**
- Create: `lib/product_compare/ingestion/sources/cj/client.ex`
- Create: `test/product_compare/ingestion/sources/cj/client_test.exs`
- Modify: `lib/product_compare/ingestion/sources/cj/product_parser.ex`
- Modify: `test/product_compare/ingestion/sources/cj/product_parser_test.exs`

- [ ] **Step 1: Write the failing client config and request tests**

Add tests that set temporary env vars, inject a transport function, and assert the client posts to `https://ads.api.cj.com/query` with a Bearer token, `companyId`, `keywords`, `partnerStatus: JOINED`, `limit`, `offset`, `currency`, and `serviceableAreas`.

Run: `mix test test/product_compare/ingestion/sources/cj/client_test.exs`

Expected: fail because `ProductCompare.Ingestion.Sources.CJ.Client` does not exist.

- [ ] **Step 2: Implement the minimal client**

Create `ProductCompare.Ingestion.Sources.CJ.Client` with:

- `fetch_batch(cursor, opts)` returning `{:ok, records, next_cursor}` or `{:error, reason}`.
- `config_from_env/1` reading `CJ_API_TOKEN` and `CJ_ACCOUNT_ID`.
- injected `:transport` option for tests.
- default query filters: `keywords: ["shoe"]`, `partnerStatus: "JOINED"`, `limit: 25`, `offset: cursor || 0`, `currency: "USD"`, `serviceableAreas: "US"`.
- deterministic errors: `{:missing_env, "CJ_API_TOKEN"}`, `{:missing_env, "CJ_ACCOUNT_ID"}`, `{:http_error, status, body}`, `{:graphql_errors, errors}`, or `{:decode_error, reason}`.

Run: `mix test test/product_compare/ingestion/sources/cj/client_test.exs`

Expected: pass.

- [ ] **Step 3: Write fetch delegation test**

Update `ProductParserTest` so `fetch_batch/2` delegates to the client when passed an injected transport/config option and returns raw CJ product maps.

Run: `mix test test/product_compare/ingestion/sources/cj/product_parser_test.exs`

Expected: fail while `ProductParser.fetch_batch/2` still returns `{:error, :not_configured}`.

- [ ] **Step 4: Implement fetch delegation**

Update `ProductCompare.Ingestion.Sources.CJ.ProductParser.fetch_batch/2` to call `ProductCompare.Ingestion.Sources.CJ.Client.fetch_batch/2`.

Run: `mix test test/product_compare/ingestion/sources/cj/client_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs`

Expected: pass.

### Task 2: Manual Import Mix Task

**Files:**
- Create: `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- Create: `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`
- Modify: `docs/work/product-data-scraping.md`

- [ ] **Step 1: Write the failing Mix task test**

Create a test that inserts or reuses a `Source` with `domain: "cj.com"`, injects one redacted fixture record through the task, runs normalization plus `persist_normalized_listing/2`, and asserts the task reports `fetched=1 normalized=1 persisted=1 failed=0`.

Run: `mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs`

Expected: fail because the Mix task does not exist.

- [ ] **Step 2: Implement the manual task**

Create `Mix.Tasks.ProductCompare.Ingestion.CjImport` with:

- CLI options: `--keywords`, `--limit`, `--offset`, `--serviceable-area`, and `--currency`.
- default values matching the validated query: `shoe`, `25`, `0`, `US`, and `USD`.
- env-var-only credential lookup through the CJ client.
- source lookup or creation for `kind: "affiliate_feed"`, `name: "CJ"`, `domain: "cj.com"`.
- per-record normalize/persist flow using existing parser and ingestion APIs.
- final count output with fetched, normalized, persisted, and failed counts.

Run: `mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs`

Expected: pass.

### Task 3: Verification And Dispatch Handoff

**Files:**
- Modify: `docs/work/product-data-scraping.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `docs/plans/2026-06-04-manual-cj-connector-implementation-plan.md`

- [ ] **Step 1: Run focused tests**

Run:

```bash
mix test test/product_compare/ingestion/sources/cj/client_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs test/product_compare/ingestion/ingestion_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs
```

Expected: all tests pass.

- [ ] **Step 2: Run adjacent regression tests**

Run:

```bash
mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs
mix typecheck
git diff --check
```

Expected: all commands pass.

- [ ] **Step 3: Update dispatch docs**

Update the lane doc and index so the next row is either:

- ready: run one manual CJ import against live credentials and inspect persisted rows, or
- blocked: record the exact CJ API, data-quality, or persistence blocker.

Commit all related code, tests, fixtures, and docs together.
