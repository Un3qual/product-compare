# Bounded Public Opaque-Key GraphQL Reads

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-public-opaque-key-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-21 against the public source-artifact, product-question,
  and comparison-snapshot resolvers, their visibility rules, existing behavior
  suites, and request-scoped Dataloader construction.

## Batch Outcome

Aliased public `sourceArtifact(id:)`, `productQuestion(id:)`, and
`comparisonSnapshot(token:)` entry-point reads keep fixed SELECT budgets per
lookup kind as alias count grows, without changing ID errors, nullable missing
results, source preloads, publication and revocation gates, accepted-answer
values, snapshot hydration, or public privacy.

## Ready Evidence

- `SpecsResolver.source_artifact/3` decodes each global ID and then calls
  `Specs.get_source_artifact/1`, which performs a direct artifact read plus
  source preload for every alias.
- `DiscussionsResolver.question/3` decodes each UUID global ID and then calls
  `Discussions.get_public_question/1`, which performs a direct question read and
  accepted-post preload for every alias while filtering unpublished questions.
- `ComparisonSnapshotsResolver.comparison_snapshot/3` calls
  `ComparisonSnapshots.get_public/1` for every alias; each valid token performs
  its own active-snapshot read and hydration.
- The three existing GraphQL behavior suites passed 26 tests on 2026-07-21, but
  none proves a fixed query budget as aliases grow.

## Internal Slices

1. Set-based source-artifact, public-question, and active-snapshot context reads.
2. Request-scoped opaque-key lookup loading for the three public resolvers.
3. Semantic, privacy, preload, and fixed per-kind query-budget parity.

## Boundaries

- Preserve invalid source-artifact and product-question ID errors.
- Preserve missing, malformed-token, unpublished-question, and revoked-snapshot
  results as `nil` under the current contracts.
- Preserve SourceArtifact source loading, accepted-answer loading, public
  snapshot hydration, and the absence of snapshot owner identity.
- Do not change the public GraphQL schema.

## Verification

- Specs, Discussions, and ComparisonSnapshots context parity tests.
- Source-artifact, community-content, comparison-snapshot, and growing-alias
  Dataloader tests.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
