import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router";
import { useFragment, usePreloadedQuery } from "react-relay";
import { createOperationDescriptor, type Variables } from "relay-runtime";
import { createRelayEnvironment } from "../../../src/relay/environment";
import browseProductsRouteQueryArtifact, {
  type BrowseRouteQuery,
} from "../../../src/__generated__/BrowseRouteQuery.graphql";
import {
  createRelayRouterContext,
  fetchRouteQuery,
  useRoutePreloadedQuery,
} from "../../../src/relay/route-preload";
import { MAX_COMPARE_PRODUCTS } from "../../../src/routes/compare/compare-route-data";
import { BrowseRoute, browseLoader } from "../../../src/routes/catalog/BrowseRoute";
import type { Route } from "../../../src/routes/catalog/+types/BrowseRoute";
import { CatalogAdvancedFilters } from "../../../src/routes/catalog/filters/CatalogAdvancedFilters";
import {
  BrowseProductList,
  type BrowseProductNode,
} from "../../../src/routes/catalog/results/BrowseProductList";
import {
  buildCatalogBrowsePaginationData,
  catalogBrowseNextPagePath,
} from "../../../src/routes/catalog/paths";
import { chooseSelectOption, openSelect } from "../../helpers/base-select";
import { mockPreloadedQuery } from "../../helpers/relay";

const {
  fetchRouteQueryMock,
  useFragmentMock,
  useLoaderDataMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock,
} = vi.hoisted(() => ({
  fetchRouteQueryMock: vi.fn(),
  useFragmentMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
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
const mockedUseFragment = vi.mocked(useFragment);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const browseQueryDescriptor = browseQueryDescriptorFromVariables();
const emptyCatalogFilters = {
  useCaseTaxonIds: [],
  numeric: [],
  booleans: [],
  enums: [],
};

test("catalog pagination rejects blank and repeated next cursors", () => {
  const base = {
    currentAfter: "same-cursor",
    filters: emptyCatalogFilters,
    first: 12,
    hasNextPage: true,
    selectedCompareSlugs: [],
  };

  expect(
    buildCatalogBrowsePaginationData({ ...base, endCursor: "same-cursor" }).nextHref,
  ).toBeNull();
  expect(buildCatalogBrowsePaginationData({ ...base, endCursor: "  " }).nextHref).toBeNull();
});
type MockRouteQueryRef = ReturnType<typeof mockPreloadedQuery<Variables>>;
type BrowseProductAttributeFixture = {
  code: string;
  displayName: string;
  valueText: string;
  sortOrder?: number | null;
  groupLabel?: string | null;
};
type BrowseProductFixture = {
  currentAttributes?: ReadonlyArray<BrowseProductAttributeFixture>;
  id: string;
  name: string;
  slug: string;
};

const buildBrowseLoaderArgs = ({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.com/products"),
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}): Route.LoaderArgs => ({
  request,
  params: {},
  context: createRelayRouterContext(environment),
  pattern: "/products",
  url: new URL(request.url),
});

function browseQueryDescriptorFromVariables(
  variables: BrowseRouteQuery["variables"] = { first: 12 },
) {
  return {
    __relayQuery: {
      cacheID: "BrowseRouteQuery-cache-id",
      operationName: "BrowseRouteQuery",
      variables,
    },
  };
}

function filterMetadataQueryDescriptorFromVariables(
  variables: { filters?: BrowseRouteQuery["variables"]["filters"] } = {},
) {
  return {
    __relayQuery: {
      cacheID: "ProductFilterMetadataQuery-cache-id",
      operationName: "ProductFilterMetadataQuery",
      variables,
    },
  };
}

function fetchedRouteQueryResult<TDescriptor>(descriptor: TDescriptor, dispose = vi.fn()) {
  return {
    data: {},
    descriptor,
    dispose,
  };
}

function mockSuccessfulBrowseLoaderFetches({
  productDescriptor = browseQueryDescriptor,
  metadataDescriptor: _metadataDescriptor,
}: {
  productDescriptor?: ReturnType<typeof browseQueryDescriptorFromVariables>;
  metadataDescriptor?: ReturnType<typeof filterMetadataQueryDescriptorFromVariables>;
} = {}) {
  mockedFetchRouteQuery.mockResolvedValueOnce(fetchedRouteQueryResult(productDescriptor));
}

function readyBrowseLoaderData({
  filters = emptyCatalogFilters,
  metadataQuery: _metadataQuery,
  pageSize = 12,
  query = browseQueryDescriptor,
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

function buildBrowseProductAttributes(
  attributes: ReadonlyArray<BrowseProductAttributeFixture> = [],
) {
  return attributes.map((attribute) => ({
    ...attribute,
    groupLabel: attribute.groupLabel ?? null,
    sortOrder: attribute.sortOrder ?? null,
  }));
}

function buildBrowseProductsConnection({
  endCursor,
  hasNextPage,
  products,
}: {
  endCursor: string | null;
  hasNextPage: boolean;
  products: Array<BrowseProductFixture>;
}) {
  return {
    edges: products.map((product, index) => ({
      cursor: `cursor-${index + 1}`,
      node: {
        ...product,
        __typename: "Product",
        brand: {
          id: `brand-${product.id}`,
          name: `Brand for ${product.name}`,
        },
        currentAttributes: buildBrowseProductAttributes(product.currentAttributes),
      },
    })),
    pageInfo: {
      hasNextPage,
      endCursor,
    },
  };
}

function buildBrowseProductsResponse({
  endCursor = null,
  hasNextPage = false,
  products = [],
}: {
  endCursor?: string | null;
  hasNextPage?: boolean;
  products?: Array<BrowseProductFixture>;
} = {}) {
  return {
    products: buildBrowseProductsConnection({
      endCursor,
      hasNextPage,
      products,
    }),
    ...buildProductFilterMetadataResponse({ resultCount: products.length }),
  };
}

function buildProductFilterMetadataResponse({
  resultCount = 1,
  selected = false,
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
          disabled: false,
        },
        {
          id: "type-tablets",
          label: "Tablets",
          count: 0,
          selected: false,
          disabled: true,
        },
      ],
      useCaseOptions: [
        {
          id: "use-gaming",
          label: "Gaming",
          count: 4,
          selected,
          disabled: false,
        },
        {
          id: "use-office",
          label: "Office",
          count: 3,
          selected: false,
          disabled: false,
        },
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
          selectedMax: selected ? "240" : null,
        },
      ],
      booleanFilters: [
        {
          attributeId: "attr-wireless",
          code: "wireless",
          displayName: "Wireless",
          trueCount: 5,
          falseCount: 2,
          selectedValue: selected ? true : null,
        },
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
              disabled: false,
            },
            {
              id: "enum-blue",
              label: "Blue",
              count: 1,
              selected: false,
              disabled: false,
            },
          ],
        },
      ],
    },
  };
}

function mockBrowseRouteRelayData({
  loaderData = readyBrowseLoaderData(),
  metadataData = buildProductFilterMetadataResponse(),
  productData = buildBrowseProductsResponse({
    products: [
      {
        id: "product-1",
        name: "Catalog First",
        slug: "catalog-first",
      },
    ],
  }),
  productQueryRef,
}: {
  loaderData?: ReturnType<typeof readyBrowseLoaderData>;
  metadataData?: ReturnType<typeof buildProductFilterMetadataResponse>;
  productData?: Record<string, unknown>;
  productQueryRef?: MockRouteQueryRef;
} = {}) {
  const resolvedProductQueryRef =
    productQueryRef ?? mockPreloadedQuery(loaderData.query.__relayQuery.variables);
  mockedUseLoaderData.mockReturnValue(loaderData);
  mockedUseRoutePreloadedQuery.mockReturnValueOnce(resolvedProductQueryRef);
  mockedUsePreloadedQuery.mockReturnValueOnce({ ...productData, ...metadataData } as never);

  return {
    productQueryRef: resolvedProductQueryRef,
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
        slug: "catalog-first",
      },
    ],
  }),
}: {
  initialEntries?: string[];
  loaderData?: ReturnType<typeof readyBrowseLoaderData>;
  metadataData?: ReturnType<typeof buildProductFilterMetadataResponse>;
  productData?: ReturnType<typeof buildBrowseProductsResponse>;
} = {}) {
  mockBrowseRouteRelayData({
    loaderData,
    metadataData,
    productData,
  });

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <BrowseRoute />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockedUseFragment.mockReset();
  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => fragmentRef as never);
  fetchRouteQueryMock.mockReset();
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
});

test("advanced catalog filters directly preserve field names and selected values", () => {
  const metadata = buildProductFilterMetadataResponse().productFilterMetadata;

  render(
    <form aria-label="Advanced catalog filters">
      <CatalogAdvancedFilters
        filters={{
          ...emptyCatalogFilters,
          useCaseTaxonIds: ["use-gaming"],
          numeric: [{ attributeId: "attr-refresh", min: "120", max: "240" }],
          booleans: [{ attributeId: "attr-wireless", value: true }],
          enums: [{ attributeId: "attr-color", enumOptionId: "enum-red" }],
        }}
        metadata={metadata}
      />
    </form>,
  );

  expect(screen.getByRole("group", { name: "Use cases" })).toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: "Gaming (4)" })).toBeChecked();
  expect(screen.getByLabelText("Refresh Rate minimum")).toHaveAttribute(
    "name",
    "numeric.attr-refresh.min",
  );
  expect(screen.getByLabelText("Refresh Rate minimum")).toHaveValue("120");
  expect(screen.getByLabelText("Refresh Rate maximum")).toHaveValue("240");
  expect(screen.getByRole("combobox", { name: "Wireless" })).toHaveValue("true");
  expect(screen.getByRole("radio", { name: "Red (2)" })).toBeChecked();
});

