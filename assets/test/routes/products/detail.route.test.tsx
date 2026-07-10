import { fireEvent, render, screen, within } from "@testing-library/react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import {
  createRelayEnvironment,
  RouteLoaderGraphQLError
} from "../../../src/relay/environment";
import {
  createRelayRouterContext,
  fetchRouteQuery,
  preloadRouteQuery,
  useRoutePreloadedQuery
} from "../../../src/relay/route-preload";
import { MAX_COMPARE_PRODUCTS } from "../../../src/routes/compare/loader";
import { productDetailLoader } from "../../../src/routes/products/loader";
import { ProductDetailRoute } from "../../../src/routes/products/detail";

const {
  fetchRouteQueryMock,
  commitCommerceClickMock,
  graphqlMock,
  loadQueryMock,
  preloadRouteQueryMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  fetchRouteQueryMock: vi.fn(),
  commitCommerceClickMock: vi.fn(),
  graphqlMock: vi.fn(),
  loadQueryMock: vi.fn(),
  preloadRouteQueryMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload"
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
    graphql: graphqlMock,
    loadQuery: loadQueryMock,
    useMutation: useMutationMock,
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
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);
const API_ORIGIN = "http://localhost:4000";

const PRODUCT_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: "detail-product" }
  }
};

const OFFERS_QUERY_TEXT =
  "query ProductOffersRouteQuery($productId: ID!, $first: Int!) { merchantProducts(input: { productId: $productId, activeOnly: true, first: $first }) { edges { node { id } } } }";
function makeOffersQueryDescriptor(offersAfter?: string | null) {
  return {
    __relayQuery: {
      operationName: "ProductOffersRouteQuery",
      text: OFFERS_QUERY_TEXT,
      variables: {
        productId: "UHJvZHVjdDox",
        first: 6,
        ...(offersAfter ? { after: offersAfter } : {})
      }
    }
  };
}

const OFFERS_QUERY_DESCRIPTOR = makeOffersQueryDescriptor();

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
    attributeId?: string;
    code: string;
    displayName: string;
    dataType: string;
    valueText: string;
    sortOrder?: number | null;
    groupLabel?: string | null;
    isRequired?: boolean;
    numericValue?: string | null;
    booleanValue?: boolean | null;
    enumOptionId?: string | null;
    unitSymbol?: string | null;
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
  commitCommerceClickMock.mockReset();
  loadQueryMock.mockReset();
  preloadRouteQueryMock.mockReset();
  useLoaderDataMock.mockReset();
  useMutationMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  mockedUseMutation.mockReturnValue([commitCommerceClickMock, false] as never);
  loadQueryMock.mockReturnValue({ dispose: vi.fn() });
  productQueryRef.dispose.mockReset();
  offersQueryRef.dispose.mockReset();
});

test("product detail loader preloads product detail and active offers through Relay", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products/detail-product");

  mockedFetchRouteQuery.mockResolvedValue({
    data: {
      product: {
        ...DETAIL_PRODUCT,
        merchantProducts: {
          edges: [],
          pageInfo: { endCursor: null, hasNextPage: false }
        }
      }
    },
    descriptor: PRODUCT_QUERY_DESCRIPTOR,
    dispose: vi.fn()
  });

  await expect(
    productDetailLoader(buildProductDetailLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR
  });

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { slug: "detail-product", offerFirst: 6, offersAfter: null },
    { signal: request.signal }
  );
  expect(mockedPreloadRouteQuery).not.toHaveBeenCalled();
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("product detail loader forwards offersAfter to offers query pagination", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/products/detail-product?offersAfter=cursor%2Bnext%2Ftoken"
  );
  mockedFetchRouteQuery.mockResolvedValue({
    data: {
      product: DETAIL_PRODUCT
    },
    descriptor: PRODUCT_QUERY_DESCRIPTOR,
    dispose: vi.fn()
  });
  await expect(
    productDetailLoader(buildProductDetailLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR
  });

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { slug: DETAIL_PRODUCT.slug, offerFirst: 6, offersAfter: "cursor+next/token" },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
  expect(mockedPreloadRouteQuery).not.toHaveBeenCalled();
});

