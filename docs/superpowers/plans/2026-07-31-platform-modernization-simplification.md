# Platform Modernization Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove unnecessary abstractions and policy ceremony from the platform modernization branch while preserving its behavior, database invariants, and approved frontend/toolchain choices.

**Architecture:** Root GraphQL reads become direct and genuine multi-parent reads use honest Ecto batches; Relay owns cursor and global-ID protocol work. Frontend code keeps Radix and StyleX while returning transport, mutation ownership, and tooling to small observable contracts. Persistence keeps relational/reference integrity while removing unfinished surfaces, contradictory closed lists, and unnecessarily coarse locks.

**Tech Stack:** Elixir 1.19, Phoenix, Ecto/PostgreSQL, Absinthe Relay, React 19, Relay, Radix, StyleX, TypeScript, pnpm, mise, Vite/Rolldown, Oxc, Vitest.

## Global Constraints

- Keep React 19, Relay, Radix components, StyleX, pnpm, mise, Vite/Rolldown, and Oxc. Do not restore Bun.
- Keep comparison snapshots relational and published under repeatable-read isolation. Do not store application-owned snapshot facts as JSON.
- Never persist enum-like domain values as unconstrained strings. Keep native PostgreSQL enums and integer-backed reference tables.
- Use Dataloader.Ecto for real associations and genuine multi-parent sets. Do not introduce Dataloader.KV without explicit user approval.
- Preserve authorization, forward-only bounded pagination, stable query counts for genuine nested sets and nodes, and all read-modify-write guarantees.
- The project is unreleased, so simplifying GraphQL and migration contracts may be breaking.
- Do not add generic registries, compatibility facades, one-file-per-mutation modules, source-regex policy tests, or a replacement Effect abstraction.

---

### Task 1: Frontend Runtime Simplification

**Files:**
- Modify: `assets/src/ui/primitives/Select.tsx`
- Modify: `assets/test/ui/primitives.test.tsx`
- Modify: `assets/test/routes/products/product-community-relay-update.test.tsx`
- Modify: `assets/src/relay/fetch-graphql.ts`
- Modify: `assets/test/relay/fetch-graphql.test.ts`
- Modify: `assets/package.json`
- Modify: `assets/pnpm-lock.yaml`

**Interfaces:**
- Consumes: existing `Select` props and `fetchGraphQL(query, variables, ssrContext)` Promise contract.
- Produces: visible Radix `data-highlighted` styling, a real rating-selection regression test, and the same transport contract without Effect.

- [ ] **Step 1: Write and run the failing Select regression**

Add a primitive test that opens the Select by keyboard, moves to an option, asserts `data-highlighted`, and asserts a nontransparent computed background. Change the community update test to use `chooseSelectOption` and assert the mutation variables contain `rating: 5`.

Run:

```bash
CI=true mise exec -- pnpm exec vitest run test/ui/primitives.test.tsx test/routes/products/product-community-relay-update.test.tsx
```

Expected before implementation: the visual-highlight assertion and real submitted-rating assertion fail.

- [ ] **Step 2: Add the minimal highlighted StyleX state**

Add only conditional `:where([data-highlighted])` background/text declarations to `styles.item`; Radix continues to own focus state.

- [ ] **Step 3: Characterize and remove the Effect adapter**

Rewrite Effect-specific tests as Promise-boundary tests for configuration, serialization, offline, HTTP, malformed JSON, nonobject JSON, and abort behavior. Then replace `graphqlTransportEffect` and tagged failures with direct async/await while preserving public error identities/messages.

Run:

```bash
CI=true mise exec -- pnpm exec vitest run test/relay/fetch-graphql.test.ts
```

- [ ] **Step 4: Remove the dependency and verify focused behavior**

```bash
CI=true mise exec -- pnpm remove effect
CI=true mise exec -- pnpm exec vitest run test/ui/primitives.test.tsx test/relay/fetch-graphql.test.ts test/routes/products/product-community-relay-update.test.tsx
CI=true mise exec -- pnpm run typecheck
```

- [ ] **Step 5: Commit the runtime simplification**

