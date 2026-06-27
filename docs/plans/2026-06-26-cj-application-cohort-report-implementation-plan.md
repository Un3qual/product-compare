# CJ Application Cohort Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only operator report that turns shortlisted CJ feed candidates into an application-review cohort without submitting applications or exporting CSV.

**Architecture:** Keep this slice isolated to a new Mix task and tests. The task reads existing `merchant_feed_candidates` through `ProductCompare.Ingestion.list_merchant_feed_candidates_query/1`, applies report-only filters in memory, and prints line-oriented non-secret fields for manual application planning.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** completed. This plan was executed in the 2026-06-26 six-plan CJ ingestion readiness parallel batch without merchant application submission or account-manager automation.

---

## Parallel Ownership

This plan can run in parallel with the CJ product import status task because it only reads feed candidates and owns a new Mix task/test pair.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_application_cohort.ex`
- `test/mix/tasks/product_compare_ingestion_cj_application_cohort_test.exs`
- `docs/work/product-data-scraping.md` under a future application-cohort evidence heading only

Do not edit:

- `lib/product_compare/ingestion.ex`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_application_cohort`.
- Default to reviewed candidates with `review_status == "shortlisted"`.
- Support `--status pending|shortlisted|dismissed`, `--country`, `--currency`, `--language`, `--min-product-count`, `--limit`, and `--require-candidates`.
- Sort candidates using the existing `:fit_score_desc` query order before applying task-local report filters.
- Print only non-secret candidate fields: candidate id, advertiser id, advertiser name, country, currency, language, source feed type, feed name, product count, review note presence, and reviewed timestamp.
- Never print `raw_metadata`, provider payloads, account ids, tokens, tracking parameters, or credential-derived values.
- Do not create merchants, affiliate programs, applications, emails, network calls, product imports, scheduled jobs, or CSV files.

## Task 1: Report Contract Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_application_cohort_test.exs`

- [ ] **Step 1: Add failing tests**

Use `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Seed a CJ source plus three feed candidates:

- one shortlisted US/USD/EN candidate with `product_count: 12_000`;
- one shortlisted CA/CAD/EN candidate with `product_count: 8_000`;
- one pending US/USD/EN candidate with `product_count: 20_000`.

Cover:

- default output includes the shortlisted candidates and excludes the pending candidate;
- `--status pending` includes the pending candidate;
- `--country US --currency USD --language EN --min-product-count 10000` keeps only the US/USD/EN launch-fit candidate;
- `--limit 1` prints one `candidate_id=` line;
- `--require-candidates` raises `Mix.Error` with `no CJ application cohort candidates found` when filters remove every row;
- output includes `review_note_present=true` rather than the note body;
- output never includes raw metadata markers, tokens, account ids, or provider payload text inserted into fixtures.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_application_cohort_test.exs
```

Expected: fail because the Mix task does not exist yet.

## Task 2: Read-Only Cohort Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_application_cohort.ex`

- [ ] **Step 1: Add the task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjApplicationCohort` with:

- `use Mix.Task`;
- aliases for `ProductCompare.Ingestion`, `ProductCompare.Repo`,
  `ProductCompareWeb.GraphQL.GlobalId`, and
  `ProductCompareSchemas.Ingestion.MerchantFeedCandidate`;
- `@shortdoc "Reports shortlisted CJ application cohort candidates"`.

- [ ] **Step 2: Parse options**

Parse:

- `--status`, string, default `shortlisted`;
- `--country`, string;
- `--currency`, string;
- `--language`, string;
- `--min-product-count`, integer;
- `--limit`, integer, default `25`;
- `--require-candidates`, boolean, default false.

Normalize status to lowercase and only accept `pending`, `shortlisted`, or `dismissed`. Invalid status falls back to `shortlisted`. Normalize country, currency, and language to uppercase. Invalid or non-positive limits fall back to `25`; values above `100` clamp to `100`.

- [ ] **Step 3: Query and filter candidates**

Build the base query with:

```elixir
Ingestion.list_merchant_feed_candidates_query(
  review_status: status,
  sort: :fit_score_desc
)
```

Fetch rows with `Repo.all/1`, then apply the optional report filters in memory. Keep this task read-only.

- [ ] **Step 4: Render compact non-secret output**

Print a header:

```text
provider=cj cohort_status=shortlisted count=1
```

Print one line per candidate:

```text
candidate_id=<relay-id> advertiser_id=adv-1 advertiser_name="Trail Merchant" country=US currency=USD language=EN source_feed_type=SHOPPING feed_name="US Shopping" product_count=12000 review_note_present=true reviewed_at=2026-06-26T12:00:00Z
```

Quote string values with `inspect/1` so spaces stay readable. Do not include review note body or raw metadata.

- [ ] **Step 5: Enforce required candidates**

If `--require-candidates` is present and no rows remain after filters, call:

```elixir
Mix.raise("no CJ application cohort candidates found")
```

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_application_cohort_test.exs
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
git add lib/mix/tasks/product_compare.ingestion.cj_application_cohort.ex test/mix/tasks/product_compare_ingestion_cj_application_cohort_test.exs docs/work/product-data-scraping.md
git commit -m "feat: report CJ application cohort"
```

## Exit Condition

This row is complete when the cohort task tests, `mix typecheck`, and `git diff --check` pass, and the lane doc records that the report is read-only, non-secret, and not a CSV export.
