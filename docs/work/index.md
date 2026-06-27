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

Updated: 2026-06-27

| Rank | Status | Lane | Next Action | Active Plan | Target Paths | Verification | Exit Condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ready | Frontend catalog browse | Add catalog browse page-size controls. | `docs/plans/2026-06-27-project-catalog-browse-page-size-implementation-plan.md` | `assets/src/routes/catalog/loader.ts`; `assets/src/routes/catalog/browse.tsx`; `assets/test/routes/catalog/browse.route.test.tsx`; `docs/work/frontend-catalog-browse.md` | `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | `/products` accepts bounded `first` values and preserves page size through pagination. |
| 2 | ready | Frontend product detail | Add product detail offer pagination. | `docs/plans/2026-06-27-project-product-detail-offer-pagination-implementation-plan.md` | `assets/src/routes/products/loader.ts`; `assets/src/routes/products/detail.tsx`; `assets/test/routes/products/detail.route.test.tsx`; `docs/work/frontend-product-detail.md` | `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | `/products/:slug` paginates active offers with URL-driven next and first links. |
| 3 | ready | Frontend offer discovery demo parity | Add visible offer-discovery filter controls. | `docs/plans/2026-06-27-project-offer-discovery-filter-controls-implementation-plan.md` | `assets/src/routes/offers/index.tsx`; `assets/test/routes/offers/offer-discovery.route.test.tsx`; `assets/test/routes/offers/offer-discovery-loader.test.ts`; `docs/work/frontend-offer-discovery-demo-parity.md` | `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | `/offers` exposes existing product, merchant, active-only, and page-size filters in the UI. |
| 4 | ready | Frontend merchant discovery demo parity | Add merchant directory page-size controls. | `docs/plans/2026-06-27-project-merchant-directory-page-size-implementation-plan.md` | `assets/src/routes/merchants/index.tsx`; `assets/src/routes/merchants/pagination.ts`; `assets/test/routes/merchants/merchant-directory-loader.test.ts`; `assets/test/routes/merchants/merchant-directory.route.test.tsx`; `docs/work/frontend-merchant-discovery-demo-parity.md` | `cd assets && bun x vitest run test/routes/merchants/merchant-directory-loader.test.ts test/routes/merchants/merchant-directory.route.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | `/merchants` lets users choose bounded page sizes while preserving cursor pagination. |
| 5 | ready | Frontend revenue reporting demo parity | Add revenue date preset links. | `docs/plans/2026-06-27-project-revenue-date-presets-implementation-plan.md` | `assets/src/routes/commerce/revenue/index.tsx`; `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`; `docs/work/frontend-revenue-reporting-demo-parity.md` | `cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary.route.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | `/commerce/revenue` has deterministic date presets that preserve network and currency filters. |
| 6 | ready | Frontend saved comparisons UI | Add saved-comparison client filter. | `docs/plans/2026-06-27-project-saved-comparisons-client-filter-implementation-plan.md` | `assets/src/routes/compare/saved.tsx`; `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`; `assets/test/routes/compare/saved-comparisons-test-helpers.ts`; `docs/work/frontend-saved-comparisons-ui.md` | `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | `/compare/saved` can filter loaded saved sets by name or product slug without backend changes. |
| 7 | ready | Frontend product comparison demo parity | Add compare selection remove controls. | `docs/plans/2026-06-27-project-compare-selection-controls-implementation-plan.md` | `assets/src/routes/compare/index.tsx`; `assets/test/routes/compare/compare.route.test.tsx`; `docs/work/frontend-product-comparison-demo-parity.md` | `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | `/compare` users can remove selected products while preserving the remaining slug order. |
| 8 | ready | Frontend API token management demo parity | Add API-token expiry presets. | `docs/plans/2026-06-27-project-api-token-expiry-presets-implementation-plan.md` | `assets/src/routes/account/api-tokens/index.tsx`; `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`; `docs/work/frontend-api-token-management-demo-parity.md` | `cd assets && bun x vitest run test/routes/account/api-tokens/api-tokens.route.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | `/account/api-tokens` offers create and rotate expiration presets without changing mutation contracts. |
| 9 | ready | Frontend affiliate setup demo parity | Add selected merchant context. | `docs/plans/2026-06-27-project-affiliate-setup-merchant-context-implementation-plan.md` | `assets/src/routes/affiliate/setup/index.tsx`; `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`; `docs/work/frontend-affiliate-setup-demo-parity.md` | `cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup.route.test.tsx`; `cd assets && bun run typecheck`; `git diff --check` | `/affiliate/setup` keeps selected merchant context visible across program, link, and coupon forms. |
| 10 | ready | Product data scraping | Add provider-neutral source health read model. | `docs/plans/2026-06-27-project-source-health-read-model-implementation-plan.md` | `lib/product_compare/ingestion/source_health.ex`; `test/product_compare/ingestion/source_health_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/product_compare/ingestion/source_health_test.exs`; `mix typecheck`; `git diff --check` | A provider-neutral source-health summary exists without raw payloads, provider calls, Mix tasks, GraphQL, or UI. |

## Ready Work

Ten `ready` cross-project work-item rows exist. They are planned as one parallel
batch spanning independent frontend route refinements plus one provider-neutral
ingestion read model.

## Deferred Work

Application submission, account-manager contact, Tier-3 scraping, credential
persistence, and CSV export remain out of scope. CJ candidate CSV score export
is rejected and should not be promoted. The prior CJ read-model plans remain in
the plan archive/candidate pool but are not the active queue after the
cross-project correction.

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