test("route-selected disabled use cases remain enabled and submitted", () => {
  const metadata = buildProductFilterMetadataResponse().productFilterMetadata;
  const metadataWithDisabledGaming = {
    ...metadata,
    useCaseOptions: metadata.useCaseOptions.map((option) =>
      option.id === "use-gaming" ? { ...option, disabled: true } : option,
    ),
  };

  render(
    <form aria-label="Advanced catalog filters">
      <CatalogAdvancedFilters
        filters={{
          ...emptyCatalogFilters,
          useCaseTaxonIds: ["use-gaming"],
        }}
        metadata={metadataWithDisabledGaming}
      />
    </form>,
  );

  const form = screen.getByRole("form", {
    name: "Advanced catalog filters",
  }) as HTMLFormElement;
  const gamingFilter = screen.getByRole("checkbox", { name: "Gaming (4)" });

  expect(gamingFilter).toBeChecked();
  expect(gamingFilter).toBeEnabled();
  expect(form.querySelector("#catalog-use-case-use-gaming")).toHaveAttribute(
    "name",
    "useCaseTaxonId",
  );
  expect(new FormData(form).getAll("useCaseTaxonId")).toEqual(["use-gaming"]);
});

test("browse loader preloads and returns the Relay browse route query", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products");

  mockSuccessfulBrowseLoaderFetches();

  await expect(browseLoader(buildBrowseLoaderArgs({ environment, request }))).resolves.toEqual(
    readyBrowseLoaderData(),
  );

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal },
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("browse loader defaults to a page size of 12 when first is omitted", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products");

  mockSuccessfulBrowseLoaderFetches();

  await expect(browseLoader(buildBrowseLoaderArgs({ environment, request }))).resolves.toEqual(
    readyBrowseLoaderData(),
  );

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal },
  );
});

test("browse loader preserves supported first values from the URL", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?after=cursor-next-page&first=24");
  const queryDescriptorWithCursorAndFirst = browseQueryDescriptorFromVariables({
    first: 24,
    after: "cursor-next-page",
  });

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: queryDescriptorWithCursorAndFirst,
  });

  await expect(browseLoader(buildBrowseLoaderArgs({ environment, request }))).resolves.toEqual(
    readyBrowseLoaderData({
      pageSize: 24,
      query: queryDescriptorWithCursorAndFirst,
    }),
  );

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 24, after: "cursor-next-page" },
    { signal: request.signal },
  );
});

test("browse loader drops oversized first values above 48", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?first=100");

  mockSuccessfulBrowseLoaderFetches();

  await expect(browseLoader(buildBrowseLoaderArgs({ environment, request }))).resolves.toEqual(
    readyBrowseLoaderData(),
  );

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal },
  );
});

test("browse loader drops first values that are not page-size options", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?first=35");

  mockSuccessfulBrowseLoaderFetches();

  await expect(browseLoader(buildBrowseLoaderArgs({ environment, request }))).resolves.toEqual(
    readyBrowseLoaderData(),
  );

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal },
  );
});

test("browse loader drops malformed first values", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?first=12abc");

  mockSuccessfulBrowseLoaderFetches();

  await expect(browseLoader(buildBrowseLoaderArgs({ environment, request }))).resolves.toEqual(
    readyBrowseLoaderData(),
  );

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal },
  );
});

test("browse loader forwards the requested pagination cursor", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?after=cursor-next-page");

  mockSuccessfulBrowseLoaderFetches();

  await expect(browseLoader(buildBrowseLoaderArgs({ environment, request }))).resolves.toEqual(
    readyBrowseLoaderData(),
  );

  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 12, after: "cursor-next-page" },
    { signal: request.signal },
  );
});

test("browse loader passes URL filters to the product and metadata queries", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/products?q=%20OLED%20&sort=BRAND_NAME_ASC&typeTaxonId=relay-type-taxons%2Fdisplay&includeTypeDescendants=1&useCaseTaxonId=relay-use-case-gaming&useCaseTaxonId=relay-use-case-office&numeric.relay-attribute-price.min=10.50&numeric.relay-attribute-price.max=99.99&numeric.relay-attribute-weight.max=4.5&boolean.relay-attribute-wireless=true&enum.relay-attribute-color=relay-enum-red&enum.relay-attribute-color=relay-enum-blue",
  );
  const expectedFilters = {
    query: "OLED",
    sort: "BRAND_NAME_ASC" as const,
    primaryTypeTaxonId: "relay-type-taxons/display",
    includeTypeDescendants: true,
    useCaseTaxonIds: ["relay-use-case-gaming", "relay-use-case-office"],
    numeric: [
      {
        attributeId: "relay-attribute-price",
        min: "10.50",
        max: "99.99",
      },
      {
        attributeId: "relay-attribute-weight",
        max: "4.5",
      },
    ],
    booleans: [
      {
        attributeId: "relay-attribute-wireless",
        value: true,
      },
    ],
    enums: [
      {
        attributeId: "relay-attribute-color",
        enumOptionId: "relay-enum-blue",
      },
    ],
  };

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: browseQueryDescriptorFromVariables({
      first: 12,
      filters: expectedFilters,
    }),
    metadataDescriptor: filterMetadataQueryDescriptorFromVariables({
      filters: expectedFilters,
    }),
  });

  await browseLoader(buildBrowseLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 12, filters: expectedFilters },
    { signal: request.signal },
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("browse loader bounds search text and drops unsupported sort values", async () => {
  const environment = createRelayEnvironment();
  const boundedQuery = "a".repeat(100);
  const request = new Request(
    `https://app.example.com/products?q=${"a".repeat(120)}&sort=POPULARITY`,
  );
  const expectedFilters = { query: boundedQuery, sort: "RELEVANCE" as const };

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: browseQueryDescriptorFromVariables({
      first: 12,
      filters: expectedFilters,
    }),
    metadataDescriptor: filterMetadataQueryDescriptorFromVariables({
      filters: expectedFilters,
    }),
  });

  await browseLoader(buildBrowseLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 12, filters: expectedFilters },
    { signal: request.signal },
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test.each<{
  expectedFilters?: BrowseRouteQuery["variables"]["filters"];
  search: string;
}>([
  {
    search: "?q=oled",
    expectedFilters: { query: "oled", sort: "RELEVANCE" },
  },
  {
    search: "?q=oled&sort=RELEVANCE",
    expectedFilters: { query: "oled", sort: "RELEVANCE" },
  },
  {
    search: "?q=oled&sort=ID_ASC",
    expectedFilters: { query: "oled", sort: "ID_ASC" },
  },
  {
    search: "?sort=RELEVANCE",
  },
  {
    search: "?q=oled&sort=UNKNOWN",
    expectedFilters: { query: "oled", sort: "RELEVANCE" },
  },
])("browse loader normalizes contextual sort from $search", async ({ expectedFilters, search }) => {
  const environment = createRelayEnvironment();
  const request = new Request(`https://app.example.com/products${search}`);
  const variables = {
    first: 12,
    ...(expectedFilters ? { filters: expectedFilters } : {}),
  };
  const queryDescriptor = browseQueryDescriptorFromVariables(variables);

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: queryDescriptor,
  });

  await expect(browseLoader(buildBrowseLoaderArgs({ environment, request }))).resolves.toEqual(
    readyBrowseLoaderData({
      filters: expectedFilters
        ? { ...emptyCatalogFilters, ...expectedFilters }
        : emptyCatalogFilters,
      query: queryDescriptor,
    }),
  );

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    variables,
    { signal: request.signal },
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("browse loader normalizes the default catalog sort from the URL", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products?sort=ID_ASC");

  mockSuccessfulBrowseLoaderFetches();

  await expect(browseLoader(buildBrowseLoaderArgs({ environment, request }))).resolves.toEqual(
    readyBrowseLoaderData(),
  );

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 12 },
    { signal: request.signal },
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("browse loader drops blank numeric bounds and malformed boolean filter values", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/products?typeTaxonId=&useCaseTaxonId=&numeric.relay-attribute-empty.min=&numeric.relay-attribute-empty.max=%20&numeric.relay-attribute-refresh.min=&numeric.relay-attribute-refresh.max=240&boolean.relay-attribute-touchscreen=yes&boolean.relay-attribute-backlit=false&enum.relay-attribute-panel=",
  );
  const expectedFilters = {
    numeric: [
      {
        attributeId: "relay-attribute-refresh",
        max: "240",
      },
    ],
    booleans: [
      {
        attributeId: "relay-attribute-backlit",
        value: false,
      },
    ],
  };

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: browseQueryDescriptorFromVariables({
      first: 12,
      filters: expectedFilters,
    }),
    metadataDescriptor: filterMetadataQueryDescriptorFromVariables({
      filters: expectedFilters,
    }),
  });

  await browseLoader(buildBrowseLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 12, filters: expectedFilters },
    { signal: request.signal },
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("browse loader drops malformed decimal numeric bounds", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/products?numeric.relay-attribute-price.min=10abc&numeric.relay-attribute-price.max=99.99&numeric.relay-attribute-weight.min=0x10&numeric.relay-attribute-refresh.min=120.5",
  );
  const expectedFilters = {
    numeric: [
      {
        attributeId: "relay-attribute-price",
        max: "99.99",
      },
      {
        attributeId: "relay-attribute-refresh",
        min: "120.5",
      },
    ],
  };

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: browseQueryDescriptorFromVariables({
      first: 12,
      filters: expectedFilters,
    }),
    metadataDescriptor: filterMetadataQueryDescriptorFromVariables({
      filters: expectedFilters,
    }),
  });

  await browseLoader(buildBrowseLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 12, filters: expectedFilters },
    { signal: request.signal },
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("browse loader keeps backend-accepted decimal numeric bound forms", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/products?numeric.relay-attribute-price.min=.5&numeric.relay-attribute-price.max=1e3&numeric.relay-attribute-weight.min=%2B1&numeric.relay-attribute-weight.max=1.&numeric.relay-attribute-latency.min=0001e2&numeric.relay-attribute-latency.max=200",
  );
  const expectedFilters = {
    numeric: [
      {
        attributeId: "relay-attribute-price",
        min: ".5",
        max: "1e3",
      },
      {
        attributeId: "relay-attribute-weight",
        min: "+1",
        max: "1.",
      },
      {
        attributeId: "relay-attribute-latency",
        min: "0001e2",
        max: "200",
      },
    ],
  };

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: browseQueryDescriptorFromVariables({
      first: 12,
      filters: expectedFilters,
    }),
    metadataDescriptor: filterMetadataQueryDescriptorFromVariables({
      filters: expectedFilters,
    }),
  });

  await browseLoader(buildBrowseLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 12, filters: expectedFilters },
    { signal: request.signal },
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("browse loader drops numeric ranges whose minimum is greater than their maximum", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/products?numeric.relay-attribute-price.min=100&numeric.relay-attribute-price.max=50&numeric.relay-attribute-refresh.min=120&numeric.relay-attribute-refresh.max=240",
  );
  const expectedFilters = {
    numeric: [
      {
        attributeId: "relay-attribute-refresh",
        min: "120",
        max: "240",
      },
    ],
  };

  mockSuccessfulBrowseLoaderFetches({
    productDescriptor: browseQueryDescriptorFromVariables({
      first: 12,
      filters: expectedFilters,
    }),
    metadataDescriptor: filterMetadataQueryDescriptorFromVariables({
      filters: expectedFilters,
    }),
  });

  await browseLoader(buildBrowseLoaderArgs({ environment, request }));

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 12, filters: expectedFilters },
    { signal: request.signal },
  );
  expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
});

