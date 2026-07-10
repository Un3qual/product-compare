import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRelayEnvironment } from "../../../src/relay/environment";
import {
  fetchRouteQuery,
  useRoutePreloadedQuery
} from "../../../src/relay/route-preload";
import {
  MemoryRouter,
  useLoaderData,
  useRouteError
} from "react-router-dom";
import { useLazyLoadQuery, useMutation, usePreloadedQuery } from "react-relay";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../../src/routes/route-errors";
import {
  compareLoader,
  MAX_COMPARE_PRODUCTS,
  type CompareRouteLoaderData
} from "../../../src/routes/compare/loader";
import {
  isUnauthorizedSavedComparisonsResponse,
  savedComparisonsLoader
} from "../../../src/routes/compare/saved-data";
import { RouteErrorBoundary } from "../../../src/routes/compare/error-boundary";
import { CompareRoute } from "../../../src/routes/compare/index";
import {
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsAfterAdding,
  selectedCompareSlugsFromSearch
} from "../../../src/routes/compare/paths";
import { SavedComparisonsRoute } from "../../../src/routes/compare/saved";
import {
  buildAbortableRequest,
  buildCompareLoaderArgs,
  buildGraphQLResponseWithErrors,
  buildRouteLoaderGraphQLError,
  buildSavedComparisonsLoaderArgs,
  buildSuccessfulDeleteResponse
} from "./saved-comparisons-test-helpers";
import type { DeleteSavedComparisonSetMutationResponse } from "./saved-comparisons-test-helpers";

const {
  commitMutationMock,
  fetchRouteQueryMock,
  useLazyLoadQueryMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRouteErrorMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  fetchRouteQueryMock: vi.fn(),
  useLazyLoadQueryMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRouteErrorMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload"
  );

  return {
    ...actual,
    fetchRouteQuery: fetchRouteQueryMock,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useLazyLoadQuery: useLazyLoadQueryMock,
    useMutation: useMutationMock,
    usePreloadedQuery: usePreloadedQueryMock
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
    useRouteError: useRouteErrorMock
  };
});

const mockedFetchRouteQuery = vi.mocked(fetchRouteQuery);
const mockedUseLazyLoadQuery = vi.mocked(useLazyLoadQuery);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRouteError = vi.mocked(useRouteError);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

type CompareTestProduct = {
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

type CompareOfferTestNode = {
  id: string;
  currency: string;
  merchant: {
    id: string;
    name: string;
    domain?: string | null;
  } | null;
  latestPrice: {
    id: string;
    price: string;
    observedAt: string;
  } | null;
  activeCoupons?: {
    edges: Array<{
      node: {
        code: string;
        discountType: string;
        discountValue: string | null;
        currency: string | null;
        validTo: string | null;
      };
    }>;
    pageInfo: {
      hasNextPage: boolean;
    };
  } | null;
  priceHistory?: {
    edges: Array<{
      node: {
        id: string;
        price: string;
        observedAt: string;
      };
    }>;
    pageInfo: {
      hasNextPage: boolean;
    };
  } | null;
};

const DETAIL_PRODUCT = {
  id: "UHJvZHVjdDox",
  name: "Detail Product",
  slug: "detail-product",
  description: "A narrow product detail baseline.",
  brand: {
    id: "brand-1",
    name: "Acme"
  },
  currentAttributes: []
} satisfies CompareTestProduct;
const SECOND_PRODUCT = {
  id: "UHJvZHVjdDoy",
  name: "Second Product",
  slug: "second-product",
  description: "Another product for comparison.",
  brand: {
    id: "brand-2",
    name: "Bravo"
  },
  currentAttributes: []
} satisfies CompareTestProduct;
const THIRD_PRODUCT = {
  id: "UHJvZHVjdDoz",
  name: "Third Product",
  slug: "third-product",
  description: "A third product for selection editing coverage.",
  brand: {
    id: "brand-3",
    name: "Charlie"
  },
  currentAttributes: []
} satisfies CompareTestProduct;

const DETAIL_PRODUCT_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: DETAIL_PRODUCT.slug }
  }
};

const SECOND_PRODUCT_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: SECOND_PRODUCT.slug }
  }
};

const THIRD_PRODUCT_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: THIRD_PRODUCT.slug }
  }
};

const DETAIL_PRODUCT_QUERY_REF = {
  dispose: vi.fn(),
  variables: DETAIL_PRODUCT_QUERY_DESCRIPTOR.__relayQuery.variables
};

const SECOND_PRODUCT_QUERY_REF = {
  dispose: vi.fn(),
  variables: SECOND_PRODUCT_QUERY_DESCRIPTOR.__relayQuery.variables
};

const THIRD_PRODUCT_QUERY_REF = {
  dispose: vi.fn(),
  variables: THIRD_PRODUCT_QUERY_DESCRIPTOR.__relayQuery.variables
};

const COMPARE_ROUTE_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "CompareRouteQuery",
    text: "query CompareRouteQuery($slugs: [String!]!, $offerFirst: Int!, $pickerFirst: Int!, $pickerAfter: String) { comparisonProducts(slugs: $slugs) { id } products(first: $pickerFirst, after: $pickerAfter) { edges { node { id } } } }",
    variables: {
      slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
      offerFirst: 3,
      pickerFirst: 24,
      pickerAfter: null
    }
  }
};

const COMPARE_ROUTE_QUERY_REF = {
  dispose: vi.fn(),
  variables: COMPARE_ROUTE_QUERY_DESCRIPTOR.__relayQuery.variables
};

const savedComparisonsQueryDescriptor = (variables: { first: number; after?: string }) => ({
  __relayQuery: {
    operationName: "SavedComparisonsRouteQuery",
    text: "query SavedComparisonsRouteQuery($first: Int!, $after: String) { mySavedComparisonSets(first: $first, after: $after) { edges { node { id } } } }",
    variables
  }
});

const SAVED_COMPARISONS_FIRST_PAGE_DESCRIPTOR = savedComparisonsQueryDescriptor({ first: 20 });

const buildFetchedProductQuery = (
  product: CompareTestProduct | null,
  descriptor:
    | typeof DETAIL_PRODUCT_QUERY_DESCRIPTOR
    | typeof SECOND_PRODUCT_QUERY_DESCRIPTOR
    | typeof THIRD_PRODUCT_QUERY_DESCRIPTOR
) => ({
  data: {
    product,
    comparisonProducts: [
      product
        ? {
            ...product,
            merchantProducts: buildOfferContextConnection({ offers: [] })
          }
        : null
    ],
    products: {
      edges: [],
      pageInfo: {
        endCursor: null,
        hasNextPage: false
      }
    }
  },
  descriptor,
  dispose: vi.fn()
});

const COMPARE_OFFER_CONTEXT_TEST_PAGE_SIZE = 3;

const buildOfferContextConnection = ({
  hasNextPage = false,
  offers
}: {
  hasNextPage?: boolean;
  offers: CompareOfferTestNode[];
}) => ({
  edges: offers.map((node, index) => ({
    cursor: `offer-cursor-${index + 1}`,
    node: {
      activeCoupons: {
        edges: node.activeCoupons?.edges ?? [],
        pageInfo: {
          hasNextPage: node.activeCoupons?.pageInfo.hasNextPage ?? false
        }
      },
      priceHistory: {
        edges: node.priceHistory?.edges ?? [],
        pageInfo: {
          hasNextPage: node.priceHistory?.pageInfo.hasNextPage ?? false
        }
      },
      ...node
    }
  })),
  pageInfo: {
    endCursor: offers.length > 0 ? `offer-cursor-${offers.length}` : null,
    hasNextPage
  }
});

const buildFetchedCompareRouteQuery = ({
  products,
  offerConnections = new Map<string, ReturnType<typeof buildOfferContextConnection> | null>()
}: {
  products: Array<CompareTestProduct | null>;
  offerConnections?: Map<string, ReturnType<typeof buildOfferContextConnection> | null>;
}) => ({
  data: {
    comparisonProducts: products.map((product) =>
      product
        ? {
            ...product,
            merchantProducts: offerConnections.has(product.id)
              ? offerConnections.get(product.id)
              : buildOfferContextConnection({ offers: [] })
          }
        : null
    ),
    products: {
      edges: [],
      pageInfo: {
        endCursor: null,
        hasNextPage: false
      }
    }
  },
  descriptor: COMPARE_ROUTE_QUERY_DESCRIPTOR,
  dispose: vi.fn()
});

const buildAvailableOfferContextSummary = (
  productId: string,
  overrides: Partial<{
    activeOfferCount: number;
    bestCurrentPrice: {
      currency: string;
      merchantName: string | null;
      price: string;
    } | null;
    hasLoadedCoupons: boolean;
    hasMoreActiveOffers: boolean;
    hasMoreCoupons: boolean;
    latestPriceObservedAt: string | null;
  }> = {}
) => ({
  status: "available" as const,
  productId,
  activeOfferCount: 0,
  bestCurrentPrice: null,
  hasLoadedCoupons: false,
  hasMoreActiveOffers: false,
  hasMoreCoupons: false,
  latestPriceObservedAt: null,
  ...overrides
});

const buildUnavailableOfferContextSummary = (productId: string) => ({
  status: "unavailable" as const,
  productId
});

const buildDefaultOfferContexts = () => ({
  [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id),
  [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id),
  [THIRD_PRODUCT.id]: buildAvailableOfferContextSummary(THIRD_PRODUCT.id)
});

const buildProductSummary = (product: CompareTestProduct) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  description: product.description,
  brandName: product.brand.name,
  currentAttributes: product.currentAttributes.map((attribute) => ({
    attributeId: attribute.attributeId,
    code: attribute.code,
    displayName: attribute.displayName,
    valueText: attribute.valueText,
    sortOrder: attribute.sortOrder,
    groupLabel: attribute.groupLabel,
    isRequired: attribute.isRequired,
    numericValue: attribute.numericValue,
    booleanValue: attribute.booleanValue,
    enumOptionId: attribute.enumOptionId,
    unitSymbol: attribute.unitSymbol
  }))
});

