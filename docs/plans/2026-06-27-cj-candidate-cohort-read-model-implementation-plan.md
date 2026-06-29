# CJ Candidate Cohort Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Elixir read model that summarizes the current CJ feed-candidate review cohort for later UI and operator surfaces.

**Architecture:** Keep the existing `merchant_feed_candidates` table as the source of truth and add a new query module that returns safe aggregate data plus the highest-fit shortlisted candidates. This work item creates no Mix task, no GraphQL field, and no browser route.

**Tech Stack:** Elixir, Ecto, ExUnit.

**Status:** retained follow-up. This plan is retained behind the 2026-06-29 usable-product queue and is not a live dispatch row unless `docs/work/index.md` promotes it again.

---

## Parallel Ownership

Owned paths:

- `lib/product_compare/ingestion/cj_candidate_cohort.ex`
- `test/product_compare/ingestion/cj_candidate_cohort_test.exs`
- `docs/work/product-data-scraping.md` under `### Candidate Cohort Evidence` only

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Return counts for pending, shortlisted, and dismissed CJ candidates.
- Return the top shortlisted candidates using the same fit-score formula already used by backend ordering and the route.
- Expose only review-safe fields: ids, provider/feed ids, advertiser display fields, product count, market fields, feed type, review fields, and timestamps.
- Do not expose `raw_metadata`, credentials, account ids, tracking parameters, or provider payloads.
- Do not mutate candidate rows.

## Tasks

- [ ] Add failing tests that seed CJ and non-CJ candidates, assert only `provider: "cj"` rows are included, assert review-status counts, assert top shortlisted candidate order by fit score, and assert returned maps do not include `raw_metadata`.
- [ ] Create `ProductCompare.Ingestion.CJCandidateCohort` with `summary/1`, default `limit: 10`, and a bounded positive integer limit clamp of `1..50`.
- [ ] Implement a private fit-score expression matching the existing `ProductCompare.Ingestion.list_merchant_feed_candidates_query(sort: :fit_score_desc)` thresholds: product count `>= 10000` gives 50 points, `>= 1000` gives 35, `>= 100` gives 20, `> 0` gives 10, US gives 20, USD gives 15, EN gives 10, and present feed type gives 5.
- [ ] Keep return data as plain maps with atom keys suitable for later resolver or UI work.
- [ ] Run `mix test test/product_compare/ingestion/cj_candidate_cohort_test.exs`.
- [ ] Run `mix format --check-formatted`, `mix typecheck`, and `git diff --check`.

## Exit Condition

The read model is complete when focused tests prove safe CJ-only cohort counts and top-shortlist ordering, with no Mix task or browser surface added.
