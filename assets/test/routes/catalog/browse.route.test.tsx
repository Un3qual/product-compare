import { render, screen, waitFor } from "@testing-library/react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { MemoryRouter, RouterContextProvider, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import { createOperationDescriptor } from "relay-runtime";
import { createRelayEnvironment } from "../../../src/relay/environment";
import browseProductsRouteQueryArtifact, {
  type BrowseProductsRouteQuery
} from "../../../src/__generated__/BrowseProductsRouteQuery.graphql";
import {
  createRelayRouterContext,
  preloadRouteQuery,
  useRoutePreloadedQuery
} from "../../../src/relay/route-preload";
import { browseLoader } from "../../../src/routes/catalog/loader";
import { BrowseRoute } from "../../../src/routes/catalog/browse";

const { preloadRouteQueryMock, useLoaderDataMock, usePreloadedQueryMock, useRoutePreloadedQueryMock } =
  vi.hoisted(() => ({
    preloadRouteQueryMock: vi.fn(),
    useLoaderDataMock: vi.fn(),
    usePreloadedQueryMock: vi.fn(),
    useRoutePreloadedQueryMock: vi.fn()
  }));

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload"
  );

  return {
    ...actual,
    preloadRouteQuery: preloadRouteQueryMock,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    usePreloadedQuery: usePreloadedQueryMock
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock
  };
});

const mockedPreloadRouteQuery = vi.mocked(preloadRouteQuery);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const browseQueryDescriptor = browseQueryDescriptorFromVariables();

const buildBrowseLoaderArgs = ({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.com/products")
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}): LoaderFunctionArgs => ({
  request,
  params: {},
  context: createRelayRouterContext(environment),
  unstable_pattern: "/products"
});

function browseQueryDescriptorFromVariables(
  variables: BrowseProductsRouteQuery["variables"] = { first: 12 }
) {
  return {
    __relayQuery: {
      operationName: "BrowseProductsRouteQuery",
      text: "query BrowseProductsRouteQuery($first: Int!, $after: String) { products(first: $first, after: $after) { edges { node { id } } } }",
      variables
    }
  };
}

function getBrowseProductsRouteQueryArtifact() {
  return browseProductsRouteQueryArtifact as {
    params?: {
      metadata?: {
        connection?: ReadonlyArray<{
          count?: string;
          cursor?: string;
          direction?: string;
          path?: ReadonlyArray<string>;
        }>;
      };
      text?: string | null;
    };
  };
}

function buildBrowseProductsConnection({
  endCursor,
  hasNextPage,
  products
}: {
  endCursor: string | null;
  hasNextPage: boolean;
  products: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}) {
  return {
    edges: products.map((product, index) => ({
      cursor: `cursor-${index + 1}`,
      node: {
        ...product,
        __typename: "Product",
        brand: {
          id: `brand-${product.id}`,
          name: `Brand for ${product.name}`
        }
      }
    })),
    pageInfo: {
      hasNextPage,
      endCursor
    }
  };
}

beforeEach(() => {
  preloadRouteQueryMock.mockReset();
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
});

test("browse loader preloads and returns the Relay browse route query", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products");

  mockedPreloadRouteQuery.mockResolvedValue(browseQueryDescriptor);

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    query: browseQueryDescriptor
  });

  expect(mockedPreloadRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal }
  );
});

test("browse loader defaults to a page size of 12 when first is omitted", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products");

  mockedPreloadRouteQuery.mockResolvedValue(browseQueryDescriptor);

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    query: browseQueryDescriptor
  });

  expect(mockedPreloadRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal }
  );
});

test("browse loader preserves supported first values from the URL", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?after=cursor-next-page&first=24");
  const queryDescriptorWithCursorAndFirst = browseQueryDescriptorFromVariables({
    first: 24,
    after: "cursor-next-page"
  });

  mockedPreloadRouteQuery.mockResolvedValue(queryDescriptorWithCursorAndFirst);

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    query: queryDescriptorWithCursorAndFirst
  });

  expect(mockedPreloadRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 24, after: "cursor-next-page" },
    { signal: request.signal }
  );
});

