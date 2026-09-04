import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { MemoryRouter, useLoaderData } from "react-router";
import { useFragment, usePaginationFragment, usePreloadedQuery } from "react-relay";
import type { AttributionLedgerRouteQuery$variables } from "../../../../src/__generated__/AttributionLedgerRouteQuery.graphql";
import type { RevenueSummaryRouteQuery$variables } from "../../../../src/__generated__/RevenueSummaryRouteQuery.graphql";
import {
  type RelayRouteQueryDescriptor,
  useRoutePreloadedQuery,
} from "../../../../src/relay/route-preload";
import {
  RevenueSummaryRoute,
  type RevenueSummaryLoaderData,
} from "../../../../src/routes/commerce/revenue/RevenueSummaryRoute";
import { RevenueControls } from "../../../../src/routes/commerce/revenue/summary/RevenueControls";
import { RevenueMetrics } from "../../../../src/routes/commerce/revenue/summary/RevenueMetrics";
import {
  ATTRIBUTION_LEDGER_PAGE_SIZE,
  buildRevenueDatePresetLinks,
} from "../../../../src/routes/commerce/revenue/summary/revenue-summary-data";
import { mockPreloadedQuery } from "../../../helpers/relay";

const {
  useLoaderDataMock,
  useFragmentMock,
  usePaginationFragmentMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock,
} = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn(),
  useFragmentMock: vi.fn(),
  usePaginationFragmentMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn(),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useFragment: useFragmentMock,
    usePaginationFragment: usePaginationFragmentMock,
    usePreloadedQuery: usePreloadedQueryMock,
  };
});

vi.mock("../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/relay/route-preload")>(
    "../../../../src/relay/route-preload",
  );

  return {
    ...actual,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock,
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseFragment = vi.mocked(useFragment);
const mockedUsePaginationFragment = vi.mocked(usePaginationFragment);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const REVENUE_QUERY_DESCRIPTOR: RelayRouteQueryDescriptor<RevenueSummaryRouteQuery$variables> = {
  __relayQuery: {
    cacheID: "RevenueSummaryRouteQuery-cache-id",
    operationName: "RevenueSummaryRouteQuery",
    variables: {
      input: null,
    },
  },
};

const ATTRIBUTION_LEDGER_QUERY_DESCRIPTOR: RelayRouteQueryDescriptor<AttributionLedgerRouteQuery$variables> =
  {
    __relayQuery: {
      cacheID: "AttributionLedgerRouteQuery-cache-id",
      operationName: "AttributionLedgerRouteQuery",
      variables: {
        input: null,
        after: null,
        first: ATTRIBUTION_LEDGER_PAGE_SIZE,
      },
    },
  };

const REVENUE_QUERY_REF = mockPreloadedQuery(REVENUE_QUERY_DESCRIPTOR.__relayQuery.variables);

const ATTRIBUTION_LEDGER_QUERY_REF = mockPreloadedQuery(
  ATTRIBUTION_LEDGER_QUERY_DESCRIPTOR.__relayQuery.variables,
);

const UNSUPPRESSED_REVENUE_SUMMARY = {
  revenueSummary: {
    filters: {
      currency: "USD",
      from: "2026-05-01",
      merchantId: null,
      network: "impact",
      productId: null,
      to: "2026-05-31",
    },
    metrics: {
      averagePaidPrice: "80.00",
      clicks: 2,
      commissionRevenue: "20.00",
      conversions: 2,
      currency: "USD",
      grossOrderValue: "200.00",
    },
  },
};

const ATTRIBUTION_LEDGER_PAGE = {
  commerceAttributionClicks: {
    edges: [
      {
        cursor: "ledger-cursor-1",
        node: {
          affiliateNetworkCode: "impact",
          affiliateNetworkId: "network-1",
          affiliateNetworkName: "Impact",
          affiliateProgramCode: "impact-program",
          affiliateProgramId: "program-1",
          anonymousVisitor: false,
          clickId: "db8e90c9-c6f2-4f36-a67f-3324033ac114",
          insertedAt: "2026-05-31T12:30:00Z",
          ipAddress: "203.0.113.44",
          linkType: "AFFILIATE",
          matchedConversions: [
            {
              affiliateNetworkCode: "partnerize",
              affiliateNetworkId: "conversion-network-1",
              affiliateNetworkName: "Conversion Network",
              attributionConfidence: "HIGH",
              commissionAmount: "9.00",
              currency: "USD",
              merchantId: "conversion-merchant-1",
              merchantName: "Conversion Merchant",
              networkConversionRef: "impact-conversion-123",
              orderAmount: "90.00",
              productId: "conversion-product-1",
              productName: "Conversion Product",
              purchasedAt: "2026-05-31T13:00:00Z",
              reportedAt: "2026-06-01T09:00:00Z",
              status: "PAID",
            },
          ],
          merchantId: "merchant-1",
          merchantName: "Example Merchant",
          merchantProductExternalSku: "SKU-42",
          merchantProductId: "merchant-product-1",
          productId: "product-1",
          productName: "Example camera",
          referrer: "https://example.test/compare?campaign=summer#offer",
          sourceSurface: "WEB",
          userAgent: "ExampleBrowser/1.0",
          userEmail: "operator@example.test",
          userId: "user-1",
        },
      },
    ],
    pageInfo: {
      endCursor: "ledger-cursor-1",
      hasNextPage: true,
    },
  },
};

beforeEach(() => {
  useLoaderDataMock.mockReset();
  mockedUseFragment.mockReset();
  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => fragmentRef as never);
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  REVENUE_QUERY_REF.dispose.mockReset();
  ATTRIBUTION_LEDGER_QUERY_REF.dispose.mockReset();
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) =>
    descriptor.__relayQuery.operationName === "RevenueSummaryRouteQuery"
      ? (REVENUE_QUERY_REF as never)
      : (ATTRIBUTION_LEDGER_QUERY_REF as never),
  );
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) =>
    queryRef === REVENUE_QUERY_REF
      ? (UNSUPPRESSED_REVENUE_SUMMARY as never)
      : (ATTRIBUTION_LEDGER_PAGE as never),
  );
  mockedUsePaginationFragment.mockReturnValue({
    data: ATTRIBUTION_LEDGER_PAGE,
    hasNext: true,
    isLoadingNext: false,
    loadNext: vi.fn(),
  } as never);
});

