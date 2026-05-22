# Commerce Revenue Summary GraphQL Implementation Plan (2026-05-22)

Execution status lives in `docs/work/affiliate-revenue-attribution.md` and `docs/work/index.md`.

## Goal

Expose the new commerce revenue summary read model through a backend GraphQL query so dashboard and public-safe reporting clients can request clicks, conversions, gross order value, commission revenue, and average paid price without reaching into context internals.

## Architecture

- Reuse `ProductCompare.CommerceAttribution.dashboard_revenue_summary/1` as the source of truth for aggregate calculations and suppression behavior.
- Keep the GraphQL surface read-only.
- Accept optional merchant/product filters as existing Relay global IDs and optional network/date/suppression filters as scalar inputs.
- Return the same JSON-safe contract shape already covered at the context layer: filters, metrics, and suppression metadata.
- Keep CJ/Awin source-field mapping out of this batch because it remains blocked on external docs or sample payloads.

## Task 1: Add `revenueSummary` GraphQL Query

### Files

- Modify: `lib/product_compare_web/schema.ex`
- Create or modify: `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`
- Test: `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
- Update: `docs/work/affiliate-revenue-attribution.md`
- Update: `docs/plans/NOW.md`

### Step 1: Write Failing Tests

Add focused GraphQL tests for:

- Empty summary shape with zero counts, zero money strings, null average paid price, and unsuppressed metadata.
- Aggregate summary over approved/paid conversions only, including merchant/product global ID filters and network filter.
- Low-volume suppression, proving metric keys remain present with null values when `minConversions` is not met.
- Invalid merchant/product global IDs return a GraphQL error instead of silently broadening the query.

Run:

```bash
mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs
```

Expected: fail because the query, types, and resolver do not exist.

### Step 2: Implement The Resolver

Add a commerce attribution resolver that:

- Normalizes `input.merchantId` and `input.productId` through `ProductCompareWeb.GraphQL.GlobalId`.
- Passes `network`, `from`, `to`, and `minConversions` through to `ProductCompare.CommerceAttribution.dashboard_revenue_summary/1`.
- Returns `{:ok, summary}` on valid input and `{:error, "invalid revenue summary filters"}` or a similarly explicit message on invalid IDs.

### Step 3: Add Schema Types

Add:

- `input_object :revenue_summary_input`
- `object :revenue_summary`
- `object :revenue_summary_filters`
- `object :revenue_summary_metrics`
- `object :revenue_summary_suppression`

Use camel-cased GraphQL fields that map onto the JSON-ready contract, including:

- `clicks`
- `conversions`
- `grossOrderValue`
- `commissionRevenue`
- `averagePaidPrice`
- `suppressed`
- `threshold`

### Step 4: Verify

Run:

```bash
mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs
mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs
mix typecheck
git diff --check
```

Expected: all pass.

### Step 5: Update Tracking

When verified, mark this task complete in `docs/work/affiliate-revenue-attribution.md` and advance `docs/plans/NOW.md` to the next unblocked batch or record that only blocked/deferred commerce attribution items remain.
