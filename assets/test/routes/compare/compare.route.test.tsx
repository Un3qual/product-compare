import { startTransition } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRelayEnvironment } from "../../../src/relay/environment";
import { fetchRouteQuery, useRoutePreloadedQuery } from "../../../src/relay/route-preload";
import {
  MemoryRouter,
  Outlet,
  Route,
  createMemoryRouter,
  RouterProvider,
  Routes,
  useLoaderData,
  useLocation,
  useRouteError,
} from "react-router";
import {
  useFragment,
  useLazyLoadQuery,
  useMutation,
  usePaginationFragment,
  usePreloadedQuery,
} from "react-relay";
import { DEFAULT_MUTATION_ERROR_MESSAGE } from "../../../src/relay/mutation-errors";
import {
  MAX_COMPARE_PRODUCTS,
  type CompareProductSummary,
  type CompareRouteLoaderData,
} from "../../../src/routes/compare/compare-route-data";
import {
  isUnauthorizedSavedComparisonsResponse,
  savedComparisonsLoader,
} from "../../../src/routes/compare/saved/SavedComparisonsRoute";
import { RouteErrorBoundary } from "../../../src/routes/compare/RouteErrorBoundary";
import { CompareRoute, compareLoader } from "../../../src/routes/compare/CompareRoute";
import { CompareProductPickerView } from "../../../src/routes/compare/picker/CompareProductPickerView";
import { SpecificationMatrix } from "../../../src/routes/compare/live/SpecificationMatrix";
import {
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsAfterAdding,
  selectedCompareSlugsFromSearch,
} from "../../../src/routes/compare/paths";
import { SavedComparisonsRoute } from "../../../src/routes/compare/saved/SavedComparisonsRoute";
import {
  buildAbortableRequest,
  buildCompareLoaderArgs,
  buildGraphQLResponseWithErrors,
  buildSavedComparisonsLoaderArgs,
} from "./saved-comparisons-test-helpers";
import { savedProductsForSlugs } from "./saved-comparison-products-test-helpers";
import { mockPreloadedQuery } from "../../helpers/relay";

const {
  commitMutationMock,
  fetchRouteQueryMock,
  useFragmentMock,
  useLazyLoadQueryMock,
  useLoaderDataMock,
  useMutationMock,
  usePaginationFragmentMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock,
} = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  fetchRouteQueryMock: vi.fn(),
  useFragmentMock: vi.fn(),
  useLazyLoadQueryMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePaginationFragmentMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn(),
}));

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload",
  );

  return {
    ...actual,
    fetchRouteQuery: fetchRouteQueryMock,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock,
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useFragment: useFragmentMock,
    useLazyLoadQuery: useLazyLoadQueryMock,
    useMutation: useMutationMock,
    usePaginationFragment: usePaginationFragmentMock,
    usePreloadedQuery: usePreloadedQueryMock,
  };
});

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
  };
});

const mockedFetchRouteQuery = vi.mocked(fetchRouteQuery);
const mockedUseLazyLoadQuery = vi.mocked(useLazyLoadQuery);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseFragment = vi.mocked(useFragment);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePaginationFragment = vi.mocked(usePaginationFragment);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

type CompareTestAttribute = {
  attributeId?: string;
  code: string;
  displayName: string;
  dataType?: string;
  valueText: string;
  sortOrder?: number | null;
  groupLabel?: string | null;
  isRequired?: boolean;
  numericValue?: string | null;
  booleanValue?: boolean | null;
  enumOptionId?: string | null;
  unitSymbol?: string | null;
};

type CompareTestProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: {
    id: string;
    name: string;
  };
  currentAttributes: ReadonlyArray<CompareTestAttribute>;
};

type CompareTestProductSummary = Omit<CompareProductSummary, "currentAttributes"> & {
  currentAttributes: ReadonlyArray<CompareTestAttribute>;
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
    name: "Acme",
  },
  currentAttributes: [],
} satisfies CompareTestProduct;
const SECOND_PRODUCT = {
  id: "UHJvZHVjdDoy",
  name: "Second Product",
  slug: "second-product",
  description: "Another product for comparison.",
  brand: {
    id: "brand-2",
    name: "Bravo",
  },
  currentAttributes: [],
} satisfies CompareTestProduct;
const THIRD_PRODUCT = {
  id: "UHJvZHVjdDoz",
  name: "Third Product",
  slug: "third-product",
  description: "A third product for selection editing coverage.",
  brand: {
    id: "brand-3",
    name: "Charlie",
  },
  currentAttributes: [],
} satisfies CompareTestProduct;

const DETAIL_PRODUCT_QUERY_DESCRIPTOR = {
  __relayQuery: {
    cacheID: "ProductDetailRouteQuery-cache-id",
    operationName: "ProductDetailRouteQuery",
    variables: { slug: DETAIL_PRODUCT.slug, offerFirst: 3, offersAfter: null },
  },
};

const SECOND_PRODUCT_QUERY_DESCRIPTOR = {
  __relayQuery: {
    cacheID: "ProductDetailRouteQuery-cache-id",
    operationName: "ProductDetailRouteQuery",
    variables: { slug: SECOND_PRODUCT.slug, offerFirst: 3, offersAfter: null },
  },
};

const THIRD_PRODUCT_QUERY_DESCRIPTOR = {
  __relayQuery: {
    cacheID: "ProductDetailRouteQuery-cache-id",
    operationName: "ProductDetailRouteQuery",
    variables: { slug: THIRD_PRODUCT.slug, offerFirst: 3, offersAfter: null },
  },
};

const DETAIL_PRODUCT_QUERY_REF = mockPreloadedQuery(
  DETAIL_PRODUCT_QUERY_DESCRIPTOR.__relayQuery.variables,
);

const SECOND_PRODUCT_QUERY_REF = mockPreloadedQuery(
  SECOND_PRODUCT_QUERY_DESCRIPTOR.__relayQuery.variables,
);

const THIRD_PRODUCT_QUERY_REF = mockPreloadedQuery(
  THIRD_PRODUCT_QUERY_DESCRIPTOR.__relayQuery.variables,
);

const COMPARE_ROUTE_QUERY_DESCRIPTOR = {
  __relayQuery: {
    cacheID: "CompareRouteQuery-cache-id",
    operationName: "CompareRouteQuery",
    variables: {
      slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
      offerFirst: 3,
    },
  },
};

const COMPARE_ROUTE_QUERY_REF = mockPreloadedQuery(
  COMPARE_ROUTE_QUERY_DESCRIPTOR.__relayQuery.variables,
);

const savedComparisonsQueryDescriptor = (variables: { first: number; after?: string }) => ({
  __relayQuery: {
    cacheID: "SavedComparisonOperationsQuery-cache-id",
    operationName: "SavedComparisonOperationsQuery",
    variables,
  },
});

const SAVED_COMPARISONS_FIRST_PAGE_DESCRIPTOR = savedComparisonsQueryDescriptor({ first: 20 });

const COMPARE_OFFER_CONTEXT_TEST_PAGE_SIZE = 3;

function buildOfferContextConnection({
  hasNextPage = false,
  offers,
}: {
  hasNextPage?: boolean;
  offers: CompareOfferTestNode[];
}) {
  return {
    edges: offers.map((node, index) => ({
      cursor: `offer-cursor-${index + 1}`,
      node: {
        activeCoupons: {
          edges: node.activeCoupons?.edges ?? [],
          pageInfo: {
            hasNextPage: node.activeCoupons?.pageInfo.hasNextPage ?? false,
          },
        },
        priceHistory: {
          edges: node.priceHistory?.edges ?? [],
          pageInfo: {
            hasNextPage: node.priceHistory?.pageInfo.hasNextPage ?? false,
          },
        },
        ...node,
      },
    })),
    pageInfo: {
      endCursor: offers.length > 0 ? `offer-cursor-${offers.length}` : null,
      hasNextPage,
    },
  };
}

const buildFetchedProductQuery = (
  product: CompareTestProduct | null,
  descriptor:
    | typeof DETAIL_PRODUCT_QUERY_DESCRIPTOR
    | typeof SECOND_PRODUCT_QUERY_DESCRIPTOR
    | typeof THIRD_PRODUCT_QUERY_DESCRIPTOR,
) => ({
  data: {
    product,
    comparisonProducts: [
      product
        ? {
            ...product,
            offerTruth: { asOf: "2026-06-29T13:00:00Z" },
            merchantProducts: buildOfferContextConnection({ offers: [] }),
          }
        : null,
    ],
    products: {
      edges: [],
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
      },
    },
  },
  descriptor,
  dispose: vi.fn(),
});

const buildFetchedCompareRouteQuery = ({
  products,
  offerConnections = new Map<string, ReturnType<typeof buildOfferContextConnection> | null>(),
}: {
  products: Array<CompareTestProduct | null>;
  offerConnections?: Map<string, ReturnType<typeof buildOfferContextConnection> | null>;
}) => ({
  data: {
    comparisonProducts: products.map((product) =>
      product
        ? {
            ...product,
            offerTruth: { asOf: "2026-06-29T13:00:00Z" },
            merchantProducts: offerConnections.has(product.id)
              ? offerConnections.get(product.id)
              : buildOfferContextConnection({ offers: [] }),
          }
        : null,
    ),
  },
  descriptor: COMPARE_ROUTE_QUERY_DESCRIPTOR,
  dispose: vi.fn(),
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
    referenceTime: string;
  }> = {},
) => ({
  status: "available" as const,
  productId,
  activeOfferCount: 0,
  bestCurrentPrice: null,
  hasLoadedCoupons: false,
  hasMoreActiveOffers: false,
  hasMoreCoupons: false,
  latestPriceObservedAt: null,
  referenceTime: "2026-06-29T13:00:00Z",
  ...overrides,
});

const buildUnavailableOfferContextSummary = (productId: string) => ({
  status: "unavailable" as const,
  productId,
});

const buildDefaultOfferContexts = () => ({
  [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id),
  [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id),
  [THIRD_PRODUCT.id]: buildAvailableOfferContextSummary(THIRD_PRODUCT.id),
});

const buildProductSummary = (product: CompareTestProduct) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  description: product.description,
  brandName: product.brand.name,
  currentAttributes: product.currentAttributes.map(completeAttributeSummary),
});

