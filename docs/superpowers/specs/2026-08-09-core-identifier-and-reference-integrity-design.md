# Core Identifier And Reference Integrity Design

## Status

Approved for one consolidated implementation batch on 2026-08-09.

## Objective

Make PostgreSQL and the owning Ecto boundaries preserve the repository's
established canonical-identifier and numeric-claim reference contracts when
writes bypass normal application flows. Treat the individual tables and
constraints as internal slices of one core persisted-integrity outcome rather
than separate queue batches.

## Product Decisions

- Canonical stored route and provider identifiers reject trailing newlines and
  any other character outside their existing ASCII formats. Elixir must use
  exact whole-string matching, and PostgreSQL must enforce the same accepted
  set. Affiliate-network input retains its existing normalization before the
  exact stored-code validation.
- A specification unit cannot be deleted while a numeric product-attribute
  claim references it. Numeric claims retain both their source unit identity
  and canonical base value.
- Existing valid values are preserved. The batch adds no normalization,
  rewriting, length limit, Unicode policy, or identifier-generation policy.

## Considered Approaches

### 1. One explicit persisted-integrity batch (selected)

Keep domain-owned regexes and changesets, add explicit named PostgreSQL
constraints, and group the identifier and numeric-reference work under one
plan, lane record, verification boundary, and pull request. Use internal
milestone commits for characterization and implementation.

This matches the repository's consolidation rule: each individual migration is
too small for a queue row, but together they deliver one reviewer-sized promise
that durable core identity and reference facts cannot contradict established
application contracts.

### 2. Separate queue rows per table or domain (rejected)

Product slugs, commerce identifiers, taxonomy slugs, snapshot tokens, and claim
companions could each receive a plan. That would recreate migration-sized
micro-batches, duplicate planning and closeout material, and make the queue
floor reward artificial splitting.

### 3. A generic identifier or storage-policy framework (rejected)

A shared validation DSL, reflection guard, or new normalization layer would be
larger in code but not in product value. The accepted formats are already
locally owned, and no repeated runtime abstraction is needed to add the exact
database protections.

## Architecture

The batch has two implementation slices with one acceptance boundary.

### Slice 1: Exact canonical and public identifiers

Use exact Elixir anchors (`\A` and `\z`) in each owning pattern. Do not add a
shared regex module: product, taxonomy, commerce, affiliate, and snapshot
owners retain their local contracts.

`AffiliateNetwork.changeset/2` continues to normalize input before applying its
exact pattern. A raw newline may therefore normalize away at the application
boundary, while malformed stored codes remain impossible through PostgreSQL.

Add named PostgreSQL checks for:

- `products.slug`;
- `product_slug_aliases.slug`;
- `product_slug_reservations.slug`;
- `merchants.slug`;
- `affiliate_networks.code`; and
- nullable `taxons.seo_slug`.

The product reservation check protects the shared canonical-and-historical
namespace itself, not only its two trigger-fed source tables. The taxonomy
check belongs here because `seo_slug` is an immutable published category route
identifier with the same accepted format.

`comparison_snapshots.public_token` already has the named
`comparison_snapshots_public_token_format` PostgreSQL check. Tighten the Ecto
format pattern to exact whole-string matching and map that existing named
failure through the changeset. Tighten the public lookup pattern to the same
exact form so invalid tokens are rejected before querying.

Each owning schema maps its named check where an Ecto changeset owns writes.
`product_slug_reservations` has no application schema, so its constraint is
database-owned and exercised through direct SQL plus the existing namespace
triggers.

### Slice 2: Numeric claim companions and unit retention

Add named PostgreSQL checks to `product_attribute_claims` that preserve the
current `ProductAttributeClaim.changeset/2` rules:

- `value_num` requires both `unit_id` and `value_num_base`;
- `unit_id`, `value_num_base`, `value_num_base_min`, and
  `value_num_base_max` are absent when `value_num` is absent; and
- when both range bounds exist, `value_num_base_min` is less than or equal to
  `value_num_base_max`.

