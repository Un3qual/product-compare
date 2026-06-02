import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../relay/route-preload";
import { OfferDiscoveryRoute } from "../index";
import type { OfferDiscoveryLoaderData } from "../loader";

const {
  useLoaderDataMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    usePreloadedQuery: usePreloadedQueryMock
  };
});

vi.mock("../../../relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../relay/route-preload")>(
    "../../../relay/route-preload"
  );

  return {
    ...actual,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const OFFER_DISCOVERY_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "OfferDiscoveryRouteQuery",
    text: "query OfferDiscoveryRouteQuery($input: MerchantProductsInput!) { merchantProducts(input: $input) { edges { node { id } } } }",
    variables: {
      input: {
        activeOnly: true,
        first: 6,
        productId: "UHJvZHVjdDoxMjM="
      }
    }
  }
};

const OFFER_DISCOVERY_QUERY_REF = {
  dispose: vi.fn(),
  variables: OFFER_DISCOVERY_QUERY_DESCRIPTOR.__relayQuery.variables
};

beforeEach(() => {
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  OFFER_DISCOVERY_QUERY_REF.dispose.mockReset();
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockedUseRoutePreloadedQuery.mockReturnValue(OFFER_DISCOVERY_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue(buildOfferDiscoveryData());
});

test("offer discovery asks users to start from browse products when productId is missing", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "missingProduct",
    filters: {
      activeOnly: true,
      after: null,
      first: 6,
      merchantId: null,
      productId: null
    }
  } satisfies OfferDiscoveryLoaderData);

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("heading", { name: "Offers" })).toBeInTheDocument();
  expect(screen.getByText("Start from browse products to choose a product.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
    "href",
    "/products"
  );
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

test("offer discovery renders ready offer rows", () => {
  renderOfferDiscoveryRoute();

  expect(screen.getByRole("heading", { name: "Offers" })).toBeInTheDocument();
  expect(screen.getByText("Active offers")).toBeVisible();

  const offer = screen.getByRole("heading", { name: "Detail Product" }).closest("li");

  expect(offer).not.toBeNull();

  const offerContent = within(offer as HTMLElement);

  expect(offerContent.getByRole("heading", { name: "Detail Product" })).toBeVisible();
  expect(offerContent.getByRole("link", { name: "Acme Market" })).toHaveAttribute(
    "href",
    "https://merchant.example.com/detail-product"
  );
  expect(offerContent.getByText("acme.example")).toBeVisible();
  expect(offerContent.getByText("Active")).toBeVisible();
  expect(offerContent.getByText("199.99 USD")).toBeVisible();
  expect(offerContent.getByText("SAVE20")).toBeVisible();
  expect(offerContent.getByText("20.00 USD")).toBeVisible();
  expect(offerContent.getByText("2026-05-30")).toBeVisible();
  expect(offerContent.getByText("189.99 USD")).toBeVisible();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    OFFER_DISCOVERY_QUERY_DESCRIPTOR
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    OFFER_DISCOVERY_QUERY_REF
  );
});

test("offer discovery renders inactive filter state", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      activeOnly: false
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        {
          id: "merchant-product-1",
          url: "https://merchant.example.com/detail-product",
          currency: "USD",
          isActive: false,
          merchant: {
            id: "merchant-1",
            name: "Acme Market",
            domain: "acme.example"
          },
          product: {
            id: "product-1",
            name: "Detail Product",
            slug: "detail-product"
          },
          latestPrice: null,
      activeCoupons: buildCouponConnection([]),
      priceHistory: buildPriceHistoryConnection([])
        }
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getByText("All offers")).toBeVisible();
  expect(screen.getByText("Inactive")).toBeVisible();
  expect(screen.getByText("No latest price.")).toBeVisible();
});

test("offer discovery renders an empty state", () => {
  mockedUsePreloadedQuery.mockReturnValue(buildOfferDiscoveryData({ offers: [] }));

  renderOfferDiscoveryRoute();

  expect(screen.getByText("No offers match these filters.")).toBeVisible();
});