const completeProductSummary = (product: CompareTestProductSummary): CompareProductSummary => ({
  ...product,
  currentAttributes: product.currentAttributes.map(completeAttributeSummary),
});

const completeProductSummaries = (products: readonly CompareTestProductSummary[]) =>
  products.map(completeProductSummary);

const completeAttributeSummary = (attribute: CompareTestAttribute) => ({
  attributeId: attribute.attributeId ?? `attribute-${attribute.code}`,
  code: attribute.code,
  displayName: attribute.displayName,
  valueText: attribute.valueText,
  sortOrder: attribute.sortOrder ?? null,
  groupLabel: attribute.groupLabel ?? null,
  isRequired: attribute.isRequired ?? false,
  numericValue: attribute.numericValue ?? null,
  booleanValue: attribute.booleanValue ?? null,
  enumOptionId: attribute.enumOptionId ?? null,
  unitSymbol: attribute.unitSymbol ?? null,
});

const buildSavedProducts = (slugs: string[]) =>
  savedProductsForSlugs(slugs, [DETAIL_PRODUCT, SECOND_PRODUCT, THIRD_PRODUCT]);

const buildSavedComparisonPage = ({
  endCursor = null,
  hasNextPage = false,
  savedSets,
}: {
  endCursor?: string | null;
  hasNextPage?: boolean;
  savedSets: Array<{
    id: string;
    name: string;
    products: Array<{
      name: string;
      slug: string;
    }>;
  }>;
}) => ({
  mySavedComparisonSets: {
    edges: savedSets.map((savedSet) => ({
      node: {
        id: savedSet.id,
        name: savedSet.name,
        items: savedSet.products.map((product, index) => ({
          position: index + 1,
          product,
        })),
      },
    })),
    pageInfo: {
      hasNextPage,
      endCursor,
    },
  },
});

const buildFetchedSavedComparisonPage = (
  data: unknown,
  descriptor = SAVED_COMPARISONS_FIRST_PAGE_DESCRIPTOR,
) => ({
  data,
  descriptor,
  dispose: vi.fn(),
});

type ReadyCompareLoaderData = Extract<CompareRouteLoaderData, { status: "ready" }>;
type ReadyCompareLoaderDataOverrides = Omit<Partial<ReadyCompareLoaderData>, "products"> & {
  products?: ReadonlyArray<CompareTestProductSummary>;
};

const buildReadyCompareLoaderData = (overrides: ReadyCompareLoaderDataOverrides = {}) => {
  const { products, ...otherOverrides } = overrides;

  return {
    status: "ready" as const,
    specMode: "shared" as const,
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
    query: COMPARE_ROUTE_QUERY_DESCRIPTOR,
    offerContexts: buildDefaultOfferContexts(),
    products: products
      ? products.map(completeProductSummary)
      : [buildProductSummary(DETAIL_PRODUCT), buildProductSummary(SECOND_PRODUCT)],
    ...otherOverrides,
  };
};

function renderRelativeLoadedPriceCells(overrides: ReadyCompareLoaderDataOverrides) {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData(overrides));
  renderCompareRoute();

  const row = within(screen.getByRole("table", { name: "Decision summary" })).getByRole("row", {
    name: /Compared price/,
  });

  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

beforeEach(() => {
  commitMutationMock.mockReset();
  fetchRouteQueryMock.mockReset();
  mockedUseFragment.mockReset();
  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => fragmentRef as never);
  useLazyLoadQueryMock.mockReset();
  useLoaderDataMock.mockReset();
  useMutationMock.mockReset();
  usePaginationFragmentMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  DETAIL_PRODUCT_QUERY_REF.dispose.mockReset();
  SECOND_PRODUCT_QUERY_REF.dispose.mockReset();
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: [],
    },
  });
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
  mockedUsePaginationFragment.mockImplementation(
    (_fragment, fragmentRef) =>
      ({ data: fragmentRef, hasNext: false, isLoadingNext: false, loadNext: vi.fn() }) as never,
  );
  mockCompareRouteQueries();
});

test("comparison matrix directly renders ordered rows, missing values, and the selected mode", () => {
  render(
    <SpecificationMatrix
      products={completeProductSummaries([
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: [
            {
              code: "refresh-rate",
              displayName: "Refresh rate",
              valueText: "144 Hz",
              sortOrder: 20,
            },
            {
              code: "panel-type",
              displayName: "Panel type",
              valueText: "IPS",
              sortOrder: 10,
            },
          ],
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: [
            {
              code: "panel-type",
              displayName: "Panel type",
              valueText: "OLED",
              sortOrder: 10,
            },
          ],
        },
      ])}
      specMode="all"
    />,
  );

  expect(screen.getByRole("heading", { name: "All specifications" })).toBeInTheDocument();
  const rows = within(screen.getByRole("table", { name: "All specifications" })).getAllByRole(
    "row",
  );
  expect(within(rows[1]).getByRole("rowheader")).toHaveTextContent("Panel type");
  expect(
    within(rows[1])
      .getAllByRole("cell")
      .map((cell) => cell.textContent),
  ).toEqual(["IPS", "OLED"]);
  expect(within(rows[2]).getByRole("rowheader")).toHaveTextContent("Refresh rate");
  expect(
    within(rows[2])
      .getAllByRole("cell")
      .map((cell) => cell.textContent),
  ).toEqual(["144 Hz", "Not available"]);
});

test("comparison matrix uses product ordering when the environment default is Swedish", () => {
  const defaultLocaleCompare = vi
    .spyOn(String.prototype, "localeCompare")
    .mockImplementation(function localeCompareWithSwedishDefault(this: string, other: string) {
      return new Intl.Collator("sv-SE", { sensitivity: "base" }).compare(String(this), other);
    });

  try {
    render(
      <SpecificationMatrix
        products={completeProductSummaries([
          {
            ...buildProductSummary(DETAIL_PRODUCT),
            currentAttributes: [
              { code: "zeta", displayName: "Zebra", valueText: "1" },
              { code: "accent", displayName: "Älg", valueText: "2" },
            ],
          },
          {
            ...buildProductSummary(SECOND_PRODUCT),
            currentAttributes: [
              { code: "zeta", displayName: "Zebra", valueText: "1" },
              { code: "accent", displayName: "Älg", valueText: "2" },
            ],
          },
        ])}
        specMode="all"
      />,
    );

    const rowLabels = within(screen.getByRole("table", { name: "All specifications" }))
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getByRole("rowheader").textContent);

    expect(rowLabels).toEqual(["Älg", "Zebra"]);
  } finally {
    defaultLocaleCompare.mockRestore();
  }
});

test("compare path helpers normalize selected slugs and cap serialized route query strings", () => {
  expect(
    selectedCompareSlugsFromSearch(
      "?slug=detail-product&slug=&slug=second-product&slug=detail-product",
    ),
  ).toEqual(["detail-product", "second-product"]);
  expect(
    selectedCompareSlugsAfterAdding(["detail-product"], "second-product", MAX_COMPARE_PRODUCTS),
  ).toEqual(["detail-product", "second-product"]);
  expect(
    selectedCompareSlugsAfterAdding(["detail-product"], "detail-product", MAX_COMPARE_PRODUCTS),
  ).toEqual(["detail-product"]);
  expect(
    buildCurrentRoutePathWithCompareSlugs(
      "/products",
      "?first=24&slug=detail-product&typeTaxonId=type-laptops",
      [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug, THIRD_PRODUCT.slug, "fourth-product"],
    ),
  ).toBe(
    "/products?first=24&typeTaxonId=type-laptops&slug=detail-product&slug=second-product&slug=third-product",
  );
  expect(
    buildComparePathFromSlugs(
      [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug, THIRD_PRODUCT.slug, "fourth-product"],
      { specMode: "all" },
    ),
  ).toBe("/compare?slug=detail-product&slug=second-product&slug=third-product&specs=all");
});

test("compare loader returns an empty state when no slugs are selected", async () => {
  await expect(compareLoader(buildCompareLoaderArgs())).resolves.toEqual({
    specMode: "shared",
    status: "empty",
    slugs: [],
  });
});

test.each([
  ["all", "all"],
  ["differences", "differences"],
  ["", "shared"],
  ["unsupported", "shared"],
] as const)("compare loader parses specs=%s as %s mode", async (rawSpecMode, expectedSpecMode) => {
  await expect(
    compareLoader(
      buildCompareLoaderArgs({
        request: new Request(`https://app.example.com/compare?specs=${rawSpecMode}`),
      }),
    ),
  ).resolves.toEqual({
    specMode: expectedSpecMode,
    status: "empty",
    slugs: [],
  });
});

test("compare loader rejects more than three selected slugs", async () => {
  await expect(
    compareLoader(
      buildCompareLoaderArgs({
        request: new Request(
          "https://app.example.com/compare?slug=one&slug=two&slug=three&slug=four",
        ),
      }),
    ),
  ).resolves.toEqual({
    specMode: "shared",
    status: "too_many",
    slugs: ["one", "two", "three", "four"],
  });
});

test("compare loader requests selected product details and preserves URL order", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product",
  );

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({ products: [DETAIL_PRODUCT, SECOND_PRODUCT] }),
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request })),
  ).resolves.toMatchObject({
    status: "ready",
    specMode: "shared",
    slugs: ["detail-product", "second-product"],
    query: COMPARE_ROUTE_QUERY_DESCRIPTOR,
    offerContexts: {
      [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id),
      [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id),
    },
    products: [buildProductSummary(DETAIL_PRODUCT), buildProductSummary(SECOND_PRODUCT)],
  });

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      slugs: ["detail-product", "second-product"],
      offerFirst: COMPARE_OFFER_CONTEXT_TEST_PAGE_SIZE,
    },
    { signal: request.signal },
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("compare loader keeps single-product requests on the core comparison query", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare?slug=detail-product");

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedProductQuery(DETAIL_PRODUCT, DETAIL_PRODUCT_QUERY_DESCRIPTOR),
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request })),
  ).resolves.toMatchObject({
    status: "ready",
    slugs: ["detail-product"],
  });

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      slugs: [DETAIL_PRODUCT.slug],
      offerFirst: COMPARE_OFFER_CONTEXT_TEST_PAGE_SIZE,
    },
    { signal: request.signal },
  );
});

