# Discussions Resolver Decomposition

## Snapshot

- Status: active
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-discussions-resolver-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against community GraphQL and Dataloader
  characterization paths.

## Target Outcome

`ProductCompareWeb.Resolvers.DiscussionsResolver` remains the stable GraphQL
resolver facade while public community reads and community mutation handling
move into focused internal modules with unchanged public callbacks, loader
keys, query budgets, values, authorization, mutation payloads, and errors.

## Ready Evidence

- `lib/product_compare_web/resolvers/discussions_resolver.ex` is 378 lines and
  owns two substantial implementation responsibilities: public and
  viewer-scoped reads, plus authenticated community mutation input, action,
  payload, and error handling. Shared body, author-label, and viewer-capability
  presentation remains small enough to stay in the facade.
- `lib/product_compare_web/schema.ex`,
  `lib/product_compare_web/schema/types/catalog.ex`, and
  `lib/product_compare_web/schema/types/trust.ex` use the stable resolver
  facade, so ownership can move without caller changes.
- The selected two-suite characterization gate passed 61 tests on
  2026-07-23.
- Reads and mutations share one GraphQL community-resolver acceptance boundary
  and are internal slices rather than separate queue batches.
- The implementation paths are disjoint from Catalog Resolver, Listing
  Persistence, and CJ Candidates decomposition.

## Progress Evidence

- Claimed after CJ Candidates Task Decomposition completed with its exact
  characterization and full repository gates green.

## Internal Slices

1. Public and viewer-scoped read resolver ownership.
2. Authenticated mutation, input, action, payload, and error ownership.
3. Stable resolver facade, shared presentation fields, and caller parity.

## Boundaries

- Preserve every public resolver function, clause, value, loader tuple, result,
  mutation payload, and error.
- Preserve connection arguments, loader sources and keys, public visibility,
  owner visibility, request batching, authorization, Global ID handling,
  idempotency, rate-limit errors, and moderation behavior.
- Keep schema, type, production, and test callers dependent only on
  `ProductCompareWeb.Resolvers.DiscussionsResolver`.
- Do not change schemas, migrations, GraphQL SDL, Relay behavior, discussion
  context policy, query budgets, or frontend contracts.

## Verification

- `mix test test/product_compare_web/graphql/community_content_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
