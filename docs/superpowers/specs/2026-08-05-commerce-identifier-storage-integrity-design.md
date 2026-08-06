# Commerce Identifier Storage Integrity Design

## Context

Pricing merchant slugs and affiliate-network codes are persisted canonical
commerce identifiers. `Merchant.changeset/2` accepts only lowercase
alphanumeric hyphen-separated slugs. `AffiliateNetwork.changeset/2` first
normalizes a code and then accepts only lowercase alphanumeric underscore-
separated codes. Both columns are non-null and unique, but PostgreSQL lacks
the matching format checks.

Direct SQL or bulk writes can therefore persist malformed identifiers despite
the established changeset boundary. The two fields share one storage outcome:
canonical commerce identifiers remain syntactically safe without changing the
normalization or lookup behavior that produces them.

## Approaches Considered

### 1. Two named forward checks in one commerce-identifier migration

Add `merchants_slug_format_check` and
`affiliate_networks_code_format_check`, use exact POSIX regular expressions,
map both in their owning changesets, and prove direct-write rejection.

This is the selected approach. Both rules are compact, static, exact
translations of existing validations and have the same preflight, migration,
and direct-write acceptance boundary.

### 2. Create a shared identifier-validation framework

Rejected. The two concrete table checks have no shared runtime API, and a
framework would broaden scope without strengthening either stored field.

### 3. Add new normalization or identifier policy

Rejected. `AffiliateNetwork.changeset/2` already owns code normalization and
merchant-slug generation already owns its current output. Storage checks must
validate persisted values only, not change how callers construct them.

## Design

Create `20260805060000_enforce_commerce_identifier_storage_integrity.exs` with
these named checks:

```sql
slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
code ~ '^[a-z0-9]+(_[a-z0-9]+)*$'
```

Map the checks in the existing `Merchant.changeset/2` and
`AffiliateNetwork.changeset/2`. A single repository suite will directly
insert malformed and valid rows for each table. Existing merchant detail and
affiliate workflow suites retain lookup, deterministic slug, normalization,
and upsert behavior.

## Boundaries

- Preserve merchant lookup, slug generation and stability, affiliate upsert,
  and `AffiliateNetwork.normalize_code/1` behavior.
- Preserve column types, non-nullability, unique indexes, and existing valid
  identifier formats.
- Add no identifier length limits, Unicode rules, new normalization, URL
  policy, framework, or generic constraint helper.
- Stop if preflight finds a malformed stored value; do not rewrite commerce
  history to make the migration pass.
- Use a forward migration and never reset the development database.

## Verification

- The live test-database preflight returns zero invalid merchant slugs and
  affiliate-network codes.
- Direct-write regressions prove each exact constraint name and valid controls.
- The 4-test merchant-detail and 10-test affiliate-workflow baselines preserve
  commerce reads and upserts.
- Full backend test, type, quality, format, queue, and diff gates pass during
  execution.

## Failure Handling

If either preflight query returns rows, report the table, IDs, and stored
values and stop before migration. A coordinator must make the data decision.
