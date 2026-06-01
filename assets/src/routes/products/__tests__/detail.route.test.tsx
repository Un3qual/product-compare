import { render, screen, within } from "@testing-library/react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import { createRelayEnvironment } from "../../../relay/environment";
import {
  createRelayRouterContext,
  fetchRouteQuery,
  preloadRouteQuery,
  useRoutePreloadedQuery
} from "../../../relay/route-preload";
import { productDetailLoader } from "../loader";
import { ProductDetailRoute } from "../detail";

const {
  fetchRouteQueryMock,
  preloadRouteQueryMock,
  useLoaderDataMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  fetchRouteQueryMock: vi.fn(),
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
    fetchRouteQuery: fetchRouteQueryMock,
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

const mockedFetchRouteQuery = vi.mocked(fetchRouteQuery);
const mockedPreloadRouteQuery = vi.mocked(preloadRouteQuery);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const PRODUCT_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: "detail-product" }
  }
};

const OFFERS_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "ProductOffersRouteQuery",
    text: "query ProductOffersRouteQuery($productId: ID!, $first: Int!) { merchantProducts(input: { productId: $productId, activeOnly: true, first: $first }) { edges { node { id } } } }",
    variables: { productId: "UHJvZHVjdDox", first: 6 }
  }
};

type DetailProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: {
    id: string;
    name: string;
  };
  currentAttributes: ReadonlyArray<{
    code: string;
    displayName: string;
    dataType: string;
    valueText: string;
  }>;
};

const DETAIL_PRODUCT: DetailProduct = {
  id: "UHJvZHVjdDox",
  name: "Detail Product",
  slug: "detail-product",
  description: "A narrow product detail baseline.",
  brand: {
    id: "brand-1",
    name: "Acme"
  },
  currentAttributes: []
};

const productQueryRef = { dispose: vi.fn(), variables: PRODUCT_QUERY_DESCRIPTOR.__relayQuery.variables };
const offersQueryRef = { dispose: vi.fn(), variables: OFFERS_QUERY_DESCRIPTOR.__relayQuery.variables };

const buildProductDetailLoaderArgs = ({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.com/products/detail-product"),
  slug = "detail-product"
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
  slug?: string;
} = {}): LoaderFunctionArgs => ({
  request,
  params: { slug },
  context: createRelayRouterContext(environment),
  unstable_pattern: "/products/:slug"
});

beforeEach(() => {
  fetchRouteQueryMock.mockReset();
  preloadRouteQueryMock.mockReset();
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  productQueryRef.dispose.mockReset();
  offersQueryRef.dispose.mockReset();
});

test("product detail loader preloads product detail and active offers through Relay", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products/detail-product");

  mockedFetchRouteQuery.mockResolvedValue({
    data: {
      product: DETAIL_PRODUCT
    },
    descriptor: PRODUCT_QUERY_DESCRIPTOR,
    dispose: vi.fn()
  });
  mockedPreloadRouteQuery.mockResolvedValue(OFFERS_QUERY_DESCRIPTOR);

  await expect(
    productDetailLoader(buildProductDetailLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { slug: "detail-product" },
    { signal: request.signal }
  );
  expect(mockedPreloadRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { productId: DETAIL_PRODUCT.id, first: 6 },
    { signal: request.signal }
  );
});

test("product detail loader marks null products as not found", async () => {
  const environment = createRelayEnvironment();
  const disposeProductRouteQuery = vi.fn();

  mockedFetchRouteQuery.mockResolvedValue({
    data: {
      product: null
    },
    descriptor: PRODUCT_QUERY_DESCRIPTOR,
    dispose: disposeProductRouteQuery
  });

  await expect(
    productDetailLoader(
      buildProductDetailLoaderArgs({
        environment,
        request: new Request("https://app.example.com/products/missing-product"),
        slug: "missing-product"
      })
    )
  ).resolves.toEqual({
    status: "not_found"
  });

  expect(mockedPreloadRouteQuery).not.toHaveBeenCalled();
  expect(disposeProductRouteQuery).toHaveBeenCalledTimes(1);
});

test("product detail loader treats blank slugs as not found", async () => {
  await expect(
    productDetailLoader(
      buildProductDetailLoaderArgs({
        request: new Request("https://app.example.com/products/%20"),
        slug: "   "
      })
    )
  ).resolves.toEqual({
    status: "not_found"
  });

  expect(mockedFetchRouteQuery).not.toHaveBeenCalled();
  expect(mockedPreloadRouteQuery).not.toHaveBeenCalled();
});

