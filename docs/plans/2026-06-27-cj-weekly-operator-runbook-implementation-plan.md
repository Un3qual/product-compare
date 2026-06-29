# CJ Weekly Operator Runbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repo runbook for the weekly CJ review loop using existing commands, read models, and guardrails.

**Architecture:** This is a docs-only work item for the workflow system itself. It does not create Mix tasks, code, scheduler behavior, GraphQL fields, UI, files outside docs, or CSV exports.

**Tech Stack:** Markdown, existing repo verification.

**Status:** retained follow-up. This plan is retained behind the 2026-06-29 usable-product queue and is not a live dispatch row unless `docs/work/index.md` promotes it again.

---

## Parallel Ownership

Owned paths:

- `docs/runbooks/cj-weekly-operator-loop.md`
- `docs/work/product-data-scraping.md` under `### Weekly Operator Runbook Evidence` only

Do not edit `lib/**`, `assets/**`, `docs/work/index.md`, `docs/plans/INDEX.md`, or existing plan docs.

## Scope

- Document prerequisite env vars by name only: `CJ_API_TOKEN`, `CJ_ACCOUNT_ID`, and optional `CJ_PROPERTY_ID`.
- Document safe commands already present in the repo for credential checks, discovery/import status, readiness, history, failed runs, candidate review, and application cohort Markdown.
- Document the manual decision loop: check readiness, inspect freshness/run health, review candidates, update shortlist/dismiss decisions, inspect application readiness, then explicitly stop before application submission.
- Document rejected/deferred work: no CJ candidate CSV score export, no application submission automation, no account-manager contact automation, no credential persistence, and no Tier-3 scraping.
- Include a troubleshooting section for missing env vars, stale runs, zero candidates, and failed runs.

## Tasks

- [ ] Create `docs/runbooks/cj-weekly-operator-loop.md` with sections: purpose, prerequisites, weekly flow, commands, decision records, troubleshooting, and hard guardrails.
- [ ] Use only command names that exist in `lib/mix/tasks/**`; verify names with `mix help | rg 'product_compare.ingestion.cj_'` or direct file inspection.
- [ ] Add a lane-doc evidence note that the runbook is docs-only and creates no new execution surface.
- [ ] Run `rg -n "T[O]DO|T[B]D|CJ candidate CSV score export is all[ow]ed|CJ_API_TOKEN=[^[:space:]]+|CJ_ACCOUNT_ID=[^[:space:]]+" docs/runbooks/cj-weekly-operator-loop.md` and verify it exits 1 with no placeholder or secret-value matches.
- [ ] Run `git diff --check`.

## Exit Condition

The work item is complete when the runbook gives exact existing operator commands and guardrails without adding code or reopening rejected export/application work.