afterEach(() => {
  vi.useRealTimers();
});

test("revenue presentation exposes filters, presets, active filters, and metrics", () => {
  render(
    <MemoryRouter>
      <section aria-label="Revenue report">
        <RevenueControls
          activeFilters={[{ label: "Network", value: "impact" }]}
          datePresetLinks={[{ label: "Last 7 days", to: "/commerce/revenue?from=2026-07-05" }]}
          filters={{
            currency: "USD",
            from: "2026-07-05",
            network: "impact",
            to: "2026-07-11",
          }}
        />
        <RevenueMetrics
          metrics={{
            attribution: { clicks: "12", conversionRate: "25%", conversions: "3" },
            revenue: [{ label: "Gross order value", value: "90.00 USD" }],
          }}
        />
      </section>
    </MemoryRouter>,
  );

  expect(screen.getByRole("form", { name: "Revenue filters" })).toBeVisible();
  expect(screen.getByLabelText("Network")).toHaveValue("impact");
  expect(screen.getByLabelText("Currency")).toHaveValue("USD");
  expect(screen.getByLabelText("From")).toHaveValue("2026-07-05");
  expect(screen.getByLabelText("To")).toHaveValue("2026-07-11");
  expect(screen.getByRole("button", { name: "Apply filters" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
    "href",
    "/commerce/revenue",
  );
  expect(screen.getByRole("list", { name: "Revenue date presets" })).toBeVisible();
  expect(screen.getByRole("list", { name: "Active revenue filters" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Attribution performance" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Revenue outcome" })).toBeVisible();
  expect(screen.getByText("25%")).toBeVisible();
  expect(screen.queryByRole("region", { name: "Summary" })).not.toBeInTheDocument();
});

test("revenue controls scope field labels to each rendered instance", () => {
  render(
    <MemoryRouter>
      <RevenueControls activeFilters={[]} datePresetLinks={[]} filters={{ currency: "USD" }} />
      <RevenueControls activeFilters={[]} datePresetLinks={[]} filters={{ currency: "EUR" }} />
    </MemoryRouter>,
  );

  const networkLabelIds = screen
    .getAllByLabelText("Network")
    .map((input) => input.getAttribute("aria-labelledby"));

  expect(new Set(networkLabelIds).size).toBe(2);
  expect(
    networkLabelIds.every((id) => id && document.getElementById(id)?.textContent === "Network"),
  ).toBe(true);
});

test("revenue route identifies recorded attribution data as a preview", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  renderRevenueSummaryRoute();

  expect(screen.getByRole("heading", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Revenue report" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Revenue controls" })).toBeInTheDocument();
  expect(screen.queryByRole("complementary", { name: "Revenue controls" })).not.toBeInTheDocument();
  expect(screen.getByText(/preview summarizes recorded attribution data/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ingestion status" })).toHaveAttribute(
    "href",
    "/commerce/revenue/ingestion",
  );
});

test("revenue route keeps one control band ahead of metrics and the attribution ledger", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  renderRevenueSummaryRoute();

  const controls = screen.getByRole("region", { name: "Revenue controls" });
  const summary = screen.getByRole("region", { name: "Attribution performance" });
  const ledger = screen.getByRole("table", { name: "Attribution ledger" });

  expect(controls.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(summary.compareDocumentPosition(ledger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test("revenue route keeps exact conversion timing visible in the ledger", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ currency: "USD" }));

  renderRevenueSummaryRoute();

  const visitRow = screen.getByRole("row", { name: /operator@example\.test/ });
  fireEvent.click(
    within(visitRow).getByRole("button", { name: /Show details for operator@example\.test/ }),
  );
  const conversion = screen.getByRole("group", {
    name: "Conversion impact-conversion-123",
  });
  expect(within(conversion).getByText("Purchased")).toBeInTheDocument();
  expect(within(conversion).getByText("Reported")).toBeInTheDocument();
  expect(within(conversion).getByText("May 31, 2026, 1:00 PM")).toHaveAttribute(
    "datetime",
    "2026-05-31T13:00:00Z",
  );
  expect(within(conversion).getByText("Jun 1, 2026, 9:00 AM")).toHaveAttribute(
    "datetime",
    "2026-06-01T09:00:00Z",
  );
});

test("revenue route renders customer-facing visit and purchase details without internal IDs", () => {
  const loadNext = vi.fn();
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ currency: "USD", network: "impact" }));
  mockedUsePaginationFragment.mockReturnValue({
    data: ATTRIBUTION_LEDGER_PAGE,
    hasNext: true,
    isLoadingNext: false,
    loadNext,
  } as never);

  renderRevenueSummaryRoute();

  const summary = screen.getByRole("region", { name: "Attribution performance" });
  const ledgerHeading = screen.getByRole("heading", { name: "Attribution clicks" });

  expect(
    summary.compareDocumentPosition(ledgerHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  const ledger = screen.getByRole("table", { name: "Attribution ledger" });
  expect(ledger).toBeVisible();
  expect(
    within(ledger)
      .getAllByRole("columnheader")
      .map((header) => header.textContent),
  ).toEqual(["Visit", "Customer", "Commerce", "Order", "Commission", "State", "Details"]);
  expect(ledger.querySelectorAll("dl")).toHaveLength(0);
  const visitRow = within(ledger).getByRole("row", { name: /operator@example\.test/ });
  expect(within(visitRow).getByText("May 31, 2026, 12:30 PM")).toHaveAttribute(
    "datetime",
    "2026-05-31T12:30:00Z",
  );
  expect(within(visitRow).getByText("operator@example.test")).toBeInTheDocument();
  expect(within(visitRow).getByText("Known customer")).toBeInTheDocument();
  expect(within(visitRow).getByText("Example Merchant · Example camera")).toBeInTheDocument();
  expect(within(visitRow).getByText("90.00 USD")).toBeInTheDocument();
  expect(within(visitRow).getByText("9.00 USD")).toBeInTheDocument();
  expect(within(visitRow).getByText("Paid")).toBeInTheDocument();
  expect(within(visitRow).getByText("Strong match")).toBeInTheDocument();
  expect(within(visitRow).queryByText("203.0.113.44")).not.toBeInTheDocument();
  expect(within(visitRow).queryByText("impact-conversion-123")).not.toBeInTheDocument();

  const detailsButton = within(visitRow).getByRole("button", {
    name: /Show details for operator@example\.test/,
  });
  fireEvent.click(detailsButton);

  expect(detailsButton).toHaveAttribute("aria-expanded", "true");
  const details = screen.getByRole("region", {
    name: /Attribution details for operator@example\.test/,
  });
  expect(detailsButton).toHaveAttribute("aria-controls", details.id);
  expect(details.closest("td")).toHaveAttribute("colspan", "7");
  expect(visitRow.nextElementSibling).toBe(details.closest("tr"));
  expect(within(details).getByText("Touchpoint")).toBeVisible();
  expect(within(details).getByText("Request evidence")).toBeVisible();
  expect(within(details).getByText("Commerce")).toBeVisible();
  expect(within(details).getByText("Conversion")).toBeVisible();
  expect(within(details).getByText("Product Compare website")).toBeInTheDocument();
  expect(within(details).getByText("Partner link")).toBeInTheDocument();
  expect(
    within(details).getByText("https://example.test/compare?campaign=summer#offer"),
  ).toBeInTheDocument();
  expect(within(details).getByText("ExampleBrowser/1.0")).toBeInTheDocument();
  expect(within(details).getByText("203.0.113.44")).toBeInTheDocument();
  expect(within(details).getByText("Impact")).toBeInTheDocument();
  expect(within(details).getByText("SKU-42")).toBeInTheDocument();
  expect(within(details).getByText("impact-program")).toBeInTheDocument();
  expect(within(details).getByText("impact-conversion-123")).toBeInTheDocument();
  const conversion = screen.getByRole("group", {
    name: "Conversion impact-conversion-123",
  });
  expect(within(conversion).getByText("Order value")).toBeInTheDocument();
  expect(within(conversion).getByText("Commission")).toBeInTheDocument();
  expect(within(conversion).getByText("90.00 USD")).toBeInTheDocument();
  expect(within(conversion).getByText("9.00 USD")).toBeInTheDocument();
  expect(within(conversion).getByText("Conversion Merchant")).toBeInTheDocument();
  expect(within(conversion).getByText("Conversion Product")).toBeInTheDocument();
  expect(within(conversion).getByText("Conversion Network")).toBeInTheDocument();
  expect(within(conversion).getByText("Purchased")).toBeInTheDocument();
  expect(within(conversion).getByText("Reported")).toBeInTheDocument();
  expect(conversion.querySelector("dl")).not.toBeInTheDocument();
  fireEvent.click(
    within(visitRow).getByRole("button", { name: /Close details for operator@example\.test/ }),
  );
  expect(
    screen.queryByRole("region", { name: /Attribution details for operator@example\.test/ }),
  ).not.toBeInTheDocument();

  const recent = screen.getByRole("region", { name: "Recent conversion" });
  expect(within(recent).getByText("Latest in loaded activity")).toBeVisible();
  expect(within(recent).getByText("Conversion Merchant")).toBeVisible();
  expect(within(recent).getByText("Conversion Product")).toBeVisible();
  expect(within(recent).getByText("Paid")).toBeVisible();
  expect(within(recent).getByText("Strong match")).toBeVisible();
  expect(within(recent).getByText("90.00 USD")).toBeVisible();
  expect(within(recent).getByText("9.00 USD")).toBeVisible();
  expect(within(recent).getByText("Jun 1, 2026, 9:00 AM")).toHaveAttribute(
    "datetime",
    "2026-06-01T09:00:00Z",
  );
  expect(
    screen.queryByText(/db8e90c9|user-1|merchant-1|product-1|network-1/),
  ).not.toBeInTheDocument();
  expect(mockedUseFragment).toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Load more attribution clicks" }));

  expect(loadNext).toHaveBeenCalledWith(
    ATTRIBUTION_LEDGER_PAGE_SIZE,
    expect.objectContaining({ onComplete: expect.any(Function) }),
  );
});

