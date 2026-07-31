# Relay-Native GraphQL Schema

## Snapshot

- Status: complete
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-relay-native-graphql-schema-implementation-plan.md`
- Last verified: 2026-07-31 against the simplified schema, Ecto sources,
  direct roots, Relay connection helpers, generated SDL, and batching suite.

## Batch Outcome

- `ProductCompareWeb.Schema` runs Absinthe Relay modern mode, owns only global
  types and root composition, and imports context-owned query and mutation
  fields.
- Eleven context folders separately own types, queries, and mutations; no
  `Common` module or broad legacy type module remains.
- All 22 supported global entities use `node object`, and the root Node field
  delegates lookup and authorization through the Relay adapter.
- All 17 connections are macro-owned, forward-only, bounded by required
  `first`, and expose non-null edge nodes and cursors.
- Cursor parsing, list/query/slice projection, offsets, and limits delegate to
  `Absinthe.Relay.Connection`; project code retains only forward-page policy
  and resolver error translation.
- Ordinary associations use inline Ecto Dataloader resolvers. Six genuine
  parent-set sources and one authorized-node source use
  `Dataloader.Ecto.run_batch` over actual schemas; two association sources
  bring the registered total to nine. `Dataloader.KV` and the fake adapter are
  absent.
- Singleton root fields resolve directly. Root `activeCoupons` is a native
  forward `CouponConnection`, and ingestion exposes canonical
  `CJProgramConnection`/`CJProgramEdge` names.
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

- Focused schema architecture, connection, and affiliate workflow gate: 34
  tests, 0 failures.
- Genuine Dataloader batching gate: 41 tests, 0 failures.
- Complete GraphQL suite after review: 328 tests, 0 failures.
- Relay generation compiled 52 reader, 51 normalization, and 51 operation
  documents.
- Typecheck, compile with warnings as errors, formatting, and diff checks
  passed.

## Remaining Work

The former Ecto Dataloader policy guard has no remaining implementation and is
closed as superseded evidence. Operator mutation authorization freshness is a
separate ready concurrency outcome; Radix disclosure controls remain
independently ready.
