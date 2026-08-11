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

### 1. Homepage Query Scaling And Ownership

Status: active
Owner: `codex/production-ui-home-quality-remediation`
Lane: Homepage query scaling and ownership
Plan: `docs/superpowers/plans/2026-08-11-homepage-query-scaling-and-ownership-implementation-plan.md`
Batch outcome: Homepage workspace and deal reads retain exact results and all
GraphQL contracts while current availability has one owner, unused and repeated
history work is removed, normal For You ranking runs once, and exact arbitrary-
range activity reads use a covering index without persisted summaries.
Next action: Run Task 1's temporal/current-offer characterization RED suite
before renaming `TruthReads` or changing a query relation.
Owned paths:

- Pricing history/current/home modules and facade named by the plan.
- Homepage Catalog/SEO eligibility consumers, resolver, Trending activity, and focused tests named by the plan.
- The new exact activity covering-index migration and isolated migration test.
- `docs/work/homepage-query-scaling-and-ownership.md`.

Internal slices:

- Exact arbitrary-bound price history and centralized current availability.
- Fact-selective homepage ranking and page-first viewer behavior.
- Exact arbitrary-range activity covering-index migration.
- Full backend, quality, migration, queue, and anti-slop verification.

Prerequisites:

- Homepage database remediation is complete and the approved design forbids new summaries, approximate statistics, and net-new pricing modules.
- Four disjoint production UI rows remain ready after this row is claimed.
- The pre-existing `config/dev.exs` worktree change remains user-owned and excluded.

Verification:

- Complete focused Pricing, Catalog, SEO, activity, migration, resolver, and concurrency suites named by the plan.
- Complete `mix test`, `mix quality`, `mix typecheck`, and full format checks.
- `mix work_queue.validate` and `git diff --check`.

Exit condition: Every existing homepage behavior and contract remains green,
query-scope and covering-index invariants pass, the lane records observed
evidence, and no range-specific state or wrapper-only abstraction was added.

### 2. Base UI, StyleX, And Table Foundation

Status: active
Owner: current Codex managed worktree `d6fa`
Lane: Base UI, StyleX, and table foundation
Plan: `docs/superpowers/plans/2026-08-11-base-ui-stylex-table-foundation-implementation-plan.md`
Batch outcome: ProductCompare uses one locally owned shadcn-cssinjs and Base UI
component foundation with its existing visual identity, deterministic short
StyleX production classes, TanStack Table v9 for every current table, and no
remaining Radix dependency or compatibility layer.
Next action: Run Task 1's deterministic client/SSR mangling RED suite before
moving or enabling the user-supplied plugin.
Owned paths:

- Frontend dependencies, Vite/StyleX build tooling, bundle scripts, and focused tests.
- `assets/src/ui/**` and all route consumers required by the Base UI API cutover.
- Attribution Ledger, Decision Summary, Specification Matrix, and their focused tests.
- `docs/work/base-ui-stylex-table-foundation.md`, this queue, and the plan catalog.

Internal slices:

- Deterministic StyleX production class-name mangling.
- ProductCompare-themed shadcn-cssinjs and Base UI primitive cutover.
- TanStack Table v9 conversion for all current semantic tables.
- Frontend, browser, bundle, queue, and anti-slop verification.

Prerequisites:

- The user approved the complete cutover and existing visual direction with focused improvements.
- The active homepage query-scaling row is backend-owned and path-disjoint.
- The four ready UI cohorts remain unclaimed while this shared foundation owns their paths.

Verification:

- Focused mangler, primitive, provider, overlay, layout, compare, and revenue suites.
- Complete frontend check plus client/SSR mangling and bundle contracts.
- Deterministic browser accessibility, focus, reduced-motion, responsive, and visual checks.
- No Radix dependency/import; queue, backend format, and diff checks pass.

Exit condition: Every current UI and table behavior remains green, client and
SSR builds use the same deterministic shortened class mapping, browser evidence
is accepted, the lane records observed verification, and no Radix, dual token
source, generic DataTable, or compatibility-only wrapper remains.

## Ready Work

### 3. Production UI Discover And Evaluate

Status: ready
Lane: Production UI discover and evaluate
Plan: `docs/superpowers/plans/2026-08-10-production-ui-discover-evaluate-implementation-plan.md`
Batch outcome: Catalog, category, product, offer, and merchant routes use the
stable production system while every existing discovery and evaluation feature
remains executable across responsive and failure states.
Next action: Run Task 1's RED plain-language, hierarchy, responsive, and
feature-parity characterization before changing the owned route surfaces.
Owned paths:

- Catalog, category, product, offer, and merchant route components named by the
  plan.
- Their focused tests plus the production discovery Playwright spec and
  snapshots.
- `docs/work/production-ui-discover-evaluate.md`.

Internal slices:

- Plain-language and responsive feature characterization.
- Catalog and category discovery composition.
- Product detail, offers, price watch, community, and merchant evaluation.
- Browser, accessibility, responsive, visual, and full frontend verification.

Prerequisites:

- The Production UI System Spine And Home outcome is complete and its shared
  owners are stable.
- Its owned route, test, E2E, and lane paths do not overlap the other three
  ready cohorts.

Verification:

