# Persistent Compare Tray Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote persistent compare tray work from follow-up candidate into one concrete live `ready` queue row.

**Architecture:** This is a coordinator-only dispatch batch. It updates the live queue and compare lane doc so the implementation worker has a complete handoff, but it does not implement compare tray behavior. The promoted row keeps compare state URL-backed through repeated `slug` params and explicitly owns the browse, detail, compare, and lane-doc files it needs.

**Tech Stack:** Markdown dispatch docs, existing Product Compare work queue conventions, React Router, React, Relay route data, Vitest, Bun.

**Status:** planned coordinator/docs workflow.

---

## Owned Paths

This coordinator plan may edit coordinator-owned docs because the deliverable is dispatch/promotion.

- Create: `docs/plans/2026-07-01-persistent-compare-tray-promotion-implementation-plan.md`
- Modify: `docs/work/index.md`
- Modify: `docs/work/frontend-product-comparison-demo-parity.md`

Do not modify frontend code, backend code, generated Relay artifacts, migrations, `docs/work/product-data-scraping.md`, or `docs/plans/INDEX.md` while executing this promotion.

## Constraints

- Promote exactly one ready row: persistent compare tray.
- Do not promote the retained CJ read-model/operator batch in the same pass.
- Do not implement persistent compare tray behavior in this coordinator pass.
- Do not add a second queue source; `docs/work/index.md` remains the only live dispatch queue.
- Do not leave persistent compare tray described as both an unpromoted follow-up and the selected ready row.
- Keep the promoted row concrete enough for a worker to start from the queue without scanning historical plans.

## Intended Ready Row

Use this row under `## Ready Work` in `docs/work/index.md`:

```text
### Persistent Compare Tray

Status: ready
Lane: Frontend product comparison demo parity (`docs/work/frontend-product-comparison-demo-parity.md`)
Active plan: `docs/plans/2026-07-01-persistent-compare-tray-implementation-plan.md`
Next action: Add a persistent compare tray across `/products` and `/products/:slug` so shoppers can see the current URL-backed compare selection, add or remove selected products from browse/detail pages, and continue to `/compare` without losing repeated `slug` param order.
Owned paths:
- `assets/src/routes/compare/paths.ts`
- `assets/src/routes/compare/selection-tray.tsx`
- `assets/src/routes/compare/index.tsx`
- `assets/src/routes/catalog/paths.ts`
- `assets/src/routes/catalog/filter-form.tsx`
- `assets/src/routes/catalog/browse.tsx`
- `assets/src/routes/products/detail.tsx`
- `assets/test/routes/compare/compare.route.test.tsx`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `assets/test/routes/products/detail.route.test.tsx`
- `docs/work/frontend-product-comparison-demo-parity.md`
- `docs/work/frontend-catalog-browse.md`
- `docs/work/frontend-product-detail.md`
Verification:
- `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
Exit condition: Browse and detail pages expose a persistent compare tray/action area that preserves repeated `slug` params in URL order, supports bounded add/remove behavior, links to `/compare`, and records completed evidence in the compare, catalog, and detail lane docs.
```

## Tasks

### Task 1: Save This Promotion Plan

**Files:**
- Create: `docs/plans/2026-07-01-persistent-compare-tray-promotion-implementation-plan.md`

- [ ] Add this plan file.
- [ ] Confirm the plan says this is a dispatch/promotion workflow, not the compare feature implementation.

### Task 2: Promote The Live Queue Row

**Files:**
- Modify: `docs/work/index.md`

- [ ] Change `Updated: 2026-06-30` to the execution date.
- [ ] Replace `No ready rows are currently selected.` under `## Ready Work` with the exact `Persistent Compare Tray` row above.
- [ ] Update the current queue summary to say persistent compare tray is now selected and retained CJ remains follow-up.
- [ ] In `## Retained Follow-Up Work`, remove the persistent compare tray candidate wording and leave the CJ retained follow-up wording intact.

### Task 3: Mirror The Active Dispatch In The Compare Lane

**Files:**
- Modify: `docs/work/frontend-product-comparison-demo-parity.md`

- [ ] Change the snapshot status from `done` to `ready (persistent compare tray promoted)`.
- [ ] Add this active promotion plan and the implementation plan to the snapshot context.
- [ ] Replace the follow-up candidate bullet for persistent compare tray with wording that says it has been promoted to the live queue.
- [ ] Add an `Active Dispatch` section that mirrors the ready row's status, owned paths, verification, and exit condition.

### Task 4: Verify The Docs Promotion

Run:

```bash
sed -n '1,180p' docs/work/index.md
rg -n "Persistent Compare Tray|Status: ready|No ready rows|persistent compare tray" docs/work/index.md docs/work/frontend-product-comparison-demo-parity.md
git diff --check
```

Expected:

- `## Ready Work` contains exactly one ready row for persistent compare tray.
- `No ready rows are currently selected.` is absent.
- The compare lane doc records the active dispatch.
- `git diff --check` exits 0.

Do not run frontend or backend test suites in this promotion-only pass. Those belong to the promoted implementation row.

### Task 5: Commit The Promotion

```bash
git add docs/plans/2026-07-01-persistent-compare-tray-promotion-implementation-plan.md docs/work/index.md docs/work/frontend-product-comparison-demo-parity.md
git commit -m "docs: promote persistent compare tray work"
```

A docs-only commit is appropriate because the workflow dispatch itself is the deliverable.

## Exit Condition

This coordinator batch is complete when `docs/work/index.md` selects persistent compare tray as the only live `ready` row, `docs/work/frontend-product-comparison-demo-parity.md` records the active dispatch, retained CJ remains non-live follow-up work, docs verification passes, and the docs-only promotion commit is created.
