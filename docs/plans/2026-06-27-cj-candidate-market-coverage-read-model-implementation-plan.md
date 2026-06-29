# CJ Candidate Market Coverage Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Elixir read model that reports CJ feed-candidate market coverage by country, currency, language, and feed type.

**Architecture:** Build a standalone query module over `merchant_feed_candidates` so later coordinator work can decide which candidate markets are worth application effort. This work item creates no Mix task, no GraphQL field, and no browser route.

**Tech Stack:** Elixir, Ecto, ExUnit.

**Status:** retained follow-up. This plan is retained behind the 2026-06-29 usable-product queue and is not a live dispatch row unless `docs/work/index.md` promotes it again.

---

## Parallel Ownership

Owned paths:

- `lib/product_compare/ingestion/cj_candidate_market_coverage.ex`
- `test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`
- `docs/work/product-data-scraping.md` under `### Candidate Market Coverage Evidence` only

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Count CJ candidates by `advertiser_country`, `currency`, `language`, and `source_feed_type`.
- Include `unknown` buckets for nil or blank values.
- Include total candidate count and shortlisted candidate count for each dimension.
- Support an optional `review_status` filter using existing statuses only.
- Do not expose raw metadata, account ids, credentials, or tracking parameters.

## Tasks

- [ ] Add failing tests that seed mixed-market CJ candidates, non-CJ candidates, and blank values; assert normalized buckets and CJ-only counts.
- [ ] Create `ProductCompare.Ingestion.CJCandidateMarketCoverage` with `summary/1`.
- [ ] Normalize blank strings to `"unknown"` and uppercase non-blank market codes in returned bucket keys.
- [ ] Reject unsupported review-status filters by ignoring them rather than raising.
- [ ] Run `mix test test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`.
- [ ] Run `mix format --check-formatted`, `mix typecheck`, and `git diff --check`.

## Exit Condition

The work item is complete when tests prove market coverage can be queried safely from persisted candidate rows without adding operator commands or UI.
