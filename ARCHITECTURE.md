# ProductCompare Architecture

## Execution Entry Points

- Active execution starts at `docs/work/index.md`, the only live dispatch queue.
- `docs/work/operating-model.md` defines prompt templates, status values, and handoff rules.
- `docs/plans/INDEX.md` is the plan catalog and candidate pool, not a second live queue.
- `docs/plans/NOW.md` is a compatibility pointer back to `docs/work/index.md`.

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
- `/ingestion/feed-candidates` now ships a Relay-backed CJ feed-candidate review route with cursor pagination plus controls for pending, shortlisted, and dismissed review status.
- Browser auth, `/products`, `/products/:slug`, `/compare`, `/compare/saved`, `/account/api-tokens`, `/commerce/revenue`, `/merchants`, `/affiliate/setup`, `/offers`, and `/ingestion/feed-candidates` now use Relay query or mutation APIs with SSR store hydration.
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

- Product filtering now has backend `products(filters:)` support, display-safe
  GraphQL filter metadata/facet counts, and `/products` faceted controls.
- Product comparison now has URL-driven selection, saved sets, shared,
  differences, and all-spec matrices, typed/grouped attribute metadata, and
  bounded offer/price decision-helper rows. Persistent compare tray work remains
  a later product-facing candidate.
- CJ/Awin source-field mapping remains deferred pending additional account docs or sample payloads beyond the validated first CJ manual connector path.
- Product data ingestion now has a CJ-first synchronous pilot boundary, source-agnostic `ProductCompare.Ingestion` scaffold, merchant source identity persistence, fixture parser tests, manual product/feed discovery tasks, run metadata, persisted merchant feed candidates, and durable candidate review status.

## Next Planned Slice

- The 2026-06-29 usable-product batch completed the shopper decision loop
  improvements across browse product cards, product-detail next actions, compare
  selection clarity, offer filter context, and saved-comparison return paths.
- The 2026-06-30 product filtering and in-depth comparison plan set is complete:
  filter metadata/facets, catalog faceted filtering UI, compare matrix modes,
  compare attribute metadata, and compare offer decision helpers.
- The next coordinator pass should promote the retained CJ read-model/operator
  batch, persistent compare tray work, or another product-facing row from
  `docs/work/index.md`.
- The retained CJ read-model and weekly operator-runbook plans remain tracked in
  `docs/work/product-data-scraping.md` and `docs/plans/INDEX.md` for the next
  ingestion-operator follow-up after product-facing progress.
- CJ credential access, product-scope validation, quota observation,
  representative redacted sample evidence, and owner approval remain recorded
  for the manual connector path.
- Account-manager automation, Tier-3 direct scraping, credential persistence,
  application submission, and CSV export remain out of scope until a later
  explicit product/backend decision.
