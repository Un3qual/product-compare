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
  }) => {
    await page.setViewportSize({ height: viewport.height, width: viewport.width });
    await stubGraphQL(page);
    await page.goto("/products/field-camera");

    await expect(page.getByRole("heading", { name: "Field Camera" })).toBeVisible();
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
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );

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
    currentAttributes: [],
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
