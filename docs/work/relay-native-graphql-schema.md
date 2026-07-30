# Relay-Native GraphQL Schema

## Snapshot

- Status: ready
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-relay-native-graphql-schema-implementation-plan.md`
- Last verified: 2026-07-30 against the current schema, loader sources,
  resolver facades, schema snapshot, and Dataloader batching suite.

## Validated Baseline

- `ProductCompareWeb.Schema` is 712 lines and owns every root query and
  mutation.
- Broad type modules contain 112 object declarations; the project still has a
  `Types.Common` module despite the root schema being the natural owner for
  global types.
- Twelve globally identified object types manually declare the Node interface.
- Seventeen connection objects and their edges are hand-authored.
- The GraphQL loader owns 13 `Dataloader.KV` sources in parent/root loaders.
- Fifteen resolver functions are one-line delegations to the actual owner.
- Association-level Ecto Dataloader already works and is the migration
  reference.

## Boundaries

- No KV source may remain without new explicit user approval.
- Root-global types stay in `schema.ex`; there is no replacement `Common`
  module.
- Breaking SDL and Relay artifact changes are acceptable.
- Authorization, cursor validation, ordering, and fixed query budgets remain
  behavior gates.

## Next Action

Add the failing schema-architecture contract and freeze the current Node,
connection, authorization, and batching behavior before enabling Absinthe Relay
modern mode.