test("browse loader drops oversized first values above 48", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?first=100");

  mockedPreloadRouteQuery.mockResolvedValue(browseQueryDescriptor);

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    query: browseQueryDescriptor
  });

  expect(mockedPreloadRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal }
  );
});

test("browse loader drops first values that are not page-size options", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?first=35");

  mockedPreloadRouteQuery.mockResolvedValue(browseQueryDescriptor);

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    query: browseQueryDescriptor
  });

  expect(mockedPreloadRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal }
  );
});

test("browse loader drops malformed first values", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?first=12abc");

  mockedPreloadRouteQuery.mockResolvedValue(browseQueryDescriptor);

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    query: browseQueryDescriptor
  });

  expect(mockedPreloadRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal }
  );
});

test("browse loader forwards the requested pagination cursor", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?after=cursor-next-page");

  mockedPreloadRouteQuery.mockResolvedValue(browseQueryDescriptor);

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    query: browseQueryDescriptor
  });

  expect(mockedPreloadRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12, after: "cursor-next-page" },
    { signal: request.signal }
  );
});

test("browse loader marks the catalog unavailable when Relay preload fails", async () => {
  const environment = createRelayEnvironment();
  const preloadError = new Error("missing operation");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedPreloadRouteQuery.mockImplementation(() => {
    throw preloadError;
  });

  try {
    await expect(
      browseLoader(buildBrowseLoaderArgs({ environment }))
    ).resolves.toEqual({ status: "error" });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to preload browse products route query.", {
      error: preloadError
    });
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("browse loader rethrows missing Relay router context configuration errors", async () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    await expect(
      browseLoader({
        ...buildBrowseLoaderArgs(),
        context: new RouterContextProvider()
      })
    ).rejects.toThrow("Relay environment is missing from the route loader context");

    expect(mockedPreloadRouteQuery).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("browse loader rethrows aborted route preloads", async () => {
  const environment = createRelayEnvironment();
  const abortError = new DOMException("The operation was aborted.", "AbortError");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedPreloadRouteQuery.mockRejectedValue(abortError);

  try {
    await expect(
      browseLoader(buildBrowseLoaderArgs({ environment }))
    ).rejects.toBe(abortError);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("browse route query keeps URL-driven pages as separate store entries", () => {
  const artifact = getBrowseProductsRouteQueryArtifact();

  expect(artifact.params?.text).toContain("after: $after");
  expect(artifact.params?.text).toContain("pageInfo");
  expect(artifact.params?.text).toContain("hasNextPage");
  expect(artifact.params?.text).toContain("endCursor");
  expect(artifact.params?.text).not.toContain("__BrowseProductsRouteQuery_products_connection");
  expect(artifact.params?.metadata?.connection).toBeUndefined();
});

test("Relay store reads each URL-driven browse page without previous page edges", () => {
  const environment = createRelayEnvironment();
  const firstPageOperation = createOperationDescriptor(browseProductsRouteQueryArtifact, {
    first: 12
  });
  const secondPageOperation = createOperationDescriptor(browseProductsRouteQueryArtifact, {
    first: 12,
    after: "cursor-page-1"
  });

  environment.commitPayload(firstPageOperation, {
    products: buildBrowseProductsConnection({
      endCursor: "cursor-page-1",
      hasNextPage: true,
      products: [
        {
          id: "product-page-1",
          name: "Page One Product",
          slug: "page-one-product"
        }
      ]
    })
  });
  environment.commitPayload(secondPageOperation, {
    products: buildBrowseProductsConnection({
      endCursor: "cursor-page-2",
      hasNextPage: false,
      products: [
        {
          id: "product-page-2",
          name: "Page Two Product",
          slug: "page-two-product"
        }
      ]
    })
  });

  const pageTwoSnapshot = environment.lookup(secondPageOperation.fragment);
  const pageTwoProductIds = (
    pageTwoSnapshot.data as BrowseProductsRouteQuery["response"]
  ).products.edges.map(({ node }) => node.id);

  expect(pageTwoProductIds).toEqual(["product-page-2"]);
});

test("renders browse products from the Relay route query", () => {
  const queryRef = { dispose: vi.fn(), variables: { first: 12 } };

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "product-1",
            name: "Catalog First",
            slug: "catalog-first",
            brand: {
              id: "brand-1",
              name: "Acme"
            }
          }
        },
        {
          node: {
            id: "product-2",
            name: "Catalog Second",
            slug: "catalog-second",
            brand: {
              id: "brand-2",
              name: "Globex"
            }
          }
        }
      ],
      pageInfo: {
        hasNextPage: true,
        endCursor: "cursor-next-page"
      }
    }
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Browse products" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Products per page" })).toHaveValue("12");
  expect(screen.getByRole("link", { name: "Catalog First" })).toHaveAttribute(
    "href",
    "/products/catalog-first"
  );
  expect(screen.getByRole("link", { name: "Compare Catalog First" })).toHaveAttribute(
    "href",
    "/compare?slug=catalog-first"
  );
  expect(screen.getByRole("link", { name: "Offers for Catalog First" })).toHaveAttribute(
    "href",
    "/offers?productId=product-1"
  );
  expect(screen.getByRole("link", { name: "Compare Catalog Second" })).toHaveAttribute(
    "href",
    "/compare?slug=catalog-second"
  );
  expect(screen.getByRole("link", { name: "Offers for Catalog Second" })).toHaveAttribute(
    "href",
    "/offers?productId=product-2"
  );
  expect(screen.getByText("Catalog Second")).toBeInTheDocument();
  expect(screen.getByText("catalog-first")).toBeInTheDocument();
  expect(screen.getByText("Acme")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(expect.anything(), browseQueryDescriptor);
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(expect.anything(), queryRef);
});