const buildSavedComparisonPage = ({
  endCursor = null,
  hasNextPage = false,
  savedSets
}: {
  endCursor?: string | null;
  hasNextPage?: boolean;
  savedSets: Array<{
    id: string;
    name: string;
    slugs: string[];
  }>;
}) => ({
  mySavedComparisonSets: {
    edges: savedSets.map((savedSet) => ({
      node: {
        id: savedSet.id,
        name: savedSet.name,
        items: savedSet.slugs.map((slug, index) => ({
          position: index + 1,
          product: {
            slug
          }
        }))
      }
    })),
    pageInfo: {
      hasNextPage,
      endCursor
    }
  }
});

const buildFetchedSavedComparisonPage = (
  data: unknown,
  descriptor = SAVED_COMPARISONS_FIRST_PAGE_DESCRIPTOR
) => ({
  data,
  descriptor,
  dispose: vi.fn()
});

const buildReadyCompareLoaderData = (
  overrides: Partial<Extract<CompareRouteLoaderData, { status: "ready" }>> = {}
) => ({
  status: "ready" as const,
  specMode: "shared" as const,
  slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
  query: COMPARE_ROUTE_QUERY_DESCRIPTOR,
  productQueries: [DETAIL_PRODUCT_QUERY_DESCRIPTOR, SECOND_PRODUCT_QUERY_DESCRIPTOR],
  offerContexts: buildDefaultOfferContexts(),
  products: [
    buildProductSummary(DETAIL_PRODUCT),
    buildProductSummary(SECOND_PRODUCT)
  ],
  ...overrides
});

beforeEach(() => {
  commitMutationMock.mockReset();
  fetchRouteQueryMock.mockReset();
  useLazyLoadQueryMock.mockReset();
  useLoaderDataMock.mockReset();
  useMutationMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRouteErrorMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  DETAIL_PRODUCT_QUERY_REF.dispose.mockReset();
  SECOND_PRODUCT_QUERY_REF.dispose.mockReset();
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: []
    }
  });
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
  mockCompareRouteQueries();
});

test("compare path helpers normalize selected slugs and cap serialized route query strings", () => {
  expect(
    selectedCompareSlugsFromSearch(
      "?slug=detail-product&slug=&slug=second-product&slug=detail-product"
    )
  ).toEqual(["detail-product", "second-product"]);
  expect(
    selectedCompareSlugsAfterAdding(["detail-product"], "second-product", MAX_COMPARE_PRODUCTS)
  ).toEqual(["detail-product", "second-product"]);
  expect(
    selectedCompareSlugsAfterAdding(["detail-product"], "detail-product", MAX_COMPARE_PRODUCTS)
  ).toEqual(["detail-product"]);
  expect(
    buildCurrentRoutePathWithCompareSlugs(
      "/products",
      "?first=24&slug=detail-product&typeTaxonId=type-laptops",
      [
        DETAIL_PRODUCT.slug,
        SECOND_PRODUCT.slug,
        THIRD_PRODUCT.slug,
        "fourth-product"
      ]
    )
  ).toBe(
    "/products?first=24&typeTaxonId=type-laptops&slug=detail-product&slug=second-product&slug=third-product"
  );
  expect(
    buildComparePathFromSlugs(
      [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug, THIRD_PRODUCT.slug, "fourth-product"],
      { specMode: "all" }
    )
  ).toBe("/compare?slug=detail-product&slug=second-product&slug=third-product&specs=all");
});

test("compare loader returns an empty state when no slugs are selected", async () => {
  await expect(
    compareLoader(buildCompareLoaderArgs())
  ).resolves.toEqual({
    specMode: "shared",
    status: "empty",
    slugs: []
  });
});

test.each([
  ["all", "all"],
  ["differences", "differences"],
  ["", "shared"],
  ["unsupported", "shared"]
] as const)(
  "compare loader parses specs=%s as %s mode",
  async (rawSpecMode, expectedSpecMode) => {
    await expect(
      compareLoader(
        buildCompareLoaderArgs({
          request: new Request(`https://app.example.com/compare?specs=${rawSpecMode}`)
        })
      )
    ).resolves.toEqual({
      specMode: expectedSpecMode,
      status: "empty",
      slugs: []
    });
  }
);

test("compare loader rejects more than three selected slugs", async () => {
  await expect(
    compareLoader(
      buildCompareLoaderArgs({
        request: new Request(
          "https://app.example.com/compare?slug=one&slug=two&slug=three&slug=four"
        )
      })
    )
  ).resolves.toEqual({
    specMode: "shared",
    status: "too_many",
    slugs: ["one", "two", "three", "four"]
  });
});

test("compare loader requests selected product details and preserves URL order", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product"
  );

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({ products: [DETAIL_PRODUCT, SECOND_PRODUCT] })
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request }))
  ).resolves.toMatchObject({
    status: "ready",
    specMode: "shared",
    slugs: ["detail-product", "second-product"],
    query: COMPARE_ROUTE_QUERY_DESCRIPTOR,
    productQueries: [
      {
        __relayQuery: {
          operationName: "ProductDetailRouteQuery",
          variables: { slug: DETAIL_PRODUCT.slug }
        }
      },
      {
        __relayQuery: {
          operationName: "ProductDetailRouteQuery",
          variables: { slug: SECOND_PRODUCT.slug }
        }
      }
    ],
    offerContexts: {
      [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id),
      [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id)
    },
    products: [
      buildProductSummary(DETAIL_PRODUCT),
      buildProductSummary(SECOND_PRODUCT)
    ]
  });

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      slugs: ["detail-product", "second-product"],
      offerFirst: COMPARE_OFFER_CONTEXT_TEST_PAGE_SIZE,
      pickerFirst: 24,
      pickerAfter: null
    },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("compare loader preserves typed attribute metadata for compare rows", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare?slug=detail-product");
  const productWithMetadata = {
    ...DETAIL_PRODUCT,
    currentAttributes: [
      {
        attributeId: "QXR0cmlidXRlOjE=",
        code: "refresh-rate",
        displayName: "Refresh rate",
        dataType: "numeric",
        valueText: "144 Hz",
        sortOrder: 2,
        groupLabel: "Performance",
        isRequired: true,
        numericValue: "144",
        booleanValue: null,
        enumOptionId: null,
        unitSymbol: "Hz"
      }
    ]
  } satisfies CompareTestProduct;

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedProductQuery(productWithMetadata, DETAIL_PRODUCT_QUERY_DESCRIPTOR)
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request }))
  ).resolves.toMatchObject({
    status: "ready",
    products: [
      {
        currentAttributes: [
          {
            attributeId: "QXR0cmlidXRlOjE=",
            code: "refresh-rate",
            displayName: "Refresh rate",
            valueText: "144 Hz",
            sortOrder: 2,
            groupLabel: "Performance",
            isRequired: true,
            numericValue: "144",
            booleanValue: null,
            enumOptionId: null,
            unitSymbol: "Hz"
          }
        ]
      }
    ],
    offerContexts: {
      [productWithMetadata.id]: buildAvailableOfferContextSummary(productWithMetadata.id)
    }
  });
});

