import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { expectNoUnhandledGraphQLOperations, stubGraphQL } from "./production-ui-home-fixture";
import { waitForFonts } from "./production-ui-home-interactions";
import { OFFER_PRODUCT_ID, offerResponders } from "./production-ui-offers-fixture";

const OFFER_VIEWPORTS = [
  { height: 1_000, name: "desktop", width: 1_440 },
  { height: 844, name: "mobile", width: 390 },
] as const;

test.afterEach(({ page }) => {
  expectNoUnhandledGraphQLOperations(page);
});

for (const viewport of OFFER_VIEWPORTS) {
  test(`${viewport.name} offers workspace is structured, complete, and accessible`, async ({
    page,
  }) => {
    await page.setViewportSize({ height: viewport.height, width: viewport.width });
    await stubGraphQL(page, offerResponders());
    await page.goto(`/offers?productId=${OFFER_PRODUCT_ID}`);
    await waitForFonts(page);

    const scope = page.getByRole("region", { name: "Active offer filters" });
    const overview = page.getByRole("region", { name: "Offer price overview" });
    const merchantFilters = page.getByRole("region", { name: "Merchant filters on this page" });
    const offers = page.getByRole("list", { name: "Offers" });

    await expect(scope.getByRole("heading", { name: "BrewMaster Precision Kettle" })).toBeVisible();
    await expect(scope).toContainText("BrewMaster");
    await expect(scope).toContainText(
      "Showing active offers, sorted by Default order, 6 per page.",
    );
    await expect(overview.getByRole("heading", { name: "Best visible price" })).toBeVisible();
    await expect(overview.locator('[data-slot="offer-overview-primary"]')).toHaveText("129.99 USD");
    await expect(overview).toContainText(
      "3 visible offers. 1 offer with coupons. 1 offer without a current price.",
    );
    await expect(
      merchantFilters.getByRole("heading", { name: "Merchants on this page" }),
    ).toBeVisible();
    await expect(offers.locator(':scope > [data-slot="data-list-item"]')).toHaveCount(3);
    await expect(page.getByRole("heading", { name: "Kitchen Supply" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Visit Kitchen Supply" })).toBeVisible();
    const priceColors = await page
      .locator('[data-slot="offer-card-price-value"]')
      .evaluateAll((prices) => prices.map((price) => getComputedStyle(price).color));
    expect(priceColors[1]).not.toBe(priceColors[0]);
    expect(priceColors[2]).not.toBe(priceColors[0]);

    const order = await page.evaluate(() => {
      const overview = document.querySelector('[data-slot="offer-price-overview"]');
      const filters = document.querySelector('[data-slot="offer-merchant-filters"]');
      const list = document.querySelector('ul[aria-label="Offers"]');

      return {
        filtersBeforeList: Boolean(
          filters?.compareDocumentPosition(list as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
        overviewBeforeFilters: Boolean(
          overview?.compareDocumentPosition(filters as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      };
    });

    expect(order).toEqual({ filtersBeforeList: true, overviewBeforeFilters: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);

    if (viewport.name === "mobile") {
      const refine = page.getByRole("button", { name: "Refine offers" });
      const refineBeforeList = await refine.evaluate((button) => {
        const list = document.querySelector('ul[aria-label="Offers"]');
        return Boolean(
          button.compareDocumentPosition(list as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
        );
      });

      expect(refineBeforeList).toBe(true);
      await refine.click();
      const dialog = page.getByRole("dialog", { name: "Refine offers" });
      await expect(dialog.getByRole("form", { name: "Offer discovery filters" })).toBeVisible();
      await expect(dialog.getByRole("spinbutton", { name: "Page size" })).toHaveValue("6");
      await expect(dialog.getByRole("combobox", { name: "Sort" })).toHaveAttribute(
        "value",
        "default",
      );
      const close = dialog.getByRole("button", { name: "Close" });
      await expect
        .poll(async () => {
          const closeBox = await close.boundingBox();
          return (closeBox?.height ?? 0) >= 44 && (closeBox?.width ?? 0) >= 44;
        })
        .toBe(true);
      await close.click();
      await expect(refine).toBeFocused();
    }

    const offerCard = page.locator('[data-slot="offer-card"]').first();
    const detailsTrigger = offerCard.getByRole("button", {
      name: "Offer details for Kitchen Supply",
    });

    await expect(offerCard.getByText("BREW15")).toHaveCount(0);
    expect((await detailsTrigger.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

    if (viewport.name === "desktop") {
      const geometry = await offerCard.evaluate((element) => {
        const box = (slot: string) =>
          element.querySelector(`[data-slot="${slot}"]`)?.getBoundingClientRect() ?? null;

        return {
          action: box("offer-card-action"),
          freshness: box("offer-card-freshness"),
          price: box("offer-card-price"),
        };
      });

      expect(
        Math.abs((geometry.price?.bottom ?? 0) - (geometry.freshness?.bottom ?? 0)),
      ).toBeLessThan(2);
      expect(Math.abs((geometry.price?.bottom ?? 0) - (geometry.action?.bottom ?? 0))).toBeLessThan(
        2,
      );
    }

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);

    await expect(page).toHaveScreenshot(`offers-workspace-${viewport.name}.png`, {
      animations: "disabled",
      fullPage: true,
    });

    await detailsTrigger.click();
    await expect(offerCard.getByRole("heading", { name: "Price history" })).toBeVisible();
    await expect(offerCard.getByText("134.99 USD")).toBeVisible();
    await expect(offerCard.getByText("More price history available.")).toBeVisible();
    await expect(offerCard.getByRole("heading", { name: "Coupons" })).toBeVisible();
    await expect(offerCard.getByText("BREW15")).toBeVisible();
    await expect(offerCard.getByText("Save 15% on countertop appliances.")).toBeVisible();
    await expect(offerCard.getByText("15%", { exact: true })).toBeVisible();
    await expect(offerCard.getByText("Online orders only; exclusions may apply.")).toBeVisible();

    if (viewport.name === "mobile") {
      await page.getByRole("button", { name: "Refine offers" }).click();
      const dialog = page.getByRole("dialog", { name: "Refine offers" });
      await dialog.getByRole("button", { name: "Advanced filters" }).click();
      await expect(dialog.getByRole("textbox", { name: "Product ID" })).toHaveValue(
        OFFER_PRODUCT_ID,
      );
      await expect(dialog.getByRole("textbox", { name: "Merchant ID" })).toHaveValue("");
    } else {
      await page.getByRole("button", { name: "Advanced filters" }).click();
      await expect(page.getByRole("textbox", { name: "Product ID" })).toHaveValue(OFFER_PRODUCT_ID);
      await expect(page.getByRole("textbox", { name: "Merchant ID" })).toHaveValue("");
    }
  });
}
