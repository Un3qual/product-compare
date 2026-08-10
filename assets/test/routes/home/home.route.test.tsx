import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import { createRelayEnvironment } from "../../../src/relay/environment";
import {
  createRelayRouterContext,
  preloadRouteQuery,
  useRoutePreloadedQuery,
} from "../../../src/relay/route-preload";
import { HomeRoute } from "../../../src/routes/home/HomeRoute";
import { homeLoader } from "../../../src/routes/home/loader";

const {
  preloadRouteQueryMock,
  useLoaderDataMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock,
} = vi.hoisted(() => ({
  preloadRouteQueryMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn(),
}));

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload",
  );
  return {
    ...actual,
    preloadRouteQuery: preloadRouteQueryMock,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock,
  };
});
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useLoaderData: useLoaderDataMock };
});
vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");
  return { ...actual, usePreloadedQuery: usePreloadedQueryMock };
});

const mockedPreloadRouteQuery = vi.mocked(preloadRouteQuery);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const WORKSPACE_DESCRIPTOR = {
  __relayQuery: {
    operationName: "HomeWorkspaceRouteQuery",
    text: null,
    variables: { selectedSlugs: ["model-1"] },
  },
};
const DEALS_DESCRIPTOR = {
  __relayQuery: {
    operationName: "HomeDealsRouteQuery",
    text: null,
    variables: { selectedSlugs: ["model-1"] },
  },
};

beforeEach(() => {
  mockedPreloadRouteQuery.mockReset();
  mockedUseLoaderData.mockReset();
  mockedUsePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReturnValue({} as never);
});

test("home loader keeps the essential SSR descriptor while deals fail independently", async () => {
  const environment = createRelayEnvironment();
  mockedPreloadRouteQuery
    .mockResolvedValueOnce(WORKSPACE_DESCRIPTOR)
    .mockRejectedValueOnce(new Error("deals unavailable"));

  const result = await homeLoader({
    context: createRelayRouterContext(environment),
    request: new Request("https://app.example/?slug=model-1&slug=model-2&slug=model-1"),
  } as never);

  expect(result.workspace).toBe(WORKSPACE_DESCRIPTOR);
  expect(result.selectedSlugs).toEqual(["model-1", "model-2"]);
  await expect(result.deals).resolves.toBeNull();
  expect(mockedPreloadRouteQuery).toHaveBeenCalledTimes(2);
  expect(mockedPreloadRouteQuery.mock.calls[0]?.[3]).toEqual({ signal: expect.any(AbortSignal) });
  expect(mockedPreloadRouteQuery.mock.calls[1]?.[3]).toEqual({ signal: expect.any(AbortSignal) });
});

test("home loader preserves an aborted essential workspace request", async () => {
  const environment = createRelayEnvironment();
  const abort = new DOMException("aborted", "AbortError");
  mockedPreloadRouteQuery.mockRejectedValueOnce(abort).mockResolvedValueOnce(DEALS_DESCRIPTOR);
  const controller = new AbortController();
  controller.abort(abort);

  await expect(
    homeLoader({
      context: createRelayRouterContext(environment),
      request: new Request("https://app.example/", { signal: controller.signal }),
    } as never),
  ).rejects.toBe(abort);
});

test("home retains search and category recovery when the workspace is unavailable", () => {
  mockedUseLoaderData.mockReturnValue({
    workspace: null,
    deals: Promise.resolve(null),
    selectedSlugs: [],
  });

  render(
    <MemoryRouter>
      <HomeRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("search", { name: "Search products" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Browse all products" })).toHaveAttribute(
    "href",
    "/products?first=12",
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Products are unavailable right now.");
});

test("home renders six desktop ledger headings, one semantic list, and plain deal tabs", async () => {
  mockedUseLoaderData.mockReturnValue({
    workspace: WORKSPACE_DESCRIPTOR,
    deals: Promise.resolve(DEALS_DESCRIPTOR),
    selectedSlugs: ["model-1"],
  });
  mockedUsePreloadedQuery
    .mockReturnValueOnce({
      homeWorkspace: {
        categories: [],
        selectedProducts: [{ id: "product-1", name: "Model 1", slug: "model-1" }],
        products: [
          {
            id: "product-1",
            name: "Model 1",
            slug: "model-1",
            highlights: [],
            offer: {
              merchantName: "Camera Shop",
              currency: "USD",
              landedPrice: "499.00",
              activeOfferCount: 1,
              priceSignal: "BELOW_30_DAY_MEDIAN",
              observedAt: "2026-08-10T12:00:00Z",
            },
          },
        ],
      },
    } as never)
    .mockReturnValueOnce({ homeDeals: { new: [], trending: [], forYou: [] } } as never);

  render(
    <MemoryRouter>
      <HomeRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("list", { name: "Product results" })).toBeInTheDocument();
  expect(screen.getAllByRole("columnheader").map((heading) => heading.textContent)).toEqual([
    "Product",
    "Highlights",
    "Best offer",
    "Price signal",
    "Last checked",
    "Actions",
  ]);
  expect(await screen.findByRole("tab", { name: "New" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Trending" })).toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: "For you" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "More details" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});
