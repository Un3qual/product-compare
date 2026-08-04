# ProductCompare Architecture

## Execution Entry Points

- Active execution starts at `docs/work/index.md`, the only live dispatch queue.
- `docs/work/operating-model.md` defines prompt templates, status values, and handoff rules.
- `docs/plans/INDEX.md` is the plan catalog and candidate pool, not a second live queue.
- `docs/plans/NOW.md` is a compatibility pointer back to `docs/work/index.md`.

## System Overview

- Phoenix owns the product API, session cookies, and GraphQL contract at `/api/graphql`.
- pnpm, Rolldown-backed Vite, and React Router SSR under `assets/` own the
  frontend route shells and browser UX; mise pins the repository runtimes.
- Browser auth flows must use GraphQL over `/api/graphql`; Phoenix remains the cookie-backed session authority.

## Current Delivered Frontend Baseline

- Browser auth routes exist for register, login, logout, forgot-password, reset-password, and verify-email, including a Relay-backed logout confirmation route.
- The root shell preloads GraphQL `viewer` state, renders guest/authenticated auth links from that viewer, and updates Relay's root `viewer` record after successful login, register, and logout mutations.
- `/products` ships a GraphQL-backed browse baseline with compare entry links.
- `/products/:slug` ships product detail, current specifications, compare-entry, active-offer baselines, shopper-facing active coupon display, compact price-history rows, and first-party tracked merchant actions.
- `/compare` ships an SSR-safe compare baseline driven by repeated `slug` query params, exposes a saved-comparison action for ready-state selections, provides an in-page product picker, renders current product attributes on selected compare cards, and aligns shared current attributes in a comparison matrix.
- `/compare/saved` now ships a GraphQL-backed saved-set list with reopen/delete flows for authenticated users.
- `/account/api-tokens` now ships a GraphQL-backed API-token management route with list, create, revoke, rotate, one-time token display, and navigation entry points.
- `/commerce/revenue` now ships an operator-only GraphQL-backed revenue reporting route with aggregate filters, unsuppressed metrics, and a paginated click/conversion attribution ledger.
- `/merchants` now ships a Relay-backed merchant discovery route with cursor pagination, empty/error states, and navigation entry points.
- `/affiliate/setup` now ships a Relay-backed affiliate setup route with merchant choices, authenticated network/program/link/coupon mutation forms, typed payload errors, and navigation entry points.
- `/offers` now ships a Relay-backed offer discovery route for the existing top-level `merchantProducts(input:)` contract, with browse-card and root navigation entry points, visible merchant quick filters, and first-party tracked merchant actions.
- `/ingestion/cj-programs` now ships a Relay-backed CJ program-lifecycle workspace: operators can update each source-scoped advertiser program's stage and note, inspect its bounded observed feeds, and page unmatched observed feeds independently. `/ingestion/feed-candidates` redirects to that canonical route.
- Browser auth, `/products`, `/products/:slug`, `/compare`, `/compare/saved`, `/account/api-tokens`, `/commerce/revenue`, `/merchants`, `/affiliate/setup`, `/offers`, and `/ingestion/cj-programs` now use Relay query or mutation APIs with SSR store hydration.
- Relay-backed route loaders receive the request-scoped Relay environment through React Router context and fail fast when that wiring invariant is missing.
- In-scope Relay pagination now rejects blank and repeated cursors across public,
  comparison, community, account, and setup surfaces.
- Alert and comparison timestamps use strict GraphQL DateTime parsing, while
  alert/watch and snapshot actions keep pending and failure state on the
  affected row.
- Affiliate merchant context and API-token action policy now come from
  framework-free data owners rather than being re-derived in React.

## Current Delivered Backend Baseline

- GraphQL exposes viewer/session auth mutations, catalog browse/detail, merchant discovery, merchant products, and active coupons, with `UNAUTHENTICATED` used consistently for missing-session GraphQL failures.
- GraphQL request-level Dataloader batching is in place for catalog/pricing associations and latest-price lookups.
- Relay-style global IDs are used where the schema already requires them, with root node lookup covering public catalog/pricing entities including price points and source artifacts, owner-scoped saved/API-token entities, and authenticated affiliate entities.
- GraphQL global ID local-value normalization, encoding, and integer/UUID decoding are centralized in `ProductCompareWeb.GraphQL.GlobalId`.
- GraphQL `Product.currentAttributes` exposes selected current product claims in a display-ready shape for product-detail and comparison UI surfaces.
- GraphQL `sourceArtifact(id:)` and generic `node(id:)` expose public-safe source-artifact metadata without raw payload fields.
- Merchant `detailSummary` now uses set-based active-offer and latest-price reads
  with a fixed query budget as merchant parent counts grow.
