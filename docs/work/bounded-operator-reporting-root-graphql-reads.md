# Bounded Operator Reporting Root GraphQL Reads

## Snapshot

- Status: complete on current detached worktree
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-operator-reporting-root-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-22 against live affiliate-workflow, commerce-revenue,
  and Dataloader GraphQL suites.

## Current Reconciliation

The 2026-07-31 GraphQL simplification removed the singleton
operator-reporting source. Root `activeCoupons` and revenue-summary fields now
authorize and call their context query paths directly, so identical root
aliases intentionally execute independently. The prior reuse budgets remain
historical completion evidence; authorization, filtering, suppression,
pagination, values, and errors remain behavior contracts.

## Historical Batch Outcome

Identical operator-only active-coupon and revenue-summary root aliases now
reuse one authorized database read per normalized input within a GraphQL request
without changing authorization, time/filter semantics, pagination, suppression,
metrics, errors, or schema behavior.

## Historical Implementation Evidence

- `Loader.operator_reporting_source/0` exposes one request-scoped KV source
  keyed by operator ID, field kind, normalized filters, and connection
  arguments. Coupon keys also include merchant and explicit observation time;
  omitted time is sampled once inside the batch callback.
- Active-coupon identical aliases moved from two/four coupon SELECTs to one/one.
  The mixed merchant/time/page case moved from five reads to four distinct
  reads while preserving the first page, next page, empty historical page, and
  alternate merchant page exactly.
- Revenue-summary identical aliases moved from conversion/click budgets of
  `%{commerce_conversions: 4, commerce_click_sessions: 2}` and
  `%{commerce_conversions: 8, commerce_click_sessions: 4}` to a fixed
  `%{commerce_conversions: 2, commerce_click_sessions: 1}`. The normalized
  `usd`/`USD` plus unfiltered and merchant-filtered case moved from
  `%{commerce_conversions: 6, commerce_click_sessions: 4}` to
  `%{commerce_conversions: 5, commerce_click_sessions: 3}` distinct reads.
- Authorization and validation still run before scheduling. Direct no-loader
  coupon and revenue resolver characterizations pass, and tagged revenue batch
  results preserve the stable mixed-currency GraphQL error rather than raising
  through Dataloader.
- Milestone commits are `716f6bcb perf: reuse operator coupon root reads` and
  `172d1ccb perf: reuse operator revenue root reads`.
- The final affiliate-workflow, commerce-revenue, and Dataloader gate passed 65
  tests with zero failures. `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate` (`3 ready rows`), and `git diff --check` all exited
  successfully on 2026-07-22.
- The full `mix ci` gate exited successfully with 902 backend tests and 1,507
  frontend tests passing, 83.79% backend coverage, clean static analysis, and
  successful Relay validation, TypeScript checking, client/SSR builds, and
  bundle-budget validation.

## Internal Slices

1. Operator-authorized active-coupon connection request reuse.
2. Operator-authorized revenue-summary aggregate request reuse.
3. Growing-alias query budgets plus authorization and semantic parity.

## Boundaries

- Authorize before scheduling either request-scoped load.
- Include operator ID, field kind, normalized filters, and Relay connection
  arguments in every key.
- Sample an omitted active-coupon observation time once inside the request batch;
  preserve an explicit `at` value exactly.
- Preserve coupon ordering and pagination, revenue filtering and suppression,
  nested GraphQL values, validation errors, direct resolver fallbacks, and the
  public schema.
- Execute serially with other Loader ownership and do not reopen deferred
  ingestion dashboard/operator UI work.

## Verification

- Affiliate workflow, commerce revenue summary, and Dataloader batching suites.
- Two- versus four-alias query-budget regressions for both root fields.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
