import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { MemoryRouter, RouterContextProvider, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import { createOperationDescriptor, type Variables } from "relay-runtime";
import { createRelayEnvironment } from "../../../src/relay/environment";
import browseProductsRouteQueryArtifact, {
  type BrowseProductsRouteQuery
} from "../../../src/__generated__/BrowseProductsRouteQuery.graphql";
import type { ProductFilterMetadataQuery } from "../../../src/__generated__/ProductFilterMetadataQuery.graphql";
import {
  createRelayRouterContext,
  fetchRouteQuery,
  useRoutePreloadedQuery
} from "../../../src/relay/route-preload";
import { browseLoader } from "../../../src/routes/catalog/loader";
import { BrowseRoute } from "../../../src/routes/catalog/browse";
import { catalogBrowseNextPagePath } from "../../../src/routes/catalog/paths";

const { fetchRouteQueryMock, useLoaderDataMock, usePreloadedQueryMock, useRoutePreloadedQueryMock } =
  vi.hoisted(() => ({
    fetchRouteQueryMock: vi.fn(),
    useLoaderDataMock: vi.fn(),
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
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const browseQueryDescriptor = browseQueryDescriptorFromVariables();
const filterMetadataQueryDescriptor = filterMetadataQueryDescriptorFromVariables();
const emptyCatalogFilters = {
  useCaseTaxonIds: [],
  numeric: [],
  booleans: [],
  enums: []
};
type MockRouteQueryRef = { dispose: () => void; variables: Variables };

const buildBrowseLoaderArgs = ({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.com/products")
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}): LoaderFunctionArgs => ({
  request,
  params: {},
  context: createRelayRouterContext(environment),
  unstable_pattern: "/products"
});

function browseQueryDescriptorFromVariables(
  variables: BrowseProductsRouteQuery["variables"] = { first: 12 }
) {
  return {
    __relayQuery: {
      operationName: "BrowseProductsRouteQuery",
      text: "query BrowseProductsRouteQuery($first: Int!, $after: String) { products(first: $first, after: $after) { edges { node { id } } } }",
      variables
    }
  };
}

function filterMetadataQueryDescriptorFromVariables(
  variables: ProductFilterMetadataQuery["variables"] = {}
) {
  return {
    __relayQuery: {
      operationName: "ProductFilterMetadataQuery",
      text: "query ProductFilterMetadataQuery($filters: ProductFiltersInput) { productFilterMetadata(filters: $filters) { resultCount } }",
      variables
    }
  };
}

function fetchedRouteQueryResult<TDescriptor>(
  descriptor: TDescriptor,
  dispose = vi.fn()
) {
  return {
    data: {},
    descriptor,
    dispose
  };
}

function mockSuccessfulBrowseLoaderFetches({
  productDescriptor = browseQueryDescriptor,
  metadataDescriptor = filterMetadataQueryDescriptor
}: {
  productDescriptor?: ReturnType<typeof browseQueryDescriptorFromVariables>;
  metadataDescriptor?: ReturnType<typeof filterMetadataQueryDescriptorFromVariables>;
} = {}) {
  mockedFetchRouteQuery
    .mockResolvedValueOnce(fetchedRouteQueryResult(productDescriptor))
    .mockResolvedValueOnce(fetchedRouteQueryResult(metadataDescriptor));
}

function readyBrowseLoaderData({
  filters = emptyCatalogFilters,
  metadataQuery = filterMetadataQueryDescriptor,
  pageSize = 12,
  query = browseQueryDescriptor
}: {
  filters?: typeof emptyCatalogFilters | Record<string, unknown>;
  metadataQuery?: ReturnType<typeof filterMetadataQueryDescriptorFromVariables>;
  pageSize?: number;
  query?: ReturnType<typeof browseQueryDescriptorFromVariables>;
} = {}) {
  return {
    status: "ready",
    filters,
    pageSize,
    query,
    metadataQuery
  };
}

function getBrowseProductsRouteQueryArtifact() {
  return browseProductsRouteQueryArtifact as {
    params?: {
      metadata?: {
        connection?: ReadonlyArray<{
          count?: string;
          cursor?: string;
          direction?: string;
          path?: ReadonlyArray<string>;
        }>;
      };
      text?: string | null;
    };
  };
}

function buildBrowseProductsConnection({
  endCursor,
  hasNextPage,
  products
}: {
  endCursor: string | null;
  hasNextPage: boolean;
  products: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}) {
  return {
    edges: products.map((product, index) => ({
      cursor: `cursor-${index + 1}`,
      node: {
        ...product,
        __typename: "Product",
        brand: {
          id: `brand-${product.id}`,
          name: `Brand for ${product.name}`
        }
      }
    })),
    pageInfo: {
      hasNextPage,
      endCursor
    }
  };
}

function buildBrowseProductsResponse({
  endCursor = null,
  hasNextPage = false,
  products = []
}: {
  endCursor?: string | null;
  hasNextPage?: boolean;
  products?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
} = {}) {
  return {
    products: buildBrowseProductsConnection({
      endCursor,
      hasNextPage,
      products
    })
  };
}

function buildProductFilterMetadataResponse({
  resultCount = 1,
  selected = false
}: {
  resultCount?: number;
  selected?: boolean;
} = {}) {
  return {
    productFilterMetadata: {
      resultCount,
      typeOptions: [
        {
          id: "type-laptops",
          label: "Laptops",
          count: 6,
          selected,
          disabled: false
        },
        {
          id: "type-tablets",
          label: "Tablets",
          count: 0,
          selected: false,
          disabled: true
        }
      ],
      useCaseOptions: [
        {
          id: "use-gaming",
          label: "Gaming",
          count: 4,
          selected,
          disabled: false
        },
        {
          id: "use-office",
          label: "Office",
          count: 3,
          selected: false,
          disabled: false
        }
      ],
      numericFilters: [
        {
          attributeId: "attr-refresh",
          code: "refresh_rate",
          displayName: "Refresh Rate",
          unitSymbol: "Hz",
          min: "60",
          max: "360",
          selectedMin: selected ? "120" : null,
          selectedMax: selected ? "240" : null
        }
      ],
      booleanFilters: [
        {
          attributeId: "attr-wireless",
          code: "wireless",
          displayName: "Wireless",
          trueCount: 5,
          falseCount: 2,
          selectedValue: selected ? true : null
        }
      ],
      enumFilters: [
        {
          attributeId: "attr-color",
          code: "color",
          displayName: "Color",
          options: [
            {
              id: "enum-red",
              label: "Red",
              count: 2,
              selected,
              disabled: false
            },
            {
              id: "enum-blue",
              label: "Blue",
              count: 1,
              selected: false,
              disabled: false
            }
          ]
        }
      ]
    }
  };
}

function mockBrowseRouteRelayData({
  loaderData = readyBrowseLoaderData(),
  metadataData = buildProductFilterMetadataResponse(),
  metadataQueryRef,
  productData = buildBrowseProductsResponse({
    products: [
      {
        id: "product-1",
        name: "Catalog First",
        slug: "catalog-first"
      }
    ]
  }),
  productQueryRef
}: {
  loaderData?: ReturnType<typeof readyBrowseLoaderData>;
  metadataData?: ProductFilterMetadataQuery["response"];
  metadataQueryRef?: MockRouteQueryRef;
  productData?: BrowseProductsRouteQuery["response"];
  productQueryRef?: MockRouteQueryRef;
} = {}) {
  const resolvedProductQueryRef = productQueryRef ?? {
    dispose: vi.fn(),
    variables: loaderData.query.__relayQuery.variables
  };
  const resolvedMetadataQueryRef = metadataQueryRef ?? {
    dispose: vi.fn(),
    variables: loaderData.metadataQuery.__relayQuery.variables
  };

  mockedUseLoaderData.mockReturnValue(loaderData);
  mockedUseRoutePreloadedQuery
    .mockReturnValueOnce(resolvedProductQueryRef)
    .mockReturnValueOnce(resolvedMetadataQueryRef);
  mockedUsePreloadedQuery
    .mockReturnValueOnce(productData)
    .mockReturnValueOnce(metadataData);

  return {
    metadataQueryRef: resolvedMetadataQueryRef,
    productQueryRef: resolvedProductQueryRef
  };
}

function renderBrowseRouteWithRelayData({
  initialEntries = ["/products"],
  loaderData = readyBrowseLoaderData(),
  metadataData = buildProductFilterMetadataResponse(),
  productData = buildBrowseProductsResponse({
    products: [
      {
        id: "product-1",
        name: "Catalog First",
        slug: "catalog-first"
      }
    ]
  })
}: {
  initialEntries?: string[];
  loaderData?: ReturnType<typeof readyBrowseLoaderData>;
  metadataData?: ReturnType<typeof buildProductFilterMetadataResponse>;
  productData?: ReturnType<typeof buildBrowseProductsResponse>;
} = {}) {
  mockBrowseRouteRelayData({
    loaderData,
    metadataData,
    productData
  });

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <BrowseRoute />
    </MemoryRouter>
  );
}

beforeEach(() => {
  fetchRouteQueryMock.mockReset();
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
});

test("browse loader preloads and returns the Relay browse route query", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products");

  mockSuccessfulBrowseLoaderFetches();

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual(readyBrowseLoaderData());

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal }
  );
});