test("revenue route shows the latest conversion across loaded clicks", () => {
  const firstClick = ATTRIBUTION_LEDGER_PAGE.commerceAttributionClicks.edges[0].node;
  const firstConversion = firstClick.matchedConversions[0];
  const latestConversion = {
    ...firstConversion,
    merchantName: "Latest conversion merchant",
    reportedAt: "2026-06-02T09:00:00Z",
  };

  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ currency: "USD" }));
  mockedUsePaginationFragment.mockReturnValue({
    data: {
      commerceAttributionClicks: {
        edges: [
          {
            cursor: "earlier-click",
            node: {
              ...firstClick,
              clickId: "earlier-click",
              matchedConversions: [
                { ...firstConversion, merchantName: "Earlier conversion merchant" },
              ],
            },
          },
          {
            cursor: "latest-click",
            node: {
              ...firstClick,
              clickId: "latest-click",
              matchedConversions: [latestConversion],
            },
          },
        ],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
    },
    hasNext: false,
    isLoadingNext: false,
    loadNext: vi.fn(),
  } as never);

  renderRevenueSummaryRoute();

  const recent = screen.getByRole("region", { name: "Recent conversion" });

  expect(within(recent).getByText("Latest conversion merchant")).toBeVisible();
  expect(within(recent).getByText("Jun 2, 2026, 9:00 AM")).toHaveAttribute(
    "datetime",
    "2026-06-02T09:00:00Z",
  );
});

