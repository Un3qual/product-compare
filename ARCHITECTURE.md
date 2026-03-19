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
- `/compare` ships an SSR-safe compare baseline driven by repeated `slug` query params.

## Current Delivered Backend Baseline

- GraphQL exposes viewer/session auth mutations, catalog browse/detail, merchant discovery, merchant products, and active coupons.
- GraphQL request-level Dataloader batching is in place for catalog/pricing associations and latest-price lookups.
- Relay-style global IDs are used where the schema already requires them, with Phoenix staying responsible for auth/session state.

## Active Gap

- The backend contract for private saved comparison sets now exists, but the frontend still lacks the save/list/reopen/delete UX that consumes it.
- The compare route remains save-less today, and there is still no `/compare/saved` route for authenticated users.

## Next Planned Slice

- Add frontend saved-comparison UX on top of the new GraphQL contract.
- That next slice should cover compare-route save actions plus a saved-set route for listing, reopening, and deleting persisted compare sets.
