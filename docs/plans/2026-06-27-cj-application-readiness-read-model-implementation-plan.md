# CJ Application Readiness Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Elixir read model that identifies shortlisted CJ candidates that are ready for a manual application decision.

**Architecture:** Combine persisted candidate review status with safe candidate metadata in a standalone module. This does not submit applications, contact merchants, create affiliate programs, or write CSV files.

**Tech Stack:** Elixir, Ecto, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 parallel CJ work-item planning batch.

---

## Parallel Ownership

Owned paths:

- `lib/product_compare/ingestion/cj_application_readiness.ex`
- `test/product_compare/ingestion/cj_application_readiness_test.exs`
- `docs/work/product-data-scraping.md` under the application-readiness evidence heading only

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Consider only CJ candidates with `review_status: "shortlisted"`.
- Mark a candidate ready when it has advertiser name, advertiser id, feed id, positive product count, country `US`, currency `USD`, and language `EN`.
- Return ready candidates and blocked candidates with reason codes: `missing_advertiser`, `missing_feed_id`, `missing_product_count`, `non_us_market`, `non_usd_currency`, and `non_english_language`.
- Keep output bounded with default `limit: 25`, clamped to `1..100`.
- Do not create applications, affiliate programs, links, network records, files, Mix tasks, or GraphQL fields.

## Tasks

- [ ] Add failing tests that seed ready shortlisted candidates, blocked shortlisted candidates, pending candidates, and non-CJ candidates.
- [ ] Create `ProductCompare.Ingestion.CJApplicationReadiness` with `summary/1`.
- [ ] Return safe candidate maps and reason-code lists without `raw_metadata`.
- [ ] Sort ready candidates by product count descending, then advertiser name and feed id.
- [ ] Run `mix test test/product_compare/ingestion/cj_application_readiness_test.exs`.
- [ ] Run `mix typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when manual application readiness can be computed safely from reviewed candidates without performing application actions.