test("revenue route compares conversion timestamps as instants across offsets", () => {
  const firstClick = ATTRIBUTION_LEDGER_PAGE.commerceAttributionClicks.edges[0].node;
  const firstConversion = firstClick.matchedConversions[0];

  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ currency: "USD" }));
  mockedUsePaginationFragment.mockReturnValue({
    data: {
      commerceAttributionClicks: {
        edges: [
          {
            cursor: "later-instant",
            node: {
              ...firstClick,
              clickId: "later-instant",
              matchedConversions: [
                {
                  ...firstConversion,
                  merchantName: "Later instant merchant",
                  reportedAt: "2026-06-02T09:30:00Z",
                },
              ],
            },
          },
          {
            cursor: "earlier-offset-instant",
            node: {
              ...firstClick,
              clickId: "earlier-offset-instant",
              matchedConversions: [
                {
                  ...firstConversion,
                  merchantName: "Earlier offset merchant",
                  reportedAt: "2026-06-02T10:00:00+02:00",
                },
              ],
            },
          },
        ],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
    },
    hasNext: false,
    isLoadingNext: false,
    loadNext: vi.fn(),
  } as never);

  renderRevenueSummaryRoute();

  const recent = screen.getByRole("region", { name: "Recent conversion" });

  expect(within(recent).getByText("Later instant merchant")).toBeVisible();
  expect(within(recent).queryByText("Earlier offset merchant")).not.toBeInTheDocument();
});

test("revenue route keeps the first loaded conversion when reported times tie", () => {
  const firstClick = ATTRIBUTION_LEDGER_PAGE.commerceAttributionClicks.edges[0].node;
  const firstConversion = firstClick.matchedConversions[0];
  const reportedAt = "2026-06-02T09:00:00Z";

  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ currency: "USD" }));
  mockedUsePaginationFragment.mockReturnValue({
    data: {
      commerceAttributionClicks: {
        edges: [
          {
            cursor: "first-tied-click",
            node: {
              ...firstClick,
              clickId: "first-tied-click",
              matchedConversions: [
                { ...firstConversion, merchantName: "First tied conversion", reportedAt },
              ],
            },
          },
          {
            cursor: "second-tied-click",
            node: {
              ...firstClick,
              clickId: "second-tied-click",
              matchedConversions: [
                { ...firstConversion, merchantName: "Second tied conversion", reportedAt },
              ],
            },
          },
        ],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
    },
    hasNext: false,
    isLoadingNext: false,
    loadNext: vi.fn(),
  } as never);

  renderRevenueSummaryRoute();

  const recent = screen.getByRole("region", { name: "Recent conversion" });

  expect(within(recent).getByText("First tied conversion")).toBeVisible();
  expect(within(recent).queryByText("Second tied conversion")).not.toBeInTheDocument();
});

test("revenue route surfaces attribution pagination failures and retries", () => {
  let attempt = 0;
  const loadNext = vi.fn(
    (_count: number, options?: { onComplete?: (error: Error | null) => void }) => {
      attempt += 1;
      options?.onComplete?.(attempt === 1 ? new Error("pagination failed") : null);
    },
  );

  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ currency: "USD" }));
  mockedUsePaginationFragment.mockReturnValue({
    data: ATTRIBUTION_LEDGER_PAGE,
    hasNext: true,
    isLoadingNext: false,
    loadNext,
  } as never);

  renderRevenueSummaryRoute();

  fireEvent.click(screen.getByRole("button", { name: "Load more attribution clicks" }));

  expect(screen.getByRole("alert")).toHaveTextContent("Unable to load more attribution clicks.");
  expect(loadNext).toHaveBeenLastCalledWith(
    ATTRIBUTION_LEDGER_PAGE_SIZE,
    expect.objectContaining({ onComplete: expect.any(Function) }),
  );

  fireEvent.click(screen.getByRole("button", { name: "Retry loading attribution clicks" }));

  expect(loadNext).toHaveBeenCalledTimes(2);
  expect(screen.queryByText("Unable to load more attribution clicks.")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Load more attribution clicks" })).toBeInTheDocument();
});

