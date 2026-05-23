# ProductCompare Architecture

## Execution Entry Points

- Active execution starts at `docs/work/index.md`.
- `docs/plans/INDEX.md` is the repo-level queue of implementation plans.
- `docs/plans/NOW.md` records the currently selected batch and immediate next step, or the current frontend/backend lane batches when work is running in parallel.

## System Overview

- Phoenix owns the product API, session cookies, and GraphQL contract at `/api/graphql`.
- Bun + React Router SSR under `assets/` owns the frontend route shells and browser UX.
- Browser auth flows must use GraphQL over `/api/graphql`; Phoenix remains the cookie-backed session authority.

## Current Delivered Frontend Baseline

- Browser auth routes exist for register, login, logout, forgot-password, reset-password, and verify-email.
- `/products` ships a GraphQL-backed browse baseline.
- `/products/:slug` ships product detail and active-offer baselines.
- `/compare` ships an SSR-safe compare baseline driven by repeated `slug` query params and now exposes a saved-comparison action for ready-state selections.
- `/compare/saved` now ships a GraphQL-backed saved-set list with reopen/delete flows for authenticated users.
- Browser auth, `/products`, `/products/:slug`, and `/compare` now use Relay query or mutation APIs with SSR store hydration.
- `/compare/saved` remains on an explicit `saved-data.ts` manual GraphQL helper until a future saved-route Relay cleanup is prioritized.

## Current Delivered Backend Baseline

- GraphQL exposes viewer/session auth mutations, catalog browse/detail, merchant discovery, merchant products, and active coupons.
- GraphQL request-level Dataloader batching is in place for catalog/pricing associations and latest-price lookups.
- Relay-style global IDs are used where the schema already requires them, with Phoenix staying responsible for auth/session state.
- Commerce attribution now has core persistence for outbound links, click sessions, conversions, and purchase-price facts, plus `/r/:click_id` redirect resolution, an initial Impact conversion adapter, a query-backed revenue summary contract, and read-only GraphQL `revenueSummary` exposure.

## Active Gap

- CJ/Awin source-field mapping remains deferred pending account docs or sample payloads.
- Product data ingestion now has a CJ-first synchronous pilot boundary, source-agnostic `ProductCompare.Ingestion` scaffold, merchant source identity persistence, and fixture parser tests.
- `/compare/saved` still has an explicit manual GraphQL helper; this is a visible follow-up cleanup, not an active route-data blocker.

## Next Planned Slice

- Product Data Ingestion Persistence is queued next: persist normalized listings into `SourceArtifact`, `ExternalProduct`, `MerchantProduct`, and `PricePoint` with replay idempotency and stale-observation guards.
- Live CJ provider validation remains blocked until credentials, quota behavior, and representative sample payloads are recorded.
