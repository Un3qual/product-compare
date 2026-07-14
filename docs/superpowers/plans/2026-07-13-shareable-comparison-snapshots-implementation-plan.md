# Shareable Comparison Snapshots Implementation Plan

**Goal:** Let a signed-in shopper publish a stable, public-safe record of a
two- or three-product decision without leaking account identity or changing the
facts behind an existing link.

**Design:**
`docs/superpowers/specs/2026-07-13-watchlists-sharing-and-recommendations-design.md`

## Safety Contract

- Publishing requires an authenticated owner and exactly two or three distinct
  existing products.
- Capture ordered product identity, accepted current specification values and
  provenance references, eligible offer facts and observation times, and the
  selected recommendation result as JSON-safe immutable data.
- Generate a high-entropy opaque token. Public reads never expose owner IDs,
  saved-set IDs, raw source artifacts, or mutable account data.
- Updating a comparison publishes a new record and token. The only mutation of
  an existing snapshot is one-way revocation; revoked tokens resolve as not
  found.
- Captured offer facts remain explicitly timestamped and carry a snapshot
  disclaimer instead of being presented as live prices.

## Owned Paths

- comparison snapshot migration/schema/context/resolver/tests
- `lib/product_compare_web/schema.ex`
- `assets/schema.graphql`
- `assets/src/routes/compare/**`
- public snapshot route/query/tests and generated Relay artifacts
- `docs/work/product-trust-and-discovery.md`

## Verification

- Context and GraphQL tests for ownership, token entropy, immutability,
  revocation, missing products, ordering, and privacy redaction.
- Frontend tests for publish control, self-contained rendering, disclaimer, and
  revoked/not-found behavior.
- Relay generation, TypeScript, client/SSR builds, backend gates, queue
  validation, and diff hygiene.

Reviews and product Q&A are next after immutable public sharing is green.