test("renders selected page size and preserves first in pagination links", () => {
  const cursorDescriptor = {
    __relayQuery: {
      ...browseQueryDescriptor.__relayQuery,
      variables: { first: 24, after: "cursor-current-page" }
    }
  };
  const queryRef = { dispose: vi.fn(), variables: { first: 24, after: "cursor-current-page" } };

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: cursorDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "product-page-2",
            name: "Page Two Product",
            slug: "page-two-product",
            brand: {
              id: "brand-page-2",
              name: "Page Two Brand"
            }
          }
        }
      ],
      pageInfo: {
        hasNextPage: true,
        endCursor: "cursor-next-page"
      }
    }
  });

  render(
    <MemoryRouter initialEntries={["/products?after=cursor-current-page&first=24"]}>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("combobox", { name: "Products per page" })).toHaveValue("24");
  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=24&after=cursor-next-page"
  );
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=24"
  );
});

test("renders next and first-page pagination links from the browse query", () => {
  const cursorDescriptor = {
    __relayQuery: {
      ...browseQueryDescriptor.__relayQuery,
      variables: { first: 12, after: "cursor-current-page" }
    }
  };
  const queryRef = { dispose: vi.fn(), variables: { first: 12, after: "cursor-current-page" } };

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: cursorDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "product-page-2",
            name: "Page Two Product",
            slug: "page-two-product",
            brand: {
              id: "brand-page-2",
              name: "Page Two Brand"
            }
          }
        }
      ],
      pageInfo: {
        hasNextPage: true,
        endCursor: "cursor-next-page"
      }
    }
  });

  render(
    <MemoryRouter initialEntries={["/products?after=cursor-current-page"]}>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "Page Two Product" })).toHaveAttribute(
    "href",
    "/products/page-two-product"
  );
  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=12&after=cursor-next-page"
  );
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=12"
  );
});

test("omits browse pagination links on the first page when there is no next page", () => {
  const queryRef = { dispose: vi.fn(), variables: { first: 12 } };

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "product-final-page",
            name: "Final Page Product",
            slug: "final-page-product",
            brand: {
              id: "brand-final-page",
              name: "Final Page Brand"
            }
          }
        }
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null
      }
    }
  });

  render(
    <MemoryRouter initialEntries={["/products"]}>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "Final Page Product" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Next products" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "First products" })).not.toBeInTheDocument();
});

