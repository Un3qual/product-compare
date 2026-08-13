import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const VIEWPORTS = [
  { height: 1_000, name: "desktop", width: 1_440 },
  { height: 1_100, name: "tablet", width: 900 },
  { height: 844, name: "mobile", width: 390 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`${viewport.name} dynamic product metadata remains singular and the page does not overflow`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: viewport.height, width: viewport.width });
    await stubGraphQL(page);
    await page.goto("/products/field-camera");

    await expect(page.getByRole("heading", { name: "Field Camera" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Specifications" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tab", { name: "Overview" })).toHaveCount(0);
    await expect(page.getByText("199.99 USD", { exact: true })).toBeVisible();
    await expect(page.getByText("Field Camera", { exact: true })).toHaveCount(1);
    await expect(page.getByText("field-camera", { exact: true })).toHaveCount(0);

    const freshness = page.getByText("Observed 1 day ago", { exact: true });
    await expect(freshness).toHaveAttribute("title", "Aug 11, 2026, 5:00 PM UTC");
    await freshness.hover();
    await expect(page.getByRole("tooltip")).toHaveText("Aug 11, 2026, 5:00 PM UTC");

    await page.getByRole("checkbox", { name: "Select Sensor width" }).click();
    const filterDrawer = page.getByRole("dialog", { name: "Filter by selected specs" });
    await expect(filterDrawer).toBeVisible();
    await expect(filterDrawer.getByText("1 spec selected")).toBeVisible();
    await filterDrawer.getByRole("radio", { name: "At least" }).click();
    await filterDrawer.getByRole("button", { name: "Keep browsing specs" }).click();

    await page.getByRole("checkbox", { name: "Select Weather sealed" }).click();
    await expect(filterDrawer.getByText("2 specs selected")).toBeVisible();
    const matchingProductsHref =
      (await filterDrawer
        .getByRole("link", { name: "Show matching products" })
        .getAttribute("href")) ?? "";
    const matchingProductsUrl = new URL(matchingProductsHref, page.url());
    expect(matchingProductsUrl.pathname).toBe("/products");
    expect(matchingProductsUrl.searchParams.get("numeric.attribute-sensor-width.min")).toBe("36");
    expect(matchingProductsUrl.searchParams.get("boolean.attribute-weather-sealed")).toBe("true");
    await filterDrawer.getByRole("button", { name: "Keep browsing specs" }).click();

    await page.getByRole("tab", { name: "Offers" }).click();
    await expect(page.getByRole("heading", { name: "Price trend" })).toBeVisible();
    await expect(page.getByLabel("Lowest USD price trend chart")).toBeVisible();
    await page.getByRole("button", { name: "Average" }).click();
    await expect(page.getByLabel("Average USD price trend chart")).toBeVisible();
    await page.getByRole("button", { name: "By merchant" }).click();
    await expect(page.getByLabel("Merchant USD price trend chart")).toBeVisible();
    await expect(page.getByRole("list", { name: "Price trend legend" })).toContainText(
      "Camera Shop",
    );
    await expect(page.getByRole("list", { name: "Price trend legend" })).toContainText(
      "Outdoor Supply",
    );
    await expect(page).toHaveTitle("Field Camera specifications and prices | Product Compare");
    const canonicalUrl = `${new URL(page.url()).origin}/products/field-camera`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonicalUrl);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index,follow");

    const jsonLd = page.locator('script[type="application/ld+json"]');

    await expect(jsonLd).toHaveCount(1);
    expect(JSON.parse((await jsonLd.textContent()) ?? "")).toEqual({
      "@context": "https://schema.org",
      "@type": "Product",
      name: 'Field Camera </script><script>alert("metadata injection")</script>',
      url: canonicalUrl,
    });
    expect(
      await page
        .locator("script")
        .evaluateAll(
          (scripts) =>
            scripts.filter(
              (script) =>
                script.type !== "application/ld+json" &&
                script.textContent?.includes("metadata injection"),
            ).length,
        ),
    ).toBe(0);
    const overflowDiagnostics = await page.locator("body *").evaluateAll((elements) =>
      elements.flatMap((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.right > window.innerWidth + 1
          ? [
              {
                className: element.className,
                right: Math.round(bounds.right),
                slot: element.getAttribute("data-slot"),
                tagName: element.tagName,
                width: Math.round(bounds.width),
              },
            ]
          : [];
      }),
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      JSON.stringify(overflowDiagnostics.slice(0, 8)),
    ).toBeLessThanOrEqual(viewport.width);

    await page.evaluate(() => window.scrollTo({ left: 0, top: 0 }));
    await page.screenshot({
      path: testInfo.outputPath(`${viewport.name}-product.png`),
    });

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

test("auth navigation replaces noindex metadata instead of duplicating it", async ({ page }) => {
  await stubGraphQL(page);
  await page.goto("/auth/login");

  await expect(page).toHaveTitle("Sign in | Product Compare");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  await page.getByRole("link", { name: "Create account" }).click();
  await expect(page).toHaveTitle("Create account | Product Compare");
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
});

