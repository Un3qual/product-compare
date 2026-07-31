# Relay-Native GraphQL Schema Implementation Plan

**Goal:** Make the GraphQL API declarative, fully Relay-native, context-owned,
and free of unapproved KV Dataloader sources without changing authorization or
query-budget guarantees.

**Architecture:** `ProductCompareWeb.Schema` remains the root composition
module and owns genuinely global GraphQL types. Each product context owns
separate type, query, and mutation notation modules under its own schema
folder. Absinthe Relay modern mode owns the Node interface, node objects,
connections, edges, and page-info types. Relational association fields use
inline Ecto Dataloader resolvers. Set-based aggregate and connection reads use
Ecto-backed batch callbacks or direct root reads; `Dataloader.KV` is absent.

**Tech Stack:** Elixir, Absinthe, Absinthe Relay, Dataloader Ecto, Ecto,
PostgreSQL, ExUnit, Relay Compiler.

## Global Constraints

- Breaking GraphQL changes are allowed; the project is unreleased.
- Keep `schema.ex` as the root composition file; do not create a `Common`
  module or folder.
- Use `node object` and Absinthe Relay connection macros for every supported
  Relay entity and connection.
- Prefer `resolve: dataloader(Source, use_parent: true)` for ordinary
  associations. Do not add field-specific resolver wrappers around it.
- Remove every `Dataloader.KV` source. If a verified batch cannot be expressed
  with Ecto Dataloader or a set-based root read, stop for explicit product
  approval before retaining KV.
- Delete one-line resolver facades when the schema can reference the actual
  owner directly; inline only truly local projections.
- Preserve owner/operator authorization, stable global-ID decoding, ordering,
  bounded query counts, GraphQL auth session behavior, and public-safe fields.
- Do not add compatibility aliases for the old schema module layout.

### Task 1: Characterize The Current Contract

- [x] Add a schema-architecture contract that fails on `Dataloader.KV`,
  `Types.Common`, manual Node declarations, manual connection objects, and
  root query/mutation declarations outside context modules.
- [x] Snapshot supported Node types, connection fields, authorization branches,
  query counts, and Relay artifacts before structural changes.

### Task 2: Enable Absinthe Relay Modern Mode

- [x] Add and configure `absinthe_relay`.
- [x] Move genuinely global types into `schema.ex`.
- [x] Replace the manual Node interface/root field with Relay schema and node
  field macros while retaining the existing node lookup authorization.
- [x] Convert all supported globally identified entities to `node object`.

### Task 3: Replace Manual Connections

- [x] Replace all 17 hand-authored connection/edge pairs and the manual
  `page_info` object with Absinthe Relay connection macros.
- [x] Adapt existing bounded connection projections to the macro-owned shape
  without weakening cursor validation or query budgets.
- [ ] Regenerate the schema snapshot and Relay artifacts after the intentional
  breaking contract update.

### Task 4: Split The Schema By Context

- [x] Create context folders with separate types, queries, and mutations
  modules for accounts, affiliate, alerts, catalog, commerce attribution,
  comparison snapshots, discussions, ingestion, pricing, SEO, and specs.
- [x] Keep `schema.ex` limited to global types, imports, context/plugin setup,
  and root composition.
- [x] Delete the broad `Types.Accounts`, `Types.Catalog`, `Types.Commerce`,
  `Types.Trust`, and `Types.Common` modules after their definitions move.

### Task 5: Make Data Loading Declarative

- [x] Inline every ordinary association field with Ecto Dataloader.
- [x] Re-express all 13 KV sources as Ecto-backed batches or set-based root
  reads, retaining deterministic batching tests.
- [ ] Delete shallow one-line resolver facades and point schema fields at the
  actual context-specific resolver owner.
- [ ] Prove no `Dataloader.KV` or dataloader-only wrapper remains.

### Task 6: Verify And Commit

- [ ] Run schema snapshot, Node, connection, authorization, Dataloader batching,
  and query-budget suites.
- [ ] Run full backend tests, type checks, quality gates, Relay validation,
  frontend tests/builds, queue validation, and `git diff --check`.
- [ ] Commit each reviewable internal milestone with its behavior evidence.

Exit condition: the API compiles in Absinthe Relay modern mode, every supported
entity and connection uses Relay macros, context schema ownership is explicit,
all ordinary association fields use inline Ecto Dataloader, no KV source or
shallow resolver facade remains, and all correctness/query-budget gates pass.
