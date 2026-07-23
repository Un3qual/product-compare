# Pricing Resolver Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-pricing-resolver-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against pricing-query and merchant-detail
  characterization paths.

## Target Outcome

`PricingResolver` remains schema-facing while merchant, offer, and source
evidence reads live in focused owners with unchanged callbacks and query
behavior.

## Ready Evidence

- The 243-line resolver combines three concrete read responsibilities.
- Existing GraphQL suites characterize Dataloader keys, fallbacks, filters,
  pagination, offer truth, history, evidence, and query budgets.

## Internal Slices

1. Merchant collections, detail, summaries, and scoped offers.
2. Product and merchant-product offers, prices, truth, and history.
3. Source-artifact evidence resolution.
4. Stable resolver wrappers and schema-call parity.

## Boundaries

- Preserve every callback, clause, result, order, filter, pagination rule,
  loader key, fallback, budget, and invalid-ID error.
- Do not change Pricing or Specs contexts, schemas, migrations, GraphQL SDL,
  Relay, or frontend behavior.

## Verification

- `mix test test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/merchant_detail_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
