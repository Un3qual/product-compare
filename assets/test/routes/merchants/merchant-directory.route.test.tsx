import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../src/relay/route-preload";
import { MerchantDirectoryRoute } from "../../../src/routes/merchants/index";
import type { MerchantDirectoryLoaderData } from "../../../src/routes/merchants/loader";

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

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload"
  );

  return {
    ...actual,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const MERCHANT_DIRECTORY_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "MerchantDirectoryRouteQuery",
    text: "query MerchantDirectoryRouteQuery($first: Int, $after: String) { merchants(first: $first, after: $after) { edges { node { id } } } }",
    variables: {
      first: 20,
      after: null
    }
  }
};

const MERCHANT_DIRECTORY_QUERY_REF = {
  dispose: vi.fn(),
  variables: MERCHANT_DIRECTORY_QUERY_DESCRIPTOR.__relayQuery.variables
};

beforeEach(() => {
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  MERCHANT_DIRECTORY_QUERY_REF.dispose.mockReset();
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockedUseRoutePreloadedQuery.mockReturnValue(MERCHANT_DIRECTORY_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue(buildMerchantDirectoryData());
});

test("merchant directory renders merchant names and domains", () => {
  renderMerchantDirectoryRoute();

  expect(screen.getByRole("heading", { name: "Merchants" })).toBeInTheDocument();
  const merchantList = screen.getByRole("list", { name: "Merchants" });

  expect(within(merchantList).getByText("Acme Market")).toBeInTheDocument();
  expect(within(merchantList).getByText("acme.example")).toBeInTheDocument();
  expect(within(merchantList).getByText("Globex Supply")).toBeInTheDocument();
  expect(within(merchantList).getByText("globex.example")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    MERCHANT_DIRECTORY_QUERY_DESCRIPTOR
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    MERCHANT_DIRECTORY_QUERY_REF
  );
});

test("merchant directory renders an empty state", () => {
  mockedUsePreloadedQuery.mockReturnValue(buildMerchantDirectoryData({ merchants: [] }));

  renderMerchantDirectoryRoute();

  expect(screen.getByRole("heading", { name: "Merchants" })).toBeInTheDocument();
  expect(screen.getByText("No merchants available yet.")).toBeInTheDocument();
});

test("merchant directory renders next-page navigation when available", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 30,
      after: "previous-cursor"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildMerchantDirectoryData({
      endCursor: "next-cursor",
      hasNextPage: true
    })
  );

  renderMerchantDirectoryRoute();

  expect(screen.getByRole("link", { name: "Next merchants" })).toHaveAttribute(
    "href",
    "/merchants?first=30&after=next-cursor"
  );
});

test("merchant directory renders first-page navigation when cursor-paged", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 30,
      after: "cursor-1"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildMerchantDirectoryData({
      hasPreviousPage: true,
      startCursor: "cursor-2"
    })
  );

  expect(screen.queryByRole("link", { name: "First merchants" })).not.toBeInTheDocument();

  renderMerchantDirectoryRoute();

  expect(screen.getByRole("link", { name: "First merchants" })).toHaveAttribute(
    "href",
    "/merchants"
  );
});

test("merchant directory renders the loader error state", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    pagination: {
      first: 20,
      after: null
    }
  } satisfies MerchantDirectoryLoaderData);

  renderMerchantDirectoryRoute();

  expect(screen.getByRole("heading", { name: "Merchants" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Merchant directory unavailable.");
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

function renderMerchantDirectoryRoute() {
  render(
    <MemoryRouter>
      <MerchantDirectoryRoute />
    </MemoryRouter>
  );
}

function buildReadyLoaderData(
  pagination: Extract<MerchantDirectoryLoaderData, { status: "ready" }>["pagination"] = {
    first: 20,
    after: null
  }
) {
  return {
    status: "ready",
    pagination,
    query: MERCHANT_DIRECTORY_QUERY_DESCRIPTOR
  } satisfies MerchantDirectoryLoaderData;
}

function buildMerchantDirectoryData({
  endCursor = "cursor-2",
  hasNextPage = false,
  hasPreviousPage = false,
  merchants = [
    {
      id: "merchant-1",
      name: "Acme Market",
      domain: "acme.example"
    },
    {
      id: "merchant-2",
      name: "Globex Supply",
      domain: "globex.example"
    }
  ],
  startCursor = merchants.length === 0 ? null : "cursor-1"
}: {
  endCursor?: string | null;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  merchants?: Array<{ id: string; name: string; domain: string }>;
  startCursor?: string | null;
} = {}) {
  return {
    merchants: {
      edges: merchants.map((merchant, index) => ({
        cursor: `cursor-${index + 1}`,
        node: merchant
      })),
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor,
        endCursor
      }
    }
  };
}