test("compare loader restores requested slug order when response order diverges", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product",
  );

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({ products: [SECOND_PRODUCT, DETAIL_PRODUCT] }),
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request })),
  ).resolves.toMatchObject({
    status: "ready",
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
    products: [
      { id: DETAIL_PRODUCT.id, slug: DETAIL_PRODUCT.slug },
      { id: SECOND_PRODUCT.id, slug: SECOND_PRODUCT.slug },
    ],
  });
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
        unitSymbol: "Hz",
      },
    ],
  } satisfies CompareTestProduct;

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedProductQuery(productWithMetadata, DETAIL_PRODUCT_QUERY_DESCRIPTOR),
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request })),
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
            unitSymbol: "Hz",
          },
        ],
      },
    ],
    offerContexts: {
      [productWithMetadata.id]: buildAvailableOfferContextSummary(productWithMetadata.id),
    },
  });
});

test("compare loader summarizes bounded offer-context pages without treating incomplete pages as globally ranked", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product",
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
          domain: "full.example",
        },
        latestPrice: {
          id: "price-1",
          price: "249.99",
          observedAt: "2026-06-27T08:00:00Z",
        },
        activeCoupons: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
          },
        },
        priceHistory: {
          edges: [
            {
              node: {
                id: "history-1",
                price: "259.99",
                observedAt: "2026-06-26T08:00:00Z",
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
      {
        id: "merchant-product-2",
        currency: "USD",
        merchant: {
          id: "merchant-2",
          name: "Value Mart",
          domain: "value.example",
        },
        latestPrice: {
          id: "price-2",
          price: "199.99",
          observedAt: "2026-06-29T12:00:00Z",
        },
        activeCoupons: {
          edges: [
            {
              node: {
                code: "SAVE20",
                discountType: "PERCENT",
                discountValue: "20",
                currency: null,
                validTo: "2026-07-15T00:00:00Z",
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
          },
        },
        priceHistory: {
          edges: [
            {
              node: {
                id: "history-2",
                price: "199.99",
                observedAt: "2026-06-29T12:00:00Z",
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
          },
        },
      },
      {
        id: "merchant-product-3",
        currency: "USD",
        merchant: {
          id: "merchant-3",
          name: "Budget Depot",
          domain: "budget.example",
        },
        latestPrice: {
          id: "price-3",
          price: "219.99",
          observedAt: "2026-06-28T09:00:00Z",
        },
        activeCoupons: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    ],
  });
  const secondOffers = buildOfferContextConnection({
    offers: [
      {
        id: "merchant-product-4",
        currency: "USD",
        merchant: {
          id: "merchant-4",
          name: "Shop Two",
          domain: "two.example",
        },
        latestPrice: {
          id: "price-4",
          price: "299.50",
          observedAt: "2026-06-24T10:00:00Z",
        },
        activeCoupons: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
          },
        },
        priceHistory: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    ],
  });

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({
      products: [DETAIL_PRODUCT, SECOND_PRODUCT],
      offerConnections: new Map([
        [DETAIL_PRODUCT.id, detailOffers],
        [SECOND_PRODUCT.id, secondOffers],
      ]),
    }),
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request })),
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
        latestPriceObservedAt: "2026-06-29T12:00:00Z",
      },
      [SECOND_PRODUCT.id]: {
        status: "available",
        productId: SECOND_PRODUCT.id,
        activeOfferCount: 1,
        bestCurrentPrice: {
          currency: "USD",
          merchantName: "Shop Two",
          price: "299.50",
        },
        hasLoadedCoupons: false,
        hasMoreActiveOffers: false,
        hasMoreCoupons: false,
        latestPriceObservedAt: "2026-06-24T10:00:00Z",
      },
    },
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
          name: "Merchant 1",
        },
        latestPrice: null,
      },
    ],
  });

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({
      products: [DETAIL_PRODUCT],
      offerConnections: new Map([[DETAIL_PRODUCT.id, connection]]),
    }),
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request })),
  ).resolves.toMatchObject({
    status: "ready",
    offerContexts: {
      [DETAIL_PRODUCT.id]: {
        status: "available",
        activeOfferCount: 1,
        hasMoreActiveOffers: true,
      },
    },
  });
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("compare loader excludes invalid observations and compares explicit offsets chronologically", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare?slug=detail-product");
  const connection = buildOfferContextConnection({
    offers: [
      {
        id: "merchant-product-first-valid",
        currency: "USD",
        merchant: { id: "merchant-first", name: "First Merchant" },
        latestPrice: {
          id: "price-first-valid",
          price: "200",
          observedAt: "2026-06-30T01:00:00+02:00",
        },
        priceHistory: {
          edges: [
            {
              node: {
                id: "history-impossible",
                price: "201",
                observedAt: "2026-02-30T10:15:00Z",
              },
            },
            {
              node: {
                id: "history-missing-offset",
                price: "202",
                observedAt: "2999-06-29T10:15:00",
              },
            },
          ],
          pageInfo: { hasNextPage: false },
        },
      },
      {
        id: "merchant-product-latest-valid",
        currency: "USD",
        merchant: { id: "merchant-latest", name: "Latest Merchant" },
        latestPrice: {
          id: "price-latest-valid",
          price: "199",
          observedAt: "2026-06-29T20:30:00-04:00",
        },
        priceHistory: {
          edges: [
            {
              node: {
                id: "history-malformed",
                price: "203",
                observedAt: "not-a-timestamp",
              },
            },
          ],
          pageInfo: { hasNextPage: false },
        },
      },
    ],
  });

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({
      products: [DETAIL_PRODUCT],
      offerConnections: new Map([[DETAIL_PRODUCT.id, connection]]),
    }),
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request })),
  ).resolves.toMatchObject({
    status: "ready",
    offerContexts: {
      [DETAIL_PRODUCT.id]: {
        latestPriceObservedAt: "2026-06-29T20:30:00-04:00",
      },
    },
  });
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
                  name: "US Shop",
                },
                latestPrice: {
                  id: "price-usd",
                  price: "199.99",
                  observedAt: "2026-06-29T12:00:00Z",
                },
              },
              {
                id: "merchant-product-eur",
                currency: "EUR",
                merchant: {
                  id: "merchant-eur",
                  name: "EU Shop",
                },
                latestPrice: {
                  id: "price-eur",
                  price: "149.99",
                  observedAt: "2026-06-29T13:00:00Z",
                },
              },
            ],
          }),
        ],
      ]),
    }),
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request })),
  ).resolves.toMatchObject({
    status: "ready",
    offerContexts: {
      [DETAIL_PRODUCT.id]: {
        status: "available",
        activeOfferCount: 2,
        bestCurrentPrice: null,
        latestPriceObservedAt: "2026-06-29T13:00:00Z",
      },
    },
  });
});

test("compare loader selects the exact lowest price beyond Number precision", async () => {
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
                id: "merchant-product-higher",
                currency: "USD",
                merchant: { id: "merchant-higher", name: "Higher Shop" },
                latestPrice: {
                  id: "price-higher",
                  price: "9007199254740993.00",
                  observedAt: "2026-06-29T12:00:00Z",
                },
              },
              {
                id: "merchant-product-lower",
                currency: "USD",
                merchant: { id: "merchant-lower", name: "Lower Shop" },
                latestPrice: {
                  id: "price-lower",
                  price: "9007199254740992.00",
                  observedAt: "2026-06-29T13:00:00Z",
                },
              },
            ],
          }),
        ],
      ]),
    }),
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request })),
  ).resolves.toMatchObject({
    status: "ready",
    offerContexts: {
      [DETAIL_PRODUCT.id]: {
        bestCurrentPrice: {
          currency: "USD",
          merchantName: "Lower Shop",
          price: "9007199254740992.00",
        },
      },
    },
  });
});

test("compare loader keeps product specs when one offer-context query fails", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product",
  );
  const detailOffers = buildOfferContextConnection({
    offers: [
      {
        id: "merchant-product-1",
        currency: "USD",
        merchant: {
          id: "merchant-1",
          name: "Value Mart",
        },
        latestPrice: {
          id: "price-1",
          price: "199.99",
          observedAt: "2026-06-29T12:00:00Z",
        },
        activeCoupons: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    ],
  });

  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({
      products: [DETAIL_PRODUCT, SECOND_PRODUCT],
      offerConnections: new Map([
        [DETAIL_PRODUCT.id, detailOffers],
        [SECOND_PRODUCT.id, null],
      ]),
    }),
  );

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request })),
  ).resolves.toMatchObject({
    status: "ready",
    products: [buildProductSummary(DETAIL_PRODUCT), buildProductSummary(SECOND_PRODUCT)],
    offerContexts: {
      [DETAIL_PRODUCT.id]: {
        status: "available",
      },
      [SECOND_PRODUCT.id]: buildUnavailableOfferContextSummary(SECOND_PRODUCT.id),
    },
  });
});

test("compare loader rethrows an aborted combined request", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product",
  );
  const abortError = new DOMException("The operation was aborted.", "AbortError");
  mockedFetchRouteQuery.mockRejectedValueOnce(abortError);

  await expect(compareLoader(buildCompareLoaderArgs({ environment, request }))).rejects.toBe(
    abortError,
  );
});

test("compare loader rethrows combined request failures when the route signal is aborted", async () => {
  const controller = new AbortController();
  const environment = createRelayEnvironment();
  const request = buildAbortableRequest(
    "https://app.example.com/compare?slug=detail-product",
    controller.signal,
  );
  const abortedFetchError = new Error("route request was aborted");

  controller.abort();
  mockedFetchRouteQuery.mockRejectedValueOnce(abortedFetchError);

  await expect(compareLoader(buildCompareLoaderArgs({ environment, request }))).rejects.toBe(
    abortedFetchError,
  );
});

test("compare loader forwards the route abort signal to the combined Relay preload", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product",
  );
  mockedFetchRouteQuery.mockResolvedValueOnce(
    buildFetchedCompareRouteQuery({ products: [DETAIL_PRODUCT, SECOND_PRODUCT] }),
  );

  await compareLoader(buildCompareLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
      offerFirst: COMPARE_OFFER_CONTEXT_TEST_PAGE_SIZE,
    },
    { signal: request.signal },
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("compare loader returns not_found when any selected product is missing", async () => {
  const environment = createRelayEnvironment();
  const combinedQuery = buildFetchedCompareRouteQuery({
    products: [DETAIL_PRODUCT, null],
  });

  mockedFetchRouteQuery.mockResolvedValueOnce(combinedQuery);

  await expect(
    compareLoader(
      buildCompareLoaderArgs({
        environment,
        request: new Request(
          "https://app.example.com/compare?slug=detail-product&slug=missing-product",
        ),
      }),
    ),
  ).resolves.toEqual({
    status: "not_found",
    specMode: "shared",
    slugs: ["detail-product", "missing-product"],
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
          "https://app.example.com/compare?slug=detail-product&slug=broken-product",
        ),
      }),
    ),
  ).rejects.toThrow("Network request failed: boom");
});