test("product detail loader preserves opaque offersAfter cursor characters", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/products/detail-product?offersAfter=%2Babc%2Ftoken%20"
  );
  const opaqueCursor = "+abc/token ";
  mockedFetchRouteQuery.mockResolvedValue({
    data: {
      product: DETAIL_PRODUCT
    },
    descriptor: PRODUCT_QUERY_DESCRIPTOR,
    dispose: vi.fn()
  });
  await expect(
    productDetailLoader(buildProductDetailLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR
  });

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { slug: DETAIL_PRODUCT.slug, offerFirst: 6, offersAfter: opaqueCursor },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
  expect(mockedPreloadRouteQuery).not.toHaveBeenCalled();
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

test("product detail loader marks a failed combined product-and-offers request unavailable", async () => {
  const environment = createRelayEnvironment();
  const offersError = new Error("Network request failed: offers boom");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedFetchRouteQuery.mockRejectedValue(offersError);

  try {
    await expect(
      productDetailLoader(buildProductDetailLoaderArgs({ environment }))
    ).resolves.toEqual({
      status: "error"
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to preload product detail route query.",
      { error: offersError }
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("product detail loader preserves product data when only nested offers fail", async () => {
  const environment = createRelayEnvironment();
  const commitPayloadSpy = vi.spyOn(environment, "commitPayload");
  const partialResponse = {
    data: {
      product: {
        ...DETAIL_PRODUCT,
        merchantProducts: null
      }
    },
    errors: [
      {
        message: "Offers unavailable",
        path: ["product", "merchantProducts"]
      }
    ]
  };

  mockedFetchRouteQuery.mockRejectedValue(new RouteLoaderGraphQLError(partialResponse));

  await expect(
    productDetailLoader(buildProductDetailLoaderArgs({ environment }))
  ).resolves.toMatchObject({
    status: "ready",
    productQuery: {
      __relayQuery: {
        operationName: "ProductDetailRouteQuery",
        variables: {
          slug: DETAIL_PRODUCT.slug,
          offerFirst: 6,
          offersAfter: null
        }
      }
    }
  });

  expect(commitPayloadSpy).toHaveBeenCalledWith(expect.anything(), partialResponse.data);
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
          price: "199.99",
          observedAt: "2026-06-01T00:00:00Z"
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
    `${API_ORIGIN}/r/merchant-product?merchantProductId=merchant-product-1`
  );
  expect(screen.getByText("199.99 USD")).toBeInTheDocument();
  const priceObservedAt = screen.getByText("2026-06-01", { selector: "time" });

  expect(priceObservedAt).toHaveAttribute("datetime", "2026-06-01T00:00:00Z");
  expect(priceObservedAt.parentElement).toHaveTextContent("Price observed 2026-06-01");
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(expect.anything(), PRODUCT_QUERY_DESCRIPTOR);
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledTimes(1);
});

test.each([
  null,
  "not-a-date",
  "2026-02-30T00:00:00Z",
  "June 1 2026",
  1_717_326_000_000
])(
  "keeps product-detail prices visible without an unsupported observation claim for %s",
  (observedAt) => {
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
          id: "merchant-product-unsupported-observation",
          url: "https://merchant.example.com/detail-product",
          currency: "USD",
          merchant: {
            id: "merchant-1",
            name: "Acme"
          },
          latestPrice: {
            id: "price-unsupported-observation",
            price: "199.99",
            observedAt
          }
        }
      ])
    );

    render(
      <MemoryRouter>
        <ProductDetailRoute />
      </MemoryRouter>
    );

    expect(screen.getByText("199.99 USD")).toBeVisible();
    expect(screen.queryByText(/^Price observed/)).not.toBeInTheDocument();
  }
);

test("product detail tracks merchant clicks with only the merchant product ID", () => {
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

  fireEvent.click(screen.getByRole("link", { name: "Acme" }));

  expect(commitCommerceClickMock).toHaveBeenCalledWith(
    expect.objectContaining({
      variables: {
        input: {
          merchantProductId: "merchant-product-1"
        }
      }
    })
  );
  expect(JSON.stringify(commitCommerceClickMock.mock.calls[0]?.[0]?.variables)).not.toContain(
    "https://merchant.example.com/detail-product"
  );
});

