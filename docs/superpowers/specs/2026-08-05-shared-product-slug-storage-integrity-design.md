# Shared Product Slug Storage Integrity Design

## Problem

`Product.changeset/2` and `ProductSlugAlias.changeset/2` already require the
same canonical slug shape: `^[a-z0-9]+(?:-[a-z0-9]+)*$`. PostgreSQL currently
enforces non-null values, per-table uniqueness, cross-table reservation
uniqueness, and historical-alias immutability, but direct writes can still
insert a slug whose lexical shape the owning changesets reject.

That mismatch allows repair SQL, bulk writes, or future code that bypasses the
changesets to persist a canonical or historical route key containing uppercase
letters, leading or trailing hyphens, repeated hyphens, whitespace, Unicode,
or other non-canonical characters.

## Decision

Add one forward migration with a named check on each owning table. PostgreSQL's
POSIX equivalent of the established Ecto regular expression is
`^[a-z0-9]+(-[a-z0-9]+)*$`.

- `products.slug` is protected by `products_slug_canonical_format`.
- `product_slug_aliases.slug` is protected by
  `product_slug_aliases_slug_canonical_format`.
- `Product.changeset/2` and `ProductSlugAlias.changeset/2` map their respective
  named checks to `:slug`.

The migration first checks both tables for existing violations and raises with
the affected table and row count if any are present. It does not rewrite,
normalize, or delete stored slugs.

## Existing Database Responsibilities

The existing shared reservation design remains authoritative for namespace
ownership:

- `product_slug_namespace_uq` preserves uniqueness across canonical and
  historical slugs.
- `products_maintain_slug_reservation` maintains canonical reservations.
- `product_slug_aliases_maintain_reservation` maintains historical
  reservations.
- `product_slug_aliases_prevent_updates` preserves historical-alias identity.

The new checks add lexical validity only. They do not replace or modify these
indexes, functions, or triggers.

## Alternatives Considered

### Keep application-only validation

This leaves direct SQL and bulk-write paths able to persist route keys that the
application itself cannot create. It does not close the established storage
boundary.

### Normalize invalid slugs in PostgreSQL

Automatic lowercasing, trimming, or hyphen rewriting could collide with an
existing reservation and would introduce new mutation policy. Invalid writes
must fail instead.

### Add a generic repository-wide slug framework

Other slug-like fields have different ownership and publication contracts.
This batch concerns only the two tables that already share one product route
namespace and one exact application regex.

## Boundaries

- Preserve the exact accepted language; add no length limit.
- Add no normalization, case folding, trimming, transliteration, or Unicode
  policy.
- Do not change product routes, lookups, search documents, redirect behavior,
  or GraphQL contracts.
- Do not change cross-table reservation uniqueness or alias immutability.
- Do not add a generic slug module, macro, registry, or policy framework.
- Stop if preflight finds an invalid stored slug; do not repair data inside the
  migration.
- Use a new forward migration; do not rewrite an applied migration.

## Verification

- A focused direct-write suite proves both tables reject uppercase, leading or
  trailing hyphens, repeated hyphens, whitespace, Unicode, and punctuation.
- The same suite proves representative canonical values remain accepted.
- Existing product lookup and search-document suites prove reservation,
  immutability, historical lookup, and search refresh behavior are unchanged.
- Full backend test, type, quality, formatting, queue, and diff gates pass.
