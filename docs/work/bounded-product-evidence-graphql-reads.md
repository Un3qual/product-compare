# Bounded Product Evidence GraphQL Reads

## Snapshot

- Status: complete
- Delivered on: `codex/bounded-product-evidence-reads`
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

## Initial Gap Evidence

Before this batch:

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

## Completion Evidence

Verified fresh on 2026-07-20 after the set-based evidence APIs and
request-scoped GraphQL Dataloader sources landed in:

- `2a15854b perf: batch product evidence reads`
- `d3bbd63d perf: batch product seo metadata`
- `34087286 perf: bound product evidence graphql reads`

### Query-budget regression

The pre-batching RED baseline grew with product parents. Counts are ordered as
`product_media`, `product_attribute_current`, `product_reviews`,
`merchant_products`, and `price_points`:

| Product parents | RED baseline | GREEN fixed budget |
| --- | --- | --- |
| 3 | `{3, 3, 6, 6, 4}` | `{1, 1, 2, 2, 2}` |
| 6 | `{6, 6, 12, 12, 8}` | `{1, 1, 2, 2, 2}` |

The current growing-parent GraphQL regression executes the same product
connection at three and six parents, asserts the fixed GREEN table counts at
both sizes, and checks that the six-parent budget equals the three-parent
budget.

### Semantic coverage

The same regression verifies reviewed, unreviewed, and missing-evidence product
groups at both parent counts. It preserves current offer truth (including a
shared `asOf` value), accepted-current specification claim values and source
artifacts, published-only review summaries with two-decimal averages, and the
SEO title, description, canonical path, indexability, image, and structured
data contract. The focused Pricing, Discussions, and SEO suites retain the
underlying eligibility, freshness, review-publication, and acquisition
qualification behavior.

### Fresh gate results

- `mix test test/product_compare/pricing/pricing_test.exs test/product_compare/discussions/community_trust_test.exs test/product_compare/seo_test.exs` — 36 tests, 0 failures (seed `25916`).
- `mix test test/product_compare_web/graphql/dataloader_batching_test.exs test/product_compare_web/graphql/seo_surfaces_test.exs` — 4 tests, 0 failures (seed `992357`).
- `mix typecheck` — passed.
- `mix format --check-formatted` — passed.
- `mix work_queue.validate` — passed: `work queue valid: 4 ready rows`. The initial sandbox run was blocked only by `Mix.PubSub` TCP `:eperm`; the same command passed when rerun with the required local-socket permission.
- `git diff --check` — passed after this evidence update, before the documentation-only commit.
- Final `mix ci` closeout — passed with queue validation at 4 ready rows,
  Credo clean, clone budget 6/6, no new cross-function smells, Dialyzer clean,
  801 backend tests and 83.49% coverage, Relay validation, TypeScript, 1,507
  frontend tests, client and SSR builds, and the 182,164-byte gzip client
  bundle under its 200,000-byte budget.