test("browse loader marks the catalog unavailable when Relay preload fails", async () => {
  const environment = createRelayEnvironment();
  const preloadError = new Error("missing operation");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedFetchRouteQuery.mockImplementation(() => {
    throw preloadError;
  });

  try {
    await expect(browseLoader(buildBrowseLoaderArgs({ environment }))).resolves.toEqual({
      status: "error",
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to preload browse products route query.", {
      error: preloadError,
    });
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
    await expect(browseLoader(buildBrowseLoaderArgs({ environment }))).rejects.toBe(abortError);

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
  expect(artifact.params?.text).not.toContain("__BrowseRouteQuery_products_connection");
  expect(artifact.params?.metadata?.connection).toBeUndefined();
});

test("browse route query includes current specification teaser fields", () => {
  const artifact = getBrowseProductsRouteQueryArtifact();

  expect(artifact.params?.text).toContain("currentAttributes");
  expect(artifact.params?.text).toContain("code");
  expect(artifact.params?.text).toContain("displayName");
  expect(artifact.params?.text).toContain("valueText");
  expect(artifact.params?.text).toContain("sortOrder");
  expect(artifact.params?.text).not.toContain("groupLabel");
});

test("Relay store reads each URL-driven browse page without previous page edges", () => {
  const environment = createRelayEnvironment();
  const firstPageOperation = createOperationDescriptor(browseProductsRouteQueryArtifact, {
    first: 12,
  });
  const secondPageOperation = createOperationDescriptor(browseProductsRouteQueryArtifact, {
    first: 12,
    after: "cursor-page-1",
  });

  environment.commitPayload(firstPageOperation, {
    products: buildBrowseProductsConnection({
      endCursor: "cursor-page-1",
      hasNextPage: true,
      products: [
        {
          id: "product-page-1",
          name: "Page One Product",
          slug: "page-one-product",
        },
      ],
    }),
  });
  environment.commitPayload(secondPageOperation, {
    products: buildBrowseProductsConnection({
      endCursor: "cursor-page-2",
      hasNextPage: false,
      products: [
        {
          id: "product-page-2",
          name: "Page Two Product",
          slug: "page-two-product",
        },
      ],
    }),
  });

  const pageTwoSnapshot = environment.lookup(secondPageOperation.fragment);
  const pageTwoProducts = (pageTwoSnapshot.data as BrowseRouteQuery["response"]).products;

  if (!pageTwoProducts) {
    throw new Error("Expected products in the second page snapshot");
  }

  const pageTwoProductIds = pageTwoProducts.edges.map(({ node }) => node.id);

  expect(pageTwoProductIds).toEqual(["product-page-2"]);
});

test("catalog product presentation keeps highlights and route-derived actions", () => {
  const product = {
    id: "product-1",
    name: "Catalog First",
    slug: "catalog-first",
    brand: { id: "brand-1", name: "Acme" },
    currentAttributes: [
      { code: "battery", displayName: "Battery", sortOrder: 10, valueText: "12 hours" },
      { code: "screen", displayName: "Screen", sortOrder: 20, valueText: "15 inches" },
      { code: "weight", displayName: "Weight", sortOrder: 30, valueText: "3 lb" },
      { code: "wireless", displayName: "Wireless", sortOrder: 40, valueText: "Wi-Fi 6" },
    ],
  };

  render(
    <MemoryRouter>
      <BrowseProductList
        compareActionFor={() => ({ href: "/products?slug=catalog-first", kind: "add" })}
        detailHrefFor={() => "/products/catalog-first"}
        offerHrefFor={() => "/offers?productId=product-1"}
        products={{ edges: [{ node: product }] } as never}
      />
    </MemoryRouter>,
  );

  const card = screen.getByRole("article", { name: "Catalog First" });
  const highlights = within(card).getByRole("list", { name: "Specification highlights" });

  expect(within(highlights).getAllByRole("listitem")).toHaveLength(3);
  expect(
    within(card).getByRole("link", { name: "View details for Catalog First" }),
  ).toHaveAttribute("href", "/products/catalog-first");
  expect(within(card).getByRole("link", { name: "View offers for Catalog First" })).toHaveAttribute(
    "href",
    "/offers?productId=product-1",
  );
  expect(within(card).getByRole("link", { name: "Add Catalog First to compare" })).toHaveAttribute(
    "href",
    "/products?slug=catalog-first",
  );
});

test("catalog product presentation keeps brandless products alongside branded results", () => {
  const products = [
    {
      id: "product-brandless",
      name: "Brandless Product",
      slug: "brandless-product",
      brand: null,
      currentAttributes: [],
    },
    {
      id: "product-branded",
      name: "Branded Product",
      slug: "branded-product",
      brand: { id: "brand-1", name: "Acme" },
      currentAttributes: [],
    },
  ] as unknown as BrowseProductNode[];

  render(
    <MemoryRouter>
      <BrowseProductList
        compareActionFor={() => ({ href: "/products?slug=brandless-product", kind: "add" })}
        detailHrefFor={(product) => `/products/${product.slug}`}
        offerHrefFor={(product) => `/offers?productId=${product.id}`}
        products={{ edges: products.map((product) => ({ node: product })) } as never}
      />
    </MemoryRouter>,
  );

  expect(screen.getByRole("article", { name: "Brandless Product" })).toHaveTextContent(
    "Unknown brand",
  );
  expect(screen.getByRole("article", { name: "Branded Product" })).toHaveTextContent("Acme");
});

test("catalog product presentation renders selected and full compare states", () => {
  const product = {
    id: "product-1",
    name: "Catalog First",
    slug: "catalog-first",
    brand: { id: "brand-1", name: "Acme" },
    currentAttributes: [],
  };

  const { rerender } = render(
    <MemoryRouter>
      <BrowseProductList
        compareActionFor={() => ({ kind: "selected" })}
        detailHrefFor={() => "/products/catalog-first"}
        offerHrefFor={() => "/offers?productId=product-1"}
        products={{ edges: [{ node: product }] } as never}
      />
    </MemoryRouter>,
  );

  expect(screen.getByText("Catalog First selected for comparison")).toBeInTheDocument();

  rerender(
    <MemoryRouter>
      <BrowseProductList
        compareActionFor={() => ({ kind: "full" })}
        detailHrefFor={() => "/products/catalog-first"}
        offerHrefFor={() => "/offers?productId=product-1"}
        products={{ edges: [{ node: product }] } as never}
      />
    </MemoryRouter>,
  );

  expect(screen.getByText("Compare selection full")).toBeInTheDocument();
});

test("renders browse products from the Relay route query", () => {
  const queryRef = mockPreloadedQuery({ first: 12 });

  mockBrowseRouteRelayData({
    productQueryRef: queryRef,
    productData: {
      ...buildProductFilterMetadataResponse(),
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
                name: "Acme",
              },
              currentAttributes: [],
            },
          },
          {
            cursor: "cursor-2",
            node: {
              id: "product-2",
              name: "Catalog Second",
              slug: "catalog-second",
              brand: {
                id: "brand-2",
                name: "Globex",
              },
              currentAttributes: [],
            },
          },
        ],
        pageInfo: {
          hasNextPage: true,
          endCursor: "cursor-next-page",
        },
      },
    },
  });

  render(
    <MemoryRouter initialEntries={["/products"]}>
      <BrowseRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Browse products" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Browse products" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Catalog results" })).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Catalog controls" })).toBeInTheDocument();
  expect(screen.getByRole("list", { name: "Products" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Advanced filters" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(screen.getByRole("combobox", { name: "Products per page" })).toHaveValue("12");
  expect(screen.getByRole("link", { name: "View details for Catalog First" })).toHaveAttribute(
    "href",
    "/products/catalog-first",
  );
  expect(screen.getByRole("link", { name: "Add Catalog First to compare" })).toHaveAttribute(
    "href",
    "/products?slug=catalog-first",
  );
  expect(screen.getByRole("link", { name: "View offers for Catalog First" })).toHaveAttribute(
    "href",
    "/offers?productId=product-1",
  );
  expect(screen.getByRole("link", { name: "Add Catalog Second to compare" })).toHaveAttribute(
    "href",
    "/products?slug=catalog-second",
  );
  expect(screen.getByRole("link", { name: "View offers for Catalog Second" })).toHaveAttribute(
    "href",
    "/offers?productId=product-2",
  );
  expect(screen.getByText("Catalog Second")).toBeInTheDocument();
  expect(screen.queryByText("catalog-first")).not.toBeInTheDocument();
  expect(screen.getByText("Acme")).toBeInTheDocument();
  expect(
    within(screen.getByRole("article", { name: "Catalog First" })).getByRole("list", {
      name: "Decision actions for Catalog First",
    }),
  ).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    browseQueryDescriptor,
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(expect.anything(), queryRef);
});

test("renders bounded specification highlights on browse product cards", () => {
  renderBrowseRouteWithRelayData({
    productData: buildBrowseProductsResponse({
      products: [
        {
          id: "product-spec-rich",
          name: "Spec Rich Product",
          slug: "spec-rich-product",
          currentAttributes: [
            {
              code: "screen_size",
              displayName: "Screen Size",
              valueText: "15 inches",
              sortOrder: 20,
              groupLabel: "Display",
            },
            {
              code: "battery_life",
              displayName: "Battery Life",
              valueText: "12 hours",
              sortOrder: 10,
              groupLabel: "Power",
            },
            {
              code: "weight",
              displayName: "Weight",
              valueText: "3 lb",
              sortOrder: 30,
              groupLabel: "Build",
            },
            {
              code: "connectivity",
              displayName: "Connectivity",
              valueText: "Wi-Fi 6",
              sortOrder: 40,
              groupLabel: "Networking",
            },
          ],
        },
        {
          id: "product-one-spec",
          name: "One Spec Product",
          slug: "one-spec-product",
          currentAttributes: [
            {
              code: "panel_type",
              displayName: "Panel Type",
              valueText: "OLED",
              sortOrder: 10,
              groupLabel: "Display",
            },
          ],
        },
        {
          id: "product-empty-specs",
          name: "Empty Specs Product",
          slug: "empty-specs-product",
          currentAttributes: [],
        },
      ],
    }),
  });

  const richProductCard = screen.getByRole("article", { name: "Spec Rich Product" });
  const richHighlights = within(richProductCard).getByRole("list", {
    name: "Specification highlights",
  });
  const richHighlightRows = within(richHighlights).getAllByRole("listitem");

  expect(richHighlightRows).toHaveLength(3);
  expect(richHighlightRows[0]).toHaveTextContent("Battery Life: 12 hours");
  expect(richHighlightRows[1]).toHaveTextContent("Screen Size: 15 inches");
  expect(richHighlightRows[2]).toHaveTextContent("Weight: 3 lb");
  expect(within(richProductCard).queryByText("Connectivity: Wi-Fi 6")).not.toBeInTheDocument();

  const oneSpecProductCard = screen.getByRole("article", { name: "One Spec Product" });
  const oneSpecHighlights = within(oneSpecProductCard).getByRole("list", {
    name: "Specification highlights",
  });

  expect(within(oneSpecHighlights).getAllByRole("listitem")).toHaveLength(1);
  expect(within(oneSpecHighlights).getByText("Panel Type: OLED")).toBeInTheDocument();

  const emptySpecProductCard = screen.getByRole("article", { name: "Empty Specs Product" });

  expect(
    within(emptySpecProductCard).queryByRole("list", {
      name: "Specification highlights",
    }),
  ).not.toBeInTheDocument();
});

test("browse cards keep equal and null specification order stable without mutating Relay data", () => {
  const attributes = Object.freeze([
    Object.freeze({
      code: "first-null",
      displayName: "First null",
      sortOrder: null,
      valueText: "first",
    }),
    Object.freeze({
      code: "first-equal",
      displayName: "First equal",
      sortOrder: 10,
      valueText: "one",
    }),
    Object.freeze({
      code: "second-equal",
      displayName: "Second equal",
      sortOrder: 10,
      valueText: "two",
    }),
    Object.freeze({
      code: "second-null",
      displayName: "Second null",
      sortOrder: null,
      valueText: "second",
    }),
  ]);
  const product = {
    id: "stable-spec-order",
    name: "Stable specification order",
    slug: "stable-spec-order",
    brand: { id: "brand-1", name: "Acme" },
    currentAttributes: attributes,
  };

  render(
    <MemoryRouter>
      <BrowseProductList
        compareActionFor={() => ({ href: "/products?slug=stable-spec-order", kind: "add" })}
        detailHrefFor={() => "/products/stable-spec-order"}
        offerHrefFor={() => "/offers?productId=stable-spec-order"}
        products={{ edges: [{ node: product }] } as never}
      />
    </MemoryRouter>,
  );

  const highlights = within(
    screen.getByRole("article", { name: "Stable specification order" }),
  ).getByRole("list", { name: "Specification highlights" });

  expect(within(highlights).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
    "First equal: one",
    "Second equal: two",
    "First null: first",
  ]);
  expect(attributes.map((attribute) => attribute.code)).toEqual([
    "first-null",
    "first-equal",
    "second-equal",
    "second-null",
  ]);
});

