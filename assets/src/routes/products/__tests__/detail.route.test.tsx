import { render, screen } from "@testing-library/react";
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

const productQueryRef = { dispose: vi.fn(), variables: PRODUCT_QUERY_DESCRIPTOR.__relayQuery.variables };
const offersQueryRef = { dispose: vi.fn(), variables: OFFERS_QUERY_DESCRIPTOR.__relayQuery.variables };

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
    descriptor: PRODUCT_QUERY_DESCRIPTOR
  });
  mockedPreloadRouteQuery.mockResolvedValue(OFFERS_QUERY_DESCRIPTOR);

  await expect(
    productDetailLoader({
      request,
      params: { slug: "detail-product" },
      context: createRelayRouterContext(environment)
    } as unknown as LoaderFunctionArgs)
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

  mockedFetchRouteQuery.mockResolvedValue({
    data: {
      product: null
    },
    descriptor: PRODUCT_QUERY_DESCRIPTOR
  });

  await expect(
    productDetailLoader({
      request: new Request("https://app.example.com/products/missing-product"),
      params: { slug: "missing-product" },
      context: createRelayRouterContext(environment)
    } as unknown as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "not_found"
  });

  expect(mockedPreloadRouteQuery).not.toHaveBeenCalled();
});

test("product detail loader marks failed product preloads as unavailable", async () => {
  const environment = createRelayEnvironment();
  const preloadError = new Error("Network request failed: boom");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedFetchRouteQuery.mockRejectedValue(preloadError);

  try {
    await expect(
      productDetailLoader({
        request: new Request("https://app.example.com/products/detail-product"),
        params: { slug: "detail-product" },
        context: createRelayRouterContext(environment)
      } as unknown as LoaderFunctionArgs)
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
    descriptor: PRODUCT_QUERY_DESCRIPTOR
  });
  mockedPreloadRouteQuery.mockRejectedValue(offersError);

  try {
    await expect(
      productDetailLoader({
        request: new Request("https://app.example.com/products/detail-product"),
        params: { slug: "detail-product" },
        context: createRelayRouterContext(environment)
      } as unknown as LoaderFunctionArgs)
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
      productDetailLoader({
        request: new Request("https://app.example.com/products/detail-product"),
        params: { slug: "detail-product" },
        context: createRelayRouterContext(environment)
      } as unknown as LoaderFunctionArgs)
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
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === productQueryRef) {
      return {
        product: DETAIL_PRODUCT
      };
    }

    return buildOffersData([
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
    ]);
  });

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
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === productQueryRef) {
      return {
        product: DETAIL_PRODUCT
      };
    }

    return buildOffersData([
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
    ]);
  });

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
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === productQueryRef) {
      return {
        product: DETAIL_PRODUCT
      };
    }

    return buildOffersData([]);
  });

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
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === productQueryRef) {
      return {
        product: DETAIL_PRODUCT
      };
    }

    return buildOffersData([
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
    ]);
  });

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
  expect(screen.getByText("Offers unavailable.")).toBeInTheDocument();
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
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === productQueryRef) {
      return {
        product: DETAIL_PRODUCT
      };
    }

    throw new Error("Relay offers read failed");
  });

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

  expect(screen.getByText("Product unavailable.")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

function mockRouteQueryRefs() {
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => {
    if (descriptor === PRODUCT_QUERY_DESCRIPTOR) {
      return productQueryRef;
    }

    return offersQueryRef;
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
  }>
) {
  return {
    merchantProducts: {
      edges: nodes.map((node) => ({
        node
      }))
    }
  };
}
