import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { fetchGraphQL } from "../../../relay/fetch-graphql";
import { createRelayEnvironment } from "../../../relay/environment";
import {
  createRelayRouterContext,
  fetchRouteQuery,
  useRoutePreloadedQuery
} from "../../../relay/route-preload";
import type { LoaderFunctionArgs } from "react-router-dom";
import {
  MemoryRouter,
  useLoaderData
} from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import * as ReactRouterDom from "react-router-dom";
import { compareLoader } from "../loader";
import {
  isUnauthorizedSavedComparisonsResponse,
  savedComparisonsLoader
} from "../saved-data";
import { CompareErrorBoundary } from "../error-boundary";
import { CompareRoute } from "../index";
import { SavedComparisonsRoute } from "../saved";

const {
  commitMutationMock,
  fetchRouteQueryMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  fetchRouteQueryMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("../../../relay/fetch-graphql", async () => {
  const actual = await vi.importActual<typeof import("../../../relay/fetch-graphql")>(
    "../../../relay/fetch-graphql"
  );

  return {
    ...actual,
    fetchGraphQL: vi.fn()
  };
});

vi.mock("../../../relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../relay/route-preload")>(
    "../../../relay/route-preload"
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

const fetchGraphQLMock = vi.mocked(fetchGraphQL);
const mockedFetchRouteQuery = vi.mocked(fetchRouteQuery);
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

const DETAIL_PRODUCT_QUERY_REF = {
  dispose: vi.fn(),
  variables: DETAIL_PRODUCT_QUERY_DESCRIPTOR.__relayQuery.variables
};

const SECOND_PRODUCT_QUERY_REF = {
  dispose: vi.fn(),
  variables: SECOND_PRODUCT_QUERY_DESCRIPTOR.__relayQuery.variables
};

const buildFetchedProductQuery = (
  product: typeof DETAIL_PRODUCT | typeof SECOND_PRODUCT | null,
  descriptor: typeof DETAIL_PRODUCT_QUERY_DESCRIPTOR | typeof SECOND_PRODUCT_QUERY_DESCRIPTOR
) => ({
  data: {
    product
  },
  descriptor,
  dispose: vi.fn()
});

const buildProductSummary = (product: typeof DETAIL_PRODUCT | typeof SECOND_PRODUCT) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  description: product.description,
  brandName: product.brand.name
});

const buildReadyCompareLoaderData = () => ({
  status: "ready" as const,
  slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
  productQueries: [DETAIL_PRODUCT_QUERY_DESCRIPTOR, SECOND_PRODUCT_QUERY_DESCRIPTOR],
  products: [
    buildProductSummary(DETAIL_PRODUCT),
    buildProductSummary(SECOND_PRODUCT)
  ]
});

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    resolve,
    reject
  };
};

beforeEach(() => {
  commitMutationMock.mockReset();
  fetchRouteQueryMock.mockReset();
  fetchGraphQLMock.mockReset();
  useLoaderDataMock.mockReset();
  useMutationMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  DETAIL_PRODUCT_QUERY_REF.dispose.mockReset();
  SECOND_PRODUCT_QUERY_REF.dispose.mockReset();
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
  mockCompareRouteQueries();
});

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
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product"
  );

  mockedFetchRouteQuery
    .mockResolvedValueOnce(buildFetchedProductQuery(DETAIL_PRODUCT, DETAIL_PRODUCT_QUERY_DESCRIPTOR))
    .mockResolvedValueOnce(buildFetchedProductQuery(SECOND_PRODUCT, SECOND_PRODUCT_QUERY_DESCRIPTOR));

  await expect(
    compareLoader({
      request,
      params: {},
      context: createRelayRouterContext(environment)
    } as unknown as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "ready",
    slugs: ["detail-product", "second-product"],
    productQueries: [DETAIL_PRODUCT_QUERY_DESCRIPTOR, SECOND_PRODUCT_QUERY_DESCRIPTOR],
    products: [
      buildProductSummary(DETAIL_PRODUCT),
      buildProductSummary(SECOND_PRODUCT)
    ]
  });

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { slug: "detail-product" },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { slug: "second-product" },
    { signal: request.signal }
  );
});

test("compare loader forwards the route abort signal to each Relay preload", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product"
  );
  mockedFetchRouteQuery
    .mockResolvedValueOnce(buildFetchedProductQuery(DETAIL_PRODUCT, DETAIL_PRODUCT_QUERY_DESCRIPTOR))
    .mockResolvedValueOnce(buildFetchedProductQuery(SECOND_PRODUCT, SECOND_PRODUCT_QUERY_DESCRIPTOR));

  await compareLoader({
    request,
    params: {},
    context: createRelayRouterContext(environment)
  } as unknown as LoaderFunctionArgs);

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { slug: "detail-product" },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { slug: "second-product" },
    { signal: request.signal }
  );
});

