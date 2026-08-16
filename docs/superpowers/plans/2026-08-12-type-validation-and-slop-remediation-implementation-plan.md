# Type Validation And Slop Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete one cross-stack residual remediation batch that removes the remaining recreated Relay/library types, redundant validation, repeated bigint bounds, generic route helpers, and unjustified file indirection after the product cohorts land.

**Architecture:** Type ownership follows Relay-generated data first, library types second, application domain types third, and component projections last. Validation occurs once where untyped data enters: URL/FormData/browser storage/transport/external URL/public GraphQL ID/cursor/database. A post-cohort inventory fixes the exact owned paths, then frontend type ownership, frontend route and date simplification, backend validation centralization, and final verification ship as milestone commits inside one queue row and one reviewer decision.

**Tech Stack:** TypeScript 5.9, Relay 20, React 19, Elixir 1.19, Absinthe Relay, Ecto/PostgreSQL, repository static-analysis gates

## Global Constraints

- This plan is promoted only after the foundation, product, comparison/auth, operator, and seed outcomes complete and the residual inventory is refreshed.
- Execute Tasks 2 through 5 as internal milestones of one queue row; frontend simplification is not a second implementation batch beside this consolidated outcome.
- Task 1 is coordinator curation, not a standalone implementation outcome. Its inventory must discard stale targets that earlier cohorts already removed.
- Split backend remediation into a successor only if tracing proves a materially different database schema, public API, migration, or concurrency decision. Path separation and different test commands do not justify a split.
- Never hand-edit Relay artifacts. Generated operation/fragment/enum/input/payload types own successful GraphQL data.
- Retain validation for URL parameters, FormData, browser storage, transport/error envelopes, external URLs, SSR bootstrap, decoded public global IDs, Relay cursors, authorization, changesets/constraints, and concurrency boundaries.
- Retain application same-row changeset validation, `check_constraint/3`, changeset tests, and direct database tests required by `AGENTS.md`; those layers have distinct feedback and database-authority roles.
- Uniqueness, foreign keys, and cross-row invariants remain database/transaction authoritative; do not add race-prone preflight checks.
- Keep bigint range enforcement at untrusted decoded global IDs and cursor arithmetic; remove downstream repeats after a trusted integer boundary.
- Delete trivial one-use files and generic abstractions; do not replace them with new wrapper modules or universal barrels.
- Preserve behavior and focused tests while reducing production code/file count.
- Migrate every remaining recency surface to the shared `RelativeDateTime`
  boundary; keep exact dates primary for financial ranges, expirations,
  security events, and operator reconciliation.

---

### Task 1: Refresh the provenance and residual-file inventory

**Files:**

- Create during execution: `docs/work/type-validation-slop-remediation.md`
- Inspect: `assets/src/**`, `assets/test/**`, `lib/product_compare/**`, `lib/product_compare_web/**`, `test/product_compare/**`, `test/product_compare_web/**`

**Interfaces:**

- Produces: a checked inventory with columns `symbol/file`, `current owner`, `real boundary`, `consumers`, and `action: generated | library | retain | merge | delete`.

- [ ] **Step 1: Search frontend recreation and overvalidation**

  ```bash
  cd assets && rg -n 'Record<string, unknown>|readonly .*: unknown|Array\.isArray|typeof .*=== "(string|number|boolean)"|interface .*Payload|type .*Input|type .*Enum|isRouteRecord|isCanonicalSlug|DEFAULT_ROUTE_ERROR_MESSAGE' src --glob '!src/__generated__/**'
  ```

- [ ] **Step 2: Search root/route slop and declarations**

  ```bash
  cd assets && find src -type f \( -name '*-data.ts' -o -name '*-view-data.ts' -o -name '*.d.ts' -o -name 'index.ts' \) -print | sort
  ```

  Record file size, consumers, whether the logic is substantial, and whether the file name identifies a product responsibility.

- [ ] **Step 3: Search backend repeated validation**

  ```bash
  rg -n '9_223_372_036_854_775_807|@max_bigint|is_integer\(|when .* > 0|validate_|check_constraint|Repo\.exists\?' lib/product_compare lib/product_compare_web
  ```

  Trace each value from public input through resolver/context/changeset/query and distinguish duplicate guards from independent authorization/database/concurrency owners.

