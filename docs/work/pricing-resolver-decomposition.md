# Pricing Resolver Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-pricing-resolver-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 with 82 focused tests and the full repository gate.

## Target Outcome

`PricingResolver` remains schema-facing while merchant, offer, and source
evidence reads live in focused owners with unchanged callbacks and query
behavior.

## Completion Evidence

- `PricingResolver` is a 50-line schema-facing facade.
- `Resolvers.Pricing.Merchants`, `Offers`, and `Evidence` own merchant reads,
  offer/price reads, and source-artifact resolution in 93, 162, and 23 lines.
- Schema files still reference only `PricingResolver`; focused owners are used
  only by the facade and their own namespace.
- The exact context, GraphQL, and Dataloader gate passed 82 tests with
  0 failures, including the existing query-budget assertions.
- Full `mix ci` passed 913 backend tests at 83.64% coverage, 1,507 frontend
  tests, and every queue, format, compile, Credo, six-clone ExDNA, Reach,
  Dialyzer, Relay, type, build, and bundle gate.

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

- `mix test test/product_compare/pricing test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/merchant_detail_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
