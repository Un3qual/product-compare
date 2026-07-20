# Alert Lifecycle Reliability

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Design: `docs/superpowers/specs/2026-07-20-cross-stack-ready-work-design.md`
- Plan: `docs/superpowers/plans/2026-07-20-alert-lifecycle-reliability-implementation-plan.md`
- Last verified: 2026-07-20 against alert evaluation, Oban dispatch, strict
  frontend date helpers, row mutation state, and focused tests.

## Batch Outcome

Every persisted price observation evaluates every applicable watch
asynchronously, one broken watch cannot starve later watches, and the alert
interface presents truthful timestamps and row-local action feedback.

## Ready Evidence

- `Alerts.evaluate_price_point/2` currently halts its ordered watch reduction on
  the first failure.
- The Oban worker retries the whole price point up to five times, so a persistent
  early failure can prevent every later watch from being evaluated.
- Alert labels still use permissive temporal presentation for invalid GraphQL
  DateTime values.
- Alert/watch mutation failures are global instead of associated with the row
  whose action failed.

## Internal Slices

1. Full watch evaluation with deterministic failure aggregation and replay-safe
   success.
2. Strict alert observation labels.
3. Row-scoped alert/watch pending and error feedback.

## Boundaries

- Keep price-point insert and Oban enqueue atomic.
- Preserve watch locks, event uniqueness, cooldowns, delivery attempts, and
  successful frontend revalidation.
- Preserve valid timestamp labels, markup, accessibility, and presentation.

## Verification

- Alert context, worker, and GraphQL suites.
- Alert view-data and route Vitest suites.
- `cd assets && bun run check`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