test("product detail blocks pending tracked merchant action re-clicks", () => {
  mockedUseMutation.mockReturnValue([commitCommerceClickMock, true] as never);
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

  const merchantLink = screen.getByRole("link", { name: "Acme" });
  const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });

  expect(merchantLink).toHaveAttribute("aria-disabled", "true");

  fireEvent(merchantLink, clickEvent);

  expect(clickEvent.defaultPrevented).toBe(true);
  expect(commitCommerceClickMock).not.toHaveBeenCalled();
});

test("renders offers with valid urls and null merchants using a fallback label", () => {
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
        id: "merchant-product-null-merchant",
        url: "https://merchant.example.com/detail-product",
        currency: "USD",
        merchant: null,
        latestPrice: {
          id: "price-null-merchant",
          price: "179.00"
        }
      }
    ])
  );

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.queryByText("No active offers yet.")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Visit offer" })).toHaveAttribute(
    "href",
    `${API_ORIGIN}/r/merchant-product?merchantProductId=merchant-product-null-merchant`
  );
  expect(screen.getByText("179.00 USD")).toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: "Offer snapshot" })).getByText(
    "179.00 USD at Visit offer"
  )).toBeVisible();
});

test("renders an offer snapshot from the visible active offer page", () => {
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
              cursor: "coupon-cursor-1",
              node: {
                code: "SAVE20",
                description: "Save on the detail product.",
                discountType: "AMOUNT",
                discountValue: "20.00",
                currency: "USD",
                validTo: null,
                terms: null
              }
            }
          ],
          pageInfo: {
            hasNextPage: false
          }
        }
      },
      {
        id: "merchant-product-2",
        url: "https://value.example.com/detail-product",
        currency: "USD",
        merchant: {
          id: "merchant-2",
          name: "Value Mart"
        },
        latestPrice: {
          id: "price-2",
          price: "149.50"
        },
        activeCoupons: {
          edges: [
            {
              cursor: "coupon-cursor-2",
              node: {
                code: "VALUE10",
                description: "Value discount.",
                discountType: "PERCENT",
                discountValue: "10",
                currency: null,
                validTo: null,
                terms: null
              }
            }
          ],
          pageInfo: {
            hasNextPage: false
          }
        }
      },
      {
        id: "merchant-product-3",
        url: "https://noprice.example.com/detail-product",
        currency: "USD",
        merchant: {
          id: "merchant-3",
          name: "No Price Shop"
        },
        latestPrice: null
      },
      {
        id: "merchant-product-4",
        url: "https://badprice.example.com/detail-product",
        currency: "USD",
        merchant: {
          id: "merchant-4",
          name: "Bad Price Shop"
        },
        latestPrice: {
          id: "price-bad",
          price: "not-a-price"
        }
      }
    ])
  );

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  const activeOffersHeading = screen.getByRole("heading", { name: "Active offers" });
  const offerSnapshot = screen.getByRole("region", { name: "Offer snapshot" });
  const offersList = screen.getByRole("list", { name: "Active offer list" });

  expect(
    activeOffersHeading.compareDocumentPosition(offerSnapshot) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    offerSnapshot.compareDocumentPosition(offersList) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(within(offerSnapshot).getByText("Visible active offers")).toBeVisible();
  expect(within(offerSnapshot).getByText("4")).toBeVisible();
  expect(within(offerSnapshot).getByText("Lowest visible price")).toBeVisible();
  expect(within(offerSnapshot).getByText("149.50 USD at Value Mart")).toBeVisible();
  expect(within(offerSnapshot).getByText("Coupon availability")).toBeVisible();
  expect(within(offerSnapshot).getByText("2 offers with coupons")).toBeVisible();
  expect(within(offerSnapshot).getByText("Missing latest price")).toBeVisible();
  expect(within(offerSnapshot).getByText("2 offers")).toBeVisible();
  expect(within(offersList).getByRole("link", { name: "Bad Price Shop" })).toBeVisible();
  expect(within(offersList).queryByText("not-a-price USD")).not.toBeInTheDocument();
});

