# PostgreSQL Native Storage Types Design

## Summary

ProductCompare targets PostgreSQL 18 and already uses database-native UUIDs,
JSONB, arrays, full-text search vectors, enums, case-insensitive text, dates,
booleans, numerics, and binary token digests. A repository and live-catalog
audit found four first-party storage contracts that still use weaker database
representations:

- click IP addresses are stored as text;
- three SHA-256 digests are stored as lowercase hexadecimal text;
- a price-watch cooldown is stored as an integer count of seconds; and
- application UTC instants are stored as `timestamp without time zone` even
  though their Ecto and domain contracts represent absolute UTC instants.

This change adopts PostgreSQL-native `inet`, `bytea`, `interval`, and
`timestamptz` representations, keeps the existing public GraphQL contracts,
and adds a catalog-backed policy test so future first-party persistence does
not regress to weaker types.

PostgreSQL having a built-in type is not sufficient reason to use it. The
audit explicitly retains `numeric` plus a currency foreign key for money,
separate validity/lifecycle endpoints instead of range types, and text for
values such as URLs, external identifiers, encoded password hashes, slugs,
and standards codes where text is the correct domain representation.

## Goals

- Persist individual IPv4 and IPv6 host addresses as PostgreSQL `inet`.
- Persist application-owned SHA-256 values as their raw 32-byte digest.
- Persist the price-watch cooldown as a PostgreSQL day-to-second interval.
- Persist every first-party absolute instant as `timestamptz(6)`.
- Preserve the current GraphQL input and output shapes for IP addresses,
  cooldown seconds, and datetimes.
- Make the native-type policy discoverable and enforceable against the live
  migrated PostgreSQL catalog.
- Keep the unreleased migration history clean instead of preserving obsolete
  development-only representations through compatibility migrations.

## Non-Goals

- Do not use PostgreSQL `money`.
- Do not change supported currencies, currency IDs, or monetary rounding
  policy.
- Do not replace coupon validity endpoints or ingestion lifecycle endpoints
  with range or multirange columns.
- Do not alter Oban tables, Ecto's `schema_migrations` table, or other
  dependency-owned schemas.
- Do not change GraphQL scalars, field names, or generated frontend artifacts
  solely because the internal database representation changes.
- Do not convert encoded password hashes, provider identifiers, public tokens,
  URLs, slugs, country/currency numeric codes, or arbitrary prose to binary or
  numeric types.
- Do not reset or destroy the developer's local development database as part
  of implementation without separate explicit approval.

## Audited Type Decisions

### Types adopted

| Domain value | Current storage | Approved storage | Application representation |
| --- | --- | --- | --- |
| Click host address | `text` | `inet` | `%Postgrex.INET{}` through `EctoNetwork.INET` |
| Source artifact content digest | hexadecimal `text` | `bytea` with 32-byte constraint | raw SHA-256 binary |
| Ingestion scope fingerprint | hexadecimal `text` | `bytea` with 32-byte constraint | raw SHA-256 binary |
| Product-claim fingerprint | hexadecimal `text` | `bytea` with 32-byte constraint | raw SHA-256 binary |
| Price-watch cooldown | `bigint` seconds | `interval DAY TO SECOND` | `%Duration{}` |
| First-party absolute instants | `timestamp(6)` | `timestamptz(6)` | UTC `%DateTime{}` through `:utc_datetime_usec` |

### Types deliberately retained

Monetary amounts remain PostgreSQL `numeric` values associated with the
existing currency foreign key. PostgreSQL `money` does not encode a currency,
uses locale-dependent input/output, and has a fixed fractional precision. On
the project's PostgreSQL 18.4 development server, casting `1.234` and `1.235`
to `money` produced `$1.23` and `$1.24`. That representation cannot faithfully
model currencies with zero or three minor units and is less suitable than the
current exact decimal-plus-currency model.

Coupon `valid_from` and `valid_to` values remain distinct instant columns.
They are independently nullable, projected, filtered, and ordered. No product
invariant requires coupon windows to be mutually exclusive, so PostgreSQL 18
temporal `WITHOUT OVERLAPS` constraints and range-backed temporal foreign keys
do not apply.

Ingestion `started_at` and `finished_at` values also remain distinct instant
columns. An unfinished run legitimately has no finish time, and existing reads
order or filter the endpoints independently. A range would obscure rather
than strengthen that lifecycle.

URLs, domains, slugs, provider identifiers, public tokens, external SKUs,
country/currency numeric codes, and prose remain text. PostgreSQL has no more
specific built-in type matching those application contracts. Encoded Argon2
password hashes remain text because the encoded value includes algorithm and
work-factor metadata rather than being a fixed raw digest.

## Database Architecture

### Native IP storage

`commerce_click_sessions.ip_address` becomes nullable `inet`. Add
`ecto_network` 1.6 and declare the Ecto field as `EctoNetwork.INET`. The
request-diagnostics extractor may pass Phoenix's `conn.remote_ip` tuple
directly; the Ecto type also accepts textual host addresses at trusted
application boundaries and rejects invalid values.

Only host addresses are stored. No subnet aggregation or masking is added, and
no forwarding header is trusted outside Phoenix's existing proxy/endpoint
configuration. Operator GraphQL output renders the value as its canonical
textual IPv4 or IPv6 host address. The raw address remains absent from logs and
public user surfaces.

### Raw digest storage

The following columns become nullable or required `bytea` according to their
existing nullability:

- `source_artifacts.content_hash`;
- `ingestion_runs.scope_fingerprint`; and
- `product_attribute_claims.fingerprint`.

