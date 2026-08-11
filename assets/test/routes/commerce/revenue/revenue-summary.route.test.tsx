import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useFragment, usePaginationFragment, usePreloadedQuery } from "react-relay";
import type { AttributionLedgerRouteQuery$variables } from "../../../../src/__generated__/AttributionLedgerRouteQuery.graphql";
import type { RevenueSummaryRouteQuery$variables } from "../../../../src/__generated__/RevenueSummaryRouteQuery.graphql";
import {
  type RelayRouteQueryDescriptor,
  useRoutePreloadedQuery,
} from "../../../../src/relay/route-preload";
import { RevenueSummaryRoute } from "../../../../src/routes/commerce/revenue/RevenueSummaryRoute";
import {
  RevenueSummaryMetrics,
  RevenueSummaryView,
} from "../../../../src/routes/commerce/revenue/RevenueSummaryView";
import type { RevenueSummaryLoaderData } from "../../../../src/routes/commerce/revenue/RevenueSummaryRoute";
import {
  ATTRIBUTION_LEDGER_PAGE_SIZE,
  buildRevenueDatePresetLinks,
} from "../../../../src/routes/commerce/revenue/revenue-summary-view-data";

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

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

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
    operationName: "RevenueSummaryRouteQuery",
    text: "query RevenueSummaryRouteQuery($input: RevenueSummaryInput) { revenueSummary(input: $input) { metrics { clicks } } }",
    variables: {
      input: null,
    },
  },
};

const ATTRIBUTION_LEDGER_QUERY_DESCRIPTOR: RelayRouteQueryDescriptor<AttributionLedgerRouteQuery$variables> =
  {
    __relayQuery: {
      operationName: "AttributionLedgerRouteQuery",
      text: "query AttributionLedgerRouteQuery($input: RevenueSummaryInput, $after: String, $first: Int!) { commerceAttributionClicks(input: $input, after: $after, first: $first) { edges { cursor } } }",
      variables: {
        input: null,
        after: null,
        first: ATTRIBUTION_LEDGER_PAGE_SIZE,
      },
    },
  };

const REVENUE_QUERY_REF = {
  dispose: vi.fn(),
  variables: REVENUE_QUERY_DESCRIPTOR.__relayQuery.variables,
};

const ATTRIBUTION_LEDGER_QUERY_REF = {
  dispose: vi.fn(),
  variables: ATTRIBUTION_LEDGER_QUERY_DESCRIPTOR.__relayQuery.variables,
};

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
          linkType: "affiliate",
          matchedConversions: [
            {
              affiliateNetworkCode: "partnerize",
              affiliateNetworkId: "conversion-network-1",
              affiliateNetworkName: "Conversion Network",
              attributionConfidence: "high",
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
              status: "paid",
            },
          ],
          merchantId: "merchant-1",
          merchantName: "Example Merchant",
          merchantProductExternalSku: "SKU-42",
          merchantProductId: "merchant-product-1",
          productId: "product-1",
          productName: "Example camera",
          referrer: "https://example.test/compare",
          sourceSurface: "web",
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
      <RevenueSummaryView
        activeFilters={[{ label: "Network", value: "impact" }]}
        datePresetLinks={[{ label: "Last 7 days", to: "/commerce/revenue?from=2026-07-05" }]}
        filters={{
          currency: "USD",
          from: "2026-07-05",
          network: "impact",
          to: "2026-07-11",
        }}
      >
        <RevenueSummaryMetrics metrics={[{ label: "Clicks", value: "12" }]} />
      </RevenueSummaryView>
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
  expect(screen.getByRole("region", { name: "Summary" })).toBeVisible();
});

test("revenue route identifies recorded attribution data as a preview", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  renderRevenueSummaryRoute();

  expect(screen.getByRole("heading", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Revenue report" })).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Revenue controls" })).toBeInTheDocument();
  expect(screen.getByText(/preview summarizes recorded attribution data/i)).toBeInTheDocument();
  expect(screen.getByText(/live conversion provider is not connected/i)).toBeInTheDocument();
});

