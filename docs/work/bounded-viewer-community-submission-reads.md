# Bounded Viewer Community Submission Reads

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-20-bounded-viewer-community-submission-reads-implementation-plan.md`
- Last verified: 2026-07-20 against owner-submission context policy, the
  product resolver, community GraphQL coverage, and Dataloader coverage.

## Batch Outcome

Authenticated `Product.viewerCommunitySubmissions` keeps fixed owner-private
review, question, and answer read budgets as product parent count grows.

## Ready Evidence

- `DiscussionsResolver.viewer_community_submissions/3` invokes the context once
  for every product parent.
- `Discussions.viewer_community_submissions/2` performs three separately
  limited reads per product while enforcing owner/status policy.
- Existing GraphQL coverage proves lifecycle visibility for one product but
  does not prove a growing product-parent query budget.

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

- Owner submission context parity tests.
- Community GraphQL and growing-parent Dataloader tests.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
