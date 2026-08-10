import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";

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

const graphqlStubStates = new WeakMap<Page, GraphQLStubState>();

test.afterEach(async ({ page }) => {
  const unhandledOperations = graphqlStubStates.get(page)?.unhandledOperations ?? [];

  expect(
    unhandledOperations,
    `Unhandled GraphQL operations: ${unhandledOperations.join(", ")}`,
  ).toEqual([]);
});

const VIEWPORTS = [
  { height: 1_000, name: "desktop", width: 1_440 },
  { height: 1_100, name: "tablet", width: 900 },
  { height: 844, name: "mobile", width: 390 },
] as const;

const products = [
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

const publicDeals = {
  forYou: [],
  new: [
    homeDeal(products[0], "Kitchen Supply", "129.99", "NEW_OFFER"),
    homeDeal(products[3], "Outdoor Coffee", "64.25", "NEW_OFFER"),
  ],
  trending: [homeDeal(products[1], "Coffee Tools", "79.00", "TRENDING_BELOW_MEDIAN")],
};

test("guest search and category entry preserve useful catalog navigation", async ({ page }) => {
  const requests = await stubGraphQL(page, homeResponders());

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find the right product" })).toBeVisible();

  const search = page.getByLabel("Search products, categories, or model numbers");
  const searchButton = page.getByRole("button", { name: "Search catalog" });
  await focusByTab(page, searchButton);
  await expectVisibleFocus(searchButton);
  await focusByTab(page, search, { key: "Shift+Tab", maxPresses: 2 });
  await expectVisibleFocus(search);
  await page.keyboard.type("  precision kettle  ");
  await focusByTab(page, searchButton, { maxPresses: 2 });
  await expectVisibleFocus(searchButton);
  await page.keyboard.press("Space");

  await expect(page).toHaveURL(/\/products\?/);
  await expect(page.getByRole("heading", { name: "Browse products" })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("q")).toBe("precision kettle");
  expect(requests).toContainEqual({
    operationName: "BrowseProductsRouteQuery",
    variables: {
      after: null,
      filters: { query: "precision kettle", sort: "RELEVANCE" },
      first: 12,
    },
  });

  await page.goto("/");
  const categoryLink = page.getByRole("link", { name: "Coffee grinders" });
  await focusByTab(page, categoryLink);
  await expectVisibleFocus(categoryLink);
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/products\?/);
  await expect(page.getByRole("heading", { name: "Browse products" })).toBeVisible();
  const categoryUrl = new URL(page.url());
  expect(categoryUrl.searchParams.get("typeTaxonId")).toBe("category-grinders");
  expect(categoryUrl.searchParams.get("includeTypeDescendants")).toBe("1");
  expect(requests).toContainEqual({
    operationName: "BrowseProductsRouteQuery",
    variables: {
      after: null,
      filters: {
        includeTypeDescendants: true,
        primaryTypeTaxonId: "category-grinders",
      },
      first: 12,
    },
  });
});

test("guest comparison selection can be added, opened, and removed", async ({ page }) => {
  await stubGraphQL(page, homeResponders());

  await page.goto("/");
  const firstProduct = page.getByRole("article", { name: "BrewMaster Precision Kettle" });
  const addToComparison = firstProduct.getByRole("link", { name: "Add to comparison" });
  await focusByTab(page, addToComparison);
  await expectVisibleFocus(addToComparison);
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\?slug=brewmaster-precision-kettle$/);
  const selection = page.getByRole("region", { name: "Comparison selection" });
  await expect(selection).toContainText("1. BrewMaster Precision Kettle");

  const openComparison = selection.getByRole("link", { name: "Open comparison" });
  await focusByTab(page, openComparison);
  await expectVisibleFocus(openComparison);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/compare\?slug=brewmaster-precision-kettle$/);
  await expect(page.getByRole("heading", { name: "Compare products" })).toBeVisible();

  const removeFromComparison = page.getByRole("link", {
    name: "Remove BrewMaster Precision Kettle from selection",
  });
  await focusByTab(page, removeFromComparison);
  await expectVisibleFocus(removeFromComparison);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/compare$/);
  await expect(page.getByText("No products are available to compare yet.")).toBeVisible();
});

