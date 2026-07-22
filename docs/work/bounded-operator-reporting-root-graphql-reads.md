# Bounded Operator Reporting Root GraphQL Reads

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-operator-reporting-root-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-21 against live affiliate-workflow, commerce-revenue,
  and Dataloader GraphQL suites.

## Target Outcome

Identical operator-only active-coupon and revenue-summary root aliases will
reuse one authorized database read per normalized input within a GraphQL request
without changing authorization, time/filter semantics, pagination, suppression,
metrics, errors, or schema behavior.

## Ready Evidence

- `AffiliateResolver.active_coupons/3` authorizes and then executes the active-
  coupon connection query independently for every root alias.
- `CommerceAttributionResolver.revenue_summary/3` authorizes and then executes
  the dashboard aggregate independently for every root alias.
- These are the remaining operator-only reporting roots. They share one
  authorization-keyed request-reuse lifecycle, while coupon pagination and
  revenue aggregation remain internal slices.
- Affiliate-workflow, commerce-revenue, and Dataloader suites passed 40 tests
  on 2026-07-21, but none proves fixed budgets as identical aliases grow.

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