test("revenue route resets attribution pagination errors when filters change", () => {
  const loadNext = vi.fn(
    (_count: number, options?: { onComplete?: (error: Error | null) => void }) =>
      options?.onComplete?.(new Error("pagination failed")),
  );
  let loaderData = buildReadyLoaderData({ currency: "USD", network: "impact" });
  mockedUseLoaderData.mockImplementation(() => loaderData);
  mockedUsePaginationFragment.mockReturnValue({
    data: ATTRIBUTION_LEDGER_PAGE,
    hasNext: true,
    isLoadingNext: false,
    loadNext,
  } as never);

  const { rerender } = render(
    <MemoryRouter>
      <RevenueSummaryRoute />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Load more attribution clicks" }));
  expect(screen.getByText("Unable to load more attribution clicks.")).toBeInTheDocument();

  loaderData = buildReadyLoaderData({ currency: "EUR", network: "impact" });
  mockedUsePaginationFragment.mockReturnValue({
    data: ATTRIBUTION_LEDGER_PAGE,
    hasNext: true,
    isLoadingNext: false,
    loadNext: vi.fn(),
  } as never);

  rerender(
    <MemoryRouter>
      <RevenueSummaryRoute />
    </MemoryRouter>,
  );

  expect(screen.queryByText("Unable to load more attribution clicks.")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Load more attribution clicks" })).toBeInTheDocument();
});

test("revenue route distinguishes an anonymous click and an empty ledger", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ currency: "USD" }));
  mockedUsePaginationFragment.mockReturnValue({
    data: {
      commerceAttributionClicks: {
        edges: [
          {
            cursor: "ledger-cursor-anonymous",
            node: {
              ...ATTRIBUTION_LEDGER_PAGE.commerceAttributionClicks.edges[0].node,
              anonymousVisitor: true,
              matchedConversions: [],
              userEmail: null,
              userId: null,
            },
          },
        ],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
    },
    hasNext: false,
    isLoadingNext: false,
    loadNext: vi.fn(),
  } as never);

  const { rerender } = render(
    <MemoryRouter>
      <RevenueSummaryRoute />
    </MemoryRouter>,
  );

  expect(screen.getByText("Anonymous visitor")).toBeInTheDocument();
  expect(screen.getByText("No conversion")).toBeInTheDocument();
  expect(screen.getAllByText("—")).toHaveLength(2);
  expect(screen.getByText("No matched conversion in loaded activity")).toBeInTheDocument();
  const anonymousRow = screen.getByRole("row", { name: /Anonymous visitor/ });
  fireEvent.click(within(anonymousRow).getByRole("button", { name: /Show details/ }));
  expect(screen.getByText("No matched conversions")).toBeInTheDocument();

  mockedUsePaginationFragment.mockReturnValue({
    data: {
      commerceAttributionClicks: {
        edges: [],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
    },
    hasNext: false,
    isLoadingNext: false,
    loadNext: vi.fn(),
  } as never);
  rerender(
    <MemoryRouter>
      <RevenueSummaryRoute />
    </MemoryRouter>,
  );

  expect(screen.getByText("No attribution clicks match these filters.")).toBeInTheDocument();
});

test("revenue route keeps the summary visible when the ledger preload failed", () => {
  mockedUseLoaderData.mockReturnValue({
    ...buildReadyLoaderData({ currency: "USD" }),
    ledgerQuery: null,
  } as never);

  renderRevenueSummaryRoute();

  expect(screen.getByRole("region", { name: "Attribution performance" })).toBeVisible();
  expect(screen.getAllByRole("alert")).toHaveLength(2);
  expect(screen.getByText("Recent conversion unavailable.")).toBeVisible();
  expect(screen.getByText("Attribution ledger unavailable.")).toBeVisible();
});

test("revenue route keeps the attribution ledger visible when the summary preload failed", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    filters: { currency: "USD" },
    ledgerQuery: ATTRIBUTION_LEDGER_QUERY_DESCRIPTOR,
  } as never);

  renderRevenueSummaryRoute();

  expect(screen.getByRole("alert")).toHaveTextContent("Revenue summary unavailable.");
  expect(screen.getByRole("table", { name: "Attribution ledger" })).toBeVisible();
});

test("revenue route renders the summary while the ledger preload is pending", async () => {
  const ledgerPreload =
    deferredPromise<RelayRouteQueryDescriptor<AttributionLedgerRouteQuery$variables> | null>();
  mockedUseLoaderData.mockReturnValue({
    ...buildReadyLoaderData({ currency: "USD" }),
    ledgerQuery: ledgerPreload.promise,
  } as never);

  renderRevenueSummaryRoute();

  expect(screen.getByRole("region", { name: "Attribution performance" })).toBeVisible();
  expect(screen.getAllByRole("status")).toHaveLength(2);
  expect(screen.getByText("Loading recent conversion...")).toBeVisible();
  expect(screen.getByText("Loading attribution ledger...")).toBeVisible();
  expect(screen.queryByRole("table", { name: "Attribution ledger" })).not.toBeInTheDocument();

  await act(() => {
    ledgerPreload.resolve(ATTRIBUTION_LEDGER_QUERY_DESCRIPTOR);
  });

  expect(screen.getByRole("table", { name: "Attribution ledger" })).toBeVisible();
});