test("renders offer snapshot fallback when no visible offer has a numeric display price", () => {
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
        id: "merchant-product-bad-price",
        url: "https://bad-price.example.com/detail-product",
        currency: "USD",
        merchant: {
          id: "merchant-bad-price",
          name: "Bad Price Shop"
        },
        latestPrice: {
          id: "price-bad",
          price: "not-a-price"
        }
      },
      {
        id: "merchant-product-missing-price",
        url: "https://missing-price.example.com/detail-product",
        currency: "USD",
        merchant: {
          id: "merchant-missing-price",
          name: "Missing Price Shop"
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

  const offerSnapshot = screen.getByRole("region", { name: "Offer snapshot" });

  expect(within(offerSnapshot).getByText("No visible prices")).toBeVisible();
  expect(within(offerSnapshot).getByText("2 offers")).toBeVisible();
});

test("renders offer snapshot without lowest-price claim for mixed currencies", () => {
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
        id: "merchant-product-usd",
        url: "https://usd.example.com/detail-product",
        currency: "USD",
        merchant: {
          id: "merchant-usd",
          name: "USD Shop"
        },
        latestPrice: {
          id: "price-usd",
          price: "199.99"
        }
      },
      {
        id: "merchant-product-eur",
        url: "https://eur.example.com/detail-product",
        currency: "EUR",
        merchant: {
          id: "merchant-eur",
          name: "Euro Shop"
        },
        latestPrice: {
          id: "price-eur",
          price: "149.99"
        }
      }
    ])
  );

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  const offerSnapshot = screen.getByRole("region", { name: "Offer snapshot" });

  expect(within(offerSnapshot).getByText("Lowest visible price")).toBeVisible();
  expect(within(offerSnapshot).getByText("Multiple currencies")).toBeVisible();
  expect(within(offerSnapshot).queryByText("149.99 EUR at Euro Shop")).not.toBeInTheDocument();
});

test("renders product decision actions with compare, offer review, and browse destinations", () => {
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
    id: "product/id+value=",
    slug: "detail/product slug"
  });

  render(
    <MemoryRouter initialEntries={["/products/detail%2Fproduct%20slug"]}>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  const actions = screen.getByRole("region", { name: "Next steps" });

  expect(within(actions).getByRole("link", { name: "Add this product to compare" })).toHaveAttribute(
    "href",
    "/products/detail%2Fproduct%20slug?slug=detail%2Fproduct+slug"
  );
  expect(within(actions).getByRole("link", { name: "Review active offers" })).toHaveAttribute(
    "href",
    "/offers?productId=product%2Fid%2Bvalue%3D"
  );
  expect(within(actions).getByRole("link", { name: "Browse products" })).toHaveAttribute(
    "href",
    "/products"
  );
});

test("renders next and first offer page links from URL-driven offersAfter state", () => {
  const offersDescriptorWithAfter = makeOffersQueryDescriptor("cursor/next+value");

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: offersDescriptorWithAfter
    }
  });
  mockRouteQueryRefs(offersDescriptorWithAfter);
  mockProductAndOffersQueries(
    buildOffersData(
      [
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
      ],
      {
        hasNextPage: true,
        endCursor: "next cursor&value"
      }
    ),
    {
      ...DETAIL_PRODUCT,
      slug: "detail/product?value"
    }
  );

  render(
    <MemoryRouter initialEntries={["/products/detail-product?offersAfter=cursor%2Fnext%2Bvalue"]}>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "First offers" })).toHaveAttribute(
    "href",
    "/products/detail%2Fproduct%3Fvalue"
  );
  expect(screen.getByRole("link", { name: "Next offers" })).toHaveAttribute(
    "href",
    "/products/detail%2Fproduct%3Fvalue?offersAfter=next+cursor%26value"
  );
});