test("browse loader defaults to a page size of 12 when first is omitted", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products");

  mockSuccessfulBrowseLoaderFetches();

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual(readyBrowseLoaderData());

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal }
  );
});

test("browse loader preserves supported first values from the URL", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?after=cursor-next-page&first=24");
  const queryDescriptorWithCursorAndFirst = browseQueryDescriptorFromVariables({
    first: 24,
    after: "cursor-next-page"
  });

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: queryDescriptorWithCursorAndFirst
  });

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual(
    readyBrowseLoaderData({
      pageSize: 24,
      query: queryDescriptorWithCursorAndFirst
    })
  );

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 24, after: "cursor-next-page" },
    { signal: request.signal }
  );
});

test("browse loader drops oversized first values above 48", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?first=100");

  mockSuccessfulBrowseLoaderFetches();

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual(readyBrowseLoaderData());

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal }
  );
});

test("browse loader drops first values that are not page-size options", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?first=35");

  mockSuccessfulBrowseLoaderFetches();

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual(readyBrowseLoaderData());

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal }
  );
});

test("browse loader drops malformed first values", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?first=12abc");

  mockSuccessfulBrowseLoaderFetches();

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual(readyBrowseLoaderData());

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal }
  );
});

test("browse loader forwards the requested pagination cursor", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?after=cursor-next-page");

  mockSuccessfulBrowseLoaderFetches();

  await expect(
    browseLoader(buildBrowseLoaderArgs({ environment, request }))
  ).resolves.toEqual(readyBrowseLoaderData());

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12, after: "cursor-next-page" },
    { signal: request.signal }
  );
});

test("browse loader passes URL filters to the product and metadata queries", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/products?typeTaxonId=relay-type-taxons%2Fdisplay&includeTypeDescendants=1&useCaseTaxonId=relay-use-case-gaming&useCaseTaxonId=relay-use-case-office&numeric.relay-attribute-price.min=10.50&numeric.relay-attribute-price.max=99.99&numeric.relay-attribute-weight.max=4.5&boolean.relay-attribute-wireless=true&enum.relay-attribute-color=relay-enum-red&enum.relay-attribute-color=relay-enum-blue"
  );
  const expectedFilters = {
    primaryTypeTaxonId: "relay-type-taxons/display",
    includeTypeDescendants: true,
    useCaseTaxonIds: ["relay-use-case-gaming", "relay-use-case-office"],
    numeric: [
      {
        attributeId: "relay-attribute-price",
        min: "10.50",
        max: "99.99"
      },
      {
        attributeId: "relay-attribute-weight",
        max: "4.5"
      }
    ],
    booleans: [
      {
        attributeId: "relay-attribute-wireless",
        value: true
      }
    ],
    enums: [
      {
        attributeId: "relay-attribute-color",
        enumOptionId: "relay-enum-blue"
      }
    ]
  };

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: browseQueryDescriptorFromVariables({
      first: 12,
      filters: expectedFilters
    }),
    metadataDescriptor: filterMetadataQueryDescriptorFromVariables({
      filters: expectedFilters
    })
  });

  await browseLoader(buildBrowseLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 12, filters: expectedFilters },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { filters: expectedFilters },
    { signal: request.signal }
  );
});