test("revenue route renders equal conversion references from different networks without key warnings", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const firstNode = ATTRIBUTION_LEDGER_PAGE.commerceAttributionClicks.edges[0].node;
  const firstConversion = firstNode.matchedConversions[0];

  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ currency: "USD" }));
  mockedUsePaginationFragment.mockReturnValue({
    data: {
      commerceAttributionClicks: {
        edges: [
          {
            cursor: "duplicate-conversion-ref",
            node: {
              ...firstNode,
              matchedConversions: [
                firstConversion,
                {
                  ...firstConversion,
                  affiliateNetworkCode: "awin",
                  affiliateNetworkId: "conversion-network-2",
                  affiliateNetworkName: "Second Conversion Network",
                },
              ],
            },
          },
        ],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
    },
    hasNext: false,
    isLoadingNext: false,
    loadNext: vi.fn(),
  } as never);

  try {
    renderRevenueSummaryRoute();

    const row = screen.getByRole("row", { name: /operator@example\.test/ });
    expect(within(row).getAllByText("Multiple")).toHaveLength(2);
    expect(within(row).getByText("2 conversions")).toBeVisible();
    fireEvent.click(within(row).getByRole("button", { name: /Show details/ }));
    expect(screen.getByText("Conversion Network")).toBeVisible();
    expect(screen.getByText("Second Conversion Network")).toBeVisible();
    expect(keyWarningCalls(consoleErrorSpy)).toHaveLength(0);
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("revenue route keeps attribution detail expansion local to each row", () => {
  const firstNode = ATTRIBUTION_LEDGER_PAGE.commerceAttributionClicks.edges[0].node;
  const secondNode = {
    ...firstNode,
    clickId: "second-click",
    insertedAt: "2026-05-31T12:45:00Z",
    userEmail: "second@example.test",
  };
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ currency: "USD" }));
  mockedUsePaginationFragment.mockReturnValue({
    data: {
      commerceAttributionClicks: {
        edges: [
          ATTRIBUTION_LEDGER_PAGE.commerceAttributionClicks.edges[0],
          { cursor: "ledger-cursor-2", node: secondNode },
        ],
        pageInfo: { endCursor: null, hasNextPage: false },
      },
    },
    hasNext: false,
    isLoadingNext: false,
    loadNext: vi.fn(),
  } as never);

  renderRevenueSummaryRoute();

  const firstRow = screen.getByRole("row", { name: /operator@example\.test/ });
  const secondRow = screen.getByRole("row", { name: /second@example\.test/ });
  fireEvent.click(within(firstRow).getByRole("button", { name: /Show details/ }));
  fireEvent.click(within(secondRow).getByRole("button", { name: /Show details/ }));

  expect(screen.getAllByRole("region", { name: /Attribution details for/ })).toHaveLength(2);
  fireEvent.click(within(firstRow).getByRole("button", { name: /Close details/ }));
  expect(screen.getAllByRole("region", { name: /Attribution details for/ })).toHaveLength(1);
  expect(
    screen.getByRole("region", { name: /Attribution details for second@example\.test/ }),
  ).toBeVisible();
});

test("revenue route renders one-conversion metrics without hidden-metrics copy", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      currency: "USD",
      network: "impact",
    }),
  );
  mockedUsePreloadedQuery.mockReturnValue({
    revenueSummary: {
      ...UNSUPPRESSED_REVENUE_SUMMARY.revenueSummary,
      metrics: {
        averagePaidPrice: "90.00",
        clicks: 1,
        commissionRevenue: "9.00",
        conversions: 1,
        currency: "USD",
        grossOrderValue: "90.00",
      },
    },
  } as never);

  renderRevenueSummaryRoute();

  const summary = screen.getByRole("region", { name: "Attribution performance" });
  const revenue = screen.getByRole("region", { name: "Revenue outcome" });
  expect(screen.getByRole("heading", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(within(summary).getByText("Clicks")).toBeInTheDocument();
  expect(within(summary).getAllByText("1")).toHaveLength(2);
  expect(within(revenue).getAllByText("90.00 USD")).toHaveLength(2);
  expect(screen.queryByText(/Revenue metrics are hidden/i)).not.toBeInTheDocument();
});

test("revenue route renders unavailable null counts when metrics are unsuppressed", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockedUsePreloadedQuery.mockReturnValue({
    revenueSummary: {
      ...UNSUPPRESSED_REVENUE_SUMMARY.revenueSummary,
      metrics: {
        ...UNSUPPRESSED_REVENUE_SUMMARY.revenueSummary.metrics,
        clicks: null,
        conversions: null,
      },
    },
  } as never);

  renderRevenueSummaryRoute();

  expect(screen.getAllByText("Not available")).toHaveLength(3);
});

test("revenue route renders unsuppressed revenue metrics", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  renderRevenueSummaryRoute();

  expect(screen.getByText("Clicks")).toBeInTheDocument();
  expect(screen.getByText("Conversions")).toBeInTheDocument();
  expect(screen.getAllByText("2")).toHaveLength(2);
  expect(screen.getByText("Gross order value")).toBeInTheDocument();
  expect(screen.getByText("200.00 USD")).toBeInTheDocument();
  expect(screen.getByText("Commission revenue")).toBeInTheDocument();
  expect(screen.getByText("20.00 USD")).toBeInTheDocument();
  expect(screen.getByText("Average paid price")).toBeInTheDocument();
  expect(screen.getByText("80.00 USD")).toBeInTheDocument();
});

test("revenue route preserves empty string revenue amounts", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockedUsePreloadedQuery.mockReturnValue({
    revenueSummary: {
      ...UNSUPPRESSED_REVENUE_SUMMARY.revenueSummary,
      metrics: {
        ...UNSUPPRESSED_REVENUE_SUMMARY.revenueSummary.metrics,
        grossOrderValue: "",
      },
    },
  } as never);

  renderRevenueSummaryRoute();

  const grossOrderMetric = screen.getByText("Gross order value").closest("div");

  expect(grossOrderMetric).not.toBeNull();
  expect(
    within(grossOrderMetric as HTMLElement).queryByText("Not available"),
  ).not.toBeInTheDocument();
  expect(within(grossOrderMetric as HTMLElement).getByText("USD")).toBeInTheDocument();
});

