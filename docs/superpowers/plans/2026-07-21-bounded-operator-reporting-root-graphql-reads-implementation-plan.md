# Bounded Operator Reporting Root GraphQL Reads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reuse each operator-only reporting root read when identical aliases
repeat within one GraphQL request.

**Architecture:** One request-scoped KV Dataloader source keys operator
reporting reads by operator ID, field kind, normalized input, and Relay
connection arguments. Resolvers authorize and normalize before scheduling a
load; batch callbacks execute the existing coupon connection or revenue
aggregate once per distinct key while retaining direct fallbacks.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve operator authorization and perform it before scheduling a load.
- Include operator ID, field kind, normalized filters, and connection arguments
  in every private cache key.
- Preserve explicit coupon `at` values and sample omitted observation time once
  inside the request batch.
- Preserve coupon ordering/pagination, revenue filters/suppression, nested
  values, validation errors, direct fallbacks, and the public GraphQL schema.
- Distinct normalized inputs remain distinct reads; only identical authorized
  request work is reused.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Operator Active-Coupon Root Loading

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `test/product_compare_web/graphql/affiliate_workflows_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:** `Loader.operator_reporting_source/0` exposes a KV source.
Authorized coupon loads use the operator ID and normalized coupon input; the
batch callback returns the existing Relay projection for each distinct input.

- [ ] Add failing two- versus four-alias coupon regressions with exact response,
  authorization, pagination, validation, and SELECT-budget assertions.
- [ ] Confirm RED because each identical alias currently executes its direct
  coupon query.
- [ ] Add the request source and route loader-present coupon requests through it
  after authorization and normalization, retaining the direct fallback.
- [ ] Re-run affiliate-workflow and Dataloader batching suites.
- [ ] Commit with message `perf: reuse operator coupon root reads`.

### Task 2: Operator Revenue-Summary Root Loading

**Files:**

- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`
- Modify: `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:** Authorized revenue loads use the same request source with the
operator ID and normalized revenue filters; the resolver retains the existing
GraphQL projection and error mapping.

- [ ] Add failing two- versus four-alias revenue regressions with exact response,
  authorization, filter, suppression, validation, and SELECT-budget assertions.
- [ ] Confirm RED because each identical alias currently executes its direct
  dashboard aggregate.
- [ ] Route loader-present revenue requests through the source after
  authorization and normalization, retaining the direct fallback.
- [ ] Re-run commerce-revenue and Dataloader batching suites.
- [ ] Commit with message `perf: reuse operator revenue root reads`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-operator-reporting-root-graphql-reads.md`

- [ ] Record exact before/after query counts and authorization, validation,
  pagination/filter, nested-value, and semantic parity coverage.
- [ ] Run `mix test test/product_compare_web/graphql/affiliate_workflows_test.exs
  test/product_compare_web/graphql/commerce_revenue_summary_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.
