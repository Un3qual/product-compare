# Frontend Revenue Reporting Demo Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing public-safe commerce revenue summary GraphQL contract demoable from the browser UI.

**Architecture:** Add a Relay-backed `/commerce/revenue` route that preloads the read-only `revenueSummary` query through the existing React Router loader context. Keep the first UI slice aggregate-only with network, currency, and date filters; merchant/product scoped reporting can follow once a route-level picker exists. Preserve the backend suppression contract by rendering suppressed metrics explicitly instead of attempting to infer hidden values on the client.

**Tech Stack:** Phoenix Absinthe GraphQL, React Router loaders, React Relay, Bun, Vitest, Testing Library, StyleX primitives.

---

## Existing Contract

- Backend query: `revenueSummary(input: RevenueSummaryInput)`.
- Returned shape: `filters`, `metrics`, and `suppression`.
- Public safety rule: the server enforces a minimum conversion threshold of `2`; clients cannot lower it.
- Existing frontend patterns to follow:
  - Relay route preloading from `assets/src/relay/route-preload.ts`.
  - Route loader recovery from `assets/src/routes/loader-errors.ts`.
  - Root navigation tests in `assets/src/routes/__tests__/root.route.test.tsx`.
  - Product/detail route tests for Relay preloaded route rendering.

## File Structure

- Modify `assets/schema.graphql` so the local Relay snapshot includes `revenueSummary`, `RevenueSummaryInput`, and the returned filter, metric, and suppression types.
- Create `assets/src/routes/commerce/revenue/queries/RevenueSummaryRouteQuery.ts` for the route query.
- Create `assets/src/routes/commerce/revenue/loader.ts` for route search-param normalization and Relay preloading.
- Create `assets/src/routes/commerce/revenue/index.tsx` for the route UI.
- Create `assets/src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts` for loader tests.
- Create `assets/src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx` for route render tests.
- Modify `assets/src/router.tsx` to register `/commerce/revenue`.
- Modify `assets/src/routes/root.tsx` and `assets/src/routes/__tests__/root.route.test.tsx` to expose the route from primary navigation and home actions.
- Generated Relay artifacts under `assets/src/__generated__/**` are produced by `bun run relay`.
- Update `docs/work/frontend-revenue-reporting-demo-parity.md`, `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` at the relevant milestone boundaries.

---

### Task 1: Add The Relay Route Query And Loader

**Files:**
- Modify: `assets/schema.graphql`
- Create: `assets/src/routes/commerce/revenue/queries/RevenueSummaryRouteQuery.ts`
- Create: `assets/src/routes/commerce/revenue/loader.ts`
- Create: `assets/src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts`
- Modify after verification: `docs/work/frontend-revenue-reporting-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [ ] **Step 1: Write failing loader tests**

Create `assets/src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts` with coverage for:

```ts
test("revenueSummaryLoader preloads the default aggregate summary query");
test("revenueSummaryLoader normalizes supported network currency and date filters");
test("revenueSummaryLoader drops invalid scalar filters instead of broadening them");
test("revenueSummaryLoader returns error state when route preloading fails");
```

The normalized-filter assertion should cover this URL:

```ts
new Request("https://app.example.test/commerce/revenue?network=Impact&currency=usd&from=2026-05-01&to=2026-05-31");
```

Expected variables:

```ts
{
  input: {
    currency: "USD",
    from: "2026-05-01",
    network: "impact",
    to: "2026-05-31"
  }
}
```

- [ ] **Step 2: Run the loader tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts
```

Expected: FAIL because the route query and loader do not exist.

- [ ] **Step 3: Refresh the local schema snapshot**

Update `assets/schema.graphql` from the existing backend contract so it includes:

```graphql
type Query {
  revenueSummary(input: RevenueSummaryInput): RevenueSummary
}

input RevenueSummaryInput {
  merchantId: ID
  productId: ID
  network: String
  currency: String
  from: String
  to: String
}

type RevenueSummary {
  filters: RevenueSummaryFilters!
  metrics: RevenueSummaryMetrics!
  suppression: RevenueSummarySuppression!
}

type RevenueSummaryFilters {
  merchantId: ID
  productId: ID
  network: String
  currency: String
  from: String
  to: String
}

type RevenueSummaryMetrics {
  clicks: Int
  conversions: Int
  grossOrderValue: String
  commissionRevenue: String
  averagePaidPrice: String
  currency: String
}

type RevenueSummarySuppression {
  suppressed: Boolean!
  threshold: Int!
}
```

