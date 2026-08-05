# Captured Numeric Evidence Constraints Design

## Problem

Product Compare already rejects ordinary out-of-range numeric values at the
source boundary: price points reject negative price and shipping values,
product-taxonomy and attribute-claim confidence stays between zero and one, and
price-watch inputs enforce nonnegative targets plus percentage drops greater
than zero and no more than one hundred. The original PostgreSQL lower-bound
checks still admit `NaN` and positive `Infinity`, while immutable
comparison-snapshot tables and copied alert facts initially persisted those
same values without equivalent PostgreSQL constraints.

That leaves trusted internal capture code as the only protection against an
impossible copied fact. A future bulk insert, repair task, or capture regression
could persist invalid source data or copy it into evidence tables.

## Decision

Enforce source-domain parity at the copied-storage boundary.

- Comparison snapshot attribute confidence is null or within `0..1`.
- Comparison snapshot offer prices and ranking landed prices are finite and nonnegative.
- Price-point price and shipping values are finite and nonnegative when present.
- Price-watch target amounts are finite and nonnegative when present.
- Price-watch captured baselines are null or finite and nonnegative.
- Alert event item, shipping, landed, baseline, and target amounts are
  finite and nonnegative when present.
- Alert event percentage drops are null or greater than zero and no more than
  one hundred.

The constraints belong in dedicated forward migrations because migrations that
created the affected tables, and any review-corrected migration already applied
in a local or preview database, must not be rewritten. Focused database tests
must prove upgrade and rollback behavior, valid finite boundary values, and
direct SQL rejection of negative and non-finite values.

## Alternatives Considered

### Application-only validation

This preserves the current state but leaves `insert_all`, direct SQL, repair
tasks, and future capture paths able to bypass the invariant. It does not match
the repository's existing database-domain policy.

### One generic numeric-policy framework

A repository-wide classifier could discover every decimal field, but numeric
domains are intentionally heterogeneous. Measurement values, unit offsets, and
signed price deltas are valid open domains. A generic framework would require a
large classification registry without improving the concrete captured-evidence
boundary.

### Source-domain parity at source and copied tables

This is the selected approach. It closes the copy boundary and prevents invalid
source rows from poisoning later capture with named constraints, no new
abstraction, and no public behavior change.

## Boundaries

- Do not add precision or scale limits; provider and measurement precision is a
  separate decision.
- Reject PostgreSQL numeric special values such as `NaN` and positive
  `Infinity`; they are not captured monetary evidence.
- Do not constrain `purchase_price_facts.price_delta`; it is intentionally
  signed.
- Do not constrain specification numeric values or unit offsets; their domains
  depend on the owning attribute or unit.
- Do not redesign alert or comparison capture code, GraphQL payloads, or
  frontend presentation.
- Reject invalid source values at storage rather than filtering them during
  snapshot or alert copying.
- Do not reset the development database. Rebuild only the test database.

## Verification

- Isolated migration tests apply each forward migration to an existing schema,
  prove the checks are active, and roll them back cleanly.
- Focused direct-SQL tests prove every named constraint rejects negative and
  non-finite data and accepts boundary-valid finite data.
- Existing comparison snapshot and alert lifecycle suites remain green.
- Full backend tests, type checks, quality, formatting, queue validation, and
  diff checks pass.
