# Alert Lifecycle Reliability

## Snapshot

- Status: implemented; awaiting queue closeout
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

- Backend RED: the alert context suite reported 7 tests, 2 failures. The
  existing reducer returned after the first failed watch, and the replay
  evaluator could not delegate successful watches to the real transaction.
- Backend GREEN: the alert context and GraphQL suites report 10 tests,
  0 failures. All three ordered watches run after an early failure; retry adds
  only the previously failed watch's event, leaving three events and three
  delivery attempts rather than duplicating the two earlier successes.
- Date RED: alert view-data and route suites reported 24 tests, 4 failures for
  an impossible date, an offset-free timestamp, and an explicit offset whose
  source calendar day differed from its UTC day.
- Row-state RED: the alert route suite reported 11 tests, 3 failures because
  mark-read, toggle, and delete errors rendered outside their affected rows.
- Frontend GREEN: alert view-data and route suites report 27 tests,
  0 failures. Strict labels preserve valid source dates and fall back to exact
  invalid input; all three action families keep pending and failure state local
  to the keyed row.
- Batch gates: focused backend alert and GraphQL suites,
  `cd assets && bun run check`, `mix typecheck`,
  `mix format --check-formatted`, `mix work_queue.validate`, and
  `git diff --check`.
