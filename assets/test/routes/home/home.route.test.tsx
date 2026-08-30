import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { MemoryRouter, useLoaderData, useRevalidator } from "react-router-dom";
import { useFragment, usePreloadedQuery } from "react-relay";
import { createRelayEnvironment } from "../../../src/relay/environment";
import {
  createRelayRouterContext,
  preloadRouteQuery,
  useRoutePreloadedQuery,
} from "../../../src/relay/route-preload";
import { HomeRoute, homeLoader } from "../../../src/routes/home/HomeRoute";
import { HomeDeals } from "../../../src/routes/home/HomeDeals";

const {
  preloadRouteQueryMock,
  disposeDealsQueryMock,
  loadDealsQueryMock,
  revalidateMock,
  useLoaderDataMock,
  useFragmentMock,
  usePreloadedQueryMock,
  useQueryLoaderMock,
  useRoutePreloadedQueryMock,
  useRevalidatorMock,
} = vi.hoisted(() => ({
  preloadRouteQueryMock: vi.fn(),
  disposeDealsQueryMock: vi.fn(),
  loadDealsQueryMock: vi.fn(),
  revalidateMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useFragmentMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useQueryLoaderMock: vi.fn(),
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
  return {
    ...actual,
    useFragment: useFragmentMock,
    usePreloadedQuery: usePreloadedQueryMock,
    useQueryLoader: useQueryLoaderMock,
  };
});

const mockedPreloadRouteQuery = vi.mocked(preloadRouteQuery);
const mockedUseRevalidator = vi.mocked(useRevalidator);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseFragment = vi.mocked(useFragment);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const WORKSPACE_DESCRIPTOR = {
  __relayQuery: {
    cacheID: "HomeRouteQuery-cache-id",
    operationName: "HomeRouteQuery",
    variables: { first: 6, selectedSlugs: ["model-1"] },
  },
};
const DEALS_DESCRIPTOR = {
  __relayQuery: {
    cacheID: "HomeDealsQuery-cache-id",
    operationName: "HomeDealsQuery",
    variables: { first: 6, selectedSlugs: ["model-1"] },
  },
};
const HOME_REFERENCE_TIME = "2026-08-12T12:00:00.000Z";

beforeEach(() => {
  mockedPreloadRouteQuery.mockReset();
  revalidateMock.mockReset();
  mockedUseLoaderData.mockReset();
  mockedUseFragment.mockReset();
  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => fragmentRef as never);
  mockedUsePreloadedQuery.mockReset();
  useQueryLoaderMock.mockReset();
  mockedUseRoutePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReturnValue({} as never);
  mockedUseRevalidator.mockReturnValue({ revalidate: revalidateMock } as never);
  useQueryLoaderMock.mockReturnValue([null, loadDealsQueryMock, disposeDealsQueryMock]);
  loadDealsQueryMock.mockReset();
  disposeDealsQueryMock.mockReset();
});

test("home loader returns only serializable essential workspace state", async () => {
  const environment = createRelayEnvironment();
  mockedPreloadRouteQuery.mockResolvedValueOnce(WORKSPACE_DESCRIPTOR);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(HOME_REFERENCE_TIME));

  try {
    const result = await homeLoader({
      context: createRelayRouterContext(environment),
      request: new Request("https://app.example/?slug=model-1&slug=model-2&slug=model-1"),
    } as never);

    expect(result.workspace).toBe(WORKSPACE_DESCRIPTOR);
    expect(result.referenceTime).toBe(HOME_REFERENCE_TIME);
    expect(result.selectedSlugs).toEqual(["model-1", "model-2"]);
    expect(result).not.toHaveProperty("deals");
    expect(mockedPreloadRouteQuery).toHaveBeenCalledTimes(1);
    expect(mockedPreloadRouteQuery.mock.calls[0]?.[2]).toEqual({
      first: 6,
      selectedSlugs: ["model-1", "model-2"],
    });
    expect(mockedPreloadRouteQuery.mock.calls[0]?.[3]).toEqual({ signal: expect.any(AbortSignal) });
  } finally {
    vi.useRealTimers();
  }
});