test("offer discovery renders next-page and first-page links", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      after: "previous-cursor",
      first: 12,
      merchantId: "TWVyY2hhbnQ6NDU2"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      endCursor: "next-cursor",
      hasNextPage: true,
      hasPreviousPage: true
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("link", { name: "First offers" })).toHaveAttribute(
    "href",
    "/offers?productId=UHJvZHVjdDoxMjM%3D&merchantId=TWVyY2hhbnQ6NDU2&activeOnly=true&first=12"
  );
  expect(screen.getByRole("link", { name: "Next offers" })).toHaveAttribute(
    "href",
    "/offers?productId=UHJvZHVjdDoxMjM%3D&merchantId=TWVyY2hhbnQ6NDU2&activeOnly=true&first=12&after=next-cursor"
  );
});

test("offer discovery renders the loader error state", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    filters: {
      activeOnly: true,
      after: null,
      first: 6,
      merchantId: null,
      productId: "UHJvZHVjdDoxMjM="
    }
  } satisfies OfferDiscoveryLoaderData);

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("alert")).toHaveTextContent("Offers unavailable.");
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

test("offer discovery renders the query unavailable state", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedUsePreloadedQuery.mockReturnValue({
    merchantProducts: null
  });

  try {
    renderOfferDiscoveryRoute();

    expect(screen.getByRole("alert")).toHaveTextContent("Offers unavailable.");
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

function renderOfferDiscoveryRoute() {
  render(
    <MemoryRouter>
      <OfferDiscoveryRoute />
    </MemoryRouter>
  );
}

function buildReadyLoaderData(
  filters: Partial<Extract<OfferDiscoveryLoaderData, { status: "ready" }>["filters"]> = {}
) {
  return {
    status: "ready",
    filters: {
      activeOnly: true,
      after: null,
      first: 6,
      merchantId: null,
      productId: "UHJvZHVjdDoxMjM=",
      ...filters
    },
    query: OFFER_DISCOVERY_QUERY_DESCRIPTOR
  } satisfies OfferDiscoveryLoaderData;
}

function buildOfferDiscoveryData({
  endCursor = "cursor-1",
  hasNextPage = false,
  hasPreviousPage = false,
  offers = [
    {
      id: "merchant-product-1",
      url: "https://merchant.example.com/detail-product",
      currency: "USD",
      isActive: true,
      merchant: {
        id: "merchant-1",
        name: "Acme Market",
        domain: "acme.example"
      },
      product: {
        id: "product-1",
        name: "Detail Product",
        slug: "detail-product"
      },
      latestPrice: {
        id: "price-1",
        price: "199.99",
        observedAt: "2026-06-01T00:00:00Z"
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
              id: "price-history-1",
              price: "189.99",
              observedAt: "2026-05-30T10:00:00Z"
            }
          }
        ],
        pageInfo: {
          hasNextPage: false
        }
      }
    }
  ],
  startCursor = offers.length === 0 ? null : "cursor-1"
}: {
  endCursor?: string | null;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  offers?: Array<OfferNode>;
  startCursor?: string | null;
} = {}) {
  return {
    merchantProducts: {
      edges: offers.map((node, index) => ({
        cursor: `cursor-${index + 1}`,
        node
      })),
      pageInfo: {
        endCursor,
        hasNextPage,
        hasPreviousPage,
        startCursor
      }
    }
  };
}

type OfferNode = {
  id: string;
  url: string;
  currency: string;
  isActive: boolean;
  merchant: {
    id: string;
    name: string;
    domain: string;
  } | null;
  product: {
    id: string;
    name: string;
    slug: string;
  } | null;
  latestPrice: {
    id: string;
    price: string;
    observedAt: string | null;
  } | null;
  activeCoupons: CouponConnection;
  priceHistory: PriceHistoryConnection;
};

type CouponConnection = {
  edges: Array<{
    cursor: string;
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
  pageInfo: {
    hasNextPage: boolean;
  };
};

type PriceHistoryConnection = {
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

function buildCouponConnection(edges: CouponConnection["edges"]): CouponConnection {
  return {
    edges,
    pageInfo: {
      hasNextPage: false
    }
  };
}

function buildPriceHistoryConnection(
  edges: PriceHistoryConnection["edges"]
): PriceHistoryConnection {
  return {
    edges,
    pageInfo: {
      hasNextPage: false
    }
  };
}