test("compare loader rethrows AbortError-like rejected reasons without wrapping", async () => {
  const environment = createRelayEnvironment();
  const abortError = {
    name: "AbortError",
    message: "The operation was aborted.",
  };

  mockedFetchRouteQuery.mockRejectedValueOnce(abortError);

  await expect(
    compareLoader(
      buildCompareLoaderArgs({
        environment,
        request: new Request("https://app.example.com/compare?slug=detail-product"),
      }),
    ),
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
        request: new Request("https://app.example.com/compare?slug=detail-product"),
      }),
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
          "https://app.example.com/compare?slug=detail-product&slug=broken-product",
        ),
      }),
    ),
  ).rejects.toThrow("Network request failed: boom");
});

test("product picker view filters loaded options, clears the filter, and keeps resolved actions available", () => {
  const onShowMore = vi.fn();

  render(
    <MemoryRouter>
      <CompareProductPickerView
        heading="Choose products"
        isLoadingMore={false}
        onShowMore={onShowMore}
        options={[
          {
            brandName: "DisplayCo",
            href: "/compare?slug=monitor-alpha",
            id: "Product:monitor-alpha",
            name: "Monitor Alpha",
          },
          {
            brandName: "ViewCo",
            href: "/compare?slug=monitor-beta",
            id: "Product:monitor-beta",
            name: "Monitor Beta",
          },
        ]}
      />
    </MemoryRouter>,
  );

  const filter = screen.getByRole("searchbox", { name: "Filter loaded products" });

  const compareAlpha = screen.getByRole("link", { name: "Compare Monitor Alpha" });
  expect(compareAlpha).toHaveAttribute("href", "/compare?slug=monitor-alpha");
  expect(compareAlpha).not.toHaveAttribute("data-slot", "button");
  expect(screen.getByRole("link", { name: "Compare Monitor Beta" })).toHaveAttribute(
    "href",
    "/compare?slug=monitor-beta",
  );

  fireEvent.change(filter, { target: { value: "beta" } });

  expect(screen.queryByRole("link", { name: "Compare Monitor Alpha" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Monitor Beta" })).toBeInTheDocument();

  fireEvent.change(filter, { target: { value: "missing" } });

  expect(screen.getByText("No loaded products match this filter.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show more products" }));
  expect(onShowMore).toHaveBeenCalledOnce();

  fireEvent.change(filter, { target: { value: "" } });

  expect(screen.getByRole("link", { name: "Compare Monitor Alpha" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Monitor Beta" })).toBeInTheDocument();
});

test("empty compare page lets users choose products without editing the URL", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    specMode: "shared",
    slugs: [],
  });
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "Product:monitor-a",
            name: "Monitor A",
            slug: "monitor-a",
            brand: { id: "Brand:displayco", name: "DisplayCo" },
          },
        },
        {
          node: {
            id: "Product:monitor-b",
            name: "Monitor B",
            slug: "monitor-b",
            brand: { id: "Brand:viewco", name: "ViewCo" },
          },
        },
      ],
    },
  });

  renderCompareRoute();

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Choose products" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Monitor A" })).toHaveAttribute(
    "href",
    "/compare?slug=monitor-a",
  );
  expect(screen.getByRole("link", { name: "Compare Monitor B" })).toHaveAttribute(
    "href",
    "/compare?slug=monitor-b",
  );
  expect(mockedUseLazyLoadQuery).toHaveBeenCalledWith(
    expect.anything(),
    { first: 24, after: null },
    { fetchPolicy: "store-or-network" },
  );
});

test("product picker keeps brandless products alongside branded results", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    specMode: "shared",
    slugs: [],
  });
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "Product:brandless",
            name: "Brandless Product",
            slug: "brandless-product",
            brand: null,
          },
        },
        {
          node: {
            id: "Product:branded",
            name: "Branded Product",
            slug: "branded-product",
            brand: { id: "Brand:acme", name: "Acme" },
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    },
  });
  renderCompareRoute();

  expect(screen.getByRole("link", { name: "Compare Brandless Product" })).toBeInTheDocument();
  expect(screen.getByText("Unknown brand")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Branded Product" })).toBeInTheDocument();
  expect(screen.getByText("Acme")).toBeInTheDocument();
});

test("product picker delegates accumulated and pending pages to Relay", () => {
  const monitorA = {
    id: "Product:monitor-a",
    name: "Monitor A",
    slug: "monitor-a",
    brand: { id: "Brand:displayco", name: "DisplayCo" },
  };
  const monitorC = {
    id: "Product:monitor-c",
    name: "Monitor C",
    slug: "monitor-c",
    brand: { id: "Brand:panelco", name: "PanelCo" },
  };
  const queryData = {
    products: {
      edges: [{ node: monitorA }],
      pageInfo: { endCursor: "next-products", hasNextPage: true },
    },
  };
  let productNodes = [monitorA];
  let hasNext = true;
  let isLoadingNext = false;
  const loadNext = vi.fn(() => {
    productNodes = [monitorA, monitorC];
    isLoadingNext = true;
  });

  mockedUseLoaderData.mockReturnValue({ status: "empty", specMode: "shared", slugs: [] });
  mockedUseLazyLoadQuery.mockReturnValue(queryData);
  mockedUsePaginationFragment.mockImplementation(
    () =>
      ({
        data: { products: { edges: productNodes.map((node) => ({ node })) } },
        hasNext,
        isLoadingNext,
        loadNext,
      }) as never,
  );

  const view = renderCompareRoute();

  expect(screen.getByRole("link", { name: "Compare Monitor A" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Show more products" }));
  view.rerender(
    <MemoryRouter>
      <AuthenticatedCompareRoute />
    </MemoryRouter>,
  );

  expect(loadNext).toHaveBeenCalledWith(
    24,
    expect.objectContaining({ onComplete: expect.any(Function) }),
  );
  expect(screen.getByRole("link", { name: "Compare Monitor A" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Compare Monitor C" })).toBeVisible();
  const loadingButton = screen.getByRole("button", { name: "Loading more products…" });
  expect(loadingButton).toBeDisabled();
  fireEvent.click(loadingButton);
  expect(loadNext).toHaveBeenCalledTimes(1);

  hasNext = false;
  isLoadingNext = false;
  view.rerender(
    <MemoryRouter>
      <AuthenticatedCompareRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "Compare Monitor A" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Compare Monitor C" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Show more products" })).not.toBeInTheDocument();
});

test("product picker reports pagination failures and retries", async () => {
  const product = {
    id: "Product:monitor-a",
    name: "Monitor A",
    slug: "monitor-a",
    brand: { id: "Brand:displayco", name: "DisplayCo" },
  };
  const queryData = { products: { edges: [{ node: product }] } };
  const loadNext = vi.fn();

  mockedUseLoaderData.mockReturnValue({ status: "empty", specMode: "shared", slugs: [] });
  mockedUseLazyLoadQuery.mockReturnValue(queryData);
  mockedUsePaginationFragment.mockReturnValue({
    data: queryData,
    hasNext: true,
    isLoadingNext: false,
    loadNext,
  } as never);

  renderCompareRoute();

  fireEvent.click(screen.getByRole("button", { name: "Show more products" }));
  await act(() => loadNext.mock.calls[0]?.[1]?.onComplete(new Error("Pagination failed")));

  expect(screen.getByRole("alert")).toHaveTextContent("More products unavailable.");
  fireEvent.click(screen.getByRole("button", { name: "Retry products" }));
  expect(loadNext).toHaveBeenCalledTimes(2);
});

test("product picker filters loaded product names without hiding pagination", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    specMode: "shared",
    slugs: [],
  });
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "Product:monitor-a",
            name: "Monitor Alpha",
            slug: "monitor-alpha",
            brand: { id: "Brand:displayco", name: "DisplayCo" },
          },
        },
        {
          node: {
            id: "Product:monitor-b",
            name: "Monitor Beta",
            slug: "monitor-beta",
            brand: { id: "Brand:viewco", name: "ViewCo" },
          },
        },
      ],
      pageInfo: {
        hasNextPage: true,
        endCursor: "next-products",
      },
    },
  });
  mockedUsePaginationFragment.mockImplementation(
    (_fragment, fragmentRef) =>
      ({ data: fragmentRef, hasNext: true, isLoadingNext: false, loadNext: vi.fn() }) as never,
  );

  renderCompareRoute();

  const filter = screen.getByRole("searchbox", { name: "Filter loaded products" });

  expect(filter.id).not.toBe("");
  expect(filter).toHaveAttribute("aria-labelledby");
  expect(document.getElementById(filter.getAttribute("aria-labelledby") ?? "")).toHaveTextContent(
    "Filter loaded products",
  );

  fireEvent.change(filter, { target: { value: "bEtA" } });

  expect(screen.queryByRole("link", { name: "Compare Monitor Alpha" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Monitor Beta" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Show more products" })).toBeInTheDocument();

  fireEvent.change(filter, { target: { value: "missing" } });

  expect(screen.getByText("No loaded products match this filter.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Show more products" })).toBeInTheDocument();

  fireEvent.change(filter, { target: { value: "" } });

  expect(screen.getByRole("link", { name: "Compare Monitor Alpha" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Monitor Beta" })).toBeInTheDocument();
});

test("product picker filtering is stable when the browser locale has special casing rules", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    specMode: "shared",
    slugs: [],
  });
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "Product:istanbul",
            name: "Istanbul",
            slug: "istanbul",
            brand: { id: "Brand:displayco", name: "DisplayCo" },
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    },
  });
  const localeLowerCase = vi
    .spyOn(String.prototype, "toLocaleLowerCase")
    .mockImplementation(function (this: string) {
      return String(this).replaceAll("I", "ı").toLowerCase();
    });

  try {
    renderCompareRoute();

    fireEvent.change(screen.getByRole("searchbox", { name: "Filter loaded products" }), {
      target: { value: "i" },
    });

    expect(screen.getByRole("link", { name: "Compare Istanbul" })).toBeInTheDocument();
  } finally {
    localeLowerCase.mockRestore();
  }
});