- [ ] **Step 4: Add the route query**

Create `assets/src/routes/commerce/revenue/queries/RevenueSummaryRouteQuery.ts`:

```ts
import { graphql } from "react-relay";

export default graphql`
  query RevenueSummaryRouteQuery($input: RevenueSummaryInput) {
    revenueSummary(input: $input) {
      filters {
        currency
        from
        merchantId
        network
        productId
        to
      }
      metrics {
        averagePaidPrice
        clicks
        commissionRevenue
        conversions
        currency
        grossOrderValue
      }
      suppression {
        suppressed
        threshold
      }
    }
  }
`;
```

- [ ] **Step 5: Add the loader**

Create `assets/src/routes/commerce/revenue/loader.ts` with:

```ts
import type { LoaderFunctionArgs } from "react-router-dom";
import revenueSummaryRouteQuery, {
  type RevenueSummaryRouteQuery
} from "../../../__generated__/RevenueSummaryRouteQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../../relay/route-preload";
import { recoverRouteLoaderError } from "../../loader-errors";

const DATE_FILTER_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NETWORK_FILTER_PATTERN = /^[a-z0-9_-]+$/;

export interface RevenueSummaryFilters {
  currency?: string;
  from?: string;
  network?: string;
  to?: string;
}

export type RevenueSummaryLoaderData =
  | {
      status: "ready";
      filters: RevenueSummaryFilters;
      query: RelayRouteQueryDescriptor<RevenueSummaryRouteQuery["variables"]>;
    }
  | {
      status: "error";
      filters: RevenueSummaryFilters;
    };

export async function revenueSummaryLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<RevenueSummaryLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const filters = revenueSummaryFiltersFromUrl(new URL(request.url));

  try {
    return {
      status: "ready",
      filters,
      query: await preloadRouteQuery<RevenueSummaryRouteQuery>(
        environment,
        revenueSummaryRouteQuery,
        {
          input: Object.keys(filters).length > 0 ? filters : null
        },
        { signal: request.signal }
      )
    };
  } catch (error) {
    return recoverRouteLoaderError<RevenueSummaryLoaderData>(
      error,
      "Failed to preload revenue summary route query.",
      {
        status: "error",
        filters
      }
    );
  }
}

export function revenueSummaryFiltersFromUrl(url: URL): RevenueSummaryFilters {
  const filters = {
    currency: normalizeCurrencyFilter(url.searchParams.get("currency")),
    from: normalizeDateFilter(url.searchParams.get("from")),
    network: normalizeNetworkFilter(url.searchParams.get("network")),
    to: normalizeDateFilter(url.searchParams.get("to"))
  };

  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined)
  ) as RevenueSummaryFilters;
}

function normalizeCurrencyFilter(value: string | null) {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^[A-Z]{3}$/.test(normalized) ? normalized : undefined;
}

function normalizeDateFilter(value: string | null) {
  const normalized = value?.trim();
  return normalized && DATE_FILTER_PATTERN.test(normalized) ? normalized : undefined;
}

function normalizeNetworkFilter(value: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized && NETWORK_FILTER_PATTERN.test(normalized) ? normalized : undefined;
}
```

- [ ] **Step 6: Generate Relay artifacts**

Run:

```bash
cd assets && bun run relay
```

Expected: PASS and create `assets/src/__generated__/RevenueSummaryRouteQuery.graphql.ts`.

- [ ] **Step 7: Run the loader tests to verify they pass**

Run:

```bash
cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts
```

Expected: PASS.

- [ ] **Step 8: Run frontend typecheck**

Run:

```bash
cd assets && bun run typecheck
```

Expected: PASS.

- [ ] **Step 9: Update queue docs**

Update `docs/work/frontend-revenue-reporting-demo-parity.md` and `docs/plans/NOW.md`:

- Mark Task 1 complete.
- Record the exact verification commands.
- Advance the current batch to Task 2.

---

### Task 2: Render The Revenue Reporting Route