test("product detail loader marks failed product preloads as unavailable", async () => {
  const environment = createRelayEnvironment();
  const preloadError = new Error("Network request failed: boom");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedFetchRouteQuery.mockRejectedValue(preloadError);

  try {
    await expect(
      productDetailLoader(buildProductDetailLoaderArgs({ environment }))
    ).resolves.toEqual({
      status: "error"
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to preload product detail route query.", {
      error: preloadError
    });
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("product detail loader keeps product detail ready when offers fail", async () => {
  const environment = createRelayEnvironment();
  const offersError = new Error("Network request failed: offers boom");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedFetchRouteQuery.mockResolvedValue({
    data: {
      product: DETAIL_PRODUCT
    },
    descriptor: PRODUCT_QUERY_DESCRIPTOR,
    dispose: vi.fn()
  });
  mockedPreloadRouteQuery.mockRejectedValue(offersError);

  try {
    await expect(
      productDetailLoader(buildProductDetailLoaderArgs({ environment }))
    ).resolves.toEqual({
      status: "ready",
      productQuery: PRODUCT_QUERY_DESCRIPTOR,
      offers: {
        status: "error"
      }
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to preload product offers route query.", {
      error: offersError
    });
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("product detail loader rethrows aborted product preloads", async () => {
  const environment = createRelayEnvironment();
  const abortError = new DOMException("The operation was aborted.", "AbortError");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedFetchRouteQuery.mockRejectedValue(abortError);

  try {
    await expect(
      productDetailLoader(buildProductDetailLoaderArgs({ environment }))
    ).rejects.toBe(abortError);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("product detail loader disposes product query when offers preload aborts", async () => {
  const environment = createRelayEnvironment();
  const abortError = new DOMException("The operation was aborted.", "AbortError");
  const disposeProductRouteQuery = vi.fn();
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedFetchRouteQuery.mockResolvedValue({
    data: {
      product: DETAIL_PRODUCT
    },
    descriptor: PRODUCT_QUERY_DESCRIPTOR,
    dispose: disposeProductRouteQuery
  });
  mockedPreloadRouteQuery.mockRejectedValue(abortError);

  try {
    await expect(
      productDetailLoader(buildProductDetailLoaderArgs({ environment }))
    ).rejects.toBe(abortError);

    expect(disposeProductRouteQuery).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("renders product detail and active offers from Relay route queries", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(
    buildOffersData([
      {
        id: "merchant-product-1",
        url: "https://merchant.example.com/detail-product",
        currency: "USD",
        merchant: {
          id: "merchant-1",
          name: "Acme"
        },
        latestPrice: {
          id: "price-1",
          price: "199.99"
        }
      }
    ])
  );

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByText("Acme", { selector: "p" })).toBeInTheDocument();
  expect(screen.getByText("A narrow product detail baseline.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Active offers" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute(
    "href",
    "https://merchant.example.com/detail-product"
  );
  expect(screen.getByText("199.99 USD")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(expect.anything(), PRODUCT_QUERY_DESCRIPTOR);
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(expect.anything(), OFFERS_QUERY_DESCRIPTOR);
});

test("renders active coupon details for product offers", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(
    buildOffersData([
      {
        id: "merchant-product-1",
        url: "https://merchant.example.com/detail-product",
        currency: "USD",
        merchant: {
          id: "merchant-1",
          name: "Acme"
        },
        latestPrice: {
          id: "price-1",
          price: "199.99"
        },
        activeCoupons: {
          edges: [
            {
              node: {
                code: "SAVE20",
                description: "Save on the detail product.",
                discountType: "AMOUNT",
                discountValue: "20.00",
                currency: "USD",
                validTo: null,
                terms: "Online orders only."
              }
            },
            {
              node: {
                code: "DEAL15",
                description: "Take a percent discount.",
                discountType: "PERCENT",
                discountValue: "15",
                currency: null,
                validTo: "not-a-date",
                terms: null
              }
            },
            {
              node: {
                code: "FREESHIP",
                description: "Free standard delivery.",
                discountType: "FREE_SHIPPING",
                discountValue: null,
                currency: null,
                validTo: "2026-07-01T00:00:00Z",
                terms: null
              }
            }
          ]
        }
      }
    ])
  );

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  const offerItem = screen.getByRole("link", { name: "Acme" }).closest("li");

  expect(offerItem).not.toBeNull();
  expect(within(offerItem as HTMLElement).getByText("SAVE20")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("Save on the detail product.")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("20.00 USD")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("Online orders only.")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("DEAL15")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("15%")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("FREESHIP")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("Free standard delivery.")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("Free shipping")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("Valid through 2026-07-01")).toBeVisible();
  expect(within(offerItem as HTMLElement).queryByText("Valid through not-a-date")).not.toBeInTheDocument();
});

test("renders offers when a merchant has no active coupons", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(
    buildOffersData([
      {
        id: "merchant-product-1",
        url: "https://merchant.example.com/detail-product",
        currency: "USD",
        merchant: {
          id: "merchant-1",
          name: "Acme"
        },
        latestPrice: {
          id: "price-1",
          price: "199.99"
        },
        activeCoupons: {
          edges: []
        }
      }
    ])
  );

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  const offerItem = screen.getByRole("link", { name: "Acme" }).closest("li");

  expect(offerItem).not.toBeNull();
  expect(within(offerItem as HTMLElement).getByText("199.99 USD")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("No active coupons for this offer.")).toBeVisible();
});

test("renders active offer price history rows", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(
    buildOffersData([
      {
        id: "merchant-product-1",
        url: "https://merchant.example.com/detail-product",
        currency: "USD",
        merchant: {
          id: "merchant-1",
          name: "Acme"
        },
        latestPrice: {
          id: "price-3",
          price: "199.99"
        },
        activeCoupons: {
          edges: [
            {
              node: {
                code: "SAVE20",
                description: "Save on the detail product.",
                discountType: "AMOUNT",
                discountValue: "20.00",
                currency: "USD",
                validTo: "2026-07-01T00:00:00Z",
                terms: "Online orders only."
              }
            }
          ]
        },
        priceHistory: {
          edges: [
            {
              node: {
                id: "price-1",
                price: "249.99",
                observedAt: "2026-05-30T10:00:00Z"
              }
            },
            {
              node: {
                id: "price-2",
                price: "229.99",
                observedAt: "2026-05-31T10:00:00Z"
              }
            },
            {
              node: {
                id: "price-invalid-date",
                price: "219.99",
                observedAt: "not-a-date"
              }
            },
            {
              node: {
                id: "price-invalid-price",
                price: "",
                observedAt: "2026-06-01T10:00:00Z"
              }
            }
          ],
          pageInfo: {
            hasNextPage: true
          }
        }
      }
    ])
  );

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  const offerItem = screen.getByRole("link", { name: "Acme" }).closest("li");

  expect(offerItem).not.toBeNull();

  const offer = within(offerItem as HTMLElement);
  const historyList = offer.getByRole("list", { name: "Acme price history" });
  const firstObservedAt = offer.getByText("2026-05-30");
  const secondObservedAt = offer.getByText("2026-05-31");
  const offerText = offerItem?.textContent ?? "";

  expect(historyList).toBeVisible();
  expect(firstObservedAt).toBeVisible();
  expect(firstObservedAt).toHaveAttribute("dateTime", "2026-05-30T10:00:00Z");
  expect(offer.getByText("249.99 USD")).toBeVisible();
  expect(secondObservedAt).toBeVisible();
  expect(secondObservedAt).toHaveAttribute("dateTime", "2026-05-31T10:00:00Z");
  expect(offer.getByText("229.99 USD")).toBeVisible();
  expect(offer.getByText("More price history available.")).toBeVisible();
  expect(offer.queryByText("not-a-date")).not.toBeInTheDocument();
  expect(offer.queryByText("219.99 USD")).not.toBeInTheDocument();
  expect(offer.queryByText("2026-06-01")).not.toBeInTheDocument();
  expect(offerText.indexOf("199.99 USD")).toBeLessThan(offerText.indexOf("2026-05-30"));
  expect(offerText.indexOf("2026-05-31")).toBeLessThan(offerText.indexOf("SAVE20"));
});

test("renders empty price history state for active offers", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(
    buildOffersData([
      {
        id: "merchant-product-1",
        url: "https://merchant.example.com/detail-product",
        currency: "USD",
        merchant: {
          id: "merchant-1",
          name: "Acme"
        },
        latestPrice: {
          id: "price-1",
          price: "199.99"
        },
        activeCoupons: {
          edges: []
        },
        priceHistory: {
          edges: [],
          pageInfo: {
            hasNextPage: false
          }
        }
      }
    ])
  );

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  const offerItem = screen.getByRole("link", { name: "Acme" }).closest("li");

  expect(offerItem).not.toBeNull();

  const offer = within(offerItem as HTMLElement);

  expect(offer.getByText("199.99 USD")).toBeVisible();
  expect(offer.getByText("No price history for this offer yet.")).toBeVisible();
  expect(offer.queryByText("More price history available.")).not.toBeInTheDocument();
});

test("renders product specifications from current attributes", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(buildOffersData([]), {
    ...DETAIL_PRODUCT,
    currentAttributes: [
      {
        code: "refresh-rate",
        displayName: "Refresh rate",
        dataType: "numeric",
        valueText: "144 Hz"
      },
      {
        code: "panel-type",
        displayName: "Panel type",
        dataType: "text",
        valueText: "OLED"
      }
    ]
  });

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Specifications" })).toBeInTheDocument();
  expect(screen.getByText("Refresh rate")).toBeVisible();
  expect(screen.getByText("144 Hz")).toBeVisible();
  expect(screen.getByText("Panel type")).toBeVisible();
  expect(screen.getByText("OLED")).toBeVisible();
});

test("links from product detail to compare with the current product selected", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(buildOffersData([]));

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "Compare this product" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product"
  );
});

test("renders an offer without a latest price", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(
    buildOffersData([
      {
        id: "merchant-product-1",
        url: "https://merchant.example.com/detail-product",
        currency: "USD",
        merchant: {
          id: "merchant-1",
          name: "Acme"
        },
        latestPrice: null
      }
    ])
  );

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

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
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(buildOffersData([]));

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByText("No active offers yet.")).toBeInTheDocument();
});

test("drops offers with unsafe urls", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(
    buildOffersData([
      {
        id: "merchant-product-1",
        url: "javascript:alert(1)",
        currency: "USD",
        merchant: {
          id: "merchant-1",
          name: "Acme"
        },
        latestPrice: {
          id: "price-1",
          price: "199.99"
        }
      }
    ])
  );

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByText("No active offers yet.")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Acme" })).not.toBeInTheDocument();
});

test("renders an unavailable-offers message without collapsing the product detail", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "error"
    }
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(productQueryRef);
  mockedUsePreloadedQuery.mockReturnValue({
    product: DETAIL_PRODUCT
  });

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Offers unavailable.");
  expect(screen.queryByText("Product unavailable.")).not.toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledTimes(1);
});

test("renders a local unavailable-offers message when the Relay offers query errors", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(new Error("Relay offers read failed"));

  try {
    render(
      <MemoryRouter>
        <ProductDetailRoute />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Offers unavailable.");
    expect(consoleErrorSpy).toHaveBeenCalled();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("renders a not-found message when the product detail loader misses", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "not_found"
  });

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByText("Product not found.")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

test("renders an unavailable message when the product detail request fails", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error"
  });

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Product unavailable.");
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

function mockRouteQueryRefs() {
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => {
    if (descriptor === PRODUCT_QUERY_DESCRIPTOR) {
      return productQueryRef;
    }

    if (descriptor === OFFERS_QUERY_DESCRIPTOR) {
      return offersQueryRef;
    }

    throw new Error(`Unexpected route query descriptor: ${JSON.stringify(descriptor)}`);
  });
}

function mockProductAndOffersQueries(offersResult: unknown, product = DETAIL_PRODUCT) {
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === productQueryRef) {
      return {
        product
      };
    }

    if (queryRef === offersQueryRef) {
      if (offersResult instanceof Error) {
        throw offersResult;
      }

      return offersResult;
    }

    throw new Error(`Unexpected preloaded query ref: ${String(queryRef)}`);
  });
}

function buildOffersData(
  nodes: Array<{
    id: string;
    url: string;
    currency: string;
    merchant: {
      id: string;
      name: string;
    } | null;
    latestPrice: {
      id: string;
      price: string;
    } | null;
    activeCoupons?: {
      edges: Array<{
        node: {
          code: string;
          description: string | null;
          discountType: string | null;
          discountValue: string | number | null;
          currency: string | null;
          validTo: string | null;
          terms: string | null;
        };
      }>;
    };
    priceHistory?: {
      edges: Array<{
        node: {
          id: string;
          price: string | number | null;
          observedAt: string | null;
        };
      }>;
      pageInfo: {
        hasNextPage: boolean;
      };
    };
  }>
) {
  return {
    merchantProducts: {
      edges: nodes.map((node) => ({
        node: {
          ...node,
          activeCoupons: node.activeCoupons ?? {
            edges: []
          },
          priceHistory: node.priceHistory ?? {
            edges: [],
            pageInfo: {
              hasNextPage: false
            }
          }
        }
      }))
    }
  };
}