test("revenue route renders active filters from the loader", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      currency: "USD",
      from: "2026-05-01",
      network: "impact",
      to: "2026-05-31",
    }),
  );

  renderRevenueSummaryRoute();

  expect(screen.getByLabelText("Network")).toHaveValue("impact");
  expect(screen.getByLabelText("Currency")).toHaveValue("USD");
  expect(screen.getByLabelText("From")).toHaveValue("2026-05-01");
  expect(screen.getByLabelText("To")).toHaveValue("2026-05-31");
  const activeFilters = screen.getByRole("list", { name: "Active revenue filters" });

  expect(within(activeFilters).getByText("Network")).toBeInTheDocument();
  expect(within(activeFilters).getByText("impact")).toBeInTheDocument();
  expect(within(activeFilters).getByText("Date range")).toBeInTheDocument();
  expect(within(activeFilters).getByText("2026-05-01 to 2026-05-31")).toBeInTheDocument();
});

test("revenue route renders date preset links that preserve network and currency", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      currency: "USD",
      network: "impact",
    }),
  );
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));

  renderRevenueSummaryRoute();

  expect(screen.getByRole("link", { name: "Last 7 days" })).toHaveAttribute(
    "href",
    "/commerce/revenue?network=impact&currency=USD&from=2026-06-21&to=2026-06-27",
  );
  expect(screen.getByRole("link", { name: "Last 30 days" })).toHaveAttribute(
    "href",
    "/commerce/revenue?network=impact&currency=USD&from=2026-05-29&to=2026-06-27",
  );
  expect(screen.getByRole("link", { name: "Month to date" })).toHaveAttribute(
    "href",
    "/commerce/revenue?network=impact&currency=USD&from=2026-06-01&to=2026-06-27",
  );
  expect(screen.getByRole("link", { name: "Clear dates" })).toHaveAttribute(
    "href",
    "/commerce/revenue?network=impact&currency=USD",
  );

  vi.useRealTimers();
});

test("revenue date presets use the browser's local calendar day behind UTC", () => {
  const originalTimeZone = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";

  try {
    const links = buildRevenueDatePresetLinks(
      {
        network: "impact",
        currency: "USD",
      },
      new Date("2026-06-28T06:30:00.000Z"),
    );

    expect(links).toContainEqual({
      label: "Last 7 days",
      to: "/commerce/revenue?network=impact&currency=USD&from=2026-06-21&to=2026-06-27",
    });
    expect(links).toContainEqual({
      label: "Month to date",
      to: "/commerce/revenue?network=impact&currency=USD&from=2026-06-01&to=2026-06-27",
    });
  } finally {
    process.env.TZ = originalTimeZone;
  }
});

test("revenue date presets use the browser's local calendar day ahead of UTC", () => {
  const originalTimeZone = process.env.TZ;
  process.env.TZ = "Asia/Tokyo";

  try {
    const links = buildRevenueDatePresetLinks(
      {
        network: "impact",
        currency: "USD",
      },
      new Date("2026-06-27T16:30:00.000Z"),
    );

    expect(links).toContainEqual({
      label: "Last 7 days",
      to: "/commerce/revenue?network=impact&currency=USD&from=2026-06-22&to=2026-06-28",
    });
    expect(links).toContainEqual({
      label: "Month to date",
      to: "/commerce/revenue?network=impact&currency=USD&from=2026-06-01&to=2026-06-28",
    });
  } finally {
    process.env.TZ = originalTimeZone;
  }
});

test.each([
  ["America/Los_Angeles", "2026-06-28T06:30:00.000Z", "2026-06-27"],
  ["Asia/Tokyo", "2026-06-27T16:30:00.000Z", "2026-06-28"],
])(
  "revenue presets hydrate without mismatches and then use the %s local day",
  async (timeZone, currentTime, expectedTo) => {
    const originalTimeZone = process.env.TZ;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    process.env.TZ = "UTC";
    vi.useFakeTimers();
    vi.setSystemTime(new Date(currentTime));
    mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ currency: "USD" }));
    const container = document.createElement("div");
    let root: ReturnType<typeof hydrateRoot> | null = null;

    try {
      const app = (
        <MemoryRouter>
          <RevenueSummaryRoute />
        </MemoryRouter>
      );
      container.innerHTML = renderToString(app);
      document.body.append(container);
      process.env.TZ = timeZone;

      await act(async () => {
        root = hydrateRoot(container, app);
        await Promise.resolve();
      });
      expect(
        Array.from(container.querySelectorAll("a")).find(
          (link) => link.textContent === "Last 7 days",
        ),
      ).toHaveAttribute("href", expect.stringContaining(`to=${expectedTo}`));
      expect(
        consoleError.mock.calls.filter(([message]) => /hydrat/i.test(String(message))),
      ).toEqual([]);
    } finally {
      if (root) {
        await act(() => root?.unmount());
      }
      container.remove();
      vi.useRealTimers();
      process.env.TZ = originalTimeZone;
      consoleError.mockRestore();
    }
  },
);