- [ ] **Step 4: Validate one coherent queue row**

  Replace this plan's prerequisite-only catalog entry with one ready dispatcher
  row whose exact owned paths are the inventory's retained residual files and
  do not overlap active work. Keep a complete Ready Floor Exception when this
  is the only coherent outcome: name the rejected frontend/backend milestone
  split and state that completion returns the queue to coordinator curation.
  Do not count the inventory or Tasks 2 through 4 as separate rows.

  Run:

  ```bash
  mix work_queue.validate
  git diff --check
  ```

  Expected: the validator reports one ready row covered by a complete Ready
  Floor Exception, and the diff check prints no output.

- [ ] **Step 5: Commit the executable inventory with queue promotion**

  This coordinator-only milestone stages the three exact promotion records.
  Workers do not run this step or gain permission to edit shared dispatcher or
  catalog files from it.

  ```bash
  git add docs/work/type-validation-slop-remediation.md docs/work/index.md docs/plans/INDEX.md
  git commit -m "docs: promote residual simplification audit"
  ```

---

### Task 2: Replace remaining recreated Relay types

**Files:**

- Retain without editing: `assets/src/babel-plugin-relay.d.ts` and
  `assets/src/vite-env.d.ts`
- Modify only these six Task 1 `action: generated` rows:
  `assets/src/routes/categories/category-view-data.ts`,
  `assets/src/routes/compare/recommendation-view-data.ts`,
  `assets/src/routes/compare/shared/shared-comparison-view-data.ts`,
  `assets/src/routes/ingestion/cj-programs/programs/program-dashboard-data.ts`,
  `assets/src/routes/merchants/detail/merchant-detail-view-data.ts`, and
  `assets/src/routes/merchants/merchant-directory-view-data.ts`
- Modify only their direct consumers when necessary and their focused tests:
  `CategoryRoute.tsx`, `RecommendationPanel.tsx`, `SharedComparisonRoute.tsx`,
  `ProgramLifecycleTable.tsx`, `MerchantDetailRoute.tsx`,
  `MerchantDirectoryView.tsx`, and the matching six focused data tests

**Interfaces:**

- Consumes: exactly the six Task 1 inventory rows classified `action: generated`,
  each with an exact source path, current owner, real boundary, and consumers.
- Uses the generated operation/fragment exports already emitted by Relay. No
  `action: library` row, declaration shim, or retained untrusted-data boundary
  is in this task's edit set.

- [ ] **Step 1: Preserve declaration boundaries and typecheck**

  Record the already-absent `react-relay.d.ts` as removed by an earlier cohort.
  Retain `babel-plugin-relay.d.ts`: the installed `babel-plugin-relay` 21.0.1
  package supplies no declarations, and `assets/stylex-plugin.ts` imports its
  default plugin. Do not delete, relocate, or replace this narrow shim. Verify
  that it and `vite-env.d.ts` continue to typecheck without editing either file.

- [ ] **Step 2: Replace remaining manual GraphQL types**

  Import generated operation/fragment exports or index into `Operation$data` and `Operation$variables`. Remove manual enums, inputs, payloads, connections, page info, selected nodes, and successful mutation-error shapes.

- [ ] **Step 3: Remove helper-shaped tests with no behavior boundary**

  Move assertions to route/mutation behavior tests. Keep compile-time checks through `tsc`/Relay and runtime tests only for storage, URL, transport, custom scalar, or other untyped boundaries.

- [ ] **Step 4: Verify and commit**

  ```bash
  (
    cd assets &&
      pnpm run relay:check &&
      pnpm run typecheck &&
      pnpm run lint &&
      pnpm run test:unit
  ) &&
    git add assets/src/routes/categories/category-view-data.ts \
      assets/src/routes/compare/recommendation-view-data.ts \
      assets/src/routes/compare/shared/shared-comparison-view-data.ts \
      assets/src/routes/ingestion/cj-programs/programs/program-dashboard-data.ts \
      assets/src/routes/merchants/detail/merchant-detail-view-data.ts \
      assets/src/routes/merchants/merchant-directory-view-data.ts \
      assets/test/routes/categories/category-view-data.test.ts \
      assets/test/routes/compare/recommendation-view-data.test.ts \
      assets/test/routes/compare/shared-comparison-view-data.test.ts \
      assets/test/routes/ingestion/cj-programs/cj-program-data.test.ts \
      assets/test/routes/merchants/merchant-detail-view-data.test.ts \
      assets/test/routes/merchants/merchant-directory-view-data.test.ts &&
    git commit -m "refactor: use generated Relay type ownership"
  ```