test("compare loader summarizes bounded offer-context pages without treating incomplete pages as globally ranked", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product"
  );
  const detailOffers = buildOfferContextConnection({
    hasNextPage: true,
    offers: [
      {
        id: "merchant-product-1",
        currency: "USD",
        merchant: {
          id: "merchant-1",
          name: "Full Price Shop",
          domain: "full.example"
        },
        latestPrice: {
          id: "price-1",
          price: "249.99",
          observedAt: "2026-06-27T08:00:00Z"
        },
        activeCoupons: {
          edges: [],
          pageInfo: {
            hasNextPage: false
          }
        },
        priceHistory: {
          edges: [
            {
              node: {
                id: "history-1",
                price: "259.99",
                observedAt: "2026-06-26T08:00:00Z"
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
        currency: "USD",
        merchant: {
          id: "merchant-2",
          name: "Value Mart",
          domain: "value.example"
        },
        latestPrice: {
          id: "price-2",
          price: "199.99",
          observedAt: "2026-06-29T12:00:00Z"
        },
        activeCoupons: {
          edges: [
            {
              node: {
                code: "SAVE20",
                discountType: "PERCENT",
                discountValue: "20",
                currency: null,
                validTo: "2026-07-15T00:00:00Z"
              }
            }
          ],
          pageInfo: {
            hasNextPage: true
          }
        },
        priceHistory: {
          edges: [
            {
              node: {
                id: "history-2",
                price: "199.99",
                observedAt: "2026-06-29T12:00:00Z"
              }
            }
          ],
          pageInfo: {
            hasNextPage: true
          }
        }
      },
      {
        id: "merchant-product-3",
        currency: "USD",
        merchant: {
          id: "merchant-3",
          name: "Budget Depot",
          domain: "budget.example"
        },
        latestPrice: {
          id: "price-3",
          price: "219.99",
          observedAt: "2026-06-28T09:00:00Z"
        },
        activeCoupons: {
          edges: [],
          pageInfo: {
            hasNextPage: false
          }
        }
      }
    ]
  });
  const secondOffers = buildOfferContextConnection({
    offers: [
      {
        id: "merchant-product-4",
        currency: "USD",
        merchant: {
          id: "merchant-4",
          name: "Shop Two",
          domain: "two.example"
        },
        latestPrice: {
          id: "price-4",
          price: "299.50",
          observedAt: "2026-06-24T10:00:00Z"
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
    ]
  });

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({
      products: [DETAIL_PRODUCT, SECOND_PRODUCT],
      offerConnections: new Map([
        [DETAIL_PRODUCT.id, detailOffers],
        [SECOND_PRODUCT.id, secondOffers]
      ])
    })
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request }))
  ).resolves.toMatchObject({
    status: "ready",
    offerContexts: {
      [DETAIL_PRODUCT.id]: {
        status: "available",
        productId: DETAIL_PRODUCT.id,
        activeOfferCount: 3,
        bestCurrentPrice: null,
        hasLoadedCoupons: true,
        hasMoreActiveOffers: true,
        hasMoreCoupons: true,
        latestPriceObservedAt: "2026-06-29T12:00:00Z"
      },
      [SECOND_PRODUCT.id]: {
        status: "available",
        productId: SECOND_PRODUCT.id,
        activeOfferCount: 1,
        bestCurrentPrice: {
          currency: "USD",
          merchantName: "Shop Two",
          price: "299.50"
        },
        hasLoadedCoupons: false,
        hasMoreActiveOffers: false,
        hasMoreCoupons: false,
        latestPriceObservedAt: "2026-06-24T10:00:00Z"
      }
    }
  });
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("compare loader does not paginate offer context past the first page", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare?slug=detail-product");
  const connection = buildOfferContextConnection({
    hasNextPage: true,
    offers: [
      {
        id: "merchant-product-1",
        currency: "USD",
        merchant: {
          id: "merchant-1",
          name: "Merchant 1"
        },
        latestPrice: null
      }
    ]
  });

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({
      products: [DETAIL_PRODUCT],
      offerConnections: new Map([[DETAIL_PRODUCT.id, connection]])
    })
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request }))
  ).resolves.toMatchObject({
    status: "ready",
    offerContexts: {
      [DETAIL_PRODUCT.id]: {
        status: "available",
        activeOfferCount: 1,
        hasMoreActiveOffers: true
      }
    }
  });
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("compare loader does not choose a best current price across mixed currencies", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare?slug=detail-product");

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({
      products: [DETAIL_PRODUCT],
      offerConnections: new Map([
        [
          DETAIL_PRODUCT.id,
          buildOfferContextConnection({
          offers: [
            {
              id: "merchant-product-usd",
              currency: "USD",
              merchant: {
                id: "merchant-usd",
                name: "US Shop"
              },
              latestPrice: {
                id: "price-usd",
                price: "199.99",
                observedAt: "2026-06-29T12:00:00Z"
              }
            },
            {
              id: "merchant-product-eur",
              currency: "EUR",
              merchant: {
                id: "merchant-eur",
                name: "EU Shop"
              },
              latestPrice: {
                id: "price-eur",
                price: "149.99",
                observedAt: "2026-06-29T13:00:00Z"
              }
            }
          ]
          })
        ]
      ])
    })
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request }))
  ).resolves.toMatchObject({
    status: "ready",
    offerContexts: {
      [DETAIL_PRODUCT.id]: {
        status: "available",
        activeOfferCount: 2,
        bestCurrentPrice: null,
        latestPriceObservedAt: "2026-06-29T13:00:00Z"
      }
    }
  });
});

test("compare loader keeps product specs when one offer-context query fails", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product"
  );
  const detailOffers = buildOfferContextConnection({
    offers: [
      {
        id: "merchant-product-1",
        currency: "USD",
        merchant: {
          id: "merchant-1",
          name: "Value Mart"
        },
        latestPrice: {
          id: "price-1",
          price: "199.99",
          observedAt: "2026-06-29T12:00:00Z"
        },
        activeCoupons: {
          edges: [],
          pageInfo: {
            hasNextPage: false
          }
        }
      }
    ]
  });

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({
      products: [DETAIL_PRODUCT, SECOND_PRODUCT],
      offerConnections: new Map([
        [DETAIL_PRODUCT.id, detailOffers],
        [SECOND_PRODUCT.id, null]
      ])
    })
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request }))
  ).resolves.toMatchObject({
    status: "ready",
    products: [
      buildProductSummary(DETAIL_PRODUCT),
      buildProductSummary(SECOND_PRODUCT)
    ],
    offerContexts: {
      [DETAIL_PRODUCT.id]: {
        status: "available"
      },
      [SECOND_PRODUCT.id]: buildUnavailableOfferContextSummary(SECOND_PRODUCT.id)
    }
  });
});

test("compare loader rethrows an aborted combined request", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product"
  );
  const abortError = new DOMException("The operation was aborted.", "AbortError");
  mockedFetchRouteQuery.mockRejectedValueOnce(abortError);

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request }))
  ).rejects.toBe(abortError);
});

test("compare loader rethrows combined request failures when the route signal is aborted", async () => {
  const controller = new AbortController();
  const environment = createRelayEnvironment();
  const request = buildAbortableRequest(
    "https://app.example.com/compare?slug=detail-product",
    controller.signal
  );
  const abortedFetchError = new Error("route request was aborted");

  controller.abort();
  mockedFetchRouteQuery.mockRejectedValueOnce(abortedFetchError);

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request }))
  ).rejects.toBe(abortedFetchError);
});

test("compare loader forwards the route abort signal to the combined Relay preload", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product"
  );
  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({ products: [DETAIL_PRODUCT, SECOND_PRODUCT] })
  );

  await compareLoader(buildCompareLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
      offerFirst: COMPARE_OFFER_CONTEXT_TEST_PAGE_SIZE,
      pickerFirst: 24,
      pickerAfter: null
    },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("compare loader returns not_found when any selected product is missing", async () => {
  const environment = createRelayEnvironment();
  const combinedQuery = buildFetchedCompareRouteQuery({
    products: [DETAIL_PRODUCT, null]
  });

  mockedFetchRouteQuery.mockResolvedValueOnce(combinedQuery);

  await expect(
    compareLoader(
      buildCompareLoaderArgs({
        environment,
        request: new Request(
          "https://app.example.com/compare?slug=detail-product&slug=missing-product"
        )
      })
    )
  ).resolves.toEqual({
    status: "not_found",
    specMode: "shared",
    slugs: ["detail-product", "missing-product"]
  });
  expect(combinedQuery.dispose).toHaveBeenCalledTimes(1);
});

test("compare loader throws when the combined request fails", async () => {
  const environment = createRelayEnvironment();
  mockedFetchRouteQuery.mockRejectedValueOnce(new Error("Network request failed: boom"));

  await expect(
    compareLoader(
      buildCompareLoaderArgs({
        environment,
        request: new Request(
          "https://app.example.com/compare?slug=detail-product&slug=broken-product"
        )
      })
    )
  ).rejects.toThrow("Network request failed: boom");
});

test("compare loader rethrows AbortError-like rejected reasons without wrapping", async () => {
  const environment = createRelayEnvironment();
  const abortError = {
    name: "AbortError",
    message: "The operation was aborted."
  };

  mockedFetchRouteQuery.mockRejectedValueOnce(abortError);

  await expect(
    compareLoader(
      buildCompareLoaderArgs({
        environment,
        request: new Request("https://app.example.com/compare?slug=detail-product")
      })
    )
  ).rejects.toBe(abortError);
});

test("compare loader wraps non-error rejected reasons with the original cause", async () => {
  const environment = createRelayEnvironment();
  const rejectionReason = "relay transport failed";
  let caughtError: unknown;

  mockedFetchRouteQuery.mockRejectedValueOnce(rejectionReason);

  try {
    await compareLoader(
      buildCompareLoaderArgs({
        environment,
        request: new Request("https://app.example.com/compare?slug=detail-product")
      })
    );
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toBeInstanceOf(Error);
  expect((caughtError as Error).message).toBe("Comparison fetch failed");
  expect((caughtError as Error & { cause?: unknown }).cause).toBe(rejectionReason);
});

test("compare loader gives combined request failures precedence over missing-product handling", async () => {
  const environment = createRelayEnvironment();
  mockedFetchRouteQuery.mockRejectedValueOnce(new Error("Network request failed: boom"));

  await expect(
    compareLoader(
      buildCompareLoaderArgs({
        environment,
        request: new Request(
          "https://app.example.com/compare?slug=detail-product&slug=broken-product"
        )
      })
    )
  ).rejects.toThrow("Network request failed: boom");
});

test("empty compare page lets users choose products without editing the URL", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    specMode: "shared",
    slugs: []
  });
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "Product:monitor-a",
            name: "Monitor A",
            slug: "monitor-a",
            brand: { id: "Brand:displayco", name: "DisplayCo" }
          }
        },
        {
          node: {
            id: "Product:monitor-b",
            name: "Monitor B",
            slug: "monitor-b",
            brand: { id: "Brand:viewco", name: "ViewCo" }
          }
        }
      ]
    }
  });

  renderCompareRoute();

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Choose products" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Monitor A" })).toHaveAttribute(
    "href",
    "/compare?slug=monitor-a"
  );
  expect(screen.getByRole("link", { name: "Compare Monitor B" })).toHaveAttribute(
    "href",
    "/compare?slug=monitor-b"
  );
  expect(mockedUseLazyLoadQuery).toHaveBeenCalledWith(
    expect.anything(),
    { first: 24, after: null },
    { fetchPolicy: "store-or-network" }
  );
});

