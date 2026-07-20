# Community Content Lifecycle

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Design: `docs/superpowers/specs/2026-07-20-cross-stack-ready-work-design.md`
- Plan: `docs/superpowers/plans/2026-07-20-community-content-lifecycle-implementation-plan.md`
- Last verified: 2026-07-20 against discussion schemas/context, GraphQL
  mutations, the product-community Relay surface, and focused tests.

## Batch Outcome

Authenticated reviews, questions, and answers have a complete owner-controlled,
abuse-resistant lifecycle from durable backend policy through typed GraphQL and
accessible Relay controls.

## Ready Evidence

- The accepted community design requires owner update/delete, per-user rate
  limits, and duplicate-submission idempotency.
- Current GraphQL supports create, accept, report, and operator moderation but
  exposes no owner update/remove mutations.
- Current schemas support pending/published/hidden/rejected, but not retained
  owner removal.
- Current context and tests contain no per-user write limiter or general create
  idempotency receipt.
- The approved 2026-07-20 policy fixes exact limits, idempotency behavior,
  edit-to-pending rules, and accepted-answer cleanup, so no decision remains.

## Internal Slices

1. Migration and durable write receipts/windows.
2. Owner lifecycle, idempotency, and rate-limit context policy.
3. Typed GraphQL mutations, errors, capabilities, and schema snapshot.
4. Relay idempotency and owner controls.

## Boundaries

- Public reads remain published-only and author identity stays private.
- Removal retains audit/moderation state and is never rate-limited.
- Browser writes remain GraphQL over `/api/graphql`.
- Keep moderation operations operator-only and keep raw receipt/counter data
  private.

## Verification

- All discussion context and community GraphQL tests.
- Schema snapshot and Relay generation/validation.
- Community route-data and panel Vitest suites.
- `cd assets && bun run check`
- `mix typecheck`
- `mix format --check-formatted`
- `mix ci`
- `git diff --check`
