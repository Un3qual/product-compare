import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../../src/relay/route-preload";
import {
  RevenueSummaryRoute,
  buildRevenueDatePresetLinks
} from "../../../../src/routes/commerce/revenue/RevenueSummaryRoute";
import {
  RevenueSummaryMetrics,
  RevenueSummaryView
} from "../../../../src/routes/commerce/revenue/RevenueSummaryView";
import type { RevenueSummaryLoaderData } from "../../../../src/routes/commerce/revenue/loader";

const {
  useLoaderDataMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    usePreloadedQuery: usePreloadedQueryMock
  };
});

vi.mock("../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/relay/route-preload")>(
    "../../../../src/relay/route-preload"
  );

  return {
    ...actual,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const REVENUE_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "RevenueSummaryRouteQuery",
    text: "query RevenueSummaryRouteQuery($input: RevenueSummaryInput) { revenueSummary(input: $input) { metrics { clicks } } }",
    variables: {
      input: null
    }
  }
};

const REVENUE_QUERY_REF = {
  dispose: vi.fn(),
  variables: REVENUE_QUERY_DESCRIPTOR.__relayQuery.variables
};

const UNSUPPRESSED_REVENUE_SUMMARY = {
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
};

beforeEach(() => {
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  REVENUE_QUERY_REF.dispose.mockReset();
  mockedUseRoutePreloadedQuery.mockReturnValue(REVENUE_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue(UNSUPPRESSED_REVENUE_SUMMARY as never);
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
          to: "2026-07-11"
        }}
      >
        <RevenueSummaryMetrics
          metrics={[{ label: "Clicks", value: "12" }]}
          suppression={{ suppressed: false, threshold: 2 }}
        />
      </RevenueSummaryView>
    </MemoryRouter>
  );

  expect(screen.getByRole("form", { name: "Revenue filters" })).toBeVisible();
  expect(screen.getByLabelText("Network")).toHaveValue("impact");
  expect(screen.getByLabelText("Currency")).toHaveValue("USD");
  expect(screen.getByLabelText("From")).toHaveValue("2026-07-05");
  expect(screen.getByLabelText("To")).toHaveValue("2026-07-11");
  expect(screen.getByRole("button", { name: "Apply filters" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
    "href",
    "/commerce/revenue"
  );
  expect(screen.getByRole("list", { name: "Revenue date presets" })).toBeVisible();
  expect(screen.getByRole("list", { name: "Active revenue filters" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Summary" })).toBeVisible();
});

test("revenue route identifies recorded attribution data as a preview", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  renderRevenueSummaryRoute();

  expect(
    screen.getByRole("heading", { name: "Revenue reporting preview" })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "Revenue reporting preview" })
  ).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Revenue report" })).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Revenue controls" })).toBeInTheDocument();
  expect(screen.getByText(/preview summarizes recorded attribution data/i)).toBeInTheDocument();
  expect(screen.getByText(/live conversion provider is not connected/i)).toBeInTheDocument();
});

test("revenue route renders suppressed metrics with threshold copy", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      currency: "USD",
      network: "impact"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue({
    revenueSummary: {
      ...UNSUPPRESSED_REVENUE_SUMMARY.revenueSummary,
      metrics: {
        averagePaidPrice: null,
        clicks: null,
        commissionRevenue: null,
        conversions: null,
        currency: null,
        grossOrderValue: null
      },
      suppression: {
        suppressed: true,
        threshold: 2
      }
    }
  } as never);

  renderRevenueSummaryRoute();

  expect(screen.getByRole("heading", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Revenue metrics are hidden until at least 2 conversions match the current filters."
  );
  expect(screen.getByText("Clicks")).toBeInTheDocument();
  expect(screen.getAllByText("Hidden")).toHaveLength(5);
  expect(screen.queryByText("20.00 USD")).not.toBeInTheDocument();
});

test("revenue route renders unavailable null counts when metrics are unsuppressed", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockedUsePreloadedQuery.mockReturnValue({
    revenueSummary: {
      ...UNSUPPRESSED_REVENUE_SUMMARY.revenueSummary,
      metrics: {
        ...UNSUPPRESSED_REVENUE_SUMMARY.revenueSummary.metrics,
        clicks: null,
        conversions: null
      }
    }
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
        grossOrderValue: ""
      }
    }
  } as never);

  renderRevenueSummaryRoute();

  const grossOrderMetric = screen.getByText("Gross order value").closest("div");

  expect(grossOrderMetric).not.toBeNull();
  expect(within(grossOrderMetric as HTMLElement).queryByText("Not available")).not.toBeInTheDocument();
  expect(within(grossOrderMetric as HTMLElement).getByText("USD")).toBeInTheDocument();
});

