# Bounded Merchant GraphQL Reads

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Design: `docs/superpowers/specs/2026-07-20-cross-stack-ready-work-design.md`
- Plan: `docs/superpowers/plans/2026-07-20-bounded-merchant-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-20 against Pricing merchant detail, the GraphQL KV
  Dataloader source, and current query-budget tests.

## Batch Outcome

Merchant detail summaries requested through a GraphQL merchant connection use
set-based reads whose query count remains constant as merchant parent count
increases.

## Ready Evidence

- `merchant_detail_batch(:summary, merchants)` currently loops over merchants
  and calls `Pricing.merchant_detail/2` once per parent.
- Each single-merchant call loads active offers and latest prices separately.
- Existing Dataloader query-budget coverage verifies brands, offers, merchants,
  and latest prices but does not request multiple merchant detail summaries.

## Internal Slices

1. Set-based Pricing merchant detail read model.
2. Dataloader delegation and fixed query-budget regression.

## Boundaries

- Preserve detail summary shape, offer truth, freshness, and eligibility.
- Include all active offers independent of Relay page size.
- Preserve correct zero summaries for empty merchants.
- Do not change the public GraphQL schema.

## Verification

- Pricing merchant-detail context tests.
- GraphQL Dataloader batching and merchant-detail tests.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
