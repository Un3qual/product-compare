import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData, useRevalidator } from "react-router-dom";
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
  revalidateMock,
  useLoaderDataMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock,
  useRevalidatorMock,
} = vi.hoisted(() => ({
  preloadRouteQueryMock: vi.fn(),
  revalidateMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn(),
  useRevalidatorMock: vi.fn(),
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
  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
    useRevalidator: useRevalidatorMock,
  };
});
vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");
  return { ...actual, usePreloadedQuery: usePreloadedQueryMock };
});

const mockedPreloadRouteQuery = vi.mocked(preloadRouteQuery);
const mockedUseRevalidator = vi.mocked(useRevalidator);
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
  revalidateMock.mockReset();
  mockedUseLoaderData.mockReset();
  mockedUsePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReturnValue({} as never);
  mockedUseRevalidator.mockReturnValue({ revalidate: revalidateMock } as never);
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

test("home loader rethrows an aborted optional deals preload instead of returning null", async () => {
  const environment = createRelayEnvironment();
  const controller = new AbortController();
  const cancellation = new Error("Route load cancelled");
  controller.abort(cancellation);
  mockedPreloadRouteQuery
    .mockResolvedValueOnce(WORKSPACE_DESCRIPTOR)
    .mockRejectedValueOnce(new Error("deals request stopped"));

  const result = await homeLoader({
    context: createRelayRouterContext(environment),
    request: new Request("https://app.example/", { signal: controller.signal }),
  } as never);

  await expect(result.deals).rejects.toThrow("deals request stopped");
});

test("home workspace recovery keeps search, category entry, and retry independent", () => {
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
  expect(screen.getByRole("link", { name: "Browse categories and products" })).toHaveAttribute(
    "href",
    "/products?first=12",
  );
  fireEvent.click(screen.getByRole("button", { name: "Try products again" }));
  expect(revalidateMock).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("alert")).toHaveTextContent("Products are unavailable right now.");
});

test("home maps a rejected deferred deals descriptor to the local retry state", async () => {
  mockedUseLoaderData.mockReturnValue({
    workspace: WORKSPACE_DESCRIPTOR,
    deals: Promise.reject(new Error("deals unavailable")),
    selectedSlugs: [],
  });
  mockedUsePreloadedQuery.mockReturnValueOnce({
    homeWorkspace: { categories: [], selectedProducts: [], products: [] },
  } as never);

  render(
    <MemoryRouter>
      <HomeRoute />
    </MemoryRouter>,
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "New and trending offers are unavailable right now.",
  );
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(revalidateMock).toHaveBeenCalledTimes(1);
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

  const productResults = screen.getByRole("list", { name: "Product results" });
  expect(productResults).toBeInTheDocument();
  expect(within(productResults).getAllByRole("article")).toHaveLength(1);
  for (const label of [
    "Product",
    "Highlights",
    "Best offer",
    "Price signal",
    "Last checked",
    "Actions",
  ]) {
    expect(
      screen.getByText(label, {
        exact: true,
        selector: '[data-slot="home-ledger-headings"] span',
      }),
    ).toBeVisible();
  }
  expect(screen.queryByRole("columnheader")).not.toBeInTheDocument();
  expect(await screen.findByRole("tab", { name: "New" })).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    WORKSPACE_DESCRIPTOR,
  );
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(expect.anything(), DEALS_DESCRIPTOR);
  expect(screen.getByRole("tab", { name: "Trending" })).toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: "For you" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "More details" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});
