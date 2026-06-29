# CJ Import Price Quality Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Elixir read model that reports price coverage for products imported from CJ.

**Architecture:** Query existing merchant identities, merchant products, and price points without adding persistence. The module returns aggregate coverage data for imported CJ-linked merchants only.

**Tech Stack:** Elixir, Ecto, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 parallel CJ work-item planning batch.

---

## Parallel Ownership

Owned paths:

- `lib/product_compare/ingestion/cj_import_price_quality.ex`
- `test/product_compare/ingestion/cj_import_price_quality_test.exs`
- `docs/work/product-data-scraping.md` under the import-price-quality evidence heading only

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Count CJ-linked merchant products.
- Count merchant products with at least one price point and without any price point.
- Count active and inactive merchant products.
- Count currencies across CJ-linked merchant products, using `unknown` for nil or blank currency.
- Support a freshness threshold for latest prices, default `stale_price_hours: 168`.
- Do not expose URLs, raw artifacts, tracking parameters, or provider payloads.

## Tasks

- [ ] Add failing tests that seed CJ merchant identities, merchant products, price points, stale prices, and unrelated non-CJ merchant products.
- [ ] Create `ProductCompare.Ingestion.CJImportPriceQuality` with `summary/1` and injectable `now` for deterministic stale-price tests.
- [ ] Use source-scoped merchant identities to select CJ-linked merchant products.
- [ ] Return aggregate counts only.
- [ ] Run `mix test test/product_compare/ingestion/cj_import_price_quality_test.exs`.
- [ ] Run `mix typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when tested price-coverage metrics exist for CJ-linked imported offers without adding UI or commands.