test("renders metadata-backed catalog filter controls", () => {
  renderBrowseRouteWithRelayData();

  const filterForm = screen.getByRole("form", { name: "Filter products" });

  fireEvent.click(within(filterForm).getByRole("button", { name: "Advanced filters" }));

  expect(within(filterForm).getByRole("searchbox", { name: "Search products" })).toHaveValue("");
  expect(within(filterForm).getByRole("combobox", { name: "Sort products" })).toHaveValue("ID_ASC");
  expect(within(filterForm).getByRole("combobox", { name: "Product type" })).toHaveValue("");
  expect(
    within(filterForm).getByRole("checkbox", { name: "Include subcategories" }),
  ).not.toBeChecked();
  expect(
    within(filterForm).getByRole("checkbox", { name: "Include subcategories" }),
  ).toHaveAttribute("aria-disabled", "true");
  expect(within(filterForm).getByRole("checkbox", { name: "Gaming (4)" })).not.toBeChecked();
  expect(within(filterForm).getByLabelText("Refresh Rate minimum")).toHaveValue("");
  expect(within(filterForm).getByLabelText("Refresh Rate maximum")).toHaveValue("");
  expect(within(filterForm).getByRole("combobox", { name: "Wireless" })).toHaveValue("");
  expect(within(filterForm).getByRole("radio", { name: "Red (2)" })).not.toBeChecked();
  expect(within(filterForm).getByRole("button", { name: "Apply filters" })).toBeInTheDocument();
});

test("keeps active advanced filters in the form while the controls are collapsed", () => {
  renderBrowseRouteWithRelayData({
    loaderData: readyBrowseLoaderData({
      filters: {
        ...emptyCatalogFilters,
        useCaseTaxonIds: ["use-gaming"],
        numeric: [{ attributeId: "attr-refresh", min: "120", max: "240" }],
        booleans: [{ attributeId: "attr-wireless", value: true }],
        enums: [{ attributeId: "attr-color", enumOptionId: "enum-red" }],
      },
    }),
    metadataData: buildProductFilterMetadataResponse({ selected: true }),
  });

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;

  fireEvent.click(within(filterForm).getByRole("button", { name: "Advanced filters" }));

  expect(screen.queryByRole("group", { name: "Use cases" })).not.toBeInTheDocument();

  const formData = new FormData(filterForm);

  expect(formData.getAll("useCaseTaxonId")).toEqual(["use-gaming"]);
  expect(formData.get("numeric.attr-refresh.min")).toBe("120");
  expect(formData.get("numeric.attr-refresh.max")).toBe("240");
  expect(formData.get("boolean.attr-wireless")).toBe("true");
  expect(formData.get("enum.attr-color")).toBe("enum-red");
});

test("omits the default catalog sort until an explicit sort is selected", () => {
  renderBrowseRouteWithRelayData();

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;
  const sortSelect = within(filterForm).getByRole("combobox", { name: "Sort products" });

  expect(new FormData(filterForm).get("sort")).toBeNull();

  chooseSelectOption(sortSelect, "Newest");

  expect(new FormData(filterForm).get("sort")).toBe("NEWEST");
});

test("shows but does not submit implicit relevance for an active search", () => {
  renderBrowseRouteWithRelayData({
    initialEntries: ["/products?q=oled"],
    loaderData: readyBrowseLoaderData({
      filters: {
        ...emptyCatalogFilters,
        query: "oled",
        sort: "RELEVANCE",
      },
    }),
  });

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;
  const sortSelect = within(filterForm).getByRole("combobox", { name: "Sort products" });

  openSelect(sortSelect);
  expect(screen.getByRole("option", { name: "Relevance" })).toBeInTheDocument();
  expect(sortSelect).toHaveValue("RELEVANCE");
  expect(new FormData(filterForm).get("sort")).toBeNull();
});

test("hides relevance and selects catalog order without a search", () => {
  renderBrowseRouteWithRelayData();

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;
  const sortSelect = within(filterForm).getByRole("combobox", { name: "Sort products" });

  openSelect(sortSelect);
  expect(screen.queryByRole("option", { name: "Relevance" })).not.toBeInTheDocument();
  expect(sortSelect).toHaveValue("ID_ASC");
});

test("submits explicit catalog order for an active search", () => {
  renderBrowseRouteWithRelayData({
    initialEntries: ["/products?q=oled"],
    loaderData: readyBrowseLoaderData({
      filters: {
        ...emptyCatalogFilters,
        query: "oled",
        sort: "RELEVANCE",
      },
    }),
  });

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;
  const sortSelect = within(filterForm).getByRole("combobox", { name: "Sort products" });

  chooseSelectOption(sortSelect, "Catalog order");

  expect(new FormData(filterForm).get("sort")).toBe("ID_ASC");
});

test("defaults a newly entered search to relevance", () => {
  renderBrowseRouteWithRelayData();

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;
  const searchInput = within(filterForm).getByRole("searchbox", { name: "Search products" });

  fireEvent.change(searchInput, { target: { value: "oled" } });

  const updatedSortSelect = within(filterForm).getByRole("combobox", {
    name: "Sort products",
  });
  expect(updatedSortSelect).toHaveTextContent("Relevance");
  openSelect(updatedSortSelect);
  expect(screen.getByRole("option", { name: "Relevance" })).toBeInTheDocument();
  expect(new FormData(filterForm).get("q")).toBe("oled");
  expect(new FormData(filterForm).get("sort")).toBeNull();
});

