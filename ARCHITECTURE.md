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
- `/compare` ships an SSR-safe compare baseline driven by repeated `slug` query params.
- The frontend ships a Relay provider, compiler config, and network layer, but the current routes still fetch GraphQL manually through route-local helpers rather than Relay query and mutation APIs.

## Current Delivered Backend Baseline

- GraphQL exposes viewer/session auth mutations, catalog browse/detail, merchant discovery, merchant products, and active coupons.
- GraphQL request-level Dataloader batching is in place for catalog/pricing associations and latest-price lookups.
- Relay-style global IDs are used where the schema already requires them, with Phoenix staying responsible for auth/session state.

## Active Gap

- Route data under `assets/` is still split between a nominal Relay setup and manual `fetchGraphQL`/payload-parsing helpers in the route tree.
- SSR currently creates a Relay environment per request, but the populated store is not serialized into client hydration, so the app cannot yet use proper Relay route preloading end-to-end.
- The GraphQL API already emits Relay-style global IDs on the main catalog/pricing surfaces, but it still lacks a root `node(id: ID!)` lookup for those records.
- The backend contract for private saved comparison sets now exists, but the frontend saved-set route should not land until the compare route is on the same Relay data path as the rest of the app.

## Next Planned Slice

- Frontend lane: unify route data around Relay preloaded queries, Relay mutations, and SSR store hydration.
- Backend lane: add the missing root Relay `node(id: ID!)` lookup for the existing global-ID-backed catalog/pricing surfaces without touching `assets/`.
- After the frontend lane closes, resume the saved-comparisons UI and add the `/compare/saved` route plus reopen/delete flows on top of the new Relay compare pattern.
