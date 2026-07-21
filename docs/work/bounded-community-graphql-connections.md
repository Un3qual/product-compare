# Bounded Community GraphQL Connections

## Snapshot

- Status: active
- Owner: `codex/bounded-community-connections`
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-20-bounded-community-graphql-connections-implementation-plan.md`
- Last verified: 2026-07-20 against public community context queries, Product
  and ProductQuestion GraphQL fields, the product-community Relay query, and
  current Dataloader coverage.

## Batch Outcome

Published review, question, and nested answer Relay connections use bounded
set-based reads whose query count does not grow with product or question parent
count.

## Ready Evidence

- `DiscussionsResolver.reviews/3` executes one connection query per Product.
- `DiscussionsResolver.questions/3` executes one connection query plus accepted-
  answer preload work per Product.
- `DiscussionsResolver.answers/3` executes one connection query per question;
  the product-community route requests nested answers for every loaded question.
- Current community coverage verifies lifecycle and visibility but not a fixed
  query budget as product/question parents grow.

## Internal Slices

1. Parent-partitioned published review and question pages.
2. Parent-partitioned published answer pages with accepted-answer parity.
3. Dataloader integration and constant query-budget regression coverage.

## Boundaries

- Public reads remain published-only and author identity remains private.
- Preserve review/question reverse chronology and answer forward chronology.
- Preserve Relay cursor, page-size, invalid-input, and page-info behavior.
- Do not alter owner writes, moderation, rate limits, or idempotency.

## Verification

- Community context and GraphQL behavior suites.
- Growing product/question parent query-budget assertions.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
