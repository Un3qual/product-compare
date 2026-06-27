# CJ Run Health Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Elixir read model that summarizes latest CJ import and feed-discovery run health.

**Architecture:** Query `ingestion_runs` directly in a new module and return safe health data for `shoppingProducts` and `shoppingProductFeeds`. This work item creates no Mix task, scheduler, GraphQL field, or UI.

**Tech Stack:** Elixir, Ecto, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 parallel CJ work-item planning batch.

---

## Parallel Ownership

Owned paths:

- `lib/product_compare/ingestion/cj_run_health.ex`
- `test/product_compare/ingestion/cj_run_health_test.exs`
- `docs/work/product-data-scraping.md` under the run-health evidence heading only

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Return latest run per CJ surface: `shoppingProducts` and `shoppingProductFeeds`.
- Include status, started/finished timestamps, cursor bounds, page and record counts, and a boolean `successful`.
- Include safe `error_summary` only; do not return raw provider error bodies or query maps.
- Include `missing` when a surface has no recorded run.

## Tasks

- [ ] Add failing tests that seed succeeded and failed CJ runs plus a non-CJ run; assert latest-by-started-at selection and safe fields.
- [ ] Create `ProductCompare.Ingestion.CJRunHealth` with `summary/0`.
- [ ] Implement one query per surface or a grouped query that never returns raw `query` payloads.
- [ ] Add tests proving an empty database returns missing health entries instead of raising.
- [ ] Run `mix test test/product_compare/ingestion/cj_run_health_test.exs`.
- [ ] Run `mix typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when the read model reports latest CJ run health safely and deterministically from persisted runs.
