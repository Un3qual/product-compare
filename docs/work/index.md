# Active Work Index

Start here before opening dated plans or checkpoint logs.

## How To Use This Folder

- Read this file first.
- Open only the highest-priority item marked `Status: active` unless it is blocked.
- Verify the selected batch against the codebase before editing.
- Update this file and the referenced `docs/work/*.md` file whenever status, priority, or blockers change.

## Suggested Executor Prompt

```text
Start at docs/work/index.md and follow only the ACTIVE item(s) it lists.

Execute the `Next batch` from the highest-priority active work doc.
Before coding, verify the selected batch against the codebase and correct any drift in the work doc.
Update the work doc as you go.
Commit only at milestone boundaries defined by the active work doc.
If there is no unblocked active batch, create or update the next work doc instead of scanning the whole docs tree.
Open or update a PR only when the active work item is complete.
```

## Active Work

- GraphQL Dataloader Adoption
  - Status: active
  - Priority: P1
  - Source of truth: `docs/work/graphql-dataloader-adoption.md`
  - Next batch:
    - Batch the current hot field paths: `product.brand`, `merchant_product.merchant`, `merchant_product.product`, and `merchant_product.latest_price`.
    - Lock batching with regression coverage.

## Blocked / Needs Decision

- `docs/plans/INDEX.md` and `ARCHITECTURE.md` are still absent, so broader rebaselines continue to use `docs/plans/2026-03-05-frontend-fullstack-design.md` plus the current codebase as the active architecture source.
- The two active slices above are explicitly queued targeted follow-ons and are not blocked by that missing rebaseline entrypoint.

## Recently Completed

### Frontend Radix Primitives

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-radix-primitives.md`
- Outcome:
  - Added a shared frontend Radix wrapper layer at `assets/src/ui/primitives/` for `Button`, `Label`, `Separator`, and `Slot`.
  - Migrated the app shell, root navigation/actions, and shared auth form shell onto that wrapper layer while keeping existing route behavior and link semantics intact.
  - Verification passed with `cd assets && bun x vitest run src/ui/__tests__/primitives.test.tsx src/ui/__tests__/app-providers.test.tsx src/ui/__tests__/app-shell.test.tsx src/routes/__tests__/root.route.test.tsx src/routes/auth/__tests__/form-shell.test.tsx src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx` and `cd assets && bun run check`.

### Frontend Compare Baseline

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-compare-baseline.md`
- Outcome:
  - `/compare` now SSR-renders up to three product cards from repeated `slug` query params using the existing GraphQL product-detail path.
  - The route now distinguishes empty, over-limit, ready, missing-product, and unavailable states with focused compare-route coverage.
  - Frontend verification passed with `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`, `cd assets && bun run typecheck`, and `cd assets && bun run test:unit`.

### Frontend Product Offers Baseline

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-product-offers.md`
- Outcome:
  - `/products/:slug` now renders an `Active offers` section from the existing GraphQL pricing surface.
  - The detail route now distinguishes offer-ready, offer-empty, and offer-unavailable states without regressing product-ready, not-found, or unavailable handling.
  - Verification passed with `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`, `mix test test/product_compare_web/graphql/pricing_queries_test.exs`, `cd assets && bun run typecheck`, and `cd assets && bun run test:unit`.

### Frontend Product Detail Baseline

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-product-detail.md`
- Outcome:
  - `/products/:slug` now SSR-renders basic product details from GraphQL.
  - The route now distinguishes product-ready, not-found, and unavailable states with focused route regression coverage.
  - Browse product names now navigate into the detail route from `/products`.

### GraphQL Auth Migration Follow-up

- Status: completed on 2026-03-17
- Source of truth: `docs/work/graphql-auth-migration.md`
- Outcome:
  - Added `docs/decisions/2026-03-17-auth-token-delivery-deferral.md` to make the remaining transport gap explicit.
  - Closed the auth migration follow-up doc without reopening browser-auth implementation scope.

### Frontend Auth Browser Coverage

- Status: completed on 2026-03-17
- Source of truth: `docs/work/frontend-auth-browser-coverage.md`
- Outcome:
  - Added Playwright coverage for the existing frontend session, recovery, and verification routes.

### Frontend Catalog Browse

- Status: completed on 2026-03-17
- Source of truth: `docs/work/frontend-catalog-browse.md`
- Outcome:
  - `/products` now SSR-renders the first catalog page from GraphQL.
  - The route now handles empty and unavailable catalog states with focused route regression coverage.
  - Frontend verification passed with `cd assets && bun run typecheck` and `cd assets && bun run test:unit`.

## Historical Plan Notes

### Frontend Fullstack Plan

- Status: rebaselined on 2026-03-17
- Source: `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
- Reason:
  - The older umbrella plan remains historical context only.
  - Its browse, product-detail, product-offers, and compare follow-ons are complete.

## Historical / Reference Only

- `docs/implementation-checklist.md` is a checkpoint log, not the active work queue.
- Dated files in `docs/plans/` are design and implementation baselines unless this index links them as active work.