test("compare loader returns not_found when any selected product is missing", async () => {
  const environment = createRelayEnvironment();
  const firstProductQuery = buildFetchedProductQuery(DETAIL_PRODUCT, DETAIL_PRODUCT_QUERY_DESCRIPTOR);
  const missingProductQuery = buildFetchedProductQuery(null, SECOND_PRODUCT_QUERY_DESCRIPTOR);

  mockedFetchRouteQuery
    .mockResolvedValueOnce(firstProductQuery)
    .mockResolvedValueOnce(missingProductQuery);

  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=detail-product&slug=missing-product"
      ),
      params: {},
      context: createRelayRouterContext(environment)
    } as unknown as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "not_found",
    slugs: ["detail-product", "missing-product"]
  });
  expect(firstProductQuery.dispose).toHaveBeenCalledTimes(1);
  expect(missingProductQuery.dispose).toHaveBeenCalledTimes(1);
});

test("compare loader throws when any selected product request fails", async () => {
  const environment = createRelayEnvironment();
  const fetchedProductQuery = buildFetchedProductQuery(
    DETAIL_PRODUCT,
    DETAIL_PRODUCT_QUERY_DESCRIPTOR
  );

  mockedFetchRouteQuery
    .mockResolvedValueOnce(fetchedProductQuery)
    .mockRejectedValueOnce(new Error("Network request failed: boom"));

  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=detail-product&slug=broken-product"
      ),
      params: {},
      context: createRelayRouterContext(environment)
    } as unknown as LoaderFunctionArgs)
  ).rejects.toThrow("Network request failed: boom");
  expect(fetchedProductQuery.dispose).toHaveBeenCalledTimes(1);
});

test("compare loader rethrows AbortError-like rejected reasons without wrapping", async () => {
  const environment = createRelayEnvironment();
  const abortError = {
    name: "AbortError",
    message: "The operation was aborted."
  };

  mockedFetchRouteQuery.mockRejectedValueOnce(abortError);

  await expect(
    compareLoader({
      request: new Request("https://app.example.com/compare?slug=detail-product"),
      params: {},
      context: createRelayRouterContext(environment)
    } as unknown as LoaderFunctionArgs)
  ).rejects.toBe(abortError);
});

test("compare loader wraps non-error rejected reasons with the original cause", async () => {
  const environment = createRelayEnvironment();
  const rejectionReason = "relay transport failed";
  let caughtError: unknown;

  mockedFetchRouteQuery.mockRejectedValueOnce(rejectionReason);

  try {
    await compareLoader({
      request: new Request("https://app.example.com/compare?slug=detail-product"),
      params: {},
      context: createRelayRouterContext(environment)
    } as unknown as LoaderFunctionArgs);
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toBeInstanceOf(Error);
  expect((caughtError as Error).message).toBe("Product fetch failed");
  expect((caughtError as Error & { cause?: unknown }).cause).toBe(rejectionReason);
});

test("compare loader throws when a rejected request is mixed with a missing product", async () => {
  const environment = createRelayEnvironment();
  const missingProductQuery = {
      data: {
        product: null
      },
      descriptor: DETAIL_PRODUCT_QUERY_DESCRIPTOR,
      dispose: vi.fn()
    };

  mockedFetchRouteQuery
    .mockResolvedValueOnce(missingProductQuery)
    .mockRejectedValueOnce(new Error("Network request failed: boom"));

  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=detail-product&slug=broken-product"
      ),
      params: {},
      context: createRelayRouterContext(environment)
    } as unknown as LoaderFunctionArgs)
  ).rejects.toThrow("Network request failed: boom");
  expect(missingProductQuery.dispose).toHaveBeenCalledTimes(1);
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
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Second Product" })).toBeInTheDocument();
});

test("compare route renders the compare error boundary when the loader throws", async () => {
  const useRouteErrorSpy = vi
    .spyOn(ReactRouterDom, "useRouteError")
    .mockReturnValue(new Error("Network request failed: boom"));

  try {
    render(<CompareErrorBoundary />);

    expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "A network error occurred while loading the comparison."
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please check your internet connection and try again."
    );
  } finally {
    useRouteErrorSpy.mockRestore();
  }
});

