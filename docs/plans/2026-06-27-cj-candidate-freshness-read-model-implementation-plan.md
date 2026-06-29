# CJ Candidate Freshness Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Elixir read model that buckets CJ feed candidates by freshness so operators can tell whether the review cohort is stale.

**Architecture:** Build a standalone module over persisted `last_seen_at` values and keep all output aggregate-only. This is a work item, not a Mix task; existing operator commands remain unchanged.

**Tech Stack:** Elixir, Ecto, ExUnit.

**Status:** retained follow-up. This plan is retained behind the 2026-06-29 usable-product queue and is not a live dispatch row unless `docs/work/index.md` promotes it again.

---

## Parallel Ownership

Owned paths:

- `lib/product_compare/ingestion/cj_candidate_freshness.ex`
- `test/product_compare/ingestion/cj_candidate_freshness_test.exs`
- `docs/work/product-data-scraping.md` under `### Candidate Freshness Evidence` only

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Bucket CJ candidates into `fresh`, `aging`, and `stale`.
- Defaults: `fresh_hours: 48`, `stale_hours: 168`.
- Support custom positive integer thresholds while forcing `stale_hours >= fresh_hours`.
- Return counts by bucket and by review status inside each bucket.
- Do not mutate candidates or run discovery.

## Tasks

- [ ] Add failing tests with candidates observed now, 72 hours ago, and 10 days ago; include a non-CJ row that must be ignored.
- [ ] Create `ProductCompare.Ingestion.CJCandidateFreshness` with `summary/1` and `summary/2` where the second argument can inject `now` for deterministic tests.
- [ ] Normalize invalid thresholds back to defaults and clamp `stale_hours` to at least `fresh_hours`.
- [ ] Return plain maps containing threshold values plus bucket counts.
- [ ] Run `mix test test/product_compare/ingestion/cj_candidate_freshness_test.exs`.
- [ ] Run `mix format --check-formatted`, `mix typecheck`, and `git diff --check`.

## Exit Condition

The work item is complete when tests prove deterministic aggregate freshness buckets without adding another CLI report.
