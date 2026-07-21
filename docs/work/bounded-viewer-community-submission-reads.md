# Bounded Viewer Community Submission Reads

## Snapshot

- Status: complete
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-20-bounded-viewer-community-submission-reads-implementation-plan.md`
- Completed: 2026-07-21 on `codex/bounded-graphql-read-budgets`.
- Last verified: 2026-07-21 against owner-submission context policy, the
  product resolver, community GraphQL coverage, growing-parent Dataloader
  coverage, and the full repository gate.

## Batch Outcome

Authenticated `Product.viewerCommunitySubmissions` keeps fixed owner-private
review, question, and answer read budgets as product parent count grows.

## Completion Evidence

- Before batching, growing to three product parents produced
  `{product_reviews: 3, product_threads: 3, thread_posts: 3}` SELECTs.
- After batching, both three and six product parents hold at
  `{product_reviews: 1, product_threads: 1, thread_posts: 1}`.
- `Discussions.viewer_community_submissions_for_products/2` applies each
  per-kind limit independently per product, fills empty and missing parents,
  returns no queries for empty input, and keeps the single-product API on the
  same policy path.
- Context and GraphQL coverage preserve owner-only visibility, descending
  order, pending/hidden/rejected status policy, published answers beneath
  non-public questions, exact IDs and values, and owner edit/remove capability.
- Anonymous GraphQL reads still return three empty lists without selecting any
  community content table.

## Internal Slices

1. Parent-partitioned owner review, question, and answer reads.
2. Authenticated request-scoped Dataloader integration.
3. Privacy, lifecycle parity, and fixed query-budget coverage.

## Boundaries

- Preserve owner-only and anonymous behavior.
- Preserve per-kind limits, order, status filters, and hidden-parent answer
  manageability.
- Do not change the public GraphQL schema.

## Verification

- `mix test test/product_compare/discussions/community_trust_test.exs test/product_compare_web/graphql/community_content_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs` — 49 tests, 0 failures.
- `mix typecheck` — passed.
- `mix format --check-formatted` — passed.
- `mix work_queue.validate` — passed with three ready rows after closeout.
- `git diff --check` — passed.
- `mix ci` — passed with queue validation, Credo clean, clone budget 6/6, no
  new cross-function smells, Dialyzer clean, 832 backend tests, 83.67%
  coverage, Relay validation, TypeScript, 1,507 frontend tests, client and SSR
  builds, and the client bundle budget.