test("compare route keeps non-network TypeErrors on the generic error path", () => {
  const useRouteErrorSpy = vi
    .spyOn(ReactRouterDom, "useRouteError")
    .mockReturnValue(new TypeError("Cannot read properties of undefined"));

  try {
    render(<CompareErrorBoundary title="Compare products" />);

    expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "An unexpected error occurred while loading the comparison."
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(
      "Please check your internet connection and try again."
    );
  } finally {
    useRouteErrorSpy.mockRestore();
  }
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

  render(<CompareRoute />);

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

  expect(await screen.findByRole("status")).toHaveTextContent("Comparison saved.");
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

test("saved comparisons loader requests the current user's sets and forwards the SSR request", async () => {
  const request = new Request("https://app.example.com/compare/saved");
  const originalWindow = globalThis.window;

  vi.stubGlobal("window", undefined);
  fetchGraphQLMock.mockResolvedValue({
    data: {
      mySavedComparisonSets: {
        edges: [
          {
            node: {
              id: "saved-set-1",
              name: "Desk setup",
              items: [
                {
                  position: 2,
                  product: {
                    id: DETAIL_PRODUCT.id,
                    slug: DETAIL_PRODUCT.slug,
                    name: DETAIL_PRODUCT.name
                  }
                },
                {
                  position: 1,
                  product: {
                    id: SECOND_PRODUCT.id,
                    slug: SECOND_PRODUCT.slug,
                    name: SECOND_PRODUCT.name
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
    }
  });

  try {
    await expect(
      savedComparisonsLoader({
        request,
        params: {},
        context: undefined
      } as LoaderFunctionArgs)
    ).resolves.toEqual({
      status: "ready",
      savedSets: [
        {
          id: "saved-set-1",
          name: "Desk setup",
          slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
        }
      ]
    });
  } finally {
    vi.stubGlobal("window", originalWindow);
  }

  expect(fetchGraphQLMock).toHaveBeenCalledWith(
    expect.stringContaining("query MySavedComparisonSets"),
    { first: 20 },
    { request, signal: request.signal }
  );
});

test("saved comparisons loader follows pagination cursors until all saved sets are loaded", async () => {
  const request = new Request("https://app.example.com/compare/saved");

  fetchGraphQLMock
    .mockResolvedValueOnce({
      data: {
        mySavedComparisonSets: {
          edges: [
            {
              node: {
                id: "saved-set-1",
                name: "Desk setup",
                items: [
                  {
                    position: 1,
                    product: {
                      id: DETAIL_PRODUCT.id,
                      slug: DETAIL_PRODUCT.slug,
                      name: DETAIL_PRODUCT.name
                    }
                  }
                ]
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: "cursor-1"
          }
        }
      }
    })
    .mockResolvedValueOnce({
      data: {
        mySavedComparisonSets: {
          edges: [
            {
              node: {
                id: "saved-set-2",
                name: "Office setup",
                items: [
                  {
                    position: 1,
                    product: {
                      id: SECOND_PRODUCT.id,
                      slug: SECOND_PRODUCT.slug,
                      name: SECOND_PRODUCT.name
                    }
                  }
                ]
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: "cursor-2"
          }
        }
      }
    });

  await expect(
    savedComparisonsLoader({
      request,
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "ready",
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

  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("query MySavedComparisonSets"),
    { first: 20 },
    { signal: request.signal }
  );
  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    2,
    expect.stringContaining("query MySavedComparisonSets"),
    { first: 20, after: "cursor-1" },
    { signal: request.signal }
  );
});

test("saved comparisons loader returns unauthorized status when GraphQL returns an unauthorized error", async () => {
  const request = new Request("https://app.example.com/compare/saved");
  const originalWindow = globalThis.window;

  vi.stubGlobal("window", undefined);
  fetchGraphQLMock.mockResolvedValue({
    errors: [
      {
        message: "Unauthorized",
        path: ["mySavedComparisonSets"]
      }
    ]
  });

  try {
    await expect(
      savedComparisonsLoader({
        request,
        params: {},
        context: undefined
      } as LoaderFunctionArgs)
    ).resolves.toEqual({
      status: "unauthorized",
      savedSets: []
    });
  } finally {
    vi.stubGlobal("window", originalWindow);
  }

  expect(fetchGraphQLMock).toHaveBeenCalledWith(
    expect.stringContaining("query MySavedComparisonSets"),
    { first: 20 },
    { request, signal: request.signal }
  );
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

  render(<CompareRoute />);

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
  fetchGraphQLMock.mockResolvedValue({
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1"
        },
        errors: []
      }
    }
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
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation DeleteSavedComparisonSet"),
      {
        savedComparisonSetId: "saved-set-1"
      },
      undefined
    );
  });

  await waitFor(() => {
    expect(screen.queryByText("Desk setup")).not.toBeInTheDocument();
    expect(screen.getByText("Office setup")).toBeInTheDocument();
  });

  expect(screen.getByRole("status")).toHaveTextContent("Comparison deleted.");
});

test("saved comparisons route keeps the set visible when delete fails and clears pending state", async () => {
  fetchGraphQLMock.mockRejectedValueOnce(new Error("Network request failed: boom"));

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
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation DeleteSavedComparisonSet"),
      {
        savedComparisonSetId: "saved-set-1"
      },
      undefined
    );
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Delete comparison" })).toBeEnabled();
  });

  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Request failed. Please try again.");
});

test("saved comparisons route keeps the set visible when delete returns GraphQL errors and clears pending state", async () => {
  fetchGraphQLMock.mockResolvedValueOnce({
    data: {
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
    }
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
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation DeleteSavedComparisonSet"),
      {
        savedComparisonSetId: "saved-set-1"
      },
      undefined
    );
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Delete comparison" })).toBeEnabled();
  });

  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Could not delete this comparison set.");
});

test("saved comparisons route applies overlapping delete responses against the latest list state", async () => {
  const firstDelete = createDeferred<{
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: {
          id: string;
        } | null;
        errors: [];
      };
    };
  }>();
  const secondDelete = createDeferred<{
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: {
          id: string;
        } | null;
        errors: [];
      };
    };
  }>();

  fetchGraphQLMock
    .mockImplementationOnce(() => firstDelete.promise)
    .mockImplementationOnce(() => secondDelete.promise);

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
    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
  });

  await act(async () => {
    secondDelete.resolve({
      data: {
        deleteSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-2"
          },
          errors: []
        }
      }
    });

    await secondDelete.promise;
  });

  await act(async () => {
    firstDelete.resolve({
      data: {
        deleteSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-1"
          },
          errors: []
        }
      }
    });

    await firstDelete.promise;
  });

  await waitFor(() => {
    expect(screen.queryByText("Desk setup")).not.toBeInTheDocument();
    expect(screen.queryByText("Office setup")).not.toBeInTheDocument();
  });

  expect(screen.getByRole("status")).toHaveTextContent("Comparison deleted.");
});