test("home loader preserves an aborted essential workspace request", async () => {
  const environment = createRelayEnvironment();
  const abort = new DOMException("aborted", "AbortError");
  mockedPreloadRouteQuery.mockRejectedValueOnce(abort);
  const controller = new AbortController();
  controller.abort(abort);

  await expect(
    homeLoader({
      context: createRelayRouterContext(environment),
      request: new Request("https://app.example/", { signal: controller.signal }),
    } as never),
  ).rejects.toBe(abort);
});

test("home workspace recovery keeps search, category entry, and retry independent", () => {
  mockedUseLoaderData.mockReturnValue({
    referenceTime: HOME_REFERENCE_TIME,
    workspace: null,
    selectedSlugs: [],
  });

  render(
    <MemoryRouter>
      <HomeRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("search", { name: "Search products" })).toBeInTheDocument();
  expect(screen.getByText("Search products, brands, or model numbers")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Browse categories and products" })).toHaveAttribute(
    "href",
    "/products?first=12",
  );
  fireEvent.click(screen.getByRole("button", { name: "Try products again" }));
  expect(revalidateMock).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("alert")).toHaveTextContent("Products are unavailable right now.");
});

test("home actions use the canonical resolved comparison instead of stale URL slugs", () => {
  mockedUseLoaderData.mockReturnValue({
    referenceTime: HOME_REFERENCE_TIME,
    workspace: WORKSPACE_DESCRIPTOR,
    selectedSlugs: ["missing-1", "missing-2", "missing-3"],
  });
  mockedUsePreloadedQuery.mockReturnValueOnce({
    homeWorkspace: {
      categories: { edges: [] },
      selectedProducts: [],
      products: {
        edges: [
          {
            cursor: "cursor-1",
            node: { id: "product-1", name: "Model 1", slug: "model-1" },
            highlights: [],
            offer: {
              merchantName: "Camera Shop",
              currency: "USD",
              landedPrice: "499.00",
              priceSignal: "BELOW_30_DAY_MEDIAN",
              observedAt: "2026-08-10T12:00:00Z",
            },
          },
        ],
      },
    },
  } as never);

  render(
    <MemoryRouter>
      <HomeRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "Add to comparison" })).toHaveAttribute(
    "href",
    "/?slug=model-1",
  );
  expect(screen.queryByRole("link", { name: "Comparison is full" })).not.toBeInTheDocument();
});

test("home maps a rejected client deals query to the local retry state", async () => {
  mockedUseLoaderData.mockReturnValue({
    referenceTime: HOME_REFERENCE_TIME,
    workspace: WORKSPACE_DESCRIPTOR,
    selectedSlugs: [],
  });
  useQueryLoaderMock.mockReturnValue([DEALS_DESCRIPTOR, loadDealsQueryMock, disposeDealsQueryMock]);
  mockedUsePreloadedQuery
    .mockReturnValueOnce({
      homeWorkspace: {
        categories: { edges: [] },
        selectedProducts: [],
        products: { edges: [] },
      },
    } as never)
    .mockImplementationOnce(() => {
      throw new Error("deals unavailable");
    });

  render(
    <MemoryRouter>
      <HomeRoute />
    </MemoryRouter>,
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "New and trending offers are unavailable right now.",
  );
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(loadDealsQueryMock).toHaveBeenCalledTimes(2);
});

