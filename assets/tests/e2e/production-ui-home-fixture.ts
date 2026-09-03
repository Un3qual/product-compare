import { expect, type Page, type Route } from "@playwright/test";

type GraphQLPayload = {
  query?: string;
  variables?: Record<string, unknown>;
};

type GraphQLRequest = {
  operationName: string;
  variables: Record<string, unknown>;
};

type GraphQLResponse = {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
};

type GraphQLResponder =
  | GraphQLResponse
  | ((request: GraphQLRequest) => GraphQLResponse | Promise<GraphQLResponse>);

type GraphQLStubState = {
  requests: GraphQLRequest[];
  unhandledOperations: string[];
};

type GraphQLResponders = Map<string, GraphQLResponder>;

const graphqlStubStates = new WeakMap<Page, GraphQLStubState>();

export const VIEWPORTS = [
  { height: 1_000, name: "desktop", width: 1_440 },
  { height: 1_100, name: "tablet", width: 900 },
  { height: 844, name: "mobile", width: 390 },
] as const;

export type HomeViewportName = (typeof VIEWPORTS)[number]["name"];

export const products = [
  homeProduct(
    "product-1",
    "BrewMaster Precision Kettle",
    "brewmaster-precision-kettle",
    [
      ["Capacity", "1.0 L"],
      ["Temperature range", "40–100 °C"],
      ["Warranty", "2 years"],
    ],
    "129.99",
    "Kitchen Supply",
  ),
  homeProduct(
    "product-2",
    "Northstar Barista Scale",
    "northstar-barista-scale",
    [
      ["Capacity", "2,000 g"],
      ["Precision", "0.1 g"],
      ["Timer", "Built in"],
    ],
    "79.00",
    "Coffee Tools",
  ),
  homeProduct(
    "product-3",
    "Arc One Hand Grinder",
    "arc-one-hand-grinder",
    [
      ["Burr", "Stainless steel"],
      ["Settings", "48 steps"],
      ["Weight", "610 g"],
    ],
    "149.50",
    "Brew Market",
  ),
  homeProduct(
    "product-4",
    "Field Notes Travel Brewer",
    "field-notes-travel-brewer",
    [
      ["Capacity", "350 ml"],
      ["Material", "Steel"],
      ["Weight", "420 g"],
    ],
    "64.25",
    "Outdoor Coffee",
  ),
  homeProduct(
    "product-5",
    "Studio Flat-Bottom Dripper",
    "studio-flat-bottom-dripper",
    [
      ["Size", "2–4 cups"],
      ["Material", "Porcelain"],
      ["Filters", "155 series"],
    ],
    "42.00",
    "Kitchen Supply",
  ),
  homeProduct(
    "product-6",
    "Common Ground Storage Canister",
    "common-ground-canister",
    [
      ["Capacity", "500 g"],
      ["Seal", "Vacuum"],
      ["Material", "Steel"],
    ],
    "38.75",
    "Coffee Tools",
  ),
];

const categories = [
  {
    description: "Temperature-controlled and stovetop kettles for repeatable brewing.",
    id: "category-kettles",
    name: "Kettles",
    qualifiedProductCount: 18,
    slug: "kettles",
  },
  {
    description: "Hand and electric grinders organized by burr, range, and capacity.",
    id: "category-grinders",
    name: "Coffee grinders",
    qualifiedProductCount: 26,
    slug: "coffee-grinders",
  },
  {
    description: "Scales, brewers, and storage tools for a complete setup.",
    id: "category-brewing-tools",
    name: "Brewing tools",
    qualifiedProductCount: 34,
    slug: "brewing-tools",
  },
];

type HomeDealFixture = ReturnType<typeof homeDeal>;
type HomeDealsFixture = {
  forYou: ReturnType<typeof edgeConnection<HomeDealFixture>>;
  new: ReturnType<typeof edgeConnection<HomeDealFixture>>;
  trending: ReturnType<typeof edgeConnection<HomeDealFixture>>;
};