test("clearing an implicit relevance search restores catalog order", () => {
  renderBrowseRouteWithRelayData({
    initialEntries: ["/products?q=oled"],
    loaderData: readyBrowseLoaderData({
      filters: {
        ...emptyCatalogFilters,
        query: "oled",
        sort: "RELEVANCE",
      },
    }),
  });

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;
  const searchInput = within(filterForm).getByRole("searchbox", { name: "Search products" });
  const sortSelect = within(filterForm).getByRole("combobox", { name: "Sort products" });

  expect(sortSelect).toHaveValue("RELEVANCE");

  fireEvent.change(searchInput, { target: { value: "" } });

  expect(within(filterForm).getByRole("combobox", { name: "Sort products" })).toHaveValue("ID_ASC");
  expect(new FormData(filterForm).get("q")).toBe("");
  expect(new FormData(filterForm).get("sort")).toBeNull();
});

test("normalizes relevance to catalog order when no search is present", () => {
  renderBrowseRouteWithRelayData({
    loaderData: readyBrowseLoaderData({
      filters: {
        ...emptyCatalogFilters,
        sort: "RELEVANCE",
      },
    }),
  });

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;
  const sortSelect = within(filterForm).getByRole("combobox", { name: "Sort products" });

  openSelect(sortSelect);
  expect(screen.queryByRole("option", { name: "Relevance" })).not.toBeInTheDocument();
  expect(sortSelect).toHaveValue("ID_ASC");
  expect(new FormData(filterForm).get("sort")).toBeNull();
});

test.each(["NAME_ASC", "BRAND_NAME_ASC", "NEWEST"] as const)(
  "submits explicit %s unchanged for an active search",
  (sort) => {
    renderBrowseRouteWithRelayData({
      initialEntries: [`/products?q=oled&sort=${sort}`],
      loaderData: readyBrowseLoaderData({
        filters: {
          ...emptyCatalogFilters,
          query: "oled",
          sort,
        },
      }),
    });

    const filterForm = screen.getByRole("form", {
      name: "Filter products",
    }) as HTMLFormElement;

    expect(new FormData(filterForm).get("sort")).toBe(sort);
  },
);

test.each([
  { resultCount: 0, label: "No matching products" },
  { resultCount: 1, label: "1 matching product" },
  { resultCount: 3, label: "3 matching products" },
])(
  "renders complete catalog result guidance for $resultCount matches",
  ({ resultCount, label }) => {
    renderBrowseRouteWithRelayData({
      metadataData: buildProductFilterMetadataResponse({ resultCount }),
    });

    expect(screen.getByText(label)).toBeInTheDocument();
  },
);

test("renders selected catalog filters with scoped removal and clear links", () => {
  renderBrowseRouteWithRelayData({
    initialEntries: [
      "/products?first=24&q=oled&sort=BRAND_NAME_ASC&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-gaming&useCaseTaxonId=use-office&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red&after=stale-cursor&slug=detail-product&slug=second-product",
    ],
    loaderData: readyBrowseLoaderData({
      filters: {
        query: "oled",
        sort: "BRAND_NAME_ASC",
        typeTaxonId: "type-laptops",
        includeTypeDescendants: true,
        useCaseTaxonIds: ["use-gaming", "use-office"],
        numeric: [
          {
            attributeId: "attr-refresh",
            min: "120",
            max: "240",
          },
        ],
        booleans: [
          {
            attributeId: "attr-wireless",
            value: true,
          },
        ],
        enums: [
          {
            attributeId: "attr-color",
            enumOptionId: "enum-red",
          },
        ],
      },
      pageSize: 24,
      query: browseQueryDescriptorFromVariables({
        first: 24,
        filters: {
          query: "oled",
          sort: "BRAND_NAME_ASC",
          primaryTypeTaxonId: "type-laptops",
          includeTypeDescendants: true,
          useCaseTaxonIds: ["use-gaming", "use-office"],
          numeric: [
            {
              attributeId: "attr-refresh",
              min: "120",
              max: "240",
            },
          ],
          booleans: [
            {
              attributeId: "attr-wireless",
              value: true,
            },
          ],
          enums: [
            {
              attributeId: "attr-color",
              enumOptionId: "enum-red",
            },
          ],
        },
      }),
      metadataQuery: filterMetadataQueryDescriptorFromVariables({
        filters: {
          query: "oled",
          sort: "BRAND_NAME_ASC",
          primaryTypeTaxonId: "type-laptops",
          includeTypeDescendants: true,
          useCaseTaxonIds: ["use-gaming", "use-office"],
          numeric: [
            {
              attributeId: "attr-refresh",
              min: "120",
              max: "240",
            },
          ],
          booleans: [
            {
              attributeId: "attr-wireless",
              value: true,
            },
          ],
          enums: [
            {
              attributeId: "attr-color",
              enumOptionId: "enum-red",
            },
          ],
        },
      }),
    }),
    metadataData: buildProductFilterMetadataResponse({ resultCount: 7, selected: true }),
  });

  const filterForm = screen.getByRole("form", { name: "Filter products" });

  expect(within(filterForm).getByRole("searchbox", { name: "Search products" })).toHaveValue(
    "oled",
  );
  expect(within(filterForm).getByRole("combobox", { name: "Sort products" })).toHaveValue(
    "BRAND_NAME_ASC",
  );
  expect(within(filterForm).getByRole("combobox", { name: "Product type" })).toHaveValue(
    "type-laptops",
  );
  expect(within(filterForm).getByRole("checkbox", { name: "Include subcategories" })).toBeChecked();
  expect(
    within(filterForm).getByRole("checkbox", { name: "Include subcategories" }),
  ).not.toBeDisabled();
  expect(within(filterForm).getByRole("checkbox", { name: "Gaming (4)" })).toBeChecked();
  expect(within(filterForm).getByLabelText("Refresh Rate minimum")).toHaveValue("120");
  expect(within(filterForm).getByLabelText("Refresh Rate maximum")).toHaveValue("240");
  expect(within(filterForm).getByRole("combobox", { name: "Wireless" })).toHaveValue("true");
  expect(within(filterForm).getByRole("radio", { name: "Red (2)" })).toBeChecked();

  const summary = screen.getByRole("list", { name: "Active filters" });

  expect(screen.getByText("7 matching products")).toBeInTheDocument();
  expect(within(summary).getByRole("link", { name: 'Remove Search: "oled"' })).toHaveAttribute(
    "href",
    "/products?first=24&sort=BRAND_NAME_ASC&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-gaming&useCaseTaxonId=use-office&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red&slug=detail-product&slug=second-product",
  );
  expect(within(summary).getByRole("link", { name: "Remove Sort: Brand name" })).toHaveAttribute(
    "href",
    "/products?first=24&q=oled&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-gaming&useCaseTaxonId=use-office&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red&slug=detail-product&slug=second-product",
  );
  expect(
    within(summary).getByRole("link", { name: "Remove Type: Laptops and descendants" }),
  ).toHaveAttribute(
    "href",
    "/products?first=24&q=oled&sort=BRAND_NAME_ASC&useCaseTaxonId=use-gaming&useCaseTaxonId=use-office&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red&slug=detail-product&slug=second-product",
  );
  expect(within(summary).getByRole("link", { name: "Remove Use case: Gaming" })).toHaveAttribute(
    "href",
    "/products?first=24&q=oled&sort=BRAND_NAME_ASC&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-office&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red&slug=detail-product&slug=second-product",
  );
  expect(
    within(summary).getByRole("link", { name: "Remove Refresh Rate: 120 Hz to 240 Hz" }),
  ).toHaveAttribute(
    "href",
    "/products?first=24&q=oled&sort=BRAND_NAME_ASC&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-gaming&useCaseTaxonId=use-office&boolean.attr-wireless=true&enum.attr-color=enum-red&slug=detail-product&slug=second-product",
  );
  expect(within(summary).getByRole("link", { name: "Remove Wireless: Yes" })).toHaveAttribute(
    "href",
    "/products?first=24&q=oled&sort=BRAND_NAME_ASC&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-gaming&useCaseTaxonId=use-office&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&enum.attr-color=enum-red&slug=detail-product&slug=second-product",
  );
  expect(within(summary).getByRole("link", { name: "Remove Color: Red" })).toHaveAttribute(
    "href",
    "/products?first=24&q=oled&sort=BRAND_NAME_ASC&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-gaming&useCaseTaxonId=use-office&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&slug=detail-product&slug=second-product",
  );
  expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
    "href",
    "/products?first=24&slug=detail-product&slug=second-product",
  );
});

test("renders a persistent compare tray on browse and preserves compare slugs through controls", () => {
  renderBrowseRouteWithRelayData({
    initialEntries: ["/products?first=24&slug=detail-product&slug=second-product"],
    loaderData: readyBrowseLoaderData({
      pageSize: 24,
      query: browseQueryDescriptorFromVariables({
        first: 24,
      }),
    }),
    productData: buildBrowseProductsResponse({
      endCursor: "cursor-next-page",
      hasNextPage: true,
      products: [
        {
          id: "product-1",
          name: "Catalog First",
          slug: "catalog-first",
        },
        {
          id: "product-2",
          name: "Catalog Second",
          slug: "catalog-second",
        },
      ],
    }),
  });

  const selectionTray = screen.getByRole("region", { name: "Selected products" });
  const selectionCount = within(selectionTray).getByRole("status");

  expect(selectionCount).toHaveTextContent(`2 of ${MAX_COMPARE_PRODUCTS} products selected.`);
  expect(selectionCount).toHaveAttribute("aria-live", "polite");
  expect(within(selectionTray).getByRole("link", { name: "Open comparison" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product",
  );
  expect(
    within(selectionTray).getByRole("link", {
      name: "Remove detail-product from selection",
    }),
  ).toHaveAttribute("href", "/products?first=24&slug=second-product");
  expect(screen.getByRole("link", { name: "Add Catalog Second to compare" })).toHaveAttribute(
    "href",
    "/products?first=24&slug=detail-product&slug=second-product&slug=catalog-second",
  );
  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=24&after=cursor-next-page&slug=detail-product&slug=second-product",
  );
  expect(screen.getByRole("link", { name: "View offers for Catalog First" })).toHaveAttribute(
    "href",
    "/offers?productId=product-1&slug=detail-product&slug=second-product",
  );

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;

  expect(new FormData(filterForm).getAll("slug")).toEqual(["detail-product", "second-product"]);
});

test("omits the default catalog sort from rendered compare links", () => {
  renderBrowseRouteWithRelayData({
    initialEntries: ["/products?sort=ID_ASC&slug=selected-product"],
    productData: buildBrowseProductsResponse({
      products: [
        {
          id: "product-1",
          name: "Catalog First",
          slug: "catalog-first",
        },
      ],
    }),
  });

  expect(screen.queryByText("Sort: Catalog order")).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Remove selected-product from selection" }),
  ).toHaveAttribute("href", "/products");
  expect(screen.getByRole("link", { name: "Add Catalog First to compare" })).toHaveAttribute(
    "href",
    "/products?slug=selected-product&slug=catalog-first",
  );
});

