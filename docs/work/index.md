# Active Work Index

Start here before opening dated plans or checkpoint logs.

## How To Use This Folder

- Read this file first.
- In single-agent mode, open only the highest-priority unblocked active lane.
- In parallel mode, assign one worker to the highest-priority unblocked frontend lane and one worker to the highest-priority unblocked backend lane.
- Each worker stays inside its lane's `Owned paths`; shared planning docs stay coordinator-owned.
- Verify the selected batch against the codebase before editing.
- Workers update only their lane work doc as they go.
- Coordinators update this file plus `docs/plans/NOW.md` and `docs/plans/INDEX.md` whenever lane status, priority, or blockers change.

## Suggested Executor Prompts

```text
Coordinator prompt:
Start at docs/work/index.md.

Run in parallel-lane mode.
Assign one worker to the highest-priority unblocked frontend lane and one worker to the highest-priority unblocked backend lane.
Keep `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` coordinator-owned.
Do not let workers edit the same files.
If a worker reports a blocker outside its owned paths, update the lane docs instead of having it cross lanes.
Integrate shared-doc updates only after reviewing both lane results.
Open or update a PR only when the coordinated slice is ready.
```

```text
Lane worker prompt:
Start at docs/work/index.md and open only the active {frontend|backend} lane assigned to you.

Execute the `Next batch` from that lane's work doc.
Before coding, verify the selected batch against the codebase and correct any drift in that lane doc.
Edit only the lane's `Owned paths` and that lane's work doc.
Do not edit `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, or `ARCHITECTURE.md` unless your prompt explicitly says you are the coordinator.
If the work requires another lane's files or a coordinator-owned doc, record a blocker in your lane doc and stop.
Commit only lane-local milestone changes.
```

## Active Work Lanes

- Frontend lane
  - Work doc: `docs/work/frontend-relay-route-data.md`
  - Status: active
  - Priority: P1
  - Next batch: add Relay SSR hydration/preload primitives, then migrate route data off the manual `api.ts` GraphQL wrappers.
  - Owned paths: `assets/**`, `docs/work/frontend-relay-route-data.md`, `docs/work/frontend-saved-comparisons-ui.md`, `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`

- Backend lane
  - Work doc: `docs/work/graphql-relay-contract-hardening.md`
  - Status: active
  - Priority: P2
  - Next batch: add a root `node(id: ID!)` lookup for the existing global-ID-backed product and pricing entities, with focused GraphQL coverage.
  - Owned paths: `lib/product_compare/**`, `lib/product_compare_web/**`, `test/product_compare_web/graphql/**`, `docs/work/graphql-relay-contract-hardening.md`, `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`

## Blocked / Needs Decision

- `docs/work/affiliate-revenue-attribution.md`
  - Status: drafting
  - Priority: P2
  - Reason: queued behind the active Relay route-data work until the route-data migration finishes.
  - Next batch: draft attribution ADR and scaffold core click/conversion schema migrations.

- `docs/work/product-data-scraping.md`
  - Status: drafting
  - Priority: P2
  - Reason: queued until the first-connector choice is finalized and the ingestion-boundary ADR is approved.
  - Next batch: choose the first connector (default: eBay Browse API; CJ as fallback), then draft the ingestion-boundary ADR.

- `docs/work/frontend-compare-saved-hardening.md`
  - Status: blocked on frontend Relay route-data adoption
  - Priority: P2
  - Reason: the shared compare shell and saved-set status semantics have landed, but the remaining compare-scoped error-boundary follow-up is deferred until Relay route-data adoption re-establishes `/compare` and `/compare/saved` on the long-term data path.
  - Next batch: resume Task 2 from `docs/plans/2026-03-19-frontend-compare-saved-hardening-implementation-plan.md` after `docs/work/frontend-relay-route-data.md` is complete

## Recently Completed

### Frontend Saved Comparisons UI

- Status: completed on 2026-03-19
- Source of truth: `docs/work/frontend-saved-comparisons-ui.md`
- Outcome:
  - `/compare` now saves ready-state selections through `createSavedComparisonSet`.
  - `/compare/saved` now lists private saved sets, reopens them back into `/compare` with repeated `slug` params, and deletes them from the UI.
  - Frontend verification passed with `cd assets && /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run src/routes/compare/__tests__/compare.route.test.tsx src/routes/__tests__/root.route.test.tsx` and `cd assets && /opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`.

### Saved Comparisons Backend

- Status: completed on 2026-03-18
- Source of truth: `docs/work/saved-comparisons-backend.md`
- Outcome:
  - Added owner-scoped `saved_comparison_sets` and `saved_comparison_items` persistence with ordered product items.
  - Added catalog APIs and GraphQL query/mutation support for listing, creating, and deleting private saved comparison sets.
  - Verification passed with `mix test test/product_compare/catalog/saved_comparison_set_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs` and `mix typecheck`.

### GraphQL Dataloader Adoption

- Status: completed on 2026-03-18
- Source of truth: `docs/work/graphql-dataloader-adoption.md`
- Outcome:
  - Added a request-level GraphQL batching regression test at `test/product_compare_web/graphql/dataloader_batching_test.exs`.
  - Locked the relevant SQL envelope for one request spanning aliased `product` selections plus `merchantProducts`: three `products` selects and one each for `brands`, `merchant_products`, `merchants`, and `price_points`.
  - Verification passed with `mix test test/product_compare_web/graphql/dataloader_batching_test.exs`, `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`, and `mix test test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`.

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