test("product picker restarts its Relay connection after the selected set changes", () => {
  let loaderData: CompareRouteLoaderData = {
    status: "ready",
    specMode: "shared",
    slugs: [DETAIL_PRODUCT.slug],
    query: COMPARE_ROUTE_QUERY_DESCRIPTOR,
    offerContexts: {
      [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id),
    },
    products: [buildProductSummary(DETAIL_PRODUCT)],
  };
  const loadNext = vi.fn();
  mockedUseLoaderData.mockImplementation(() => loaderData);
  mockedUseLazyLoadQuery.mockReturnValue({ products: { edges: [] } });
  mockedUsePaginationFragment.mockImplementation(
    (_fragment, fragmentRef) =>
      ({ data: fragmentRef, hasNext: true, isLoadingNext: false, loadNext }) as never,
  );

  const { rerender } = renderCompareRoute();
  fireEvent.click(screen.getByRole("button", { name: "Show more products" }));
  expect(loadNext).toHaveBeenCalledWith(
    24,
    expect.objectContaining({ onComplete: expect.any(Function) }),
  );

  const callsBeforeSelectionChange = mockedUseLazyLoadQuery.mock.calls.length;
  loaderData = {
    status: "ready",
    specMode: "shared",
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
    query: COMPARE_ROUTE_QUERY_DESCRIPTOR,
    offerContexts: {
      [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id),
      [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id),
    },
    products: [buildProductSummary(DETAIL_PRODUCT), buildProductSummary(SECOND_PRODUCT)],
  };

  rerender(
    <MemoryRouter>
      <AuthenticatedCompareRoute />
    </MemoryRouter>,
  );

  expect(
    mockedUseLazyLoadQuery.mock.calls
      .slice(callsBeforeSelectionChange)
      .some(
        ([, variables]) => JSON.stringify(variables) === JSON.stringify({ first: 24, after: null }),
      ),
  ).toBe(true);
});

test("empty compare page handles an empty product picker", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    specMode: "shared",
    slugs: [],
  });
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: [],
    },
  });

  renderCompareRoute();

  expect(screen.getByText("No products are available to compare yet.")).toBeInTheDocument();
});

test("renders a limit message when more than three products are selected", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "too_many",
    specMode: "shared",
    slugs: ["one", "two", "three", "four"],
  });

  renderCompareRoute();

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(
    screen.getByText(`You can compare up to ${MAX_COMPARE_PRODUCTS} products.`),
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
      valueText: "144 Hz",
    },
  ];
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes,
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes,
        },
      ],
      offerContexts: {
        [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id, {
          activeOfferCount: 3,
          bestCurrentPrice: {
            currency: "USD",
            merchantName: "Value Mart",
            price: "199.99",
          },
          hasLoadedCoupons: true,
          hasMoreActiveOffers: true,
          hasMoreCoupons: true,
          latestPriceObservedAt: "2026-06-29T12:00:00Z",
        }),
        [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id, {
          activeOfferCount: 1,
          bestCurrentPrice: {
            currency: "USD",
            merchantName: "Shop Two",
            price: "299.50",
          },
          hasLoadedCoupons: false,
          hasMoreActiveOffers: false,
          hasMoreCoupons: false,
          latestPriceObservedAt: "2026-06-24T10:00:00Z",
        }),
      },
    }),
  );

  renderCompareRoute();

  expect(screen.getByRole("region", { name: "Comparison workspace" })).toBeInTheDocument();
  expect(
    screen.queryByRole("complementary", { name: "Comparison controls" }),
  ).not.toBeInTheDocument();
  const controls = screen.getByRole("region", { name: "Comparison controls" });
  const decisionHeading = screen.getByRole("heading", { name: "Decision summary" });
  const specsHeading = screen.getByRole("heading", { name: "Shared specifications" });
  const decisionSummary = screen.getByRole("table", { name: "Decision summary" });

  expect(
    controls.compareDocumentPosition(decisionHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    decisionHeading.compareDocumentPosition(specsHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(within(decisionSummary).getByText("Lowest current price")).toBeVisible();
  expect(within(decisionSummary).getByText("199.99 USD at Value Mart")).toBeVisible();
  expect(within(decisionSummary).getByText("299.50 USD at Shop Two")).toBeVisible();
  expect(within(decisionSummary).getByText("Offers found")).toBeVisible();
  expect(within(decisionSummary).getByText("3 shown; More available")).toBeVisible();
  expect(within(decisionSummary).getByText("1 shown")).toBeVisible();
  expect(within(decisionSummary).getByText("Coupon availability")).toBeVisible();
  expect(within(decisionSummary).getByText("More coupons available")).toBeVisible();
  expect(within(decisionSummary).getByText("No coupons found")).toBeVisible();
  expect(within(decisionSummary).getByText("Price last checked")).toBeVisible();
  expect(within(decisionSummary).getByText("2026-06-29")).toBeVisible();
  expect(within(decisionSummary).getByText("2026-06-24")).toBeVisible();
  expect(
    within(decisionSummary).getByRole("link", { name: "Review Detail Product offers" }),
  ).toHaveAttribute(
    "href",
    `/offers?productId=${DETAIL_PRODUCT.id}&slug=detail-product&slug=second-product`,
  );
  expect(
    within(decisionSummary).getByRole("link", { name: "Review Second Product offers" }),
  ).toHaveAttribute(
    "href",
    `/offers?productId=${SECOND_PRODUCT.id}&slug=detail-product&slug=second-product`,
  );
});

test("ready compare page marks the lowest relative loaded price", () => {
  expect(
    renderRelativeLoadedPriceCells({
      offerContexts: {
        [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id, {
          bestCurrentPrice: { currency: "USD", merchantName: "Value Mart", price: "99.99" },
        }),
        [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id, {
          bestCurrentPrice: { currency: "USD", merchantName: "Shop Two", price: "120.00" },
        }),
      },
    }),
  ).toEqual(["Lowest shown price", "Above lowest shown price"]);
});

test("ready compare page scopes relative loaded price to already-loaded offers", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  renderCompareRoute();

  expect(
    screen.getByText("Price comparisons use the offers currently shown for these products."),
  ).toBeVisible();
});

test("ready compare page compares scientific Decimal prices exactly", () => {
  expect(
    renderRelativeLoadedPriceCells({
      offerContexts: {
        [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id, {
          bestCurrentPrice: { currency: "USD", merchantName: "Value Mart", price: "1E+3" },
        }),
        [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id, {
          bestCurrentPrice: { currency: "USD", merchantName: "Shop Two", price: "1000" },
        }),
      },
    }),
  ).toEqual(["Tied for lowest shown price", "Tied for lowest shown price"]);
});

test("ready compare page declines mixed currencies as not comparable", () => {
  expect(
    renderRelativeLoadedPriceCells({
      offerContexts: {
        [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id, {
          bestCurrentPrice: { currency: "USD", merchantName: "Value Mart", price: "99.99" },
        }),
        [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id, {
          bestCurrentPrice: { currency: "EUR", merchantName: "Shop Two", price: "89.99" },
        }),
      },
    }),
  ).toEqual(["Not comparable", "Not comparable"]);
});

test("ready compare page declines malformed and missing loaded prices as not comparable", () => {
  expect(
    renderRelativeLoadedPriceCells({
      offerContexts: {
        [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id, {
          bestCurrentPrice: { currency: "USD", merchantName: "Value Mart", price: "not-a-price" },
        }),
        [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id),
      },
    }),
  ).toEqual(["Not comparable", "Not comparable"]);
});

test("ready compare page compares two safe prices while an unavailable product is not comparable", () => {
  expect(
    renderRelativeLoadedPriceCells({
      products: [
        buildProductSummary(DETAIL_PRODUCT),
        buildProductSummary(SECOND_PRODUCT),
        buildProductSummary(THIRD_PRODUCT),
      ],
      offerContexts: {
        [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id, {
          bestCurrentPrice: { currency: "USD", merchantName: "Value Mart", price: "99.99" },
        }),
        [SECOND_PRODUCT.id]: buildAvailableOfferContextSummary(SECOND_PRODUCT.id, {
          bestCurrentPrice: { currency: "USD", merchantName: "Shop Two", price: "120.00" },
        }),
        [THIRD_PRODUCT.id]: buildUnavailableOfferContextSummary(THIRD_PRODUCT.id),
      },
    }),
  ).toEqual(["Lowest shown price", "Above lowest shown price", "Not comparable"]);
});

test("ready compare page keeps specs visible when one offer context is unavailable", () => {
  const currentAttributes = [
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS",
    },
  ];
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes,
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes,
        },
      ],
      offerContexts: {
        [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id, {
          activeOfferCount: 1,
          bestCurrentPrice: {
            currency: "USD",
            merchantName: "Value Mart",
            price: "199.99",
          },
          latestPriceObservedAt: "2026-06-29T12:00:00Z",
        }),
        [SECOND_PRODUCT.id]: buildUnavailableOfferContextSummary(SECOND_PRODUCT.id),
      },
    }),
  );

  renderCompareRoute();

  const decisionSummary = screen.getByRole("table", { name: "Decision summary" });
  const matrix = screen.getByRole("table", { name: "Shared specifications" });

  expect(within(decisionSummary).getByText("Offer details unavailable")).toBeVisible();
  expect(within(matrix).getByText("Panel type")).toBeVisible();
  expect(within(matrix).getAllByText("IPS")).toHaveLength(2);
});

test("ready compare cards render product attributes", () => {
  const fragmentProducts = [
    {
      ...DETAIL_PRODUCT,
      currentAttributes: [
        {
          code: "refresh-rate",
          dataType: "numeric",
          displayName: "Refresh rate",
          valueText: "144 Hz",
        },
      ],
    },
    {
      ...SECOND_PRODUCT,
      currentAttributes: [
        {
          code: "refresh-rate",
          dataType: "numeric",
          displayName: "Refresh rate",
          valueText: "165 Hz",
        },
      ],
    },
  ];
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      products: fragmentProducts.map(buildProductSummary),
    }),
  );
  mockBatchedCompareProducts(fragmentProducts);

  renderCompareRoute();

  expect(screen.getAllByText("144 Hz")).toHaveLength(2);
  expect(screen.getAllByText("165 Hz")).toHaveLength(2);
  expect(screen.getAllByText("Refresh rate")).toHaveLength(3);
});