test("clamps URL-driven compare selections before rendering browse controls", () => {
  renderBrowseRouteWithRelayData({
    initialEntries: [
      "/products?first=24&slug=detail-product&slug=second-product&slug=third-product&slug=fourth-product",
    ],
    loaderData: readyBrowseLoaderData({
      pageSize: 24,
      query: browseQueryDescriptorFromVariables({
        first: 24,
      }),
    }),
    productData: buildBrowseProductsResponse({
      endCursor: "cursor-next-page",
      hasNextPage: true,
      products: [
        {
          id: "product-1",
          name: "Catalog First",
          slug: "catalog-first",
        },
      ],
    }),
  });

  const selectionTray = screen.getByRole("region", { name: "Selected products" });
  const selectionCount = within(selectionTray).getByRole("status");

  expect(selectionCount).toHaveTextContent(
    `${MAX_COMPARE_PRODUCTS} of ${MAX_COMPARE_PRODUCTS} products selected.`,
  );
  expect(within(selectionTray).getAllByRole("listitem")).toHaveLength(MAX_COMPARE_PRODUCTS);
  expect(within(selectionTray).getByRole("link", { name: "Open comparison" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product&slug=second-product&slug=third-product",
  );
  expect(screen.getByText("Compare selection full")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=24&after=cursor-next-page&slug=detail-product&slug=second-product&slug=third-product",
  );

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;

  expect(new FormData(filterForm).getAll("slug")).toEqual([
    "detail-product",
    "second-product",
    "third-product",
  ]);
});

test("preserves in-progress filter control state when compare selection changes", () => {
  const loaderData = readyBrowseLoaderData();
  const metadataData = buildProductFilterMetadataResponse();
  const productData = buildBrowseProductsResponse({
    products: [
      {
        id: "product-1",
        name: "Catalog First",
        slug: "catalog-first",
      },
    ],
  });

  renderBrowseRouteWithRelayData({
    loaderData,
    metadataData,
    productData,
  });

  const filterForm = screen.getByRole("form", { name: "Filter products" });
  const typeSelect = within(filterForm).getByRole("combobox", { name: "Product type" });

  chooseSelectOption(typeSelect, "Laptops (6)");
  mockedUseRoutePreloadedQuery.mockReturnValueOnce(
    mockPreloadedQuery(loaderData.query.__relayQuery.variables),
  );
  mockedUsePreloadedQuery.mockReturnValueOnce({
    ...productData,
    ...metadataData,
  } as never);
  fireEvent.click(screen.getByRole("link", { name: "Add Catalog First to compare" }));

  const updatedFilterForm = screen.getByRole("form", {
    name: "Filter products",
  }) as HTMLFormElement;

  expect(within(updatedFilterForm).getByRole("combobox", { name: "Product type" })).toHaveValue(
    "type-laptops",
  );
  expect(new FormData(updatedFilterForm).getAll("slug")).toEqual(["catalog-first"]);
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
        enums: [],
      },
    }),
    metadataData: buildProductFilterMetadataResponse({ selected: true }),
  });

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;
  const productTypeSelect = within(filterForm).getByRole("combobox", {
    name: "Product type",
  });
  const includeDescendantsCheckbox = within(filterForm).getByRole("checkbox", {
    name: "Include subcategories",
  });

  expect(productTypeSelect).toHaveValue("type-laptops");
  expect(includeDescendantsCheckbox).toBeChecked();
  expect(includeDescendantsCheckbox).not.toBeDisabled();

  chooseSelectOption(productTypeSelect, "All product types");

  expect(productTypeSelect).toHaveValue("");
  expect(includeDescendantsCheckbox).not.toBeChecked();
  expect(includeDescendantsCheckbox).toHaveAttribute("aria-disabled", "true");
  expect(new FormData(filterForm).get("includeTypeDescendants")).toBeNull();
});

test("selects descendants by default when choosing a product type", () => {
  const metadataData = buildProductFilterMetadataResponse();

  renderBrowseRouteWithRelayData({
    metadataData: {
      productFilterMetadata: {
        ...metadataData.productFilterMetadata,
        typeOptions: [
          ...metadataData.productFilterMetadata.typeOptions,
          {
            id: "type-monitors",
            label: "Monitors",
            count: 3,
            selected: false,
            disabled: false,
          },
        ],
      },
    },
  });

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;
  const productTypeSelect = within(filterForm).getByRole("combobox", {
    name: "Product type",
  });
  const includeDescendantsCheckbox = within(filterForm).getByRole("checkbox", {
    name: "Include subcategories",
  });

  expect(productTypeSelect).toHaveValue("");
  expect(includeDescendantsCheckbox).not.toBeChecked();
  expect(includeDescendantsCheckbox).toHaveAttribute("aria-disabled", "true");

  chooseSelectOption(productTypeSelect, "Laptops (6)");

  expect(productTypeSelect).toHaveValue("type-laptops");
  expect(includeDescendantsCheckbox).toBeChecked();
  expect(includeDescendantsCheckbox).not.toBeDisabled();
  expect(new FormData(filterForm).get("includeTypeDescendants")).toBe("1");

  fireEvent.click(includeDescendantsCheckbox);

  expect(includeDescendantsCheckbox).not.toBeChecked();
  expect(new FormData(filterForm).get("includeTypeDescendants")).toBeNull();

  chooseSelectOption(productTypeSelect, "Monitors (3)");

  expect(productTypeSelect).toHaveValue("type-monitors");
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
        max: "240",
      },
    ],
    booleans: [
      {
        attributeId: "attr-wireless",
        value: true,
      },
    ],
    enums: [
      {
        attributeId: "attr-color",
        enumOptionId: "enum-red",
      },
    ],
  };
  const productFiltersInput = {
    primaryTypeTaxonId: "type-laptops",
    includeTypeDescendants: true,
    useCaseTaxonIds: ["use-gaming"],
    numeric: [
      {
        attributeId: "attr-refresh",
        min: "120",
        max: "240",
      },
    ],
    booleans: [
      {
        attributeId: "attr-wireless",
        value: true,
      },
    ],
    enums: [
      {
        attributeId: "attr-color",
        enumOptionId: "enum-red",
      },
    ],
  };
  const activeLoaderData = readyBrowseLoaderData({
    filters: activeFilters,
    pageSize: 24,
    query: browseQueryDescriptorFromVariables({
      first: 24,
      filters: productFiltersInput,
    }),
    metadataQuery: filterMetadataQueryDescriptorFromVariables({
      filters: productFiltersInput,
    }),
  });
  const clearedLoaderData = readyBrowseLoaderData({
    filters: emptyCatalogFilters,
    pageSize: 24,
    query: browseQueryDescriptorFromVariables({
      first: 24,
    }),
    metadataQuery: filterMetadataQueryDescriptorFromVariables(),
  });

  mockedUseLoaderData.mockReturnValueOnce(activeLoaderData).mockReturnValueOnce(clearedLoaderData);
  mockedUseRoutePreloadedQuery
    .mockReturnValueOnce(mockPreloadedQuery(activeLoaderData.query.__relayQuery.variables))
    .mockReturnValueOnce(mockPreloadedQuery(clearedLoaderData.query.__relayQuery.variables));
  mockedUsePreloadedQuery
    .mockReturnValueOnce({
      ...buildBrowseProductsResponse(),
      ...buildProductFilterMetadataResponse({ selected: true }),
    } as never)
    .mockReturnValueOnce({
      ...buildBrowseProductsResponse(),
      ...buildProductFilterMetadataResponse(),
    } as never);

  const view = render(
    <MemoryRouter initialEntries={["/products?first=24&typeTaxonId=type-laptops"]}>
      <BrowseRoute />
    </MemoryRouter>,
  );

  const activeFilterForm = screen.getByRole("form", { name: "Filter products" });

  expect(within(activeFilterForm).getByRole("combobox", { name: "Product type" })).toHaveValue(
    "type-laptops",
  );
  expect(
    within(activeFilterForm).getByRole("checkbox", { name: "Include subcategories" }),
  ).toBeChecked();
  expect(within(activeFilterForm).getByRole("checkbox", { name: "Gaming (4)" })).toBeChecked();
  expect(within(activeFilterForm).getByLabelText("Refresh Rate minimum")).toHaveValue("120");
  expect(within(activeFilterForm).getByLabelText("Refresh Rate maximum")).toHaveValue("240");
  expect(within(activeFilterForm).getByRole("combobox", { name: "Wireless" })).toHaveValue("true");
  expect(within(activeFilterForm).getByRole("radio", { name: "Red (2)" })).toBeChecked();

  view.rerender(
    <MemoryRouter initialEntries={["/products?first=24"]}>
      <BrowseRoute />
    </MemoryRouter>,
  );

  const clearedFilterForm = screen.getByRole("form", { name: "Filter products" });

  fireEvent.click(within(clearedFilterForm).getByRole("button", { name: "Advanced filters" }));

  expect(within(clearedFilterForm).getByRole("combobox", { name: "Product type" })).toHaveValue("");
  expect(
    within(clearedFilterForm).getByRole("checkbox", { name: "Include subcategories" }),
  ).not.toBeChecked();
  expect(
    within(clearedFilterForm).getByRole("checkbox", { name: "Include subcategories" }),
  ).toHaveAttribute("aria-disabled", "true");
  expect(within(clearedFilterForm).getByRole("checkbox", { name: "Gaming (4)" })).not.toBeChecked();
  expect(within(clearedFilterForm).getByLabelText("Refresh Rate minimum")).toHaveValue("");
  expect(within(clearedFilterForm).getByLabelText("Refresh Rate maximum")).toHaveValue("");
  expect(within(clearedFilterForm).getByRole("combobox", { name: "Wireless" })).toHaveValue("");
  expect(within(clearedFilterForm).getByRole("radio", { name: "Red (2)" })).not.toBeChecked();
});

