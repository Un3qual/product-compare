# Specifications Internals Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-specifications-internals-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against direct Specs, catalog, recommendation,
  enrichment, and GraphQL correction characterization paths.

## Target Outcome

`Specs.Reads`, `Specs.Claims`, and `SpecsResolver` remain stable facades while
artifact, current-attribute, reference-data, claim-workflow, and resolver
implementations live in focused owners with exact contract parity.

## Ready Evidence

- The three facades are 377, 356, and 273 lines and each combines distinct
  read, workflow, or resolver responsibilities.
- Existing direct and consumer suites characterize typed values, selection,
  evidence, ordering, replay, moderation, and GraphQL behavior.

## Internal Slices

1. Artifact, current-attribute, and reference-data reads.
2. Proposal, import, and moderation/current-selection claim workflows.
3. GraphQL reads and correction actions.
4. Stable facades and caller-path parity.

## Boundaries

- Preserve every function, default, guard, result, error, query, order,
  preload, budget, transaction, lock, typed value, fingerprint, and Global ID.
- Do not change schemas, migrations, GraphQL SDL, domain policy, ingestion,
  Relay, or frontend behavior.

## Verification

- `mix test test/product_compare/specs test/product_compare/ingestion/enrichment_test.exs test/product_compare/catalog/filter_metadata_test.exs test/product_compare/recommendations_test.exs test/product_compare_web/graphql/specification_corrections_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
