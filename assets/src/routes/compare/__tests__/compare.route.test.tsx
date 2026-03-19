import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { fetchGraphQL } from "../../../relay/fetch-graphql";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import { compareLoader } from "../api";
import { CompareRoute } from "../index";

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
const DETAIL_PRODUCT = {
  id: "UHJvZHVjdDox",
  name: "Detail Product",
  slug: "detail-product",
  description: "A narrow product detail baseline.",
  brand: {
    id: "brand-1",
    name: "Acme"
  }
} as const;
const SECOND_PRODUCT = {
  id: "UHJvZHVjdDoy",
  name: "Second Product",
  slug: "second-product",
  description: "Another product for comparison.",
  brand: {
    id: "brand-2",
    name: "Bravo"
  }
} as const;

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  useLoaderDataMock.mockReset();
});

function buildProductDetailResponse(product: typeof DETAIL_PRODUCT | typeof SECOND_PRODUCT) {
  return {
    data: {
      product: {
        ...product
      }
    }
  };
}

test("compare loader returns an empty state when no slugs are selected", async () => {
  await expect(
    compareLoader({
      request: new Request("https://app.example.com/compare"),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "empty",
    slugs: []
  });
});

test("compare loader rejects more than three selected slugs", async () => {
  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=one&slug=two&slug=three&slug=four"
      ),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "too_many",
    slugs: ["one", "two", "three", "four"]
  });
});

test("compare loader requests selected product details and preserves URL order", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce(buildProductDetailResponse(DETAIL_PRODUCT))
    .mockResolvedValueOnce(buildProductDetailResponse(SECOND_PRODUCT));

  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=detail-product&slug=second-product"
      ),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "ready",
    slugs: ["detail-product", "second-product"],
    products: [
      {
        id: DETAIL_PRODUCT.id,
        name: DETAIL_PRODUCT.name,
        slug: DETAIL_PRODUCT.slug,
        description: DETAIL_PRODUCT.description,
        brandName: DETAIL_PRODUCT.brand.name
      },
      {
        id: SECOND_PRODUCT.id,
        name: SECOND_PRODUCT.name,
        slug: SECOND_PRODUCT.slug,
        description: SECOND_PRODUCT.description,
        brandName: SECOND_PRODUCT.brand.name
      }
    ]
  });

  expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("query ProductDetail"),
    { slug: "detail-product" },
    undefined
  );
  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    2,
    expect.stringContaining("query ProductDetail"),
    { slug: "second-product" },
    undefined
  );
});

test("compare loader forwards the request when running in server mode", async () => {
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product"
  );
  const originalWindow = globalThis.window;

  vi.stubGlobal("window", undefined);
  fetchGraphQLMock
    .mockResolvedValueOnce(buildProductDetailResponse(DETAIL_PRODUCT))
    .mockResolvedValueOnce(buildProductDetailResponse(SECOND_PRODUCT));

  try {
    await expect(
      compareLoader({
        request,
        params: {},
        context: undefined
      } as LoaderFunctionArgs)
    ).resolves.toEqual({
      status: "ready",
      slugs: ["detail-product", "second-product"],
      products: [
        {
          id: DETAIL_PRODUCT.id,
          name: DETAIL_PRODUCT.name,
          slug: DETAIL_PRODUCT.slug,
          description: DETAIL_PRODUCT.description,
          brandName: DETAIL_PRODUCT.brand.name
        },
        {
          id: SECOND_PRODUCT.id,
          name: SECOND_PRODUCT.name,
          slug: SECOND_PRODUCT.slug,
          description: SECOND_PRODUCT.description,
          brandName: SECOND_PRODUCT.brand.name
        }
      ]
    });
  } finally {
    vi.stubGlobal("window", originalWindow);
  }

  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("query ProductDetail"),
    { slug: "detail-product" },
    { request }
  );
  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    2,
    expect.stringContaining("query ProductDetail"),
    { slug: "second-product" },
    { request }
  );
});

test("compare loader returns not_found when any selected product is missing", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce(buildProductDetailResponse(DETAIL_PRODUCT))
    .mockResolvedValueOnce({
      data: {
        product: null
      }
    });

  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=detail-product&slug=missing-product"
      ),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "not_found",
    slugs: ["detail-product", "missing-product"]
  });
});

test("compare loader returns error when any selected product request fails", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce(buildProductDetailResponse(DETAIL_PRODUCT))
    .mockRejectedValueOnce(new Error("Network request failed: boom"));

  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=detail-product&slug=broken-product"
      ),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "error",
    slugs: ["detail-product", "broken-product"]
  });
});

test("compare loader returns error when a rejected request is mixed with a missing product", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce({
      data: {
        product: null
      }
    })
    .mockRejectedValueOnce(new Error("Network request failed: boom"));

  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=missing-product&slug=broken-product"
      ),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "error",
    slugs: ["missing-product", "broken-product"]
  });
});

test("renders an empty-state message when no products are selected", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    slugs: []
  });

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByText("Choose up to 3 products to compare.")).toBeInTheDocument();
});

test("renders a limit message when more than three products are selected", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "too_many",
    slugs: ["one", "two", "three", "four"]
  });

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByText("You can compare up to 3 products.")).toBeInTheDocument();
});

test("renders compared product cards returned by the route loader", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    slugs: ["detail-product", "second-product"],
    products: [
      {
        id: DETAIL_PRODUCT.id,
        name: DETAIL_PRODUCT.name,
        slug: DETAIL_PRODUCT.slug,
        description: DETAIL_PRODUCT.description,
        brandName: DETAIL_PRODUCT.brand.name
      },
      {
        id: SECOND_PRODUCT.id,
        name: SECOND_PRODUCT.name,
        slug: SECOND_PRODUCT.slug,
        description: SECOND_PRODUCT.description,
        brandName: SECOND_PRODUCT.brand.name
      }
    ]
  });

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Second Product" })).toBeInTheDocument();
});

test("compare route saves the current ready-state selection", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
      createSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1",
          name: "Detail Product vs Second Product",
          items: []
        },
        errors: []
      }
    }
  });

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    slugs: ["detail-product", "second-product"],
    products: [
      {
        id: DETAIL_PRODUCT.id,
        name: DETAIL_PRODUCT.name,
        slug: DETAIL_PRODUCT.slug,
        description: DETAIL_PRODUCT.description,
        brandName: DETAIL_PRODUCT.brand.name
      },
      {
        id: SECOND_PRODUCT.id,
        name: SECOND_PRODUCT.name,
        slug: SECOND_PRODUCT.slug,
        description: SECOND_PRODUCT.description,
        brandName: SECOND_PRODUCT.brand.name
      }
    ]
  });

  render(<CompareRoute />);

  fireEvent.click(screen.getByRole("button", { name: /save comparison/i }));

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation CreateSavedComparisonSet"),
      {
        input: {
          name: "Detail Product vs Second Product",
          productIds: [DETAIL_PRODUCT.id, SECOND_PRODUCT.id]
        }
      }
    );
  });
});

test("renders a not-found message when any selected product is missing", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "not_found",
    slugs: ["detail-product", "missing-product"]
  });

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByText("One or more selected products were not found.")).toBeInTheDocument();
});

test("renders an unavailable message when compare loading fails", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    slugs: ["detail-product", "broken-product"]
  });

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByText("Comparison unavailable.")).toBeInTheDocument();
});