---

### Task 3: Merge four frontend helper projections

**Files:**

- Modify only these four Task 1 frontend `action: merge` rows:
  `assets/src/routes/catalog/results/browse-product-list-data.ts`,
  `assets/src/routes/commerce/revenue/attribution/attribution-ledger-data.ts`,
  `assets/src/routes/compare/route-error-view-data.ts`, and
  `assets/src/routes/home/home-view-data.ts`
- Modify only their direct consumers when necessary:
  `assets/src/routes/catalog/results/BrowseProductList.tsx`,
  `assets/src/routes/commerce/revenue/attribution/AttributionLedger.tsx`,
  `assets/src/routes/commerce/revenue/attribution/RecentConversion.tsx`,
  `assets/src/routes/compare/RouteErrorBoundary.tsx`,
  `assets/src/routes/home/HomeRoute.tsx`, `assets/src/routes/home/HomeDeals.tsx`,
  and `assets/src/routes/home/HomeProductLedger.tsx`
- Keep these helper tests in deletion/migration scope only:
  `assets/test/routes/catalog/results/browse-product-list-data.test.ts`,
  `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts`,
  `assets/test/routes/compare/route-error-view-data.test.ts`, and
  `assets/test/routes/home/home-view-data.test.ts`
- Move meaningful assertions into these owning route behavior suites before a
  helper test is deleted: `assets/test/routes/catalog/browse.route.test.tsx`,
  `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`,
  `assets/test/routes/compare/compare.route.test.tsx`, and
  `assets/test/routes/home/home.route.test.tsx`
- Record the five already-absent `action: delete` paths; do not recreate or
  otherwise add them to this task's edit set. Backend `action: merge` rows are
  exclusively Task 4 work.

**Interfaces:**

- Consumes: exactly the four frontend Task 1 `action: merge` rows, their direct
  consumers, four helper tests in deletion/migration scope, and four owning
  route behavior suites. It does not consume backend merge rows, any retained
  data owner, or an already-absent delete target.
- `BrowseProductList` owns its stable generated-attribute highlight selection.
  `AttributionLedger` and `RecentConversion` own their respective conversion
  projections. `RouteErrorBoundary` owns its route-error copy and narrowing.
  The three home components own their route/fragment projections.
- The only relative-date change in this task is the ordinary price-observation
  recency currently projected by `home-view-data.ts` and rendered by
  `HomeProductLedger.tsx`. It moves to the shared `RelativeDateTime` leaf with
  its exact tooltip. Do not alter exact-primary dates or date consumers in
  merchant, comparison, alert, community, lifecycle, revenue, security, or CJ
  cohorts.

- [ ] **Step 1: Merge one-use helpers into owners**

  Fold the four named helpers into only their direct consumers. Preserve the
  current selection order, conversion outcome, error-copy, home projection, and
  ordinary-recency behavior by moving assertions respectively into
  `browse.route.test.tsx`, `revenue-summary.route.test.tsx`,
  `compare.route.test.tsx`, and `home.route.test.tsx`. Remove a helper test
  only after its meaningful assertions live in its owning route suite.

- [ ] **Step 2: Verify direct imports and file-count reduction**

  Confirm that only the four named helper files were removed or merged, every
  direct consumer imports its local implementation, each route suite preserves
  the migrated behavior, and no new barrel, cross-route utility, or circular
  import was introduced.

- [ ] **Step 3: Complete only the owned relative-date adoption**

  Characterize and migrate only HomeProductLedger's ordinary price-observation
  recency. Add fixed-reference SSR, hydration, mouse, keyboard, and touch
  coverage only when required by that owned rendering path.

