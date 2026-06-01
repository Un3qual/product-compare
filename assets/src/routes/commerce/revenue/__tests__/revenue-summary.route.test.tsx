import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../../relay/route-preload";
import { RevenueSummaryRoute } from "../index";
import type { RevenueSummaryLoaderData } from "../loader";

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

vi.mock("../../../../relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../relay/route-preload")>(
    "../../../../relay/route-preload"
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

  expect(screen.getByRole("heading", { name: "Revenue reporting" })).toBeInTheDocument();
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

  expect(screen.getByRole("heading", { name: "Revenue reporting" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Enter a currency code to load revenue metrics."
  );
  expect(screen.getByLabelText("Network")).toHaveValue("impact");
  expect(screen.getByLabelText("Currency")).toHaveValue("");
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

  expect(screen.getByRole("heading", { name: "Revenue reporting" })).toBeInTheDocument();
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
