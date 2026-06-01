# Backend Source Artifact Public Contract

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, final backend verification.
- Implementation plan: `docs/plans/2026-06-01-backend-source-artifact-public-contract-implementation-plan.md`
- Objective: define a narrow GraphQL `SourceArtifact` display contract before any generic `node(id:)` support is added for source artifacts.

## Batch Status

- [x] Task 1: add a public-safe source-artifact GraphQL query and object.
- [x] Task 2: run backend verification and close or advance the lane.

## Current Batch

- Task: none.
- Status: completed.
- Owned paths:
  - `lib/product_compare/specs.ex`
  - `lib/product_compare_web/schema.ex`
  - `lib/product_compare_web/resolvers/specs_resolver.ex`
  - `test/product_compare_web/graphql/source_artifact_query_test.exs`
  - `test/product_compare_web/graphql/node_query_test.exs`
  - `docs/work/backend-source-artifact-public-contract.md`
  - `docs/plans/2026-06-01-backend-source-artifact-public-contract-implementation-plan.md`
- Next step: safe source-artifact object/query contract is complete; generic `node(id:)` support for `SourceArtifact` is now the next backend decision.

## Verification

- Task 1 RED: `mix test test/product_compare_web/graphql/source_artifact_query_test.exs` failed with 4 tests / 4 failures because `sourceArtifact` and the `SourceArtifact` GraphQL type were not yet defined.
- Task 1 GREEN: `mix test test/product_compare_web/graphql/source_artifact_query_test.exs test/product_compare_web/graphql/node_query_test.exs` passed with 25 tests / 0 failures.
- Task 1 added `sourceArtifact(id:)` with safe metadata only: `id`, `sourceKind`, `sourceName`, `sourceDomain`, `url`, and `fetchedAt`.
- Task 1 introspection coverage verifies `SourceArtifact` does not expose `contentHash`, `rawJson`, or `rawText`.
- Task 1 left generic `node(id:)` support unsupported for `source_artifact` global IDs.
- Task 2 focused verification passed with `mix test test/product_compare_web/graphql/source_artifact_query_test.exs test/product_compare_web/graphql/node_query_test.exs test/product_compare/specs/source_artifact_changeset_test.exs`.
- Task 2 broader verification passed with `mix test test/product_compare_web/graphql`, `mix typecheck`, and `git diff --check`.
- Plan creation verified that `GlobalId` already knows the `:source_artifact` type, but `NodeResolver` intentionally excludes it from public, authenticated, and owner-scoped node lookup lists.
- `test/product_compare_web/graphql/node_query_test.exs` currently asserts that `source_artifact` global IDs are unsupported by `node(id:)`.
- `ProductCompareSchemas.Specs.SourceArtifact` persists `url`, `content_hash`, `raw_json`, and `raw_text`; this lane must not expose raw payloads or content hashes.
- The selected backend follow-up is generic `node(id:)` support for `SourceArtifact`, using the safe field policy established in this lane.

## Blockers

- None for the safe object/query contract.
- Generic `node(id:)` support for `SourceArtifact` remains blocked until this contract is complete and a follow-up explicitly decides whether source artifacts should be root-node addressable.