test("saved comparisons route keeps later delete rows pending until their own response settles", async () => {
  const firstDelete = createDeferred<{
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: {
          id: string;
        } | null;
        errors: [];
      };
    };
  }>();
  const secondDelete = createDeferred<{
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: {
          id: string;
        } | null;
        errors: [];
      };
    };
  }>();

  fetchGraphQLMock
    .mockImplementationOnce(() => firstDelete.promise)
    .mockImplementationOnce(() => secondDelete.promise);

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
  });

  await act(async () => {
    firstDelete.resolve({
      data: {
        deleteSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-1"
          },
          errors: []
        }
      }
    });

    await firstDelete.promise;
  });

  expect(screen.getAllByRole("button", { name: "Deleting comparison..." })).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Deleting comparison..." })).toBeDisabled();

  await act(async () => {
    secondDelete.resolve({
      data: {
        deleteSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-2"
          },
          errors: []
        }
      }
    });

    await secondDelete.promise;
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

test("isUnauthorizedSavedComparisonsResponse detects an unauthorized GraphQL error targeting the saved sets field", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Unauthorized",
          path: ["mySavedComparisonSets"]
        }
      ]
    })
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse detects an unauthorized response from extensions.code", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse(
      {
        errors: [
          {
            message: "Authentication failed",
            path: ["mySavedComparisonSets"],
            extensions: {
              code: "UNAUTHENTICATED"
            }
          }
        ]
      } as unknown as Parameters<typeof isUnauthorizedSavedComparisonsResponse>[0]
    )
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse detects fuzzy auth messages without extensions.code", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Access denied for saved comparison sets",
          path: ["mySavedComparisonSets"]
        }
      ]
    })
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse detects not authorized messages", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "You are not authorized to access saved comparison sets",
          path: ["mySavedComparisonSets"]
        }
      ]
    })
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse detects pathless unauthorized errors with an empty path", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse(
      {
        errors: [
          {
            message: "Unauthorized",
            path: [],
            extensions: {
              code: "UNAUTHENTICATED"
            }
          }
        ]
      } as unknown as Parameters<typeof isUnauthorizedSavedComparisonsResponse>[0]
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
  const request = new Request("https://app.example.com/compare/saved");

  fetchGraphQLMock.mockResolvedValue({
    data: {
      mySavedComparisonSets: {
        edges: "not-an-array"
      }
    }
  });

  await expect(
    savedComparisonsLoader({
      request,
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).rejects.toThrow("Failed to parse saved comparison sets response");
});