test("product picker can advance beyond the first picker page", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    specMode: "shared",
    slugs: []
  });
  mockedUseLazyLoadQuery.mockImplementation((_query, variables) => {
    if ((variables as { after?: string | null }).after === "next-products") {
      return {
        products: {
          edges: [
            {
              node: {
                id: "Product:monitor-c",
                name: "Monitor C",
                slug: "monitor-c",
                brand: { id: "Brand:panelco", name: "PanelCo" }
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        }
      };
    }

    return {
      products: {
        edges: [],
        pageInfo: {
          hasNextPage: true,
          endCursor: "next-products"
        }
      }
    };
  });

  renderCompareRoute();

  fireEvent.click(screen.getByRole("button", { name: "Show more products" }));

  expect(mockedUseLazyLoadQuery).toHaveBeenLastCalledWith(
    expect.anything(),
    { first: 24, after: "next-products" },
    { fetchPolicy: "store-or-network" }
  );
  expect(screen.getByRole("link", { name: "Compare Monitor C" })).toHaveAttribute(
    "href",
    "/compare?slug=monitor-c"
  );
});

test("product picker keeps previous products visible when loading another page", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    specMode: "shared",
    slugs: []
  });
  mockedUseLazyLoadQuery.mockImplementation((_query, variables) => {
    if ((variables as { after?: string | null }).after === "next-products") {
      return {
        products: {
          edges: [
            {
              node: {
                id: "Product:monitor-c",
                name: "Monitor C",
                slug: "monitor-c",
                brand: { id: "Brand:panelco", name: "PanelCo" }
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        }
      };
    }

    return {
      products: {
        edges: [
          {
            node: {
              id: "Product:monitor-a",
              name: "Monitor A",
              slug: "monitor-a",
              brand: { id: "Brand:displayco", name: "DisplayCo" }
            }
          }
        ],
        pageInfo: {
          hasNextPage: true,
          endCursor: "next-products"
        }
      }
    };
  });

  renderCompareRoute();

  expect(screen.getByRole("link", { name: "Compare Monitor A" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show more products" }));

  expect(screen.getByRole("link", { name: "Compare Monitor A" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Monitor C" })).toBeInTheDocument();
});

test("product picker resets pagination before rendering a changed selected set", () => {
  let loaderData: CompareRouteLoaderData = {
    status: "ready",
    specMode: "shared",
    slugs: [DETAIL_PRODUCT.slug],
    query: COMPARE_ROUTE_QUERY_DESCRIPTOR,
    productQueries: [DETAIL_PRODUCT_QUERY_DESCRIPTOR],
    offerContexts: {
      [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id)
    },
    products: [buildProductSummary(DETAIL_PRODUCT)]
  };
  mockedUseLoaderData.mockImplementation(() => loaderData);
  mockedUseLazyLoadQuery
    .mockReturnValueOnce({
      products: {
        edges: [],
        pageInfo: {
          hasNextPage: true,
          endCursor: "next-products"
        }
      }
    })
    .mockReturnValueOnce({
      products: {
        edges: [
          {
            node: {
              id: "Product:monitor-c",
              name: "Monitor C",
              slug: "monitor-c",
              brand: { id: "Brand:panelco", name: "PanelCo" }
            }
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    })
    .mockReturnValue({
      products: {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    });

  const { rerender } = renderCompareRoute();
  fireEvent.click(screen.getByRole("button", { name: "Show more products" }));
  expect(mockedUseLazyLoadQuery).toHaveBeenLastCalledWith(
    expect.anything(),
    { first: 24, after: "next-products" },
    { fetchPolicy: "store-or-network" }
  );

  const callsBeforeSelectionChange = mockedUseLazyLoadQuery.mock.calls.length;
  loaderData = {
    status: "ready",
    specMode: "shared",
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
    query: COMPARE_ROUTE_QUERY_DESCRIPTOR,
    productQueries: [DETAIL_PRODUCT_QUERY_DESCRIPTOR, SECOND_PRODUCT_QUERY_DESCRIPTOR],
    offerContexts: {
      [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id),
      [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id)
    },
    products: [buildProductSummary(DETAIL_PRODUCT), buildProductSummary(SECOND_PRODUCT)]
  };

  rerender(
    <MemoryRouter>
      <CompareRoute />
    </MemoryRouter>
  );

  expect(mockedUseLazyLoadQuery.mock.calls[callsBeforeSelectionChange]?.[1]).toEqual({
    first: 24,
    after: null
  });
});

test("empty compare page handles an empty product picker", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    specMode: "shared",
    slugs: []
  });
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: []
    }
  });

  renderCompareRoute();

  expect(screen.getByText("No products are available to compare yet.")).toBeInTheDocument();
});

test("renders a limit message when more than three products are selected", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "too_many",
    specMode: "shared",
    slugs: ["one", "two", "three", "four"]
  });

  renderCompareRoute();

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(
    screen.getByText(`You can compare up to ${MAX_COMPARE_PRODUCTS} products.`)
  ).toBeInTheDocument();
});

test("renders compared product cards returned by the route loader", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  renderCompareRoute();

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Second Product" })).toBeInTheDocument();
});

test("ready compare page renders decision summary rows above the specification matrix", () => {
  const currentAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "144 Hz"
    }
  ];
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes
        }
      ],
      offerContexts: {
        [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id, {
          activeOfferCount: 3,
          bestCurrentPrice: {
            currency: "USD",
            merchantName: "Value Mart",
            price: "199.99"
          },
          hasLoadedCoupons: true,
          hasMoreActiveOffers: true,
          hasMoreCoupons: true,
          latestPriceObservedAt: "2026-06-29T12:00:00Z"
        }),
        [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id, {
          activeOfferCount: 1,
          bestCurrentPrice: {
            currency: "USD",
            merchantName: "Shop Two",
            price: "299.50"
          },
          hasLoadedCoupons: false,
          hasMoreActiveOffers: false,
          hasMoreCoupons: false,
          latestPriceObservedAt: "2026-06-24T10:00:00Z"
        })
      }
    })
  );

  renderCompareRoute();

  const decisionHeading = screen.getByRole("heading", { name: "Decision summary" });
  const specsHeading = screen.getByRole("heading", { name: "Shared specifications" });
  const decisionSummary = screen.getByRole("table", { name: "Decision summary" });

  expect(
    decisionHeading.compareDocumentPosition(specsHeading) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(within(decisionSummary).getByText("Best current price")).toBeVisible();
  expect(within(decisionSummary).getByText("199.99 USD at Value Mart")).toBeVisible();
  expect(within(decisionSummary).getByText("299.50 USD at Shop Two")).toBeVisible();
  expect(within(decisionSummary).getByText("Active offer count")).toBeVisible();
  expect(within(decisionSummary).getByText("3 loaded; More available")).toBeVisible();
  expect(within(decisionSummary).getByText("1 loaded")).toBeVisible();
  expect(within(decisionSummary).getByText("Coupon signal")).toBeVisible();
  expect(within(decisionSummary).getByText("More coupons available")).toBeVisible();
  expect(within(decisionSummary).getByText("No coupons loaded")).toBeVisible();
  expect(within(decisionSummary).getByText("Price recency")).toBeVisible();
  expect(within(decisionSummary).getByText("2026-06-29")).toBeVisible();
  expect(within(decisionSummary).getByText("2026-06-24")).toBeVisible();
  expect(
    within(decisionSummary).getByRole("link", { name: "Review Detail Product offers" })
  ).toHaveAttribute("href", `/offers?productId=${DETAIL_PRODUCT.id}`);
  expect(
    within(decisionSummary).getByRole("link", { name: "Review Second Product offers" })
  ).toHaveAttribute("href", `/offers?productId=${SECOND_PRODUCT.id}`);
});

test("ready compare page keeps specs visible when one offer context is unavailable", () => {
  const currentAttributes = [
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS"
    }
  ];
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes
        }
      ],
      offerContexts: {
        [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id, {
          activeOfferCount: 1,
          bestCurrentPrice: {
            currency: "USD",
            merchantName: "Value Mart",
            price: "199.99"
          },
          latestPriceObservedAt: "2026-06-29T12:00:00Z"
        }),
        [SECOND_PRODUCT.id]: buildUnavailableOfferContextSummary(SECOND_PRODUCT.id)
      }
    })
  );

  renderCompareRoute();

  const decisionSummary = screen.getByRole("table", { name: "Decision summary" });
  const matrix = screen.getByRole("table", { name: "Shared specifications" });

  expect(within(decisionSummary).getByText("Offer context unavailable")).toBeVisible();
  expect(within(matrix).getByText("Panel type")).toBeVisible();
  expect(within(matrix).getAllByText("IPS")).toHaveLength(2);
});

test("ready compare cards render product attributes", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === DETAIL_PRODUCT_QUERY_REF) {
      return {
        product: {
          ...DETAIL_PRODUCT,
          currentAttributes: [
            {
              code: "refresh-rate",
              displayName: "Refresh rate",
              dataType: "numeric",
              valueText: "144 Hz"
            }
          ]
        }
      };
    }

    if (queryRef === SECOND_PRODUCT_QUERY_REF) {
      return {
        product: {
          ...SECOND_PRODUCT,
          currentAttributes: [
            {
              code: "refresh-rate",
              displayName: "Refresh rate",
              dataType: "numeric",
              valueText: "165 Hz"
            }
          ]
        }
      };
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });

  renderCompareRoute();

  expect(screen.getByText("144 Hz")).toBeVisible();
  expect(screen.getByText("165 Hz")).toBeVisible();
  expect(screen.getAllByText("Refresh rate")).toHaveLength(2);
});

