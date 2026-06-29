# CJ Application Cohort Markdown Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Markdown report for shortlisted CJ feed candidates so application planning can be reviewed without CSV output or automation.

**Architecture:** Add a standalone Mix task that queries existing shortlisted candidates, orders by the fit-score query, and renders a compact Markdown table to stdout. The task is report-only: it does not write files, export CSV, submit applications, or contact CJ.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 ten-plan CJ operator loop parallel batch.

---

## Parallel Ownership

This row owns a new read-only Markdown report task and can run in parallel with staleness, history, and readiness rows.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_application_cohort_markdown.ex`
- `test/mix/tasks/product_compare_ingestion_cj_application_cohort_markdown_test.exs`
- `docs/work/product-data-scraping.md` under the application-cohort-markdown evidence heading only

Do not edit:

- `lib/mix/tasks/product_compare.ingestion.cj_application_cohort.ex`
- `lib/product_compare/ingestion.ex`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_application_cohort_markdown`.
- Query CJ candidates with `review_status == "shortlisted"` and `sort: :fit_score_desc`.
- Support `--country`, `--currency`, `--language`, `--min-product-count`, `--limit`, and `--require-candidates`.
- Render a Markdown table to stdout with non-secret fields only.
- Include a heading and count, then rows for candidate id, advertiser name, advertiser id, country, currency, language, feed name, product count, source feed type, and note presence.
- Do not include review note body, raw metadata, account ids, tokens, tracking parameters, provider payloads, CSV output, file writes, application submission, or account-manager automation.

## Task 1: Markdown Report Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_application_cohort_markdown_test.exs`

- [ ] **Step 1: Add failing tests**

Use `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Seed shortlisted and pending CJ candidates plus one non-CJ shortlisted candidate.

Cover:

- default output starts with `# CJ Application Cohort` and includes a Markdown table header;
- only shortlisted CJ candidates appear by default;
- `--country US --currency USD --language EN --min-product-count 10000` keeps only candidates matching all filters;
- `--limit 1` prints one data row;
- `--require-candidates` raises `no CJ application cohort candidates found` when filters remove every row;
- output includes `review_note_present` but not the review note body;
- output never includes raw metadata, token markers, account id markers, tracking markers, or provider payload markers.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_application_cohort_markdown_test.exs
```

Expected: fail because the task does not exist yet.

## Task 2: Markdown Report Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_application_cohort_markdown.ex`

- [ ] **Step 1: Add task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjApplicationCohortMarkdown` with:

- `use Mix.Task`;
- aliases for `ProductCompare.Ingestion`, `ProductCompare.MixTasks.RepoOnlyStartup`, `ProductCompare.Repo`, and `ProductCompareWeb.GraphQL.GlobalId`;
- `@shortdoc "Reports shortlisted CJ application cohort as Markdown"`.

- [ ] **Step 2: Parse filters**

Normalize:

- `country`, `currency`, and `language` to uppercase when present;
- `min_product_count` to a non-negative integer when present;
- `limit` to positive integer, default `25`, clamp to `100`;
- `require_candidates` to boolean.

- [ ] **Step 3: Query and filter candidates**

Use:

```elixir
Ingestion.list_merchant_feed_candidates_query(
  review_status: "shortlisted",
  sort: :fit_score_desc
)
```

Fetch with `Repo.all/1`, then apply optional report filters in memory. Keep the task read-only.

- [ ] **Step 4: Render Markdown**

Render:

```markdown
# CJ Application Cohort

count=2

| Candidate | Advertiser | Advertiser ID | Country | Currency | Language | Feed | Products | Feed Type | Review Note |
| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| MerchantFeedCandidate:abc | Trail Merchant | adv-1 | US | USD | EN | Trail Feed | 12000 | SHOPPING | present |
```

Escape pipe characters in rendered values as `\|`. Use empty strings for nil fields.

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_application_cohort_markdown_test.exs
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
git add lib/mix/tasks/product_compare.ingestion.cj_application_cohort_markdown.ex test/mix/tasks/product_compare_ingestion_cj_application_cohort_markdown_test.exs docs/work/product-data-scraping.md
git commit -m "feat: report CJ application cohort markdown"
```

## Exit Condition

This row is complete when the Markdown report tests, `mix typecheck`, and `git diff --check` pass, and the lane doc records that the report is read-only, non-secret, and not a CSV export.
