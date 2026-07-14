# Merchant Detail Pages Implementation Plan

**Goal:** Give every merchant a stable public page that helps shoppers judge
catalog coverage, current offer quality, freshness, and destination safety.

**Design:**
`docs/superpowers/specs/2026-07-13-product-trust-and-discovery-program-design.md`

## Safety Contract

- Add a unique canonical merchant slug derived deterministically from name and
  identity; existing rows are backfilled without changing merchant IDs.
- Detail aggregates query every active merchant offer, not a Relay page. Count
  distinct products, observed offers, eligible complete landed prices, and
  freshness classes using the shared offer-truth policy.
- Product/offer rows remain bounded and cursor-ready, while summary facts never
  infer coverage from only the visible page.
- Outbound destinations use the existing safe external-link policy. Unsafe or
  missing domains remain visible as text and never become clickable links.
- Unknown or duplicate slugs return not found. Directory cards link to detail
  pages without changing existing pagination or local filtering.

## Owned Paths

- merchant migration/schema, pricing read model/resolver/schema/tests
- merchant directory query/presentation tests
- merchant detail route/query/loader/presentation/tests
- `assets/schema.graphql` and generated Relay artifacts
- `docs/work/product-trust-and-discovery.md`

## Verification

- Backend tests for slug backfill/upsert, complete aggregates, freshness,
  inactive/incomplete offers, ordering, and not-found behavior.
- Frontend tests for directory navigation, detail facts, offer/product links,
  safe merchant destinations, empty states, and HTTP 404.
- Relay, TypeScript, production builds, backend gates, queue validation, and
  diff hygiene.

SEO and acquisition surfaces are next after stable merchant pages are green.
