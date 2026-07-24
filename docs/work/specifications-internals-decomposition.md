# Specifications Internals Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-specifications-internals-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 with 88 focused tests and the full repository gate.

## Target Outcome

`Specs.Reads`, `Specs.Claims`, and `SpecsResolver` remain stable facades while
artifact, current-attribute, reference-data, claim-workflow, and resolver
implementations live in focused owners with exact contract parity.

## Completion Evidence

- `Specs.Reads`, `Specs.Claims`, and `SpecsResolver` are 75-, 32-, and
  77-line stable facades.
- `Artifacts`, `CurrentAttributes`, and `ReferenceData` own source-artifact,
  accepted-current-attribute, and reference-data reads.
- `Proposals`, `Imports`, and `Moderation` own user proposals, replay-safe
  imported observations, moderation, and current-claim selection.
- Resolver `Reads` and `Corrections` own GraphQL read and correction behavior.
- Application callers still use `ProductCompare.Specs`; schema fields still
  use `SpecsResolver`; focused owners are not bypassed outside their
  implementation namespaces.
- The exact focused gate passed 88 tests with 0 failures.
- Full `mix ci` passed 913 backend tests at 83.59% coverage, 1,507 frontend
  tests, and every queue, format, compile, Credo, six-clone ExDNA, Reach,
  Dialyzer, Relay, type, build, and bundle gate.

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

- `mix test test/product_compare/specs test/product_compare/ingestion/enrichment_test.exs test/product_compare/catalog/filter_metadata_test.exs test/product_compare/catalog/filtering_regression_test.exs test/product_compare/recommendations_test.exs test/product_compare_web/graphql/specification_corrections_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
