# Relay-Native GraphQL Schema

## Snapshot

- Status: complete
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-relay-native-graphql-schema-implementation-plan.md`
- Last verified: 2026-07-30 against the current schema, loader sources,
  resolver facades, schema snapshot, and Dataloader batching suite.

## Batch Outcome

- `ProductCompareWeb.Schema` runs Absinthe Relay modern mode, owns only global
  types and root composition, and imports context-owned query and mutation
  fields.
- Eleven context folders separately own types, queries, and mutations; no
  `Common` module or broad legacy type module remains.
- All 12 supported global entities use `node object`, and the root Node field
  delegates lookup and authorization through the Relay adapter.
- All 17 connections are macro-owned, forward-only, bounded by required
  `first`, and expose non-null edge nodes and cursors.
- Ordinary associations use inline Ecto Dataloader resolvers. All 13 former KV
  sources use the Ecto-backed batch source; `Dataloader.KV` is absent.
- Seven shallow resolver facades are deleted, and schema fields point directly
  at their owning resolver modules.
- `MerchantProductsInput` contains filters only; Relay pagination lives on the
  connection field.

## Boundaries

- No KV source may remain without new explicit user approval.
- Root-global types stay in `schema.ex`; there is no replacement `Common`
  module.
- Breaking SDL and Relay artifact changes are acceptable.
- Authorization, cursor validation, ordering, and fixed query budgets remain
  behavior gates.

## Verification

- GraphQL schema, authorization, connection, Node, batching, and query-budget
  suites: 316 tests, 0 failures.
- Full backend suite: 1,015 tests, 0 failures.
- `mix typecheck`
- `mix quality`
- `CI=true mise exec -- pnpm --dir assets run check`: Relay validation,
  TypeScript, Oxc, 1,508 Vitest tests, client/SSR Vite builds, and bundle
  contract passed.
- `mix work_queue.validate`: 3 ready rows.
- `mix format --check-formatted`
- `git diff --check`

## Remaining Work

None in this lane. Effect transport, Radix controls, and categorical-storage
policy remain independently queued.