test("home keeps missing and malformed price observations explicitly unavailable", () => {
  mockedUseLoaderData.mockReturnValue({
    referenceTime: HOME_REFERENCE_TIME,
    workspace: WORKSPACE_DESCRIPTOR,
    selectedSlugs: [],
  });
  mockedUsePreloadedQuery.mockReturnValueOnce({
    homeWorkspace: {
      categories: { edges: [] },
      selectedProducts: [],
      products: {
        edges: [
          {
            cursor: "missing-observation",
            node: { id: "missing", name: "Missing observation", slug: "missing" },
            highlights: [],
            offer: {
              merchantName: "Camera Shop",
              currency: "USD",
              landedPrice: "499.00",
              priceSignal: "BELOW_30_DAY_MEDIAN",
              observedAt: null,
            },
          },
          {
            cursor: "invalid-observation",
            node: { id: "invalid", name: "Invalid observation", slug: "invalid" },
            highlights: [],
            offer: {
              merchantName: "Camera Shop",
              currency: "USD",
              landedPrice: "599.00",
              priceSignal: "BELOW_30_DAY_MEDIAN",
              observedAt: "not-a-date",
            },
          },
        ],
      },
    },
  } as never);

  render(
    <MemoryRouter>
      <HomeRoute />
    </MemoryRouter>,
  );

  expect(screen.getAllByText("Last checked unavailable")).toHaveLength(2);
  expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
});

test("home advances offer recency while the route remains mounted", async () => {
  vi.useFakeTimers();

  try {
    vi.setSystemTime(new Date(HOME_REFERENCE_TIME));
    mockedUseLoaderData.mockReturnValue({
      referenceTime: HOME_REFERENCE_TIME,
      workspace: WORKSPACE_DESCRIPTOR,
      selectedSlugs: [],
    });
    mockedUsePreloadedQuery.mockReturnValueOnce({
      homeWorkspace: {
        categories: { edges: [] },
        selectedProducts: [],
        products: {
          edges: [
            {
              cursor: "recent-observation",
              node: { id: "recent", name: "Recent observation", slug: "recent" },
              highlights: [],
              offer: {
                merchantName: "Camera Shop",
                currency: "USD",
                landedPrice: "499.00",
                priceSignal: "BELOW_30_DAY_MEDIAN",
                observedAt: "2026-08-12T11:59:00Z",
              },
            },
          ],
        },
      },
    } as never);
    const view = render(
      <MemoryRouter>
        <HomeRoute />
      </MemoryRouter>,
    );

    try {
      expect(screen.getByText("Last checked 1 minute ago")).toBeVisible();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(screen.getByText("Last checked 2 minutes ago")).toBeVisible();
    } finally {
      view.unmount();
    }
  } finally {
    vi.useRealTimers();
  }
});

test("home preserves every workspace row with category and fallback market context", () => {
  mockedUseLoaderData.mockReturnValue({
    referenceTime: HOME_REFERENCE_TIME,
    workspace: WORKSPACE_DESCRIPTOR,
    selectedSlugs: ["model-1"],
  });
  const products = Array.from({ length: 7 }, (_, index) => ({
    cursor: `workspace-product-${index + 1}`,
    node: {
      id: `product-${index + 1}`,
      name: `Model ${index + 1}`,
      slug: `model-${index + 1}`,
    },
    highlights: [],
    offer: {
      merchantName: "Camera Shop",
      currency: "USD",
      landedPrice: "499.00",
      priceSignal: "BELOW_30_DAY_MEDIAN",
      observedAt: "2026-08-10T12:00:00Z",
    },
  }));
  products[1] = {
    ...products[1],
    offer: {
      ...products[1].offer,
      landedPrice: "9007199254740993.005",
      merchantName: "Exact Shop",
      priceSignal: "%future-price-signal",
    },
  };
  mockedUsePreloadedQuery.mockReturnValueOnce({
    homeWorkspace: {
      categories: {
        edges: [
          {
            node: {
              id: "category-cameras",
              name: "Cameras",
              slug: "cameras",
              description: "Capture stills and video.",
            },
          },
        ],
      },
      selectedProducts: [{ id: "product-1", name: "Model 1", slug: "model-1" }],
      products: { edges: products },
    },
  } as never);

  render(
    <MemoryRouter>
      <HomeRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "Cameras" })).toHaveAttribute(
    "href",
    "/products?first=12&typeTaxonId=category-cameras&includeTypeDescendants=1&slug=model-1",
  );
  const productResults = screen.getByRole("list", { name: "Product results" });
  expect(within(productResults).getAllByRole("article")).toHaveLength(7);
  expect(
    within(within(productResults).getByRole("article", { name: "Model 2" })).getByText(
      "$9,007,199,254,740,993.01 at Exact Shop",
    ),
  ).toBeVisible();
  expect(
    within(within(productResults).getByRole("article", { name: "Model 2" })).getByText(
      "No 30-day price history",
    ),
  ).toBeVisible();
});