test("ready compare page aligns shared product attributes in a matrix", () => {
  const detailProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      dataType: "numeric",
      valueText: "144 Hz"
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      dataType: "enum",
      valueText: "IPS"
    },
    {
      code: "brightness",
      displayName: "Brightness",
      dataType: "numeric",
      valueText: "350 nits"
    }
  ];
  const secondProductAttributes = [
    {
      code: "panel-type",
      displayName: "Panel type",
      dataType: "enum",
      valueText: "OLED"
    },
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      dataType: "numeric",
      valueText: "165 Hz"
    }
  ];

  mockedUseLoaderData.mockReturnValue({
    ...buildReadyCompareLoaderData(),
    products: [
      {
        ...buildProductSummary(DETAIL_PRODUCT),
        currentAttributes: detailProductAttributes.map(({ code, displayName, valueText }) => ({
          code,
          displayName,
          valueText
        }))
      },
      {
        ...buildProductSummary(SECOND_PRODUCT),
        currentAttributes: secondProductAttributes.map(({ code, displayName, valueText }) => ({
          code,
          displayName,
          valueText
        }))
      }
    ]
  });
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === DETAIL_PRODUCT_QUERY_REF) {
      return {
        product: {
          ...DETAIL_PRODUCT,
          currentAttributes: detailProductAttributes
        }
      };
    }

    if (queryRef === SECOND_PRODUCT_QUERY_REF) {
      return {
        product: {
          ...SECOND_PRODUCT,
          currentAttributes: secondProductAttributes
        }
      };
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });

  renderCompareRoute();

  const matrix = screen.getByRole("table", { name: "Shared specifications" });
  const rows = within(matrix).getAllByRole("row");

  expect(within(rows[0]).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "Specification",
    "Detail Product",
    "Second Product"
  ]);
  expect(rows[1]).toHaveTextContent("Panel type");
  expect(rows[1]).toHaveTextContent("IPS");
  expect(rows[1]).toHaveTextContent("OLED");
  expect(rows[2]).toHaveTextContent("Refresh rate");
  expect(rows[2]).toHaveTextContent("144 Hz");
  expect(rows[2]).toHaveTextContent("165 Hz");
  expect(within(matrix).queryByText("Brightness")).not.toBeInTheDocument();
  expect(screen.getByText("350 nits")).toBeVisible();
});

test("ready compare matrix orders specification rows by sort order before display name", () => {
  const detailProductAttributes = [
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS",
      sortOrder: 30
    },
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "144 Hz",
      sortOrder: 10
    },
    {
      code: "brightness",
      displayName: "Brightness",
      valueText: "350 nits",
      sortOrder: 20
    }
  ];
  const secondProductAttributes = [
    {
      code: "brightness",
      displayName: "Brightness",
      valueText: "400 nits",
      sortOrder: 20
    },
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "165 Hz",
      sortOrder: 10
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "OLED",
      sortOrder: 30
    }
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "all",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: detailProductAttributes
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: secondProductAttributes
        }
      ]
    })
  );

  renderCompareRoute();

  const matrix = screen.getByRole("table", { name: "All specifications" });
  const rows = within(matrix).getAllByRole("row");

  expect(rows[1]).toHaveTextContent("Refresh rate");
  expect(rows[2]).toHaveTextContent("Brightness");
  expect(rows[3]).toHaveTextContent("Panel type");
});

test("ready compare page renders an empty shared-attribute state when no attributes overlap", () => {
  const detailProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      dataType: "numeric",
      valueText: "144 Hz"
    }
  ];
  const secondProductAttributes = [
    {
      code: "panel-type",
      displayName: "Panel type",
      dataType: "enum",
      valueText: "OLED"
    }
  ];

  mockedUseLoaderData.mockReturnValue({
    ...buildReadyCompareLoaderData(),
    products: [
      {
        ...buildProductSummary(DETAIL_PRODUCT),
        currentAttributes: detailProductAttributes.map(({ code, displayName, valueText }) => ({
          code,
          displayName,
          valueText
        }))
      },
      {
        ...buildProductSummary(SECOND_PRODUCT),
        currentAttributes: secondProductAttributes.map(({ code, displayName, valueText }) => ({
          code,
          displayName,
          valueText
        }))
      }
    ]
  });
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === DETAIL_PRODUCT_QUERY_REF) {
      return {
        product: {
          ...DETAIL_PRODUCT,
          currentAttributes: detailProductAttributes
        }
      };
    }

    if (queryRef === SECOND_PRODUCT_QUERY_REF) {
      return {
        product: {
          ...SECOND_PRODUCT,
          currentAttributes: secondProductAttributes
        }
      };
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });

  renderCompareRoute();

  expect(screen.getByRole("heading", { name: "Shared specifications" })).toBeInTheDocument();
  expect(screen.getByText("No shared specifications across these products yet.")).toBeVisible();
  expect(screen.queryByRole("table", { name: "Shared specifications" })).not.toBeInTheDocument();
});

test("ready compare matrix uses the first attribute value for duplicate codes", () => {
  const detailProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      dataType: "numeric",
      valueText: "144 Hz"
    },
    {
      code: "refresh-rate",
      displayName: "Refresh rate duplicate",
      dataType: "numeric",
      valueText: "Overwritten duplicate"
    }
  ];
  const secondProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      dataType: "numeric",
      valueText: "165 Hz"
    }
  ];

  mockedUseLoaderData.mockReturnValue({
    ...buildReadyCompareLoaderData(),
    products: [
      {
        ...buildProductSummary(DETAIL_PRODUCT),
        currentAttributes: detailProductAttributes.map(({ code, displayName, valueText }) => ({
          code,
          displayName,
          valueText
        }))
      },
      {
        ...buildProductSummary(SECOND_PRODUCT),
        currentAttributes: secondProductAttributes.map(({ code, displayName, valueText }) => ({
          code,
          displayName,
          valueText
        }))
      }
    ]
  });
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === DETAIL_PRODUCT_QUERY_REF) {
      return {
        product: {
          ...DETAIL_PRODUCT,
          currentAttributes: detailProductAttributes
        }
      };
    }

    if (queryRef === SECOND_PRODUCT_QUERY_REF) {
      return {
        product: {
          ...SECOND_PRODUCT,
          currentAttributes: secondProductAttributes
        }
      };
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });

  renderCompareRoute();

  const matrix = screen.getByRole("table", { name: "Shared specifications" });

  expect(within(matrix).getByText("144 Hz")).toBeVisible();
  expect(within(matrix).queryByText("Overwritten duplicate")).not.toBeInTheDocument();
  expect(within(matrix).queryByText("Refresh rate duplicate")).not.toBeInTheDocument();
});

test("ready compare page renders specification mode links with stable URL state", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences"
    })
  );

  renderCompareRoute();

  expect(screen.getByRole("link", { name: "Shared specs" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product"
  );
  expect(screen.getByRole("link", { name: "Differences" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&specs=differences"
  );
  expect(screen.getByRole("link", { name: "Differences" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  expect(screen.getByRole("link", { name: "All specs" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&specs=all"
  );
});

test("ready compare page preserves specification mode in product-picker append links", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "all"
    })
  );
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "Product:monitor-c",
            name: "Monitor C",
            slug: "monitor-c",
            brand: { id: "Brand:panelco", name: "PanelCo" }
          }
        }
      ]
    }
  });

  renderCompareRoute();

  expect(screen.getByRole("link", { name: "Compare Monitor C" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&slug=monitor-c&specs=all"
  );
});

test("ready compare page preserves specification mode in remove links", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
      slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug, THIRD_PRODUCT.slug],
      productQueries: [
        DETAIL_PRODUCT_QUERY_DESCRIPTOR,
        SECOND_PRODUCT_QUERY_DESCRIPTOR,
        THIRD_PRODUCT_QUERY_DESCRIPTOR
      ],
      products: [
        buildProductSummary(DETAIL_PRODUCT),
        buildProductSummary(SECOND_PRODUCT),
        buildProductSummary(THIRD_PRODUCT)
      ]
    })
  );

  renderCompareRoute();

  const selectionTray = screen.getByRole("region", { name: "Selected products" });

  expect(
    within(selectionTray).getByRole("link", {
      name: "Remove Detail Product from selection"
    })
  ).toHaveAttribute(
    "href",
    "/compare?slug=second-product&slug=third-product&specs=differences"
  );
  expect(screen.getByRole("link", { name: "Remove Detail Product" })).toHaveAttribute(
    "href",
    "/compare?slug=second-product&slug=third-product&specs=differences"
  );
});

test("ready compare page renders all specification rows with missing cells", () => {
  const detailProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "144 Hz"
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS"
    }
  ];
  const secondProductAttributes = [
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS"
    },
    {
      code: "brightness",
      displayName: "Brightness",
      valueText: "350 nits"
    }
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "all",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: detailProductAttributes
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: secondProductAttributes
        }
      ]
    })
  );

  renderCompareRoute();

  const matrix = screen.getByRole("table", { name: "All specifications" });
  const rows = within(matrix).getAllByRole("row");

  expect(rows[1]).toHaveTextContent("Brightness");
  expect(rows[1]).toHaveTextContent("Not available");
  expect(rows[1]).toHaveTextContent("350 nits");
  expect(rows[2]).toHaveTextContent("Panel type");
  expect(rows[2]).toHaveTextContent("IPS");
  expect(rows[3]).toHaveTextContent("Refresh rate");
  expect(rows[3]).toHaveTextContent("144 Hz");
  expect(rows[3]).toHaveTextContent("Not available");
  expect(within(matrix).getAllByText("Not available")).toHaveLength(2);
});

test("ready compare page renders only different specification rows", () => {
  const detailProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "144 Hz"
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS"
    },
    {
      code: "weight",
      displayName: "Weight",
      valueText: "5 lb"
    }
  ];
  const secondProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "165 Hz"
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS"
    },
    {
      code: "brightness",
      displayName: "Brightness",
      valueText: "350 nits"
    }
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: detailProductAttributes
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: secondProductAttributes
        }
      ]
    })
  );

  renderCompareRoute();

  const matrix = screen.getByRole("table", { name: "Different specifications" });
  const rows = within(matrix).getAllByRole("row");

  expect(rows[1]).toHaveTextContent("Brightness");
  expect(rows[1]).toHaveTextContent("Not available");
  expect(rows[1]).toHaveTextContent("350 nits");
  expect(rows[2]).toHaveTextContent("Refresh rate");
  expect(rows[2]).toHaveTextContent("144 Hz");
  expect(rows[2]).toHaveTextContent("165 Hz");
  expect(rows[3]).toHaveTextContent("Weight");
  expect(rows[3]).toHaveTextContent("5 lb");
  expect(rows[3]).toHaveTextContent("Not available");
  expect(within(matrix).queryByText("Panel type")).not.toBeInTheDocument();
});

