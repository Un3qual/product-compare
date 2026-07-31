# Bounded Community GraphQL Connections

## Snapshot

- Status: done
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

## Completion Evidence

- `Discussions.public_connection_pages/3` performs one bounded, partitioned
  query per review, question, or answer connection kind.
- Product review, question, and answer fields share a genuine
  `Dataloader.Ecto` parent-set source keyed by actual parent schema, operation
  kind, and connection arguments.
- Questions retain accepted-answer preload parity, and public review, question,
  and answer rows retain their visibility, order, cursor, and page-info
  contracts.
- Growing from two to four product/question parents keeps each tracked table at
  one SELECT.

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

## Evidence And Verification

### Fixed query budgets

- Historical RED, with identical field arguments before resolver batching:
  - 2 parents: `product_reviews` 2 SELECTs, `product_threads` 2 SELECTs, and
    `thread_posts` 4 SELECTs.
  - 4 parents: `product_reviews` 4 SELECTs, `product_threads` 4 SELECTs, and
    `thread_posts` 8 SELECTs.
- Current GREEN after batching: both the 2-parent and 4-parent shapes issue
  exactly 1 SELECT each for `product_reviews`, `product_threads`, and
  `thread_posts`.

### Behavior coverage

- Published-only reviews, questions, and answers; exact per-parent ordering and
  tie behavior; empty parents; offsets; `acceptedAnswerId` with a preloaded
  `accepted_post`; absolute cursors; `hasNextPage`; invalid-first and malformed
  cursor errors; and nested answers remain covered.
- Earlier root rechecks at their respective code/test milestones recorded 27
  connection-and-community tests for Task 1, 21 community-trust tests for Task
  2, and 22 community-content-plus-Dataloader tests for Task 3. These are
  milestone evidence, not substitutes for the fresh full focused command below.

### Fresh verification (2026-07-20)

- `mix test test/product_compare/discussions/community_trust_test.exs test/product_compare_web/graphql/community_content_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs` — 43 tests, 0 failures.
- `mix typecheck` — passed.
- `mix format --check-formatted` — passed.
- `mix work_queue.validate` — passed outside the sandbox after the sandbox
  attempt failed only because Mix.PubSub could not open its local socket
  (`:eperm`); output: `work queue valid: 3 ready rows`.
- `git diff --check` — passed.
- `mix ci` — passed on the completed implementation: queue validator clean;
  Credo clean; ExDNA at the configured `6/6` clone budget; Reach clean;
  Dialyzer clean; 814 backend tests with 0 failures and 83.48% coverage; 105
  frontend files with 1,507 tests passing; Relay validation, TypeScript, client
  build, SSR build, and the 182,164-byte gzip client bundle all passed.

## Completion Handoff

- Status: done
- What changed: shared prefetched Relay windows, parent-partitioned published
  community reads, and one request-scoped Ecto source now binds review,
  question, and nested answer connections independently of parent count.
- Verification run: focused 43-test lane gate plus the full `mix ci` matrix
  recorded above.
- Remaining work: none in this lane.
- Next row promoted: none; the three existing ready rows remain executable.
