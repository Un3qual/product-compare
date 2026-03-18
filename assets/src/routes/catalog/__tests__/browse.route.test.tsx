import { render, screen, waitFor } from "@testing-library/react";
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

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("query BrowseProducts"),
      { first: 12 },
      undefined
    );
  });

  expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);
});

test("renders the browse products returned by the route loader", () => {
  mockedUseLoaderData.mockReturnValue({
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
