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

No implementation rows are currently ready.

## Ready Floor Exception

Reason: The repository-wide quality remediation, CJ live-conversion lifecycle,
and deterministic development fixtures are complete. Their closeout curation
checked current product behavior, full repository gates, source markers,
architecture gaps, the candidate catalog, and lane evidence without finding
another coherent, independently reviewable outcome that is ready to execute.
The remaining product and provider possibilities require a decision or external
evidence and remain deferred.
Rejected split: Re-dispatching completed quality cleanup, CJ storage, provider
transport, scheduling, GraphQL, development seeds, or operator workspace slices
would manufacture path-sized work. Remaining PostgreSQL-specific expressions
and native database boundaries are intentional, while isolated style edits,
test assertions, helpers, and speculative abstractions are not coherent product
outcomes.
Replenishment action: Repeat evidence-backed curation after a new product
decision, external provider evidence, failing contract, or architecture gap
appears, and promote every independently shippable validated outcome then.

## Needs Decision Work

None.

## Blocked Work

None.