test("does not render offer pagination links when no additional offers page exists", () => {
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

  expect(screen.queryByRole("link", { name: "First offers" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Next offers" })).not.toBeInTheDocument();
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
              cursor: "coupon-cursor-1",
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
              cursor: "coupon-cursor-2",
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
              cursor: "coupon-cursor-3",
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
          ],
          pageInfo: {
            hasNextPage: true
          }
        }
      }
    ])
  );

  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    render(
      <MemoryRouter>
        <ProductDetailRoute />
      </MemoryRouter>
    );

    const offerItem = screen.getByRole("link", { name: "Acme" }).closest("li");

    expect(offerItem).not.toBeNull();
    const offer = within(offerItem as HTMLElement);

    expect(offer.getByRole("list", { name: "Acme active coupons" })).toBeVisible();
    expect(offer.getByText("SAVE20")).toBeVisible();
    expect(offer.getByText("Save on the detail product.")).toBeVisible();
    expect(offer.getByText("20.00 USD")).toBeVisible();
    expect(offer.getByText("Online orders only.")).toBeVisible();
    expect(offer.getByText("DEAL15")).toBeVisible();
    expect(offer.getByText("15%")).toBeVisible();
    expect(offer.getByText("FREESHIP")).toBeVisible();
    expect(offer.getByText("Free standard delivery.")).toBeVisible();
    expect(offer.getByText("Free shipping")).toBeVisible();
    expect(offer.getByText("Valid through 2026-07-01")).toBeVisible();
    expect(offer.getByText("More coupons available.")).toBeVisible();
    expect(offer.queryByText("Valid through not-a-date")).not.toBeInTheDocument();
    expect(keyWarningCalls(consoleErrorSpy)).toHaveLength(0);
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("renders duplicate active coupon codes without React key warnings", () => {
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
              cursor: "coupon-cursor-1",
              node: {
                code: "SAVE20",
                description: "First duplicate coupon.",
                discountType: "AMOUNT",
                discountValue: "20.00",
                currency: "USD",
                validTo: null,
                terms: null
              }
            },
            {
              cursor: "coupon-cursor-2",
              node: {
                code: "SAVE20",
                description: "Second duplicate coupon.",
                discountType: "PERCENT",
                discountValue: "15",
                currency: null,
                validTo: null,
                terms: null
              }
            }
          ],
          pageInfo: {
            hasNextPage: false
          }
        }
      }
    ])
  );

  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    render(
      <MemoryRouter>
        <ProductDetailRoute />
      </MemoryRouter>
    );

    expect(keyWarningCalls(consoleErrorSpy)).toHaveLength(0);
    expect(screen.getByText("First duplicate coupon.")).toBeVisible();
    expect(screen.getByText("Second duplicate coupon.")).toBeVisible();
  } finally {
    consoleErrorSpy.mockRestore();
  }
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
              cursor: "coupon-cursor-1",
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
          ],
          pageInfo: {
            hasNextPage: false
          }
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
                observedAt: "2026-06-01T00:30:00+02:00"
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
                observedAt: "2026-06-02T10:00:00Z"
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
  const secondObservedAt = offer.getByText("2026-06-01");
  const offerText = offerItem?.textContent ?? "";

  expect(historyList).toBeVisible();
  expect(firstObservedAt).toBeVisible();
  expect(firstObservedAt).toHaveAttribute("dateTime", "2026-05-30T10:00:00Z");
  expect(offer.getByText("249.99 USD")).toBeVisible();
  expect(secondObservedAt).toBeVisible();
  expect(secondObservedAt).toHaveAttribute("dateTime", "2026-06-01T00:30:00+02:00");
  expect(offer.getByText("229.99 USD")).toBeVisible();
  expect(offer.getByText("More price history available.")).toBeVisible();
  expect(offer.queryByText("not-a-date")).not.toBeInTheDocument();
  expect(offer.queryByText("219.99 USD")).not.toBeInTheDocument();
  expect(offer.queryByText("2026-06-02")).not.toBeInTheDocument();
  expect(offerText.indexOf("199.99 USD")).toBeLessThan(offerText.indexOf("2026-05-30"));
  expect(offerText.indexOf("2026-06-01")).toBeLessThan(offerText.indexOf("SAVE20"));
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
          edges: [],
          pageInfo: {
            hasNextPage: false
          }
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

