# Backend Source Artifact Public Contract

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, final backend verification.
- Implementation plan: `docs/plans/2026-06-01-backend-source-artifact-public-contract-implementation-plan.md`
- Objective: define the narrow GraphQL `SourceArtifact` display contract that the later generic `node(id:)` support now reuses for source artifacts.

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
- Next step: safe source-artifact object/query contract is complete, and the follow-up node lookup lane now makes `SourceArtifact` root-node addressable through the same safe field policy.

## Verification

- Task 1 RED: `mix test test/product_compare_web/graphql/source_artifact_query_test.exs` failed with 4 tests / 4 failures because `sourceArtifact` and the `SourceArtifact` GraphQL type were not yet defined.
- Task 1 GREEN: `mix test test/product_compare_web/graphql/source_artifact_query_test.exs test/product_compare_web/graphql/node_query_test.exs` passed with 25 tests / 0 failures.
- Task 1 added `sourceArtifact(id:)` with safe metadata only: `id`, `sourceKind`, `sourceName`, `sourceDomain`, `url`, and `fetchedAt`.
- Task 1 introspection coverage verifies `SourceArtifact` does not expose `contentHash`, `rawJson`, or `rawText`.
- Task 1 deferred generic `node(id:)` support for `source_artifact` global IDs; the later backend source-artifact node lookup lane completed that follow-up.
- Task 2 focused verification passed with `mix test test/product_compare_web/graphql/source_artifact_query_test.exs test/product_compare_web/graphql/node_query_test.exs test/product_compare/specs/source_artifact_changeset_test.exs`.
- Task 2 broader verification passed with `mix test test/product_compare_web/graphql`, `mix typecheck`, and `git diff --check`.
- Plan creation verified that `GlobalId` already knew the `:source_artifact` type while this lane intentionally kept node lookup out of the initial public contract.
- `test/product_compare_web/graphql/node_query_test.exs` now asserts that `source_artifact` global IDs resolve through `node(id:)` with only safe metadata fields.
- `ProductCompareSchemas.Specs.SourceArtifact` persists `url`, `content_hash`, `raw_json`, and `raw_text`; this lane must not expose raw payloads or content hashes.
- The selected backend follow-up was generic `node(id:)` support for `SourceArtifact`, and it has been completed using the safe field policy established in this lane.

## Blockers

- None for the safe object/query contract.
- None for generic `node(id:)` support; the follow-up node lookup lane is complete.