- Complete catalog, category, product, offer, and merchant suites named by the
  plan.
- Deterministic Playwright, axe, responsive, visual, and no-overflow checks at
  three widths.
- `cd assets && pnpm run check`, `mix work_queue.validate`, and
  `git diff --check`.

Exit condition: Every discover/evaluate feature-parity row and production gate
passes, the lane records observed evidence, and no shared-spine or backend
contract was widened.

### 4. Production UI Compare And Return

Status: ready
Lane: Production UI compare and return
Plan: `docs/superpowers/plans/2026-08-10-production-ui-compare-return-implementation-plan.md`
Batch outcome: Live, saved, and shared comparisons plus price alerts form one
coherent return lifecycle with stable product numbers, readable differences,
truthful price scope, immutable captured facts, and owner-private row actions.
Next action: Run Task 1's RED decision-lifecycle, responsive, and complete
feature-parity characterization before changing the owned compare and alert
surfaces.
Owned paths:

- Live, saved, and shared comparison route components and account alert routes
  named by the plan.
- Their focused tests plus the production compare-return Playwright spec and
  snapshots.
- `docs/work/production-ui-compare-return.md`.

Internal slices:

- Decision-lifecycle presentation characterization.
- Live comparison, recommendations, saving, and sharing composition.
- Saved/shared return paths and alert/watch controls.
- Browser, accessibility, responsive, visual, and full frontend verification.

Prerequisites:

- The Production UI System Spine And Home outcome is complete and its shared
  owners are stable.
- Its owned route, test, E2E, and lane paths do not overlap the other three
  ready cohorts.

Verification:

- Complete compare, snapshot, saved-comparison, and alert suites named by the
  plan.
- Deterministic Playwright, axe, responsive, visual, and no-overflow checks at
  three widths.
- `cd assets && pnpm run check`, `mix work_queue.validate`, and
  `git diff --check`.

Exit condition: Every compare/return feature-parity row and production gate
passes without weakening Decimal, mixed-currency, ownership, captured-versus-
live, or row-state behavior.

### 5. Production UI Account And Setup

Status: ready
Lane: Production UI account and setup
Plan: `docs/superpowers/plans/2026-08-10-production-ui-account-setup-implementation-plan.md`
Batch outcome: Authentication, recovery, API-token, and affiliate-setup routes
make consequences, ownership, one-time values, validation, recovery, and
destructive actions clear without changing their lifecycle contracts.
Next action: Run Task 1's RED sensitive-flow, secret-redaction, responsive, and
feature-parity characterization before changing the owned account/setup routes.
Owned paths:

- Auth, recovery, API-token, and affiliate-setup route components named by the
  plan.
- Their focused tests, existing auth browser coverage, and the production
  account-setup Playwright spec and snapshots.
- `docs/work/production-ui-account-setup.md`.

Internal slices:

- Sensitive-flow characterization and secret-redaction guard.
- Authentication, recovery, and API-token lifecycle composition.
- Affiliate setup forms and results.
- Browser, accessibility, responsive, visual, and full frontend verification.

Prerequisites:

- The Production UI System Spine And Home outcome is complete and its shared
  owners are stable.
- Its owned route, test, E2E, and lane paths do not overlap the other three
  ready cohorts.

Verification:

- Complete auth, API-token, and affiliate-setup suites plus the auth browser
  coverage named by the plan.
- Deterministic Playwright, axe, responsive, visual, and no-overflow checks at
  three widths.
- `cd assets && pnpm run check`, `mix work_queue.validate`, and
  `git diff --check`.

Exit condition: Every account/setup feature-parity row and production gate
passes without REST browser auth, one-time-secret leakage, or weaker viewer,
session, and lifecycle behavior.

### 6. Production UI Operations

Status: ready
Lane: Production UI operations
Plan: `docs/superpowers/plans/2026-08-10-production-ui-operations-implementation-plan.md`
Batch outcome: CJ-program lifecycle and revenue reporting become dense,
legible operator workspaces while every current filter, mutation, pagination,
metric, detail, and partial-failure boundary remains executable.
Next action: Run Task 1's RED operator-language, density, responsive, and
feature-parity characterization before changing the owned operations routes.
Owned paths:

- CJ-program lifecycle and revenue route components named by the plan.
- Their focused tests plus the production operations Playwright spec and
  snapshots.
- `docs/work/production-ui-operations.md`.

Internal slices:

- Operator-language, density, and feature characterization.
- CJ lifecycle, row mutation, feed, and unmatched-feed composition.
- Revenue controls, metrics, and independently recoverable details.
- Browser, accessibility, responsive, visual, and full frontend verification.

Prerequisites:

- The Production UI System Spine And Home outcome is complete and its shared
  owners are stable.
- Its owned route, test, E2E, and lane paths do not overlap the other three
  ready cohorts.

Verification:

- Complete CJ-program and revenue suites named by the plan.
- Deterministic Playwright, axe, responsive, visual, and no-overflow checks at
  three widths.
- `cd assets && pnpm run check`, `mix work_queue.validate`, and
  `git diff --check`.

Exit condition: Every operations feature-parity row and production gate passes
without merging independent pagination/error regions or hiding operator facts.

## Needs Decision Work

None.

## Blocked Work

None.
