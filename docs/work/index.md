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

No work is currently claimed.

## Ready Work

### 1. CJ Live Conversion Ingestion

Status: ready
Lane: CJ live conversion ingestion
Plan: `docs/superpowers/plans/2026-08-27-cj-live-conversion-ingestion-implementation-plan.md`
Batch outcome: current CJ Commission Detail records flow through a bounded,
replay-safe Commerce Attribution importer while operators gain a secret-safe
workspace for run status, run history, manual execution, and durable non-secret
schedule settings.
Next action: claim this row, record the worker and branch in
`docs/work/cj-live-conversion-ingestion.md`, and begin Task 1's failing storage
and direct-database contract tests.
Owned paths:

- `priv/repo/migrations/20260827120000_add_cj_conversion_sync_storage.exs`
- `lib/product_compare_schemas/commerce_attribution/`
- `lib/product_compare/commerce_attribution/`
- `lib/product_compare/application.ex`
- `lib/product_compare_web/schema/commerce_attribution/`
- `lib/product_compare_web/resolvers/commerce_attribution/`
- `lib/mix/tasks/product_compare.commerce_attribution.cj_commissions.ex`
- `lib/mix/tasks/product_compare/commerce_attribution/cj_commissions/`
- `config/runtime.exs`
- `.env.example`
- `assets/schema.graphql`
- `assets/src/__generated__/`
- `assets/src/routes/commerce/revenue/ingestion/`
- `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- `assets/src/routes/config/operator-routes.tsx`
- `assets/src/routes/RootDestinations.tsx`
- `assets/test/routes/commerce/revenue/`
- `assets/test/routes/config/`
- `assets/test/routes/root/`
- `assets/tests/e2e/production-ui-operations.spec.ts`
- `test/product_compare/commerce_attribution/`
- `test/product_compare/repo/commerce_conversion_sync_constraints_test.exs`
- `test/product_compare_web/graphql/commerce_attribution_queries_test.exs`
- `test/product_compare_web/graphql/commerce_attribution_mutations_test.exs`
- `test/mix/tasks/product_compare.commerce_attribution.cj_commissions_test.exs`
- `test/support/fixtures/cj/commission_detail_sample.redacted.json`
- `docs/work/cj-live-conversion-ingestion.md`

Internal slices:

- Storage and focused context owners with complete same-row constraint parity.
- Current CJ transport, normalization, bounded traversal, and correction-safe
  persistence.
- Oban execution, database-claimed dispatch, run-now deduplication, and CLI.
- Operator-only GraphQL/Relay contract and the dedicated ingestion workspace.
- Focused, browser, optional live-readiness, and full repository verification.

Prerequisites:

- Approved design at
  `docs/superpowers/specs/2026-08-27-cj-live-conversion-ingestion-design.md`.
- Existing CJ token configuration, Commerce Attribution conversion owner,
  Oban runtime, operator authorization, and Revenue surface.
- Live CJ credentials are optional for implementation; scheduling stays
  disabled until readiness and a successful manual run are proven.

Verification:

- Execute every focused RED/GREEN command in the linked plan.
- `mix ecto.reset`
- `mix check.typespecs`
- `mix typecheck`
- `mix test`
- `mix assets.verify`
- `mix work_queue.validate`
- `mix format --check-formatted`
- `git diff --check`

Exit condition: bounded CJ imports converge across retries and corrections;
run/settings persistence, scheduling, authorization, and secret-safety
contracts pass; the operator workspace passes responsive and accessibility
coverage; all repository gates pass; lane evidence is preserved; and the live
queue is replenished or retains a truthful complete floor exception.

## Ready Floor Exception

Reason: The approved CJ live-conversion lifecycle is the only new
source-backed, independently reviewable outcome validated in this curation.
The previously cataloged product-experience program is complete, and no other
current behavior, test, architecture, or lane gap has yet been validated into
a coherent executable outcome.
Rejected split: Treating CJ storage, provider transport, scheduling, GraphQL,
or the operator workspace as separate rows would divide one enablement and
acceptance boundary into path-sized filler; reopening completed historical
cleanup would also be false queue depth.
Replenishment action: Before this row is claimed and again at its closeout,
re-check current product behavior, failing or coverage gaps, architecture, and
lane evidence; promote every coherent successor found, otherwise preserve a
complete exception for the smaller truthful set.

## Needs Decision Work

None.

## Blocked Work

None.
