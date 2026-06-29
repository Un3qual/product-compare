# CJ Run Throughput Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Elixir read model that aggregates CJ run throughput by day and surface.

**Architecture:** Keep run-history aggregation separate from latest-health reporting so it can be implemented in parallel. The module reads `ingestion_runs`, groups by date and surface, and returns counts only.

**Tech Stack:** Elixir, Ecto, ExUnit.

**Status:** retained follow-up. This plan is retained behind the 2026-06-29 usable-product queue and is not a live dispatch row unless `docs/work/index.md` promotes it again.

---

## Parallel Ownership

Owned paths:

- `lib/product_compare/ingestion/cj_run_throughput.ex`
- `test/product_compare/ingestion/cj_run_throughput_test.exs`
- `docs/work/product-data-scraping.md` under `### Run Throughput Evidence` only

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Aggregate CJ `ingestion_runs` by UTC date and surface.
- Sum pages fetched, records fetched, records normalized, records persisted, and records failed.
- Count succeeded and failed runs per bucket.
- Support `days: 14` default, clamped to `1..90`.
- Do not include raw queries, raw errors, credentials, or provider payloads.

## Tasks

- [ ] Add failing tests that seed runs across two dates and both CJ surfaces, plus non-CJ runs that must be ignored.
- [ ] Create `ProductCompare.Ingestion.CJRunThroughput` with `daily_summary/1` plus `daily_summary/2` where the second argument injects `now` for deterministic date windows.
- [ ] Implement date-window filtering against `started_at`.
- [ ] Return buckets ordered by date descending, then surface ascending.
- [ ] Run `mix test test/product_compare/ingestion/cj_run_throughput_test.exs`.
- [ ] Run `mix format --check-formatted`, `mix typecheck`, and `git diff --check`.

## Exit Condition

The work item is complete when daily CJ run-throughput aggregates are covered by focused tests and remain read-only.