test("operator route remains reachable through the split registry", async ({ page }) => {
  await stubGraphQL(page, {
    email: "operator@example.com",
    id: "operator-1",
    isOperator: true,
  });
  await page.goto("/affiliate/setup");

  await expect(page.getByRole("heading", { name: "Affiliate setup" })).toBeVisible();
  await expect(page).toHaveTitle("Affiliate setup | Product Compare");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
});

type Viewer = {
  email: string;
  id: string;
  isOperator: boolean;
};

async function stubGraphQL(page: Page, viewer: Viewer | null = null) {
  await page.route("**/api/graphql", async (route) => {
    const body = route.request().postDataJSON() as { query?: string };
    const operationName = body.query?.match(/\bquery\s+([A-Za-z0-9_]+)/)?.[1];

    const data =
      operationName === "RootRouteQuery"
        ? { viewer }
        : operationName === "ProductDetailRouteQuery"
          ? { product: productFixture() }
          : operationName === "AffiliateSetupRouteQuery"
            ? { merchants: emptyConnection() }
            : null;

    await route.fulfill({
      contentType: "application/json",
      status: data ? 200 : 500,
      body: JSON.stringify(data ? { data } : { errors: [{ message: "Unhandled operation" }] }),
    });
  });
}

function productFixture() {
  return {
    id: "product-field-camera",
    name: "Field Camera",
    slug: "field-camera",
    description: "A detailed field camera.",
    seo: {
      title: "Field Camera specifications and prices | Product Compare",
      description: "Compare accepted Field Camera specifications and current offers.",
      canonicalPath: "/products/field-camera",
      indexable: true,
      imageUrl: null,
      structuredData: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: 'Field Camera </script><script>alert("metadata injection")</script>',
        url: "/products/field-camera",
      }),
    },
    brand: { id: "brand-acme", name: "Acme" },
    modelNumber: "FC-36",
    currentAttributes: [
      {
        attributeId: "attribute-sensor-width",
        code: "sensor_width",
        displayName: "Sensor width",
        dataType: "numeric",
        valueText: "36 mm",
        sortOrder: 1,
        groupLabel: "Imaging",
        isRequired: true,
        numericValue: "36",
        booleanValue: null,
        enumOptionId: null,
        unitSymbol: "mm",
      },
      {
        attributeId: "attribute-weather-sealed",
        code: "weather_sealed",
        displayName: "Weather sealed",
        dataType: "bool",
        valueText: "Yes",
        sortOrder: 2,
        groupLabel: "Build",
        isRequired: true,
        numericValue: null,
        booleanValue: true,
        enumOptionId: null,
        unitSymbol: null,
      },
      {
        attributeId: "attribute-mount",
        code: "mount",
        displayName: "Lens mount",
        dataType: "enum",
        valueText: "X mount",
        sortOrder: 3,
        groupLabel: "Imaging",
        isRequired: false,
        numericValue: null,
        booleanValue: null,
        enumOptionId: "enum-x-mount",
        unitSymbol: null,
      },
    ],
    offerTruth: {
      asOf: "2026-08-12T17:00:00Z",
      offerCount: 2,
      observedOfferCount: 2,
      eligibleOfferCount: 2,
      currencySummaries: [
        {
          currency: "USD",
          eligibleOfferCount: 2,
          bestOffer: {
            merchantProductId: "merchant-product-camera-shop",
            landedPrice: "199.99",
            observedAt: "2026-08-11T17:00:00Z",
            freshness: "FRESH",
            eligible: true,
          },
        },
      ],
    },
    priceHistory90d: [
      {
        currency: "USD",
        merchants: [
          {
            id: "merchant-camera-shop",
            name: "Camera Shop",
            merchantProductId: "merchant-product-camera-shop",
          },
          {
            id: "merchant-outdoor-supply",
            name: "Outdoor Supply",
            merchantProductId: "merchant-product-outdoor-supply",
          },
        ],
        points: [
          {
            observedAt: "2026-08-10T17:00:00Z",
            lowestPrice: "209.99",
            averagePrice: "214.99",
            lowestMerchantProductId: "merchant-product-camera-shop",
            merchantPrices: [
              { merchantProductId: "merchant-product-camera-shop", price: "209.99" },
              { merchantProductId: "merchant-product-outdoor-supply", price: "219.99" },
            ],
          },
          {
            observedAt: "2026-08-11T17:00:00Z",
            lowestPrice: "199.99",
            averagePrice: "207.49",
            lowestMerchantProductId: "merchant-product-camera-shop",
            merchantPrices: [
              { merchantProductId: "merchant-product-camera-shop", price: "199.99" },
              { merchantProductId: "merchant-product-outdoor-supply", price: "214.99" },
            ],
          },
        ],
      },
    ],
    merchantProducts: emptyConnection(),
  };
}

function emptyConnection() {
  return {
    edges: [],
    pageInfo: {
      endCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
    },
  };
}