test("browse loader drops blank numeric bounds and malformed boolean filter values", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/products?typeTaxonId=&useCaseTaxonId=&numeric.relay-attribute-empty.min=&numeric.relay-attribute-empty.max=%20&numeric.relay-attribute-refresh.min=&numeric.relay-attribute-refresh.max=240&boolean.relay-attribute-touchscreen=yes&boolean.relay-attribute-backlit=false&enum.relay-attribute-panel="
  );
  const expectedFilters = {
    numeric: [
      {
        attributeId: "relay-attribute-refresh",
        max: "240"
      }
    ],
    booleans: [
      {
        attributeId: "relay-attribute-backlit",
        value: false
      }
    ]
  };

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: browseQueryDescriptorFromVariables({
      first: 12,
      filters: expectedFilters
    }),
    metadataDescriptor: filterMetadataQueryDescriptorFromVariables({
      filters: expectedFilters
    })
  });

  await browseLoader(buildBrowseLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 12, filters: expectedFilters },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { filters: expectedFilters },
    { signal: request.signal }
  );
});

test("browse loader drops malformed decimal numeric bounds", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/products?numeric.relay-attribute-price.min=10abc&numeric.relay-attribute-price.max=99.99&numeric.relay-attribute-weight.min=0x10&numeric.relay-attribute-refresh.min=120.5"
  );
  const expectedFilters = {
    numeric: [
      {
        attributeId: "relay-attribute-price",
        max: "99.99"
      },
      {
        attributeId: "relay-attribute-refresh",
        min: "120.5"
      }
    ]
  };

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: browseQueryDescriptorFromVariables({
      first: 12,
      filters: expectedFilters
    }),
    metadataDescriptor: filterMetadataQueryDescriptorFromVariables({
      filters: expectedFilters
    })
  });

  await browseLoader(buildBrowseLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 12, filters: expectedFilters },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { filters: expectedFilters },
    { signal: request.signal }
  );
});

test("browse loader keeps backend-accepted decimal numeric bound forms", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/products?numeric.relay-attribute-price.min=.5&numeric.relay-attribute-price.max=1e3&numeric.relay-attribute-weight.min=%2B1&numeric.relay-attribute-weight.max=1.&numeric.relay-attribute-latency.min=0001e2&numeric.relay-attribute-latency.max=200"
  );
  const expectedFilters = {
    numeric: [
      {
        attributeId: "relay-attribute-price",
        min: ".5",
        max: "1e3"
      },
      {
        attributeId: "relay-attribute-weight",
        min: "+1",
        max: "1."
      },
      {
        attributeId: "relay-attribute-latency",
        min: "0001e2",
        max: "200"
      }
    ]
  };

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: browseQueryDescriptorFromVariables({
      first: 12,
      filters: expectedFilters
    }),
    metadataDescriptor: filterMetadataQueryDescriptorFromVariables({
      filters: expectedFilters
    })
  });

  await browseLoader(buildBrowseLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 12, filters: expectedFilters },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { filters: expectedFilters },
    { signal: request.signal }
  );
});

test("browse loader drops numeric ranges whose minimum is greater than their maximum", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/products?numeric.relay-attribute-price.min=100&numeric.relay-attribute-price.max=50&numeric.relay-attribute-refresh.min=120&numeric.relay-attribute-refresh.max=240"
  );
  const expectedFilters = {
    numeric: [
      {
        attributeId: "relay-attribute-refresh",
        min: "120",
        max: "240"
      }
    ]
  };

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: browseQueryDescriptorFromVariables({
      first: 12,
      filters: expectedFilters
    }),
    metadataDescriptor: filterMetadataQueryDescriptorFromVariables({
      filters: expectedFilters
    })
  });

  await browseLoader(buildBrowseLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 12, filters: expectedFilters },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { filters: expectedFilters },
    { signal: request.signal }
  );
});

