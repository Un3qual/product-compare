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

### 1. Consolidated Type, Validation, And Route Simplification

Status: ready
Lane: Type validation and slop remediation
Plan: `docs/superpowers/plans/2026-08-12-type-validation-and-slop-remediation-implementation-plan.md`
Batch outcome: Generated Relay and installed-library types own their APIs; one-use
route projections and duplicate trusted-ID guards are removed without weakening
untrusted-input, authorization, database, or concurrency boundaries.
Next action: Execute the inventory-backed internal slices in
`docs/work/type-validation-slop-remediation.md`; characterize every public and
direct context guard before its removal.
Owned paths:

- `assets/src/babel-plugin-relay.d.ts`
- `assets/src/routes/catalog/results/browse-product-list-data.ts`
- `assets/src/routes/categories/category-view-data.ts`
- `assets/src/routes/commerce/revenue/attribution/attribution-ledger-data.ts`
- `assets/src/routes/compare/recommendation-view-data.ts`
- `assets/src/routes/compare/route-error-view-data.ts`
- `assets/src/routes/compare/shared/shared-comparison-view-data.ts`
- `assets/src/routes/home/home-view-data.ts`
- `assets/src/routes/ingestion/cj-programs/programs/program-dashboard-data.ts`
- `assets/src/routes/merchants/detail/merchant-detail-view-data.ts`
- `assets/src/routes/merchants/merchant-directory-view-data.ts`
- `lib/product_compare/catalog.ex`
- `lib/product_compare/catalog/products.ex`
- `lib/product_compare/pricing.ex`
- `lib/product_compare/pricing/current_offers.ex`
- `lib/product_compare/pricing/merchants.ex`
- `lib/product_compare/pricing/offers.ex`
- `lib/product_compare/pricing/price_history.ex`
- `lib/product_compare/alerts.ex`
- `lib/product_compare/alerts/evaluation.ex`
- `lib/product_compare/alerts/inbox.ex`
- `lib/product_compare/alerts/watch_rules.ex`
- `lib/product_compare/specs.ex`
- `lib/product_compare/specs/definitions.ex`
- `lib/product_compare/specs/reads/artifacts.ex`
- `lib/product_compare/specs/reads/current_attributes.ex`
- `lib/product_compare/specs/reads/reference_data.ex`
- `assets/test/routes/catalog/results/browse-product-list-data.test.ts`
- `assets/test/routes/categories/category-view-data.test.ts`
- `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts`
- `assets/test/routes/compare/recommendation-view-data.test.ts`
- `assets/test/routes/compare/route-error-view-data.test.ts`
- `assets/test/routes/compare/shared-comparison-view-data.test.ts`
- `assets/test/routes/home/home-view-data.test.ts`
- `assets/test/routes/ingestion/cj-programs/cj-program-data.test.ts`
- `assets/test/routes/merchants/merchant-detail-view-data.test.ts`
- `assets/test/routes/merchants/merchant-directory-view-data.test.ts`
- `test/product_compare/alerts/alerts_test.exs`
- `test/product_compare/alerts/concurrency_test.exs`
- `test/product_compare/catalog/product_lookup_test.exs`
- `test/product_compare/pricing/merchant_detail_test.exs`
- `test/product_compare/pricing/pricing_test.exs`
- `test/product_compare/specs/read_helpers_test.exs`
- `test/product_compare_web/graphql/catalog_queries_test.exs`
- `test/product_compare_web/graphql/node_query_test.exs`
- `test/product_compare_web/graphql/price_watches_and_alerts_test.exs`
- `test/product_compare_web/graphql/pricing_queries_test.exs`
- `docs/work/type-validation-slop-remediation.md`

Internal slices:

- Generated/library declaration ownership.
- One-use route projection and ordinary-recency consolidation.
- Trusted-ID duplicate-guard retirement with focused contracts.
- Full anti-slop verification and closeout.

Prerequisites:

- Task 1's 2026-08-15 inventory remains current; no active row overlaps its
  exact owned paths.
- Docker-backed backend database is available for required database tests; no
  fallback database is permitted.

Verification:

- Focused frontend route/data tests plus Relay, typecheck, lint, unit, and
  build gates.
- Focused backend global-ID/connection/pricing/alert/catalog/spec tests plus
  `mix format --check-formatted`, `mix typecheck`, `mix quality`, and Docker-
  backed `mix test`.
- Re-run the inventory searches, `mix work_queue.validate`, and `git diff --check`.

Exit condition: One reviewer can verify fewer production files and no recreated
Relay/library API or duplicate trusted-ID bound, while all retained boundaries
and repository gates remain intact.

## Ready Floor Exception

Reason: The five product cohorts are complete, and the refreshed inventory
validates exactly one remaining independently reviewable outcome: consolidated
type, route-projection, and trusted-ID simplification. No second coherent
outcome survives the stale-target and real-boundary review.
Rejected split: A frontend generated-type/route milestone and a backend bigint-
validation milestone would both change the same cross-stack ownership rule and
require the same reviewer decision; path and command separation alone do not
justify two rows. The inventory itself and Tasks 2 through 4 are internal
slices, not queue rows.
Replenishment action: On completion, return the queue to coordinator curation.
Re-check current product behavior, tests, architecture gaps, and lane evidence
for every useful non-overlapping successor; retain this exception unless that
fresh evidence validates at least three coherent ready outcomes.

## Superseded Work

### 2. Production UI Discover And Evaluate

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
- The Base UI, StyleX, And Table Foundation outcome is complete; its shared
  primitives, theme, and table owners are stable. Re-run the planned RED
  characterization before changing route surfaces already migrated by that
  foundation.
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

### 3. Production UI Compare And Return

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
- The Base UI, StyleX, And Table Foundation outcome is complete; its shared
  primitives, theme, and table owners are stable. Re-run the planned RED
  characterization before changing route surfaces already migrated by that
  foundation.
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

### 4. Production UI Account And Setup

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
- The Base UI, StyleX, And Table Foundation outcome is complete; its shared
  primitives, theme, and table owners are stable. Re-run the planned RED
  characterization before changing route surfaces already migrated by that
  foundation.
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

### 5. Production UI Operations

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
- The Base UI, StyleX, And Table Foundation outcome is complete; its shared
  primitives, theme, and table owners are stable. Re-run the planned RED
  characterization before changing route surfaces already migrated by that
  foundation.
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
