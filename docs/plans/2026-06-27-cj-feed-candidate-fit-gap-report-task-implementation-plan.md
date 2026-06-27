# CJ Feed Candidate Fit Gap Report Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only operator command that summarizes why pending CJ feed candidates are not launch-fit yet.

**Architecture:** Add an isolated Mix task that reads candidate fields already used by the fit-score sort and groups non-secret gap reasons. The task supports manual review prioritization without persisting scores, exporting CSV, or adding application automation.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 ten-plan CJ operator loop parallel batch.

---

## Parallel Ownership

This row owns a new read-only fit-gap report task and can run in parallel with other candidate reports because it touches separate files and does not change candidate schema or query helpers.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_candidate_fit_gaps.ex`
- `test/mix/tasks/product_compare_ingestion_cj_candidate_fit_gaps_test.exs`
- `docs/work/product-data-scraping.md` under the candidate-fit-gaps evidence heading only

Do not edit:

- `lib/product_compare/ingestion.ex`
- `lib/product_compare_schemas/ingestion/merchant_feed_candidate.ex`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_candidate_fit_gaps`.
- Default to `review_status == "pending"` candidates; support `--status pending|shortlisted|dismissed|all`.
- Support `--limit`, default `25`, maximum `100`.
- Report gap reason counts for:
  - missing or non-US country;
  - missing or non-USD currency;
  - missing or non-EN language;
  - missing product count;
  - product count below `1000`;
  - missing source feed type.
- Render per-candidate non-secret gap rows for the selected limit.
- Do not persist scores, mutate candidates, call CJ, print raw metadata, print credentials, create files, or export CSV.

## Task 1: Fit Gap Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_candidate_fit_gaps_test.exs`

- [ ] **Step 1: Add failing tests**

Use `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Seed CJ candidates:

- pending candidate with CA/CAD/FR, no source feed type, and `product_count: 50`;
- pending candidate with US/USD/EN, source feed type present, and `product_count: 12_000`;
- shortlisted candidate with missing product count;
- non-CJ pending candidate.

Cover:

- default output includes only pending CJ candidates;
- summary counts include country, currency, language, product-count, and source-feed-type gaps for the low-fit candidate;
- launch-fit pending candidate prints `gap_count=0`;
- `--status all` includes shortlisted CJ candidates;
- `--limit 1` prints one candidate line;
- output never includes raw metadata, token markers, account id markers, tracking markers, or provider payload markers.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidate_fit_gaps_test.exs
```

Expected: fail because the task does not exist yet.

## Task 2: Fit Gap Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_candidate_fit_gaps.ex`

- [ ] **Step 1: Add task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjCandidateFitGaps` with:

- `use Mix.Task`;
- `import Ecto.Query`;
- aliases for `ProductCompare.MixTasks.RepoOnlyStartup`, `ProductCompare.Repo`, `ProductCompareWeb.GraphQL.GlobalId`, and `ProductCompareSchemas.Ingestion.MerchantFeedCandidate`;
- `@shortdoc "Reports CJ feed candidate fit gaps"`.

- [ ] **Step 2: Parse filters**

Normalize:

- `status`: `pending`, `shortlisted`, `dismissed`, or `all`, default `pending`;
- `limit`: positive integer, default `25`, clamp to `100`.

- [ ] **Step 3: Compute gap reasons**

For each candidate, compute reason atoms:

- `:country_not_us` when uppercase country is not `US`;
- `:currency_not_usd` when uppercase currency is not `USD`;
- `:language_not_en` when uppercase language is not `EN`;
- `:missing_product_count` when product count is nil;
- `:low_product_count` when product count is less than `1000`;
- `:missing_source_feed_type` when the source feed type is blank.

Do not persist these values.

- [ ] **Step 4: Render safe output**

Print a summary:

```text
provider=cj status=pending candidate_count=2 country_not_us=1 currency_not_usd=1 language_not_en=1 missing_product_count=0 low_product_count=1 missing_source_feed_type=1
```

Then print candidate lines:

```text
candidate_id=<relay-id> provider_feed_id=feed-1 advertiser_name="Trail Merchant" review_status=pending product_count=50 gap_count=5 gaps=country_not_us,currency_not_usd,language_not_en,low_product_count,missing_source_feed_type
```

Use empty strings for nil display fields and never print raw metadata.

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidate_fit_gaps_test.exs
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
git add lib/mix/tasks/product_compare.ingestion.cj_candidate_fit_gaps.ex test/mix/tasks/product_compare_ingestion_cj_candidate_fit_gaps_test.exs docs/work/product-data-scraping.md
git commit -m "feat: report CJ candidate fit gaps"
```

## Exit Condition

This row is complete when the fit-gap tests, `mix typecheck`, and `git diff --check` pass, and the lane doc records that the task is read-only and does not persist scores or export CSV.