test("ready compare page renders curated product summaries without slugs or generic property dumps", () => {
  const currentAttributes = [
    {
      code: "refresh-rate",
      dataType: "numeric",
      displayName: "Refresh rate",
      valueText: "144 Hz",
    },
    {
      code: "panel-type",
      dataType: "text",
      displayName: "Panel type",
      valueText: "IPS",
    },
    {
      code: "internal-calibration-code",
      dataType: "text",
      displayName: "Internal calibration code",
      valueText: "CAL-001",
    },
  ];
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      products: [
        { ...buildProductSummary(DETAIL_PRODUCT), currentAttributes },
        buildProductSummary(SECOND_PRODUCT),
      ],
      offerContexts: {
        [DETAIL_PRODUCT.id]: buildAvailableOfferContextSummary(DETAIL_PRODUCT.id, {
          latestPriceObservedAt: "2026-06-29T12:00:00Z",
          referenceTime: "2026-06-29T13:00:00Z",
        }),
        [SECOND_PRODUCT.id]: buildUnavailableOfferContextSummary(SECOND_PRODUCT.id),
      },
    }),
  );
  mockBatchedCompareProducts([{ ...DETAIL_PRODUCT, currentAttributes }, SECOND_PRODUCT]);

  renderCompareRoute();

  const summaries = screen.getByRole("region", { name: "Product decision summaries" });
  expect(within(summaries).getByRole("heading", { name: "Detail Product" })).toBeVisible();
  expect(within(summaries).getByText("Acme")).toBeVisible();
  expect(within(summaries).getByText("A narrow product detail baseline.")).toBeVisible();
  expect(within(summaries).getByText("Refresh rate")).toBeVisible();
  const freshness = within(summaries).getByText("Observed 1 hour ago", { selector: "time" });
  expect(freshness).toHaveAttribute("datetime", "2026-06-29T12:00:00Z");
  expect(within(summaries).queryByText("detail-product")).not.toBeInTheDocument();
  expect(within(summaries).queryByText("Internal calibration code")).not.toBeInTheDocument();
  expect(within(summaries).queryByText(DETAIL_PRODUCT.id)).not.toBeInTheDocument();
});

test("ready compare cards render from batched loader data without synthetic product reads", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: [
            {
              code: "refresh-rate",
              displayName: "Refresh rate",
              valueText: "144 Hz",
            },
          ],
        },
        buildProductSummary(SECOND_PRODUCT),
      ],
    }),
  );
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => {
    if (descriptor === COMPARE_ROUTE_QUERY_DESCRIPTOR) {
      return COMPARE_ROUTE_QUERY_REF;
    }

    throw new Error(`Unexpected synthetic product descriptor: ${JSON.stringify(descriptor)}`);
  });
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === COMPARE_ROUTE_QUERY_REF) {
      return buildFetchedCompareRouteQuery({
        products: [
          {
            ...DETAIL_PRODUCT,
            currentAttributes: [
              {
                code: "refresh-rate",
                dataType: "numeric",
                displayName: "Refresh rate",
                valueText: "144 Hz",
              },
            ],
          },
          SECOND_PRODUCT,
        ],
      }).data;
    }

    throw new Error(`Compare cards must not issue per-product reads: ${String(queryRef)}`);
  });

  renderCompareRoute();

  expect(screen.getByRole("heading", { name: DETAIL_PRODUCT.name })).toBeInTheDocument();
  expect(screen.getByText(DETAIL_PRODUCT.description)).toBeInTheDocument();
  expect(screen.getByText("Refresh rate")).toBeInTheDocument();
  expect(screen.getByText("144 Hz")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledTimes(1);
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(expect.anything(), COMPARE_ROUTE_QUERY_REF);
  expect(mockedUsePreloadedQuery).toHaveBeenCalledTimes(1);
});

test("ready compare page aligns shared product attributes in a matrix", () => {
  const detailProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      dataType: "numeric",
      valueText: "144 Hz",
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      dataType: "enum",
      valueText: "IPS",
    },
    {
      code: "brightness",
      displayName: "Brightness",
      dataType: "numeric",
      valueText: "350 nits",
    },
  ];
  const secondProductAttributes = [
    {
      code: "panel-type",
      displayName: "Panel type",
      dataType: "enum",
      valueText: "OLED",
    },
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      dataType: "numeric",
      valueText: "165 Hz",
    },
  ];

  mockedUseLoaderData.mockReturnValue({
    ...buildReadyCompareLoaderData(),
    products: [
      {
        ...buildProductSummary(DETAIL_PRODUCT),
        currentAttributes: detailProductAttributes.map(({ code, displayName, valueText }) => ({
          code,
          displayName,
          valueText,
        })),
      },
      {
        ...buildProductSummary(SECOND_PRODUCT),
        currentAttributes: secondProductAttributes.map(({ code, displayName, valueText }) => ({
          code,
          displayName,
          valueText,
        })),
      },
    ],
  });
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === COMPARE_ROUTE_QUERY_REF) {
      return buildFetchedCompareRouteQuery({
        products: [
          { ...DETAIL_PRODUCT, currentAttributes: detailProductAttributes },
          { ...SECOND_PRODUCT, currentAttributes: secondProductAttributes },
        ],
      }).data;
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });

  renderCompareRoute();

  const matrix = screen.getByRole("table", { name: "Shared specifications" });
  const rows = within(matrix).getAllByRole("row");

  expect(
    within(rows[0])
      .getAllByRole("columnheader")
      .map((header) => header.textContent),
  ).toEqual(["Specification", "Detail Product", "Second Product"]);
  expect(rows[1]).toHaveTextContent("Panel type");
  expect(rows[1]).toHaveTextContent("IPS");
  expect(rows[1]).toHaveTextContent("OLED");
  expect(rows[2]).toHaveTextContent("Refresh rate");
  expect(rows[2]).toHaveTextContent("144 Hz");
  expect(rows[2]).toHaveTextContent("165 Hz");
  expect(within(matrix).queryByText("Brightness")).not.toBeInTheDocument();
  expect(screen.queryByText("350 nits")).not.toBeInTheDocument();
});

test("ready compare matrix orders specification rows by sort order before display name", () => {
  const detailProductAttributes = [
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS",
      sortOrder: 30,
    },
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "144 Hz",
      sortOrder: 10,
    },
    {
      code: "brightness",
      displayName: "Brightness",
      valueText: "350 nits",
      sortOrder: 20,
    },
  ];
  const secondProductAttributes = [
    {
      code: "brightness",
      displayName: "Brightness",
      valueText: "400 nits",
      sortOrder: 20,
    },
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "165 Hz",
      sortOrder: 10,
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "OLED",
      sortOrder: 30,
    },
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "all",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: detailProductAttributes,
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: secondProductAttributes,
        },
      ],
    }),
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
      valueText: "144 Hz",
    },
  ];
  const secondProductAttributes = [
    {
      code: "panel-type",
      displayName: "Panel type",
      dataType: "enum",
      valueText: "OLED",
    },
  ];

  mockedUseLoaderData.mockReturnValue({
    ...buildReadyCompareLoaderData(),
    products: [
      {
        ...buildProductSummary(DETAIL_PRODUCT),
        currentAttributes: detailProductAttributes.map(({ code, displayName, valueText }) => ({
          code,
          displayName,
          valueText,
        })),
      },
      {
        ...buildProductSummary(SECOND_PRODUCT),
        currentAttributes: secondProductAttributes.map(({ code, displayName, valueText }) => ({
          code,
          displayName,
          valueText,
        })),
      },
    ],
  });
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === COMPARE_ROUTE_QUERY_REF) {
      return buildFetchedCompareRouteQuery({
        products: [
          { ...DETAIL_PRODUCT, currentAttributes: detailProductAttributes },
          { ...SECOND_PRODUCT, currentAttributes: secondProductAttributes },
        ],
      }).data;
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
      valueText: "144 Hz",
    },
    {
      code: "refresh-rate",
      displayName: "Refresh rate duplicate",
      dataType: "numeric",
      valueText: "Overwritten duplicate",
    },
  ];
  const secondProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      dataType: "numeric",
      valueText: "165 Hz",
    },
  ];

  mockedUseLoaderData.mockReturnValue({
    ...buildReadyCompareLoaderData(),
    products: [
      {
        ...buildProductSummary(DETAIL_PRODUCT),
        currentAttributes: detailProductAttributes.map(({ code, displayName, valueText }) => ({
          code,
          displayName,
          valueText,
        })),
      },
      {
        ...buildProductSummary(SECOND_PRODUCT),
        currentAttributes: secondProductAttributes.map(({ code, displayName, valueText }) => ({
          code,
          displayName,
          valueText,
        })),
      },
    ],
  });
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === COMPARE_ROUTE_QUERY_REF) {
      return buildFetchedCompareRouteQuery({
        products: [
          { ...DETAIL_PRODUCT, currentAttributes: detailProductAttributes },
          { ...SECOND_PRODUCT, currentAttributes: secondProductAttributes },
        ],
      }).data;
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });

  renderCompareRoute();

  const matrix = screen.getByRole("table", { name: "Shared specifications" });

  expect(within(matrix).getByText("144 Hz")).toBeVisible();
  expect(within(matrix).queryByText("Overwritten duplicate")).not.toBeInTheDocument();
  expect(within(matrix).queryByText("Refresh rate duplicate")).not.toBeInTheDocument();
});

