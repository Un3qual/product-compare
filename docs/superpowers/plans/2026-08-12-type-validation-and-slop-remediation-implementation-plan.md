# Type Validation And Slop Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete one cross-stack residual remediation batch that removes the remaining recreated Relay/library types, redundant validation, repeated bigint bounds, generic route helpers, and unjustified file indirection after the product cohorts land.

**Architecture:** Type ownership follows Relay-generated data first, library types second, application domain types third, and component projections last. Validation occurs once where untyped data enters: URL/FormData/browser storage/transport/external URL/public GraphQL ID/cursor/database. A post-cohort inventory fixes the exact owned paths, then frontend type ownership, frontend route/date simplification, backend validation centralization, and final verification ship as milestone commits inside one queue row and one reviewer decision.

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

  ```bash
  git add docs/work/type-validation-slop-remediation.md docs/work/index.md docs/plans/INDEX.md
  git commit -m "docs: promote residual simplification audit"
  ```

---

### Task 2: Remove declaration shims and remaining recreated Relay types

**Files:**
- Delete if official package passes: `assets/src/babel-plugin-relay.d.ts`
- Keep only if required: `assets/src/vite-env.d.ts`
- Modify only inventory rows classified `action: generated | library`
- Modify focused compile-time/runtime tests tied to deleted helpers

**Interfaces:**
- Consumes: Task 1 inventory rows classified `action: generated | library`, each with an exact source path, current owner, real boundary, and consumers.
- Uses official `react-relay`, `relay-runtime`, `babel-plugin-relay`, React, and Vite declarations.
- A retained upstream gap becomes one narrowly named augmentation under `assets/src/types/<library>-augmentation.d.ts` with an upstream issue/reference and only the missing symbol.

- [ ] **Step 1: Delete each shim independently and typecheck**

  Record the already-absent `react-relay.d.ts` as removed by an earlier cohort.
  Delete `babel-plugin-relay.d.ts`; run typecheck. Restore only missing
  declarations proven by compiler output, never the full recreated API. Verify
  `vite-env.d.ts` independently and keep its Vite client reference only while
  the installed compiler requires it.

- [ ] **Step 2: Replace remaining manual GraphQL types**

  Import generated operation/fragment exports or index into `Operation$data` and `Operation$variables`. Remove manual enums, inputs, payloads, connections, page info, selected nodes, and successful mutation-error shapes.

- [ ] **Step 3: Remove helper-shaped tests with no behavior boundary**

  Move assertions to route/mutation behavior tests. Keep compile-time checks through `tsc`/Relay and runtime tests only for storage, URL, transport, custom scalar, or other untyped boundaries.

- [ ] **Step 4: Verify and commit**

  ```bash
  cd assets && pnpm run relay:check && pnpm run typecheck && pnpm run lint && pnpm run test:unit
  git add assets/src assets/test
  git commit -m "refactor: use generated and library type ownership"
  ```

---

### Task 3: Remove generic route remnants and simplify route boundaries

**Files:**
- Modify or delete only inventory rows classified `action: merge | delete`
- Record already-absent `assets/src/routes/route-params.ts`, `assets/src/routes/route-errors.ts`, `assets/src/routes/relay-pagination.ts`, and `assets/src/routes/form-data.ts`; do not recreate them
- Modify corresponding consumers and behavior tests
- Modify remaining home, merchant, comparison, alert, community, and lifecycle
  date consumers identified by Task 1

**Interfaces:**
- Consumes: Task 1 inventory rows classified `action: merge | delete`, each with an exact source path, owning consumer, and preserved behavior test.
- Canonical slug/parameter presence checks live in the loader that owns the route parameter.
- Mutation transport failures live in the shared Relay mutation boundary; domain payload errors remain typed per operation.
- Cursor advancement remains with the connection/pagination owner and consumes generated `pageInfo`.
- Native `FormData.get()` plus route-local normalization replaces one-line generic wrappers.
- The shared `RelativeDateTime` leaf owns recency formatting and exact tooltip
  access; route-specific date formatters remain only for exact-primary domains.

- [ ] **Step 1: Merge one-use helpers into owners**

  Move copy selection, prop projection, default labels, status switches, mutation result strings, and simple field extraction to their sole consuming route/capability. Delete production/helper tests and preserve behavior in route tests.

- [ ] **Step 2: Rename substantial survivors**

  Retain Decimal comparison, URL serialization, list merge, pagination state, and multi-consumer transformations, but rename files after those responsibilities rather than `data` or `view-data`.

- [ ] **Step 3: Verify file-count reduction and imports**

  Compare before/after production file count, inspect circular imports, and confirm leaf barrels have multiple consumers without pulling route chunks eagerly.

- [ ] **Step 4: Complete relative-date adoption**

  Replace remaining price-check, offer-freshness, recent-content, and ordinary
  lifecycle labels with the shared semantic component. Add fixed-reference SSR,
  hydration, mouse, keyboard, and touch tests. Keep exact dates primary for
  revenue ranges, coupon/token expiration, security events, and CJ/revenue
  reconciliation.

- [ ] **Step 5: Verify and commit**

  ```bash
  cd assets && pnpm run typecheck && pnpm run lint && pnpm run test:unit && pnpm run build
  git add assets/src assets/test
  git commit -m "refactor: remove generic route indirection"
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
  cd assets && pnpm run check
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