test("revenue route renders individual click, user, request, network, and conversion evidence", () => {
  const loadNext = vi.fn();
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ currency: "USD", network: "impact" }));
  mockedUsePaginationFragment.mockReturnValue({
    data: ATTRIBUTION_LEDGER_PAGE,
    hasNext: true,
    isLoadingNext: false,
    loadNext,
  } as never);

  renderRevenueSummaryRoute();

  const summary = screen.getByRole("region", { name: "Summary" });
  const ledgerHeading = screen.getByRole("heading", { name: "Attribution ledger" });

  expect(
    summary.compareDocumentPosition(ledgerHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(screen.getByRole("table", { name: "Attribution ledger" })).toBeVisible();
  expect(screen.getByText("db8e90c9-c6f2-4f36-a67f-3324033ac114")).toBeInTheDocument();
  expect(screen.getByText("operator@example.test")).toBeInTheDocument();
  expect(screen.getByText("User ID: user-1")).toBeInTheDocument();
  expect(screen.getByText("https://example.test/compare")).toBeInTheDocument();
  expect(screen.getByText("ExampleBrowser/1.0")).toBeInTheDocument();
  expect(screen.getByText("203.0.113.44")).toBeInTheDocument();
  expect(screen.getByText("Impact (impact) [network-1]")).toBeInTheDocument();
  expect(screen.getByText("impact-conversion-123")).toBeInTheDocument();
  expect(screen.getByText("Order: 90.00 USD")).toBeInTheDocument();
  expect(screen.getByText("Commission: 9.00 USD")).toBeInTheDocument();
  expect(screen.getByText("Status: paid")).toBeInTheDocument();
  expect(screen.getByText("Attribution: high")).toBeInTheDocument();
  expect(screen.getByText("Conversion Merchant (conversion-merchant-1)")).toBeInTheDocument();
  expect(screen.getByText("Conversion Product (conversion-product-1)")).toBeInTheDocument();
  expect(
    screen.getByText("Conversion Network (partnerize) [conversion-network-1]"),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Load more attribution clicks" }));

  expect(loadNext).toHaveBeenCalledWith(
    ATTRIBUTION_LEDGER_PAGE_SIZE,
    expect.objectContaining({ onComplete: expect.any(Function) }),
  );
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
  expect(screen.getByText("No matched conversions.")).toBeInTheDocument();

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

  expect(screen.getByRole("region", { name: "Summary" })).toBeVisible();
  expect(screen.getByRole("alert")).toHaveTextContent("Attribution ledger unavailable.");
});

test("revenue route renders the summary while the ledger preload is pending", async () => {
  const ledgerPreload =
    deferredPromise<RelayRouteQueryDescriptor<AttributionLedgerRouteQuery$variables> | null>();
  mockedUseLoaderData.mockReturnValue({
    ...buildReadyLoaderData({ currency: "USD" }),
    ledgerQuery: ledgerPreload.promise,
  } as never);

  renderRevenueSummaryRoute();

  expect(screen.getByRole("region", { name: "Summary" })).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Loading attribution ledger...");
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

    expect(
      screen.getByText("Conversion Network (partnerize) [conversion-network-1]"),
    ).toBeVisible();
    expect(
      screen.getByText("Second Conversion Network (awin) [conversion-network-2]"),
    ).toBeVisible();
    expect(keyWarningCalls(consoleErrorSpy)).toHaveLength(0);
  } finally {
    consoleErrorSpy.mockRestore();
  }
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

  expect(screen.getByRole("heading", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(screen.getByText("Clicks")).toBeInTheDocument();
  expect(screen.getAllByText("1")).toHaveLength(2);
  expect(screen.getAllByText("90.00 USD")).toHaveLength(2);
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

  expect(screen.getAllByText("Not available")).toHaveLength(2);
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
  const reportSummary = screen.getByRole("region", { name: "Summary" });

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
  expect(screen.getByRole("region", { name: "Summary" })).toBe(reportSummary);
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
  } satisfies RevenueSummaryLoaderData);

  renderRevenueSummaryRoute();

  expect(screen.getByRole("heading", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Revenue summary unavailable.");
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