test("ready compare page renders specification mode tabs with stable URL state", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
    }),
  );

  renderCompareRoute();

  expect(screen.getByRole("tab", { name: "Shared specs" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product",
  );
  expect(screen.getByRole("tab", { name: "Differences" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&specs=differences",
  );
  expect(screen.getByRole("tab", { name: "Differences" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("tab", { name: "All specs" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&specs=all",
  );

  for (const tab of screen.getAllByRole("tab")) {
    const panelId = tab.getAttribute("aria-controls");

    if (!panelId) {
      throw new Error("Expected every specification mode tab to control a panel");
    }

    expect(document.getElementById(panelId)).toHaveAttribute("role", "tabpanel");
  }

  const activePanelId = screen
    .getByRole("tab", { name: "Differences" })
    .getAttribute("aria-controls");

  if (!activePanelId) {
    throw new Error("Expected the active specification mode tab to control a panel");
  }

  expect(document.getElementById(activePanelId)).not.toHaveAttribute("hidden");

  const tabs = screen.getByRole("tablist", { name: "Specification views" });
  const matrixHeading = screen.getByRole("heading", { name: "Different specifications" });
  expect(
    tabs.compareDocumentPosition(matrixHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

test("specification mode tab clicks navigate to loader-backed URL state", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  render(
    <MemoryRouter initialEntries={["/compare?slug=detail-product&slug=second-product"]}>
      <AuthenticatedCompareRoute />
      <LocationProbe />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("tab", { name: "Differences" }));

  expect(screen.getByTestId("location-probe")).toHaveTextContent(
    "/compare?slug=detail-product&slug=second-product&specs=differences",
  );
});

test("ready compare page preserves specification mode in product-picker append links", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "all",
    }),
  );
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "Product:monitor-c",
            name: "Monitor C",
            slug: "monitor-c",
            brand: { id: "Brand:panelco", name: "PanelCo" },
          },
        },
      ],
    },
  });

  renderCompareRoute();

  expect(screen.getByRole("link", { name: "Compare Monitor C" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&slug=monitor-c&specs=all",
  );
});

test("ready compare page preserves specification mode in remove links", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
      slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug, THIRD_PRODUCT.slug],
      products: [
        buildProductSummary(DETAIL_PRODUCT),
        buildProductSummary(SECOND_PRODUCT),
        buildProductSummary(THIRD_PRODUCT),
      ],
    }),
  );

  renderCompareRoute();

  const selectionTray = screen.getByRole("region", { name: "Selected products" });

  expect(
    within(selectionTray).getByRole("link", {
      name: "Remove Detail Product from selection",
    }),
  ).toHaveAttribute("href", "/compare?slug=second-product&slug=third-product&specs=differences");
});

test("ready compare page renders all specification rows with missing cells", () => {
  const detailProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "144 Hz",
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS",
    },
  ];
  const secondProductAttributes = [
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS",
    },
    {
      code: "brightness",
      displayName: "Brightness",
      valueText: "350 nits",
    },
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "all",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: detailProductAttributes,
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: secondProductAttributes,
        },
      ],
    }),
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
      valueText: "144 Hz",
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS",
    },
    {
      code: "weight",
      displayName: "Weight",
      valueText: "5 lb",
    },
  ];
  const secondProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "165 Hz",
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS",
    },
    {
      code: "brightness",
      displayName: "Brightness",
      valueText: "350 nits",
    },
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: detailProductAttributes,
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: secondProductAttributes,
        },
      ],
    }),
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
      numericValue: "144",
    },
    {
      code: "hdr",
      displayName: "HDR",
      valueText: "Yes",
      booleanValue: true,
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS",
    },
  ];
  const secondProductAttributes = [
    {
      code: "refresh-rate",
      displayName: "Refresh rate",
      valueText: "144.0 hertz",
      numericValue: "144",
    },
    {
      code: "hdr",
      displayName: "HDR",
      valueText: "true",
      booleanValue: true,
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "OLED",
    },
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: detailProductAttributes,
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: secondProductAttributes,
        },
      ],
    }),
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
      unitSymbol: "in",
    },
  ];
  const secondProductAttributes = [
    {
      code: "depth",
      displayName: "Depth",
      valueText: "1 cm",
      numericValue: "1",
      unitSymbol: "cm",
    },
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: detailProductAttributes,
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: secondProductAttributes,
        },
      ],
    }),
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
      unitSymbol: "GB",
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS",
    },
  ];
  const secondProductAttributes = [
    {
      code: "storage",
      displayName: "Storage",
      valueText: "1000.0 GB",
      numericValue: "1000",
      unitSymbol: "GB",
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "OLED",
    },
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes: detailProductAttributes,
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes: secondProductAttributes,
        },
      ],
    }),
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
      valueText: "144 Hz",
    },
    {
      code: "panel-type",
      displayName: "Panel type",
      valueText: "IPS",
    },
  ];

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      specMode: "differences",
      products: [
        {
          ...buildProductSummary(DETAIL_PRODUCT),
          currentAttributes,
        },
        {
          ...buildProductSummary(SECOND_PRODUCT),
          currentAttributes,
        },
      ],
    }),
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
            brand: DETAIL_PRODUCT.brand,
          },
        },
        {
          node: {
            id: "Product:monitor-c",
            name: "Monitor C",
            slug: "monitor-c",
            brand: { id: "Brand:panelco", name: "PanelCo" },
          },
        },
      ],
    },
  });

  renderCompareRoute();

  expect(screen.queryByRole("link", { name: "Compare Detail Product" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Monitor C" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&slug=monitor-c",
  );
});

test("ready compare page renders a selected-product tray with ordered remove links", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug, THIRD_PRODUCT.slug],
      products: [
        buildProductSummary(DETAIL_PRODUCT),
        buildProductSummary(SECOND_PRODUCT),
        buildProductSummary(THIRD_PRODUCT),
      ],
    }),
  );
  mockBatchedCompareProducts([DETAIL_PRODUCT, SECOND_PRODUCT, THIRD_PRODUCT]);

  renderCompareRoute();

  const selectionTray = screen.getByRole("region", { name: "Selected products" });
  const selectedProducts = within(selectionTray).getAllByRole("listitem");
  const selectionCount = within(selectionTray).getByRole("status");

  expect(selectionCount).toHaveTextContent(
    `${MAX_COMPARE_PRODUCTS} of ${MAX_COMPARE_PRODUCTS} products selected.`,
  );
  expect(selectionCount).toHaveAttribute("aria-live", "polite");
  expect(within(selectionTray).getByRole("link", { name: "Open comparison" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&slug=third-product",
  );
  expect(selectedProducts).toHaveLength(3);
  expect(selectedProducts[0]).toHaveTextContent("Detail Product");
  expect(selectedProducts[1]).toHaveTextContent("Second Product");
  expect(selectedProducts[2]).toHaveTextContent("Third Product");
  expect(
    within(selectedProducts[0]).getByRole("link", {
      name: "Remove Detail Product from selection",
    }),
  ).toHaveAttribute("href", "/compare?slug=second-product&slug=third-product");
  expect(
    within(selectedProducts[0]).getByRole("link", {
      name: "Remove Detail Product from selection",
    }),
  ).not.toHaveAttribute("data-slot", "button");
  expect(
    within(selectedProducts[1]).getByRole("link", {
      name: "Remove Second Product from selection",
    }),
  ).toHaveAttribute("href", "/compare?slug=detail-product&slug=third-product");
  expect(
    within(selectedProducts[2]).getByRole("link", {
      name: "Remove Third Product from selection",
    }),
  ).toHaveAttribute("href", "/compare?slug=detail-product&slug=second-product");
});

test("ready compare page handles an empty selected-product tray defensively", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      slugs: [],
      products: [],
    }),
  );
  mockBatchedCompareProducts([]);

  renderCompareRoute();

  const selectionTray = screen.getByRole("region", { name: "Selected products" });
  const selectionCount = within(selectionTray).getByRole("status");

  expect(selectionCount).toHaveTextContent(`0 of ${MAX_COMPARE_PRODUCTS} products selected.`);
  expect(within(selectionTray).queryAllByRole("listitem")).toHaveLength(0);
  expect(
    within(selectionTray).queryByRole("link", { name: /Remove .+ from selection/ }),
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
            brand: { id: "Brand:panelco", name: "PanelCo" },
          },
        },
      ],
    },
  });

  renderCompareRoute();

  expect(screen.getByRole("heading", { name: "Add another product" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Monitor C" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&slug=monitor-c",
  );
});

test("compare route renders the compare error boundary when the loader throws", () => {
  render(<RouteErrorBoundary error={new Error("Network request failed: boom")} />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "A network error occurred while loading the comparison.",
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Please check your internet connection and try again.",
  );
});

test("compare route keeps non-network TypeErrors on the generic error path", () => {
  render(
    <RouteErrorBoundary
      error={new TypeError("Cannot read properties of undefined")}
      title="Compare products"
    />,
  );

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "An unexpected error occurred while loading the comparison.",
  );
  expect(screen.getByRole("alert")).not.toHaveTextContent(
    "Please check your internet connection and try again.",
  );
});

test("compare error boundary supports route-specific resource copy", () => {
  render(
    <RouteErrorBoundary
      error={new Error("Network request failed: boom")}
      resourceName="revenue report"
      title="Revenue"
    />,
  );

  expect(screen.getByRole("heading", { name: "Revenue" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "A network error occurred while loading the revenue report.",
  );
  expect(screen.getByRole("alert")).not.toHaveTextContent("comparison");
  expect(screen.queryByText("Decision workspace")).not.toBeInTheDocument();
  expect(
    screen.queryByText(/compare the product details and offer signals/i),
  ).not.toBeInTheDocument();
});

function renderCompareResponseError(status: number) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        loader: () => {
          throw new Response("Request failed", { status, statusText: "Request failed" });
        },
        errorElement: <TestRouteErrorBoundary />,
      },
    ],
    { initialEntries: ["/"] },
  );

  render(<RouterProvider router={router} />);
}

test.each([
  [
    503,
    "A server error occurred while loading the comparison.",
    "Please try refreshing the page or come back later.",
  ],
  [404, "The requested comparison could not be found.", "Please check the URL and try again."],
  [
    401,
    "You don't have permission to view this comparison.",
    "Please sign in or contact support if you believe this is an error.",
  ],
  [
    403,
    "You don't have permission to view this comparison.",
    "Please sign in or contact support if you believe this is an error.",
  ],
  [422, "An error occurred while loading the comparison.", "Please try refreshing the page."],
] as const)(
  "compare route renders response status %s with its customer guidance",
  async (status, title, guidance) => {
    renderCompareResponseError(status);

    expect(await screen.findByRole("heading", { name: "Compare products" })).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(title);
    expect(screen.getByRole("alert")).toHaveTextContent(guidance);
  },
);

