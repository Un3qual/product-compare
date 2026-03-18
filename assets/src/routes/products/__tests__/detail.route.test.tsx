import { render, screen } from "@testing-library/react";
import { fetchGraphQL } from "../../../relay/fetch-graphql";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import { productDetailLoader } from "../api";
import { ProductDetailRoute } from "../detail";

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

test("product detail loader requests and returns product detail by slug", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
      product: {
        id: "product-1",
        name: "Detail Product",
        slug: "detail-product",
        description: "A narrow product detail baseline.",
        brand: {
          id: "brand-1",
          name: "Acme"
        }
      }
    }
  });

  await expect(
    productDetailLoader({
      request: new Request("https://app.example.com/products/detail-product"),
      params: { slug: "detail-product" },
      context: undefined
    } as unknown as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "ready",
    product: {
      id: "product-1",
      name: "Detail Product",
      slug: "detail-product",
      description: "A narrow product detail baseline.",
      brandName: "Acme"
    }
  });

  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("query ProductDetail"),
    { slug: "detail-product" },
    undefined
  );
});

test("product detail loader marks null product payloads as not found", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
      product: null
    }
  });

  await expect(
    productDetailLoader({
      request: new Request("https://app.example.com/products/missing-product"),
      params: { slug: "missing-product" },
      context: undefined
    } as unknown as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "not_found",
    product: null
  });
});

test("product detail loader marks rejected requests as unavailable", async () => {
  fetchGraphQLMock.mockRejectedValue(new Error("Network request failed: boom"));

  await expect(
    productDetailLoader({
      request: new Request("https://app.example.com/products/detail-product"),
      params: { slug: "detail-product" },
      context: undefined
    } as unknown as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "error",
    product: null
  });
});

test("renders the product detail returned by the route loader", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    product: {
      id: "product-1",
      name: "Detail Product",
      slug: "detail-product",
      description: "A narrow product detail baseline.",
      brandName: "Acme"
    }
  });

  render(<ProductDetailRoute />);

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByText("Acme")).toBeInTheDocument();
  expect(screen.getByText("A narrow product detail baseline.")).toBeInTheDocument();
});

test("renders a not-found message when the product detail loader misses", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "not_found",
    product: null
  });

  render(<ProductDetailRoute />);

  expect(screen.getByText("Product not found.")).toBeInTheDocument();
});

test("renders an unavailable message when the product detail request fails", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    product: null
  });

  render(<ProductDetailRoute />);

  expect(screen.getByText("Product unavailable.")).toBeInTheDocument();
});
