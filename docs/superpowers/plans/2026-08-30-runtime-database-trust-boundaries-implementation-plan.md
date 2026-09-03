# Runtime And Database Trust Boundaries Implementation Plan

## Goal

Make browser origin/session authority and reachable relational or numeric
database failures fail closed with predictable Phoenix, Ecto, GraphQL, and
PostgreSQL behavior.

## Constraints

- Derive browser authority from validated endpoint configuration, never the
  request Host header.
- Keep cookies host-only unless deployment explicitly configures a domain.
- Reject malformed same-row values in changesets and map their named database
  constraints.
- Keep foreign keys and direct-write constraints database-authoritative; do not
  add preflight relationship queries.

## Implementation

1. Validate production host/public-origin configuration and bind same-origin
   checks and session options to it.
2. Use one finite-decimal Ecto type for persisted decimal fields, update the
   commerce checks, mappings, and focused application/direct-write tests.
3. Map every cast foreign key in Product, ProductTaxon, and CommunityReport and
   use camelCase for GraphQL changeset fields.
4. Add direct evidence for existing community write-receipt and write-window
   storage constraints without introducing a constraint registry.

## Owned Areas

- Runtime endpoint configuration and same-origin plug
- Commerce, product, taxonomy, and community schemas
- Commerce numeric migration
- Focused runtime, changeset, direct-database, GraphQL, and community tests

## Verification

Run focused runtime, commerce, relationship, GraphQL, and community-storage
tests, formatting, type checks, and isolated mix ci. Completion evidence and
milestone commits live in docs/work/runtime-database-trust-boundaries.md.
