# CJ Run Health Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Elixir read model that summarizes latest CJ import and feed-discovery run health.

**Architecture:** Query `ingestion_runs` directly in a new module and return safe health data for `shoppingProducts` and `shoppingProductFeeds`. This work item creates no Mix task, scheduler, GraphQL field, or UI.

**Tech Stack:** Elixir, Ecto, ExUnit.

**Status:** retained follow-up. This plan is retained behind the 2026-06-29 usable-product queue and is not a live dispatch row unless `docs/work/index.md` promotes it again.

---

## Parallel Ownership

Owned paths:

- `lib/product_compare/ingestion/cj_run_health.ex`
- `test/product_compare/ingestion/cj_run_health_test.exs`
- `docs/work/product-data-scraping.md` under `### Run Health Evidence` only

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Return latest run per CJ surface: `shoppingProducts` and `shoppingProductFeeds`.
- Include status, started/finished timestamps, cursor bounds, page and record counts, and a boolean `successful`.
- Include only a boolean `has_error_summary` or a redacted/truncated error category; do not return raw stored `error_summary`, provider error bodies, or query maps.
- Include `missing` when a surface has no recorded run.

## Tasks

- [ ] Add failing tests that seed succeeded and failed CJ runs plus a non-CJ run; assert latest-by-started-at selection and safe fields.
- [ ] Create `ProductCompare.Ingestion.CJRunHealth` with `summary/0`.
- [ ] Implement one query per surface or a grouped query that never returns raw `query` payloads.
- [ ] Add tests proving an empty database returns missing health entries instead of raising.
- [ ] Run `mix test test/product_compare/ingestion/cj_run_health_test.exs`.
- [ ] Run `mix format --check-formatted`, `mix typecheck`, and `git diff --check`.

## Exit Condition

The work item is complete when the read model reports latest CJ run health safely and deterministically from persisted runs.