- [ ] **Step 4: Verify and commit**

  ```bash
  (
    cd assets &&
      pnpm run typecheck &&
      pnpm run lint &&
      pnpm run test:unit &&
      pnpm run build
  ) &&
    git add assets/src/routes/catalog/results/{browse-product-list-data.ts,BrowseProductList.tsx} \
      assets/src/routes/commerce/revenue/attribution/{attribution-ledger-data.ts,AttributionLedger.tsx,RecentConversion.tsx} \
      assets/src/routes/compare/{route-error-view-data.ts,RouteErrorBoundary.tsx} \
      assets/src/routes/home/{home-view-data.ts,HomeRoute.tsx,HomeDeals.tsx,HomeProductLedger.tsx} \
      assets/test/routes/catalog/results/browse-product-list-data.test.ts \
      assets/test/routes/catalog/browse.route.test.tsx \
      assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts \
      assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx \
      assets/test/routes/compare/route-error-view-data.test.ts \
      assets/test/routes/compare/compare.route.test.tsx \
      assets/test/routes/home/home-view-data.test.ts \
      assets/test/routes/home/home.route.test.tsx &&
    git commit -m "refactor: merge route helper projections"
  ```

---

### Task 4: Remove repeated bigint and backend validation

**Files:**

- Modify only backend inventory rows classified `action: merge | delete`
- Modify focused tests for each retained boundary

**Interfaces:**

- Consumes: Task 1 backend inventory rows classified `action: merge | delete`, each with an exact source path, public-input trace, trusted boundary, consumers, and preserved contract tests.
- `GlobalId.decode_integer/2` remains the positive PostgreSQL-bigint public ID boundary.
- `ProductCompareWeb.GraphQL.Connection` remains the Relay cursor decode/arithmetic boundary.
- Context functions accept trusted positive IDs where all callers have crossed those boundaries; functions also used by internal callers retain only domain-meaningful guards.

- [ ] **Step 1: Write characterization for every proposed guard removal**

  Cover public oversized/negative/malformed global IDs and cursor offsets at the owning GraphQL boundary. Cover direct context behavior only where it is a public application API with reachable invalid inputs.

- [ ] **Step 2: Remove downstream bigint repeats**

  Delete maximum-ID guards/list filters in pricing and adjacent contexts after tracing all callers through `GlobalId` or trusted database IDs. Keep offset overflow protection in connection arithmetic.

- [ ] **Step 3: Consolidate duplicated domain checks**

  Remove resolver checks repeated by a typed input/context owner. Keep authorization at the resolver/policy boundary, changeset feedback, named database constraints, row locks, atomic statements, and cross-row transaction ownership.

- [ ] **Step 4: Prove database contracts remain complete**

  For every touched same-row check, verify pre-write changeset validation, `check_constraint/3`, changeset behavior test, and direct database test still exist. For uniqueness/FK/cross-row checks, verify no preflight query was introduced.

- [ ] **Step 5: Verify and commit**

  ```bash
  mix format --check-formatted
  mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/connection_test.exs
  mix typecheck
  mix quality
  git add lib test
  git commit -m "refactor: centralize validation at trusted boundaries"
  ```

---

### Task 5: Run repository-wide anti-slop verification

**Files:**

- Modify: `docs/work/type-validation-slop-remediation.md`
- Modify queue/lane docs at closeout according to `docs/work/operating-model.md`

**Interfaces:**

- Produces: final evidence for deleted files/symbols, retained validators and owners, production file-count delta, dependency typings, bundle result, and full repository gates.

- [ ] **Step 1: Re-run provenance searches**

  Confirm no recreated Relay/library API, selected GraphQL scalar widened to `unknown`, obsolete generic route helper, repeated bigint maximum, or unjustified downstream record guard remains. Review every remaining match manually and record the boundary owner.

- [ ] **Step 2: Run complete gates**

  ```bash
  (cd assets && pnpm run check)
  mix format --check-formatted
  mix typecheck
  mix quality
  mix test
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 3: Review the final diff for replacement slop**

  Reject any new generic adapter, wrapper, fallback, status union, barrel, or validation layer without a reachable input and named owner. Confirm authorization, external URL safety, pending-intent validation, database constraints, and concurrency remain fail-closed.

- [ ] **Step 4: Commit closure**

  ```bash
  git add assets lib test docs/work docs/plans/INDEX.md
  git commit -m "refactor: complete type and validation simplification"
  ```