test("ready compare differences compare typed numeric and boolean values before display text", () => {
  const detailProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "144 Hz",
      numericValue: "144"
    },
    {
      code: "hdr",
      displayName: "HDR",
      valueText: "Yes",
      booleanValue: true
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS"
    }
  ];
  const secondProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "144.0 hertz",
      numericValue: "144"
    },
    {
      code: "hdr",
      displayName: "HDR",
      valueText: "true",
      booleanValue: true
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "OLED"
    }
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: detailProductAttributes
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: secondProductAttributes
        }
      ]
    })
  );

  renderCompareRoute();

  const matrix = screen.getByRole("table", { name: "Different specifications" });

  expect(within(matrix).queryByText("Refresh rate")).not.toBeInTheDocument();
  expect(within(matrix).queryByText("HDR")).not.toBeInTheDocument();
  expect(within(matrix).getByText("Panel type")).toBeVisible();
  expect(within(matrix).getByText("IPS")).toBeVisible();
  expect(within(matrix).getByText("OLED")).toBeVisible();
});

test("ready compare differences include numeric rows when units differ", () => {
  const detailProductAttributes = [
    {
      code: "depth",
      displayName: "Depth",
      valueText: "1 in",
      numericValue: "1.0",
      unitSymbol: "in"
    }
  ];
  const secondProductAttributes = [
    {
      code: "depth",
      displayName: "Depth",
      valueText: "1 cm",
      numericValue: "1",
      unitSymbol: "cm"
    }
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: detailProductAttributes
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: secondProductAttributes
        }
      ]
    })
  );

  renderCompareRoute();

  const matrix = screen.getByRole("table", { name: "Different specifications" });

  expect(within(matrix).getByText("Depth")).toBeVisible();
  expect(within(matrix).getByText("1 in")).toBeVisible();
  expect(within(matrix).getByText("1 cm")).toBeVisible();
});

test("ready compare differences normalize exponent numeric values", () => {
  const detailProductAttributes = [
    {
      code: "storage",
      displayName: "Storage",
      valueText: "1000 GB",
      numericValue: "1e3",
      unitSymbol: "GB"
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS"
    }
  ];
  const secondProductAttributes = [
    {
      code: "storage",
      displayName: "Storage",
      valueText: "1000.0 GB",
      numericValue: "1000",
      unitSymbol: "GB"
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "OLED"
    }
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: detailProductAttributes
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: secondProductAttributes
        }
      ]
    })
  );

  renderCompareRoute();

  const matrix = screen.getByRole("table", { name: "Different specifications" });

  expect(within(matrix).queryByText("Storage")).not.toBeInTheDocument();
  expect(within(matrix).getByText("Panel type")).toBeVisible();
  expect(within(matrix).getByText("IPS")).toBeVisible();
  expect(within(matrix).getByText("OLED")).toBeVisible();
});

test("ready compare page renders an empty differences state when specifications match", () => {
  const currentAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "144 Hz"
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS"
    }
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes
        }
      ]
    })
  );

  renderCompareRoute();

  expect(screen.getByRole("heading", { name: "Different specifications" })).toBeInTheDocument();
  expect(screen.getByText("No specification differences across these products yet.")).toBeVisible();
  expect(screen.queryByRole("table", { name: "Different specifications" })).not.toBeInTheDocument();
});

test("ready compare page lets users append a product without editing the URL", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: DETAIL_PRODUCT.id,
            name: DETAIL_PRODUCT.name,
            slug: DETAIL_PRODUCT.slug,
            brand: DETAIL_PRODUCT.brand
          }
        },
        {
          node: {
            id: "Product:monitor-c",
            name: "Monitor C",
            slug: "monitor-c",
            brand: { id: "Brand:panelco", name: "PanelCo" }
          }
        }
      ]
    }
  });

  renderCompareRoute();

  expect(screen.queryByRole("link", { name: "Compare Detail Product" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Monitor C" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&slug=monitor-c"
  );
});

test("ready compare page renders a selected-product tray with ordered remove links", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    specMode: "shared",
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug, THIRD_PRODUCT.slug],
    productQueries: [
      DETAIL_PRODUCT_QUERY_DESCRIPTOR,
      SECOND_PRODUCT_QUERY_DESCRIPTOR,
      THIRD_PRODUCT_QUERY_DESCRIPTOR
    ],
    products: [
      buildProductSummary(DETAIL_PRODUCT),
      buildProductSummary(SECOND_PRODUCT),
      buildProductSummary(THIRD_PRODUCT)
    ]
  });

  renderCompareRoute();

  const selectionTray = screen.getByRole("region", { name: "Selected products" });
  const selectedProducts = within(selectionTray).getAllByRole("listitem");
  const selectionCount = within(selectionTray).getByRole("status");

  expect(selectionCount).toHaveTextContent(
    `${MAX_COMPARE_PRODUCTS} of ${MAX_COMPARE_PRODUCTS} products selected.`
  );
  expect(selectionCount).toHaveAttribute("aria-live", "polite");
  expect(within(selectionTray).getByRole("link", { name: "Open comparison" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&slug=third-product"
  );
  expect(selectedProducts).toHaveLength(3);
  expect(selectedProducts[0]).toHaveTextContent("Detail Product");
  expect(selectedProducts[1]).toHaveTextContent("Second Product");
  expect(selectedProducts[2]).toHaveTextContent("Third Product");
  expect(
    within(selectedProducts[0]).getByRole("link", {
      name: "Remove Detail Product from selection"
    })
  ).toHaveAttribute("href", "/compare?slug=second-product&slug=third-product");
  expect(
    within(selectedProducts[1]).getByRole("link", {
      name: "Remove Second Product from selection"
    })
  ).toHaveAttribute("href", "/compare?slug=detail-product&slug=third-product");
  expect(
    within(selectedProducts[2]).getByRole("link", {
      name: "Remove Third Product from selection"
    })
  ).toHaveAttribute("href", "/compare?slug=detail-product&slug=second-product");
});

test("ready compare page handles an empty selected-product tray defensively", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    specMode: "shared",
    slugs: [],
    productQueries: [],
    products: []
  });

  renderCompareRoute();

  const selectionTray = screen.getByRole("region", { name: "Selected products" });
  const selectionCount = within(selectionTray).getByRole("status");

  expect(selectionCount).toHaveTextContent(`0 of ${MAX_COMPARE_PRODUCTS} products selected.`);
  expect(within(selectionTray).queryAllByRole("listitem")).toHaveLength(0);
  expect(
    within(selectionTray).queryByRole("link", { name: /Remove .+ from selection/ })
  ).not.toBeInTheDocument();
});

test("ready compare page labels the picker as an add-another-product path", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "Product:monitor-c",
            name: "Monitor C",
            slug: "monitor-c",
            brand: { id: "Brand:panelco", name: "PanelCo" }
          }
        }
      ]
    }
  });

  renderCompareRoute();

  expect(screen.getByRole("heading", { name: "Add another product" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Monitor C" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&slug=monitor-c"
  );
});

test("ready compare cards include a remove link for the first selected product", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    specMode: "shared",
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug, THIRD_PRODUCT.slug],
    productQueries: [
      DETAIL_PRODUCT_QUERY_DESCRIPTOR,
      SECOND_PRODUCT_QUERY_DESCRIPTOR,
      THIRD_PRODUCT_QUERY_DESCRIPTOR
    ],
    products: [
      buildProductSummary(DETAIL_PRODUCT),
      buildProductSummary(SECOND_PRODUCT),
      buildProductSummary(THIRD_PRODUCT)
    ]
  });

  renderCompareRoute();

  expect(screen.getByRole("link", { name: "Remove Detail Product" })).toHaveAttribute(
    "href",
    "/compare?slug=second-product&slug=third-product"
  );
});

test("ready compare cards include a remove link for a middle selected product", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    specMode: "shared",
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug, THIRD_PRODUCT.slug],
    productQueries: [
      DETAIL_PRODUCT_QUERY_DESCRIPTOR,
      SECOND_PRODUCT_QUERY_DESCRIPTOR,
      THIRD_PRODUCT_QUERY_DESCRIPTOR
    ],
    products: [
      buildProductSummary(DETAIL_PRODUCT),
      buildProductSummary(SECOND_PRODUCT),
      buildProductSummary(THIRD_PRODUCT)
    ]
  });

  renderCompareRoute();

  expect(screen.getByRole("link", { name: "Remove Second Product" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=third-product"
  );
});

test("ready compare cards include a remove link for the last selected product", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    specMode: "shared",
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug, THIRD_PRODUCT.slug],
    productQueries: [
      DETAIL_PRODUCT_QUERY_DESCRIPTOR,
      SECOND_PRODUCT_QUERY_DESCRIPTOR,
      THIRD_PRODUCT_QUERY_DESCRIPTOR
    ],
    products: [
      buildProductSummary(DETAIL_PRODUCT),
      buildProductSummary(SECOND_PRODUCT),
      buildProductSummary(THIRD_PRODUCT)
    ]
  });

  renderCompareRoute();

  expect(screen.getByRole("link", { name: "Remove Third Product" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product"
  );
});

test("ready compare card remove link clears all selected slugs when only one is selected", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    specMode: "shared",
    slugs: [DETAIL_PRODUCT.slug],
    productQueries: [DETAIL_PRODUCT_QUERY_DESCRIPTOR],
    products: [buildProductSummary(DETAIL_PRODUCT)]
  });

  renderCompareRoute();

  expect(screen.getByRole("link", { name: "Remove Detail Product" })).toHaveAttribute(
    "href",
    "/compare"
  );
});

