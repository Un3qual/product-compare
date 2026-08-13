# Revenue and CJ Operator Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved compact revenue and CJ operator dashboards, including below-row attribution details, without losing information or weakening the routes' independent data and failure boundaries.

**Architecture:** Keep the existing summary, attribution-ledger, CJ-program, and unmatched-feed Relay operations concurrent and independently recoverable. Compose their results as named CSS-grid areas so summary modules can sit beside deferred status modules without merging query ownership; derive dashboard projections during render and keep only row expansion or edit state in React state. Revenue uses a seven-column closed ledger plus a full-width evidence row, while CJ uses aggregate and page-scoped status bands above dense program and unmatched-feed tables.

**Tech Stack:** React 19, React Router 7, Relay 21, TanStack Table 9, Base UI primitives, StyleX, Vitest, Testing Library, Playwright, axe

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-13-revenue-cj-operator-dashboard-design.md`; it supersedes the earlier always-visible revenue-detail and persistent-CJ-context-rail decisions.
- Preserve every existing revenue click, customer, touchpoint, request, commerce, conversion, CJ lifecycle, warning, edit, feedback, and feed fact or action.
- Keep the existing GraphQL contracts, route authorization, server ordering, URL filters, mutation payloads, pagination cursors, and generated Relay ownership.
- Keep revenue summary and attribution activity independent; keep CJ programs and unmatched feeds independent. One failed or pending query must not blank a successful sibling.
- Keep the existing Product Compare light visual language. Use shallow surfaces, quiet dividers, compact readable typography, and the existing blue action accent.
- Do not add a progress metaphor to aggregate CJ counts, claim that loaded-page counts are global, or call the recent loaded conversion globally latest.
- Do not aggregate multiple conversion amounts in the browser or parse exact Decimal money strings into JavaScript numbers.
- Keep native table semantics, visible text for every status, keyboard operation, focus visibility, reduced-motion behavior, and contained horizontal scrolling.
- Do not add row-height caps, pixel-height assertions, new runtime dependencies, generic card grids, route-wide drawers, or document-level horizontal overflow.
- Write behavior tests before production edits and confirm the intended RED failure for each milestone.

---

## File Responsibility Map

- `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx` composes revenue controls, summary-owned dashboard modules, deferred attribution-owned dashboard content, and independent fallbacks.
- `assets/src/routes/commerce/revenue/summary/RevenueControls.tsx` owns the shallow filter command band and its responsive wrapping.
- `assets/src/routes/commerce/revenue/summary/RevenueMetrics.tsx` owns the attribution-performance and revenue-outcome modules.
- `assets/src/routes/commerce/revenue/summary/revenue-summary-data.ts` derives formatted summary metrics and conversion rate without reparsing money.
- `assets/src/routes/commerce/revenue/attribution/attribution-ledger-data.ts` owns pure recent-conversion selection and zero/one/multiple closed-row outcome projection.
- `assets/src/routes/commerce/revenue/attribution/RecentConversion.tsx` owns the page-scoped recent conversion module.
- `assets/src/routes/commerce/revenue/attribution/AttributionLedger.tsx` owns connection pagination, seven closed-row columns, independent row expansion state, and the dense ledger section.
- `assets/src/routes/commerce/revenue/attribution/AttributionClickDetails.tsx` owns the full-width Touchpoint, Request evidence, Commerce, and Conversion detail row.
- `assets/src/routes/commerce/revenue/attribution/ConversionDetails.tsx` owns one complete matched-conversion evidence group and shared status/confidence copy.
- `assets/src/routes/ingestion/cj-programs/CJProgramsRoute.tsx` composes inline controls and the lifecycle, attention, feed-health, program-ledger, and unmatched-ledger grid areas without a context rail.
- `assets/src/routes/ingestion/cj-programs/programs/program-dashboard-data.ts` owns global stage-total projection and truthful loaded-page attention selection.
- `assets/src/routes/ingestion/cj-programs/programs/lifecycle-policy.ts` remains the single owner of lifecycle labels, warnings, required actions, and actionable-state rules.
- `assets/src/routes/ingestion/cj-programs/programs/ProgramLifecycleTable.tsx` owns the aggregate strip, loaded-page attention module, program-section heading, table model, and pagination.
- `assets/src/routes/ingestion/cj-programs/programs/ProgramLifecycleRow.tsx` retains the compact summary row and full-width row-local editor.
- `assets/src/routes/ingestion/cj-programs/feeds/UnmatchedFeeds.tsx` owns the loaded-page feed-health module, native unmatched-feed table, and independent pagination.
- `assets/src/routes/ingestion/cj-programs/feeds/UnmatchedFeedRow.tsx` owns one heading-free unmatched-feed table row and its generated Relay fragment.
- `assets/src/routes/ingestion/cj-programs/feeds/FeedFactsRow.tsx` remains the compact list-row owner used only inside a program's lazy feed inspector.
- `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts` proves summary and attribution projection edge cases.
- `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx` proves dashboard hierarchy, inline details, non-loss, pagination, and failure isolation.
- `assets/test/routes/ingestion/cj-programs/cj-program-data.test.ts` proves total, attention, lifecycle, and pagination projection semantics.
- `assets/test/routes/ingestion/cj-programs/cj-programs.route.test.tsx` proves CJ dashboard hierarchy, page-scoped copy, program editing, feed-table non-loss, and failure isolation.
- `assets/tests/e2e/production-ui-operations.spec.ts` proves the approved interactions, responsive containment, accessibility, and inspected captures at three widths.
- `assets/tests/e2e/production-ui-compare-return.spec.ts` remains the regression gate for other intentionally wide tables.
- `docs/work/operator-workspaces.md` records the new ownership and fresh completion evidence.

---

### Task 1: Build the revenue summary dashboard and shallow command band

**Files:**
- Modify: `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Modify: `assets/src/routes/commerce/revenue/summary/revenue-summary-data.ts`
- Modify: `assets/src/routes/commerce/revenue/summary/RevenueMetrics.tsx`
- Modify: `assets/src/routes/commerce/revenue/summary/RevenueControls.tsx`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`

**Interfaces:**
- Consumes: the existing `RevenueSummaryRouteQuery` response and `RevenueSummaryFilters` URL contract.
- Produces: `buildRevenueDashboardMetrics(summary, currency)` returning `{ attribution: { clicks, conversions, conversionRate }, revenue: [...] }` with formatted strings.
- Produces: accessible modules named `Attribution performance` and `Revenue outcome`; a compact `Revenue controls` region suitable for the `PageShell` action area.
- Preserves: `RevenueSummaryUnavailableFallback`, currency/date validation fallbacks, hydration-safe presets, and summary/ledger query concurrency.

- [ ] **Step 1: Write failing projection tests for the dashboard metrics**

  Replace the flat `buildRevenueSummaryMetrics` expectations with the approved grouped shape and cover conversion-rate edge cases:

  ```ts
  expect(
    buildRevenueDashboardMetrics(
      {
        metrics: {
          averagePaidPrice: "180.00",
          clicks: 8,
          commissionRevenue: "18.00",
          conversions: 1,
          grossOrderValue: "180.00",
        },
      },
      "USD",
    ),
  ).toEqual({
    attribution: {
      clicks: "8",
      conversions: "1",
      conversionRate: "12.5%",
    },
    revenue: [
      { label: "Gross order value", value: "180.00 USD" },
      { label: "Commission revenue", value: "18.00 USD" },
      { label: "Average paid price", value: "180.00 USD" },
    ],
  });

  expect(
    buildRevenueDashboardMetrics(
      {
        metrics: {
          averagePaidPrice: null,
          clicks: 0,
          commissionRevenue: null,
          conversions: 0,
          grossOrderValue: null,
        },
      },
      "USD",
    ).attribution.conversionRate,
  ).toBe("Not available");
  ```

  Add cases for nullable clicks, nullable conversions, a whole-number percentage such as `50%`, and one-decimal rounding such as `33.3%`. Retain the current empty-string Decimal test unchanged so formatting does not silently reinterpret server values.

- [ ] **Step 2: Write failing route hierarchy and control-band tests**

  Update the presentation tests to require the two named modules and the removal of the generic summary strip/context-rail shell:

  ```tsx
  expect(screen.getByRole("region", { name: "Attribution performance" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Revenue outcome" })).toBeVisible();
  expect(screen.getByText("12.5%")).toBeVisible();
  expect(screen.queryByRole("region", { name: "Summary" })).not.toBeInTheDocument();
  expect(screen.queryByRole("complementary", { name: "Revenue controls" })).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Revenue controls" })).toBeVisible();
  ```

  Preserve assertions for every filter value, preset URL, apply action, clear action, active-filter truth, preview copy, invalid range, missing currency, and loader error state.

- [ ] **Step 3: Run the focused revenue tests and verify RED**

  ```bash
  cd assets
  pnpm run test:unit -- test/routes/commerce/revenue/revenue-summary-view-data.test.ts test/routes/commerce/revenue/revenue-summary.route.test.tsx
  ```

  Expected: FAIL because the current projection is a flat five-item array, the UI renders one generic `SummaryStrip`, and controls are nested in `ContextRail`.

- [ ] **Step 4: Implement the grouped summary projection**

  Rename `buildRevenueSummaryMetrics` to `buildRevenueDashboardMetrics`. Derive rate directly from the generated numeric counts during render:

  ```ts
  function formatConversionRate(clicks: number | null, conversions: number | null) {
    if (clicks === null || conversions === null || clicks === 0) {
      return "Not available";
    }

    const percentage = Math.round((conversions / clicks) * 1_000) / 10;
    return `${percentage.toFixed(1).replace(/\.0$/, "")}%`;
  }
  ```

  Keep `formatCurrencyAmount` string-preserving and retain the existing null and empty-string behavior. Do not store derived rate in component state or calculate it in an effect.

- [ ] **Step 5: Recompose `RevenueMetrics` as two restrained modules**

  Replace `SummaryStrip` with two sections inside one summary-owned grid item:

  ```tsx
  <div {...props(styles.summaryModules)}>
    <section aria-labelledby={performanceId} {...props(styles.module)}>
      <h2 id={performanceId}>Attribution performance</h2>
      <dl {...props(styles.metricRow)}>
        <Metric label="Clicks" value={metrics.attribution.clicks} />
        <Metric label="Conversions" value={metrics.attribution.conversions} />
        <Metric label="Conversion rate" value={metrics.attribution.conversionRate} />
      </dl>
    </section>
    <section aria-labelledby={outcomeId} {...props(styles.module)}>
      <h2 id={outcomeId}>Revenue outcome</h2>
      <dl {...props(styles.metricRow)}>
        {metrics.revenue.map((metric) => (
          <Metric key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </dl>
    </section>
  </div>
  ```

  Define file-local `Metric({ label, value })` to return one `<div>` containing
  `<dt>{label}</dt>` and `<dd>{value}</dd>`; it is presentation-only and does
  not introduce another data model.

  Use one visual surface per meaningful module, small section headings, aligned values, and no decorative progress bar or oversized icon tile. Give the wrapper the `summary` dashboard grid area and allow the inner pair to wrap to one column.

- [ ] **Step 6: Flatten and tighten `RevenueControls`**

  Remove its `ContextRail`. Keep the native GET form, four labeled inputs, preset links, apply, clear, and active-filter text in one shallow responsive region. Use intrinsic control widths and a wrapping action row; active filters are one quiet inline list rather than a second chip strip. Preserve form reset keys and hydration-safe date presets.

  Pass the controls through `PageShell.actions` so the heading and command band share the top composition. Keep the report body as a named CSS grid whose areas can later receive `summary`, `recent`, and `ledger` siblings:

  ```tsx
  <PageShell
    actions={
      <RevenueControls
        activeFilters={activeFilters}
        datePresetLinks={datePresetLinks}
        filters={loaderData.filters}
      />
    }
    description="This preview summarizes recorded attribution data. A live conversion provider is not connected for this milestone."
    eyebrow="Commerce analytics"
    title="Revenue reporting preview"
  >
    <section aria-label="Revenue report" {...props(styles.dashboard)}>
      {loaderData.status === "ready" ? (
        <RevenueSummaryBoundary query={loaderData.query} />
      ) : (
        <RevenueSummaryStatusFallback status={loaderData.status} />
      )}
      {loaderData.status === "ready" || loaderData.status === "error" ? (
        <DeferredAttributionLedgerBoundary query={loaderData.ledgerQuery} />
      ) : null}
    </section>
  </PageShell>
  ```

  `RevenueSummaryBoundary` and `RevenueSummaryStatusFallback` are descriptive
  names for extracting the route's existing error-boundary/Suspense branch and
  existing currency/date/error fallbacks; they receive no new state and do not
  change the fallback copy.

- [ ] **Step 7: Run GREEN and commit the revenue dashboard foundation**

  ```bash
  cd assets
  pnpm run relay:check
  pnpm run test:unit -- test/routes/commerce/revenue/revenue-summary-view-data.test.ts test/routes/commerce/revenue/revenue-summary.route.test.tsx test/routes/commerce/revenue/revenue-summary-loader.test.ts
  git add src/routes/commerce/revenue test/routes/commerce/revenue
  git commit -m "feat: compose revenue reporting dashboard"
  ```

  Expected: all focused revenue tests pass while the deferred attribution boundary is still independently recoverable.

---

### Task 2: Replace bloated revenue rows with compact summaries and below-row evidence

**Files:**
- Create: `assets/src/routes/commerce/revenue/attribution/attribution-ledger-data.ts`
- Create: `assets/src/routes/commerce/revenue/attribution/RecentConversion.tsx`
- Create: `assets/src/routes/commerce/revenue/attribution/AttributionClickDetails.tsx`
- Modify: `assets/src/routes/commerce/revenue/attribution/AttributionLedger.tsx`
- Modify: `assets/src/routes/commerce/revenue/attribution/ConversionDetails.tsx`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Modify generated output after Relay compilation: `assets/src/__generated__/**`

**Interfaces:**
- Consumes: the unchanged `AttributionLedger_row` and `ConversionDetails_conversion` fragments and the existing pagination connection.
- Produces: `selectRecentLoadedConversion(clicks)` returning the greatest-`reportedAt` loaded conversion or `null`, with loaded order as the stable tie-breaker.
- Produces: `buildAttributionOutcome(conversions)` returning `{ kind: "none" }`, `{ kind: "single", conversion }`, or `{ kind: "multiple", count }` without money aggregation.
- Produces: a `Recent conversion` region labeled `Latest in loaded activity` and an `Attribution details for <identity> at <time>` region in a `colSpan={7}` row.
- Preserves: all click/conversion fallbacks, duplicate-reference support, row-local expansion independence, pagination retry, and summary/ledger failure isolation.

- [ ] **Step 1: Write failing pure projection tests**

  Add fixtures with older clicks containing later-reported conversions to prove selection uses `reportedAt`, not click order:

  ```ts
  const earlierReported = { reportedAt: "2026-08-13T10:05:00Z", value: "earlier" };
  const laterReported = { reportedAt: "2026-08-13T11:00:00Z", value: "later" };

  expect(
    selectRecentLoadedConversion([
      { matchedConversions: [earlierReported] },
      { matchedConversions: [laterReported] },
    ])?.reportedAt,
  ).toBe("2026-08-13T11:00:00Z");

  const paidConversion = { networkConversionRef: "paid" };
  const reversedConversion = { networkConversionRef: "reversed" };

  expect(buildAttributionOutcome([])).toEqual({ kind: "none" });
  expect(buildAttributionOutcome([paidConversion])).toEqual({
    kind: "single",
    conversion: paidConversion,
  });
  expect(buildAttributionOutcome([paidConversion, reversedConversion])).toEqual({
    kind: "multiple",
    count: 2,
  });
  ```

  Include empty activity and equal-`reportedAt` stability cases.

- [ ] **Step 2: Write failing closed-row, expansion, and recent-module tests**

  Replace the four-column always-visible contract with the approved seven-column summary contract:

  ```tsx
  expect(within(ledger).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "Visit",
    "Customer",
    "Commerce",
    "Order",
    "Commission",
    "State",
    "",
  ]);

  const row = within(ledger).getByRole("row", { name: /operator@example\.test/ });
  expect(within(row).getByText("90.00 USD")).toBeVisible();
  expect(within(row).getByText("9.00 USD")).toBeVisible();
  expect(within(row).getByText("Paid")).toBeVisible();
  expect(within(row).getByText("Strong match")).toBeVisible();
  expect(within(row).queryByText("203.0.113.44")).not.toBeInTheDocument();
  expect(within(row).queryByText("impact-conversion-123")).not.toBeInTheDocument();
  ```

  Exercise the below-row region and non-loss contract:

  ```tsx
  const detailsButton = within(row).getByRole("button", {
    name: /Show details for operator@example\.test/,
  });
  fireEvent.click(detailsButton);

  expect(detailsButton).toHaveAttribute("aria-expanded", "true");
  const details = screen.getByRole("region", {
    name: /Attribution details for operator@example\.test/,
  });
  expect(details.closest("td")).toHaveAttribute("colspan", "7");
  expect(within(details).getByText("Touchpoint")).toBeVisible();
  expect(within(details).getByText("Request evidence")).toBeVisible();
  expect(within(details).getByText("203.0.113.44")).toBeVisible();
  expect(within(details).getByText("SKU-42")).toBeVisible();
  expect(within(details).getByText("impact-program")).toBeVisible();
  expect(within(details).getByText("impact-conversion-123")).toBeVisible();
  expect(within(details).getByText("Conversion Merchant")).toBeVisible();
  expect(within(details).getByText("Conversion Product")).toBeVisible();
  expect(within(details).getByText("Conversion Network")).toBeVisible();
  ```

  Assert the detail row immediately follows its summary row, `Close details` removes only that region, and two opened rows may coexist. Add zero-, one-, and multiple-conversion fixtures: zero uses em dashes plus `No conversion`; multiple uses `Multiple` in both money columns plus `2 conversions` and lists both complete conversions after expansion.

  Require `Recent conversion`, `Latest in loaded activity`, the selected conversion's merchant/product/status/confidence/amounts/reported time, and a compact `No matched conversion in loaded activity` empty state.

- [ ] **Step 3: Run focused revenue tests and verify RED**

  ```bash
  cd assets
  pnpm run test:unit -- test/routes/commerce/revenue/revenue-summary-view-data.test.ts test/routes/commerce/revenue/revenue-summary.route.test.tsx
  ```

  Expected: FAIL because there is no recent-conversion projection, all diagnostic facts remain in the closed four-column row, and no click-level below-row disclosure exists.

- [ ] **Step 4: Implement pure attribution projections**

  In `attribution-ledger-data.ts`, use structural generics so the pure functions
  consume generated Relay data without inventing a parallel domain model:

  ```ts
  export function selectRecentLoadedConversion<T extends { readonly reportedAt: string }>(
    clicks: readonly { readonly matchedConversions: readonly T[] }[],
  ) {
    let recent: T | null = null;

    for (const click of clicks) {
      for (const conversion of click.matchedConversions) {
        if (recent === null || conversion.reportedAt > recent.reportedAt) {
          recent = conversion;
        }
      }
    }

    return recent;
  }

  export function buildAttributionOutcome<T>(conversions: readonly T[]) {
    if (conversions.length === 0) return { kind: "none" } as const;
    if (conversions.length === 1) return { kind: "single", conversion: conversions[0] } as const;
    return { kind: "multiple", count: conversions.length } as const;
  }
  ```

  Select recent conversions with one pass and a strict-greater comparison so equal timestamps retain the first loaded item. Do not sort or mutate Relay data.

  Return the zero/one/multiple discriminated union directly from conversion count. The single branch exposes the original generated conversion object; the multiple branch exposes only the exact count.

- [ ] **Step 5: Add the recent loaded conversion module without merging query boundaries**

  Render `RecentConversion` from the same resolved click data as the ledger and assign it the `recent` dashboard grid area. Display only status, confidence, merchant, product, order, commission, reported time, and the scope text `Latest in loaded activity`.

  Update the deferred attribution loading and error elements to return two scoped grid items: one for the recent-conversion slot and one for the ledger slot. Continue deferring the optional query until hydration. A failed attribution query may fail both attribution-owned slots, but it must leave the two summary-owned modules visible.

- [ ] **Step 6: Implement the seven-column closed ledger**

  In `AttributionLedger_row`, select `attributionConfidence`,
  `commissionAmount`, `currency`, `merchantName`, `orderAmount`, `productName`,
  `reportedAt`, and `status` directly beside the existing conversion identity
  fields and `...ConversionDetails_conversion` spread. Relay fragment masking
  then keeps the closed-row and recent-module projections type-safe while the
  detail fragment continues to own complete conversion evidence. This changes
  only the query selection, not the GraphQL schema or server behavior.

  Define columns named `Visit`, `Customer`, `Commerce`, `Order`, `Commission`, `State`, and an unlabeled details action. Derive the outcome once per cell from `matchedConversions`:

  - no conversion: em dashes and a neutral `No conversion` state;
  - one conversion: exact Decimal strings with currency plus status and confidence badges;
  - multiple conversions: `Multiple` in money columns and an exact count badge, with no client aggregation.

  Render each TanStack row through a top-level `AttributionLedgerRow` component
  in `AttributionLedger.tsx`. That component owns one `useState(false)` value
  and returns its summary row plus conditional detail row, matching the existing
  CJ row pattern. Multiple rows can therefore remain open without a global
  accordion or derived-state effect. Build target-specific button copy from
  customer identity and formatted visit time; keep `clickId` out of visible
  UI. Render an `aria-hidden` `ChevronDown` or `ChevronUp` from the existing
  `lucide-react` dependency beside `Details` or `Close details`.

  Move `Load more` beside the ledger heading at wide widths while preserving disabled, failure, and retry behavior. Use intentional column allocation and the existing contained table wrapper; retain an internal mobile minimum only where needed for readable columns.

- [ ] **Step 7: Implement the full-width evidence row**

  `AttributionClickDetails` returns one `TableRow` with a `TableCell colSpan={7}` and a named region. Its desktop grid contains exactly these four groups:

  ```tsx
  <section aria-labelledby={touchpointId}>
    <h3 id={touchpointId}>Touchpoint</h3>
    <dl>
      <Fact label="Source" value={sourceSurfaceCopy(click.sourceSurface)} />
      <Fact label="Link type" value={linkTypeCopy(click.linkType)} />
      <Fact label="Referrer" value={referrerCopy(click.referrer)} />
    </dl>
  </section>
  <section aria-labelledby={requestId}>
    <h3 id={requestId}>Request evidence</h3>
    <dl>
      <Fact label="User agent" value={userAgentCopy(click.userAgent)} />
      <Fact label="IP address" value={click.ipAddress ?? "IP not captured"} />
    </dl>
  </section>
  <section aria-labelledby={commerceId}>
    <h3 id={commerceId}>Commerce</h3>
    <dl>
      <Fact label="Merchant" value={click.merchantName} />
      <Fact label="Product" value={click.productName ?? "No product"} />
      <Fact label="Network" value={click.affiliateNetworkName ?? "No network"} />
      <Fact label="Merchant SKU" value={click.merchantProductExternalSku ?? "No SKU"} />
      <Fact label="Program" value={click.affiliateProgramCode ?? "No affiliate program"} />
    </dl>
  </section>
  <section aria-labelledby={conversionId}>
    <h3 id={conversionId}>Conversion</h3>
    <ul aria-label="Matched conversions">
      {click.matchedConversions.map((conversion, index) => (
        <ConversionDetails
          conversion={conversion}
          key={`${conversion.affiliateNetworkCode}:${conversion.networkConversionRef}:${index}`}
        />
      ))}
    </ul>
  </section>
  ```

  Define file-local `Fact({ label, value })` to return one `<div>` containing
  `<dt>{label}</dt>` and `<dd>{value}</dd>`. Render the explicit `No matched
  conversions` paragraph instead of the list when `matchedConversions` is
  empty.

  Use short label/value pairs, not parameter sentences. Keep monospaced styling for user agent, IP, SKU, program code, and network reference only. Use a four-, two-, then one-column responsive grid. Preserve explicit missing-value copy and render `No matched conversions` when the click has none.

  Export the existing conversion status/confidence copy and tone helpers from `ConversionDetails` for reuse in the summary row and recent module. Keep `ConversionDetails` complete and heading-free; key conversion rows by network, reference, and loaded index so equal references do not produce React warnings.

- [ ] **Step 8: Run Relay, focused GREEN, and commit**

  ```bash
  cd assets
  pnpm run relay
  pnpm run test:unit -- test/routes/commerce/revenue/revenue-summary-view-data.test.ts test/routes/commerce/revenue/revenue-summary.route.test.tsx test/routes/commerce/revenue/revenue-summary-loader.test.ts
  git add src/routes/commerce/revenue test/routes/commerce/revenue src/__generated__
  git commit -m "feat: add compact attribution activity ledger"
  ```

  Expected: focused revenue tests pass, every investigation fact is recoverable after expansion, and summary/attribution loading and failures remain isolated.

---

### Task 3: Recompose CJ programs around global lifecycle and loaded-page attention

**Files:**
- Create: `assets/src/routes/ingestion/cj-programs/programs/program-dashboard-data.ts`
- Modify: `assets/src/routes/ingestion/cj-programs/programs/lifecycle-policy.ts`
- Modify: `assets/src/routes/ingestion/cj-programs/programs/ProgramLifecycleTable.tsx`
- Modify: `assets/src/routes/ingestion/cj-programs/programs/ProgramLifecycleRow.tsx`
- Modify: `assets/src/routes/ingestion/cj-programs/CJProgramsRoute.tsx`
- Modify: `assets/test/routes/ingestion/cj-programs/cj-program-data.test.ts`
- Modify: `assets/test/routes/ingestion/cj-programs/cj-programs.route.test.tsx`
- Modify generated output after Relay compilation: `assets/src/__generated__/**`

**Interfaces:**
- Consumes: global `cjProgramStageCounts`, the current sorted/paginated `cjPrograms` page, the existing lifecycle mutation, and existing program-feed disclosure.
- Produces: `buildCJLifecycleSummary(counts)` returning `All programs` plus the seven global stage items.
- Produces: `selectCJProgramAttention(programs)` returning `{ count, program, requiredAction }`, with warning-bearing rows first and current loaded order as the tie-breaker.
- Produces: route grid areas named `lifecycle`, `attention`, `feedHealth`, `programs`, and `unmatched`.
- Preserves: stage/sort URL behavior, mutation conflict refresh, row-local feedback, future enum handling, and lazy program-feed loading.

- [ ] **Step 1: Write failing lifecycle and attention projection tests**

  Add tests for the global total and page-scoped attention rules:

  ```ts
  expect(
    buildCJLifecycleSummary({
      new: 2,
      considering: 3,
      selected: 4,
      applied: 5,
      accepted: 6,
      notPursuing: 7,
      declined: 8,
    }),
  ).toEqual([
    { label: "All programs", value: 35 },
    { label: "New", value: 2 },
    { label: "Considering", value: 3 },
    { label: "Selected", value: 4 },
    { label: "Applied", value: 5 },
    { label: "Accepted", value: 6 },
    { label: "Not pursuing", value: 7 },
    { label: "Declined", value: 8 },
  ]);
  ```

  Build an attention fixture where a normal actionable row precedes a warning-bearing row and assert the warning row is selected while `count` includes both. Add a terminal-only page returning `count: 0`, and a `%future added value` row returning `Review new lifecycle stage`.

- [ ] **Step 2: Write failing CJ dashboard composition tests**

  Require inline controls and the absence of the persistent rail:

  ```tsx
  expect(screen.getByRole("form", { name: "CJ program filters" })).toBeVisible();
  expect(screen.queryByRole("complementary", { name: "Program controls" })).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "CJ program lifecycle summary" })).toBeVisible();
  expect(within(summary).getByText("All programs")).toBeVisible();
  expect(screen.getByRole("region", { name: "Program attention" })).toHaveTextContent(
    "Needs attention on this page",
  );
  expect(screen.getByText("5 programs on this page need attention")).toBeVisible();
  ```

  Preserve the current four program headers, heading-free data-cell assertion, exact last-change time, provider/ID/feed count, lifecycle warnings, required action, edit/close interaction, mutation locality, conflict refresh, and lazy feed behavior.

  Assert lifecycle values are not connected by a progressbar, ordered list, arrow copy, or completion percentage.

- [ ] **Step 3: Run focused CJ tests and verify RED**

  ```bash
  cd assets
  pnpm run test:unit -- test/routes/ingestion/cj-programs/cj-program-data.test.ts test/routes/ingestion/cj-programs/cj-programs.route.test.tsx
  ```

  Expected: FAIL because controls remain in a context rail, no global total or attention module exists, and the current lifecycle strip is not composed as a dashboard area.

- [ ] **Step 4: Centralize lifecycle action semantics**

  Export these lifecycle-policy operations and use them from both row and dashboard projections:

  ```ts
  export function cjProgramWarningMessages(codes: readonly CJProgramWarningCode[]) {
    return codes.map(cjProgramWarningCopy).filter((warning) => warning !== null);
  }

  export function cjProgramRequiredAction(
    stage: GeneratedCJProgramStage,
    warningCodes: readonly CJProgramWarningCode[],
  ) {
    if (cjProgramWarningMessages(warningCodes).length > 0) return "Review feed warnings";

    switch (stage) {
      case "NEW":
        return "Decide whether to pursue";
      case "CONSIDERING":
        return "Complete program review";
      case "SELECTED":
        return "Submit application";
      case "APPLIED":
        return "Monitor application";
      case "ACCEPTED":
        return "Inspect available feeds";
      case "NOT_PURSUING":
      case "DECLINED":
        return "No action required";
      default:
        return "Review new lifecycle stage";
    }
  }

  export function cjProgramNeedsAttention(
    stage: GeneratedCJProgramStage,
    warningCodes: readonly CJProgramWarningCode[],
  ) {
    return cjProgramRequiredAction(stage, warningCodes) !== "No action required";
  }
  ```

  Update `ProgramLifecycleRow` to consume these shared functions. Do not change its mutation variables, editor state, full-width `colSpan={4}`, or program-feed mounting behavior.

- [ ] **Step 5: Implement global lifecycle and loaded-page attention projections**

  Add `advertiserId`, `advertiserName`, `stage`, and `warningCodes` as direct
  selections beside `...ProgramLifecycleRow_program` in the route connection.
  Relay fragment masking then exposes exactly the loaded-page fields needed for
  attention selection while `ProgramLifecycleRow` keeps mutation/edit
  ownership. This changes only the query selection, not the GraphQL schema.

  Sum only the seven generated stage-count fields. Select attention in one pass: count every actionable loaded program, remember the first actionable program, and replace it only when the first warning-bearing candidate appears. Use advertiser name with advertiser ID fallback and the shared required-action copy.

  In `ProgramLifecycleTable`, render:

  - one shallow segmented `CJ program lifecycle summary` region in the `lifecycle` grid area;
  - one `Program attention` region in the `attention` grid area with explicit `on this page` copy and an anchor to the program ledger;
  - one `Programs work queue` section in the `programs` grid area containing the existing four-column table and pagination.

  Keep the summary semantic as a definition list or labeled metric group. Do not use progressbar semantics or directional connectors.

  In `ProgramLifecycleRow`, change the warning list to a heading-free inline,
  wrapping list with quiet separators. Preserve every warning string, but do
  not stack each warning as a separate tall text block.

- [ ] **Step 6: Move CJ controls into the page header and establish the dashboard grid**

  Remove `WorkspaceLayout` and `ContextRail` from `CJProgramsRoute`. Pass the existing stage/sort GET form through `PageShell.actions`, label it `CJ program filters`, and keep hidden pagination inputs and history-navigation reset keys unchanged.

  Wrap the ready panel and deferred unmatched-feed boundary in one CSS grid with these desktop areas:

  ```text
  "lifecycle lifecycle"
  "attention feedHealth"
  "programs programs"
  "unmatched unmatched"
  ```

  Collapse to one column in the same logical order at narrow widths. The attention and feed-health halves may share adjacent borders/radii to read as one operational band, but they remain separately rendered query owners.

- [ ] **Step 7: Run Relay, focused GREEN, and commit**

  ```bash
  cd assets
  pnpm run relay
  pnpm run test:unit -- test/routes/ingestion/cj-programs/cj-program-data.test.ts test/routes/ingestion/cj-programs/cj-programs.route.test.tsx test/routes/ingestion/cj-programs/cj-programs-loader.test.ts
  git add src/routes/ingestion/cj-programs test/routes/ingestion/cj-programs src/__generated__
  git commit -m "feat: compose CJ programs dashboard"
  ```

  Expected: focused CJ tests pass with unchanged edit, feed-inspection, pagination, and failure behavior.

---

### Task 4: Convert unmatched feeds into a compact ledger with scoped health

**Files:**
- Create: `assets/src/routes/ingestion/cj-programs/feeds/UnmatchedFeedRow.tsx`
- Modify: `assets/src/routes/ingestion/cj-programs/feeds/UnmatchedFeeds.tsx`
- Modify: `assets/src/routes/ingestion/cj-programs/feeds/FeedFactsRow.tsx`
- Modify: `assets/src/routes/ingestion/cj-programs/CJProgramsRoute.tsx`
- Modify: `assets/test/routes/ingestion/cj-programs/cj-programs.route.test.tsx`
- Modify: `assets/test/ui/tanstack-data-tables.test.ts`
- Modify generated output after Relay compilation: `assets/src/__generated__/**`

**Interfaces:**
- Consumes: the unchanged `unmatchedCjFeeds` connection fields and `buildCJUnmatchedFeedPageData` pagination links.
- Produces: `UnmatchedFeedRow_feed` generated fragment and an eight-column `Unmatched CJ feeds` table.
- Produces: a `Feed health` region that labels its count `on this loaded page` and identifies the first loaded feed/product count without claiming a global total.
- Preserves: `FeedFactsRow_feed` and list presentation for lazy program-feed inspection, plus independently deferred unmatched-feed loading/error behavior.

- [ ] **Step 1: Write failing unmatched-table and feed-health tests**

  Replace the unmatched list assertions with a native table contract:

  ```tsx
  const feedHealth = screen.getByRole("region", { name: "Feed health" });
  expect(feedHealth).toHaveTextContent("1 unmatched feed on this loaded page");
  expect(feedHealth).toHaveTextContent("Unmatched Outlet Feed");
  expect(feedHealth).toHaveTextContent("250 products");

  const feeds = screen.getByRole("table", { name: "Unmatched CJ feeds" });
  expect(within(feeds).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "Provider feed",
    "Last seen",
    "Products",
    "Advertiser",
    "Feed type",
    "Country",
    "Currency",
    "Language",
  ]);
  const row = within(feeds).getByRole("row", { name: /Unmatched Outlet Feed/ });
  expect(within(row).getByText("unmatched-outlet")).toBeVisible();
  expect(within(row).getByText("Jul 20, 2026, 10:00 AM")).toHaveAttribute(
    "datetime",
    "2026-07-20T10:00:00.000000Z",
  );
  expect(within(row).getByText("250 products")).toBeVisible();
  expect(within(row).getByText("Unmatched Outlet")).toBeVisible();
  expect(within(row).getByText("PRODUCT")).toBeVisible();
  expect(within(row).getByText("US")).toBeVisible();
  expect(within(row).getByText("USD")).toBeVisible();
  expect(within(row).getByText("EN")).toBeVisible();
  expect(within(feeds).queryByRole("heading")).not.toBeInTheDocument();
  ```

  Add an empty feed-health state and update the existing unavailable-query test to require both a scoped feed-health alert and an unmatched-ledger alert while the program dashboard remains usable. Keep the independent cursor URL assertions unchanged.

  Retain the existing lazy program-feed test as a list contract so this task cannot accidentally convert the editor's nested feed inspector into another wide table.

- [ ] **Step 2: Run focused CJ tests and verify RED**

  ```bash
  cd assets
  pnpm run test:unit -- test/routes/ingestion/cj-programs/cj-programs.route.test.tsx
  ```

  Expected: FAIL because unmatched feeds currently render as heading-plus-parameter list items and there is no loaded-page feed-health module.

- [ ] **Step 3: Add the unmatched-feed row fragment and table**

  Keep `FeedFactsRow` for `ProgramFeeds` and remove only its now-unused `showAdvertiserName` option. Define `UnmatchedFeedRow_feed` with the same existing feed fields and render one `TableRow` with a semantic row header for feed name plus quiet provider feed ID. In `UnmatchedFeedsQuery`, select `feedName` and `productCount` directly beside `...UnmatchedFeedRow_feed` so the health projection can read its loaded-page summary fields without unmasking the row fragment.

  Build the eight-column table with TanStack Table and the shared `Table` primitive. Use content-priority widths, heading-free cells, concise explicit fallbacks, and an internal mobile minimum in the contained wrapper. Keep pagination beneath the table and retain exact first/next URLs.

  Add `src/routes/ingestion/cj-programs/feeds/UnmatchedFeeds.tsx` to the
  `dataTables` inventory in `assets/test/ui/tanstack-data-tables.test.ts` so the
  repository-wide semantic-table contract proves that this new table delegates
  its column and row model to TanStack.

- [ ] **Step 4: Add loaded-page feed health and scoped deferred fallbacks**

  `UnmatchedFeeds` returns two sibling grid items: `Feed health` in `feedHealth` and the unmatched table section in `unmatched`. Use `edges.length` as the count and say `on this loaded page`; identify only the first loaded feed as a compact example.

  Update the unmatched loading and error elements in `CJProgramsRoute` to return matching feedback in both grid areas. Do not move the unmatched query inside the program boundary or let its error replace lifecycle counts, attention, program rows, or edit controls.

- [ ] **Step 5: Run Relay, focused GREEN, and commit**

  ```bash
  cd assets
  pnpm run relay
  pnpm run test:unit -- test/routes/ingestion/cj-programs/cj-programs.route.test.tsx test/routes/ingestion/cj-programs/cj-program-data.test.ts test/routes/ingestion/cj-programs/cj-programs-loader.test.ts test/ui/tanstack-data-tables.test.ts
  git add src/routes/ingestion/cj-programs test/routes/ingestion/cj-programs test/ui/tanstack-data-tables.test.ts src/__generated__
  git commit -m "feat: add compact unmatched feed ledger"
  ```

  Expected: every feed fact and cursor remains present, while feed status and failure copy are explicitly loaded-page scoped.

---

### Task 5: Verify responsive containment, accessibility, and non-loss in a real browser

**Files:**
- Modify: `assets/tests/e2e/production-ui-operations.spec.ts`
- Verify without expected source changes: `assets/tests/e2e/production-ui-compare-return.spec.ts`
- Modify only if a measured containment regression remains: `assets/src/ui/primitives/Table.tsx`
- Modify only if a measured route overflow remains: affected revenue/CJ StyleX owner from Tasks 1–4
- Modify: `docs/work/operator-workspaces.md`

**Interfaces:**
- Consumes: existing deterministic GraphQL responders, desktop/tablet/mobile `VIEWPORTS`, `[data-slot="table-container"]`, and `expectOperatorSurface` axe/document-width checks.
- Produces: browser evidence for closed and expanded revenue rows, inline CJ controls, aggregate lifecycle semantics, program editing, unmatched-feed facts, query failure isolation, and table containment.
- Preserves: intentional comparison-matrix internal scrolling; no test asserts row pixel height.

- [ ] **Step 1: Update the operator browser acceptance to the approved semantics**

  For CJ at each viewport:

  - require the inline `CJ program filters` form and no `Program controls` complementary rail;
  - require global `All programs`, `Program attention`, and loaded-page `Feed health` copy;
  - require the four-column program table and eight-column unmatched-feed table;
  - open/close the program editor and retain stage, note, save, feed disclosure, exact time, advertiser ID, and feed-count assertions;
  - assert both tables contain no heading elements in data cells.

  For revenue at each viewport:

  - require `Attribution performance`, `Revenue outcome`, and `Recent conversion`;
  - require the seven-column closed ledger and ensure request evidence/reference are absent from its summary row;
  - open `Show details for operator@example.test ...`, assert the spanning Touchpoint, Request evidence, Commerce, and Conversion groups and every fixture value, then close it;
  - preserve pagination and independent summary/attribution failure recovery scenarios.

- [ ] **Step 2: Retain and broaden containment measurements**

  Continue calling `expectTableContained` for both CJ tables and the revenue table. At desktop/tablet require `scrollWidth <= clientWidth + 1`; at mobile allow internal table scrolling but require the wrapper's right edge inside its parent and document width inside the viewport.

  Run the comparison spec in the same gate. Its table wrappers must remain inside their parents, but do not require the intentionally wide comparison matrices to eliminate internal scrolling.

- [ ] **Step 3: Run browser acceptance and inspect every generated capture**

  ```bash
  cd assets
  PLAYWRIGHT_PORT=4187 pnpm exec playwright test tests/e2e/production-ui-operations.spec.ts tests/e2e/production-ui-compare-return.spec.ts --reporter=line
  ```

  Expected: PASS at desktop, tablet, and mobile with zero axe violations and no document-level overflow.

  Inspect the revenue closed/open captures and CJ program/editor captures. Confirm that closed revenue rows remain one scan line at desktop, detail evidence appears only below its selected row, CJ aggregate counts have no progress metaphor, operational bands are shallow, and right edges are not clipped. Do not add screenshot-baseline or row-height assertions merely to encode those observations.

- [ ] **Step 4: Apply only evidence-backed containment fixes**

  If a measured failure remains, first adjust route-local column allocation or `minWidth: 0` on the responsible grid item. Change the shared `Table` primitive only if multiple consumers demonstrate the same wrapper defect. Retain its `maxWidth: "100%"`, `minWidth: 0`, and `overflowX: "auto"` contract and do not globally shrink cell typography.

- [ ] **Step 5: Run complete frontend and repository gates**

  ```bash
  cd assets
  pnpm run check
  cd ..
  mix format --check-formatted
  mix typecheck
  mix quality
  mix test
  mix work_queue.validate
  git diff --check
  ```

  Expected: Relay validation, TypeScript, lint, formatting, all frontend unit tests, client/SSR builds, bundle checks, backend formatting/type/static-analysis/tests, queue validation, and whitespace checks pass.

- [ ] **Step 6: Record observed completion evidence and commit**

  Update `docs/work/operator-workspaces.md` to replace the superseded always-visible revenue and persistent-CJ-rail description with the implemented dashboard ownership, inline attribution expansion, page-scoped status semantics, unmatched-feed table, browser results, and exact fresh gate outputs.

  ```bash
  git add assets docs/work/operator-workspaces.md
  git commit -m "feat: complete operator dashboard refinement"
  ```

  After this implementation commit, hand the coordinator the commit IDs and verification receipts so `docs/work/index.md` and `docs/plans/INDEX.md` can be reconciled at the dispatch boundary without a checkbox-only worker commit.