```bash
git add assets/src/ui/primitives/Select.tsx assets/test/ui/primitives.test.tsx assets/test/routes/products/product-community-relay-update.test.tsx assets/src/relay/fetch-graphql.ts assets/test/relay/fetch-graphql.test.ts assets/package.json assets/pnpm-lock.yaml
git commit -m "refactor: simplify frontend runtime contracts"
```

### Task 2: Frontend Ownership and Tooling Simplification

**Files:**
- Create: five feature-local `*-mutations.ts` family modules under account alerts, API tokens, affiliate setup, compare, and products.
- Modify: their route/component consumers and tests.
- Delete: `assets/test/architecture/relay-operation-ownership.test.ts`
- Delete: `assets/test/ui/form-control-architecture.test.ts`
- Modify: `assets/package.json`, `assets/scripts/check-client-bundle.ts`, Vite/Vitest/StyleX configs, and `assets/tsconfig.json`
- Delete: `assets/pnpm-workspace.yaml`
- Mechanically format: authored `assets/src`, `assets/test`, `assets/scripts`, and root TypeScript excluding `assets/src/__generated__`.

**Interfaces:**
- Consumes: unchanged GraphQL operation names/documents and existing route behavior.
- Produces: feature-family operation ownership, authored-code quality gates, flat Vite plugins, and a combined initial JS/CSS bundle budget.

- [ ] **Step 1: Prove feature-family imports before creating modules**

Point compare/community tests at the proposed family modules and run the focused tests to observe module-not-found failures. Create the five family modules, move documents unchanged, and update consumers.

```bash
CI=true mise exec -- pnpm exec vitest run test/routes/account/alerts/alerts.route.test.tsx test/routes/account/api-tokens/api-tokens.route.test.tsx test/routes/affiliate/setup/affiliate-setup.route.test.tsx test/routes/compare/comparison-snapshots.test.tsx test/routes/products/product-community-panel.test.tsx
CI=true mise exec -- pnpm run relay:check
```

- [ ] **Step 2: Remove policy scans and retain behavioral coverage**

Delete both regex architecture tests. Run primitive, form-submission, and affected route suites before and after deletion; do not add an AST replacement.

- [ ] **Step 3: Expand Oxc gates and establish the authored baseline**

Set formatter/linter globs to `src test scripts '*.ts'` with generated Relay artifacts excluded. Demonstrate a temporary malformed test file is caught, remove it, run Oxfmt write once, and fix the comparison-snapshot mock so every imported mutation is behaviorally distinguished.

```bash
CI=true mise exec -- pnpm exec oxfmt --write src test scripts '*.ts' '!src/__generated__/**'
CI=true mise exec -- pnpm run format:check
CI=true mise exec -- pnpm run lint
```

- [ ] **Step 4: Simplify config and budget initial CSS**

Keep explicit `.ts` StyleX plugin imports and `allowImportingTsExtensions` for Vite's native config loader, pass `reactWithStyleX()` directly, and delete the inert workspace file. Extend the manifest model to count deduplicated initial `.js` and `.css` assets. Observe failure with the old 200 KB limit, then set a documented combined 300 KB ceiling.

```bash
CI=true mise exec -- pnpm run build:client
CI=true mise exec -- pnpm run check:bundle
CI=true mise exec -- pnpm run build:ssr
```

- [ ] **Step 5: Commit semantic and mechanical work separately**

```bash
git add assets
git commit -m "refactor: simplify frontend ownership and tooling"
```

### Task 3: GraphQL Dataloader and Relay Simplification

**Files:**
- Delete: `lib/product_compare_web/graphql/loader/ecto_batch_source.ex`
- Rewrite: loader registration, parent sources, root sources, connection policy, and node resolver.
- Delete: `lib/product_compare_web/graphql/authorized_connection.ex`
- Simplify: root resolvers listed in the design specification.
- Modify: affiliate and ingestion schema modules, GraphQL tests, and `assets/schema.graphql`.
- Delete: empty pricing and SEO mutation modules.