test("compare route renders unknown route failures without treating them as exceptions", () => {
  render(<RouteErrorBoundary error={{}} />);

  expect(screen.getByRole("alert")).toHaveTextContent("Comparison unavailable.");
  expect(screen.getByRole("alert")).toHaveTextContent("Please try again later.");
  expect(screen.getByRole("alert")).not.toHaveTextContent("unexpected error");
});

function TestRouteErrorBoundary() {
  return <RouteErrorBoundary error={useRouteError()} />;
}

test("compare route saves the current ready-state selection", async () => {
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted({
      createSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1",
        },
        errors: [],
      },
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
            productIds: [DETAIL_PRODUCT.id, SECOND_PRODUCT.id],
          },
        },
      }),
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
          id: "saved-set-1",
        },
        errors: [],
      },
    });
  });
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  const { rerender } = render(
    <MemoryRouter>
      <AuthenticatedCompareRoute />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("button", { name: /save comparison/i }));

  await waitFor(() => {
    expect(getSaveFeedbackStatus()).toHaveTextContent("Comparison saved.");
  });

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      slugs: [DETAIL_PRODUCT.slug],
      products: [buildProductSummary(DETAIL_PRODUCT)],
    }),
  );
  mockBatchedCompareProducts([DETAIL_PRODUCT]);

  rerender(
    <MemoryRouter>
      <AuthenticatedCompareRoute />
    </MemoryRouter>,
  );

  expect(getSaveFeedbackStatus()).toHaveTextContent("");

  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());
  mockCompareRouteQueries();

  rerender(
    <MemoryRouter>
      <AuthenticatedCompareRoute />
    </MemoryRouter>,
  );

  expect(getSaveFeedbackStatus()).toHaveTextContent("");
});

test("compare save completion settles the visible selection when a new selection suspends and is abandoned", () => {
  let completeSave: (() => void) | undefined;
  const suspendedSelection = new Promise<never>(() => undefined);
  const suspendingQueryDescriptor = {
    __relayQuery: {
      ...COMPARE_ROUTE_QUERY_DESCRIPTOR.__relayQuery,
      variables: {
        ...COMPARE_ROUTE_QUERY_DESCRIPTOR.__relayQuery.variables,
        slugs: [DETAIL_PRODUCT.slug, THIRD_PRODUCT.slug],
      },
    },
  };

  commitMutationMock.mockImplementation(({ onCompleted }) => {
    completeSave = () =>
      onCompleted({
        createSavedComparisonSet: {
          savedComparisonSet: { id: "saved-set-1" },
          errors: [],
        },
      });
  });
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  const { rerender } = render(
    <MemoryRouter>
      <AuthenticatedCompareRoute />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));
  expect(screen.getByRole("button", { name: "Saving comparison..." })).toBeDisabled();

  mockedUseLoaderData.mockReturnValue(
    buildReadyCompareLoaderData({
      products: [buildProductSummary(DETAIL_PRODUCT), buildProductSummary(THIRD_PRODUCT)],
      query: suspendingQueryDescriptor,
      slugs: [DETAIL_PRODUCT.slug, THIRD_PRODUCT.slug],
    }),
  );
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => {
    if (descriptor === suspendingQueryDescriptor) {
      throw suspendedSelection;
    }

    if (descriptor === COMPARE_ROUTE_QUERY_DESCRIPTOR) {
      return COMPARE_ROUTE_QUERY_REF;
    }

    throw new Error(`Unexpected query descriptor: ${JSON.stringify(descriptor)}`);
  });

  act(() => {
    startTransition(() => {
      rerender(
        <MemoryRouter>
          <AuthenticatedCompareRoute />
        </MemoryRouter>,
      );
    });
  });

  expect(screen.getAllByText("Second Product").length).toBeGreaterThan(0);
  expect(screen.queryByText("Third Product")).not.toBeInTheDocument();

  act(() => {
    completeSave?.();
  });

  expect(getSaveFeedbackStatus()).toHaveTextContent("Comparison saved.");
  expect(screen.getByRole("button", { name: "Save comparison" })).toBeEnabled();
});

test("compare route reports a fallback error when the save commit throws synchronously", async () => {
  commitMutationMock.mockImplementation(() => {
    throw new Error("commit failed before callbacks registered");
  });
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  renderCompareRoute();

  fireEvent.click(screen.getByRole("button", { name: /save comparison/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(DEFAULT_MUTATION_ERROR_MESSAGE);

  fireEvent.click(screen.getByRole("button", { name: /save comparison/i }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(2);
  });
});

test("renders a not-found message when any selected product is missing", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "not_found",
    specMode: "shared",
    slugs: ["detail-product", "missing-product"],
  });

  renderCompareRoute();

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByText("One or more selected products were not found.")).toBeInTheDocument();
});

test("compare route exposes a named region for the compare shell", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  renderCompareRoute();

  expect(
    screen.getByRole("region", {
      name: "Compare products",
    }),
  ).toBeInTheDocument();
});

test("compare route presents URL-driven specification modes as tabs", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  renderCompareRoute();

  const tabs = screen.getByRole("tablist", { name: "Specification views" });

  expect(within(tabs).getByRole("tab", { name: "Shared specs" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(within(tabs).getByRole("tab", { name: "Differences" })).toHaveAttribute(
    "href",
    expect.stringContaining("specs=differences"),
  );
});

test("compare specification tabs preserve modified-click browser navigation", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  renderCompareRoute();

  const differencesTab = screen.getByRole("tab", { name: "Differences" });
  differencesTab.setAttribute("target", "_blank");
  const modifiedClick = new MouseEvent("click", {
    bubbles: true,
    button: 0,
    cancelable: true,
    ctrlKey: true,
  });

  act(() => differencesTab.dispatchEvent(modifiedClick));

  expect(modifiedClick.defaultPrevented).toBe(false);
});

test("comparison matrix keeps its selected view inside a named workspace", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  renderCompareRoute();

  const workspace = screen.getByRole("region", { name: "Specification comparison" });

  expect(
    within(workspace).getByRole("heading", { name: "Shared specifications" }),
  ).toBeInTheDocument();
  expect(
    within(workspace).getByText("No shared specifications across these products yet."),
  ).toBeInTheDocument();
});

test("compared product summaries expose direct product navigation", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  renderCompareRoute();

  const summaries = screen.getByRole("region", { name: "Product decision summaries" });
  expect(within(summaries).getByRole("link", { name: "View Detail Product" })).toHaveAttribute(
    "href",
    "/products/detail-product",
  );
  expect(within(summaries).getByRole("link", { name: "View Second Product" })).toHaveAttribute(
    "href",
    "/products/second-product",
  );
});

test("saved comparisons route prompts the user to sign in when the saved-set query is unauthorized", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "unauthorized",
    savedSets: [],
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>,
  );

  expect(screen.getByText("Sign in to view saved comparisons.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in to view saved comparisons" })).toHaveAttribute(
    "href",
    "/auth/login",
  );
});

test("isUnauthorizedSavedComparisonsResponse detects a structured unauthorized GraphQL error targeting the saved sets field", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse(
      buildGraphQLResponseWithErrors([
        {
          message: "Unauthorized",
          path: ["mySavedComparisonSets"],
          extensions: {
            code: "UNAUTHENTICATED",
          },
        },
      ]),
    ),
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
            code: "UNAUTHENTICATED",
          },
        },
      ]),
    ),
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
            code: "FORBIDDEN",
          },
        },
      ]),
    ),
  ).toBe(false);
});

test("isUnauthorizedSavedComparisonsResponse ignores fuzzy auth messages without extensions.code", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Access denied for saved comparison sets",
          path: ["mySavedComparisonSets"],
        },
      ],
    }),
  ).toBe(false);
});

test("isUnauthorizedSavedComparisonsResponse ignores not authorized messages without extensions.code", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "You are not authorized to access saved comparison sets",
          path: ["mySavedComparisonSets"],
        },
      ],
    }),
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
            code: "UNAUTHENTICATED",
          },
        },
      ]),
    ),
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse returns false for unrelated GraphQL errors", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Internal server error",
          path: ["mySavedComparisonSets"],
        },
      ],
    }),
  ).toBe(false);
});

test("isUnauthorizedSavedComparisonsResponse returns false for unauthorized errors on a different field path", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Unauthorized",
          path: ["someOtherField"],
        },
      ],
    }),
  ).toBe(false);
});

test("isUnauthorizedSavedComparisonsResponse returns false when the response has no errors array", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      data: {
        mySavedComparisonSets: {
          edges: [],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    }),
  ).toBe(false);
});

function getSaveFeedbackStatus() {
  return screen.getAllByRole("status")[0];
}

function renderCompareRoute() {
  return render(
    <MemoryRouter>
      <AuthenticatedCompareRoute />
    </MemoryRouter>,
  );
}

function AuthenticatedCompareRoute() {
  return (
    <Routes>
      <Route
        element={
          <Outlet
            context={{
              viewer: { id: "viewer-1", email: "person@example.com", isOperator: false },
            }}
          />
        }
      >
        <Route path="*" element={<CompareRoute />} />
      </Route>
    </Routes>
  );
}

function LocationProbe() {
  const location = useLocation();

  return (
    <span data-testid="location-probe">
      {location.pathname}
      {location.search}
    </span>
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
        product: DETAIL_PRODUCT,
      };
    }

    if (queryRef === SECOND_PRODUCT_QUERY_REF) {
      return {
        product: SECOND_PRODUCT,
      };
    }

    if (queryRef === THIRD_PRODUCT_QUERY_REF) {
      return {
        product: THIRD_PRODUCT,
      };
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });
}

function mockBatchedCompareProducts(products: Array<CompareTestProduct | null>) {
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === COMPARE_ROUTE_QUERY_REF) {
      return buildFetchedCompareRouteQuery({ products }).data;
    }

    throw new Error(`Unexpected per-product query ref: ${String(queryRef)}`);
  });
}

test("saved comparisons loader throws when pagination cursor does not advance", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare/saved?after=cursor-1");
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
              products: buildSavedProducts([DETAIL_PRODUCT.slug]),
            },
          ],
        }),
      ),
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
              products: buildSavedProducts([SECOND_PRODUCT.slug]),
            },
          ],
        }),
        secondPageDescriptor,
      ),
    );

  await expect(
    savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ environment, request })),
  ).rejects.toThrow("Invalid pagination cursor");
});
