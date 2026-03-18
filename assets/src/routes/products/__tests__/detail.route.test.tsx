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
    id: "product-1",
    name: "Detail Product",
    slug: "detail-product",
    description: "A narrow product detail baseline.",
    brandName: "Acme"
  });

  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("query ProductDetail"),
    { slug: "detail-product" },
    undefined
  );
});

test("renders the product detail returned by the route loader", () => {
  mockedUseLoaderData.mockReturnValue({
    id: "product-1",
    name: "Detail Product",
    slug: "detail-product",
    description: "A narrow product detail baseline.",
    brandName: "Acme"
  });

  render(<ProductDetailRoute />);

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByText("Acme")).toBeInTheDocument();
  expect(screen.getByText("A narrow product detail baseline.")).toBeInTheDocument();
});
