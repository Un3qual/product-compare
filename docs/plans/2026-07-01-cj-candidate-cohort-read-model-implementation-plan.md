# CJ Candidate Cohort Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Elixir read model that summarizes the current CJ feed-candidate review cohort for later UI and operator surfaces.

**Architecture:** Keep `merchant_feed_candidates` as the source of truth and add one standalone query module that returns CJ-only aggregate counts plus the highest-fit shortlisted candidates. This creates no Mix task, no GraphQL field, no browser route, and no mutation path.

**Tech Stack:** Elixir, Ecto, ExUnit.

**Status:** retained follow-up. This plan is not a live dispatch row unless `docs/work/index.md` promotes it.

---

## Parallel Ownership

Owned paths:

- Create: `lib/product_compare/ingestion/cj_candidate_cohort.ex`
- Create: `test/product_compare/ingestion/cj_candidate_cohort_test.exs`
- Modify: `docs/work/product-data-scraping.md` under `### Candidate Cohort Evidence` only

Reference only:

- `lib/product_compare/ingestion.ex`
- `lib/product_compare_schemas/ingestion/merchant_feed_candidate.ex`
- `test/product_compare/ingestion/ingestion_test.exs`
- `test/product_compare/ingestion/source_health_test.exs`

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, `docs/plans/INDEX.md`, or other retained CJ read-model plan files.

## Scope And Guardrails

- Include only rows where `provider == "cj"`.
- Return review-status counts for `pending`, `shortlisted`, `dismissed`, and `total`, zero-filled when a status has no rows.
- Return top shortlisted CJ candidates ordered by the current fit-score contract.
- Use the same fit-score thresholds as `ProductCompare.Ingestion.list_merchant_feed_candidates_query(sort: :fit_score_desc)`: product count `>= 10000` gives 50, `>= 1000` gives 35, `>= 100` gives 20, `> 0` gives 10, US gives 20, USD gives 15, EN gives 10, and present `source_feed_type` gives 5.
- Preserve tiebreakers: fit score desc, `last_seen_at` desc, `advertiser_name` asc, `feed_name` asc, `provider_feed_id` asc, `id` asc.
- Expose only review-safe fields: candidate id, provider/feed ids, advertiser id/name/country, feed name/type, product count, currency, language, review fields, timestamps, and derived `fit_score`.
- Do not expose `raw_metadata`, credentials, account ids, tokens, tracking params, provider payloads, source artifact payloads, import queries, or provider error payloads.
- Do not mutate candidate rows, call CJ, create import runs, add scheduler behavior, add a Mix task, add GraphQL, or add UI.

## Expected API

Implement `ProductCompare.Ingestion.CJCandidateCohort.summary/1` with keyword options.

Return shape:

```elixir
%{
  review_status_counts: %{
    pending: non_neg_integer(),
    shortlisted: non_neg_integer(),
    dismissed: non_neg_integer(),
    total: non_neg_integer()
  },
  top_shortlisted_candidates: [
    %{
      id: pos_integer(),
      provider: "cj",
      provider_feed_id: String.t(),
      advertiser_id: String.t() | nil,
      advertiser_name: String.t() | nil,
      advertiser_country: String.t() | nil,
      source_feed_type: String.t() | nil,
      currency: String.t() | nil,
      language: String.t() | nil,
      feed_name: String.t() | nil,
      product_count: non_neg_integer() | nil,
      review_status: "shortlisted",
      review_note: String.t() | nil,
      reviewed_at: DateTime.t() | nil,
      provider_last_updated_at: DateTime.t() | nil,
      last_seen_at: DateTime.t(),
      inserted_at: DateTime.t(),
      updated_at: DateTime.t(),
      fit_score: non_neg_integer()
    }
  ],
  limit: pos_integer()
}
```

Options:

- `limit`: default `10`; accept integers and integer strings; invalid values fall back to `10`; clamp to `1..50`.

## Tasks

### Task 1: Red Tests

