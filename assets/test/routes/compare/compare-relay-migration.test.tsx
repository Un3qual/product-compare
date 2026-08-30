import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes, useLoaderData } from "react-router-dom";
import {
  useFragment,
  useLazyLoadQuery,
  useMutation,
  usePaginationFragment,
  usePreloadedQuery,
} from "react-relay";
import { fetchGraphQL } from "../../../src/relay/fetch-graphql";
import { createRelayEnvironment } from "../../../src/relay/environment";
import { fetchRouteQuery, useRoutePreloadedQuery } from "../../../src/relay/route-preload";
import { CompareRoute, compareLoader } from "../../../src/routes/compare/CompareRoute";
import { mockPreloadedQuery } from "../../helpers/relay";
import { buildCompareLoaderArgs } from "./saved-comparisons-test-helpers";

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

vi.mock("../../../src/relay/fetch-graphql", () => ({
  fetchGraphQL: vi.fn(),
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

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
  };
});

const mockedFetchGraphQL = vi.mocked(fetchGraphQL);
const mockedFetchRouteQuery = vi.mocked(fetchRouteQuery);
const mockedUseLazyLoadQuery = vi.mocked(useLazyLoadQuery);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseFragment = vi.mocked(useFragment);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePaginationFragment = vi.mocked(usePaginationFragment);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

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
} as const;

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
} as const;

const detailProductQueryDescriptor = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: DETAIL_PRODUCT.slug },
  },
};

const secondProductQueryDescriptor = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: SECOND_PRODUCT.slug },
  },
};

const detailProductQueryRef = mockPreloadedQuery(
  detailProductQueryDescriptor.__relayQuery.variables,
);

const secondProductQueryRef = mockPreloadedQuery(
  secondProductQueryDescriptor.__relayQuery.variables,
);

const compareRouteQueryDescriptor = {
  __relayQuery: {
    operationName: "CompareRouteQuery",
    text: "query CompareRouteQuery($slugs: [String!]!, $offerFirst: Int!) { comparisonProducts(slugs: $slugs) { id } }",
    variables: {
      slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
      offerFirst: 3,
    },
  },
};

const compareRouteQueryRef = mockPreloadedQuery(compareRouteQueryDescriptor.__relayQuery.variables);

function buildCombinedCompareQuery() {
  return {
    data: {
      comparisonProducts: [DETAIL_PRODUCT, SECOND_PRODUCT].map((product) => ({
        ...product,
        offerTruth: { asOf: "2026-06-29T13:00:00Z" },
        merchantProducts: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            endCursor: null,
          },
        },
      })),
    },
    descriptor: compareRouteQueryDescriptor,
    dispose: vi.fn(),
  };
}

function buildEmptyOfferContextSummary(productId: string) {
  return {
    status: "available" as const,
    productId,
    activeOfferCount: 0,
    bestCurrentPrice: null,
    hasLoadedCoupons: false,
    hasMoreActiveOffers: false,
    hasMoreCoupons: false,
    latestPriceObservedAt: null,
    referenceTime: "2026-06-29T13:00:00Z",
  };
}

beforeEach(() => {
  commitMutationMock.mockReset();
  fetchRouteQueryMock.mockReset();
  mockedUseFragment.mockReset();
  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => fragmentRef as never);
  mockedFetchGraphQL.mockReset();
  useLazyLoadQueryMock.mockReset();
  useLoaderDataMock.mockReset();
  useMutationMock.mockReset();
  usePaginationFragmentMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  detailProductQueryRef.dispose.mockReset();
  secondProductQueryRef.dispose.mockReset();
  mockedUseLazyLoadQuery.mockReturnValue({
    comparisonRecommendation: {
      algorithmVersion: "test-v1",
      currency: null,
      missingInputs: ["No shared currency."],
      profile: "LOWEST_CURRENT_COST",
      rankings: [],
      status: "INSUFFICIENT_EVIDENCE",
      winnerProductId: null,
    },
    products: {
      edges: [],
      pageInfo: { endCursor: null, hasNextPage: false },
    },
  } as never);
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
  mockedUsePaginationFragment.mockImplementation(
    (_fragment, fragmentRef) =>
      ({ data: fragmentRef, hasNext: false, isLoadingNext: false, loadNext: vi.fn() }) as never,
  );
});

