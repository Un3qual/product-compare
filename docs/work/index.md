# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

Completion and coordination records removed from this live surface are
preserved in `docs/plans/2026-07-31-work-index-history.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- At least three complete `ready` implementation rows must exist at every stable
  dispatch boundary.
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
  validates and promotes more work in the same dispatch update.
- Before removing completed or blocked work, preserve truthful lane evidence
  and ensure the committed queue still satisfies the floor.
- `needs_decision` rows are coordinator work: resolve the decision, then promote
  every useful source-backed candidate made executable by it.
- `blocked` rows need external evidence or a product decision. Do not code around
  them.
- Workers claim the highest-ranked compatible `ready` row only when three other
  ready rows will remain.
- Dependent, deferred, rejected, blocked, speculative, stale, and unverified
  work cannot be used as queue-depth filler.
- `active` rows are already owned by a named worker or branch. Do not start a
  second worker on them unless the coordinator reassigns the row.
- Completed lanes do not stay in this queue. Their history remains in the lane
  work doc and dated plan archive.

## Active Work

None.

## Ready Work

### 16. Operator Mutation Authorization Freshness

Status: ready
Lane: GraphQL authorization and concurrency
Plan: `docs/superpowers/plans/2026-07-31-operator-mutation-authorization-freshness-implementation-plan.md`
Batch outcome: every operator-only GraphQL mutation serializes its protected
write with operator-role revocation instead of trusting the request-context
user snapshot.
Next action: add failing revocation-first and mutation-first actual-operation
regressions for the affiliate, correction, and CJ-program transaction families,
then prove all six mutation surfaces reject a stale operator snapshot without
changing domain state.
Owned paths:

- `lib/product_compare/accounts.ex`
- `lib/product_compare/accounts/users.ex`
- `lib/product_compare_web/resolvers/affiliate/mutations.ex`
- `lib/product_compare/specs/corrections.ex`
- `lib/product_compare_web/resolvers/ingestion_resolver.ex`
- `test/product_compare/accounts/concurrency_test.exs`
- `test/product_compare_web/graphql/affiliate_workflows_test.exs`
- `test/product_compare_web/graphql/specification_corrections_test.exs`
- `test/product_compare_web/graphql/cj_program_queries_test.exs`
- `docs/work/operator-mutation-authorization-freshness.md`

Internal slices:

- Transaction-required operator-row authorization lock plus stale-snapshot
  denial for all six mutations.
- Shared affiliate network/program/link/coupon transaction with both actual-
  operation serialization orders.
- Specification-correction and CJ-program transactions, each with both actual-
  operation serialization orders.

Prerequisites:

- No active row owns Accounts operator access, affiliate mutations,
  specification correction moderation, or CJ program lifecycle mutation paths.
- Community moderation remains the proven reference and stays behaviorally
  unchanged.
- Operator-only reads remain outside this write-authorization batch.

Verification:

- actual-operation revocation-first and mutation-first regressions for all
  three owning transaction families
- stale-request-snapshot denial for all six mutation surfaces
- Accounts and Discussions concurrency suites
- affiliate workflow, specification correction, and CJ-program GraphQL suites
- complete GraphQL suite and full backend tests
- typecheck, quality, and formatting gates
- `mix work_queue.validate`
- `git diff --check`

Exit condition: a revocation that commits first makes every affected mutation
return its existing forbidden payload without a domain write, a mutation that
locks first remains the user-row lock owner while held at its domain-row barrier
and may commit before revocation, all three owning transactions acquire the
operator row before domain rows, and all backend gates pass.

### 17. Application JSON Storage Policy Guard

Status: ready
Lane: Database domain policy
Plan: `docs/superpowers/plans/2026-07-30-application-json-storage-policy-guard-implementation-plan.md`
Batch outcome: every persisted Ecto map field and PostgreSQL JSON column is
automatically inventoried and explicitly classified, so stable
application-owned facts cannot silently regress into opaque JSON dumps.
Next action: characterize the six current persisted map fields and add the
failing unclassified-schema and unclassified-catalog drift cases.
Owned paths:

- `test/product_compare/repo/application_json_domain_storage_test.exs`
- focused JSON storage policy support under `lib/product_compare/**` only if
  test-local reflection cannot express the contract clearly
- affected allowed-JSON owner tests only if characterization exposes a gap
- `docs/work/application-json-storage-policy-guard.md`

Internal slices:

- Persisted Ecto map-field and PostgreSQL JSON catalog discovery.
- Explicit raw/open/request/typed-JSON classifications.
- Removed snapshot/alert dump regressions and full storage-owner evidence.

Prerequisites:

- Snapshot and alert JSON normalization is complete.
- Provider raw evidence, request metadata, open campaign parameters, and
  explicitly JSON-typed specification values remain valid JSON contracts.

Verification:

- clean migrated database and focused JSON storage policy suite
- affected comparison snapshot, alert, specification, ingestion, and
  commerce-attribution suites
- full backend tests, type checks, and quality gates
- `mix work_queue.validate`
- `git diff --check`

Exit condition: all persisted Ecto map fields and PostgreSQL JSON columns are
discovered and explicitly justified, unclassified JSON storage fails with
actionable evidence, removed application dumps remain absent, and all
repository gates pass.

### 18. Captured Numeric Evidence Constraints

Status: ready
Lane: Database copied evidence integrity
Plan: `docs/superpowers/plans/2026-08-04-captured-numeric-evidence-constraints-implementation-plan.md`
Batch outcome: immutable comparison evidence and copied alert facts retain the
numeric domains of their source records even when a write bypasses application
changesets.
Next action: add failing direct-write tests for copied confidence, price,
baseline, target, and percentage fields before adding named constraints to the
unreleased comparison-snapshot and alert migrations.
Owned paths:

- `priv/repo/migrations/20260713170000_add_price_watches_and_alerts.exs`
- `priv/repo/migrations/20260713180000_create_comparison_snapshots.exs`
- `lib/product_compare_schemas/alerts/price_watch_rule.ex`
- `test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`
- affected backend comparison snapshot, alert, pricing, specification,
  taxonomy, and commerce-attribution tests
- `docs/work/captured-numeric-evidence-constraints.md`

Internal slices:

- Failing direct-write constraint characterization.
- Named comparison snapshot and alert/watch constraints.
- Clean test-database rebuild, lifecycle parity, and full backend verification.

Prerequisites:

- Source price, confidence, target, and percentage domains remain unchanged.
- No active row owns the affected backend migrations, schema, or database tests.
- Signed price deltas, specification numeric values, and unit offsets remain
  explicitly outside the batch.

Verification:

- clean migrated test database and focused direct-write constraint suite
- affected comparison snapshot, alert, pricing, specification, taxonomy, and
  commerce-attribution suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects impossible copied comparison and alert
numeric evidence, valid boundary values remain accepted, public behavior is
unchanged, and all backend gates pass.

### 19. Destructive Action Confirmation

Status: ready
Lane: Frontend interaction safety
Plan: `docs/superpowers/plans/2026-08-04-destructive-action-confirmation-implementation-plan.md`
Batch outcome: four currently one-click irreversible account and comparison
actions require a labeled, cancelable Radix confirmation while their existing
row-scoped mutation behavior remains unchanged.
Next action: add failing shared-dialog and route tests proving open/cancel are
inert and explicit confirmation invokes the selected action exactly once.
Owned paths:

- `assets/package.json`
- `assets/pnpm-lock.yaml`
- `assets/src/ui/components/overlays/DestructiveActionDialog.tsx`
- `assets/test/ui/destructive-action-dialog.test.tsx`
- `assets/src/routes/compare/ShareComparisonControl.tsx`
- `assets/src/routes/compare/SavedComparisonSetList.tsx`
- `assets/src/routes/account/api-tokens/ApiTokenItem.tsx`
- `assets/src/routes/account/alerts/AlertsRoute.tsx`
- affected comparison-snapshot, saved-comparison, API-token, and alert route
  tests
- `docs/work/frontend-destructive-action-confirmation.md`

Internal slices:

- Shared Radix AlertDialog confirmation boundary and focus contract.
- Four entity-specific danger-action adoptions with inert cancel behavior.
- Full frontend, SSR, bundle, queue, and diff verification.

Prerequisites:

- The Radix disclosure-control batch is complete and no active row owns the
  four affected route consumers.
- Existing row-scoped callbacks and pending/error/success state remain their
  route owners' responsibility.
- Community removal and API-token rotation remain outside this batch.

Verification:

- focused shared-dialog and four affected route suites
- TypeScript, Oxc, Oxfmt, Relay validation, and complete frontend tests
- Vite client and SSR builds plus bundle contract
- `mix work_queue.validate`
- `git diff --check`

Exit condition: every in-scope danger trigger opens a labeled Radix
confirmation, cancel performs no mutation and restores focus, confirm invokes
the unchanged selected-row action once, mutation state remains row-scoped, and
all frontend gates pass.

## Needs Decision Work

None.

## Blocked Work

None.