test("home renders typed deal reasons and safe fallback copy for guests", async () => {
  mockedUseLoaderData.mockReturnValue({
    referenceTime: HOME_REFERENCE_TIME,
    workspace: WORKSPACE_DESCRIPTOR,
    selectedSlugs: [],
  });
  useQueryLoaderMock.mockReturnValue([DEALS_DESCRIPTOR, loadDealsQueryMock, disposeDealsQueryMock]);
  mockedUsePreloadedQuery
    .mockReturnValueOnce({
      homeWorkspace: {
        categories: { edges: [] },
        selectedProducts: [],
        products: { edges: [] },
      },
    } as never)
    .mockReturnValueOnce({
      homeDeals: {
        new: {
          edges: [
            {
              cursor: "watch-deal",
              node: { id: "watch-product", name: "Watched Model", slug: "watched-model" },
              offer: {
                merchantName: "Watch Shop",
                currency: "USD",
                landedPrice: "450.00",
                observedAt: "2026-08-10T12:00:00Z",
              },
              reasons: [{ code: "WATCH_TARGET", watchTarget: "500.00" }],
            },
          ],
        },
        trending: {
          edges: [
            {
              cursor: "fallback-deal",
              node: { id: "fallback-product", name: "Fallback Model", slug: "fallback-model" },
              offer: {
                merchantName: "Fallback Shop",
                currency: "USD",
                landedPrice: "550.00",
                observedAt: "2026-08-10T12:00:00Z",
              },
              reasons: [{ code: "%future-reason", watchTarget: null }],
            },
          ],
        },
        forYou: {
          edges: [
            {
              cursor: "personal-deal",
              node: { id: "personal-product", name: "Personal Model", slug: "personal-model" },
              offer: {
                merchantName: "Personal Shop",
                currency: "USD",
                landedPrice: "650.00",
                observedAt: "2026-08-10T12:00:00Z",
              },
              reasons: [],
            },
          ],
        },
      },
    } as never);

  render(
    <MemoryRouter>
      <HomeRoute />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Matches your $500.00 price watch")).toBeVisible();
  expect(screen.queryByRole("tab", { name: "For you" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Trending" }));
  expect(await screen.findByText("Current offer")).toBeVisible();
  expect(screen.queryByText("%future-reason")).not.toBeInTheDocument();
});

test("home keeps new and trending empty states available to guests", async () => {
  mockedUseLoaderData.mockReturnValue({
    referenceTime: HOME_REFERENCE_TIME,
    workspace: WORKSPACE_DESCRIPTOR,
    selectedSlugs: [],
  });
  useQueryLoaderMock.mockReturnValue([DEALS_DESCRIPTOR, loadDealsQueryMock, disposeDealsQueryMock]);
  mockedUsePreloadedQuery
    .mockReturnValueOnce({
      homeWorkspace: {
        categories: { edges: [] },
        selectedProducts: [],
        products: { edges: [] },
      },
    } as never)
    .mockReturnValueOnce({
      homeDeals: {
        new: { edges: [] },
        trending: { edges: [] },
        forYou: { edges: [] },
      },
    } as never);

  render(
    <MemoryRouter>
      <HomeRoute />
    </MemoryRouter>,
  );

  expect(await screen.findByText("No new offers to show yet.")).toBeVisible();
  expect(screen.getByRole("tab", { name: "Trending" })).toBeVisible();
  expect(screen.queryByRole("tab", { name: "For you" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Trending" }));
  expect(await screen.findByText("No trending offers to show yet.")).toBeVisible();
});

test("home keeps the optional deals loading shell stable through hydration and client success", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const container = document.createElement("div");
  let root: ReturnType<typeof hydrateRoot> | null = null;

  mockedUseLoaderData.mockReturnValue({
    referenceTime: HOME_REFERENCE_TIME,
    workspace: WORKSPACE_DESCRIPTOR,
    selectedSlugs: [],
  });
  useQueryLoaderMock.mockReturnValue([DEALS_DESCRIPTOR, loadDealsQueryMock, disposeDealsQueryMock]);
  mockHomeQueryResults();

  try {
    const app = (
      <MemoryRouter>
        <HomeRoute />
      </MemoryRouter>
    );
    container.innerHTML = renderToString(app);
    document.body.append(container);

    expect(container).toHaveTextContent("Loading new and trending offers...");
    expect(container.querySelector("template[data-msg]")).not.toBeInTheDocument();

    await act(async () => {
      root = hydrateRoot(container, app);
      await Promise.resolve();
    });

    expect(within(container).getByRole("tab", { name: "New" })).toBeVisible();
    expect(consoleError.mock.calls.filter(([message]) => /hydrat/i.test(String(message)))).toEqual(
      [],
    );
    expect(loadDealsQueryMock).toHaveBeenCalledWith(
      { first: 6, selectedSlugs: [] },
      { fetchPolicy: "network-only" },
    );
  } finally {
    if (root) await act(() => root?.unmount());
    container.remove();
    consoleError.mockRestore();
  }
});

test("HomeDeals does not reload when an equivalent slug array is rerendered", async () => {
  const view = render(<HomeDeals hasViewer={false} selectedSlugs={["model-1", "model-2"]} />);

  await waitFor(() => expect(loadDealsQueryMock).toHaveBeenCalledTimes(1));

  view.rerender(<HomeDeals hasViewer={false} selectedSlugs={["model-1", "model-2"]} />);

  await act(() => Promise.resolve());
  expect(loadDealsQueryMock).toHaveBeenCalledTimes(1);
});

test("HomeDeals reloads once when normalized slug values change", async () => {
  const view = render(<HomeDeals hasViewer={false} selectedSlugs={["model-1"]} />);

  await waitFor(() => expect(loadDealsQueryMock).toHaveBeenCalledTimes(1));

  view.rerender(<HomeDeals hasViewer={false} selectedSlugs={["model-1", "model-2"]} />);

  await waitFor(() => expect(loadDealsQueryMock).toHaveBeenCalledTimes(2));
  expect(loadDealsQueryMock).toHaveBeenLastCalledWith(
    { first: 6, selectedSlugs: ["model-1", "model-2"] },
    { fetchPolicy: "network-only" },
  );
});

test("home keeps the workspace available while the client deals query fails", async () => {
  mockedUseLoaderData.mockReturnValue({
    referenceTime: HOME_REFERENCE_TIME,
    workspace: WORKSPACE_DESCRIPTOR,
    selectedSlugs: [],
  });
  useQueryLoaderMock.mockReturnValue([DEALS_DESCRIPTOR, loadDealsQueryMock, disposeDealsQueryMock]);
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => descriptor as never);
  mockedUsePreloadedQuery
    .mockReturnValueOnce({
      homeWorkspace: {
        categories: { edges: [] },
        selectedProducts: [],
        products: { edges: [] },
      },
    } as never)
    .mockImplementationOnce(() => {
      throw new Error("deals unavailable");
    });

  render(
    <MemoryRouter>
      <HomeRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Products to compare" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Products to compare" })).toBeVisible();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "New and trending offers are unavailable right now.",
  );
});

test("home renders a decision-led product list and restrained deal rows", async () => {
  mockedUseLoaderData.mockReturnValue({
    referenceTime: HOME_REFERENCE_TIME,
    workspace: WORKSPACE_DESCRIPTOR,
    selectedSlugs: ["model-1"],
  });
  useQueryLoaderMock.mockReturnValue([DEALS_DESCRIPTOR, loadDealsQueryMock, disposeDealsQueryMock]);
  mockedUsePreloadedQuery
    .mockReturnValueOnce({
      homeWorkspace: {
        categories: { edges: [] },
        selectedProducts: [{ id: "product-1", name: "Model 1", slug: "model-1" }],
        products: {
          edges: [
            {
              cursor: "cursor-1",
              node: { id: "product-1", name: "Model 1", slug: "model-1" },
              highlights: [],
              offer: {
                merchantName: "Camera Shop",
                currency: "USD",
                landedPrice: "499.00",
                priceSignal: "BELOW_30_DAY_MEDIAN",
                observedAt: "2026-08-10T12:00:00Z",
              },
            },
          ],
        },
      },
    } as never)
    .mockReturnValueOnce({
      homeDeals: {
        new: {
          edges: [
            {
              cursor: "deal-cursor-1",
              node: { id: "product-2", name: "Model 2", slug: "model-2" },
              offer: {
                merchantName: "Camera Shop",
                currency: "USD",
                landedPrice: "399.00",
                observedAt: "2026-08-10T12:00:00Z",
              },
              reasons: [{ code: "NEW_OFFER", watchTarget: null }],
            },
          ],
        },
        trending: { edges: [] },
        forYou: { edges: [] },
      },
    } as never);

  render(
    <MemoryRouter>
      <HomeRoute />
    </MemoryRouter>,
  );

  const productResults = screen.getByRole("list", { name: "Product results" });
  expect(productResults).toBeInTheDocument();
  expect(within(productResults).getAllByRole("article")).toHaveLength(1);
  const product = within(productResults).getByRole("article", { name: "Model 1" });
  expect(product.querySelector('[data-slot="product-ledger-summary"]')).toHaveTextContent(
    "Model 1Details available on the product page",
  );
  expect(product.querySelector('[data-slot="product-ledger-market"]')).toHaveTextContent(
    "$499.00 at Camera ShopBelow the 30-day priceLast checked 2 days ago",
  );
  expect(screen.queryByText("Highlights", { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByText("Price signal", { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByText("Actions", { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByRole("columnheader")).not.toBeInTheDocument();
  expect(await screen.findByRole("tab", { name: "New" })).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    WORKSPACE_DESCRIPTOR,
  );
  expect(screen.getByRole("tab", { name: "Trending" })).toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: "For you" })).not.toBeInTheDocument();
  expect(within(product).queryByRole("button", { name: "More details" })).not.toBeInTheDocument();
  expect(within(product).getByRole("link", { name: "View details" })).not.toHaveAttribute(
    "data-slot",
    "button",
  );
  const newOffers = screen.getByRole("list", { name: "New offers" });
  expect(newOffers).toHaveAttribute("data-slot", "home-deals-list");
  expect(within(newOffers).getByRole("listitem")).toHaveAttribute("data-slot", "home-deals-item");
  expect(within(newOffers).getByRole("link", { name: "Model 2" })).toHaveAttribute(
    "data-slot",
    "home-deals-link",
  );
  expect(within(newOffers).getByText("$399.00 at Camera Shop")).toHaveAttribute(
    "data-slot",
    "home-deals-offer",
  );
  expect(within(newOffers).getByText("New offer")).toHaveAttribute(
    "data-slot",
    "home-deals-reason",
  );
});

function mockHomeQueryResults() {
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => descriptor as never);
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    const operationName = (queryRef as unknown as { __relayQuery: { operationName: string } })
      .__relayQuery.operationName;

    if (operationName === "HomeRouteQuery") {
      return {
        homeWorkspace: {
          categories: { edges: [] },
          selectedProducts: [],
          products: { edges: [] },
        },
      } as never;
    }

    return {
      homeDeals: {
        forYou: { edges: [] },
        new: { edges: [] },
        trending: { edges: [] },
      },
    } as never;
  });
}
