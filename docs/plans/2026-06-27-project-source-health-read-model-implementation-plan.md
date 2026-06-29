# Source Health Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a provider-neutral ingestion source health read model that summarizes source artifacts and import runs without exposing raw payloads.

**Architecture:** Build a standalone context module over existing `sources`, `source_artifacts`, and `ingestion_runs`. This is intentionally provider-neutral so product-data work is represented without making the cross-project queue CJ-only.

**Tech Stack:** Elixir, Ecto, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 cross-project parallel work-item batch.

---

## Parallel Ownership

Owned paths:

- `lib/product_compare/ingestion/source_health.ex`
- `test/product_compare/ingestion/source_health_test.exs`
- `docs/work/product-data-scraping.md`

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Return one health row per source with source id, source kind, source name, source domain, artifact count, latest artifact fetched timestamp, latest import-run status, latest import-run finished timestamp, and recent failed-run count.
- Support `recent_failure_hours`, default `168`, clamped to `1..720`.
- Do not expose `SourceArtifact.raw_json`, artifact URLs, import `query`, credentials, account ids, tracking params, or provider error payloads.
- Do not mutate rows, call external providers, add a Mix task, add GraphQL, or add UI.

## Tasks

- [ ] Add failing tests for sources with artifacts, successful runs, failed runs inside and outside the recent window, and sources with no activity.
- [ ] Create `ProductCompare.Ingestion.SourceHealth` with `summary/1` and `summary/2` where the second argument can inject `now` for deterministic tests.
- [ ] Use aggregate queries instead of loading raw artifact payloads.
- [ ] Add a regression assertion that returned maps exclude raw artifact and run query fields.
- [ ] Run `mix test test/product_compare/ingestion/source_health_test.exs`.
- [ ] Run `mix typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when source-level ingestion health is available as safe provider-neutral aggregate data with focused tests.
