# ProductCompare Architecture

## Execution Entry Points

- Active execution starts at `docs/work/index.md`.
- `docs/plans/INDEX.md` is the repo-level queue of implementation plans.
- `docs/plans/NOW.md` records the currently selected batch and immediate next step.

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
- The compare routes now share a route shell plus route-local status semantics, but they still fetch GraphQL manually through route-local helpers rather than Relay query and mutation APIs.

## Current Delivered Backend Baseline

- GraphQL exposes viewer/session auth mutations, catalog browse/detail, merchant discovery, merchant products, and active coupons.
- GraphQL request-level Dataloader batching is in place for catalog/pricing associations and latest-price lookups.
- Relay-style global IDs are used where the schema already requires them, with Phoenix staying responsible for auth/session state.

## Active Gap

- Route data under `assets/` is still split between a nominal Relay setup and manual `fetchGraphQL`/payload-parsing helpers in the route tree.
- SSR currently creates a Relay environment per request, but the populated store is not serialized into client hydration, so the app cannot yet use proper Relay route preloading end-to-end.
- `/compare` and `/compare/saved` now ship on the same manual compare `api.ts` path, and compare-scoped route error boundaries are still not registered yet.

## Next Planned Slice

- Unify frontend route data around Relay preloaded queries, Relay mutations, and SSR store hydration.
- After that slice closes, finish the remaining compare/saved hardening, including compare-scoped route error boundaries, on top of the Relay compare pattern.