export const publicDeals: HomeDealsFixture = {
  forYou: edgeConnection([]),
  new: edgeConnection([
    homeDeal(products[0], "Kitchen Supply", "129.99", "NEW_OFFER"),
    homeDeal(products[3], "Outdoor Coffee", "64.25", "NEW_OFFER"),
  ]),
  trending: edgeConnection([
    homeDeal(products[1], "Coffee Tools", "79.00", "TRENDING_BELOW_MEDIAN"),
  ]),
};

export function expectNoUnhandledGraphQLOperations(page: Page) {
  const unhandledOperations = graphqlStubStates.get(page)?.unhandledOperations ?? [];

  expect(
    unhandledOperations,
    `Unhandled GraphQL operations: ${unhandledOperations.join(", ")}`,
  ).toEqual([]);
}

export async function stubGraphQL(page: Page, responders: GraphQLResponders) {
  const state: GraphQLStubState = { requests: [], unhandledOperations: [] };
  graphqlStubStates.set(page, state);

  await page.route("**/api/graphql", async (route) => {
    const payload = route.request().postDataJSON() as GraphQLPayload;
    const request = {
      operationName: extractOperationName(payload.query ?? ""),
      variables: payload.variables ?? {},
    };
    state.requests.push(request);

    const response = await resolveGraphQLResponse(responders, request);

    if (!response) {
      state.unhandledOperations.push(request.operationName);
      await fulfillGraphQL(route, {
        errors: [{ message: `Unhandled GraphQL operation: ${request.operationName}` }],
      });
      return;
    }

    await fulfillGraphQL(route, response);
  });

  return state.requests;
}

export async function resolveGraphQLResponse(
  responders: GraphQLResponders,
  request: GraphQLRequest,
) {
  const responder = responders.get(request.operationName);
  return typeof responder === "function" ? await responder(request) : responder;
}

export function homeResponders({
  deals = publicDeals,
  viewer = null,
}: {
  deals?: HomeDealsFixture;
  viewer?: ReturnType<typeof memberViewer> | null;
} = {}): GraphQLResponders {
  return new Map<string, GraphQLResponder>([
    ["BrowseRouteQuery", { data: emptyBrowseData() }],
    ["CompareProductPickerBoundaryQuery", { data: emptyProductPickerData() }],
    [
      "CompareRouteQuery",
      ({ variables }) => ({
        data: {
          comparisonProducts: selectedProducts(variables.slugs).map(compareProduct),
        },
      }),
    ],
    ["HomeDealsQuery", { data: { homeDeals: deals } }],
    [
      "HomeRouteQuery",
      ({ variables }) => ({
        data: {
          homeWorkspace: {
            categories: nodeConnection(categories),
            products: edgeConnection(
              products.map(({ highlights, id, name, offer, slug }) => ({
                highlights,
                node: { id: `${id}-summary`, name, slug },
                offer,
              })),
            ),
            selectedProducts: selectedProducts(variables.selectedSlugs).map(
              ({ id, name, slug }) => ({
                id: `${id}-summary`,
                name,
                slug,
              }),
            ),
          },
        },
      }),
    ],
    ["RootRouteQuery", { data: { viewer } }],
  ]);
}

export function homeDeal(
  product: (typeof products)[number],
  merchantName: string,
  landedPrice: string,
  code: string,
  reason: { watchTarget?: string } = {},
) {
  return {
    offer: {
      currency: "USD",
      landedPrice,
      merchantName,
      observedAt: "2026-08-10T12:00:00Z",
    },
    node: { id: `${product.id}-summary`, name: product.name, slug: product.slug },
    reasons: [{ code, watchTarget: reason.watchTarget ?? null }],
  };
}

export function edgeConnection<T extends object>(edges: readonly T[]) {
  return {
    edges: edges.map((edge, index) => ({ cursor: `cursor-${index + 1}`, ...edge })),
    pageInfo: {
      endCursor: edges.length > 0 ? `cursor-${edges.length}` : null,
      hasNextPage: false,
    },
  };
}