Every application producer returns `:crypto.hash(:sha256, payload)` directly
instead of Base16-encoding it. Changesets and database constraints require
exactly 32 bytes when a digest is present. Unique and partial indexes continue
to operate on the same logical value with a smaller, unambiguous binary
representation. Seeds and tests use deterministic raw digests rather than
human-readable placeholders.

These conversions do not affect password hashes, token prefixes, or already
binary API/session/idempotency digests.

### Native cooldown interval

Rename the relational price-watch column from `cooldown_seconds` to
`cooldown`, stored as `interval DAY TO SECOND`. The Ecto schema exposes
`cooldown` as `:duration`, and Postgrex uses a project type module configured
with `interval_decode_type: Duration` so reads and writes use Elixir's built-in
`Duration` struct.

The database constraint retains the existing inclusive minimum of 60 seconds
and maximum of 31,536,000 seconds using interval literals. The column excludes
year and month fields because their length is calendar-dependent and the
product contract is an exact elapsed duration.

GraphQL continues to accept and return `cooldownSeconds` as an integer. The
alerts boundary converts accepted seconds to `%Duration{second: seconds}` and
converts the restricted day/hour/minute/second duration back to an exact
integer for output and evaluation. Internal seeds and domain tests use
`Duration`, making units explicit instead of passing bare integers.

### Time-zone-aware instants

Every first-party column represented by an Ecto `:utc_datetime_usec` field or
first-party migration timestamp becomes `timestamptz(6)`. This includes normal
`inserted_at`/`updated_at` timestamps and domain instants such as observation,
validity, moderation, ingestion, attribution, token-expiry, and snapshot
times.

Ecto schemas remain `:utc_datetime_usec`; Postgrex decodes `timestamptz` as a
UTC `%DateTime{}` that Ecto already accepts. Repository migration configuration
uses `migration_timestamps: [type: :timestamptz]`, and existing unreleased
migrations explicitly use `:timestamptz` with precision 6 where required.
Date-only values remain PostgreSQL `date`.

Oban's tables and Ecto's `schema_migrations` table remain dependency-owned and
are excluded from this policy. The application must not patch their column
types.

## Migration Strategy

ProductCompare is still in development, and the affected definitions have not
become a released production migration contract. Update the original
first-party migrations in place so a clean database is created with the final
native types. Do not add rename/conversion migrations whose only purpose would
be preserving obsolete local development representations.

Implementation verification rebuilds the test database from the complete
migration history. The current local development database is known to contain
the former hash-named attribution columns and other stale migration shapes.
Implementation may inspect it, but it must not run `mix ecto.reset` against the
development database without separate user approval. The handoff will state
that developers must reset development databases to adopt the rewritten
unreleased schema.

## Application Boundaries

The database-native representations stay internal:

- request extraction produces an IP tuple or valid host text, and operator
  GraphQL presentation produces canonical text;
- hashing functions produce raw binaries, and no public API exposes the three
  affected digest fields;
- GraphQL price-watch inputs and outputs remain integer seconds while the
  alert domain and database use `Duration`; and
- GraphQL datetime scalars continue to accept and return ISO-8601 UTC values
  while PostgreSQL stores absolute instants.

There are no fallback casts that silently accept malformed values. Invalid IP
addresses produce changeset errors, digests of the wrong byte length fail
changeset and database checks, cooldowns outside the current bounds fail, and
non-UTC datetimes continue through Ecto's existing UTC normalization and
validation.

## Native Storage Policy Guard

Add a focused repository test that reflects compiled Ecto schemas and queries
the clean migrated PostgreSQL catalog. It must prove:

- every persisted `EctoNetwork.INET` field is backed by `inet`;
- the three approved SHA-256 fields are backed by `bytea` and enforce 32-byte
  values;
- the price-watch cooldown is backed by an interval restricted to day through
  second fields;
- every first-party `:utc_datetime_usec` field and first-party migration
  timestamp is backed by `timestamptz`;
- no first-party `timestamp without time zone` column remains; and
- dependency-owned Oban and Ecto migration tables are explicitly outside the
  contract.

Failures report the schema, table, column, Ecto type, and observed PostgreSQL
type so a future regression is actionable. This test complements rather than
duplicates the existing categorical and JSON storage policy guards.

## Testing And Verification

Implementation follows red-green-refactor cycles for each storage family.
Focused coverage includes:

- IPv4 and IPv6 request capture, persistence, operator GraphQL rendering, and
  invalid-address rejection;
- 32-byte digest persistence, deterministic replay/conflict behavior, and
  wrong-length rejection for each digest owner;
- cooldown changeset bounds, GraphQL integer compatibility, persistence as
  `Duration`, and alert evaluation at the exact cooldown boundary;
- catalog assertions for `inet`, `bytea`, constrained `interval`, and
  `timestamptz(6)`; and
- clean migration execution on PostgreSQL 18.

The final gate includes formatting, compilation, type checking, code quality,
the complete backend test suite with coverage, affected frontend checks if the
GraphQL contract fixtures change, work-queue validation, and `git diff
--check`.

## Delivery And Queue Ownership

This is one independently reviewable database-domain batch because every
change enforces the same invariant: first-party values use the strongest
PostgreSQL representation that preserves their application semantics. The
implementation plan may use milestone commits for IP/digests, interval, and
instant storage, but those are internal slices rather than separate queue
rows.

Before implementation is claimed, the coordinator will add this batch as a
complete ready row. The current three ready rows then remain available and the
repository's three-row dispatch floor is preserved. The batch owns the native
type migrations, affected schemas and domain boundaries, focused tests, its
lane work document, and the coordinator queue update required to promote and
claim it.