test("renders a local loading state while the Relay route query suspends", () => {
  const queryRef = { dispose: vi.fn(), variables: { first: 12 } };

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw Promise.race([]);
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("status")).toHaveTextContent("Loading catalog...");
});

test("renders a local unavailable state when the Relay route query errors", () => {
  const queryRef = { dispose: vi.fn(), variables: { first: 12 } };
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw new Error("Relay read failed");
  });

  try {
    render(
      <MemoryRouter>
        <BrowseRoute />
      </MemoryRouter>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Catalog unavailable.");
    expect(screen.getByText("Please refresh the page or try again later.")).toBeInTheDocument();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("resets the local unavailable state when fresh loader data arrives", async () => {
  const failedQueryRef = { dispose: vi.fn(), variables: { first: 12 } };
  const recoveredQueryRef = { dispose: vi.fn(), variables: { first: 12 } };
  const retryDescriptor = {
    __relayQuery: {
      ...browseQueryDescriptor.__relayQuery,
      variables: { ...browseQueryDescriptor.__relayQuery.variables }
    }
  };
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(failedQueryRef);
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw new Error("Relay read failed");
  });

  try {
    const view = render(
      <MemoryRouter>
        <BrowseRoute />
      </MemoryRouter>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Catalog unavailable.");

    mockedUseLoaderData.mockReturnValue({
      status: "ready",
      query: retryDescriptor
    });
    mockedUseRoutePreloadedQuery.mockReturnValue(recoveredQueryRef);
    mockedUsePreloadedQuery.mockReturnValue({
      products: {
        edges: [
          {
            node: {
              id: "product-recovered",
              name: "Recovered Product",
              slug: "recovered-product",
              brand: {
                id: "brand-recovered",
                name: "Recovered Brand"
              }
            }
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    });

    view.rerender(
      <MemoryRouter>
        <BrowseRoute />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Recovered Product" })).toHaveAttribute(
      "href",
      "/products/recovered-product"
    );
    expect(screen.getByRole("link", { name: "Compare Recovered Product" })).toHaveAttribute(
      "href",
      "/compare?slug=recovered-product"
    );
    expect(screen.getByRole("link", { name: "Offers for Recovered Product" })).toHaveAttribute(
      "href",
      "/offers?productId=product-recovered"
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("renders an empty-state message when the Relay query returns no products", () => {
  const queryRef = { dispose: vi.fn(), variables: { first: 12 } };

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockReturnValue({
    products: {
      edges: [],
      pageInfo: {
        hasNextPage: false,
        endCursor: null
      }
    }
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByText("No products available yet.")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Next products" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "First products" })).not.toBeInTheDocument();
});

test("keeps a next-page recovery link when an empty result has a next cursor", () => {
  const queryRef = { dispose: vi.fn(), variables: { first: 12 } };

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockReturnValue({
    products: {
      edges: [],
      pageInfo: {
        hasNextPage: true,
        endCursor: "cursor-without-products"
      }
    }
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByText("No products available yet.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=12&after=cursor-without-products"
  );
  expect(screen.queryByRole("link", { name: "First products" })).not.toBeInTheDocument();
});

test("keeps a first-page recovery link when a cursor page returns no products", () => {
  const cursorDescriptor = {
    __relayQuery: {
      ...browseQueryDescriptor.__relayQuery,
      variables: { first: 12, after: "stale-cursor" }
    }
  };
  const queryRef = { dispose: vi.fn(), variables: { first: 12, after: "stale-cursor" } };

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: cursorDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockReturnValue({
    products: {
      edges: [],
      pageInfo: {
        hasNextPage: false,
        endCursor: null
      }
    }
  });

  render(
    <MemoryRouter initialEntries={["/products?after=stale-cursor"]}>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByText("No products available yet.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=12"
  );
  expect(screen.queryByRole("link", { name: "Next products" })).not.toBeInTheDocument();
});

test("renders an unavailable-state message when the preload path fails", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error"
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Catalog unavailable.");
  expect(screen.getByText("Please refresh the page or try again later.")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});
