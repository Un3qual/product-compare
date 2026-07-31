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

## Ready Work

### 14. Radix Disclosure Controls

Status: ready
Lane: Frontend UI foundation
Plan: `docs/superpowers/plans/2026-07-30-radix-disclosure-controls-implementation-plan.md`
Batch outcome: price-watch creation, comparison sharing, and community
creation forms use the existing Radix Collapsible primitive while lazy work,
form state, accessibility, and StyleX ownership remain intact.
Next action: characterize the five native disclosure contracts and add the
failing visible-disclosure architecture scan before changing consumers.
Owned paths:

- `assets/src/routes/products/PriceWatchControl.tsx`
- `assets/src/routes/compare/ShareComparisonControl.tsx`
- `assets/src/routes/products/ProductCommunityPanel.tsx`
- affected alert, comparison-snapshot, community, and primitive tests
- focused frontend architecture test for native visible disclosures
- `docs/work/frontend-radix-disclosure-controls.md`

Internal slices:

- Native disclosure and lazy-loading characterization.
- Existing Radix Collapsible adoption across five consumers.
- Accessibility, SSR, full-suite, and bundle verification.

Prerequisites:

- No active row owns the affected disclosure consumers.
- The existing project Collapsible wrapper remains the only primitive boundary.
- The completed form-control migration owns inputs, selects, text areas,
  checkboxes, and the Radix Themes provider; those paths remain outside this
  row except where a disclosure characterization test must render them.

Verification:

- focused alert, comparison snapshot, community, and primitive tests
- native visible-disclosure architecture scan
- TypeScript, Oxc, Oxfmt, and full frontend tests
- Vite client and SSR builds plus bundle contract
- `mix work_queue.validate`
- `git diff --check`

Exit condition: no visible native disclosure remains under `assets/src`, the
five affected controls use the existing Radix wrapper, lazy and submission
behavior is unchanged, StyleX remains in place, and every frontend gate passes.

### 15. Ecto Dataloader Policy Guard

Status: ready
Lane: GraphQL architecture
Plan: `docs/superpowers/plans/2026-07-30-ecto-dataloader-policy-guard-implementation-plan.md`
Batch outcome: first-party KV Dataloader use fails at source and runtime
boundaries, while ordinary Ecto associations remain direct inline Dataloader
fields without pass-through resolvers.
Next action: characterize the current scan-boundary gap and runtime source
types before broadening the architecture contract.
Owned paths:

- `lib/product_compare_web/graphql/loader.ex`
- `lib/product_compare_web/graphql/loader/**`
- affected schema association declarations only if characterization exposes a
  violation
- `test/product_compare_web/graphql/schema_architecture_test.exs`
- affected Dataloader architecture and batching tests
- `docs/work/ecto-dataloader-policy-guard.md`

Internal slices:

- Whole-library KV source policy.
- Runtime Ecto source-type assertion.
- Inline ordinary-association resolver contract.

Prerequisites:

- No active row owns the GraphQL request loader or schema architecture suite.
- A KV exception requires a new explicit user decision; this row does not
  create an exception mechanism.

Verification:

- schema architecture and Dataloader batching suites
- complete GraphQL suite
- full backend tests, typecheck, and quality
- `mix work_queue.validate`
- `mix format --check-formatted`
- `git diff --check`

Exit condition: no first-party library path can hide a KV source, every
registered request source is Ecto-backed, ordinary associations keep the
inline Dataloader shorthand, and all backend gates pass.

### 16. Application JSON Storage Policy Guard

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

## Needs Decision Work

None.

## Blocked Work

None.
