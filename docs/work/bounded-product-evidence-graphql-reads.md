# Bounded Product Evidence GraphQL Reads

## Snapshot

- Status: active
- Owner: `codex/bounded-product-evidence-reads`
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-20-bounded-product-evidence-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-20 against current Product GraphQL resolvers, SEO
  qualification, Pricing offer truth, published review summaries, accepted
  specification reads, and Dataloader coverage.

## Batch Outcome

Product evidence and SEO fields requested through a GraphQL product connection
keep a fixed database-query budget as product parent count increases, without
changing offer, review, specification, or metadata truth.

## Ready Evidence

- `PricingResolver.product_offer_truth/3` calls
  `Pricing.current_offer_truth/2` once per product parent.
- `DiscussionsResolver.review_summary/3` calls
  `Discussions.review_summary/1` once per product parent.
- `SeoResolver.product_metadata/3` calls `Seo.product_metadata/1`, which
  independently preloads brand/media and reads current specifications, offer
  truth, and review summary for each product.
- Current query-budget coverage proves association/latest-price batching but
  does not request these product evidence fields across growing parents.

## Internal Slices

1. Set-based offer-truth, review-summary, and current-specification evidence.
2. Request-scoped product evidence and SEO Dataloader integration.
3. Semantic parity and growing-parent query-budget regression coverage.

## Boundaries

- Preserve OfferTruth eligibility/freshness and current-specification selection.
- Preserve published-only review summaries and two-decimal averages.
- Preserve SEO qualification, metadata shape, structured data, and safe
  serialization.
- Do not change the public GraphQL schema.

## Verification

- Context parity tests for one, empty, and multiple product IDs.
- GraphQL query-budget tests before and after growing product parents.
- SEO acquisition behavior tests.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
