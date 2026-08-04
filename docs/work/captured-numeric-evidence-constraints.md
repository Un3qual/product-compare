# Captured Numeric Evidence Constraints

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-04-captured-numeric-evidence-constraints-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-04-captured-numeric-evidence-constraints-design.md`
- Last verified: 2026-08-04 against the current unreleased comparison-snapshot
  and alert migrations, their source-schema changesets, and existing database
  checks.

## Target Outcome

Immutable comparison evidence and copied alert facts retain the numeric domains
of their source records even when a write bypasses application changesets.

## Ready Evidence

- Price points already enforce nonnegative price and shipping values in both
  changesets and PostgreSQL.
- Product-taxonomy and attribute-claim confidence already enforce the `0..1`
  domain in both changesets and PostgreSQL.
- Price-watch inputs already enforce nonnegative targets and percentage drops
  in `(0, 100]`.
- Comparison snapshot attribute, offer, and ranking copies have only positional
  checks; their copied confidence and price columns have no domain checks.
- Alert events persist item, shipping, landed, baseline, target, and percentage
  facts without equivalent database checks.
- The price-watch captured baseline is not covered by its existing rule-shape
  constraint.

## Boundaries

- Preserve GraphQL, capture, hydration, and frontend behavior.
- Add no decimal precision or scale policy.
- Leave signed price deltas, specification numeric values, and unit offsets open.
- Modify only unreleased first-party migrations and the focused mutable-schema
  constraint mapping.
- Never reset the development database.

## Internal Slices

1. Failing direct-write constraint characterization.
2. Named comparison snapshot and alert/watch constraints.
3. Clean test-database rebuild, lifecycle parity, and full backend verification.

## Verification

- `MIX_ENV=test mix ecto.reset`
- focused captured numeric evidence constraint suite
- comparison snapshot, alert, pricing, specification, taxonomy, and
  commerce-attribution suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Stop and record the exact field if current data or capture behavior relies on a
value outside the source domain. Do not widen the constraint or invent a new
numeric policy to make the test pass.