export function memberViewer(id: string) {
  return { email: `${id}@example.test`, id, isOperator: false };
}

async function fulfillGraphQL(route: Route, response: GraphQLResponse) {
  await route.fulfill({
    body: JSON.stringify(response),
    contentType: "application/json",
    status: 200,
  });
}

function extractOperationName(query: string) {
  return query.match(/\b(?:mutation|query)\s+([A-Za-z0-9_]+)/)?.[1] ?? "UnknownOperation";
}

function selectedProducts(value: unknown) {
  const slugs = Array.isArray(value)
    ? value.filter((slug): slug is string => typeof slug === "string")
    : [];
  return slugs.flatMap((slug) => products.filter((product) => product.slug === slug));
}

function homeProduct(
  id: string,
  name: string,
  slug: string,
  highlights: Array<[string, string]>,
  landedPrice: string,
  merchantName: string,
) {
  return {
    highlights: highlights.map(([label, value]) => ({ label, value })),
    id,
    name,
    offer: {
      activeOfferCount: 3,
      currency: "USD",
      landedPrice,
      merchantName,
      merchantProductId: `${id}-offer`,
      observedAt: "2026-08-10T12:00:00Z",
      priceSignal: "BELOW_30_DAY_MEDIAN",
    },
    slug,
  };
}

function nodeConnection<T>(nodes: readonly T[]) {
  return {
    edges: nodes.map((node, index) => ({ cursor: `cursor-${index + 1}`, node })),
    pageInfo: {
      endCursor: nodes.length > 0 ? `cursor-${nodes.length}` : null,
      hasNextPage: false,
    },
  };
}

function compareProduct(product: (typeof products)[number]) {
  return {
    brand: { id: `${product.id}-brand`, name: "Northline Workshop" },
    currentAttributes: product.highlights.map((highlight, index) => ({
      attributeId: `${product.id}-attribute-${index + 1}`,
      booleanValue: null,
      code: `attribute_${index + 1}`,
      dataType: "TEXT",
      displayName: highlight.label,
      enumOptionId: null,
      groupLabel: "Key details",
      isRequired: index === 0,
      numericValue: null,
      sortOrder: index + 1,
      unitSymbol: null,
      valueText: highlight.value,
    })),
    description: `${product.name} comparison details.`,
    id: `${product.id}-compare`,
    offerTruth: {
      asOf: product.offer.observedAt,
    },
    merchantProducts: {
      edges: [
        {
          node: {
            activeCoupons: { edges: [], pageInfo: { hasNextPage: false } },
            currency: "USD",
            id: product.offer.merchantProductId,
            latestPrice: {
              id: `${product.id}-price`,
              observedAt: product.offer.observedAt,
              price: product.offer.landedPrice,
            },
            merchant: {
              domain: "example.test",
              id: `${product.id}-merchant`,
              name: product.offer.merchantName,
            },
            priceHistory: { edges: [], pageInfo: { hasNextPage: false } },
          },
        },
      ],
      pageInfo: { endCursor: null, hasNextPage: false },
    },
    name: product.name,
    slug: product.slug,
  };
}

function emptyBrowseData() {
  return {
    productFilterMetadata: {
      booleanFilters: [],
      enumFilters: [],
      numericFilters: [],
      resultCount: 0,
      typeOptions: [],
      useCaseOptions: [],
    },
    products: {
      edges: [],
      pageInfo: { endCursor: null, hasNextPage: false },
    },
  };
}

export function browseDataWithTargetControls() {
  const data = emptyBrowseData();

  return {
    ...data,
    productFilterMetadata: {
      ...data.productFilterMetadata,
      enumFilters: [
        {
          attributeId: "attribute-finish",
          code: "finish",
          displayName: "Finish",
          options: [
            {
              count: 2,
              disabled: false,
              id: "finish-matte",
              label: "Matte",
              selected: false,
            },
          ],
        },
      ],
    },
  };
}

function emptyProductPickerData() {
  return {
    products: {
      edges: [],
      pageInfo: { endCursor: null, hasNextPage: false },
    },
  };
}