test("signed-in viewers receive a public For you fallback without a private match", async ({
  page,
}) => {
  const fallbackDeals = {
    ...publicDeals,
    forYou: [homeDeal(products[3], "Outdoor Coffee", "64.25", "NEW_OFFER")],
  };
  await stubGraphQL(
    page,
    homeResponders({ deals: fallbackDeals, viewer: memberViewer("member-fallback") }),
  );

  await page.goto("/");
  await page.getByRole("tab", { name: "For you" }).click();

  await expect(page.getByRole("tabpanel", { name: "For you" })).toContainText(
    "Field Notes Travel Brewer",
  );
  await expect(page.getByRole("tabpanel", { name: "For you" })).toContainText("New offer");
  await expect(page.getByText(/price watch/i)).toHaveCount(0);
});

test("signed-in viewers see explicit For you match reasons", async ({ page }) => {
  const matchedDeals = {
    ...publicDeals,
    forYou: [
      homeDeal(products[0], "Kitchen Supply", "129.99", "WATCH_TARGET", {
        watchTarget: "135.00",
      }),
    ],
  };
  await stubGraphQL(
    page,
    homeResponders({ deals: matchedDeals, viewer: memberViewer("member-matched") }),
  );

  await page.goto("/");
  await page.getByRole("tab", { name: "For you" }).click();

  await expect(page.getByRole("tabpanel", { name: "For you" })).toContainText(
    "Matches your $135.00 price watch",
  );
});

test("optional deals failure stays local and retry restores offers", async ({ page }) => {
  let dealsAttempts = 0;
  const responders = homeResponders();
  responders.HomeDealsRouteQuery = () => {
    dealsAttempts += 1;
    return dealsAttempts === 1
      ? { errors: [{ message: "temporary deal read failure" }] }
      : { data: { homeDeals: publicDeals } };
  };
  await stubGraphQL(page, responders);

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Products to compare" })).toBeVisible();
  await expect(page.getByText("New and trending offers are unavailable right now.")).toBeVisible();

  const retry = page.getByRole("button", { name: "Try again" });
  await focusByTab(page, retry);
  await expectVisibleFocus(retry);
  await page.keyboard.press("Space");

  await expect(page.getByRole("list", { name: "New offers" })).toContainText(
    "BrewMaster Precision Kettle",
  );
  expect(dealsAttempts).toBe(2);
});

test("keyboard navigation exposes focus and reduced motion keeps disclosure behavior", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await stubGraphQL(page, homeResponders());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find the right product" })).toBeVisible();

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await expectVisibleFocus(skipLink);
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find the right product" })).toBeVisible();
  const search = page.getByLabel("Search products, categories, or model numbers");
  await focusByTab(page, search);
  await page.keyboard.type("barista scale");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/products\?/);
  await expect(page.getByRole("heading", { name: "Browse products" })).toBeVisible();

  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/");
  const disclosure = page.getByRole("button", { name: "More details" }).first();
  await focusByTab(page, disclosure);
  await expectVisibleFocus(disclosure);
  await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("aria-expanded", "true");
  const disclosureContent = page.locator('[data-slot="collapsible-content"]').first();
  await expect(disclosureContent).toBeVisible();
  const reducedAnimationDuration = await disclosureContent.evaluate(
    (element) => getComputedStyle(element).animationDuration,
  );
  expect(Number.parseFloat(reducedAnimationDuration)).toBeLessThanOrEqual(0.00001);
});

for (const viewport of VIEWPORTS) {
  test(`${viewport.name} home workbench is accessible, stable, and visually intentional`, async ({
    page,
  }) => {
    await page.setViewportSize({ height: viewport.height, width: viewport.width });
    await stubGraphQL(page, homeResponders());
    await page.goto("/?slug=brewmaster-precision-kettle&slug=northstar-barista-scale");
    await waitForFonts(page);

    const productResults = page.getByRole("list", { name: "Product results" });
    await expect(productResults.getByRole("listitem")).toHaveCount(6);
    await expect(page.getByRole("region", { name: "Comparison selection" })).toContainText(
      "1. BrewMaster Precision Kettle",
    );
    await expect(page.getByRole("region", { name: "Comparison selection" })).toContainText(
      "2. Northstar Barista Scale",
    );
    await expect(page.getByRole("tab", { name: "For you" })).toHaveCount(0);
    await expect(page.getByRole("list", { name: "New offers" }).getByRole("listitem")).toHaveCount(
      2,
    );

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    expect(await page.evaluate(() => window.innerWidth)).toBe(viewport.width);
    expect(await plainLanguageViolations(page)).toEqual([]);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);

    if (viewport.name === "desktop") {
      await expect(page.getByRole("button", { name: "More details" })).toHaveCount(0);
      await expectDesktopLedgerGeometry(page);
    } else if (viewport.name === "tablet") {
      await expect(page.getByRole("button", { name: "More details" })).toHaveCount(0);
      await expectTabletLedgerGeometry(page);
    } else if (viewport.name === "mobile") {
      await expectDisclosureTargets(page);
      await expectMobileNavigation(page);
      await expectMobileLedgerDisclosure(page);
      for (const product of products) {
        await expect(page.getByRole("heading", { name: product.name })).toHaveCount(1);
      }
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page).toHaveScreenshot(`home-workbench-${viewport.name}.png`, {
      animations: "disabled",
      fullPage: true,
    });
  });
}