test("saved comparisons loader throws when page cap is reached before pagination completes", async () => {
  const request = new Request("https://app.example.com/compare/saved");

  // Simulate a response where hasNextPage is always true so the loader hits the cap.
  // We use mockImplementation to return the same paginated response for each call.
  let callCount = 0;

  fetchGraphQLMock.mockImplementation(() => {
    callCount += 1;

    return Promise.resolve({
      data: {
        mySavedComparisonSets: {
          edges: [
            {
              node: {
                id: `saved-set-${callCount}`,
                name: `Set ${callCount}`,
                items: [
                  {
                    position: 1,
                    product: {
                      id: DETAIL_PRODUCT.id,
                      slug: DETAIL_PRODUCT.slug,
                      name: DETAIL_PRODUCT.name
                    }
                  }
                ]
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: `cursor-${callCount}`
          }
        }
      }
    });
  });

  await expect(
    savedComparisonsLoader({
      request,
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).rejects.toThrow("Saved comparison sets pagination limit exceeded");

  expect(fetchGraphQLMock).toHaveBeenCalledTimes(50);
});

test("saved comparisons loader returns empty status for zero saved sets with no truncation", async () => {
  const request = new Request("https://app.example.com/compare/saved");

  fetchGraphQLMock.mockResolvedValue({
    data: {
      mySavedComparisonSets: {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    }
  });

  const result = await savedComparisonsLoader({
    request,
    params: {},
    context: undefined
  } as LoaderFunctionArgs);

  expect(result).toEqual({
    status: "empty",
    savedSets: []
  });
});

test("saved comparisons loader aborts pagination when the request is cancelled", async () => {
  const controller = new AbortController();
  const originalWindow = globalThis.window;
  const request = {
    headers: new Headers(),
    signal: controller.signal,
    url: "https://app.example.com/compare/saved"
  } as unknown as Request;

  fetchGraphQLMock.mockImplementationOnce(() => {
    controller.abort();

    return Promise.resolve({
      data: {
        mySavedComparisonSets: {
          edges: [
            {
              node: {
                id: "saved-set-1",
                name: "Desk setup",
                items: [
                  {
                    position: 1,
                    product: {
                      id: DETAIL_PRODUCT.id,
                      slug: DETAIL_PRODUCT.slug,
                      name: DETAIL_PRODUCT.name
                    }
                  }
                ]
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: "cursor-1"
          }
        }
      }
    });
  });

  vi.stubGlobal("window", undefined);

  try {
    await expect(
      savedComparisonsLoader({
        request,
        params: {},
        context: undefined
      } as LoaderFunctionArgs)
    ).rejects.toThrow(/aborted/i);
  } finally {
    vi.stubGlobal("window", originalWindow);
  }

  expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);
  expect(fetchGraphQLMock).toHaveBeenCalledWith(
    expect.stringContaining("query MySavedComparisonSets"),
    { first: 20 },
    { request, signal: request.signal }
  );
});

function mockCompareRouteQueries() {
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => {
    if (descriptor === DETAIL_PRODUCT_QUERY_DESCRIPTOR) {
      return DETAIL_PRODUCT_QUERY_REF;
    }

    if (descriptor === SECOND_PRODUCT_QUERY_DESCRIPTOR) {
      return SECOND_PRODUCT_QUERY_REF;
    }

    throw new Error(`Unexpected query descriptor: ${JSON.stringify(descriptor)}`);
  });

  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
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

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });
}

test("saved comparisons loader throws when pagination cursor does not advance", async () => {
  const request = new Request("https://app.example.com/compare/saved");

  fetchGraphQLMock
    .mockResolvedValueOnce({
      data: {
        mySavedComparisonSets: {
          edges: [
            {
              node: {
                id: "saved-set-1",
                name: "Set 1",
                items: [
                  {
                    position: 1,
                    product: {
                      id: DETAIL_PRODUCT.id,
                      slug: DETAIL_PRODUCT.slug,
                      name: DETAIL_PRODUCT.name
                    }
                  }
                ]
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: "cursor-1"
          }
        }
      }
    })
    .mockResolvedValueOnce({
      data: {
        mySavedComparisonSets: {
          edges: [
            {
              node: {
                id: "saved-set-2",
                name: "Set 2",
                items: [
                  {
                    position: 1,
                    product: {
                      id: SECOND_PRODUCT.id,
                      slug: SECOND_PRODUCT.slug,
                      name: SECOND_PRODUCT.name
                    }
                  }
                ]
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: "cursor-1"
          }
        }
      }
    });

  await expect(
    savedComparisonsLoader({
      request,
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).rejects.toThrow("Invalid pagination cursor");
});
