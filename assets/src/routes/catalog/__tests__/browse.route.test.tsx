import { render, screen } from "@testing-library/react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import { createRelayEnvironment } from "../../../relay/environment";
import browseProductsRouteQueryArtifact from "../../../__generated__/BrowseProductsRouteQuery.graphql";
import {
  createRelayRouterContext,
  preloadRouteQuery,
  useRoutePreloadedQuery
} from "../../../relay/route-preload";
import { browseLoader } from "../loader";
import { BrowseRoute } from "../browse";

const { preloadRouteQueryMock, useLoaderDataMock, usePreloadedQueryMock, useRoutePreloadedQueryMock } =
  vi.hoisted(() => ({
    preloadRouteQueryMock: vi.fn(),
    useLoaderDataMock: vi.fn(),
    usePreloadedQueryMock: vi.fn(),
    useRoutePreloadedQueryMock: vi.fn()
  }));

vi.mock("../../../relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../relay/route-preload")>(
    "../../../relay/route-preload"
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

const browseQueryDescriptor = {
  __relayQuery: {
    operationName: "BrowseProductsRouteQuery",
    text: "query BrowseProductsRouteQuery($first: Int!, $after: String) { products(first: $first, after: $after) { edges { node { id } } } }",
    variables: { first: 12 }
  }
};

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

beforeEach(() => {
  preloadRouteQueryMock.mockReset();
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
});

test("browse loader preloads and returns the Relay browse route query", () => {
  const environment = createRelayEnvironment();

  mockedPreloadRouteQuery.mockReturnValue(browseQueryDescriptor);

  expect(
    browseLoader({
      request: new Request("https://app.example.com/products"),
      params: {},
      context: createRelayRouterContext(environment)
    } as LoaderFunctionArgs)
  ).toEqual({
    status: "ready",
    query: browseQueryDescriptor
  });

  expect(mockedPreloadRouteQuery).toHaveBeenCalledWith(environment, expect.anything(), { first: 12 });
});

test("browse loader marks the catalog unavailable when Relay preload fails", () => {
  const environment = createRelayEnvironment();
  const preloadError = new Error("missing operation");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedPreloadRouteQuery.mockImplementation(() => {
    throw preloadError;
  });

  try {
    expect(
      browseLoader({
        request: new Request("https://app.example.com/products"),
        params: {},
        context: createRelayRouterContext(environment)
      } as LoaderFunctionArgs)
    ).toEqual({ status: "error" });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to preload browse products route query.", {
      error: preloadError
    });
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("browse route query carries Relay connection pagination metadata", () => {
  const artifact = getBrowseProductsRouteQueryArtifact();

  expect(artifact.params?.text).toContain("after: $after");
  expect(artifact.params?.text).toContain("pageInfo");
  expect(artifact.params?.text).toContain("hasNextPage");
  expect(artifact.params?.text).toContain("endCursor");
  expect(artifact.params?.metadata?.connection).toEqual([
    expect.objectContaining({
      count: "first",
      cursor: "after",
      direction: "forward",
      path: ["products"]
    })
  ]);
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
      ]
    }
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Browse products" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Catalog First" })).toHaveAttribute(
    "href",
    "/products/catalog-first"
  );
  expect(screen.getByText("Catalog Second")).toBeInTheDocument();
  expect(screen.getByText("catalog-first")).toBeInTheDocument();
  expect(screen.getByText("Acme")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(expect.anything(), browseQueryDescriptor);
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(expect.anything(), queryRef);
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

test("renders an empty-state message when the Relay query returns no products", () => {
  const queryRef = { dispose: vi.fn(), variables: { first: 12 } };

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockReturnValue({
    products: {
      edges: []
    }
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByText("No products available yet.")).toBeInTheDocument();
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

  expect(screen.getByText("Catalog unavailable.")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});
