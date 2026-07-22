# GraphQL Schema Type Decomposition

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-graphql-schema-type-decomposition-implementation-plan.md`
- Last verified: 2026-07-21 against the live Absinthe schema, exact SDL
  snapshot, GraphQL suites, and current module layout.

## Target Outcome

`ProductCompareWeb.Schema` will remain the one root-operation and runtime facade,
while its 151 type, input, enum, and interface definitions will move into
focused Absinthe notation modules with unchanged SDL, resolver wiring,
Dataloader behavior, authorization, errors, and public GraphQL values.

## Ready Evidence

- `lib/product_compare_web/schema.ex` is 2,004 lines and is the only project
  schema/type module.
- Root query and mutation operations occupy the first 464 lines; 151 type,
  input, enum, and interface definitions occupy the remaining monolith.
- `schema_snapshot_test.exs` already compares the complete generated SDL with
  `assets/schema.graphql`, so type names, fields, arguments, nullability,
  descriptions, interfaces, and enum values have an exact behavior guard.
- The discovery-batch baseline, including the SDL snapshot, passes 83 tests.

## Internal Slices

1. Shared, account, and commerce notation modules.
2. Catalog and trust/community notation modules.
3. Exact SDL, focused GraphQL, type, format, and full-suite parity.

## Boundaries

- Keep `query`, `mutation`, `context/1`, and `plugins/0` in
  `ProductCompareWeb.Schema`.
- Move definitions without renaming GraphQL identifiers, changing fields,
  descriptions, arguments, nullability, interfaces, resolver callbacks, or
  Dataloader sources.
- Do not edit `assets/schema.graphql`; the batch must preserve it byte for byte.
- Use domain-focused notation modules rather than one file per type or one new
  catch-all types file.
- Do not change resolver or domain behavior while moving schema declarations.

## Verification

- Exact SDL snapshot plus module-boundary characterization.
- All `test/product_compare_web/graphql/*_test.exs` suites.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
