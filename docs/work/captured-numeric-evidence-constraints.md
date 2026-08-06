# Captured Numeric Evidence Constraints

## Snapshot

- Status: complete
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-04-captured-numeric-evidence-constraints-implementation-plan.md`
- Last verified: 2026-08-05 after the captured- and source-boundary
  forward-migration review corrections, focused migration and direct-write
  verification, affected GraphQL suites, and full repository gates.
- Implementation commits: `2476a0dc`, `b0bd54cb`, and review follow-up
  `e913ee04`, plus the source-boundary follow-up in this PR.

## Batch Outcome

Source price facts, immutable comparison evidence, and copied alert facts retain
their numeric domains even when a write bypasses application changesets.

## Completed Evidence

- `comparison_snapshot_attributes_confidence_range` permits `NULL` or inclusive
  confidence values from `0` through `1` and rejects values outside that range.
- `comparison_snapshot_offers_amounts_non_negative` requires item, shipping,
  and landed prices to be finite and nonnegative.
- `comparison_snapshot_rankings_landed_price_non_negative` requires copied
  ranking landed prices to be finite and nonnegative.
- `price_watch_rules_baseline_landed_price_non_negative` preserves nullable
  captured baselines while rejecting negative and non-finite values, and the
  mutable price watch changeset maps the named database constraint.
- `price_points_price_finite_non_negative`,
  `price_points_shipping_finite_non_negative`, and
  `price_watch_rules_target_amount_finite_non_negative` reject non-finite source
  amounts before snapshot publication or alert recording can copy them. The
  owning changesets map those named checks, and normalize unsupported Decimal
  special values into ordinary cast errors before Ecto can raise while casting.
- `alert_events_numeric_evidence_bounds` requires finite nonnegative monetary
  facts, permits nullable baseline and target amounts only when finite and
  nonnegative, and permits nullable percentage drops only in `(0, 100]`.
- Forward-migration regressions prove already-created source and copied-evidence
  tables receive the checks and rollback removes them. Direct PostgreSQL writes
  prove every invalid family returns its exact named check violation while
  finite zero monetary values, confidence endpoints `0` and `1`, and percentage
  endpoints greater than zero through `100` remain valid.
- GraphQL, capture, hydration, pricing, specification-claim, taxonomy, alert,
  and commerce-attribution behavior did not change.

## Boundaries

- Preserve GraphQL, capture, hydration, and frontend behavior.
- Add no decimal precision or scale policy.
- Leave signed price deltas, specification numeric values, and unit offsets open.
- Put database changes in a new forward migration; never rewrite migrations that
  may already be applied.
- Never reset the development database.

## Internal Slices

1. Failing direct-write constraint characterization.
2. Named forward comparison snapshot and alert/watch constraints.
3. Source-boundary direct-write characterization and a second forward migration.
4. Upgrade/rollback proof, lifecycle parity, and full backend verification.

## Verification

- Task 2 `MIX_ENV=test mix ecto.reset`: exit `0`; dropped, recreated, and
  migrated only the test database with all five named checks installed.
- `mix test test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`:
  5 tests, 0 failures.
- Comparison snapshot lifecycle command: 15 tests, 0 failures.
- Alert lifecycle command: 15 tests, 0 failures.
- Pricing lifecycle command: 40 tests, 0 failures.
- Specification-claim lifecycle command: 68 tests, 0 failures.
- Taxonomy lifecycle command: 11 tests, 0 failures.
- Commerce-attribution lifecycle command: 126 tests, 0 failures.
- `mix test`: 1,207 tests, 0 failures.
- Review follow-up migration and direct-write command: 6 tests, 0 failures.
- Review follow-up affected GraphQL command: 43 tests, 0 failures.
- Review follow-up combined backend command: 49 tests, 0 failures.
- Source-boundary follow-up focused migration, direct-write, and guard command:
  10 tests, 0 failures.
- Source changeset review follow-up focused migration, direct-write, and
  non-finite Decimal command: 11 tests, 0 failures.
- Source changeset review follow-up affected alert, GraphQL, ingestion,
  migration, and storage command: 66 tests, 0 failures.
- Source changeset review follow-up `mix test --max-cases 10`: 1,224 tests,
  0 failures.
- Source changeset review follow-up `mix typecheck`, `mix quality`, and
  `mix format --check-formatted`: exit `0`; Credo found no issues, the ExDNA
  clone budget remained 3/3, cross-function smell detection found no issues,
  and Dialyzer passed successfully.
- Source changeset review follow-up `mix work_queue.validate`:
  `work queue valid: 3 ready rows`; `git diff --check`: exit `0`.
- Source-boundary follow-up `mix test --max-cases 10`: 1,222 tests,
  0 failures.
- Source-boundary follow-up `mix typecheck`, `mix quality`, and
  `mix format --check-formatted`: exit `0`; Credo found no issues, the ExDNA
  clone budget remained 3/3, cross-function smell detection found no issues,
  and Dialyzer passed successfully.
- Source-boundary follow-up `mix work_queue.validate`:
  `work queue valid: 3 ready rows`; `git diff --check`: exit `0`.
- Review follow-up `mix test`: 1,219 tests, 0 failures.
- Review follow-up frontend focused command: 28 tests, 0 failures.
- Review follow-up full frontend command: 1,530 tests, 0 failures.
- `mix typecheck` and `mix format --check-formatted`: exit `0` with no output.
- `mix quality`: exit `0`; Credo found no issues, the ExDNA clone budget
  remained 3/3, cross-function smell detection found no issues, and Dialyzer
  passed successfully.
- `mix work_queue.validate`: `work queue valid: 3 ready rows` after closeout.
- `git diff --check`: exit `0` after closeout edits.

## Concerns

None. The development database was never reset; only the test database rebuild
explicitly permitted by the plan was performed.

## Blocker Rule

Stop and record the exact field if current data or capture behavior relies on a
value outside the source domain. Do not widen the constraint or invent a new
numeric policy to make the test pass.