**Interfaces:**
- Consumes: context set-query APIs and Absinthe Relay's connection/global-ID APIs.
- Produces: direct root reads, actual-schema Ecto batches for nested sets/nodes, canonical Relay cursors, native root `activeCoupons`, and consistent CJ type names.

- [ ] **Step 1: Write failing protocol/architecture expectations**

Update connection tests to decode cursors through `Absinthe.Relay.Connection.cursor_to_offset/1`; update affiliate workflow/schema tests for direct `activeCoupons`; assert the fake adapter is absent and every registered source is `%Dataloader.Ecto{}`.

```bash
mix test test/product_compare_web/graphql/connection_test.exs test/product_compare_web/graphql/schema_architecture_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
```

Expected before implementation: canonical cursor, direct connection shape, and adapter-absence assertions fail.

- [ ] **Step 2: Delegate connection shaping to Absinthe Relay**

Keep argument normalization/default/clamp/error translation, but use Relay `from_list/3`, `from_query/4`, `from_slice/3`, `limit/2`, `offset/1`, and cursor helpers. Remove private edge/page-info/cursor construction.

- [ ] **Step 3: Replace the fake adapter with honest Ecto batches**

Delete singleton root sources and resolve those fields directly. Rebuild genuine parent/node batches with `Dataloader.Ecto.new(Repo, run_batch: ...)`, actual schemas, ID-shaped inputs, and explicit operation keys. Delete generic load/get delegates and the no-loader fallback.

- [ ] **Step 4: Complete Relay-native schema cleanup**

Parse already-decoded local node IDs directly, remove the roundtrip helper path, expose root `activeCoupons` as `CouponConnection` with Relay pagination arguments, explicitly name `CJProgramConnection`/`CJProgramEdge`, remove filler modules, and regenerate SDL/artifacts.

```bash
mix absinthe.schema.sdl --schema ProductCompareWeb.Schema > assets/schema.graphql
CI=true mise exec -- pnpm run relay
```

- [ ] **Step 5: Verify and commit GraphQL simplification**

```bash
mix test test/product_compare_web/graphql
mix typecheck
git diff --check
git add lib/product_compare_web test/product_compare_web assets/schema.graphql assets/src/__generated__
git commit -m "refactor: simplify graphql relay boundaries"
```

### Task 4: Reference-Backed Domain Simplification

**Files:**
- Add: `test/product_compare/repo/reference_code_codec_parity_test.exs`
- Modify: reputation schemas/context/migration tests.
- Modify: affiliate-network and commerce-attribution schemas, contexts, filters, resolver, and tests.
- Modify: slug namespace migration.
- Move: categorical storage policy from production to test support.

**Interfaces:**
- Consumes: seeded integer reference rows and open `affiliate_networks` data.
- Produces: deterministic codec/database parity, no speculative reputation API, table-driven affiliate networks, a smaller slug reservation row, and no test oracle in production.

- [ ] **Step 1: Add failing reference parity and custom-network tests**

Assert every hard-coded reference codec map equals its database table, and prove a configured custom network such as `partnerize` can ingest and filter revenue while an unconfigured code is rejected.

```bash
mix test test/product_compare/repo/reference_code_codec_parity_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs
```

- [ ] **Step 2: Make affiliate networks fully table-driven**

Remove closed provider lists and atom conversion. Normalize boundary codes as strings, resolve them through `affiliate_networks`, and persist/filter only through the existing FK/join.

- [ ] **Step 3: Remove unfinished reputation behavior**

Remove event insertion/listing delegates and `default_delta`, retaining the relational type/event foundation until a producer defines semantics. Reset the test database and verify the narrowed migration.

```bash
MIX_ENV=test mix ecto.reset
mix test test/product_compare/accounts/reputation_upsert_test.exs test/product_compare/repo/categorical_discriminator_storage_test.exs
```

- [ ] **Step 4: Remove unused slug state and move the policy oracle**

Drop `is_alias` from reservation rows/triggers while keeping global uniqueness and alias immutability. Move `CategoricalStoragePolicy` to `test/support` and rename its module.