test("renders product specifications grouped by compare group label", () => {
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
        attributeId: "QXR0cmlidXRlOjE=",
        code: "refresh-rate",
        displayName: "Refresh rate",
        dataType: "numeric",
        valueText: "144 Hz",
        sortOrder: 1,
        groupLabel: "Performance",
        isRequired: true,
        numericValue: "144",
        booleanValue: null,
        enumOptionId: null,
        unitSymbol: "Hz"
      },
      {
        attributeId: "QXR0cmlidXRlOjI=",
        code: "hdr",
        displayName: "HDR",
        dataType: "bool",
        valueText: "Yes",
        sortOrder: 2,
        groupLabel: "Capabilities",
        isRequired: false,
        numericValue: null,
        booleanValue: true,
        enumOptionId: null,
        unitSymbol: null
      },
      {
        attributeId: "QXR0cmlidXRlOjM=",
        code: "release-year",
        displayName: "Release year",
        dataType: "int",
        valueText: "2026",
        sortOrder: null,
        groupLabel: null,
        isRequired: false,
        numericValue: null,
        booleanValue: null,
        enumOptionId: null,
        unitSymbol: null
      }
    ]
  });

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  const specifications = screen
    .getByRole("heading", { name: "Specifications" })
    .closest("section");

  expect(specifications).not.toBeNull();
  const specSection = within(specifications as HTMLElement);

  expect(specSection.getByRole("heading", { name: "Performance" })).toBeVisible();
  expect(specSection.getByText("Refresh rate")).toBeVisible();
  expect(specSection.getByText("144 Hz")).toBeVisible();
  expect(specSection.getByRole("heading", { name: "Capabilities" })).toBeVisible();
  expect(specSection.getByText("HDR")).toBeVisible();
  expect(specSection.getByText("Yes")).toBeVisible();
  expect(specSection.getByText("Release year")).toBeVisible();
  expect(specSection.getByText("2026")).toBeVisible();
});

test("renders product specification group labels case-insensitively", () => {
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
        valueText: "144 Hz",
        groupLabel: "Performance"
      },
      {
        code: "response-time",
        displayName: "Response time",
        dataType: "numeric",
        valueText: "1 ms",
        groupLabel: "performance"
      },
      {
        code: "release-year",
        displayName: "Release year",
        dataType: "int",
        valueText: "2026",
        groupLabel: " "
      }
    ]
  });

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  const specifications = screen
    .getByRole("heading", { name: "Specifications" })
    .closest("section");

  expect(specifications).not.toBeNull();
  const specSection = within(specifications as HTMLElement);
  const performanceGroup = specSection
    .getByRole("heading", { name: "Performance" })
    .closest("section");

  expect(performanceGroup).not.toBeNull();
  expect(within(performanceGroup as HTMLElement).getByText("Refresh rate")).toBeVisible();
  expect(within(performanceGroup as HTMLElement).getByText("Response time")).toBeVisible();
  expect(specSection.queryByRole("heading", { name: "performance" })).not.toBeInTheDocument();
  expect(specSection.getByText("Release year")).toBeVisible();
  expect(specSection.getByText("2026")).toBeVisible();
});

test("adds the current detail product to compare from product detail", () => {
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
    <MemoryRouter initialEntries={["/products/detail-product"]}>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "Add this product to compare" })).toHaveAttribute(
    "href",
    "/products/detail-product?slug=detail-product"
  );
});

test("renders a persistent compare tray on product detail and preserves compare slugs", () => {
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
    <MemoryRouter initialEntries={["/products/detail-product?slug=second-product"]}>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  const selectionTray = screen.getByRole("region", { name: "Selected products" });
  const selectionCount = within(selectionTray).getByRole("status");

  expect(selectionCount).toHaveTextContent(`1 of ${MAX_COMPARE_PRODUCTS} products selected.`);
  expect(selectionCount).toHaveAttribute("aria-live", "polite");
  expect(within(selectionTray).getByRole("link", { name: "Open comparison" })).toHaveAttribute(
    "href",
    "/compare?slug=second-product"
  );
  expect(
    within(selectionTray).getByRole("link", {
      name: "Remove second-product from selection"
    })
  ).toHaveAttribute("href", "/products/detail-product");
  expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
    "href",
    "/products?slug=second-product"
  );
});

test("clamps URL-driven compare selections before rendering product detail controls", () => {
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
    <MemoryRouter
      initialEntries={[
        "/products/detail-product?slug=first-product&slug=second-product&slug=third-product&slug=detail-product"
      ]}
    >
      <ProductDetailRoute />
    </MemoryRouter>
  );

  const selectionTray = screen.getByRole("region", { name: "Selected products" });
  const selectionCount = within(selectionTray).getByRole("status");

  expect(selectionCount).toHaveTextContent(
    `${MAX_COMPARE_PRODUCTS} of ${MAX_COMPARE_PRODUCTS} products selected.`
  );
  expect(within(selectionTray).getAllByRole("listitem")).toHaveLength(MAX_COMPARE_PRODUCTS);
  expect(within(selectionTray).getByRole("link", { name: "Open comparison" })).toHaveAttribute(
    "href",
    "/compare?slug=first-product&slug=second-product&slug=third-product"
  );
  expect(screen.getByText("Compare selection full")).toBeInTheDocument();
  expect(screen.queryByText("This product is selected for comparison")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
    "href",
    "/products?slug=first-product&slug=second-product&slug=third-product"
  );
});