- [ ] Create `test/product_compare/ingestion/cj_candidate_cohort_test.exs` using `ProductCompare.DataCase, async: true`.
- [ ] Add local fixtures:
  - `source_fixture(attrs \\ %{})` using `ProductCompareSchemas.Specs.Source.changeset/2`.
  - `merchant_feed_candidate_fixture(source, attrs \\ %{})` using `ProductCompare.Ingestion.upsert_merchant_feed_candidate/2`.
- [ ] Add a test that seeds CJ `pending`, `shortlisted`, and `dismissed` rows plus a non-CJ shortlisted row. Assert counts include only CJ rows.
- [ ] In the same test, seed shortlisted CJ rows with scores 85, 65, and 55 plus a higher-scoring non-CJ row. Assert top shortlisted ids are returned in CJ-only fit-score order.
- [ ] Add a tiebreaker assertion with two same-score shortlisted CJ rows where newer `last_seen_at` wins.
- [ ] Add a limit normalization test covering default `10`, string `"2"`, low clamp `0 -> 1`, high clamp `100 -> 50`, and invalid string fallback to `10`.
- [ ] Add a safe-field regression test with `raw_metadata` containing token/account/tracking-looking values. Assert returned candidate map keys do not include `:raw_metadata`, `:credentials`, `:account_id`, `:tracking_params`, `:query`, or `:provider_payload`.
- [ ] Add a read-only regression test that captures a candidate before and after `summary/1` and asserts `review_status`, `review_note`, `reviewed_at`, and `raw_metadata` are unchanged.
- [ ] Run:

```bash
mix test test/product_compare/ingestion/cj_candidate_cohort_test.exs
```

Expected: compile failure or `UndefinedFunctionError` because `ProductCompare.Ingestion.CJCandidateCohort.summary/1` does not exist yet.

### Task 2: Read Model Implementation

- [ ] Create `lib/product_compare/ingestion/cj_candidate_cohort.ex`.
- [ ] Define `ProductCompare.Ingestion.CJCandidateCohort` with a module doc stating it is a safe read-only CJ candidate cohort read model.
- [ ] Import `Ecto.Query` and alias `ProductCompare.Repo` plus `ProductCompareSchemas.Ingestion.MerchantFeedCandidate`.
- [ ] Implement `summary(opts \\ [])` by normalizing `limit`, querying review-status counts, querying top shortlisted candidates, and returning the exact map shape above.
- [ ] Select explicit safe map fields in the shortlisted query instead of loading full schema structs; the query must not select `raw_metadata`.
- [ ] Keep the fit-score expression private in this module and match the existing `:fit_score_desc` formula exactly.
- [ ] Keep all helpers private except `summary/1`.
- [ ] Run:

```bash
mix test test/product_compare/ingestion/cj_candidate_cohort_test.exs
```

Expected: all focused cohort tests pass.

### Task 3: Evidence And Final Gates

- [ ] Update `docs/work/product-data-scraping.md` only under `### Candidate Cohort Evidence`.
- [ ] Record what changed, red verification, green focused test result, and final gate results.
- [ ] Explicitly note that no Mix task, GraphQL/browser route, mutation path, CJ network call, or raw metadata exposure was added.
- [ ] Run:

```bash
mix format --check-formatted
mix typecheck
git diff --check
```

Expected: all commands exit 0.

## Commit Guidance

Make one milestone commit after code, tests, lane evidence, and verification pass.

```bash
git add lib/product_compare/ingestion/cj_candidate_cohort.ex test/product_compare/ingestion/cj_candidate_cohort_test.exs docs/work/product-data-scraping.md
git commit -m "feat: add CJ candidate cohort read model"
```

Do not make a standalone checkbox-only or docs-only progress commit for this implementation.

## Blocker Rules

- If implementation requires editing `ProductCompare.Ingestion`, adding a Mix task, adding GraphQL, adding UI, or exposing raw metadata, stop and record the blocker under `### Candidate Cohort Evidence`.
- If the existing fit-score formula has changed, mirror the current formula in this read model and call out drift in the evidence note.
- If the live queue has not promoted this retained row, do not implement it from this plan alone.

## Exit Condition

The read model is complete when focused tests prove safe CJ-only cohort counts, fit-score-ordered shortlisted candidates, limit clamping, safe returned keys, and read-only behavior, with lane evidence recorded and final Elixir gates passing.
