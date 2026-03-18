import { render, screen } from "@testing-library/react";
import { fetchGraphQL } from "../../../relay/fetch-graphql";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import { browseLoader } from "../api";
import { BrowseRoute } from "../browse";

const { useLoaderDataMock } = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn()
}));

vi.mock("../../../relay/fetch-graphql", () => ({
  fetchGraphQL: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock
  };
});

const fetchGraphQLMock = vi.mocked(fetchGraphQL);
const mockedUseLoaderData = vi.mocked(useLoaderData);

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  useLoaderDataMock.mockReset();
});

test("browse loader requests and returns the first page of products", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
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
    }
  });

  await expect(
    browseLoader({
      request: new Request("https://app.example.com/products"),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "ready",
    products: [
      {
        id: "product-1",
        name: "Catalog First",
        slug: "catalog-first",
        brandName: "Acme"
      },
      {
        id: "product-2",
        name: "Catalog Second",
        slug: "catalog-second",
        brandName: "Globex"
      }
    ]
  });

  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("query BrowseProducts"),
    { first: 12 },
    undefined
  );

  expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);
});

test("browse loader forwards the SSR request to fetchGraphQL", async () => {
  const originalWindow = globalThis.window;

  fetchGraphQLMock.mockResolvedValue({
    data: {
      products: {
        edges: []
      }
    }
  });

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: undefined
  });

  try {
    const request = new Request("https://app.example.com/products");

    await expect(
      browseLoader({
        request,
        params: {},
        context: undefined
      } as LoaderFunctionArgs)
    ).resolves.toEqual({ status: "ready", products: [] });

    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("query BrowseProducts"),
      { first: 12 },
      { request }
    );
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow
    });
  }
});

test("browse loader falls back to an empty list for null GraphQL payloads", async () => {
  fetchGraphQLMock.mockResolvedValue(null as never);

  await expect(
    browseLoader({
      request: new Request("https://app.example.com/products"),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({ status: "ready", products: [] });

  expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);
});

test("browse loader marks GraphQL error payloads as unavailable", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
      products: {
        edges: []
      }
    },
    errors: [
      {
        message: "resolver failed"
      }
    ]
  });

  await expect(
    browseLoader({
      request: new Request("https://app.example.com/products"),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({ status: "error", products: [] });

  expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);
});

test("browse loader marks the catalog unavailable when the request fails", async () => {
  fetchGraphQLMock.mockRejectedValue(new Error("Network request failed: boom"));

  await expect(
    browseLoader({
      request: new Request("https://app.example.com/products"),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({ status: "error", products: [] });

  expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);
});

test("renders the browse products returned by the route loader", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    products: [
      {
        id: "product-1",
        name: "Catalog First",
        slug: "catalog-first",
        brandName: "Acme"
      },
      {
        id: "product-2",
        name: "Catalog Second",
        slug: "catalog-second",
        brandName: "Globex"
      }
    ]
  });

  render(<BrowseRoute />);

  expect(screen.getByRole("heading", { name: "Browse products" })).toBeInTheDocument();
  expect(screen.getByText("Catalog First")).toBeInTheDocument();
  expect(screen.getByText("Catalog Second")).toBeInTheDocument();
  expect(screen.getByText("catalog-first")).toBeInTheDocument();
  expect(screen.getByText("Acme")).toBeInTheDocument();
});

test("renders an empty-state message when no products are available", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    products: []
  });

  render(<BrowseRoute />);

  expect(screen.getByText("No products available yet.")).toBeInTheDocument();
});

test("renders an unavailable-state message when the catalog request fails", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    products: []
  });

  render(<BrowseRoute />);

  expect(screen.getByText("Catalog unavailable.")).toBeInTheDocument();
});
