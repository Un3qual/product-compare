# CJ Shortlist Cohort Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the operator a manual, non-secret export of reviewed CJ feed candidates for merchant application planning.

**Architecture:** Add a read-only Mix task that queries `merchant_feed_candidates` directly and prints CSV to stdout. The task does not contact CJ, submit applications, mutate review status, schedule discovery, or expose raw provider metadata.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-26 parallel CJ candidate planning batch.

---

## Parallel Ownership

This row may run in parallel with the ranking-contract and review-workspace rows.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_candidate_export.ex`
- `test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs`
- `docs/work/product-data-scraping.md` under the shortlist-export evidence heading only

Do not edit:

- `lib/product_compare/ingestion.ex`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_candidate_export`.
- Default to `--status shortlisted`.
- Accept `--status pending`, `--status shortlisted`, or `--status dismissed`.
- Print CSV to stdout with this header:

```text
provider,provider_feed_id,advertiser_id,advertiser_name,advertiser_country,currency,language,feed_name,product_count,review_note,last_seen_at
```

- Escape CSV values containing commas, quotes, or newlines.
- Exclude `raw_metadata`, CJ credentials, publisher account ids, tokens, tracking parameters, and live network data.
- Do not write files; operators can redirect stdout if they need a local artifact.

## Task 1: Mix Task Contract

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs`

- [ ] **Step 1: Add failing export tests**

Create tests using `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Cover:

- default export includes only shortlisted candidates;
- `--status pending` includes only pending candidates;
- CSV values with commas and quotes are escaped;
- output does not include `raw_metadata` keys or values.

Use inserted candidates through `ProductCompare.Ingestion.upsert_merchant_feed_candidate/2` and set statuses through `ProductCompare.Ingestion.review_merchant_feed_candidate/2`. Store a raw metadata marker like `%{"secret_marker" => "do-not-print"}` and assert the output does not contain either string.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs
```

Expected: fail because the Mix task does not exist.

## Task 2: Export Implementation

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_candidate_export.ex`

- [ ] **Step 1: Add task module**

Create:

```elixir
defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidateExport do
  @moduledoc "Exports reviewed CJ feed candidates as non-secret CSV."

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Exports reviewed CJ feed candidates"
  @allowed_statuses ~w(pending shortlisted dismissed)
  @columns [
    :provider,
    :provider_feed_id,
    :advertiser_id,
    :advertiser_name,
    :advertiser_country,
    :currency,
    :language,
    :feed_name,
    :product_count,
    :review_note,
    :last_seen_at
  ]
```

- [ ] **Step 2: Parse status option**

Add `run/1` with `Mix.Task.run("app.start")`, parse `--status`, default to `shortlisted`, and raise on invalid statuses:

```elixir
def run(argv) do
  Mix.Task.run("app.start")

  argv
  |> parse_argv()
  |> export_candidates()
  |> IO.write()
end
```

`parse_argv/1` should return `%{status: "shortlisted"}` by default and `Mix.raise("invalid review status: #{status}")` unless status is in `@allowed_statuses`.

- [ ] **Step 3: Query candidates directly**

Use a direct Ecto query so this row does not edit `ProductCompare.Ingestion`:

```elixir
defp candidates_for_status(status) do
  MerchantFeedCandidate
  |> where([candidate], candidate.provider == "cj")
  |> where([candidate], candidate.review_status == ^status)
  |> order_by([candidate],
    asc: candidate.advertiser_name,
    asc: candidate.feed_name,
    asc: candidate.provider_feed_id,
    asc: candidate.id
  )
  |> Repo.all()
end
```

- [ ] **Step 4: Render safe CSV**

Build the header from `@columns`, convert `DateTime` values with `DateTime.to_iso8601/1`, stringify integers, render nil as empty, and escape fields by doubling quotes and wrapping fields that contain comma, quote, carriage return, or newline.

Do not inspect or render `candidate.raw_metadata`.

- [ ] **Step 5: Verify export slice**

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs
mix typecheck
git diff --check
```

Expected: all pass.

- [ ] **Step 6: Commit export slice**

```bash
git add lib/mix/tasks/product_compare.ingestion.cj_candidate_export.ex test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs docs/work/product-data-scraping.md
git commit -m "feat: export CJ feed candidate shortlist"
```

## Exit Condition

This row is complete when the export task test, typecheck, and diff check pass, and the shortlist-export evidence heading in `docs/work/product-data-scraping.md` records the exact commands.
