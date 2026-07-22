# Discussions Context Decomposition

## Snapshot

- Status: active
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-discussions-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the live context, all direct discussion
  suites, community GraphQL, SEO qualification, and Dataloader batching.

## Target Outcome

`ProductCompare.Discussions` will remain the stable application-facing context
while read/query, legacy CRUD, submission/owner-policy, and moderation
implementations move into focused internal modules with unchanged public APIs,
queries, locks, transactions, privacy, limits, idempotency, errors, and GraphQL
behavior.

## Ready Evidence

- `lib/product_compare/discussions.ex` is 1,285 lines and owns at least four
  independently describable responsibilities: read/query projection, raw
  thread/post/review CRUD, authenticated submission and owner lifecycle policy,
  and operator moderation.
- The public context API is already a stable boundary used by resolvers, SEO,
  and tests, so implementation can retain that facade while moving internal
  ownership without caller changes.
- The selected seven-suite characterization gate passed 104 tests on
  2026-07-22. It covers direct CRUD, verified-purchase immutability, post-parent
  validation, community lifecycle policy, SEO qualification, GraphQL behavior,
  privacy, and fixed Dataloader query budgets.
- This row is path-disjoint from operator-reporting and schema ownership. It is
  also independent from request-loader decomposition because callers continue
  to use the unchanged `ProductCompare.Discussions` facade.

## Internal Slices

1. Read and query ownership extraction.
2. Legacy CRUD and parent-validation ownership extraction.
3. Submission, owner lifecycle, idempotency, reporting, and rate-policy
   extraction.
4. Answer-acceptance and operator-moderation ownership extraction.

## Boundaries

- Preserve every public `ProductCompare.Discussions` function, arity, default,
  typespec, result, and error.
- Preserve Ecto filters, order, pagination, locks, transactions, moderation
  transitions, accepted-answer cleanup, owner visibility, write limits, and
  idempotency replay/conflict behavior.
- Keep resolvers, SEO, and other contexts dependent only on the facade.
- Do not change migrations, schemas, GraphQL SDL, frontend behavior, or product
  policy.
- Use responsibility-focused modules; do not replace the monolith with generic
  callback dispatch or one new catch-all implementation module.

## Verification

- `mix test test/product_compare/discussions/community_trust_test.exs test/product_compare/discussions/product_review_immutability_test.exs test/product_compare/discussions/thread_crud_test.exs test/product_compare/discussions/thread_post_validation_test.exs test/product_compare/seo_test.exs test/product_compare_web/graphql/community_content_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