test("compare route renders the compare error boundary when the loader throws", () => {
  mockedUseRouteError.mockReturnValue(new Error("Network request failed: boom"));

  render(<RouteErrorBoundary />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "A network error occurred while loading the comparison."
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Please check your internet connection and try again."
  );
});

test("compare route keeps non-network TypeErrors on the generic error path", () => {
  mockedUseRouteError.mockReturnValue(new TypeError("Cannot read properties of undefined"));

  render(<RouteErrorBoundary title="Compare products" />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "An unexpected error occurred while loading the comparison."
  );
  expect(screen.getByRole("alert")).not.toHaveTextContent(
    "Please check your internet connection and try again."
  );
});

test("compare error boundary supports route-specific resource copy", () => {
  mockedUseRouteError.mockReturnValue(new Error("Network request failed: boom"));

  render(<RouteErrorBoundary resourceName="revenue report" title="Revenue" />);

  expect(screen.getByRole("heading", { name: "Revenue" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "A network error occurred while loading the revenue report."
  );
  expect(screen.getByRole("alert")).not.toHaveTextContent("comparison");
});

test("compare route saves the current ready-state selection", async () => {
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted({
      createSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1"
        },
        errors: []
      }
    });
  });

  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  renderCompareRoute();

  fireEvent.click(screen.getByRole("button", { name: /save comparison/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            name: "Detail Product vs Second Product",
            productIds: [DETAIL_PRODUCT.id, SECOND_PRODUCT.id]
          }
        }
      })
    );
  });

  await waitFor(() => {
    expect(getSaveFeedbackStatus()).toHaveTextContent("Comparison saved.");
  });
});

test("compare route clears stale save feedback when selected products change", async () => {
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted({
      createSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1"
        },
        errors: []
      }
    });
  });
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  const { rerender } = render(
    <MemoryRouter>
      <CompareRoute />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: /save comparison/i }));

  await waitFor(() => {
    expect(getSaveFeedbackStatus()).toHaveTextContent("Comparison saved.");
  });

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    specMode: "shared",
    slugs: [DETAIL_PRODUCT.slug],
    productQueries: [DETAIL_PRODUCT_QUERY_DESCRIPTOR],
    products: [buildProductSummary(DETAIL_PRODUCT)]
  });

  rerender(
    <MemoryRouter>
      <CompareRoute />
    </MemoryRouter>
  );

  expect(getSaveFeedbackStatus()).toHaveTextContent("");

  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  rerender(
    <MemoryRouter>
      <CompareRoute />
    </MemoryRouter>
  );

  expect(getSaveFeedbackStatus()).toHaveTextContent("");
});

test("compare route reports a fallback error when the save commit throws synchronously", async () => {
  commitMutationMock.mockImplementation(() => {
    throw new Error("commit failed before callbacks registered");
  });
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  renderCompareRoute();

  fireEvent.click(screen.getByRole("button", { name: /save comparison/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(DEFAULT_ROUTE_ERROR_MESSAGE);

  fireEvent.click(screen.getByRole("button", { name: /save comparison/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(2);
  });
});

test("renders a not-found message when any selected product is missing", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "not_found",
    specMode: "shared",
    slugs: ["detail-product", "missing-product"]
  });

  renderCompareRoute();

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByText("One or more selected products were not found.")).toBeInTheDocument();
});

test("saved comparisons loader requests the current user's sets and forwards the SSR request", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare/saved");
  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedSavedComparisonPage(
      buildSavedComparisonPage({
        savedSets: [
          {
            id: "saved-set-1",
            name: "Desk setup",
            slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
          }
        ]
      })
    )
  );

  await expect(
    savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    savedSetQueries: [SAVED_COMPARISONS_FIRST_PAGE_DESCRIPTOR],
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      }
    ]
  });

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20 },
    { signal: request.signal }
  );
});

test("saved comparisons loader follows pagination cursors until all saved sets are loaded", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare/saved");
  const secondPageDescriptor = savedComparisonsQueryDescriptor({ first: 20, after: "cursor-1" });

  mockedFetchRouteQuery
    .mockResolvedValueOnce(
      buildFetchedSavedComparisonPage(
        buildSavedComparisonPage({
          endCursor: "cursor-1",
          hasNextPage: true,
          savedSets: [
            {
              id: "saved-set-1",
              name: "Desk setup",
              slugs: [DETAIL_PRODUCT.slug]
            }
          ]
        })
      )
    )
    .mockResolvedValueOnce(
      buildFetchedSavedComparisonPage(
        buildSavedComparisonPage({
          endCursor: "cursor-2",
          savedSets: [
            {
              id: "saved-set-2",
              name: "Office setup",
              slugs: [SECOND_PRODUCT.slug]
            }
          ]
        }),
        secondPageDescriptor
      )
    );

  await expect(
    savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    savedSetQueries: [SAVED_COMPARISONS_FIRST_PAGE_DESCRIPTOR, secondPageDescriptor],
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [DETAIL_PRODUCT.slug]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: [SECOND_PRODUCT.slug]
      }
    ]
  });

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 20 },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { first: 20, after: "cursor-1" },
    { signal: request.signal }
  );
});

test("saved comparisons loader returns unauthorized status when GraphQL returns UNAUTHENTICATED", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare/saved");

  mockedFetchRouteQuery.mockRejectedValueOnce(
    buildRouteLoaderGraphQLError([
      {
        message: "Unauthorized",
        path: ["mySavedComparisonSets"],
        extensions: {
          code: "UNAUTHENTICATED"
        }
      }
    ])
  );

  await expect(
    savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "unauthorized",
    savedSetQueries: [],
    savedSets: []
  });

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20 },
    { signal: request.signal }
  );
});

test("saved comparisons loader does not treat FORBIDDEN as a sign-in state", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare/saved");
  const forbiddenError = buildRouteLoaderGraphQLError([
    {
      message: "Forbidden",
      path: ["mySavedComparisonSets"],
      extensions: {
        code: "FORBIDDEN"
      }
    }
  ]);

  mockedFetchRouteQuery.mockRejectedValueOnce(forbiddenError);

  await expect(
    savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ environment, request }))
  ).rejects.toBe(forbiddenError);
});

test("saved comparisons route renders persisted sets with reopen links", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: [DETAIL_PRODUCT.slug]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const openComparisonLinks = screen.getAllByRole("link", { name: "Open comparison" });

  expect(screen.getByRole("heading", { name: "Saved comparisons" })).toBeInTheDocument();
  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(openComparisonLinks).toHaveLength(2);
  expect(openComparisonLinks[0]).toHaveAttribute(
    "href",
    `/compare?slug=${SECOND_PRODUCT.slug}&slug=${DETAIL_PRODUCT.slug}`
  );
});

test("compare route exposes a named region for the compare shell", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  renderCompareRoute();

  expect(
    screen.getByRole("region", {
      name: "Compare products"
    })
  ).toBeInTheDocument();
});

test("saved comparisons route exposes a named saved-set list and polite feedback region", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [{ id: "saved-set-1", name: "Desk setup", slugs: ["desk", "chair"] }]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("list", { name: "Saved comparison sets" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
});

test("saved comparisons route removes a deleted set from the list", async () => {
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted(buildSuccessfulDeleteResponse("saved-set-1"));
  });

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: [DETAIL_PRODUCT.slug]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  fireEvent.click(screen.getAllByRole("button", { name: "Delete comparison" })[0]);

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          savedComparisonSetId: "saved-set-1"
        }
      })
    );
  });

  await waitFor(() => {
    expect(screen.queryByText("Desk setup")).not.toBeInTheDocument();
    expect(screen.getByText("Office setup")).toBeInTheDocument();
  });

  expect(screen.getByRole("status")).toHaveTextContent("Comparison deleted.");
});

test("saved comparisons route keeps the set visible when delete fails and clears pending state", async () => {
  commitMutationMock.mockImplementation(({ onError }) => {
    onError(new Error("Network request failed: boom"));
  });

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const deleteButton = screen.getAllByRole("button", { name: "Delete comparison" })[0];

  fireEvent.click(deleteButton);

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          savedComparisonSetId: "saved-set-1"
        }
      })
    );
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Delete comparison" })).toBeEnabled();
  });

  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Request failed. Please try again.");
});

test("saved comparisons route keeps the set visible when delete returns GraphQL errors and clears pending state", async () => {
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted({
      deleteSavedComparisonSet: {
        savedComparisonSet: null,
        errors: [
          {
            code: "BAD_USER_INPUT",
            field: "savedComparisonSetId",
            message: "Could not delete this comparison set."
          }
        ]
      }
    });
  });

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Delete comparison" }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          savedComparisonSetId: "saved-set-1"
        }
      })
    );
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Delete comparison" })).toBeEnabled();
  });

  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Could not delete this comparison set.");
});

test("saved comparisons route applies overlapping delete responses against the latest list state", async () => {
  const commits: Array<{
    onCompleted: (response: DeleteSavedComparisonSetMutationResponse) => void;
  }> = [];

  commitMutationMock.mockImplementation((config) => {
    commits.push(config);
  });

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: [DETAIL_PRODUCT.slug]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const deleteButtons = screen.getAllByRole("button", { name: "Delete comparison" });

  fireEvent.click(deleteButtons[0]);
  fireEvent.click(deleteButtons[1]);

  await waitFor(() => {
    expect(commits).toHaveLength(2);
  });

  act(() => {
    commits[1].onCompleted(buildSuccessfulDeleteResponse("saved-set-2"));
  });

  act(() => {
    commits[0].onCompleted(buildSuccessfulDeleteResponse("saved-set-1"));
  });

  await waitFor(() => {
    expect(screen.queryByText("Desk setup")).not.toBeInTheDocument();
    expect(screen.queryByText("Office setup")).not.toBeInTheDocument();
  });

  expect(screen.getByRole("status")).toHaveTextContent("Comparison deleted.");
});

