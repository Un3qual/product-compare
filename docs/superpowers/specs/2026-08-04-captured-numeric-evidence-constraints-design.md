# Captured Numeric Evidence Constraints Design

## Problem

Product Compare already rejects impossible numeric values at the source boundary:
price points reject negative price and shipping values, product-taxonomy and
attribute-claim confidence stays between zero and one, and price-watch inputs
enforce nonnegative targets plus percentage drops greater than zero and no more
than one hundred. The immutable comparison-snapshot tables and copied alert
facts persist those same values without equivalent PostgreSQL constraints.

That leaves trusted internal capture code as the only protection against an
impossible copied fact. A future bulk insert, repair task, or capture regression
could persist evidence that the source tables themselves reject.

## Decision

Enforce source-domain parity at the copied-storage boundary.

- Comparison snapshot attribute confidence is null or within `0..1`.
- Comparison snapshot offer prices and ranking landed prices are nonnegative.
- Price-watch captured baselines are null or nonnegative.
- Alert event item, shipping, landed, baseline, and target amounts are
  nonnegative when present.
- Alert event percentage drops are null or greater than zero and no more than
  one hundred.

The constraints belong in the unreleased migrations that create the affected
tables. Focused database tests must prove both valid boundary values and direct
SQL rejection of invalid values.

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

### Source-domain parity at copied tables

This is the selected approach. It closes a concrete integrity gap with named
constraints, no new abstraction, and no public behavior change.

## Boundaries

- Do not add precision or scale limits; provider and measurement precision is a
  separate decision.
- Do not constrain `purchase_price_facts.price_delta`; it is intentionally
  signed.
- Do not constrain specification numeric values or unit offsets; their domains
  depend on the owning attribute or unit.
- Do not redesign alert or comparison capture code, GraphQL payloads, or
  frontend presentation.
- Do not reset the development database. Rebuild only the test database.

## Verification

- A clean test-database rebuild applies the rewritten unreleased migrations.
- Focused direct-SQL tests prove every named constraint rejects invalid data and
  accepts boundary-valid data.
- Existing comparison snapshot and alert lifecycle suites remain green.
- Full backend tests, type checks, quality, formatting, queue validation, and
  diff checks pass.

