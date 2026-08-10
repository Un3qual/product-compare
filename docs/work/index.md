# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

Completion and coordination records removed from this live surface are
preserved in `docs/plans/2026-07-31-work-index-history.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- At least three complete `ready` implementation rows must exist at every stable
  dispatch boundary unless a complete `Ready Floor Exception` records why the
  repository currently supports fewer coherent outcomes.
- Three is the replenishment floor, not a target or maximum. Promote every
  useful, currently validated candidate whose ownership and prerequisites make
  it executable.
- A queue row is one independently shippable and reviewable outcome. Per-file,
  per-route, path-disjoint, or test-sized implementation steps belong under
  internal slices in the linked plan and lane doc.
- Group candidates that enforce the same invariant and share one acceptance
  boundary. Parallel safety alone does not justify separate queue rows.
- Numeric batch requests and the ready-row floor never justify micro-batches or
  filler. Return fewer coherent batches and record the missing decision when
  the repository does not support the requested count.
- Before a claim would leave fewer than three other ready rows, the coordinator
  validates and promotes more work or commits a complete ready floor exception
  in the same dispatch update.
- Before removing completed or blocked work, preserve truthful lane evidence
  and ensure the committed queue satisfies the floor or its explicit exception.
- `needs_decision` rows are coordinator work: resolve the decision, then promote
  every useful source-backed candidate made executable by it.
- `blocked` rows need external evidence or a product decision. Do not code around
  them.
- Workers claim the highest-ranked compatible `ready` row when three other ready
  rows will remain or the ready floor exception covers the smaller truthful set.
- Dependent, deferred, rejected, blocked, speculative, stale, and unverified
  work cannot be used as queue-depth filler.
- `active` rows are already owned by a named worker or branch. Do not start a
  second worker on them unless the coordinator reassigns the row.
- Completed lanes do not stay in this queue. Their history remains in the lane
  work doc and dated plan archive.

## Active Work

None.

## Ready Work

### Database Constraint Application Parity

Status: ready
Lane: Database constraint application parity
Plan: `docs/superpowers/plans/2026-08-09-database-constraint-application-parity-implementation-plan.md`
Batch outcome: Every reachable application-owned same-row PostgreSQL check has
equivalent pre-write Ecto validation and an explicit error mapping, with
dependent discussion reads and writes protected by enforceable transaction
boundaries.
Next action: add the immutable numeric owner changeset regressions and watch
them fail before changing the five owning schemas.
Owned paths:

- `AGENTS.md`
- `priv/repo/migrations/20260809130300_remove_redundant_price_point_checks.exs`
- alert, snapshot, catalog, commerce-attribution, discussion, ingestion,
  specification, and taxonomy schemas named by the linked plan
- `lib/product_compare/discussions/content_lifecycle.ex`
- `lib/product_compare/discussions/submissions/write_limits.ex`
- focused owner, direct-write, mapping, and transaction tests named by the plan
- `docs/work/database-constraint-application-parity.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`

Internal slices:

- Immutable snapshot, alert-event, and watch-baseline numeric validation
  parity.
- Affiliate-link, write-window, ingestion-terminal, and thread-parent parity
  with explicit discussion transaction ownership.
- Existing-validator mappings, redundant price-check retirement, guidance, and
  consolidated closeout.

Prerequisites:

- The current catalog inventory remains the audited 75 application-owned
  checks after excluding five Oban checks.
- Existing named database checks and the slug-reservation trigger retain their
  audited definitions.
- No active row owns an implementation path.

Verification:

- RED/GREEN owner, direct-write, mapping, and transaction suites named by the
  linked plan
- one-time final catalog-to-owner reconciliation
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: Every active application same-row check with a reachable
changeset is prevalidated and mapped, the reservation trigger remains the sole
documented exception, redundant price checks are removed, transaction evidence
passes, and one completion record closes the batch.

## Ready Floor Exception

Reason: The approved catalog audit validates one consolidated integrity outcome
and no independent reserve row; unrelated provider/operator work remains
deferred.
Rejected split: Numeric, cross-field, mapping, migration, test, transaction,
and guidance work enforce one application/database parity invariant and cannot
be promoted as separate queue filler.
Replenishment action: Complete the consolidated parity outcome, then audit
current product behavior and architecture gaps for a distinct shippable result.

## Needs Decision Work

None.

## Blocked Work

None.