- [ ] **Step 5: Verify and commit the domain simplification**

```bash
mix test test/product_compare/repo test/product_compare/commerce_attribution test/product_compare/catalog/product_lookup_test.exs test/product_compare/seo_test.exs
mix format --check-formatted
git add lib test priv/repo/migrations
git commit -m "refactor: simplify reference-backed domains"
```

### Task 5: Concurrency and Test-Organization Simplification

**Files:**
- Modify: source-provider reconciliation, API-token authentication API, and enrichment persistence.
- Add: focused source-provider concurrency tests.
- Split: `test/product_compare/concurrency_safe_transitions_test.exs` into context-local concurrency suites with a small shared lock helper.
- Modify: affected work docs.

**Interfaces:**
- Consumes: transaction-scoped dependent writes and existing context transition contracts.
- Produces: conditional provider claiming, one API-token consistency contract, one product lock per enrichment, and context-owned concurrency coverage.

- [ ] **Step 1: Write failing source-provider and enrichment concurrency tests**

Prove same-provider validation does not wait on an unrelated held source lock, two initial providers yield one winner/one mismatch, and combined enrichment performs one product `FOR UPDATE` read.

```bash
mix test test/product_compare/ingestion/source_providers_concurrency_test.exs test/product_compare/ingestion/enrichment_test.exs
```

- [ ] **Step 2: Implement conditional claiming and a single enrichment lock**

Use `UPDATE ... WHERE provider_id IS NULL`, reload/reconcile without an unconditional lock, and retain the caller transaction requirement. Resolve taxonomy mapping before one product lock and make all write decisions from the reloaded row.

- [ ] **Step 3: Remove the unused API-token branch**

Collapse `authenticate_api_token/2` to `/1`, always conditionally touch/revalidate, delete its no-touch test, and retain revoke/expiry concurrency coverage.

- [ ] **Step 4: Split the concurrency monolith without centralizing fixtures**

Move each test and its fixtures beside Accounts, Alerts, Snapshots, Discussions, Specs, Taxonomy, and Ingestion. Share only lock acquisition/release and backend-PID orchestration.

- [ ] **Step 5: Verify and commit concurrency simplification**

```bash
mix test test/product_compare/accounts/concurrency_test.exs test/product_compare/alerts/concurrency_test.exs test/product_compare/comparison_snapshots/concurrency_test.exs test/product_compare/discussions/concurrency_test.exs test/product_compare/specs/concurrency_test.exs test/product_compare/taxonomy/concurrency_test.exs test/product_compare/ingestion/enrichment_concurrency_test.exs test/product_compare/ingestion/import_run_concurrency_test.exs test/product_compare/ingestion/source_providers_concurrency_test.exs
mix test test/product_compare/accounts/api_token_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare/ingestion
git add lib test docs/work
git commit -m "refactor: simplify concurrency boundaries"
```

### Task 6: Repository Contracts, Final Review, and Publication Readiness

**Files:**
- Modify only truthful lane/work/queue documentation made stale by Tasks 1-5.
- Do not delete the required work-index history archive.

**Interfaces:**
- Consumes: all prior task outcomes.
- Produces: a truthful live dispatch queue with at least three ready rows and a fully verified stacked branch.

- [ ] **Step 1: Reconcile live documentation**

Remove or replace the stale Ecto-dataloader policy row without dropping the three-ready-row floor. Update affected lane docs with observed behavior and verification, not command transcripts.

- [ ] **Step 2: Run complete generated-contract and backend gates**

```bash
MIX_ENV=test mix ecto.reset
mix format --check-formatted
mix typecheck
mix quality
mix test
mix work_queue.validate
```

- [ ] **Step 3: Run complete frontend gates**

```bash
CI=true mise exec -- pnpm run relay
CI=true mise exec -- pnpm run check
```

- [ ] **Step 4: Run final repository checks**

```bash
git diff --check codex/platform-modernization...HEAD
git status --short
```

- [ ] **Step 5: Commit documentation reconciliation**

```bash
git add docs
git commit -m "docs: reconcile platform simplification contracts"
```
