import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useLazyLoadQuery, useMutation, usePreloadedQuery } from "react-relay";
import { fetchGraphQL } from "../../../src/relay/fetch-graphql";
import { createRelayEnvironment } from "../../../src/relay/environment";
import {
  fetchRouteQuery,
  useRoutePreloadedQuery
} from "../../../src/relay/route-preload";
import { CompareRoute } from "../../../src/routes/compare/index";
import { compareLoader } from "../../../src/routes/compare/loader";
import { SavedComparisonsRoute } from "../../../src/routes/compare/saved";
import { savedComparisonsLoader } from "../../../src/routes/compare/saved-data";
import {
  buildCompareLoaderArgs,
  buildSavedComparisonsLoaderArgs
} from "./saved-comparisons-test-helpers";

const {
  commitMutationMock,
  fetchRouteQueryMock,
  useLazyLoadQueryMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  fetchRouteQueryMock: vi.fn(),
  useLazyLoadQueryMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("../../../src/relay/fetch-graphql", () => ({
  fetchGraphQL: vi.fn()
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
    useLoaderData: useLoaderDataMock
  };
});

const mockedFetchGraphQL = vi.mocked(fetchGraphQL);
const mockedFetchRouteQuery = vi.mocked(fetchRouteQuery);
const mockedUseLazyLoadQuery = vi.mocked(useLazyLoadQuery);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

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
} as const;

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
} as const;

const detailProductQueryDescriptor = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: DETAIL_PRODUCT.slug }
  }
};

const secondProductQueryDescriptor = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: SECOND_PRODUCT.slug }
  }
};

const detailProductQueryRef = {
  dispose: vi.fn(),
  variables: detailProductQueryDescriptor.__relayQuery.variables
};

const secondProductQueryRef = {
  dispose: vi.fn(),
  variables: secondProductQueryDescriptor.__relayQuery.variables
};

function buildEmptyOfferContextQuery(productId: string) {
  return {
    data: {
      merchantProducts: {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    },
    descriptor: {
      __relayQuery: {
        operationName: "CompareOfferContextQuery",
        text:
          "query CompareOfferContextQuery($productId: ID!, $first: Int!, $after: String) { " +
          "merchantProducts(productId: $productId, first: $first, after: $after) { " +
          "edges { node { id } } } }",
        variables: { productId, first: 3, after: null }
      }
    },
    dispose: vi.fn()
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
    latestPriceObservedAt: null
  };
}

const savedComparisonsRouteQueryDescriptor = {
  __relayQuery: {
    operationName: "SavedComparisonsRouteQuery",
    text: "query SavedComparisonsRouteQuery($first: Int!, $after: String) { mySavedComparisonSets(first: $first, after: $after) { edges { node { id } } } }",
    variables: { first: 20 }
  }
};

const savedComparisonsQueryRef = {
  dispose: vi.fn(),
  variables: savedComparisonsRouteQueryDescriptor.__relayQuery.variables
};

beforeEach(() => {
  commitMutationMock.mockReset();
  fetchRouteQueryMock.mockReset();
  mockedFetchGraphQL.mockReset();
  useLazyLoadQueryMock.mockReset();
  useLoaderDataMock.mockReset();
  useMutationMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  detailProductQueryRef.dispose.mockReset();
  secondProductQueryRef.dispose.mockReset();
  savedComparisonsQueryRef.dispose.mockReset();
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: []
    }
  });
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
});

test("compare loader preloads selected product detail queries through Relay", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product"
  );

  mockedFetchGraphQL
    .mockResolvedValueOnce({ data: { product: DETAIL_PRODUCT } })
    .mockResolvedValueOnce({ data: { product: SECOND_PRODUCT } });
  mockedFetchRouteQuery
    .mockResolvedValueOnce({
      data: {
        product: DETAIL_PRODUCT
      },
      descriptor: detailProductQueryDescriptor,
      dispose: vi.fn()
    })
    .mockResolvedValueOnce({
      data: {
        product: SECOND_PRODUCT
      },
      descriptor: secondProductQueryDescriptor,
      dispose: vi.fn()
    })
    .mockResolvedValueOnce(buildEmptyOfferContextQuery(DETAIL_PRODUCT.id))
    .mockResolvedValueOnce(buildEmptyOfferContextQuery(SECOND_PRODUCT.id));

  await expect(
    compareLoader(buildCompareLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    specMode: "shared",
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
    productQueries: [detailProductQueryDescriptor, secondProductQueryDescriptor],
    offerContexts: {
      [DETAIL_PRODUCT.id]: buildEmptyOfferContextSummary(DETAIL_PRODUCT.id),
      [SECOND_PRODUCT.id]: buildEmptyOfferContextSummary(SECOND_PRODUCT.id)
    },
    products: [
      {
        id: DETAIL_PRODUCT.id,
        name: DETAIL_PRODUCT.name,
        slug: DETAIL_PRODUCT.slug,
        description: DETAIL_PRODUCT.description,
        brandName: DETAIL_PRODUCT.brand.name,
        currentAttributes: []
      },
      {
        id: SECOND_PRODUCT.id,
        name: SECOND_PRODUCT.name,
        slug: SECOND_PRODUCT.slug,
        description: SECOND_PRODUCT.description,
        brandName: SECOND_PRODUCT.brand.name,
        currentAttributes: []
      }
    ]
  });

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { slug: DETAIL_PRODUCT.slug },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { slug: SECOND_PRODUCT.slug },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    3,
    environment,
    expect.anything(),
    { productId: DETAIL_PRODUCT.id, first: 3, after: null },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    4,
    environment,
    expect.anything(),
    { productId: SECOND_PRODUCT.id, first: 3, after: null },
    { signal: request.signal }
  );
});