test("submits only one selected enum option per enum facet", () => {
  renderBrowseRouteWithRelayData();

  const filterForm = screen.getByRole("form", { name: "Filter products" }) as HTMLFormElement;

  fireEvent.click(within(filterForm).getByRole("button", { name: "Advanced filters" }));

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
            enumOptionId: "enum-red",
          },
          {
            attributeId: "attr-size",
            enumOptionId: "enum-large",
          },
          {
            attributeId: "attr-color",
            enumOptionId: "enum-blue",
          },
        ],
      },
      24,
      "cursor-next-page",
    ),
  ).toBe(
    "/products?first=24&enum.attr-color=enum-blue&enum.attr-size=enum-large&after=cursor-next-page",
  );
});

test("preserves search, sort, pagination, and compare selection in browse paths", () => {
  expect(
    catalogBrowseNextPagePath(
      {
        query: "oled display",
        sort: "BRAND_NAME_ASC",
        useCaseTaxonIds: [],
        numeric: [],
        booleans: [],
        enums: [],
      },
      24,
      "cursor-next-page",
      ["first-product", "second-product"],
    ),
  ).toBe(
    "/products?first=24&q=oled+display&sort=BRAND_NAME_ASC&after=cursor-next-page&slug=first-product&slug=second-product",
  );
});

test("preserves search and sort through rendered pagination and compare links", () => {
  const activeFilters = {
    query: "oled",
    sort: "NEWEST",
    useCaseTaxonIds: [],
    numeric: [],
    booleans: [],
    enums: [],
  };
  const productFiltersInput = { query: "oled", sort: "NEWEST" as const };

  renderBrowseRouteWithRelayData({
    initialEntries: ["/products?first=24&q=oled&sort=NEWEST&slug=selected-product"],
    loaderData: readyBrowseLoaderData({
      filters: activeFilters,
      pageSize: 24,
      query: browseQueryDescriptorFromVariables({
        first: 24,
        filters: productFiltersInput,
      }),
      metadataQuery: filterMetadataQueryDescriptorFromVariables({
        filters: productFiltersInput,
      }),
    }),
    productData: buildBrowseProductsResponse({
      endCursor: "cursor-next-page",
      hasNextPage: true,
      products: [
        {
          id: "product-1",
          name: "Catalog First",
          slug: "catalog-first",
        },
      ],
    }),
  });

  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=24&q=oled&sort=NEWEST&after=cursor-next-page&slug=selected-product",
  );
  expect(screen.getByRole("link", { name: "Add Catalog First to compare" })).toHaveAttribute(
    "href",
    "/products?first=24&q=oled&sort=NEWEST&slug=selected-product&slug=catalog-first",
  );
});

test("omits normalized relevance from rendered pagination and compare links", () => {
  const activeFilters = {
    query: "oled",
    sort: "RELEVANCE",
    useCaseTaxonIds: ["use-gaming"],
    numeric: [],
    booleans: [],
    enums: [],
  } as const;
  const productFiltersInput = {
    query: "oled",
    sort: "RELEVANCE" as const,
    useCaseTaxonIds: ["use-gaming"],
  };

  renderBrowseRouteWithRelayData({
    initialEntries: ["/products?first=24&q=oled&useCaseTaxonId=use-gaming&slug=selected-product"],
    loaderData: readyBrowseLoaderData({
      filters: activeFilters,
      pageSize: 24,
      query: browseQueryDescriptorFromVariables({
        first: 24,
        filters: productFiltersInput,
      }),
      metadataQuery: filterMetadataQueryDescriptorFromVariables({
        filters: productFiltersInput,
      }),
    }),
    productData: buildBrowseProductsResponse({
      endCursor: "cursor-next-page",
      hasNextPage: true,
      products: [
        {
          id: "product-1",
          name: "Catalog First",
          slug: "catalog-first",
        },
      ],
    }),
  });

  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=24&q=oled&useCaseTaxonId=use-gaming&after=cursor-next-page&slug=selected-product",
  );
  expect(screen.getByRole("link", { name: "Add Catalog First to compare" })).toHaveAttribute(
    "href",
    "/products?first=24&q=oled&useCaseTaxonId=use-gaming&slug=selected-product&slug=catalog-first",
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
        max: "240",
      },
    ],
    booleans: [
      {
        attributeId: "attr-wireless",
        value: true,
      },
    ],
    enums: [
      {
        attributeId: "attr-color",
        enumOptionId: "enum-red",
      },
    ],
  };
  const productFiltersInput = {
    primaryTypeTaxonId: "type-laptops",
    includeTypeDescendants: true,
    useCaseTaxonIds: ["use-gaming"],
    numeric: [
      {
        attributeId: "attr-refresh",
        min: "120",
        max: "240",
      },
    ],
    booleans: [
      {
        attributeId: "attr-wireless",
        value: true,
      },
    ],
    enums: [
      {
        attributeId: "attr-color",
        enumOptionId: "enum-red",
      },
    ],
  };

  renderBrowseRouteWithRelayData({
    initialEntries: [
      "/products?first=24&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-gaming&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red&after=cursor-current-page",
    ],
    loaderData: readyBrowseLoaderData({
      filters: activeFilters,
      pageSize: 24,
      query: browseQueryDescriptorFromVariables({
        first: 24,
        after: "cursor-current-page",
        filters: productFiltersInput,
      }),
      metadataQuery: filterMetadataQueryDescriptorFromVariables({
        filters: productFiltersInput,
      }),
    }),
    metadataData: buildProductFilterMetadataResponse({ selected: true }),
    productData: buildBrowseProductsResponse({
      endCursor: "cursor-next-page",
      hasNextPage: true,
      products: [
        {
          id: "product-page-2",
          name: "Page Two Product",
          slug: "page-two-product",
        },
      ],
    }),
  });

  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=24&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-gaming&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red&after=cursor-next-page",
  );
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=24&typeTaxonId=type-laptops&includeTypeDescendants=1&useCaseTaxonId=use-gaming&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red",
  );
  expect(
    screen.getByRole("form", { name: "Filter products" }).querySelector('[name="after"]'),
  ).not.toBeInTheDocument();
});

test("renders decision actions for each browse product card", () => {
  mockBrowseRouteRelayData({
    productData: buildBrowseProductsResponse({
      products: [
        {
          id: "product-1",
          name: "Catalog First",
          slug: "catalog-first",
        },
        {
          id: "product-2",
          name: "Catalog Second",
          slug: "catalog-second",
        },
      ],
      hasNextPage: false,
    }),
  });

  render(
    <MemoryRouter initialEntries={["/products"]}>
      <BrowseRoute />
    </MemoryRouter>,
  );

  const firstProductCard = screen.getByRole("article", { name: "Catalog First" });
  const firstProductActions = within(firstProductCard).getByRole("list", {
    name: "Decision actions for Catalog First",
  });

  expect(
    within(firstProductActions).getByRole("link", { name: "View details for Catalog First" }),
  ).toHaveAttribute("href", "/products/catalog-first");
  expect(
    within(firstProductActions).getByRole("link", { name: "Add Catalog First to compare" }),
  ).toHaveAttribute("href", "/products?slug=catalog-first");
  expect(
    within(firstProductActions).getByRole("link", { name: "View offers for Catalog First" }),
  ).toHaveAttribute("href", "/offers?productId=product-1");

  const secondProductCard = screen.getByRole("article", { name: "Catalog Second" });
  const secondProductActions = within(secondProductCard).getByRole("list", {
    name: "Decision actions for Catalog Second",
  });

  expect(
    within(secondProductActions).getByRole("link", { name: "View details for Catalog Second" }),
  ).toHaveAttribute("href", "/products/catalog-second");
  expect(
    within(secondProductActions).getByRole("link", { name: "Add Catalog Second to compare" }),
  ).toHaveAttribute("href", "/products?slug=catalog-second");
  expect(
    within(secondProductActions).getByRole("link", { name: "View offers for Catalog Second" }),
  ).toHaveAttribute("href", "/offers?productId=product-2");
});

test("encodes reserved characters in browse product decision links", () => {
  mockBrowseRouteRelayData({
    productData: buildBrowseProductsResponse({
      products: [
        {
          id: "product/reserved?id=1",
          name: "Reserved Product",
          slug: "reserved/product?variant=1",
        },
      ],
      hasNextPage: false,
    }),
  });

  render(
    <MemoryRouter initialEntries={["/products"]}>
      <BrowseRoute />
    </MemoryRouter>,
  );

  const productActions = within(
    screen.getByRole("article", { name: "Reserved Product" }),
  ).getByRole("list", {
    name: "Decision actions for Reserved Product",
  });

  expect(
    within(productActions).getByRole("link", { name: "View details for Reserved Product" }),
  ).toHaveAttribute("href", "/products/reserved%2Fproduct%3Fvariant%3D1");
  expect(
    within(productActions).getByRole("link", { name: "Add Reserved Product to compare" }),
  ).toHaveAttribute("href", "/products?slug=reserved%2Fproduct%3Fvariant%3D1");
  expect(
    within(productActions).getByRole("link", { name: "View offers for Reserved Product" }),
  ).toHaveAttribute("href", "/offers?productId=product%2Freserved%3Fid%3D1");
});

