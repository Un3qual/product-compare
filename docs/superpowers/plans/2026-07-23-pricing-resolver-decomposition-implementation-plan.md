# Pricing Resolver Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompareWeb.Resolvers.PricingResolver` schema-facing
while moving merchant, offer, and evidence reads into focused resolver owners.

**Architecture:** `Resolvers.Pricing.Merchants` owns merchant collections,
detail, summaries, and merchant-scoped offers. `Resolvers.Pricing.Offers` owns
product/merchant-product offer reads and price facts. `Evidence` owns source
artifact resolution. The existing resolver retains explicit wrappers.

**Tech Stack:** Elixir, Absinthe, Dataloader, Ecto, ExUnit.

## Global Constraints

- Preserve every callback, clause, result, order, filter, pagination rule,
  Dataloader key, direct-query fallback, query budget, and invalid-ID error.
- Keep schema files dependent only on `PricingResolver`.
- Preserve merchant detail completeness, offer truth, latest price, history,
  and source-artifact behavior.
- Do not change Pricing/Specs contexts, schemas, migrations, GraphQL SDL,
  Relay, or frontend behavior.

---

## Task 1: Merchant Resolver Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/pricing/merchants.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Test: `test/product_compare_web/graphql/pricing_queries_test.exs`
- Test: `test/product_compare_web/graphql/merchant_detail_test.exs`

**Interfaces:**

- Produces:
  `Merchants.merchants/3`,
  `merchant/3`,
  `merchant_detail_summary/3`, and
  `merchant_offers/3`.

- [ ] Run both named suites as the green baseline.
- [ ] Add facade delegation and verify the expected missing-owner compilation
  failure.
- [ ] Move merchant collection/root read, slug detail read, detail-summary
  load, merchant-offer connection load, direct fallbacks, and connection
  arguments into `Merchants`.
- [ ] Preserve Dataloader batching, database-complete summaries, bounded
  connections, sort/filter semantics, and nil behavior.
- [ ] Re-run both suites; expect exact merchant GraphQL behavior.
- [ ] Commit with message `refactor: isolate graphql merchant reads`.

## Task 2: Offer Resolver Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/pricing/offers.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Test: `test/product_compare_web/graphql/pricing_queries_test.exs`
- Test: `test/product_compare_web/graphql/merchant_detail_test.exs`

**Interfaces:**

- Produces:
  `Offers.merchant_products/3`,
  `product_merchant_products/3`,
  `latest_price/3`,
  `product_offer_truth/3`, and
  `price_history/3`.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move input normalization, merchant-product root/parent connections,
  latest-price load, product offer-truth load, price-history load, and direct
  fallbacks into `Offers`.
- [ ] Preserve Global ID errors, connection filters/order, bounded history,
  Dataloader keys, query budgets, nil prices, and offer-truth results.
- [ ] Re-run both suites; expect exact offer GraphQL behavior.
- [ ] Commit with message `refactor: isolate graphql offer reads`.

## Task 3: Price Evidence Resolver Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/pricing/evidence.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Test: `test/product_compare_web/graphql/pricing_queries_test.exs`

**Interfaces:**

- Produces:
  `Evidence.source_artifact/3`.

- [ ] Run the pricing GraphQL suite before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move nil-artifact handling and batched Specs source-artifact loading into
  `Evidence`.
- [ ] Preserve nil fallback and exact loader result.
- [ ] Re-run the suite; expect all tests to pass.
- [ ] Commit with message `refactor: isolate graphql price evidence`.

## Task 4: Full Pricing Resolver Gate

**Files:**

- Modify: `docs/work/pricing-resolver-decomposition.md`

- [ ] Run
  `mix test test/product_compare/pricing
  test/product_compare_web/graphql/pricing_queries_test.exs
  test/product_compare_web/graphql/merchant_detail_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm schema files call only `PricingResolver` and focused owners are
  used only by the facade and their own namespace.
- [ ] Record final owner sizes, exact test counts, query-budget results, and
  gate evidence.
- [ ] Include the lane doc in the final pricing-resolver milestone commit.
