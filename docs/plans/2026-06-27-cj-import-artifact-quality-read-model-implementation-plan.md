# CJ Import Artifact Quality Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Elixir read model that summarizes artifact and external-product quality for persisted CJ product imports.

**Architecture:** Query existing `sources`, `source_artifacts`, and `external_products` rows through a standalone module. Return counts and timestamps only so raw artifact payloads remain hidden.

**Tech Stack:** Elixir, Ecto, ExUnit.

**Status:** retained follow-up. This plan is retained behind the 2026-06-29 usable-product queue and is not a live dispatch row unless `docs/work/index.md` promotes it again.

---

## Parallel Ownership

Owned paths:

- `lib/product_compare/ingestion/cj_import_artifact_quality.ex`
- `test/product_compare/ingestion/cj_import_artifact_quality_test.exs`
- `docs/work/product-data-scraping.md` under `### Import Artifact Quality Evidence` only

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Find the CJ source by name/domain and summarize persisted artifacts and external products.
- Use read-only source lookup logic; do not call `ProductCompare.Ingestion.Sources.CJ.SourceResolver.fetch_source/0` or any helper that inserts or updates sources.
- Return artifact count, external product count, linked external product count, unlinked external product count, latest artifact fetched timestamp, and latest external product seen timestamp.
- Do not return `raw_json`, artifact URLs, query payloads, credentials, or account-sensitive values.
- Return zero counts when the CJ source is missing.

## Tasks

- [ ] Add failing tests for missing source, persisted artifacts, linked external products, and unlinked external products.
- [ ] Create `ProductCompare.Ingestion.CJImportArtifactQuality` with `summary/0`.
- [ ] Use aggregate queries instead of loading raw artifact rows into memory.
- [ ] Add a regression test proving returned map keys exclude `raw_json` and `url`.
- [ ] Run `mix test test/product_compare/ingestion/cj_import_artifact_quality_test.exs`.
- [ ] Run `mix format --check-formatted`, `mix typecheck`, and `git diff --check`.

## Exit Condition

The work item is complete when safe aggregate quality metrics are available for persisted CJ import artifacts and external products.