test("saved comparisons route keeps later delete rows pending until their own response settles", async () => {
  const commits: Array<{
    onCompleted: (response: DeleteSavedComparisonSetMutationResponse) => void;
  }> = [];

  commitMutationMock.mockImplementation((config) => {
    commits.push(config);
  });

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: [DETAIL_PRODUCT.slug]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const deleteButtons = screen.getAllByRole("button", { name: "Delete comparison" });

  fireEvent.click(deleteButtons[0]);
  fireEvent.click(deleteButtons[1]);

  await waitFor(() => {
    expect(screen.getAllByRole("button", { name: "Deleting comparison..." })).toHaveLength(2);
    expect(commits).toHaveLength(2);
  });

  act(() => {
    commits[0].onCompleted(buildSuccessfulDeleteResponse("saved-set-1"));
  });

  expect(screen.getAllByRole("button", { name: "Deleting comparison..." })).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Deleting comparison..." })).toBeDisabled();

  act(() => {
    commits[1].onCompleted(buildSuccessfulDeleteResponse("saved-set-2"));
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("Comparison deleted.");
  });
});

test("saved comparisons route prompts the user to sign in when the saved-set query is unauthorized", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "unauthorized",
    savedSets: []
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  expect(screen.getByText("Sign in to view saved comparisons.")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Sign in to view saved comparisons" })
  ).toHaveAttribute("href", "/auth/login");
});

test("isUnauthorizedSavedComparisonsResponse detects a structured unauthorized GraphQL error targeting the saved sets field", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse(
      buildGraphQLResponseWithErrors([
        {
          message: "Unauthorized",
          path: ["mySavedComparisonSets"],
          extensions: {
            code: "UNAUTHENTICATED"
          }
        }
      ])
    )
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse detects an unauthorized response from extensions.code", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse(
      buildGraphQLResponseWithErrors([
        {
          message: "Authentication failed",
          path: ["mySavedComparisonSets"],
          extensions: {
            code: "UNAUTHENTICATED"
          }
        }
      ])
    )
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse ignores a forbidden response from extensions.code", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse(
      buildGraphQLResponseWithErrors([
        {
          message: "Forbidden",
          path: ["mySavedComparisonSets"],
          extensions: {
            code: "FORBIDDEN"
          }
        }
      ])
    )
  ).toBe(false);
});

test("isUnauthorizedSavedComparisonsResponse ignores fuzzy auth messages without extensions.code", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Access denied for saved comparison sets",
          path: ["mySavedComparisonSets"]
        }
      ]
    })
  ).toBe(false);
});

test("isUnauthorizedSavedComparisonsResponse ignores not authorized messages without extensions.code", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "You are not authorized to access saved comparison sets",
          path: ["mySavedComparisonSets"]
        }
      ]
    })
  ).toBe(false);
});

test("isUnauthorizedSavedComparisonsResponse detects pathless unauthorized errors with an empty path", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse(
      buildGraphQLResponseWithErrors([
        {
          message: "Unauthorized",
          path: [],
          extensions: {
            code: "UNAUTHENTICATED"
          }
        }
      ])
    )
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse returns false for unrelated GraphQL errors", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Internal server error",
          path: ["mySavedComparisonSets"]
        }
      ]
    })
  ).toBe(false);
});

test("isUnauthorizedSavedComparisonsResponse returns false for unauthorized errors on a different field path", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Unauthorized",
          path: ["someOtherField"]
        }
      ]
    })
  ).toBe(false);
});

test("isUnauthorizedSavedComparisonsResponse returns false when the response has no errors array", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      data: {
        mySavedComparisonSets: {
          edges: [],
          pageInfo: { hasNextPage: false, endCursor: null }
        }
      }
    })
  ).toBe(false);
});

test("saved comparisons loader throws when the GraphQL response cannot be parsed", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare/saved");

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedSavedComparisonPage({
      mySavedComparisonSets: {
        edges: "not-an-array",
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    })
  );

  await expect(
    savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ environment, request }))
  ).rejects.toThrow("Failed to parse saved comparison sets response");
});

test("saved comparisons loader throws when page metadata cannot be parsed", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare/saved");

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedSavedComparisonPage({
      mySavedComparisonSets: {
        edges: [],
        pageInfo: {
          hasNextPage: "yes",
          endCursor: null
        }
      }
    })
  );

  await expect(
    savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ environment, request }))
  ).rejects.toThrow("Failed to parse saved comparison sets response");
});

test("saved comparisons loader throws when page cap is reached before pagination completes", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare/saved");

  // Simulate a response where hasNextPage is always true so the loader hits the cap.
  // We use mockImplementation to return the same paginated response for each call.
  let callCount = 0;

  mockedFetchRouteQuery.mockImplementation(() => {
    callCount += 1;

    return Promise.resolve({
      data: buildSavedComparisonPage({
        endCursor: `cursor-${callCount}`,
        hasNextPage: true,
        savedSets: [
          {
            id: `saved-set-${callCount}`,
            name: `Set ${callCount}`,
            slugs: [DETAIL_PRODUCT.slug]
          }
        ]
      }),
      descriptor: savedComparisonsQueryDescriptor(
        callCount === 1 ? { first: 20 } : { first: 20, after: `cursor-${callCount - 1}` }
      ),
      dispose: vi.fn()
    });
  });

  await expect(
    savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ environment, request }))
  ).rejects.toThrow("Saved comparison sets pagination limit exceeded");

  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(50);
});

test("saved comparisons loader returns empty status for zero saved sets with no truncation", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare/saved");

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedSavedComparisonPage(
      buildSavedComparisonPage({
        savedSets: []
      })
    )
  );

  const result = await savedComparisonsLoader(
    buildSavedComparisonsLoaderArgs({ environment, request })
  );

  expect(result).toEqual({
    status: "empty",
    savedSetQueries: [SAVED_COMPARISONS_FIRST_PAGE_DESCRIPTOR],
    savedSets: []
  });
});

test("saved comparisons loader aborts pagination when the request is cancelled", async () => {
  const controller = new AbortController();
  const environment = createRelayEnvironment();
  const request = buildAbortableRequest(
    "https://app.example.com/compare/saved",
    controller.signal
  );

  mockedFetchRouteQuery.mockImplementationOnce(() => {
    controller.abort();

    return Promise.resolve({
      data: buildSavedComparisonPage({
        endCursor: "cursor-1",
        hasNextPage: true,
        savedSets: [
          {
            id: "saved-set-1",
            name: "Desk setup",
            slugs: [DETAIL_PRODUCT.slug]
          }
        ]
      }),
      descriptor: SAVED_COMPARISONS_FIRST_PAGE_DESCRIPTOR,
      dispose: vi.fn()
    });
  });

  await expect(
    savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ environment, request }))
  ).rejects.toThrow(/aborted/i);

  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20 },
    { signal: request.signal }
  );
});

function getSaveFeedbackStatus() {
  return screen.getAllByRole("status")[0];
}

function renderCompareRoute() {
  return render(
    <MemoryRouter>
      <CompareRoute />
    </MemoryRouter>
  );
}

function mockCompareRouteQueries() {
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => {
    if (descriptor === COMPARE_ROUTE_QUERY_DESCRIPTOR) {
      return COMPARE_ROUTE_QUERY_REF;
    }

    if (descriptor === DETAIL_PRODUCT_QUERY_DESCRIPTOR) {
      return DETAIL_PRODUCT_QUERY_REF;
    }

    if (descriptor === SECOND_PRODUCT_QUERY_DESCRIPTOR) {
      return SECOND_PRODUCT_QUERY_REF;
    }

    if (descriptor === THIRD_PRODUCT_QUERY_DESCRIPTOR) {
      return THIRD_PRODUCT_QUERY_REF;
    }

    throw new Error(`Unexpected query descriptor: ${JSON.stringify(descriptor)}`);
  });

  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === COMPARE_ROUTE_QUERY_REF) {
      return buildFetchedCompareRouteQuery({ products: [DETAIL_PRODUCT, SECOND_PRODUCT] }).data;
    }

    if (queryRef === DETAIL_PRODUCT_QUERY_REF) {
      return {
        product: DETAIL_PRODUCT
      };
    }

    if (queryRef === SECOND_PRODUCT_QUERY_REF) {
      return {
        product: SECOND_PRODUCT
      };
    }

    if (queryRef === THIRD_PRODUCT_QUERY_REF) {
      return {
        product: THIRD_PRODUCT
      };
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });
}

test("saved comparisons loader throws when pagination cursor does not advance", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare/saved");
  const secondPageDescriptor = savedComparisonsQueryDescriptor({ first: 20, after: "cursor-1" });

  mockedFetchRouteQuery
    .mockResolvedValueOnce(
      buildFetchedSavedComparisonPage(
        buildSavedComparisonPage({
          endCursor: "cursor-1",
          hasNextPage: true,
          savedSets: [
            {
              id: "saved-set-1",
              name: "Set 1",
              slugs: [DETAIL_PRODUCT.slug]
            }
          ]
        })
      )
    )
    .mockResolvedValueOnce(
      buildFetchedSavedComparisonPage(
        buildSavedComparisonPage({
          endCursor: "cursor-1",
          hasNextPage: true,
          savedSets: [
            {
              id: "saved-set-2",
              name: "Set 2",
              slugs: [SECOND_PRODUCT.slug]
            }
          ]
        }),
        secondPageDescriptor
      )
    );

  await expect(
    savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ environment, request }))
  ).rejects.toThrow("Invalid pagination cursor");
});
