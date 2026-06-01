# Backend Source Artifact Node Lookup

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, Task 2 focused and broader backend verification.
- Implementation plan: `docs/plans/2026-06-01-backend-source-artifact-node-lookup-implementation-plan.md`
- Objective: make safe `SourceArtifact` records addressable through the generic GraphQL `node(id:)` field now that the public-safe object contract exists.

## Batch Status

- [x] Task 1: add `SourceArtifact` to generic node lookup.
- [x] Task 2: run backend verification and close the lane.

## Current Batch

- Task: none queued.
- Status: completed.
- Owned paths:
  - `lib/product_compare_web/resolvers/node_resolver.ex`
  - `lib/product_compare_web/schema.ex`
  - `test/product_compare_web/graphql/node_query_test.exs`
  - `docs/work/backend-source-artifact-node-lookup.md`
  - `docs/plans/2026-06-01-backend-source-artifact-node-lookup-implementation-plan.md`
- Next step: no lane-owned source artifact node lookup batch remains; coordinator-owned docs can be updated at integration time.

## Verification

- Plan creation verified that `sourceArtifact(id:)` now exposes only safe metadata: `id`, `sourceKind`, `sourceName`, `sourceDomain`, `url`, and `fetchedAt`.
- Pre-Task 1 verification confirmed that `node(id:)` rejected `source_artifact` global IDs, giving Task 1 a clear RED target.
- RED: `mix test test/product_compare_web/graphql/node_query_test.exs` exited 2 with 22 tests, 2 failures; both failures were the expected missing `SourceArtifact` overlap with the `Node` interface.
- GREEN: `mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/source_artifact_query_test.exs` exited 0 with 26 tests, 0 failures.
- Task 2 focused verification: `mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/source_artifact_query_test.exs test/product_compare/specs/source_artifact_changeset_test.exs` exited 0 with 30 tests, 0 failures.
- Task 2 broader GraphQL verification: `mix test test/product_compare_web/graphql` exited 0 with 155 tests, 0 failures; reset-password delivery-hook warning logs were emitted by the auth tests.
- Task 2 typecheck: `mix typecheck` exited 0 with no output.
- Task 2 whitespace check: `git diff --check` exited 0 with no output.
- This lane must not expose `contentHash`, `rawJson`, or `rawText`, and must not change the source-artifact field policy established by `docs/work/backend-source-artifact-public-contract.md`.

## Blockers

- None.
