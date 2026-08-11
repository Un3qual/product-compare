import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  edgeConnection,
  expectNoUnhandledGraphQLOperations,
  homeDeal,
  homeResponders,
  memberViewer,
  products,
  publicDeals,
  resolveGraphQLResponse,
  stubGraphQL,
  VIEWPORTS,
} from "./production-ui-home-fixture";
import {
  expectMobileNavigation,
  expectVisibleFocus,
  focusByTab,
  plainLanguageViolations,
  waitForFonts,
} from "./production-ui-home-interactions";
import {
  expectDesktopLedgerGeometry,
  expectDisclosureTargets,
  expectHomeVisualSystem,
  expectMobileLedgerDisclosure,
  expectTabletLedgerGeometry,
} from "./production-ui-home-visual";

test.afterEach(async ({ page }) => {
  await expectNoUnhandledGraphQLOperations(page);
});

test("guest search and category entry preserve useful catalog navigation", async ({ page }) => {
  const responders = homeResponders();
  await test.step("GraphQL dispatch rejects inherited object operation names", async () => {
    const inheritedOperationResponses = await Promise.all(
      ["constructor", "toString"].map((operationName) =>
        resolveGraphQLResponse(responders, { operationName, variables: {} }),
      ),
    );

    expect(inheritedOperationResponses).toEqual([undefined, undefined]);
  });
  const requests = await stubGraphQL(page, responders);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find the right product" })).toBeVisible();

  const search = page.getByLabel("Search products, brands, or model numbers");
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
    operationName: "BrowseRouteQuery",
    variables: {
      after: null,
      filters: { query: "precision kettle", sort: "RELEVANCE" },
      first: 12,
    },
  });

  await page.goBack();
  await expect(page.getByRole("heading", { name: "Find the right product" })).toBeVisible();
  const categoryLink = page.getByRole("link", { name: "Coffee grinders" });
  expect((await categoryLink.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  await focusByTab(page, categoryLink);
  await expectVisibleFocus(categoryLink);
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/products\?/);
  await expect(page.getByRole("heading", { name: "Browse products" })).toBeVisible();
  const categoryUrl = new URL(page.url());
  expect(categoryUrl.searchParams.get("typeTaxonId")).toBe("category-grinders");
  expect(categoryUrl.searchParams.get("includeTypeDescendants")).toBe("1");
  expect(requests).toContainEqual({
    operationName: "BrowseRouteQuery",
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
    forYou: edgeConnection([homeDeal(products[3], "Outdoor Coffee", "64.25", "NEW_OFFER")]),
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
    forYou: edgeConnection([
      homeDeal(products[0], "Kitchen Supply", "129.99", "WATCH_TARGET", {
        watchTarget: "135.00",
      }),
    ]),
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
  responders.set("HomeDealsQuery", () => {
    dealsAttempts += 1;
    return dealsAttempts === 1
      ? { errors: [{ message: "temporary deal read failure" }] }
      : { data: { homeDeals: publicDeals } };
  });
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
  const search = page.getByLabel("Search products, brands, or model numbers");
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
    const dealTargetHeights = await page
      .locator('[data-slot="home-deals-link"]')
      .evaluateAll((links) => links.map((link) => link.getBoundingClientRect().height));
    expect(dealTargetHeights.length).toBeGreaterThan(0);
    for (const height of dealTargetHeights) expect(height).toBeGreaterThanOrEqual(44);

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    expect(await page.evaluate(() => window.innerWidth)).toBe(viewport.width);
    expect(await plainLanguageViolations(page)).toEqual([]);
    await expectHomeVisualSystem(page, viewport.name);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);

    if (viewport.name === "desktop") {
      await expect(page.getByRole("button", { name: "More details" })).toHaveCount(0);
      await expectDesktopLedgerGeometry(page);
    } else if (viewport.name === "tablet") {
      await expect(page.getByRole("button", { name: "More details" })).toHaveCount(0);
      await expectTabletLedgerGeometry(page);
    } else {
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
