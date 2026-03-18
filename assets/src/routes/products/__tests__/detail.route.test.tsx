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
  fetchGraphQLMock
    .mockResolvedValueOnce({
      data: {
        product: {
          id: "UHJvZHVjdDox",
          name: "Detail Product",
          slug: "detail-product",
          description: "A narrow product detail baseline.",
          brand: {
            id: "brand-1",
            name: "Acme"
          }
        }
      }
    })
    .mockResolvedValueOnce({
      data: {
        merchantProducts: {
          edges: [
            {
              node: {
                id: "merchant-product-1",
                url: "https://merchant.example.com/detail-product",
                currency: "USD",
                merchant: {
                  id: "merchant-1",
                  name: "Acme"
                },
                latestPrice: {
                  id: "price-1",
                  price: 199.99
                }
              }
            }
          ]
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
      id: "UHJvZHVjdDox",
      name: "Detail Product",
      slug: "detail-product",
      description: "A narrow product detail baseline.",
      brandName: "Acme"
    },
    offersStatus: "ready",
    offers: [
      {
        id: "merchant-product-1",
        merchantName: "Acme",
        url: "https://merchant.example.com/detail-product",
        priceText: "199.99 USD"
      }
    ]
  });

  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("query ProductDetail"),
    { slug: "detail-product" },
    undefined
  );

  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    2,
    expect.stringContaining("query ProductOffers"),
    {
      input: {
        productId: "UHJvZHVjdDox",
        activeOnly: true,
        first: 6
      }
    },
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

test("product detail loader marks an empty offers response as empty", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce({
      data: {
        product: {
          id: "UHJvZHVjdDox",
          name: "Detail Product",
          slug: "detail-product",
          description: "A narrow product detail baseline.",
          brand: {
            id: "brand-1",
            name: "Acme"
          }
        }
      }
    })
    .mockResolvedValueOnce({
      data: {
        merchantProducts: {
          edges: []
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
      id: "UHJvZHVjdDox",
      name: "Detail Product",
      slug: "detail-product",
      description: "A narrow product detail baseline.",
      brandName: "Acme"
    },
    offersStatus: "empty",
    offers: []
  });
});

test("product detail loader keeps the product ready when offers fail", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce({
      data: {
        product: {
          id: "UHJvZHVjdDox",
          name: "Detail Product",
          slug: "detail-product",
          description: "A narrow product detail baseline.",
          brand: {
            id: "brand-1",
            name: "Acme"
          }
        }
      }
    })
    .mockRejectedValueOnce(new Error("Network request failed: offers boom"));

  await expect(
    productDetailLoader({
      request: new Request("https://app.example.com/products/detail-product"),
      params: { slug: "detail-product" },
      context: undefined
    } as unknown as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "ready",
    product: {
      id: "UHJvZHVjdDox",
      name: "Detail Product",
      slug: "detail-product",
      description: "A narrow product detail baseline.",
      brandName: "Acme"
    },
    offersStatus: "error",
    offers: []
  });
});

test("product detail loader preserves active offers without latest price", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce({
      data: {
        product: {
          id: "UHJvZHVjdDox",
          name: "Detail Product",
          slug: "detail-product",
          description: "A narrow product detail baseline.",
          brand: {
            id: "brand-1",
            name: "Acme"
          }
        }
      }
    })
    .mockResolvedValueOnce({
      data: {
        merchantProducts: {
          edges: [
            {
              node: {
                id: "merchant-product-1",
                url: "https://merchant.example.com/detail-product",
                currency: "USD",
                merchant: {
                  id: "merchant-1",
                  name: "Acme"
                },
                latestPrice: null
              }
            }
          ]
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
      id: "UHJvZHVjdDox",
      name: "Detail Product",
      slug: "detail-product",
      description: "A narrow product detail baseline.",
      brandName: "Acme"
    },
    offersStatus: "ready",
    offers: [
      {
        id: "merchant-product-1",
        merchantName: "Acme",
        url: "https://merchant.example.com/detail-product",
        priceText: null
      }
    ]
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
    },
    offersStatus: "ready",
    offers: [
      {
        id: "merchant-product-1",
        merchantName: "Acme",
        url: "https://merchant.example.com/detail-product",
        priceText: "199.99 USD"
      }
    ]
  });

  render(<ProductDetailRoute />);

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByText("Acme", { selector: "p" })).toBeInTheDocument();
  expect(screen.getByText("A narrow product detail baseline.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Active offers" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute(
    "href",
    "https://merchant.example.com/detail-product"
  );
  expect(screen.getByText("199.99 USD")).toBeInTheDocument();
});

test("renders an offer without a latest price", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    product: {
      id: "product-1",
      name: "Detail Product",
      slug: "detail-product",
      description: "A narrow product detail baseline.",
      brandName: "Acme"
    },
    offersStatus: "ready",
    offers: [
      {
        id: "merchant-product-1",
        merchantName: "Acme",
        url: "https://merchant.example.com/detail-product",
        priceText: null
      }
    ]
  });

  render(<ProductDetailRoute />);

  expect(screen.getByRole("heading", { name: "Active offers" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute(
    "href",
    "https://merchant.example.com/detail-product"
  );
  expect(screen.queryByText("199.99 USD")).not.toBeInTheDocument();
});

test("renders an empty-offers message when no active offers exist", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    product: {
      id: "product-1",
      name: "Detail Product",
      slug: "detail-product",
      description: "A narrow product detail baseline.",
      brandName: "Acme"
    },
    offersStatus: "empty",
    offers: []
  });

  render(<ProductDetailRoute />);

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByText("No active offers yet.")).toBeInTheDocument();
});

test("renders an unavailable-offers message without collapsing the product detail", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    product: {
      id: "product-1",
      name: "Detail Product",
      slug: "detail-product",
      description: "A narrow product detail baseline.",
      brandName: "Acme"
    },
    offersStatus: "error",
    offers: []
  });

  render(<ProductDetailRoute />);

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByText("Offers unavailable.")).toBeInTheDocument();
  expect(screen.queryByText("Product unavailable.")).not.toBeInTheDocument();
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
