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

### 1. Ingestion Concurrency And Observation Ordering

Status: active
Lane: Ingestion concurrency and observation ordering
Plan: `docs/superpowers/plans/2026-08-30-ingestion-concurrency-observation-ordering-implementation-plan.md`
Batch outcome: concurrent first-sighting merchant resolutions converge without
orphans, stale evidence cannot replace newer facts, and malformed CJ success
payloads return bounded errors before enumeration or arithmetic.
Next action: add a deterministic same-key first-sighting concurrency test with
a database lock barrier.
Owned paths:

- `lib/product_compare/ingestion/merchant_identities.ex`
- `lib/product_compare/catalog/evidence.ex`
- `lib/product_compare/ingestion/listing_persistence/enrichment.ex`
- `lib/product_compare/ingestion/sources/cj/client.ex`
- Focused ingestion tests and deterministic test helper named in the linked plan
- `docs/work/ingestion-concurrency-observation-ordering.md`

Internal slices:

- Logical-key advisory lock and first-sighting convergence.
- Timestamp-aware media and category conflict updates.
- CJ result-set and pagination validation.

Prerequisites:

- Approved design and existing source identity uniqueness.
- PostgreSQL sandbox connections available for deterministic lock tests.

Verification:

- Focused ingestion suites listed in the plan under `MIX_TEST_PARTITION=quality_ingestion`.
- `mix format --check-formatted`
- `mix typecheck`
- `git diff --check`

Exit condition: concurrency, stale-observation, malformed-result, and existing
ingestion behavior tests pass with no global lock, unlocked read/write decision,
or provider-data-bearing error category.

## Ready Work

### 2. Operator Command Safety And Diagnostics

Status: ready
Lane: Operator command safety and diagnostics
Plan: `docs/superpowers/plans/2026-08-30-operator-command-safety-diagnostics-implementation-plan.md`
Batch outcome: dry-run and CJ commands validate every argument before startup,
use repo-only services when sufficient, and expose useful categories and safe
stacktrace locations without raw provider or credential data.
Next action: add duplicate, positional, malformed, and range-error RED cases to
CJ feed and credential task tests.
Owned paths:

- Named Mix tasks and support modules in the linked plan
- `lib/product_compare/ingestion/cj_failure_diagnostics.ex`
- Focused task tests named in the linked plan
- `docs/work/operator-command-safety-diagnostics.md`

Internal slices:

- Strict duplicate/range-aware CJ CLI parsing.
- Validation-first repo-only backfill dry run.
- Shared sanitized CJ failure diagnostics.

Prerequisites:

- Approved design.
- Existing `CliOptions`, `RepoOnlyStartup`, and CJ runner sanitization contracts.

Verification:

- Focused Mix task suites listed in the plan under `MIX_TEST_PARTITION=quality_operator` where database-backed.
- `mix format --check-formatted`
- `mix typecheck`
- `git diff --check`

Exit condition: invalid commands perform no application/provider work, valid
commands retain output and return contracts, adversarial secret markers remain
absent, and every focused command suite passes.

### 3. Frontend Correctness And Simplification

Status: ready
Lane: Frontend correctness and simplification
Plan: `docs/superpowers/plans/2026-08-30-frontend-correctness-simplification-implementation-plan.md`
Batch outcome: product-detail recovery is structurally safe, Relay owns every
in-scope connection, affiliate mutation state lives with its submitting step,
and select/query descriptor APIs retain only used behavior.
Next action: add product-detail loader cases that reject unrelated GraphQL
partials and malformed SEO projections.
Owned paths:

- `assets/src/routes/products/{ProductDetailRoute.tsx,community/**}`
- `assets/src/routes/compare/{picker/**,sharing/**}`
- `assets/src/routes/affiliate/setup/**`
- `assets/src/ui/primitives/Select.tsx`
- `assets/src/relay/route-preload.ts`
- Matching generated Relay artifacts and focused tests named in the plan
- `docs/work/frontend-correctness-simplification.md`

Internal slices:

- Safe product-detail partial recovery.
- Community and compare Relay pagination ownership.
- Step-local affiliate mutations.
- Single-select and compact route-descriptor contracts.

Prerequisites:

- Approved design.
- Current generated Relay schema/artifacts and full frontend baseline pass.

Verification:

- Focused Vitest suites listed in the plan.
- `cd assets && pnpm run check`
- Targeted Playwright product-experience flow on an isolated port.
- `git diff --check`

Exit condition: manual append effects and unused type branches are absent from
the named surfaces, real input/generated boundaries remain, generated artifacts
are current, and focused/full frontend/browser gates pass.

### 4. Deterministic Tooling And Dependency Health

Status: ready
Lane: Deterministic tooling and dependency health
Plan: `docs/superpowers/plans/2026-08-30-deterministic-tooling-dependency-health-implementation-plan.md`
Batch outcome: strict type coverage includes E2E source, Phoenix starts the
complete dev stack, scheduler/database tests are deterministic, toolchain pins
match, and compatible dependencies include available security fixes.
Next action: include `assets/tests/e2e` in the main TypeScript project and
capture every newly exposed diagnostic before fixing it.
Owned paths:

- Frontend, Mix, config, test helper, toolchain, documentation, and lock files named in the linked plan
- `docs/work/deterministic-tooling-dependency-health.md`

Internal slices:

- E2E TypeScript coverage.
- Frozen setup and Phoenix-owned Vite watcher.
- Scheduler capture and bounded database polling.
- Exact mise/package pin comparison.
- Compatible dependency security refresh.

Prerequisites:

- Approved design.
- Current mise/pnpm/Hex lockfiles and live advisory evidence.
- Unique final test partition and isolated Playwright ports.

Verification:

- Focused TypeScript, scheduler, database-helper, and toolchain tests in the plan.
- `MIX_TEST_PARTITION=quality_tooling mix ci`
- `mix hex.audit`
- `cd assets && pnpm audit --prod`
- Full Playwright suite on an isolated port.
- `git diff --check`

Exit condition: source/setup/test/toolchain contracts are deterministic,
compatible dependency fixes are locked and audited, full isolated backend and
frontend gates plus Playwright pass, and any no-compatible-fix blocker is
recorded exactly.

## Needs Decision Work

None.

## Blocked Work

None.