test("compare loader preloads the batched comparison query through Relay", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product",
  );

  mockedFetchRouteQuery.mockResolvedValueOnce(buildCombinedCompareQuery());

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request })),
  ).resolves.toMatchObject({
    status: "ready",
    specMode: "shared",
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
    query: compareRouteQueryDescriptor,
    offerContexts: {
      [DETAIL_PRODUCT.id]: buildEmptyOfferContextSummary(DETAIL_PRODUCT.id),
      [SECOND_PRODUCT.id]: buildEmptyOfferContextSummary(SECOND_PRODUCT.id),
    },
    products: [
      {
        id: DETAIL_PRODUCT.id,
        name: DETAIL_PRODUCT.name,
        slug: DETAIL_PRODUCT.slug,
        description: DETAIL_PRODUCT.description,
        brandName: DETAIL_PRODUCT.brand.name,
        currentAttributes: [],
      },
      {
        id: SECOND_PRODUCT.id,
        name: SECOND_PRODUCT.name,
        slug: SECOND_PRODUCT.slug,
        description: SECOND_PRODUCT.description,
        brandName: SECOND_PRODUCT.brand.name,
        currentAttributes: [],
      },
    ],
  });

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
      offerFirst: 3,
    },
    { signal: request.signal },
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("compare route renders compared product cards from batched loader summaries", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockRouteQueryRefs();
  mockProductQueries();

  render(
    <MemoryRouter>
      <AuthenticatedCompareRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Second Product" })).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    compareRouteQueryDescriptor,
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(expect.anything(), compareRouteQueryRef);
  expect(mockedUsePreloadedQuery).toHaveBeenCalledTimes(1);
});

test("compare route does not require per-product Relay detail reads", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockRouteQueryRefs();
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === compareRouteQueryRef) {
      return { comparisonProducts: [DETAIL_PRODUCT, SECOND_PRODUCT] };
    }

    throw new Error(`Per-product Relay detail read is not allowed: ${String(queryRef)}`);
  });

  render(
    <MemoryRouter>
      <AuthenticatedCompareRoute />
    </MemoryRouter>,
  );

  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Second Product" })).toBeInTheDocument();
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(expect.anything(), compareRouteQueryRef);
  expect(mockedUsePreloadedQuery).toHaveBeenCalledTimes(1);
});

test("compare route saves the current selection through a Relay mutation", async () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockRouteQueryRefs();
  mockProductQueries();
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

  render(
    <MemoryRouter>
      <AuthenticatedCompareRoute />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));

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
  expect(await screen.findByRole("status", { name: "Save comparison status" })).toHaveTextContent(
    "Comparison saved.",
  );
});

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

function buildReadyLoaderData() {
  return {
    status: "ready" as const,
    specMode: "shared" as const,
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
    query: compareRouteQueryDescriptor,
    offerContexts: {
      [DETAIL_PRODUCT.id]: buildEmptyOfferContextSummary(DETAIL_PRODUCT.id),
      [SECOND_PRODUCT.id]: buildEmptyOfferContextSummary(SECOND_PRODUCT.id),
    },
    products: [
      {
        id: DETAIL_PRODUCT.id,
        name: DETAIL_PRODUCT.name,
        slug: DETAIL_PRODUCT.slug,
        description: DETAIL_PRODUCT.description,
        brandName: DETAIL_PRODUCT.brand.name,
        currentAttributes: [],
      },
      {
        id: SECOND_PRODUCT.id,
        name: SECOND_PRODUCT.name,
        slug: SECOND_PRODUCT.slug,
        description: SECOND_PRODUCT.description,
        brandName: SECOND_PRODUCT.brand.name,
        currentAttributes: [],
      },
    ],
  };
}

function mockRouteQueryRefs() {
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => {
    if (descriptor === compareRouteQueryDescriptor) {
      return compareRouteQueryRef;
    }

    throw new Error(`Unexpected query descriptor: ${JSON.stringify(descriptor)}`);
  });
}

function mockProductQueries() {
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === compareRouteQueryRef) {
      return {
        comparisonProducts: [DETAIL_PRODUCT, SECOND_PRODUCT],
      };
    }

    if (queryRef === detailProductQueryRef) {
      return {
        product: DETAIL_PRODUCT,
      };
    }

    if (queryRef === secondProductQueryRef) {
      return {
        product: SECOND_PRODUCT,
      };
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });
}
