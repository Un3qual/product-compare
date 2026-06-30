# Compare Offer Decision Helpers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add decision-helper rows to `/compare` so users can evaluate selected products by current offer quality, not only specifications.

**Architecture:** Reuse the existing `merchantProducts(input:)` GraphQL contract with bounded active-offer queries per selected product. Keep the max compare size at three products and treat offer context as independently recoverable so unavailable offer data does not break the specification matrix.

**Tech Stack:** React Router, React, Relay, TypeScript, Vitest, Testing Library, Bun, existing GraphQL pricing contract.

**Status:** planned product-facing follow-up. Can run after matrix modes; does not require backend schema changes unless pricing query tests reveal a missing field.

---

## Ownership

Owned paths:

- Create `assets/src/routes/compare/queries/CompareOfferContextQuery.ts`
- Modify `assets/src/routes/compare/loader.ts`
- Modify `assets/src/routes/compare/product-list.tsx`
- Modify `assets/src/routes/compare/index.tsx`
- Modify `assets/test/routes/compare/compare.route.test.tsx`
- Modify `assets/schema.graphql` and generated artifacts through `bun run relay`
- Modify `docs/work/frontend-product-comparison-demo-parity.md`

Backend files are out of scope unless the existing `merchantProducts(input:)`
contract cannot supply latest price, active coupon count, price history
availability, merchant names, and active-offer state. If that happens, stop and
promote a separate backend pricing row.

## Query Shape

Create `CompareOfferContextQuery`:

```ts
query CompareOfferContextQuery($productId: ID!, $first: Int!) {
  merchantProducts(input: { productId: $productId, activeOnly: true, first: $first }) {
    edges {
      node {
        id
        currency
        merchant {
          id
          name
          domain
        }
        latestPrice {
          id
          price
          observedAt
        }
        activeCoupons(first: 2) {
          edges {
            node {
              code
              discountType
              discountValue
              currency
              validTo
            }
          }
          pageInfo {
            hasNextPage
          }
        }
        priceHistory(first: 3) {
          edges {
            node {
              id
              price
              observedAt
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}
```

Use `first: 3` for compare offer context so the query remains bounded across at
most three selected products.

## Decision Rows

Render a `Decision summary` section above the specification matrix with rows:

- Best current price: lowest latest price among active offers, with merchant name.
- Active offer count: number of loaded active offers plus `More available` when pagination says more exists.
- Coupon signal: `Coupons available`, `No coupons loaded`, or `More coupons available`.
- Price recency: most recent `observedAt` across loaded offers.
- Review offers link: `/offers?productId=<product id>` for each product.

When offer context fails for one product, render `Offer context unavailable` for
that product and continue rendering specs for every selected product.

## Tasks

- [ ] Add failing tests for successful decision rows, cheapest price selection, coupon availability, more-offers signal, price recency, and per-product offer-link destinations.
- [ ] Add failing tests for one rejected offer-context query while product specs still render.
- [ ] Create `CompareOfferContextQuery.ts` and run Relay generation.
- [ ] Update `compareLoader` to fetch offer context after product IDs are known. Use `Promise.allSettled` and do not throw the whole route when an offer-context query fails.
- [ ] Add a typed `CompareOfferContextSummary` loader field keyed by product ID.
- [ ] Render `DecisionSummary` above `CompareSpecificationMatrix`.
- [ ] Keep save, add, remove, and spec-mode behavior unchanged.
- [ ] Update lane evidence in `docs/work/frontend-product-comparison-demo-parity.md`.

## Verification

Run these commands:

```bash
cd assets && bun run relay
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/products/detail.route.test.tsx
cd assets && bun run typecheck
mix test test/product_compare_web/graphql/pricing_queries_test.exs
git diff --check
```

Expected result: all commands exit 0. Compare route tests must cover both
available and unavailable offer context.

## Exit Condition

This row is complete when `/compare` gives users a bounded, resilient decision
summary for current price and offer quality alongside the specification matrix.
