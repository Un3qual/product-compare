# Bounded Public Opaque-Key GraphQL Reads

## Snapshot

- Status: complete on `codex/bounded-public-opaque-graphql-reads`
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

## Initial Evidence

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

## Completion Evidence

- Before batching, two aliases plus one valid missing lookup per kind issued
  `%{source_artifacts: 3, sources: 2, product_threads: 3, thread_posts: 2,
  comparison_snapshots: 3}` SELECTs. Four aliases plus the same missing lookups
  issued `%{source_artifacts: 5, sources: 4, product_threads: 5,
  thread_posts: 4, comparison_snapshots: 5}`.
- After batching, both request sizes issue `%{source_artifacts: 1, sources: 1,
  product_threads: 1, thread_posts: 1, comparison_snapshots: 1}`. Source and
  accepted-answer preloads remain one bounded association query per kind.
- Context coverage proves empty, duplicate, malformed, missing, visible,
  unpublished or revoked inputs as applicable. Singular lookups delegate to
  the set-based APIs, and source artifacts, questions, and snapshots retain
  their preloaded or hydrated values.
- GraphQL coverage asserts exact safe source metadata, question titles and
  accepted-answer IDs, hydrated snapshot timestamps, and nullable valid-missing
  results before comparing budgets. Existing behavior suites retain invalid
  global-ID errors, publication/revocation gates, and public privacy checks.
- Focused verification passed 74 tests across the context, source-artifact,
  community, snapshot, and Dataloader suites; typecheck and formatting passed.
- `mix ci` passed 843 backend tests with 83.64% coverage, Credo with no issues,
  the 6/6 ExDNA clone budget, cross-function smell detection, Dialyzer, Relay
  validation, TypeScript, 1,507 frontend tests across 105 files, client and SSR
  builds, and the 182,164-byte gzip client-bundle budget.

## Remaining Work

None. Comparison-evidence, authorized-node, and bounded alert-evaluation
market-read outcomes remain ready in the live queue.
