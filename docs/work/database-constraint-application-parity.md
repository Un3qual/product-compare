# Database Constraint Application Parity

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-09-database-constraint-application-parity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-09-database-constraint-application-parity-design.md`
- Last verified: 2026-08-09 against the live PostgreSQL catalog, owning
  changesets, migrations, write contexts, and focused tests.

## Target Outcome

Every reachable application-owned same-row PostgreSQL check has equivalent
pre-write Ecto validation and an explicit `check_constraint/3` mapping.
PostgreSQL remains the final authority, the slug-reservation trigger remains a
documented exception, and dependent discussion reads, locks, and writes cannot
run outside their required transaction.

## Owned Paths

- `AGENTS.md`
- `priv/repo/migrations/20260809130300_remove_redundant_price_point_checks.exs`
- the alert, snapshot, catalog, commerce-attribution, discussion, ingestion,
  specification, and taxonomy schemas named by the implementation plan
- `lib/product_compare/discussions/content_lifecycle.ex`
- `lib/product_compare/discussions/submissions/write_limits.ex`
- the focused owner, direct-write, mapping, and transaction tests named by the
  implementation plan
- `docs/work/database-constraint-application-parity.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`

## Internal Slices

1. Immutable snapshot, alert-event, and watch-baseline numeric validation
   parity.
2. Affiliate-link, write-window, ingestion-terminal, and thread-parent parity,
   including direct-post transaction ownership and an enforced outer
   transaction for write-limit accounting.
3. Existing-validator error mappings, redundant price-check retirement,
   permanent guidance, catalog reconciliation, and one closeout.

## Verified Preconditions

- The live catalog contains 75 application-owned active checks after excluding
  five Oban-owned checks.
- The audited missing-validation and missing-mapping names match the approved
  design inventory.
- Existing snapshot, alert, affiliate, ingestion, and discussion transactions
  and locks match the design, except for the two explicit discussion gaps in
  this batch.
- `product_slug_reservations_slug_format_check` is maintained by triggers in
  the originating product or alias statement and has no application write
  schema.
- The clean implementation baseline passes 1,327 tests.

## Boundaries

- Add no query-before-write existence or uniqueness validation.
- Add no generic validator framework, constraint registry, DSL, source scanner,
  catalog-driven CI policy, or inferred semantic-equivalence test.
- Preserve accepted values, stored facts, normalization, public error text,
  snapshot immutability, alert behavior, ingestion lifecycle, and discussion
  same-thread and cycle policy.
- Remove only `price_must_be_non_negative` and
  `shipping_must_be_non_negative`; retain their finite, non-negative
  replacements.
- Do not touch third-party checks.

## Verification

- RED/GREEN numeric, cross-field, state, mapping, direct-write, and transaction
  suites named by the plan
- reversible price-check migration proof
- one-time post-migration catalog-to-owner reconciliation
- `mix test`
- `mix typecheck`
- `mix quality`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Stop if the live constraint inventory drifts, a named owner has another write
changeset, a transaction test exposes an unplanned lock order, or an owned path
conflicts with active work. Record the exact constraint or path; do not widen
product policy or add a generic framework to continue.

## Completion

Replace this prospective target with observed mappings, validations, migration,
transaction, catalog, and verification evidence. Close exactly one queue row;
do not promote its internal slices separately.