async function stubGraphQL(page: Page, responders: Record<string, GraphQLResponder>) {
  const state: GraphQLStubState = { requests: [], unhandledOperations: [] };
  graphqlStubStates.set(page, state);

  await page.route("**/api/graphql", async (route) => {
    const payload = route.request().postDataJSON() as GraphQLPayload;
    const request = {
      operationName: extractOperationName(payload.query ?? ""),
      variables: payload.variables ?? {},
    };
    state.requests.push(request);

    const responder = responders[request.operationName];

    if (!responder) {
      state.unhandledOperations.push(request.operationName);
      await fulfillGraphQL(route, {
        errors: [{ message: `Unhandled GraphQL operation: ${request.operationName}` }],
      });
      return;
    }

    const response = typeof responder === "function" ? await responder(request) : responder;
    await fulfillGraphQL(route, response);
  });

  return state.requests;
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

function homeResponders({
  deals = publicDeals,
  viewer = null,
}: {
  deals?: typeof publicDeals;
  viewer?: ReturnType<typeof memberViewer> | null;
} = {}): Record<string, GraphQLResponder> {
  return {
    BrowseProductsRouteQuery: { data: emptyBrowseData() },
    CompareProductPickerQuery: { data: emptyProductPickerData() },
    CompareRouteQuery: ({ variables }) => ({
      data: {
        comparisonProducts: selectedProducts(variables.slugs).map(compareProduct),
      },
    }),
    HomeDealsRouteQuery: { data: { homeDeals: deals } },
    HomeWorkspaceRouteQuery: ({ variables }) => ({
      data: {
        homeWorkspace: {
          categories,
          products,
          selectedProducts: selectedProducts(variables.selectedSlugs).map(({ id, name, slug }) => ({
            id: `${id}-summary`,
            name,
            slug,
          })),
        },
      },
    }),
    RootViewerRouteQuery: { data: { viewer } },
  };
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

function homeDeal(
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
    product: { id: `${product.id}-summary`, name: product.name, slug: product.slug },
    reasons: [{ code, watchTarget: reason.watchTarget ?? null }],
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

function memberViewer(id: string) {
  return { email: `${id}@example.test`, id, isOperator: false };
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

function emptyProductPickerData() {
  return {
    products: {
      edges: [],
      pageInfo: { endCursor: null, hasNextPage: false },
    },
  };
}

async function focusByTab(
  page: Page,
  target: ReturnType<Page["locator"]>,
  { key = "Tab", maxPresses = 40 }: { key?: "Shift+Tab" | "Tab"; maxPresses?: number } = {},
) {
  for (let index = 0; index < maxPresses; index += 1) {
    await page.keyboard.press(key);
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }

  throw new Error(
    `Keyboard traversal did not reach the target within ${maxPresses} ${key} presses`,
  );
}

async function expectVisibleFocus(target: ReturnType<Page["locator"]>) {
  await expect
    .poll(() =>
      target.evaluate((element) => {
        const candidates = [element, element.parentElement].filter(
          (candidate): candidate is Element => candidate !== null,
        );

        return candidates.some((candidate) => {
          const style = getComputedStyle(candidate);
          return (
            candidate.matches(":focus-visible") &&
            style.outlineStyle === "solid" &&
            Number.parseFloat(style.outlineWidth) >= 2
          );
        });
      }),
    )
    .toBe(true);
}

async function waitForFonts(page: Page) {
  expect(
    await page.evaluate(async () => {
      const [sansFaces, monoFaces] = await Promise.all([
        document.fonts.load('400 16px "Instrument Sans Variable"', "Product workbench"),
        document.fonts.load('400 16px "IBM Plex Mono"', "Product"),
      ]);
      await document.fonts.ready;

      return {
        bodyFamily: getComputedStyle(document.body).fontFamily,
        mono: monoFaces.length > 0,
        sans: sansFaces.length > 0,
      };
    }),
  ).toEqual({
    bodyFamily:
      '"Instrument Sans Variable", ui-sans-serif, system-ui, -apple-system, "system-ui", "Segoe UI", sans-serif',
    mono: true,
    sans: true,
  });
}

async function plainLanguageViolations(page: Page) {
  return page.locator("body").evaluate((body) => {
    const forbidden = [
      "current attributes",
      "dataloader",
      "ecto",
      "evidence",
      "graphql",
      "identity count",
      "merchant product",
      "persisted snapshot",
      "qualification",
      "recommendation profile",
      "relay",
      "resolver",
      "source artifact",
      "taxon",
    ];
    const visibleCopy = body.innerText.toLowerCase();
    return forbidden.filter((term) => visibleCopy.includes(term));
  });
}

async function expectDesktopLedgerGeometry(page: Page) {
  const headings = page.locator('[data-slot="home-ledger-headings"]');
  await expect(headings).toBeVisible();
  const geometry = await headings.evaluate((headingStrip) => {
    const headingXs = [...headingStrip.children].map(
      (heading) => heading.getBoundingClientRect().x,
    );
    const article = headingStrip.nextElementSibling?.querySelector("article");
    const rowXs = article
      ? [
          "product-ledger-identity",
          "product-ledger-highlights",
          "product-ledger-offer",
          "product-ledger-price-signal",
          "product-ledger-freshness",
          "product-ledger-actions",
        ].map(
          (slot) => article.querySelector(`[data-slot="${slot}"]`)?.getBoundingClientRect().x ?? -1,
        )
      : [];

    return { headingXs, rowXs };
  });

  expect(geometry.headingXs).toHaveLength(6);
  expect(geometry.rowXs).toHaveLength(6);
  geometry.headingXs.forEach((headingX, index) => {
    expect(Math.abs(headingX - (geometry.rowXs[index] ?? -1))).toBeLessThan(1);
  });
}

async function expectTabletLedgerGeometry(page: Page) {
  await expect(page.locator('[data-slot="home-ledger-headings"]')).toBeHidden();
  const article = page.getByRole("article", { name: products[0].name });
  const positions = await article.evaluate((element) => {
    const position = (slot: string) => {
      const box = element.querySelector(`[data-slot="${slot}"]`)?.getBoundingClientRect();
      return box ? { x: box.x, y: box.y } : null;
    };

    return {
      actions: position("product-ledger-actions"),
      freshness: position("product-ledger-freshness"),
      highlights: position("product-ledger-highlights"),
      identity: position("product-ledger-identity"),
      offer: position("product-ledger-offer"),
      signal: position("product-ledger-price-signal"),
    };
  });

  expect(positions.identity?.y).toBe(positions.highlights?.y);
  expect(positions.offer?.y).toBe(positions.signal?.y);
  expect(positions.freshness?.y).toBe(positions.actions?.y);
  expect(positions.identity?.x).toBe(positions.offer?.x);
  expect(positions.offer?.x).toBe(positions.freshness?.x);
  expect(positions.highlights?.x).toBe(positions.signal?.x);
  expect(positions.signal?.x).toBe(positions.actions?.x);

  const widths = await page.getByRole("list", { name: "Product results" }).evaluate((list) => {
    const workspace = list.closest('[aria-label="Product workspace"]');
    const articles = [...list.querySelectorAll("article")];
    const firstArticle = articles[0];
    const identity = firstArticle?.querySelector('[data-slot="product-ledger-identity"]');
    const highlights = firstArticle?.querySelector('[data-slot="product-ledger-highlights"]');
    const box = (element: Element | null | undefined) => element?.getBoundingClientRect();

    return {
      articleWidths: articles.map((element) => element.getBoundingClientRect().width),
      columns: firstArticle ? getComputedStyle(firstArticle).gridTemplateColumns : "",
      highlights: box(highlights),
      identity: box(identity),
      list: list.getBoundingClientRect(),
      workspace: box(workspace),
    };
  });

  expect(Math.abs(widths.list.width - (widths.workspace?.width ?? 0))).toBeLessThan(1);
  expect(widths.workspace?.width).toBeCloseTo(846, 0);
  expect(widths.list.width).toBeCloseTo(846, 0);
  expect(widths.columns.split(" ")).toHaveLength(2);
  for (const articleWidth of widths.articleWidths) {
    expect(Math.abs(articleWidth - widths.list.width)).toBeLessThan(1);
    expect(articleWidth).toBeCloseTo(846, 0);
  }
  const identityWidth = widths.identity?.width ?? 0;
  const highlightsWidth = widths.highlights?.width ?? 0;
  expect(identityWidth / widths.list.width).toBeGreaterThan(0.4);
  expect(highlightsWidth / widths.list.width).toBeGreaterThan(0.4);
  expect(identityWidth / widths.list.width).toBeLessThan(0.6);
  expect(highlightsWidth / widths.list.width).toBeLessThan(0.6);
  expect(identityWidth).toBeCloseTo(415, 0);
  expect(highlightsWidth).toBeCloseTo(415, 0);
  const columnGap = (widths.highlights?.x ?? 0) - ((widths.identity?.x ?? 0) + identityWidth);
  expect(columnGap).toBeGreaterThan(0);
  expect(Math.abs(identityWidth + highlightsWidth + columnGap - widths.list.width)).toBeLessThan(1);
}

async function expectMobileLedgerDisclosure(page: Page) {
  await expect(page.locator('[data-slot="home-ledger-headings"]')).toBeHidden();
  const article = page.getByRole("article", { name: products[0].name });

  await expect(article.locator('[data-slot="product-ledger-highlights"]')).toBeHidden();
  await expect(article.locator('[data-slot="product-ledger-price-signal"]')).toBeHidden();
  await expect(article.locator('[data-slot="product-ledger-freshness"]')).toBeHidden();
  await expect(article.locator('[data-slot="product-ledger-offer"]')).toBeVisible();
  await expect(article.locator('[data-slot="product-ledger-actions"]')).toBeVisible();

  const trigger = article.getByRole("button", { name: "More details" });
  await focusByTab(page, trigger);
  await expectVisibleFocus(trigger);
  await page.keyboard.press("Space");
  const disclosure = article.locator('[data-slot="collapsible-content"]');
  await expect(disclosure).toBeVisible();
  await expect(disclosure).toContainText(
    "Capacity: 1.0 L · Temperature range: 40–100 °C · Warranty: 2 years",
  );
  await expect(disclosure).toContainText("Below the 30-day price");
  await expect(disclosure).toContainText("Last checked Aug 10, 2026");
  await page.keyboard.press("Space");
  await expect(disclosure).toBeHidden();
  await trigger.evaluate((element) => element.blur());
}

async function expectDisclosureTargets(page: Page) {
  const disclosures = page.getByRole("button", { name: "More details" });
  await expect(disclosures).toHaveCount(6);
  const heights = await disclosures.evaluateAll((buttons) =>
    buttons.map((button) => button.getBoundingClientRect().height),
  );
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);
}

async function expectMobileNavigation(page: Page) {
  const primary = page.getByRole("navigation", { name: "Primary" });
  const search = primary.getByRole("link", { name: "Search products" });
  const compare = primary.getByRole("link", { name: "Compare products" });
  const explore = primary.getByRole("button", { name: "Explore menu" });
  const guest = primary.getByRole("button", { name: "Guest menu" });
  const boxes = await Promise.all(
    [search, compare, explore, guest].map((control) => control.boundingBox()),
  );

  for (const [index, box] of boxes.entries()) {
    expect(
      box?.height ?? 0,
      ["Search", "Compare", "Explore", "Guest"][index],
    ).toBeGreaterThanOrEqual(44);
  }
  expect(boxes[0]?.y).toBe(boxes[1]?.y);
  expect(boxes[2]?.y).toBe(boxes[3]?.y);
  expect(boxes[0]?.x).not.toBe(boxes[1]?.x);

  await focusByTab(page, explore);
  await expectVisibleFocus(explore);
  await page.keyboard.press("Space");
  const exploreNavigation = primary.getByRole("navigation", { name: "Explore navigation" });
  await expect(exploreNavigation.getByRole("link", { name: "Offers" })).toBeVisible();
  await expect(exploreNavigation.getByRole("link", { name: "Merchants" })).toBeVisible();
  await page.keyboard.press("Space");
}