**Files:**
- Create: `assets/src/routes/commerce/revenue/index.tsx`
- Create: `assets/src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx`
- Modify after verification: `docs/work/frontend-revenue-reporting-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [ ] **Step 1: Write failing route render tests**

Create route tests covering:

```ts
test("revenue route renders suppressed metrics with threshold copy");
test("revenue route renders unsuppressed revenue metrics");
test("revenue route renders active filters from the loader");
test("revenue route renders the loader error state");
```

The unsuppressed fixture should include:

```ts
{
  revenueSummary: {
    filters: {
      currency: "USD",
      from: "2026-05-01",
      merchantId: null,
      network: "impact",
      productId: null,
      to: "2026-05-31"
    },
    metrics: {
      averagePaidPrice: "80.00",
      clicks: 2,
      commissionRevenue: "20.00",
      conversions: 2,
      currency: "USD",
      grossOrderValue: "200.00"
    },
    suppression: {
      suppressed: false,
      threshold: 2
    }
  }
}
```

- [ ] **Step 2: Run the route tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx
```

Expected: FAIL because the route component does not exist.

- [ ] **Step 3: Add the route component**

Create `assets/src/routes/commerce/revenue/index.tsx` with:

- `RevenueSummaryRoute` reading `revenueSummaryLoader` data through `useLoaderData`.
- A heading `Revenue reporting`.
- A GET filter form with `network`, `currency`, `from`, and `to` fields.
- A summary fallback for loader errors.
- A Suspense + `ResettableErrorBoundary` path that renders the Relay-preloaded summary when `status === "ready"`.
- Suppression copy when `suppression.suppressed` is true.
- Metric cards or a definition list for `clicks`, `conversions`, `grossOrderValue`, `commissionRevenue`, and `averagePaidPrice` when unsuppressed.

- [ ] **Step 4: Run route tests**

Run:

```bash
cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run frontend typecheck**

Run:

```bash
cd assets && bun run typecheck
```

Expected: PASS.

- [ ] **Step 6: Update queue docs**

Update `docs/work/frontend-revenue-reporting-demo-parity.md` and `docs/plans/NOW.md`:

- Mark Task 2 complete.
- Record exact verification commands.
- Advance the current batch to Task 3.

---

### Task 3: Wire Navigation And Close The Lane

**Files:**
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/root.tsx`
- Modify: `assets/src/routes/__tests__/root.route.test.tsx`
- Modify: `docs/work/frontend-revenue-reporting-demo-parity.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`
- Modify: `docs/plans/2026-06-01-frontend-revenue-reporting-demo-parity-implementation-plan.md`

- [ ] **Step 1: Write failing route registration and navigation tests**

Update tests to assert:

```ts
expect(screen.getByRole("link", { name: "Revenue" })).toHaveAttribute(
  "href",
  "/commerce/revenue"
);
```

Assert the link exists in both primary navigation and home actions. Add a router test that the route list includes `commerce/revenue` with `revenueSummaryLoader`.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx
```

Expected: FAIL because the navigation link and route registration are not present.

- [ ] **Step 3: Register the route and navigation**

Modify `assets/src/router.tsx`:

```ts
import { RevenueSummaryRoute } from "./routes/commerce/revenue";
import { revenueSummaryLoader } from "./routes/commerce/revenue/loader";
```

Add a child route:

```tsx
{
  path: "commerce/revenue",
  loader: revenueSummaryLoader,
  element: <RevenueSummaryRoute />
}
```

Update `RootLayout` and `RootRoute` in `assets/src/routes/root.tsx` to add `Revenue` links to `/commerce/revenue`.

- [ ] **Step 4: Run focused frontend verification**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx src/routes/__tests__/root.route.test.tsx
cd assets && bun run typecheck
```

Expected: all commands pass.

- [ ] **Step 5: Run backend contract verification**

Run:

```bash
mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs
```

Expected: PASS.

- [ ] **Step 6: Close queue docs**

Update queue and architecture docs to mark the revenue reporting demo parity lane completed:

- `docs/work/frontend-revenue-reporting-demo-parity.md`
- `docs/work/index.md`
- `docs/plans/NOW.md`
- `docs/plans/INDEX.md`
- `ARCHITECTURE.md`
- this implementation plan

- [ ] **Step 7: Final verification**

Run:

```bash
cd assets && bun run check
mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs
git diff --check
```

Expected: all commands pass.
