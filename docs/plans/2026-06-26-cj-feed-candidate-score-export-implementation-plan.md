# CJ Feed Candidate Score Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add non-secret fit-score evidence to the manual CJ feed candidate CSV export.

**Architecture:** Keep this row isolated to the existing read-only Mix export task. Compute an operator-facing fit score and reason string from exported candidate fields, print both in CSV, and avoid shared code changes so this row can run in parallel with backend sorting and frontend display work.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-26 broader CJ candidate scoring parallel batch.

---

## Parallel Ownership

This row may run in parallel with the fit-score-sort and frontend-score-badges rows.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_candidate_export.ex`
- `test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs`
- `docs/work/product-data-scraping.md` under the score-export evidence heading only

Do not edit:

- `lib/product_compare/ingestion.ex`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add two CSV columns after `product_count`:
  - `fit_score`;
  - `fit_reasons`.
- Use the same documented scoring rule as the backend sort plan:
  - product count: `>= 10000` gives 50 points, `>= 1000` gives 35 points, `>= 100` gives 20 points, `> 0` gives 10 points, otherwise 0;
  - `advertiser_country == "US"` gives 20 points after uppercase normalization;
  - `currency == "USD"` gives 15 points after uppercase normalization;
  - `language == "EN"` gives 10 points after uppercase normalization;
  - any non-empty `source_feed_type` gives 5 points.
- Render reasons as a semicolon-separated string in this order: product-count reason, US market, USD, English, feed type present.
- Add `--sort score|name`; default to `score`.
- Keep `--status pending|shortlisted|dismissed`; default stays `shortlisted`.
- Never print `raw_metadata`, credentials, account IDs, tokens, tracking parameters, or live provider payloads.
- Do not contact CJ, mutate review status, submit merchant applications, write files, or change GraphQL/frontend code.

## Task 1: Export Contract Tests

**Files:**

- Modify: `test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs`

- [ ] **Step 1: Add failing score column coverage**

Add tests proving:

- the default header is:

```text
provider,provider_feed_id,advertiser_id,advertiser_name,advertiser_country,currency,language,feed_name,product_count,fit_score,fit_reasons,review_note,last_seen_at
```

- a shortlisted candidate with `product_count: 5000`, `advertiser_country: "US"`, `currency: "USD"`, `language: "EN"`, and `source_feed_type: "PRODUCT"` renders `85`;
- `fit_reasons` renders a deterministic value such as `1000+ products;US market;USD;English;feed type present`;
- a low-fit candidate renders a lower score and appears after the high-fit candidate by default;
- `--sort name` preserves name/feed/provider/id ordering;
- raw metadata markers such as `secret_marker` and `do-not-print` are absent.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs
```

Expected: fail because the task has no score columns or sort option.

## Task 2: Export Score Rendering

**Files:**

- Modify: `lib/mix/tasks/product_compare.ingestion.cj_candidate_export.ex`

- [ ] **Step 1: Extend columns and option parsing**

Insert `:fit_score` and `:fit_reasons` after `:product_count` in the rendered columns. Keep the existing persisted-field columns as atoms, and render the computed columns by name in `render_candidate/1`.

Parse a new string switch:

```elixir
switches: [
  status: :string,
  sort: :string
]
```

Accept only `"score"` and `"name"`. Raise with `Mix.raise("invalid sort: #{sort}")` for any other value.

- [ ] **Step 2: Add local scoring helpers**

Add local private helpers in the Mix task:

```elixir
defp fit_score(%MerchantFeedCandidate{} = candidate) do
  product_count_points(candidate.product_count) +
    exact_field_points(candidate.advertiser_country, "US", 20) +
    exact_field_points(candidate.currency, "USD", 15) +
    exact_field_points(candidate.language, "EN", 10) +
    source_feed_type_points(candidate.source_feed_type)
end
```

Use matching helpers for reasons so the score and reason text stay deterministic. Return an empty reason only when no score inputs match.

- [ ] **Step 3: Sort candidates without changing the query scope**

Keep the existing Ecto query filtered to CJ candidates and review status. Order by name in SQL as a stable base, then sort in memory when `sort == "score"`:

```elixir
Enum.sort_by(candidates, fn candidate ->
  {-fit_score(candidate), -last_seen_unix(candidate.last_seen_at), candidate.advertiser_name || "", candidate.feed_name || "", candidate.provider_feed_id || "", candidate.id}
end)
```

Implement `last_seen_unix/1` so nil timestamps normalize to `0` and `%DateTime{}` values use `DateTime.to_unix/1`.

- [ ] **Step 4: Render computed columns safely**

Update `render_candidate/1` so `:fit_score` renders `Integer.to_string(fit_score(candidate))` and `:fit_reasons` renders the semicolon-separated reasons. Keep CSV escaping unchanged.

Do not inspect, encode, or render `candidate.raw_metadata`.

- [ ] **Step 5: Verify the export slice**

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs
mix typecheck
git diff --check
```

Expected: all pass.

- [ ] **Step 6: Commit the export score slice**

```bash
git add lib/mix/tasks/product_compare.ingestion.cj_candidate_export.ex test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs docs/work/product-data-scraping.md
git commit -m "feat: export CJ candidate fit scores"
```

## Exit Condition

This row is complete when the export task tests, `mix typecheck`, and `git diff --check` pass, and the score-export evidence heading in `docs/work/product-data-scraping.md` records the exact commands.