test("browse loader marks the catalog unavailable when Relay preload fails", async () => {
  const environment = createRelayEnvironment();
  const preloadError = new Error("missing operation");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedFetchRouteQuery.mockImplementation(() => {
    throw preloadError;
  });

  try {
    await expect(
      browseLoader(buildBrowseLoaderArgs({ environment }))
    ).resolves.toEqual({ status: "error" });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to preload browse products route query.", {
      error: preloadError
    });
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("browse loader disposes the product query when metadata preload fails", async () => {
  const environment = createRelayEnvironment();
  const preloadError = new Error("metadata preload failed");
  const disposeProductRouteQuery = vi.fn();
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedFetchRouteQuery
    .mockResolvedValueOnce(fetchedRouteQueryResult(browseQueryDescriptor, disposeProductRouteQuery))
    .mockRejectedValueOnce(preloadError);

  try {
    await expect(
      browseLoader(buildBrowseLoaderArgs({ environment }))
    ).resolves.toEqual({ status: "error" });

    expect(disposeProductRouteQuery).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to preload browse products route query.", {
      error: preloadError
    });
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("browse loader disposes the metadata query when product preload fails", async () => {
  const environment = createRelayEnvironment();
  const preloadError = new Error("product preload failed");
  const disposeMetadataRouteQuery = vi.fn();
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedFetchRouteQuery
    .mockRejectedValueOnce(preloadError)
    .mockResolvedValueOnce(
      fetchedRouteQueryResult(filterMetadataQueryDescriptor, disposeMetadataRouteQuery)
    );

  try {
    await expect(
      browseLoader(buildBrowseLoaderArgs({ environment }))
    ).resolves.toEqual({ status: "error" });

    expect(disposeMetadataRouteQuery).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to preload browse products route query.", {
      error: preloadError
    });
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("browse loader rethrows missing Relay router context configuration errors", async () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    await expect(
      browseLoader({
        ...buildBrowseLoaderArgs(),
        context: new RouterContextProvider()
      })
    ).rejects.toThrow("Relay environment is missing from the route loader context");

    expect(mockedFetchRouteQuery).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("browse loader rethrows aborted route preloads", async () => {
  const environment = createRelayEnvironment();
  const abortError = new DOMException("The operation was aborted.", "AbortError");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedFetchRouteQuery.mockRejectedValue(abortError);

  try {
    await expect(
      browseLoader(buildBrowseLoaderArgs({ environment }))
    ).rejects.toBe(abortError);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("browse route query keeps URL-driven pages as separate store entries", () => {
  const artifact = getBrowseProductsRouteQueryArtifact();

  expect(artifact.params?.text).toContain("after: $after");
  expect(artifact.params?.text).toContain("pageInfo");
  expect(artifact.params?.text).toContain("hasNextPage");
  expect(artifact.params?.text).toContain("endCursor");
  expect(artifact.params?.text).not.toContain("__BrowseProductsRouteQuery_products_connection");
  expect(artifact.params?.metadata?.connection).toBeUndefined();
});

test("Relay store reads each URL-driven browse page without previous page edges", () => {
  const environment = createRelayEnvironment();
  const firstPageOperation = createOperationDescriptor(browseProductsRouteQueryArtifact, {
    first: 12
  });
  const secondPageOperation = createOperationDescriptor(browseProductsRouteQueryArtifact, {
    first: 12,
    after: "cursor-page-1"
  });

  environment.commitPayload(firstPageOperation, {
    products: buildBrowseProductsConnection({
      endCursor: "cursor-page-1",
      hasNextPage: true,
      products: [
        {
          id: "product-page-1",
          name: "Page One Product",
          slug: "page-one-product"
        }
      ]
    })
  });
  environment.commitPayload(secondPageOperation, {
    products: buildBrowseProductsConnection({
      endCursor: "cursor-page-2",
      hasNextPage: false,
      products: [
        {
          id: "product-page-2",
          name: "Page Two Product",
          slug: "page-two-product"
        }
      ]
    })
  });

  const pageTwoSnapshot = environment.lookup(secondPageOperation.fragment);
  const pageTwoProductIds = (
    pageTwoSnapshot.data as BrowseProductsRouteQuery["response"]
  ).products.edges.map(({ node }) => node.id);

  expect(pageTwoProductIds).toEqual(["product-page-2"]);
});

test("renders browse products from the Relay route query", () => {
  const queryRef = { dispose: vi.fn(), variables: { first: 12 } };

  mockBrowseRouteRelayData({
    productQueryRef: queryRef,
    productData: {
      products: {
        edges: [
          {
            cursor: "cursor-1",
            node: {
              id: "product-1",
              name: "Catalog First",
              slug: "catalog-first",
              brand: {
                id: "brand-1",
                name: "Acme"
              }
            }
          },
          {
            cursor: "cursor-2",
            node: {
              id: "product-2",
              name: "Catalog Second",
              slug: "catalog-second",
              brand: {
                id: "brand-2",
                name: "Globex"
              }
            }
          }
        ],
        pageInfo: {
          hasNextPage: true,
          endCursor: "cursor-next-page"
        }
      }
    }
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Browse products" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Products per page" })).toHaveValue("12");
  expect(screen.getByRole("link", { name: "View details for Catalog First" })).toHaveAttribute(
    "href",
    "/products/catalog-first"
  );
  expect(screen.getByRole("link", { name: "Compare Catalog First" })).toHaveAttribute(
    "href",
    "/compare?slug=catalog-first"
  );
  expect(screen.getByRole("link", { name: "View offers for Catalog First" })).toHaveAttribute(
    "href",
    "/offers?productId=product-1"
  );
  expect(screen.getByRole("link", { name: "Compare Catalog Second" })).toHaveAttribute(
    "href",
    "/compare?slug=catalog-second"
  );
  expect(screen.getByRole("link", { name: "View offers for Catalog Second" })).toHaveAttribute(
    "href",
    "/offers?productId=product-2"
  );
  expect(screen.getByText("Catalog Second")).toBeInTheDocument();
  expect(screen.getByText("catalog-first")).toBeInTheDocument();
  expect(screen.getByText("Acme")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(expect.anything(), browseQueryDescriptor);
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(expect.anything(), queryRef);
});

test("renders metadata-backed catalog filter controls", () => {
  renderBrowseRouteWithRelayData();

  const filterForm = screen.getByRole("form", { name: "Filter products" });

  expect(within(filterForm).getByRole("combobox", { name: "Product type" })).toHaveValue("");
  expect(within(filterForm).getByRole("checkbox", { name: "Include subcategories" })).not.toBeChecked();
  expect(within(filterForm).getByRole("checkbox", { name: "Include subcategories" })).toBeDisabled();
  expect(within(filterForm).getByRole("checkbox", { name: "Gaming (4)" })).not.toBeChecked();
  expect(within(filterForm).getByLabelText("Refresh Rate minimum")).toHaveValue("");
  expect(within(filterForm).getByLabelText("Refresh Rate maximum")).toHaveValue("");
  expect(within(filterForm).getByRole("combobox", { name: "Wireless" })).toHaveValue("");
  expect(within(filterForm).getByRole("radio", { name: "Red (2)" })).not.toBeChecked();
  expect(within(filterForm).getByRole("button", { name: "Apply filters" })).toBeInTheDocument();
});

test("renders selected catalog filters with an active summary and clear link", () => {
  renderBrowseRouteWithRelayData({
    loaderData: readyBrowseLoaderData({
      filters: {
        typeTaxonId: "type-laptops",
        includeTypeDescendants: true,
        useCaseTaxonIds: ["use-gaming"],
        numeric: [
          {
            attributeId: "attr-refresh",
            min: "120",
            max: "240"
          }
        ],
        booleans: [
          {
            attributeId: "attr-wireless",
            value: true
          }
        ],
        enums: [
          {
            attributeId: "attr-color",
            enumOptionId: "enum-red"
          }
        ]
      },
      pageSize: 24,
      query: browseQueryDescriptorFromVariables({
        first: 24,
        filters: {
          primaryTypeTaxonId: "type-laptops",
          includeTypeDescendants: true,
          useCaseTaxonIds: ["use-gaming"],
          numeric: [
            {
              attributeId: "attr-refresh",
              min: "120",
              max: "240"
            }
          ],
          booleans: [
            {
              attributeId: "attr-wireless",
              value: true
            }
          ],
          enums: [
            {
              attributeId: "attr-color",
              enumOptionId: "enum-red"
            }
          ]
        }
      }),
      metadataQuery: filterMetadataQueryDescriptorFromVariables({
        filters: {
          primaryTypeTaxonId: "type-laptops",
          includeTypeDescendants: true,
          useCaseTaxonIds: ["use-gaming"],
          numeric: [
            {
              attributeId: "attr-refresh",
              min: "120",
              max: "240"
            }
          ],
          booleans: [
            {
              attributeId: "attr-wireless",
              value: true
            }
          ],
          enums: [
            {
              attributeId: "attr-color",
              enumOptionId: "enum-red"
            }
          ]
        }
      })
    }),
    metadataData: buildProductFilterMetadataResponse({ selected: true })
  });

  const filterForm = screen.getByRole("form", { name: "Filter products" });

  expect(within(filterForm).getByRole("combobox", { name: "Product type" })).toHaveValue(
    "type-laptops"
  );
  expect(within(filterForm).getByRole("checkbox", { name: "Include subcategories" })).toBeChecked();
  expect(
    within(filterForm).getByRole("checkbox", { name: "Include subcategories" })
  ).not.toBeDisabled();
  expect(within(filterForm).getByRole("checkbox", { name: "Gaming (4)" })).toBeChecked();
  expect(within(filterForm).getByLabelText("Refresh Rate minimum")).toHaveValue("120");
  expect(within(filterForm).getByLabelText("Refresh Rate maximum")).toHaveValue("240");
  expect(within(filterForm).getByRole("combobox", { name: "Wireless" })).toHaveValue("true");
  expect(within(filterForm).getByRole("radio", { name: "Red (2)" })).toBeChecked();

  const summary = screen.getByRole("list", { name: "Active filters" });

  expect(within(summary).getByText("Type: Laptops and descendants")).toBeInTheDocument();
  expect(within(summary).getByText("Use case: Gaming")).toBeInTheDocument();
  expect(within(summary).getByText("Refresh Rate: 120 Hz to 240 Hz")).toBeInTheDocument();
  expect(within(summary).getByText("Wireless: Yes")).toBeInTheDocument();
  expect(within(summary).getByText("Color: Red")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
    "href",
    "/products?first=24"
  );
});

test("clears the descendant filter from submitted data when the product type is cleared", () => {
  renderBrowseRouteWithRelayData({
    loaderData: readyBrowseLoaderData({
      filters: {
        typeTaxonId: "type-laptops",
        includeTypeDescendants: true,
        useCaseTaxonIds: [],
        numeric: [],
        booleans: [],
        enums: []
      }
    }),
    metadataData: buildProductFilterMetadataResponse({ selected: true })
  });

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;
  const productTypeSelect = within(filterForm).getByRole("combobox", {
    name: "Product type"
  });
  const includeDescendantsCheckbox = within(filterForm).getByRole("checkbox", {
    name: "Include subcategories"
  });

  expect(productTypeSelect).toHaveValue("type-laptops");
  expect(includeDescendantsCheckbox).toBeChecked();
  expect(includeDescendantsCheckbox).not.toBeDisabled();

  fireEvent.change(productTypeSelect, { target: { value: "" } });

  expect(productTypeSelect).toHaveValue("");
  expect(includeDescendantsCheckbox).not.toBeChecked();
  expect(includeDescendantsCheckbox).toBeDisabled();
  expect(new FormData(filterForm).get("includeTypeDescendants")).toBeNull();
});

test("selects descendants by default when choosing a product type", () => {
  renderBrowseRouteWithRelayData();

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;
  const productTypeSelect = within(filterForm).getByRole("combobox", {
    name: "Product type"
  });
  const includeDescendantsCheckbox = within(filterForm).getByRole("checkbox", {
    name: "Include subcategories"
  });

  expect(productTypeSelect).toHaveValue("");
  expect(includeDescendantsCheckbox).not.toBeChecked();
  expect(includeDescendantsCheckbox).toBeDisabled();

  fireEvent.change(productTypeSelect, { target: { value: "type-laptops" } });

  expect(productTypeSelect).toHaveValue("type-laptops");
  expect(includeDescendantsCheckbox).toBeChecked();
  expect(includeDescendantsCheckbox).not.toBeDisabled();
  expect(new FormData(filterForm).get("includeTypeDescendants")).toBe("1");

  fireEvent.click(includeDescendantsCheckbox);

  expect(includeDescendantsCheckbox).not.toBeChecked();
  expect(new FormData(filterForm).get("includeTypeDescendants")).toBeNull();
});

test("refreshes filter controls when loader filters clear on the same browse route", () => {
  const activeFilters = {
    typeTaxonId: "type-laptops",
    includeTypeDescendants: true,
    useCaseTaxonIds: ["use-gaming"],
    numeric: [
      {
        attributeId: "attr-refresh",
        min: "120",
        max: "240"
      }
    ],
    booleans: [
      {
        attributeId: "attr-wireless",
        value: true
      }
    ],
    enums: [
      {
        attributeId: "attr-color",
        enumOptionId: "enum-red"
      }
    ]
  };
  const productFiltersInput = {
    primaryTypeTaxonId: "type-laptops",
    includeTypeDescendants: true,
    useCaseTaxonIds: ["use-gaming"],
    numeric: [
      {
        attributeId: "attr-refresh",
        min: "120",
        max: "240"
      }
    ],
    booleans: [
      {
        attributeId: "attr-wireless",
        value: true
      }
    ],
    enums: [
      {
        attributeId: "attr-color",
        enumOptionId: "enum-red"
      }
    ]
  };
  const activeLoaderData = readyBrowseLoaderData({
    filters: activeFilters,
    pageSize: 24,
    query: browseQueryDescriptorFromVariables({
      first: 24,
      filters: productFiltersInput
    }),
    metadataQuery: filterMetadataQueryDescriptorFromVariables({
      filters: productFiltersInput
    })
  });
  const clearedLoaderData = readyBrowseLoaderData({
    filters: emptyCatalogFilters,
    pageSize: 24,
    query: browseQueryDescriptorFromVariables({
      first: 24
    }),
    metadataQuery: filterMetadataQueryDescriptorFromVariables()
  });

  mockedUseLoaderData
    .mockReturnValueOnce(activeLoaderData)
    .mockReturnValueOnce(clearedLoaderData);
  mockedUseRoutePreloadedQuery
    .mockReturnValueOnce({
      dispose: vi.fn(),
      variables: activeLoaderData.query.__relayQuery.variables
    })
    .mockReturnValueOnce({
      dispose: vi.fn(),
      variables: activeLoaderData.metadataQuery.__relayQuery.variables
    })
    .mockReturnValueOnce({
      dispose: vi.fn(),
      variables: clearedLoaderData.query.__relayQuery.variables
    })
    .mockReturnValueOnce({
      dispose: vi.fn(),
      variables: clearedLoaderData.metadataQuery.__relayQuery.variables
    });
  mockedUsePreloadedQuery
    .mockReturnValueOnce(buildBrowseProductsResponse())
    .mockReturnValueOnce(buildProductFilterMetadataResponse({ selected: true }))
    .mockReturnValueOnce(buildBrowseProductsResponse())
    .mockReturnValueOnce(buildProductFilterMetadataResponse());

  const view = render(
    <MemoryRouter initialEntries={["/products?first=24&typeTaxonId=type-laptops"]}>
      <BrowseRoute />
    </MemoryRouter>
  );

  const activeFilterForm = screen.getByRole("form", { name: "Filter products" });

  expect(within(activeFilterForm).getByRole("combobox", { name: "Product type" })).toHaveValue(
    "type-laptops"
  );
  expect(
    within(activeFilterForm).getByRole("checkbox", { name: "Include subcategories" })
  ).toBeChecked();
  expect(within(activeFilterForm).getByRole("checkbox", { name: "Gaming (4)" })).toBeChecked();
  expect(within(activeFilterForm).getByLabelText("Refresh Rate minimum")).toHaveValue("120");
  expect(within(activeFilterForm).getByLabelText("Refresh Rate maximum")).toHaveValue("240");
  expect(within(activeFilterForm).getByRole("combobox", { name: "Wireless" })).toHaveValue("true");
  expect(within(activeFilterForm).getByRole("radio", { name: "Red (2)" })).toBeChecked();

  view.rerender(
    <MemoryRouter initialEntries={["/products?first=24"]}>
      <BrowseRoute />
    </MemoryRouter>
  );

  const clearedFilterForm = screen.getByRole("form", { name: "Filter products" });

  expect(within(clearedFilterForm).getByRole("combobox", { name: "Product type" })).toHaveValue(
    ""
  );
  expect(
    within(clearedFilterForm).getByRole("checkbox", { name: "Include subcategories" })
  ).not.toBeChecked();
  expect(
    within(clearedFilterForm).getByRole("checkbox", { name: "Include subcategories" })
  ).toBeDisabled();
  expect(
    within(clearedFilterForm).getByRole("checkbox", { name: "Gaming (4)" })
  ).not.toBeChecked();
  expect(within(clearedFilterForm).getByLabelText("Refresh Rate minimum")).toHaveValue("");
  expect(within(clearedFilterForm).getByLabelText("Refresh Rate maximum")).toHaveValue("");
  expect(within(clearedFilterForm).getByRole("combobox", { name: "Wireless" })).toHaveValue("");
  expect(within(clearedFilterForm).getByRole("radio", { name: "Red (2)" })).not.toBeChecked();
});

test("submits only one selected enum option per enum facet", () => {
  renderBrowseRouteWithRelayData();

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;
  const colorGroup = within(filterForm).getByRole("group", { name: "Color" });
  const redOption = within(colorGroup).getByRole("radio", { name: "Red (2)" });
  const blueOption = within(colorGroup).getByRole("radio", { name: "Blue (1)" });

  fireEvent.click(redOption);
  fireEvent.click(blueOption);

  expect(redOption).not.toBeChecked();
  expect(blueOption).toBeChecked();
  expect(new FormData(filterForm).getAll("enum.attr-color")).toEqual(["enum-blue"]);
});

test("serializes only one enum option per enum attribute in browse paths", () => {
  expect(
    catalogBrowseNextPagePath(
      {
        useCaseTaxonIds: [],
        numeric: [],
        booleans: [],
        enums: [
          {
            attributeId: "attr-color",
            enumOptionId: "enum-red"
          },
          {
            attributeId: "attr-size",
            enumOptionId: "enum-large"
          },
          {
            attributeId: "attr-color",
            enumOptionId: "enum-blue"
          }
        ]
      },
      24,
      "cursor-next-page"
    )
  ).toBe(
    "/products?first=24&enum.attr-color=enum-blue&enum.attr-size=enum-large&after=cursor-next-page"
  );
});

test("preserves active filters in pagination links and omits stale cursors from the filter form", () => {
  const activeFilters = {
    typeTaxonId: "type-laptops",
    includeTypeDescendants: true,
    useCaseTaxonIds: ["use-gaming"],
    numeric: [
      {
        attributeId: "attr-refresh",
        min: "120",
        max: "240"
      }
    ],
    booleans: [
      {
        attributeId: "attr-wireless",
        value: true
      }
    ],
    enums: [
      {
        attributeId: "attr-color",
        enumOptionId: "enum-red"
      }
    ]
  };
  const productFiltersInput = {
    primaryTypeTaxonId: "type-laptops",
    includeTypeDescendants: true,
    useCaseTaxonIds: ["use-gaming"],
    numeric: [
      {
        attributeId: "attr-refresh",
        min: "120",
        max: "240"
      }
    ],
    booleans: [
      {
        attributeId: "attr-wireless",
        value: true
      }
    ],
    enums: [
      {
        attributeId: "attr-color",
        enumOptionId: "enum-red"
      }
    ]
  };

  renderBrowseRouteWithRelayData({
    initialEntries: [
      "/products?first=24&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-gaming&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red&after=cursor-current-page"
    ],
    loaderData: readyBrowseLoaderData({
      filters: activeFilters,
      pageSize: 24,
      query: browseQueryDescriptorFromVariables({
        first: 24,
        after: "cursor-current-page",
        filters: productFiltersInput
      }),
      metadataQuery: filterMetadataQueryDescriptorFromVariables({
        filters: productFiltersInput
      })
    }),
    metadataData: buildProductFilterMetadataResponse({ selected: true }),
    productData: buildBrowseProductsResponse({
      endCursor: "cursor-next-page",
      hasNextPage: true,
      products: [
        {
          id: "product-page-2",
          name: "Page Two Product",
          slug: "page-two-product"
        }
      ]
    })
  });

  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=24&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-gaming&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red&after=cursor-next-page"
  );
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=24&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-gaming&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red"
  );
  expect(
    screen.getByRole("form", { name: "Filter products" }).querySelector('[name="after"]')
  ).not.toBeInTheDocument();
});

test("renders decision actions for each browse product card", () => {
  mockBrowseRouteRelayData({
    productData: buildBrowseProductsResponse({
      products: [
        {
          id: "product-1",
          name: "Catalog First",
          slug: "catalog-first"
        },
        {
          id: "product-2",
          name: "Catalog Second",
          slug: "catalog-second"
        }
      ],
      hasNextPage: false
    })
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  const firstProductCard = screen.getByRole("article", { name: "Catalog First" });
  const firstProductActions = within(firstProductCard).getByRole("list", {
    name: "Decision actions for Catalog First"
  });

  expect(
    within(firstProductActions).getByRole("link", { name: "View details for Catalog First" })
  ).toHaveAttribute("href", "/products/catalog-first");
  expect(
    within(firstProductActions).getByRole("link", { name: "Compare Catalog First" })
  ).toHaveAttribute("href", "/compare?slug=catalog-first");
  expect(
    within(firstProductActions).getByRole("link", { name: "View offers for Catalog First" })
  ).toHaveAttribute("href", "/offers?productId=product-1");

  const secondProductCard = screen.getByRole("article", { name: "Catalog Second" });
  const secondProductActions = within(secondProductCard).getByRole("list", {
    name: "Decision actions for Catalog Second"
  });

  expect(
    within(secondProductActions).getByRole("link", { name: "View details for Catalog Second" })
  ).toHaveAttribute("href", "/products/catalog-second");
  expect(
    within(secondProductActions).getByRole("link", { name: "Compare Catalog Second" })
  ).toHaveAttribute("href", "/compare?slug=catalog-second");
  expect(
    within(secondProductActions).getByRole("link", { name: "View offers for Catalog Second" })
  ).toHaveAttribute("href", "/offers?productId=product-2");
});

test("encodes reserved characters in browse product decision links", () => {
  mockBrowseRouteRelayData({
    productData: buildBrowseProductsResponse({
      products: [
        {
          id: "product/reserved?id=1",
          name: "Reserved Product",
          slug: "reserved/product?variant=1"
        }
      ],
      hasNextPage: false
    })
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  const productActions = within(screen.getByRole("article", { name: "Reserved Product" })).getByRole(
    "list",
    {
      name: "Decision actions for Reserved Product"
    }
  );

  expect(
    within(productActions).getByRole("link", { name: "View details for Reserved Product" })
  ).toHaveAttribute("href", "/products/reserved%2Fproduct%3Fvariant%3D1");
  expect(
    within(productActions).getByRole("link", { name: "Compare Reserved Product" })
  ).toHaveAttribute("href", "/compare?slug=reserved%2Fproduct%3Fvariant%3D1");
  expect(
    within(productActions).getByRole("link", { name: "View offers for Reserved Product" })
  ).toHaveAttribute("href", "/offers?productId=product%2Freserved%3Fid%3D1");
});

test("keeps browse product cards named when slugs contain spaces", () => {
  mockBrowseRouteRelayData({
    productData: buildBrowseProductsResponse({
      products: [
        {
          id: "product-spaced",
          name: "Spaced Product",
          slug: "spaced product"
        }
      ],
      hasNextPage: false
    })
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  const productCard = screen.getByRole("article", { name: "Spaced Product" });
  const productActions = within(productCard).getByRole("list", {
    name: "Decision actions for Spaced Product"
  });

  expect(
    within(productActions).getByRole("link", { name: "View details for Spaced Product" })
  ).toHaveAttribute("href", "/products/spaced%20product");
  expect(
    within(productActions).getByRole("link", { name: "Compare Spaced Product" })
  ).toHaveAttribute("href", "/compare?slug=spaced%20product");
  expect(
    within(productActions).getByRole("link", { name: "View offers for Spaced Product" })
  ).toHaveAttribute("href", "/offers?productId=product-spaced");
});

test("renders selected page size and preserves first in pagination links", () => {
  const cursorDescriptor = {
    __relayQuery: {
      ...browseQueryDescriptor.__relayQuery,
      variables: { first: 24, after: "cursor-current-page" }
    }
  };
  const queryRef = { dispose: vi.fn(), variables: { first: 24, after: "cursor-current-page" } };

  mockBrowseRouteRelayData({
    loaderData: readyBrowseLoaderData({
      pageSize: 24,
      query: cursorDescriptor
    }),
    productQueryRef: queryRef,
    productData: buildBrowseProductsResponse({
      endCursor: "cursor-next-page",
      hasNextPage: true,
      products: [
        {
          id: "product-page-2",
          name: "Page Two Product",
          slug: "page-two-product"
        }
      ]
    })
  });

  render(
    <MemoryRouter initialEntries={["/products?after=cursor-current-page&first=24"]}>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("combobox", { name: "Products per page" })).toHaveValue("24");
  expect(
    within(screen.getByRole("article", { name: "Page Two Product" })).getByRole("list", {
      name: "Decision actions for Page Two Product"
    })
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=24&after=cursor-next-page"
  );
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=24"
  );
});

test("renders next and first-page pagination links from the browse query", () => {
  const cursorDescriptor = {
    __relayQuery: {
      ...browseQueryDescriptor.__relayQuery,
      variables: { first: 12, after: "cursor-current-page" }
    }
  };
  const queryRef = { dispose: vi.fn(), variables: { first: 12, after: "cursor-current-page" } };

  mockBrowseRouteRelayData({
    loaderData: readyBrowseLoaderData({
      query: cursorDescriptor
    }),
    productQueryRef: queryRef,
    productData: buildBrowseProductsResponse({
      endCursor: "cursor-next-page",
      hasNextPage: true,
      products: [
        {
          id: "product-page-2",
          name: "Page Two Product",
          slug: "page-two-product"
        }
      ]
    })
  });

  render(
    <MemoryRouter initialEntries={["/products?after=cursor-current-page"]}>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "View details for Page Two Product" })).toHaveAttribute(
    "href",
    "/products/page-two-product"
  );
  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=12&after=cursor-next-page"
  );
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=12"
  );
});

test("omits browse pagination links on the first page when there is no next page", () => {
  mockBrowseRouteRelayData({
    productData: buildBrowseProductsResponse({
      hasNextPage: false,
      products: [
        {
          id: "product-final-page",
          name: "Final Page Product",
          slug: "final-page-product"
        }
      ]
    })
  });

  render(
    <MemoryRouter initialEntries={["/products"]}>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "View details for Final Page Product" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Next products" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "First products" })).not.toBeInTheDocument();
});

test("renders a local loading state while the Relay route query suspends", () => {
  const queryRef = { dispose: vi.fn(), variables: { first: 12 } };

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw Promise.race([]);
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("status")).toHaveTextContent("Loading catalog...");
});

test("renders a local unavailable state when the Relay route query errors", () => {
  const queryRef = { dispose: vi.fn(), variables: { first: 12 } };
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw new Error("Relay read failed");
  });

  try {
    render(
      <MemoryRouter>
        <BrowseRoute />
      </MemoryRouter>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Catalog unavailable.");
    expect(screen.getByText("Please refresh the page or try again later.")).toBeInTheDocument();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("renders a local unavailable state when filter metadata is missing", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    renderBrowseRouteWithRelayData({
      metadataData: {
        productFilterMetadata: null
      } as unknown as ReturnType<typeof buildProductFilterMetadataResponse>
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Catalog unavailable.");
    expect(screen.getByText("Please refresh the page or try again later.")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Filter products" })).not.toBeInTheDocument();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("resets the local unavailable state when fresh loader data arrives", async () => {
  const failedQueryRef = { dispose: vi.fn(), variables: { first: 12 } };
  const recoveredQueryRef = { dispose: vi.fn(), variables: { first: 12 } };
  const retryDescriptor = {
    __relayQuery: {
      ...browseQueryDescriptor.__relayQuery,
      variables: { ...browseQueryDescriptor.__relayQuery.variables }
    }
  };
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(failedQueryRef);
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw new Error("Relay read failed");
  });

  try {
    const view = render(
      <MemoryRouter>
        <BrowseRoute />
      </MemoryRouter>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Catalog unavailable.");

    mockedUseLoaderData.mockReturnValue(readyBrowseLoaderData({ query: retryDescriptor }));
    mockedUseRoutePreloadedQuery
      .mockReturnValueOnce(recoveredQueryRef)
      .mockReturnValueOnce({
        dispose: vi.fn(),
        variables: filterMetadataQueryDescriptor.__relayQuery.variables
      });
    mockedUsePreloadedQuery
      .mockReturnValueOnce({
        products: {
          edges: [
            {
              cursor: "cursor-recovered",
              node: {
                id: "product-recovered",
                name: "Recovered Product",
                slug: "recovered-product",
                brand: {
                  id: "brand-recovered",
                  name: "Recovered Brand"
                }
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        }
      })
      .mockReturnValueOnce(buildProductFilterMetadataResponse());

    view.rerender(
      <MemoryRouter>
        <BrowseRoute />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByRole("link", { name: "View details for Recovered Product" })).toHaveAttribute(
      "href",
      "/products/recovered-product"
    );
    expect(screen.getByRole("link", { name: "Compare Recovered Product" })).toHaveAttribute(
      "href",
      "/compare?slug=recovered-product"
    );
    expect(screen.getByRole("link", { name: "View offers for Recovered Product" })).toHaveAttribute(
      "href",
      "/offers?productId=product-recovered"
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("renders an empty-state message when the Relay query returns no products", () => {
  mockBrowseRouteRelayData({
    productData: {
      products: {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    }
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByText("No products available yet.")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Next products" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "First products" })).not.toBeInTheDocument();
});

test("renders a filtered empty-state message when active filters have no matches", () => {
  renderBrowseRouteWithRelayData({
    loaderData: readyBrowseLoaderData({
      filters: {
        typeTaxonId: "type-laptops",
        includeTypeDescendants: true,
        useCaseTaxonIds: [],
        numeric: [],
        booleans: [],
        enums: []
      },
      query: browseQueryDescriptorFromVariables({
        first: 12,
        filters: {
          primaryTypeTaxonId: "type-laptops",
          includeTypeDescendants: true
        }
      }),
      metadataQuery: filterMetadataQueryDescriptorFromVariables({
        filters: {
          primaryTypeTaxonId: "type-laptops",
          includeTypeDescendants: true
        }
      })
    }),
    metadataData: buildProductFilterMetadataResponse({
      resultCount: 0,
      selected: true
    }),
    productData: buildBrowseProductsResponse()
  });

  expect(screen.getByText("No products match these filters.")).toBeInTheDocument();
  expect(screen.queryByText("No products available yet.")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
    "href",
    "/products?first=12"
  );
});

test("renders the recoverable empty-state message when a cursor page is empty but filters still match products", () => {
  const activeFilters = {
    typeTaxonId: "type-laptops",
    includeTypeDescendants: true,
    useCaseTaxonIds: [],
    numeric: [],
    booleans: [],
    enums: []
  };
  const productFiltersInput = {
    primaryTypeTaxonId: "type-laptops",
    includeTypeDescendants: true
  };

  renderBrowseRouteWithRelayData({
    initialEntries: ["/products?typeTaxonId=type-laptops&includeTypeDescendants=1&after=stale-cursor"],
    loaderData: readyBrowseLoaderData({
      filters: activeFilters,
      query: browseQueryDescriptorFromVariables({
        first: 12,
        after: "stale-cursor",
        filters: productFiltersInput
      }),
      metadataQuery: filterMetadataQueryDescriptorFromVariables({
        filters: productFiltersInput
      })
    }),
    metadataData: buildProductFilterMetadataResponse({
      resultCount: 3,
      selected: true
    }),
    productData: buildBrowseProductsResponse()
  });

  expect(screen.getByText("No products available yet.")).toBeInTheDocument();
  expect(screen.queryByText("No products match these filters.")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=12&typeTaxonId=type-laptops&includeTypeDescendants=1"
  );
});

test("keeps a next-page recovery link when an empty result has a next cursor", () => {
  mockBrowseRouteRelayData({
    productData: {
      products: {
        edges: [],
        pageInfo: {
          hasNextPage: true,
          endCursor: "cursor-without-products"
        }
      }
    }
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByText("No products available yet.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=12&after=cursor-without-products"
  );
  expect(screen.queryByRole("link", { name: "First products" })).not.toBeInTheDocument();
});

test("keeps a first-page recovery link when a cursor page returns no products", () => {
  const cursorDescriptor = {
    __relayQuery: {
      ...browseQueryDescriptor.__relayQuery,
      variables: { first: 12, after: "stale-cursor" }
    }
  };
  const queryRef = { dispose: vi.fn(), variables: { first: 12, after: "stale-cursor" } };

  mockBrowseRouteRelayData({
    loaderData: readyBrowseLoaderData({
      query: cursorDescriptor
    }),
    productQueryRef: queryRef,
    productData: {
      products: {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    }
  });

  render(
    <MemoryRouter initialEntries={["/products?after=stale-cursor"]}>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByText("No products available yet.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=12"
  );
  expect(screen.queryByRole("link", { name: "Next products" })).not.toBeInTheDocument();
});

test("renders an unavailable-state message when the preload path fails", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error"
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Catalog unavailable.");
  expect(screen.getByText("Please refresh the page or try again later.")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});
