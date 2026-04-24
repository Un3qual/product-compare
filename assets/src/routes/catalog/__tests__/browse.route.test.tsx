import { render, screen } from "@testing-library/react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import { createRelayEnvironment } from "../../../relay/environment";
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
    text: "query BrowseProductsRouteQuery($first: Int!) { products(first: $first) { edges { node { id } } } }",
    variables: { first: 12 }
  }
};

beforeEach(() => {
  preloadRouteQueryMock.mockReset();
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
});

test("browse loader preloads and returns the Relay browse route query", async () => {
  const environment = createRelayEnvironment();

  mockedPreloadRouteQuery.mockReturnValue(browseQueryDescriptor);

  await expect(
    browseLoader({
      request: new Request("https://app.example.com/products"),
      params: {},
      context: createRelayRouterContext(environment)
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "ready",
    query: browseQueryDescriptor
  });

  expect(mockedPreloadRouteQuery).toHaveBeenCalledWith(environment, expect.anything(), { first: 12 });
});

test("browse loader marks the catalog unavailable when Relay preload fails", async () => {
  const environment = createRelayEnvironment();

  mockedPreloadRouteQuery.mockImplementation(() => {
    throw new Error("missing operation");
  });

  await expect(
    browseLoader({
      request: new Request("https://app.example.com/products"),
      params: {},
      context: createRelayRouterContext(environment)
    } as LoaderFunctionArgs)
  ).resolves.toEqual({ status: "error" });
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