test("keeps browse product cards named when slugs contain spaces", () => {
  mockBrowseRouteRelayData({
    productData: buildBrowseProductsResponse({
      products: [
        {
          id: "product-spaced",
          name: "Spaced Product",
          slug: "spaced product",
        },
      ],
      hasNextPage: false,
    }),
  });

  render(
    <MemoryRouter initialEntries={["/products"]}>
      <BrowseRoute />
    </MemoryRouter>,
  );

  const productCard = screen.getByRole("article", { name: "Spaced Product" });
  const productActions = within(productCard).getByRole("list", {
    name: "Decision actions for Spaced Product",
  });

  expect(
    within(productActions).getByRole("link", { name: "View details for Spaced Product" }),
  ).toHaveAttribute("href", "/products/spaced%20product");
  expect(
    within(productActions).getByRole("link", { name: "Add Spaced Product to compare" }),
  ).toHaveAttribute("href", "/products?slug=spaced+product");
  expect(
    within(productActions).getByRole("link", { name: "View offers for Spaced Product" }),
  ).toHaveAttribute("href", "/offers?productId=product-spaced");
});

test("renders selected page size and preserves first in pagination links", () => {
  const cursorDescriptor = {
    __relayQuery: {
      ...browseQueryDescriptor.__relayQuery,
      variables: { first: 24, after: "cursor-current-page" },
    },
  };
  const queryRef = mockPreloadedQuery({ first: 24, after: "cursor-current-page" });

  mockBrowseRouteRelayData({
    loaderData: readyBrowseLoaderData({
      pageSize: 24,
      query: cursorDescriptor,
    }),
    productQueryRef: queryRef,
    productData: buildBrowseProductsResponse({
      endCursor: "cursor-next-page",
      hasNextPage: true,
      products: [
        {
          id: "product-page-2",
          name: "Page Two Product",
          slug: "page-two-product",
        },
      ],
    }),
  });

  render(
    <MemoryRouter initialEntries={["/products?after=cursor-current-page&first=24"]}>
      <BrowseRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("combobox", { name: "Products per page" })).toHaveValue("24");
  expect(
    within(screen.getByRole("article", { name: "Page Two Product" })).getByRole("list", {
      name: "Decision actions for Page Two Product",
    }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=24&after=cursor-next-page",
  );
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=24",
  );
});

test("renders next and first-page pagination links from the browse query", () => {
  const cursorDescriptor = {
    __relayQuery: {
      ...browseQueryDescriptor.__relayQuery,
      variables: { first: 12, after: "cursor-current-page" },
    },
  };
  const queryRef = mockPreloadedQuery({ first: 12, after: "cursor-current-page" });

  mockBrowseRouteRelayData({
    loaderData: readyBrowseLoaderData({
      query: cursorDescriptor,
    }),
    productQueryRef: queryRef,
    productData: buildBrowseProductsResponse({
      endCursor: "cursor-next-page",
      hasNextPage: true,
      products: [
        {
          id: "product-page-2",
          name: "Page Two Product",
          slug: "page-two-product",
        },
      ],
    }),
  });

  render(
    <MemoryRouter initialEntries={["/products?after=cursor-current-page"]}>
      <BrowseRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "View details for Page Two Product" })).toHaveAttribute(
    "href",
    "/products/page-two-product",
  );
  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=12&after=cursor-next-page",
  );
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=12",
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
          slug: "final-page-product",
        },
      ],
    }),
  });

  render(
    <MemoryRouter initialEntries={["/products"]}>
      <BrowseRoute />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("link", { name: "View details for Final Page Product" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Next products" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "First products" })).not.toBeInTheDocument();
});

test("renders a local loading state while the Relay route query suspends", () => {
  const queryRef = mockPreloadedQuery({ first: 12 });

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor,
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw Promise.race([]);
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("status")).toHaveTextContent("Loading catalog...");
});

test("renders a local unavailable state when the Relay route query errors", () => {
  const queryRef = mockPreloadedQuery({ first: 12 });
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor,
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(queryRef);
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw new Error("Relay read failed");
  });

  try {
    render(
      <MemoryRouter>
        <BrowseRoute />
      </MemoryRouter>,
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
        productFilterMetadata: null,
      } as unknown as ReturnType<typeof buildProductFilterMetadataResponse>,
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Catalog unavailable.");
    expect(screen.getByText("Please refresh the page or try again later.")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Filter products" })).not.toBeInTheDocument();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("resets the local unavailable state when fresh loader data arrives", async () => {
  const failedQueryRef = mockPreloadedQuery({ first: 12 });
  const recoveredQueryRef = mockPreloadedQuery({ first: 12 });
  const retryDescriptor = {
    __relayQuery: {
      ...browseQueryDescriptor.__relayQuery,
      variables: { ...browseQueryDescriptor.__relayQuery.variables },
    },
  };
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: browseQueryDescriptor,
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(failedQueryRef);
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw new Error("Relay read failed");
  });

  try {
    const view = render(
      <MemoryRouter>
        <BrowseRoute />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Catalog unavailable.");

    mockedUseLoaderData.mockReturnValue(readyBrowseLoaderData({ query: retryDescriptor }));
    mockedUseRoutePreloadedQuery.mockReturnValueOnce(recoveredQueryRef);
    mockedUsePreloadedQuery.mockReturnValueOnce({
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
                name: "Recovered Brand",
              },
              currentAttributes: [],
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      },
      ...buildProductFilterMetadataResponse(),
    } as never);

    view.rerender(
      <MemoryRouter initialEntries={["/products"]}>
        <BrowseRoute />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(
      screen.getByRole("link", { name: "View details for Recovered Product" }),
    ).toHaveAttribute("href", "/products/recovered-product");
    expect(screen.getByRole("link", { name: "Add Recovered Product to compare" })).toHaveAttribute(
      "href",
      "/products?slug=recovered-product",
    );
    expect(screen.getByRole("link", { name: "View offers for Recovered Product" })).toHaveAttribute(
      "href",
      "/offers?productId=product-recovered",
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("renders an empty-state message when the Relay query returns no products", () => {
  mockBrowseRouteRelayData({
    productData: {
      ...buildProductFilterMetadataResponse(),
      products: {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      },
    },
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>,
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
        enums: [],
      },
      query: browseQueryDescriptorFromVariables({
        first: 12,
        filters: {
          primaryTypeTaxonId: "type-laptops",
          includeTypeDescendants: true,
        },
      }),
      metadataQuery: filterMetadataQueryDescriptorFromVariables({
        filters: {
          primaryTypeTaxonId: "type-laptops",
          includeTypeDescendants: true,
        },
      }),
    }),
    metadataData: buildProductFilterMetadataResponse({
      resultCount: 0,
      selected: true,
    }),
    productData: buildBrowseProductsResponse(),
  });

  expect(screen.getByText("No products match these filters.")).toBeInTheDocument();
  expect(screen.queryByText("No products available yet.")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
    "href",
    "/products?first=12",
  );
});

test("renders the recoverable empty-state message when a cursor page is empty but filters still match products", () => {
  const activeFilters = {
    typeTaxonId: "type-laptops",
    includeTypeDescendants: true,
    useCaseTaxonIds: [],
    numeric: [],
    booleans: [],
    enums: [],
  };
  const productFiltersInput = {
    primaryTypeTaxonId: "type-laptops",
    includeTypeDescendants: true,
  };

  renderBrowseRouteWithRelayData({
    initialEntries: [
      "/products?typeTaxonId=type-laptops&includeTypeDescendants=1&after=stale-cursor",
    ],
    loaderData: readyBrowseLoaderData({
      filters: activeFilters,
      query: browseQueryDescriptorFromVariables({
        first: 12,
        after: "stale-cursor",
        filters: productFiltersInput,
      }),
      metadataQuery: filterMetadataQueryDescriptorFromVariables({
        filters: productFiltersInput,
      }),
    }),
    metadataData: buildProductFilterMetadataResponse({
      resultCount: 3,
      selected: true,
    }),
    productData: buildBrowseProductsResponse(),
  });

  expect(screen.getByText("No products available yet.")).toBeInTheDocument();
  expect(screen.queryByText("No products match these filters.")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=12&typeTaxonId=type-laptops&includeTypeDescendants=1",
  );
});

test("keeps a next-page recovery link when an empty result has a next cursor", () => {
  mockBrowseRouteRelayData({
    productData: {
      ...buildProductFilterMetadataResponse(),
      products: {
        edges: [],
        pageInfo: {
          hasNextPage: true,
          endCursor: "cursor-without-products",
        },
      },
    },
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>,
  );

  expect(screen.getByText("No products available yet.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/products?first=12&after=cursor-without-products",
  );
  expect(screen.queryByRole("link", { name: "First products" })).not.toBeInTheDocument();
});

test("keeps a first-page recovery link when a cursor page returns no products", () => {
  const cursorDescriptor = {
    __relayQuery: {
      ...browseQueryDescriptor.__relayQuery,
      variables: { first: 12, after: "stale-cursor" },
    },
  };
  const queryRef = mockPreloadedQuery({ first: 12, after: "stale-cursor" });

  mockBrowseRouteRelayData({
    loaderData: readyBrowseLoaderData({
      query: cursorDescriptor,
    }),
    productQueryRef: queryRef,
    productData: {
      ...buildProductFilterMetadataResponse(),
      products: {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      },
    },
  });

  render(
    <MemoryRouter initialEntries={["/products?after=stale-cursor"]}>
      <BrowseRoute />
    </MemoryRouter>,
  );

  expect(screen.getByText("No products available yet.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "First products" })).toHaveAttribute(
    "href",
    "/products?first=12",
  );
  expect(screen.queryByRole("link", { name: "Next products" })).not.toBeInTheDocument();
});

test("renders an unavailable-state message when the preload path fails", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
  });

  render(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Catalog unavailable.");
  expect(screen.getByText("Please refresh the page or try again later.")).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});
