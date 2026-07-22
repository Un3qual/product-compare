# GraphQL Schema Type Decomposition

## Snapshot

- Status: active
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-graphql-schema-type-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the live Absinthe schema, exact SDL
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

## Batch Outcome

- Status: complete at implementation commit `5e1614e6c69acda5d22f16d42b98f3c5effdea4e`
  (`refactor: extract graphql schema types`).
- `ProductCompareWeb.Schema` remains the 689-line root-operation and runtime
  facade; it owns `query`, `mutation`, `context/1`, `plugins/0`, and the
  ordered notation imports, with no type/input/enum/interface declarations.
- The five notation modules own all 151 declarations: Common 4 (58 lines),
  Accounts 10 (78 lines), Commerce 50 (514 lines), Catalog 37 (458 lines),
  and Trust 50 (485 lines).
- The facade has 29 domain selective `import_types` entries (30 total including
  `Absinthe.Type.Custom`). Their sequence deliberately preserves the reverse
  of the original contiguous ownership runs: Absinthe accumulates imported
  types globally, so this atomic ordering retains the monolith's effective
  type-resolution order while each module has focused domain ownership.
- `assets/schema.graphql` remains byte-identical: SHA-256
  `034499f4c125647351ec05d3ca2a0e2283d28a97db1d58b454121aaa7fef2ef8`.

### Fresh Gate Evidence (2026-07-22)

- `mix test test/product_compare_web/graphql` — 307 tests, 0 failures.
- `mix typecheck` — exit 0.
- `mix format --check-formatted` — exit 0.
- `mix work_queue.validate` — exit 0: `work queue valid: 3 ready rows`.
  The first sandboxed invocation was blocked by Mix.PubSub opening its local
  TCP socket (`:eperm`); a fresh elevated rerun produced this result.
- `mix ci` — exit 0: 902 backend tests, 0 failures; 105 frontend test files
  and 1,507 frontend tests passed; Relay validation, TypeScript, and client/SSR
  production builds passed.
- `git diff --check` — exit 0.
