# Affiliate Resolver Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompareWeb.Resolvers.AffiliateResolver` schema-facing
while moving active-coupon reads and operator mutations into focused owners.

**Architecture:** `Resolvers.Affiliate.Reads` owns public/nested and
operator-scoped coupon connections. `Resolvers.Affiliate.Mutations` owns
network, program, link, and coupon mutations. The existing resolver retains
every schema callback as an explicit wrapper.

**Tech Stack:** Elixir, Absinthe, Dataloader, Ecto, ExUnit.

## Global Constraints

- Preserve every resolver callback, clause, result, authorization decision,
  Global ID rule, connection argument, payload, and error.
- Keep schema files dependent only on `AffiliateResolver`.
- Preserve public nested coupon access and operator-only global reads/writes.
- Do not change Affiliate context behavior, schemas, migrations, GraphQL SDL,
  Relay, or frontend behavior.

---

## Task 1: Affiliate Read Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/affiliate/reads.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Test: `test/product_compare_web/graphql/affiliate_workflows_test.exs`

**Interfaces:**

- Produces:
  `Reads.active_coupons/3` and
  `Reads.merchant_product_active_coupons/3`.

- [ ] Run the GraphQL affiliate suite as the green baseline.
- [ ] Add facade delegation and verify the expected missing-owner compilation
  failure.
- [ ] Move operator authorization, merchant ID normalization, active-coupon
  connection loading, nested merchant-product coupon loading, input errors,
  and connection arguments into `Reads`.
- [ ] Preserve Dataloader/direct-query branches, public nested access,
  operator-only global access, and exact errors.
- [ ] Re-run the suite; expect all tests to pass.
- [ ] Commit with message `refactor: isolate graphql affiliate reads`.

## Task 2: Affiliate Mutation Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/affiliate/mutations.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Test: `test/product_compare/affiliate/affiliate_workflows_test.exs`
- Test: `test/product_compare_web/graphql/affiliate_workflows_test.exs`

**Interfaces:**

- Produces:
  `Mutations.upsert_affiliate_network/3`,
  `upsert_affiliate_program/3`,
  `upsert_affiliate_link/3`, and
  `create_coupon/3`.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move operator authorization, entity-specific attributes, Global ID
  normalization, context save calls, denied payloads, changeset errors, and
  field-name projection into `Mutations`.
- [ ] Preserve every callback clause, accepted field, ID type, error
  code/message/field, and entity-specific payload key.
- [ ] Re-run both suites; expect exact mutation behavior.
- [ ] Commit with message `refactor: isolate graphql affiliate mutations`.

## Task 3: Full Affiliate Resolver Gate

**Files:**

- Modify: `docs/work/affiliate-resolver-decomposition.md`

- [ ] Run
  `mix test test/product_compare/affiliate
  test/product_compare_web/graphql/affiliate_workflows_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm schema files call only `AffiliateResolver` and focused owners are
  used only by the facade and their own namespace.
- [ ] Record final owner sizes, exact test counts, and gate evidence.
- [ ] Include the lane doc in the final affiliate-resolver milestone commit.