test("revenue route renders active filters from the loader", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      currency: "USD",
      from: "2026-05-01",
      network: "impact",
      to: "2026-05-31"
    })
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
      network: "impact"
    })
  );
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));

  renderRevenueSummaryRoute();

  expect(screen.getByRole("link", { name: "Last 7 days" })).toHaveAttribute(
    "href",
    "/commerce/revenue?network=impact&currency=USD&from=2026-06-21&to=2026-06-27"
  );
  expect(screen.getByRole("link", { name: "Last 30 days" })).toHaveAttribute(
    "href",
    "/commerce/revenue?network=impact&currency=USD&from=2026-05-29&to=2026-06-27"
  );
  expect(screen.getByRole("link", { name: "Month to date" })).toHaveAttribute(
    "href",
    "/commerce/revenue?network=impact&currency=USD&from=2026-06-01&to=2026-06-27"
  );
  expect(screen.getByRole("link", { name: "Clear dates" })).toHaveAttribute(
    "href",
    "/commerce/revenue?network=impact&currency=USD"
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
        currency: "USD"
      },
      new Date("2026-06-28T06:30:00.000Z")
    );

    expect(links).toContainEqual({
      label: "Last 7 days",
      to: "/commerce/revenue?network=impact&currency=USD&from=2026-06-21&to=2026-06-27"
    });
    expect(links).toContainEqual({
      label: "Month to date",
      to: "/commerce/revenue?network=impact&currency=USD&from=2026-06-01&to=2026-06-27"
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
        currency: "USD"
      },
      new Date("2026-06-27T16:30:00.000Z")
    );

    expect(links).toContainEqual({
      label: "Last 7 days",
      to: "/commerce/revenue?network=impact&currency=USD&from=2026-06-22&to=2026-06-28"
    });
    expect(links).toContainEqual({
      label: "Month to date",
      to: "/commerce/revenue?network=impact&currency=USD&from=2026-06-01&to=2026-06-28"
    });
  } finally {
    process.env.TZ = originalTimeZone;
  }
});

test("buildRevenueDatePresetLinks is deterministic for a fixed date and preserves filters", () => {
  const currentDate = new Date("2026-06-27T12:00:00.000Z");
  const presetLinks = buildRevenueDatePresetLinks(
    {
      currency: "EUR",
      network: "impact"
    },
    currentDate
  );

  expect(presetLinks).toEqual([
    {
      label: "Last 7 days",
      to: "/commerce/revenue?network=impact&currency=EUR&from=2026-06-21&to=2026-06-27"
    },
    {
      label: "Last 30 days",
      to: "/commerce/revenue?network=impact&currency=EUR&from=2026-05-29&to=2026-06-27"
    },
    {
      label: "Month to date",
      to: "/commerce/revenue?network=impact&currency=EUR&from=2026-06-01&to=2026-06-27"
    },
    {
      label: "Clear dates",
      to: "/commerce/revenue?network=impact&currency=EUR"
    }
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
    })
  ).toBe(true);
});

test("revenue route updates filter field values when loader filters change", () => {
  mockedUseLoaderData.mockReturnValueOnce(
    buildReadyLoaderData({
      currency: "USD",
      from: "2026-05-01",
      network: "impact",
      to: "2026-05-31"
    })
  );
  mockedUseLoaderData.mockReturnValueOnce(buildReadyLoaderData({ currency: "USD" }));

  const { rerender } = render(
    <MemoryRouter>
      <RevenueSummaryRoute />
    </MemoryRouter>
  );

  expect(screen.getByLabelText("Network")).toHaveValue("impact");
  expect(screen.getByLabelText("From")).toHaveValue("2026-05-01");
  expect(screen.getByLabelText("To")).toHaveValue("2026-05-31");

  rerender(
    <MemoryRouter>
      <RevenueSummaryRoute />
    </MemoryRouter>
  );

  expect(screen.getByLabelText("Network")).toHaveValue("");
  expect(screen.getByLabelText("Currency")).toHaveValue("USD");
  expect(screen.getByLabelText("From")).toHaveValue("");
  expect(screen.getByLabelText("To")).toHaveValue("");
});

test("revenue route asks for a currency before loading metrics", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "needsCurrency",
    filters: {
      network: "impact"
    }
  } satisfies RevenueSummaryLoaderData);

  renderRevenueSummaryRoute();

  expect(screen.getByRole("heading", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Enter a currency code to load revenue metrics."
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
      to: "2026-05-31"
    }
  } satisfies RevenueSummaryLoaderData);

  renderRevenueSummaryRoute();

  expect(screen.getByRole("heading", { name: "Revenue reporting preview" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Enter a start date on or before the end date to load revenue metrics."
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
      network: "impact"
    }
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
    </MemoryRouter>
  );
}

function buildReadyLoaderData(
  filters: Extract<RevenueSummaryLoaderData, { status: "ready" }>["filters"] = {}
) {
  return {
    status: "ready",
    filters,
    query: REVENUE_QUERY_DESCRIPTOR
  } satisfies RevenueSummaryLoaderData;
}
