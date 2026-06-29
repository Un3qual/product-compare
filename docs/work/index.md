# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- If no `ready` row exists, do not scan historical plans looking for work.
- `needs_decision` rows are coordinator work: make one decision, then promote exactly
  one concrete `ready` row or one explicitly requested parallel batch of independent
  ready rows, remove the decision row so the selected `blocked` row becomes
  highest-ranked, or leave the missing decision named.
- `blocked` rows need external evidence or a product decision. Do not code around
  them.
- `active` rows are already owned by a named worker or branch. Do not start a
  second worker on them unless the coordinator reassigns the row.
- Completed lanes do not stay in this queue. Their history remains in the lane
  work doc and dated plan archive.

## Current Queue

Updated: 2026-06-29

The coordinator selected a usable-product batch focused on the shopper decision
loop: browse products, inspect detail pages, compare selections, review offers,
and return to saved comparisons. These rows are small product-facing
improvements over existing GraphQL and Relay contracts.

The CJ read-model and weekly operator-runbook plans remain retained follow-up
work in `docs/work/product-data-scraping.md` and `docs/plans/INDEX.md`; they are
not dropped or deferred out of the roadmap, but they are no longer the highest
ranked live rows.

## Ready Work

| Rank | Status | Lane | Next action | Plan | Target Paths | Verification | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ready | Frontend catalog browse | Make `/products` cards a clearer product-decision entry point. | `docs/plans/2026-06-29-product-catalog-decision-cards-implementation-plan.md` | `assets/src/routes/catalog/browse.tsx`; `assets/test/routes/catalog/browse.route.test.tsx`; `docs/work/frontend-catalog-browse.md` | `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | Product cards expose clear detail, compare, and offer actions without backend or Relay schema changes. |
| 2 | ready | Frontend product detail | Promote product-detail compare and offer actions into a decision block. | `docs/plans/2026-06-29-product-detail-decision-actions-implementation-plan.md` | `assets/src/routes/products/detail.tsx`; `assets/test/routes/products/detail.route.test.tsx`; `docs/work/frontend-product-detail.md` | `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | `/products/:slug` makes next actions obvious while preserving active-offer pagination and existing data contracts. |
| 3 | ready | Frontend product comparison | Add a selected-product tray and clearer add/remove flow on `/compare`. | `docs/plans/2026-06-29-compare-selection-tray-implementation-plan.md` | `assets/src/routes/compare/index.tsx`; `assets/test/routes/compare/compare.route.test.tsx`; `docs/work/frontend-product-comparison-demo-parity.md` | `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | Compare users can see the active selection, remove products, and add another product without losing URL-driven state. |
| 4 | ready | Frontend offer discovery | Add product-context and filter-summary affordances to `/offers`. | `docs/plans/2026-06-29-offer-discovery-product-context-implementation-plan.md` | `assets/src/routes/offers/index.tsx`; `assets/test/routes/offers/offer-discovery-loader.test.ts`; `assets/test/routes/offers/offer-discovery.route.test.tsx`; `docs/work/frontend-offer-discovery-demo-parity.md` | `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | `/offers` shows the active product/filter context, clear/reset actions, and product-selection guidance without changing backend queries. |
| 5 | ready | Frontend saved comparisons | Improve saved-comparison return flow and empty-state actions. | `docs/plans/2026-06-29-saved-comparisons-return-flow-implementation-plan.md` | `assets/src/routes/compare/saved.tsx`; `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`; `docs/work/frontend-saved-comparisons-ui.md` | `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | `/compare/saved` makes reopen/delete/continue-shopping paths clear for saved sets, filtered results, and empty states. |

## Just Completed

The 2026-06-27 cross-project parallel batch completed these ten work items:

- Frontend catalog browse: `/products` page-size controls.
- Frontend product detail: `/products/:slug` active-offer pagination.
- Frontend offer discovery: visible `/offers` filters.
- Frontend merchant discovery: `/merchants` page-size controls.
- Frontend revenue reporting: deterministic date preset links.
- Frontend saved comparisons: client-side saved-set filtering.
- Frontend product comparison: compare-selection remove controls.
- Frontend API token management: create/rotate expiration presets.
- Frontend affiliate setup: selected merchant context summaries.
- Product data scraping: provider-neutral source-health read model.

## Retained Follow-Up Work

The CJ read-model and weekly operator-runbook batch remains retained as the next
Product data scraping follow-up once the usable-product queue has moved. The
retained plans are listed in `docs/plans/INDEX.md` and
`docs/work/product-data-scraping.md`.

Application submission, account-manager contact, Tier-3 scraping, credential
persistence, and CSV export remain out of scope. CJ candidate CSV score export
is rejected and should not be promoted. eBay Browse fallback remains blocked on
CJ catalog-scope evidence.

## Executor Prompts

Coordinator:

```text
Start at docs/work/index.md.

Read docs/work/operating-model.md.
Process the highest-ranked non-ready row.
Make exactly one decision or unblock exactly one blocker.
Update only the live queue plus the directly affected lane or plan docs.
End with either one ready row or a clearly named blocker.
```

Worker:

```text
Start at docs/work/index.md.

Read docs/work/operating-model.md.
Execute only the highest-ranked row whose Status is ready.
Open only that row's Work Doc, linked active plan if any, Target Paths, and immediate tests.
Update the lane work doc as the batch changes.
Do not edit coordinator-owned docs unless the ready row names them as Target Paths.
Stop if the row is blocked, stale, or needs a decision.
```

## Completed Work

Completed lane summaries remain in their lane work docs under `docs/work/*.md`.
Dated implementation plans remain under `docs/plans/`. They are historical
reference unless this queue links one as the active plan for a `ready` row.
