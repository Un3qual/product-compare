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

- Browser auth routes exist for register, login, logout, forgot-password, reset-password, and verify-email, including a Relay-backed logout confirmation route.
- The root shell preloads GraphQL `viewer` state, renders guest/authenticated auth links from that viewer, and updates Relay's root `viewer` record after successful login, register, and logout mutations.
- `/products` ships a GraphQL-backed browse baseline with compare entry links.
- `/products/:slug` ships product detail, current specifications, compare-entry, active-offer baselines, shopper-facing active coupon display, and compact price-history rows.
- `/compare` ships an SSR-safe compare baseline driven by repeated `slug` query params, exposes a saved-comparison action for ready-state selections, provides an in-page product picker, renders current product attributes on selected compare cards, and aligns shared current attributes in a comparison matrix.
- `/compare/saved` now ships a GraphQL-backed saved-set list with reopen/delete flows for authenticated users.
- `/account/api-tokens` now ships a GraphQL-backed API-token management route with list, create, revoke, rotate, one-time token display, and navigation entry points.
- `/commerce/revenue` now ships a GraphQL-backed revenue reporting route with aggregate filters, public-safe suppression rendering, and navigation entry points.
- `/merchants` now ships a Relay-backed merchant discovery route with cursor pagination, empty/error states, and navigation entry points.
- `/affiliate/setup` now ships a Relay-backed affiliate setup route with merchant choices, authenticated network/program/link/coupon mutation forms, typed payload errors, and navigation entry points.
- `/offers` now ships a Relay-backed offer discovery route for the existing top-level `merchantProducts(input:)` contract, with browse-card and root navigation entry points.
- Browser auth, `/products`, `/products/:slug`, `/compare`, `/compare/saved`, `/account/api-tokens`, `/commerce/revenue`, `/merchants`, `/affiliate/setup`, and `/offers` now use Relay query or mutation APIs with SSR store hydration.
- Relay-backed route loaders receive the request-scoped Relay environment through React Router context and fail fast when that wiring invariant is missing.

## Current Delivered Backend Baseline

- GraphQL exposes viewer/session auth mutations, catalog browse/detail, merchant discovery, merchant products, and active coupons, with `UNAUTHENTICATED` used consistently for missing-session GraphQL failures.
- GraphQL request-level Dataloader batching is in place for catalog/pricing associations and latest-price lookups.
- Relay-style global IDs are used where the schema already requires them, with root node lookup covering public catalog/pricing entities including price points and source artifacts, owner-scoped saved/API-token entities, and authenticated affiliate entities.
- GraphQL global ID local-value normalization, encoding, and integer/UUID decoding are centralized in `ProductCompareWeb.GraphQL.GlobalId`.
- GraphQL `Product.currentAttributes` exposes selected current product claims in a display-ready shape for product-detail and comparison UI surfaces.
- GraphQL `sourceArtifact(id:)` and generic `node(id:)` expose public-safe source-artifact metadata without raw payload fields.
- Commerce attribution now has core persistence for outbound links, click sessions, conversions, and purchase-price facts, plus `/r/:click_id` redirect resolution, an initial Impact conversion adapter, a query-backed revenue summary contract, and read-only GraphQL `revenueSummary` exposure.

## Active Gap

- CJ/Awin source-field mapping remains deferred pending account docs or sample payloads.
- Product data ingestion now has a CJ-first synchronous pilot boundary, source-agnostic `ProductCompare.Ingestion` scaffold, merchant source identity persistence, and fixture parser tests.

## Next Planned Slice

- Frontend auth state hardening is complete: root `viewer` route preload, guest/authenticated auth links in the root shell, Relay root viewer updates after auth mutations, logout browser e2e coverage, and backend session-auth contract hardening have landed.
- Live CJ provider validation remains blocked until credentials, quota behavior, representative sample payloads, and source onboarding compliance signoff are recorded.
- Frontend logout route baseline is complete: `/auth/logout` clears the Phoenix browser session through the existing GraphQL logout mutation and is reachable from primary navigation.
- Backend source artifact node lookup is complete: generic `node(id:)` supports the safe `SourceArtifact` GraphQL object without exposing raw payload fields.
- Frontend product-detail price history demo parity is complete: `/products/:slug` renders bounded price-history rows, empty history state, and has-more state in the Active offers section.
- Backend source artifact public contract is complete: `sourceArtifact(id:)` exposes safe metadata while raw payload fields remain unexposed.
- Frontend product-detail coupon demo parity is complete: product offers expose public display-scoped active coupons, and `/products/:slug` renders active coupon codes and discount details in the Active offers section.
- Product comparison demo parity is complete: backend `Product.currentAttributes`, product-detail specifications, browse compare links, the `/compare` product picker, compare-card attributes, and full demo-slice verification have landed.
- Frontend compare shared attribute matrix is complete: `/compare` now renders shared selected-product attributes in an aligned matrix while keeping non-shared attributes in per-product cards.
- Frontend API token management demo parity is complete: the existing `myApiTokens`, `createApiToken`, `revokeApiToken`, and `rotateApiToken` GraphQL contract is demoable from `/account/api-tokens` without REST browser auth endpoints.
- Frontend revenue reporting demo parity is complete: the existing public-safe `revenueSummary(input:)` GraphQL contract is demoable from `/commerce/revenue` with aggregate filters, suppressed/unsuppressed summary rendering, and navigation coverage.
- Frontend merchant discovery demo parity is complete: the existing public `merchants(first:, after:)` GraphQL contract is demoable from `/merchants` with cursor pagination, empty/error states, and navigation coverage.
- Frontend affiliate setup demo parity is complete: the existing authenticated affiliate setup mutations are demoable from `/affiliate/setup` without REST browser flows or new admin-role semantics.
- Frontend offer discovery demo parity is complete: the existing top-level `merchantProducts(input:)` GraphQL contract is demoable from `/offers`, with product browse card links passing product global IDs.
- Live CJ provider validation remains blocked until credentials, quota behavior, representative sample payloads, and source onboarding compliance signoff are recorded.