test("adds the current detail product while preserving offersAfter", () => {
  const offersDescriptorWithAfter = makeOffersQueryDescriptor("cursor-next-page");

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: offersDescriptorWithAfter
    }
  });
  mockRouteQueryRefs(offersDescriptorWithAfter);
  mockProductAndOffersQueries(buildOffersData([]));

  render(
    <MemoryRouter
      initialEntries={[
        "/products/detail-product?offersAfter=cursor-next-page&slug=second-product"
      ]}
    >
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "Add this product to compare" })).toHaveAttribute(
    "href",
    "/products/detail-product?offersAfter=cursor-next-page&slug=second-product&slug=detail-product"
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
  expect(screen.getByRole("link", { name: "Acme" })).toBeVisible();
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
  expect(screen.queryByRole("region", { name: "Offer snapshot" })).not.toBeInTheDocument();
});

test.each([
  ["non-HTTP scheme", "ftp://unsafe.example/offer"],
  ["URL credentials", "https://trusted.example@attacker.example/offer"],
  ["private network URL", "http://192.168.1.1/offer"],
  ["IPv4-mapped private IPv6 URL", "http://[::ffff:192.168.1.1]/offer"],
  ["IPv4-compatible loopback IPv6 URL", "http://[::127.0.0.1]/offer"],
  ["single-slash HTTP URL", "https:/merchant.example/offer"]
])("drops offers with unsafe urls: %s", (_caseName, url) => {
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
        url,
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

test("renders a local unavailable-offers message when combined offer data is missing", () => {
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

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Offers unavailable.");
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

function mockRouteQueryRefs(offersDescriptor = OFFERS_QUERY_DESCRIPTOR) {
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => {
    if (descriptor === PRODUCT_QUERY_DESCRIPTOR) {
      return productQueryRef;
    }

    if (descriptor === offersDescriptor) {
      return offersQueryRef;
    }

    throw new Error(`Unexpected route query descriptor: ${JSON.stringify(descriptor)}`);
  });
}

function mockProductAndOffersQueries(offersResult: unknown, product = DETAIL_PRODUCT) {
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === productQueryRef) {
      if (offersResult instanceof Error) {
        return {
          product: {
            ...product,
            merchantProducts: null
          }
        };
      }

      return {
        product: {
          ...product,
          merchantProducts: (offersResult as { merchantProducts?: unknown }).merchantProducts ?? null
        }
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

function keyWarningCalls(consoleErrorSpy: ReturnType<typeof vi.spyOn>) {
  return consoleErrorSpy.mock.calls.filter(
    ([message]: unknown[]) =>
      typeof message === "string" &&
      (message.includes("Encountered two children with the same key") ||
        message.includes('Each child in a list should have a unique "key" prop'))
  );
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
      observedAt?: unknown;
    } | null;
    activeCoupons?: {
      edges: Array<{
        cursor: string;
        node: {
          code: string;
          description: string | null;
          discountType: string | null;
          discountValue: string | number | null;
          currency: string | null;
          validTo: unknown;
          terms: string | null;
        };
      }>;
      pageInfo?: {
        hasNextPage: boolean;
      };
    };
    priceHistory?: {
      edges: Array<{
        node: {
          id: string;
          price: string | number | null;
          observedAt: unknown;
        };
      }>;
      pageInfo: {
        hasNextPage: boolean;
      };
    };
  }>,
  connection: {
    hasNextPage?: boolean;
    endCursor?: string | null;
  } = {}
) {
  return {
    merchantProducts: {
      pageInfo: {
        hasNextPage: connection.hasNextPage ?? false,
        endCursor: connection.endCursor ?? null
      },
      edges: nodes.map((node) => ({
        node: {
          ...node,
          activeCoupons: {
            edges: node.activeCoupons?.edges ?? [],
            pageInfo: {
              hasNextPage: node.activeCoupons?.pageInfo?.hasNextPage ?? false
            }
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
