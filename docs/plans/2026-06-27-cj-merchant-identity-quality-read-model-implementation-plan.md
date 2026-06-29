# CJ Merchant Identity Quality Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Elixir read model that highlights CJ merchant identity quality issues before application or ingestion expansion.

**Architecture:** Query existing `merchant_source_identities` for the CJ source and report aggregate completeness and duplicate-risk signals. This work item creates no migrations, Mix task, GraphQL field, or UI.

**Tech Stack:** Elixir, Ecto, ExUnit.

**Status:** ready. This plan is selected for the 2026-06-29 next ten-batch CJ read-model/operator queue.

---

## Parallel Ownership

Owned paths:

- `lib/product_compare/ingestion/cj_merchant_identity_quality.ex`
- `test/product_compare/ingestion/cj_merchant_identity_quality_test.exs`
- `docs/work/product-data-scraping.md` under `### Merchant Identity Quality Evidence` only

Do not edit `lib/mix/tasks/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/**`, `assets/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Count CJ merchant identities.
- Count identities missing merchant name or merchant domain. Do not add a missing `merchant_id` metric because the current schema and migration require a linked merchant.
- Count duplicate normalized domains and duplicate normalized merchant names.
- Return limited examples for duplicate domains/names with non-secret ids and display names only.
- Do not mutate identities or merchants.

## Tasks

- [ ] Add failing tests for missing source, complete identities, missing name/domain fields, duplicate domains, duplicate names, and non-CJ identities that must be ignored.
- [ ] Create `ProductCompare.Ingestion.CJMerchantIdentityQuality` with `summary/1`, default duplicate example limit `5`, clamped to `1..25`.
- [ ] Normalize duplicate keys by trimming and downcasing strings; ignore nil and blank values.
- [ ] Return aggregate counts and bounded examples only.
- [ ] Run `mix test test/product_compare/ingestion/cj_merchant_identity_quality_test.exs`.
- [ ] Run `mix format --check-formatted`, `mix typecheck`, and `git diff --check`.

## Exit Condition

The work item is complete when identity quality metrics are tested and safe for later operator display.