test("compare route renders compared product cards from Relay route queries", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockRouteQueryRefs();
  mockProductQueries();

  render(
    <MemoryRouter>
      <CompareRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Second Product" })).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    detailProductQueryDescriptor
  );
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    secondProductQueryDescriptor
  );
});

test("compare route falls back to loader summaries when Relay detail rendering fails", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockRouteQueryRefs();
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw new Error("Relay detail read failed");
  });

  try {
    render(
      <MemoryRouter>
        <CompareRoute />
      </MemoryRouter>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Comparison details unavailable.");
    expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Second Product" })).toBeInTheDocument();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("compare route saves the current selection through a Relay mutation", async () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockRouteQueryRefs();
  mockProductQueries();
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

  render(
    <MemoryRouter>
      <CompareRoute />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));

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
  expect(
    await screen.findByRole("status", { name: "Save comparison status" })
  ).toHaveTextContent("Comparison saved.");
});

test("saved comparisons loader preloads saved-set pages through Relay", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/compare/saved");

  mockedFetchRouteQuery.mockResolvedValueOnce({
    data: {
      mySavedComparisonSets: {
        edges: [
          {
            node: {
              id: "saved-set-1",
              name: "Relay saved set",
              items: [
                {
                  position: 1,
                  product: {
                    slug: DETAIL_PRODUCT.slug
                  }
                }
              ]
            }
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    },
    descriptor: savedComparisonsRouteQueryDescriptor,
    dispose: vi.fn()
  });

  await expect(
    savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    savedSetQueries: [savedComparisonsRouteQueryDescriptor],
    savedSets: [
      {
        id: "saved-set-1",
        name: "Relay saved set",
        slugs: [DETAIL_PRODUCT.slug]
      }
    ]
  });

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20 },
    { signal: request.signal }
  );
  expect(mockedFetchGraphQL).not.toHaveBeenCalled();
});

test("saved comparisons route renders loader summaries while retaining Relay route queries", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSetQueries: [savedComparisonsRouteQueryDescriptor],
    savedSets: [
      {
        id: "fallback-saved-set",
        name: "Fallback saved set",
        slugs: ["fallback-product"]
      }
    ]
  });
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => {
    if (descriptor === savedComparisonsRouteQueryDescriptor) {
      return savedComparisonsQueryRef;
    }

    throw new Error(`Unexpected query descriptor: ${JSON.stringify(descriptor)}`);
  });
  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  expect(screen.getByText("Fallback saved set")).toBeInTheDocument();
  expect(screen.getByText("fallback-product")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    savedComparisonsRouteQueryDescriptor
  );
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

test("saved comparisons route deletes saved sets through a Relay mutation", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSetQueries: [],
    savedSets: [
      {
        id: "saved-set-1",
        name: "Relay saved set",
        slugs: [DETAIL_PRODUCT.slug]
      }
    ]
  });
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted({
      deleteSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1"
        },
        errors: []
      }
    });
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
  expect(mockedFetchGraphQL).not.toHaveBeenCalled();
  expect(screen.queryByText("Relay saved set")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Comparison deleted.");
});

function buildReadyLoaderData() {
  return {
    status: "ready" as const,
    specMode: "shared" as const,
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
    productQueries: [detailProductQueryDescriptor, secondProductQueryDescriptor],
    offerContexts: {
      [DETAIL_PRODUCT.id]: buildEmptyOfferContextSummary(DETAIL_PRODUCT.id),
      [SECOND_PRODUCT.id]: buildEmptyOfferContextSummary(SECOND_PRODUCT.id)
    },
    products: [
      {
        id: DETAIL_PRODUCT.id,
        name: DETAIL_PRODUCT.name,
        slug: DETAIL_PRODUCT.slug,
        description: DETAIL_PRODUCT.description,
        brandName: DETAIL_PRODUCT.brand.name,
        currentAttributes: []
      },
      {
        id: SECOND_PRODUCT.id,
        name: SECOND_PRODUCT.name,
        slug: SECOND_PRODUCT.slug,
        description: SECOND_PRODUCT.description,
        brandName: SECOND_PRODUCT.brand.name,
        currentAttributes: []
      }
    ]
  };
}

function mockRouteQueryRefs() {
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => {
    if (descriptor === detailProductQueryDescriptor) {
      return detailProductQueryRef;
    }

    if (descriptor === secondProductQueryDescriptor) {
      return secondProductQueryRef;
    }

    throw new Error(`Unexpected query descriptor: ${JSON.stringify(descriptor)}`);
  });
}

function mockProductQueries() {
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === detailProductQueryRef) {
      return {
        product: DETAIL_PRODUCT
      };
    }

    if (queryRef === secondProductQueryRef) {
      return {
        product: SECOND_PRODUCT
      };
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });
}