test("buildRevenueDatePresetLinks is deterministic for a fixed date and preserves filters", () => {
  const currentDate = new Date("2026-06-27T12:00:00.000Z");
  const presetLinks = buildRevenueDatePresetLinks(
    {
      currency: "EUR",
      network: "impact",
    },
    currentDate,
  );

  expect(presetLinks).toEqual([
    {
      label: "Last 7 days",
      to: "/commerce/revenue?network=impact&currency=EUR&from=2026-06-21&to=2026-06-27",
    },
    {
      label: "Last 30 days",
      to: "/commerce/revenue?network=impact&currency=EUR&from=2026-05-29&to=2026-06-27",
    },
    {
      label: "Month to date",
      to: "/commerce/revenue?network=impact&currency=EUR&from=2026-06-01&to=2026-06-27",
    },
    {
      label: "Clear dates",
      to: "/commerce/revenue?network=impact&currency=EUR",
    },
  ]);
});

test("buildRevenueDatePresetLinks skips invalid ranges", () => {
  const currentDate = new Date("2026-06-27T12:00:00.000Z");
  const presetLinks = buildRevenueDatePresetLinks({}, currentDate);

  expect(presetLinks.length).toBe(4);
  expect(
    presetLinks.every((link) => {
      const url = new URL(link.to, "https://example.com");
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");
      return from === null || to === null || from <= to;
    }),
  ).toBe(true);
});

test("revenue route updates filter field values when loader filters change", () => {
  let loaderData = buildReadyLoaderData({
    currency: "USD",
    from: "2026-05-01",
    network: "impact",
    to: "2026-05-31",
  });
  mockedUseLoaderData.mockImplementation(() => loaderData);

  const { rerender } = render(
    <MemoryRouter>
      <RevenueSummaryRoute />
    </MemoryRouter>,
  );

  expect(screen.getByLabelText("Network")).toHaveValue("impact");
  expect(screen.getByLabelText("From")).toHaveValue("2026-05-01");
  expect(screen.getByLabelText("To")).toHaveValue("2026-05-31");
  const reportSummary = screen.getByRole("region", { name: "Attribution performance" });

  loaderData = buildReadyLoaderData({ currency: "USD" });
  rerender(
    <MemoryRouter>
      <RevenueSummaryRoute />
    </MemoryRouter>,
  );

  expect(screen.getByLabelText("Network")).toHaveValue("");
  expect(screen.getByLabelText("Currency")).toHaveValue("USD");
  expect(screen.getByLabelText("From")).toHaveValue("");
  expect(screen.getByLabelText("To")).toHaveValue("");
  expect(screen.getByRole("region", { name: "Attribution performance" })).toBe(reportSummary);
});

test("revenue route asks for a currency before loading metrics", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "needsCurrency",
    filters: {
      network: "impact",
    },
  } satisfies RevenueSummaryLoaderData);

  renderRevenueSummaryRoute();

  expect(screen.getByRole("heading", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Enter a currency code to load revenue metrics.",
  );
  expect(screen.getByLabelText("Network")).toHaveValue("impact");
  expect(screen.getByLabelText("Currency")).toHaveValue("");
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

test("revenue route asks for a valid date range before loading metrics", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "invalidDateRange",
    filters: {
      currency: "USD",
      from: "2026-06-01",
      to: "2026-05-31",
    },
  } satisfies RevenueSummaryLoaderData);

  renderRevenueSummaryRoute();

  expect(screen.getByRole("heading", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Enter a start date on or before the end date to load revenue metrics.",
  );
  expect(screen.getByLabelText("Currency")).toHaveValue("USD");
  expect(screen.getByLabelText("From")).toHaveValue("2026-06-01");
  expect(screen.getByLabelText("To")).toHaveValue("2026-05-31");
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

test("revenue route renders the loader error state", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    filters: {
      currency: "USD",
      network: "impact",
    },
    ledgerQuery: null,
  } satisfies RevenueSummaryLoaderData);

  renderRevenueSummaryRoute();

  expect(screen.getByRole("heading", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(screen.getByText("Revenue summary unavailable.")).toBeInTheDocument();
  expect(screen.getByText("Attribution ledger unavailable.")).toBeInTheDocument();
  expect(screen.getByLabelText("Network")).toHaveValue("impact");
  expect(screen.getByLabelText("Currency")).toHaveValue("USD");
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

function renderRevenueSummaryRoute() {
  render(
    <MemoryRouter>
      <RevenueSummaryRoute />
    </MemoryRouter>,
  );
}

function buildReadyLoaderData(
  filters: Extract<RevenueSummaryLoaderData, { status: "ready" }>["filters"] = {},
) {
  return {
    status: "ready",
    filters,
    query: {
      ...REVENUE_QUERY_DESCRIPTOR,
      __relayQuery: {
        ...REVENUE_QUERY_DESCRIPTOR.__relayQuery,
        variables: { input: filters },
      },
    },
    ledgerQuery: {
      ...ATTRIBUTION_LEDGER_QUERY_DESCRIPTOR,
      __relayQuery: {
        ...ATTRIBUTION_LEDGER_QUERY_DESCRIPTOR.__relayQuery,
        variables: {
          input: filters,
          after: null,
          first: ATTRIBUTION_LEDGER_PAGE_SIZE,
        },
      },
    },
  } satisfies RevenueSummaryLoaderData;
}

function keyWarningCalls(consoleErrorSpy: ReturnType<typeof vi.spyOn>) {
  return consoleErrorSpy.mock.calls.filter(
    ([message]: unknown[]) =>
      typeof message === "string" &&
      (message.includes("Encountered two children with the same key") ||
        message.includes('Each child in a list should have a unique "key" prop')),
  );
}

function deferredPromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}