Replace the `product_attribute_claims.unit_id` foreign key's `ON DELETE SET
NULL` behavior with a restrictive reference. This makes Unit deletion agree
with the established claim contract instead of silently erasing a numeric
claim's source-unit identity. Unreferenced Units remain deletable, including
through the existing Dimension cascade. Unit conversion semantics and
Dimension ownership remain unchanged.

Map the named companion, range, and Unit foreign-key failures through
`ProductAttributeClaim.changeset/2`. Do not change typed-value normalization,
unit conversion, filtering, claim selection, or correction behavior.

## Migration Safety

Run read-only preflights immediately before adding constraints:

- all non-null identifier values match their proposed exact PostgreSQL
  predicates;
- all numeric claims have the required companions and no non-numeric claim has
  numeric companions;
- all paired numeric ranges are ordered; and
- every non-null claim `unit_id` resolves to a Unit.

Every preflight must return zero invalid rows. If any row fails, stop and report
the table plus stable identifiers without rewriting or deleting data.

Use forward, reversible migrations later than the current maximum migration.
Drop dependent foreign keys before replacing them, use stable explicit names,
and restore the original foreign-key behavior in `down/0`. Do not reset any
database.

## Error Handling

- Application writes return changeset errors for named identifier, companion,
  range, and Unit-reference violations.
- Trigger-driven slug reservation failures remain attributable to the named
  reservation constraint and roll back the source write atomically.
- Migration preflight failure is a blocker, not an invitation to repair data in
  this batch.
- No fallback silently trims, normalizes, substitutes, or removes a value.

## Testing Strategy

Follow red-green test cycles for both slices.

Identifier characterization covers trailing-newline rejection and valid/null
controls for every affected table, product namespace trigger behavior, strict
Ecto changesets, and invalid snapshot lookup filtering. Existing slug lookup,
historical alias, merchant detail, affiliate upsert, category SEO, snapshot
publication, and sitemap behavior form the affected regression boundary.

Numeric characterization covers direct inserts missing each required companion,
companions on non-numeric claims, inverted paired ranges, referenced Unit
deletion, valid numeric claims with optional range bounds, unreferenced Unit
deletion, and existing single-typed-value behavior. Existing definition,
conversion, claim proposal/import, filtering, recommendation, comparison,
snapshot, SEO, and GraphQL catalog suites form the affected regression
boundary.

After focused and affected tests, run the complete backend suite, type checks,
quality checks, formatting, queue validation, and diff hygiene.

## Queue And Documentation Shape

Create one implementation plan and one lane record named Core Identifier And
Reference Integrity. Replace the current commerce-only `needs_decision` row
with one consolidated `ready` row only after the plan contract is complete.
Product slugs, commerce identifiers, taxonomy slugs, snapshot tokens, numeric
claim companions, and Unit retention remain internal slices and never count as
separate ready rows.

The ready-floor exception remains valid unless independent source-backed
outcomes are also found. It must not be removed merely because this plan has
multiple internal slices.

## Non-Goals

- New identifier length limits, case folding, trimming, Unicode acceptance, or
  automatic normalization.
- Format rules for codes that do not already have application validation.
- GTIN/MPN policy changes or external-source identifier redesign.
- Specification Unit, Dimension, Attribute, or Enum deletion APIs.
- Numeric finiteness policy not already enforced by the application contract.
- Generic constraint helpers, schema macros, or database-policy frameworks.
- Data repair, deferred discussions/community work, eBay fallback, ingestion
  dashboards, operator pages, email delivery, or production-readiness work.

## Acceptance Criteria

- Exact application and PostgreSQL identifier formats agree across all named
  owners, including trailing-newline boundaries.
- Direct writes cannot persist malformed canonical identifiers or inconsistent
  numeric claim companions.
- Referenced Units cannot be deleted; unreferenced Units retain current deletion
  behavior.
- Existing lookup, namespace, ingestion, specification, comparison, SEO, and
  GraphQL behavior passes its affected regression suites.
- One consolidated queue row, plan, lane record, implementation history, and
  closeout describe the outcome without promoting its internal slices.