- Durable CJ scheduler jobs now deduplicate within an explicit schedule window
  while remaining runnable in later windows.
- Alert evaluation is asynchronous, replay-safe, and fault-isolated across
  watches for the same price observation.
- Community reviews, questions, and answers now support durable idempotency,
  exact hourly write limits, retained owner removal, owner edits, accepted-
  answer cleanup, typed GraphQL errors, and accessible Relay controls.
- Commerce attribution now has core persistence for outbound links, click sessions, conversions, and purchase-price facts, plus `/r/:click_id` redirect resolution, CJ/Impact/Awin/Rakuten conversion adapters, operator-only GraphQL revenue summary and paginated click-ledger reads, and a GraphQL `trackCommerceClick(input:)` mutation for server-resolved merchant-product click tracking.
- Shared Relay connection pagination rejects invalid `first` values with a deterministic `invalid first` GraphQL error while preserving default, clamp, `first: 0`, and malformed cursor behavior.

## Active Gap

- Product filtering now has backend `products(filters:)` support, display-safe
  GraphQL filter metadata/facet counts, and `/products` faceted controls.
- Product comparison now has URL-driven selection, saved sets, shared,
  differences, and all-spec matrices, typed/grouped attribute metadata, bounded
  offer/price decision-helper rows, and a persistent URL-backed compare tray
  across browse and product detail routes.
- CJ/Awin source-field mapping remains deferred pending additional account docs or sample payloads beyond the validated first CJ manual connector path.
- Product data ingestion now has a CJ-first synchronous pilot boundary, source-agnostic `ProductCompare.Ingestion` scaffold, merchant source identity persistence, fixture parser tests, manual product/feed discovery tasks, run metadata, and durable advertiser-program lifecycle state. Discovery preserves that lifecycle state while feeds remain observed facts.

## Next Planned Slice

- The 2026-06-29 usable-product batch completed the shopper decision loop
  improvements across browse product cards, product-detail next actions, compare
  selection clarity, offer filter context, and saved-comparison return paths.
- The 2026-06-30 product filtering and in-depth comparison plan set is complete:
  filter metadata/facets, catalog faceted filtering UI, compare matrix modes,
  compare attribute metadata, and compare offer decision helpers.
- The CJ read-model and weekly operator-runbook batch is complete and recorded
  in `docs/work/product-data-scraping.md`.
- The product-facing polish batch across catalog browse, product detail, offer
  discovery, saved comparisons, and merchant discovery is complete.
- The feature-complete product milestone is complete: the root now leads with
  the shopper journey, navigation is viewer-aware, compare exposes a safe
  relative loaded-price signal, and saved comparisons show ordered product
  names while preserving stored reopen order.
- Revenue reporting is explicitly an authenticated recorded-data preview with
  no live conversion provider connected for this milestone.
- The CJ readiness gate can optionally require secret-safe schedule enablement
  while preserving manual readiness and without activating an environment.
- Email delivery, live conversion-provider ingestion, production privacy and
  attribution controls, and production-readiness proof are outside the current
  feature-complete milestone by product decision.
- Loaded-price scope copy, the local loaded-product compare-picker filter, the
  visible-page merchant-name filter, wildcard 404, and shared route metadata
  are implemented; their old plans are completion evidence, not queue work.
- The revenue readiness, shopper UX polish, and backend quality parallel batch
  is complete: first-party tracked commerce clicks, `/offers` visible merchant
  quick filters, and Relay connection invalid-page-size hardening are recorded
  in their lane docs.
- eBay Browse fallback is deferred by product decision as of 2026-07-08.
- Ingestion dashboard and operator surfaces are deferred by product decision as
  of 2026-07-08.
- CJ credential access, product-scope validation, quota observation,
  representative redacted sample evidence, and owner approval remain recorded
  for the manual connector path.
- Account-manager automation, Tier-3 direct scraping, credential persistence,
  application submission, and CSV export remain out of scope until a later
  explicit product/backend decision.
- Current implementation dispatch is recorded only in `docs/work/index.md`;
  this architecture document does not duplicate the changing ready-row list.
